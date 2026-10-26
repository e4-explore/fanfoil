-- =============================================================================
-- Vaulted editions: a vaulted collectible is now a card TYPE (player, year,
-- set, card number, grader, grade) with total_supply = how many physical
-- copies of it are in the vault. Claims are numbered in order ("#2 of 50"),
-- exactly like Fanfoil Originals.
--
-- Each physical copy is a row in vault_items with its own cert number and
-- photos. Every claim of a vaulted type is assigned one specific copy, so a
-- claim (and later its token) is still a 1-to-1 receipt for one real card.
-- Rule: a vaulted type's total_supply = its number of vault_items.
-- =============================================================================

create table public.vault_items (
  id               uuid primary key default gen_random_uuid(),
  collectible_id   uuid not null references public.collectibles (id),
  cert_number      text not null unique,      -- grader certificate id
  photo_front_url  text,                      -- unedited photo of this slab
  photo_back_url   text,
  vault_status     text not null default 'in_vault'
                   check (vault_status in ('in_vault', 'redemption_requested', 'shipped')),
  is_sample        boolean not null default false,
  claim_id         uuid unique,               -- the claim this copy belongs to (set at claim time)
  created_at       timestamptz not null default now()
);
create index vault_items_unclaimed_idx on public.vault_items (collectible_id) where claim_id is null;

alter table public.user_collectibles
  add column vault_item_id uuid unique references public.vault_items (id);
alter table public.vault_items
  add constraint vault_items_claim_fk foreign key (claim_id) references public.user_collectibles (id);

-- Owners can see their own copy (cert, status, photos). Nobody else can.
alter table public.vault_items enable row level security;
create policy "own vault items" on public.vault_items for select to authenticated
  using (exists (
    select 1 from public.user_collectibles uc
    where uc.id = vault_items.claim_id and uc.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Move existing per-card data (one cert per collectible) into vault_items,
-- and link claims already made. On a fresh database this moves nothing.
-- ---------------------------------------------------------------------------
insert into public.vault_items (collectible_id, cert_number, photo_front_url, photo_back_url, vault_status, is_sample)
select id, cert_number, photo_front_url, photo_back_url, coalesce(vault_status, 'in_vault'), is_sample
from public.collectibles
where cert_number is not null;

update public.vault_items vi
   set claim_id = uc.id
  from public.user_collectibles uc
 where uc.collectible_id = vi.collectible_id;

update public.user_collectibles uc
   set vault_item_id = vi.id
  from public.vault_items vi
 where vi.claim_id = uc.id;

-- The type keeps a representative photo for browsing; certs and status now
-- live on each copy.
drop view public.collectible_inventory;
alter table public.collectibles drop constraint collectibles_vaulted_single;
alter table public.collectibles drop column cert_number, drop column vault_status, drop column photo_back_url;

create view public.collectible_inventory
with (security_invoker = true) as
select
  c.id, c.slug, c.tier, c.name, c.subtitle, c.description,
  c.league_id, c.team_id, c.season, c.art, c.attributes,
  c.total_supply, c.claimed_count,
  c.total_supply - c.claimed_count as remaining,
  t.rarity_rank, t.name as tier_name,
  tm.name as team_name, tm.abbreviation as team_abbreviation,
  t.kind,
  p.full_name as player_name,
  c.card_year, c.card_set, c.card_number, c.grader, c.grade,
  c.photo_front_url, c.est_value_cents, c.is_sample
from public.collectibles c
join public.collectible_tiers t on t.slug = c.tier
left join public.teams tm on tm.id = c.team_id
left join public.players p on p.id = c.player_id
where c.is_active;

-- ---------------------------------------------------------------------------
-- claim_offer: as before, plus vaulted types get a specific physical copy.
-- The serial is the claim order (claimed_count after the increment).
-- ---------------------------------------------------------------------------
create or replace function public.claim_offer(p_offer_id uuid, p_collectible_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_offer   public.claim_offers;
  v_profile public.profiles;
  v_serial  int;
  v_kind    text;
  v_item    public.vault_items;
  v_claim   public.user_collectibles;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_offer
  from public.claim_offers
  where id = p_offer_id and user_id = v_uid
  for update;

  if not found then
    raise exception 'offer_not_found';
  end if;
  if v_offer.status <> 'open' then
    raise exception 'offer_closed';
  end if;
  if not (p_collectible_id = any (v_offer.options)) then
    raise exception 'not_in_offer';
  end if;

  if v_offer.source = 'onboarding' then
    select * into v_profile from public.profiles where id = v_uid for update;
    if v_profile.onboarding_claimed_at is not null then
      raise exception 'already_claimed';
    end if;
    if v_profile.followed_team_id is distinct from v_offer.team_id then
      raise exception 'team_changed';
    end if;
  end if;

  update public.collectibles
     set claimed_count = claimed_count + 1
   where id = p_collectible_id
     and is_active
     and claimed_count < total_supply
  returning claimed_count into v_serial;

  if v_serial is null then
    raise exception 'sold_out';
  end if;

  insert into public.user_collectibles (user_id, collectible_id, serial_number, offer_id, source)
  values (v_uid, p_collectible_id, v_serial, v_offer.id, v_offer.source)
  returning * into v_claim;

  -- Vaulted: hand over one specific physical copy. Locked so two claims
  -- never get the same slab. No copy left means supply and vault disagree.
  select t.kind into v_kind
  from public.collectibles c join public.collectible_tiers t on t.slug = c.tier
  where c.id = p_collectible_id;

  if v_kind = 'vaulted' then
    select * into v_item
    from public.vault_items
    where collectible_id = p_collectible_id and claim_id is null
    order by created_at, cert_number
    limit 1
    for update skip locked;

    if not found then
      raise exception 'sold_out';
    end if;

    update public.vault_items set claim_id = v_claim.id where id = v_item.id;
    update public.user_collectibles set vault_item_id = v_item.id where id = v_claim.id
    returning * into v_claim;
  end if;

  update public.claim_offers
     set status = 'claimed', chosen_collectible_id = p_collectible_id, resolved_at = now()
   where id = v_offer.id;

  if v_offer.source = 'onboarding' then
    update public.profiles
       set onboarding_claimed_at = now(), updated_at = now()
     where id = v_uid;
  end if;

  return jsonb_build_object(
    'claim', to_jsonb(v_claim) || jsonb_build_object(
      'cert_number', v_item.cert_number,
      'vault_status', v_item.vault_status
    ),
    'collectible', (select to_jsonb(inv) from public.collectible_inventory inv where inv.id = p_collectible_id)
  );
end;
$$;

revoke all on function public.claim_offer(uuid, uuid) from public, anon;
grant execute on function public.claim_offer(uuid, uuid) to authenticated;
