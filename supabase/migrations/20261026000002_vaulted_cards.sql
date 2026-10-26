-- =============================================================================
-- Vaulted cards: real graded cards held in a vault, one row per physical card.
--
-- Model (see the project strategy): each vaulted card is a single authentic,
-- graded card. Its collectible row has total_supply = 1 and is identified by
-- grader + cert number. The app shows only an unedited photo of the slab; it
-- never renders its own art for a vaulted card. Player and set names are
-- factual descriptions of that specific item.
--
-- Two kinds of collectible now share the inventory:
--   vaulted   real graded cards, value tiers vault_starter .. vault_grail
--   original  Fanfoil Originals (original art: roles, storylines, parody)
--
-- Randomized offers stay free (no purchase), so they are not a lottery. Any
-- future paid pack needs a free entry route with identical odds (AMOE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Rosters: current players per team (names identify vaulted cards).
-- ---------------------------------------------------------------------------
create table public.players (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id),
  full_name   text not null,
  jersey      text,
  position    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (team_id, full_name)
);
create index players_team_idx on public.players (team_id);

alter table public.players enable row level security;
create policy "catalog readable" on public.players for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Tiers know which kind of collectible they hold.
-- ---------------------------------------------------------------------------
alter table public.collectible_tiers
  add column kind text not null default 'original' check (kind in ('vaulted', 'original'));

-- ---------------------------------------------------------------------------
-- Vaulted-card details on the collectible.
-- ---------------------------------------------------------------------------
alter table public.collectibles
  add column player_id        uuid references public.players (id),
  add column card_year        text,          -- "2025-26"
  add column card_set         text,          -- "Panini Prizm"
  add column card_number      text,          -- "#123"
  add column grader           text,          -- "PSA", "BGS"
  add column grade            text,          -- "9", "9.5", "GEM MT 10"
  add column cert_number      text unique,   -- grader certificate id
  add column photo_front_url  text,          -- unedited photo of the slab
  add column photo_back_url   text,
  add column est_value_cents  int check (est_value_cents >= 0),
  add column vault_status     text check (vault_status in ('in_vault', 'redemption_requested', 'shipped')),
  add column is_sample        boolean not null default false;  -- placeholder data, not a real card

-- A graded card is one physical object.
alter table public.collectibles
  add constraint collectibles_vaulted_single
  check (cert_number is null or total_supply = 1);

create index collectibles_player_idx on public.collectibles (player_id) where is_active;

-- ---------------------------------------------------------------------------
-- Inventory read model, now with the vaulted fields (new columns at the end).
-- ---------------------------------------------------------------------------
create or replace view public.collectible_inventory
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
  c.card_year, c.card_set, c.card_number, c.grader, c.grade, c.cert_number,
  c.photo_front_url, c.photo_back_url, c.est_value_cents, c.vault_status, c.is_sample
from public.collectibles c
join public.collectible_tiers t on t.slug = c.tier
left join public.teams tm on tm.id = c.team_id
left join public.players p on p.id = c.player_id
where c.is_active;

-- ---------------------------------------------------------------------------
-- get_onboarding_offer: same as before, except a reused offer also drops
-- options whose tier no longer counts for onboarding (weight 0), e.g. after
-- originals left the first-claim pool. Those slots are topped up as usual.
-- ---------------------------------------------------------------------------
create or replace function public.get_onboarding_offer()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_profile  public.profiles;
  v_offer    public.claim_offers;
  v_keep     uuid[];
  v_new      uuid[];
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Serialize per user so two tabs can't create two offers at once.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.followed_team_id is null then
    raise exception 'no_team';
  end if;
  if v_profile.onboarding_claimed_at is not null then
    raise exception 'already_claimed';
  end if;

  -- Close any open onboarding offer for a different team (user switched).
  update public.claim_offers
     set status = 'void', resolved_at = now()
   where user_id = v_uid
     and source = 'onboarding'
     and status = 'open'
     and team_id is distinct from v_profile.followed_team_id;

  -- Reuse this team's most recent offer if there is one.
  select * into v_offer
  from public.claim_offers
  where user_id = v_uid
    and source = 'onboarding'
    and team_id = v_profile.followed_team_id
    and status in ('open', 'void')
  order by created_at desc
  limit 1;

  if found then
    -- Keep options that still have copies and still belong in this pool;
    -- top up the rest.
    select coalesce(array_agg(opt.id order by opt.ord), '{}') into v_keep
    from unnest(v_offer.options) with ordinality as opt(id, ord)
    join public.collectibles c on c.id = opt.id
    join public.offer_rules r on r.source = 'onboarding' and r.tier = c.tier
    where c.is_active and c.claimed_count < c.total_supply and r.weight_multiplier > 0;

    if cardinality(v_keep) < 3 then
      v_new := public._pick_offer_options(
        v_profile.followed_team_id, 'onboarding', 3 - cardinality(v_keep), v_offer.options);
      v_keep := v_keep || v_new;
    end if;

    if cardinality(v_keep) = 0 then
      raise exception 'sold_out';
    end if;

    update public.claim_offers
       set options = v_keep, status = 'open', resolved_at = null
     where id = v_offer.id;

    return public._offer_json(v_offer.id);
  end if;

  v_new := public._pick_offer_options(v_profile.followed_team_id, 'onboarding', 3);
  if cardinality(v_new) = 0 then
    raise exception 'sold_out';
  end if;

  insert into public.claim_offers (user_id, source, team_id, options)
  values (v_uid, 'onboarding', v_profile.followed_team_id, v_new)
  returning * into v_offer;

  return public._offer_json(v_offer.id);
end;
$$;

revoke all on function public.get_onboarding_offer() from public, anon;
grant execute on function public.get_onboarding_offer() to authenticated;
