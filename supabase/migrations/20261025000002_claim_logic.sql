-- =============================================================================
-- Claim logic. All client-callable functions are exposed as RPCs:
--   follow_team(team_id)            -> pick or switch the followed team
--   get_onboarding_offer()          -> 3 randomized options (stable per team)
--   claim_offer(offer_id, card_id)  -> atomically claim one card, get a serial
--
-- Errors are raised with short machine-readable messages the app maps to UI:
--   not_authenticated, team_not_found, no_team, already_claimed, sold_out,
--   offer_not_found, offer_closed, not_in_offer, team_changed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Internal: pick N distinct collectibles, weighted by remaining supply.
--
-- Weighted sampling without replacement (Efraimidis–Spirakis): each row gets
-- key = -ln(u) / weight and we keep the N smallest keys. A card with 10x the
-- remaining copies is ~10x as likely to be offered, so commons show up often,
-- rares rarely, and sold-out cards never.
-- ---------------------------------------------------------------------------
create function public._pick_offer_options(
  p_team_id  uuid,
  p_source   text,
  p_count    int default 3,
  p_exclude  uuid[] default '{}'
)
returns uuid[]
language sql
volatile
security definer
set search_path = ''
as $$
  select coalesce(array_agg(pick.id), '{}')
  from (
    select c.id
    from public.collectibles c
    join public.teams tm on tm.id = p_team_id
    join public.offer_rules r on r.source = p_source and r.tier = c.tier
    where c.is_active
      and c.claimed_count < c.total_supply
      and r.weight_multiplier > 0
      and (c.team_id = p_team_id or (c.team_id is null and c.league_id = tm.league_id))
      and not (c.id = any (p_exclude))
    order by -ln(1 - random()) / ((c.total_supply - c.claimed_count) * r.weight_multiplier)
    limit greatest(p_count, 0)
  ) pick;
$$;

-- ---------------------------------------------------------------------------
-- Internal: the JSON shape the app renders for an offer.
-- ---------------------------------------------------------------------------
create function public._offer_json(p_offer_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'source', o.source,
    'team_id', o.team_id,
    'status', o.status,
    'options', coalesce((
      select jsonb_agg(to_jsonb(inv) order by opt.ord)
      from unnest(o.options) with ordinality as opt(id, ord)
      join public.collectible_inventory inv on inv.id = opt.id
    ), '[]'::jsonb)
  )
  from public.claim_offers o
  where o.id = p_offer_id;
$$;

-- ---------------------------------------------------------------------------
-- follow_team: choose or switch the followed team.
-- Switching is always allowed. It never grants another onboarding claim.
-- ---------------------------------------------------------------------------
create function public.follow_team(p_team_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_current uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from public.teams where id = p_team_id and is_active) then
    raise exception 'team_not_found';
  end if;

  select followed_team_id into v_current
  from public.profiles where id = v_uid
  for update;

  if not found then
    -- Profile should exist via trigger; create defensively.
    insert into public.profiles (id) values (v_uid);
  end if;

  if v_current is distinct from p_team_id then
    update public.team_follows
       set ended_at = now()
     where user_id = v_uid and ended_at is null;

    insert into public.team_follows (user_id, team_id) values (v_uid, p_team_id);

    update public.profiles
       set followed_team_id = p_team_id, updated_at = now()
     where id = v_uid;
  end if;

  return (select to_jsonb(p) from public.profiles p where p.id = v_uid);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_onboarding_offer: return the user's 3 options for their followed team.
--
-- Stable per (user, team): calling again, or switching away and back, returns
-- the same offer, so options can't be rerolled. Only options that sold out in
-- the meantime are replaced.
-- ---------------------------------------------------------------------------
create function public.get_onboarding_offer()
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
    -- Keep options that still have copies; top up any that sold out.
    select coalesce(array_agg(opt.id order by opt.ord), '{}') into v_keep
    from unnest(v_offer.options) with ordinality as opt(id, ord)
    join public.collectibles c on c.id = opt.id
    where c.is_active and c.claimed_count < c.total_supply;

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

-- ---------------------------------------------------------------------------
-- claim_offer: claim one card from an open offer.
--
-- The UPDATE ... WHERE claimed_count < total_supply takes a row lock, so if
-- two people race for the last copy exactly one wins and the other gets
-- 'sold_out'. The new claimed_count is the claimant's serial number.
-- ---------------------------------------------------------------------------
create function public.claim_offer(p_offer_id uuid, p_collectible_id uuid)
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

  update public.claim_offers
     set status = 'claimed', chosen_collectible_id = p_collectible_id, resolved_at = now()
   where id = v_offer.id;

  if v_offer.source = 'onboarding' then
    update public.profiles
       set onboarding_claimed_at = now(), updated_at = now()
     where id = v_uid;
  end if;

  return jsonb_build_object(
    'claim', to_jsonb(v_claim),
    'collectible', (select to_jsonb(inv) from public.collectible_inventory inv where inv.id = p_collectible_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: internal helpers are not callable from the API.
-- ---------------------------------------------------------------------------
revoke all on function public._pick_offer_options(uuid, text, int, uuid[]) from public, anon, authenticated;
revoke all on function public._offer_json(uuid)                            from public, anon, authenticated;
revoke all on function public.follow_team(uuid)                            from public, anon;
revoke all on function public.get_onboarding_offer()                       from public, anon;
revoke all on function public.claim_offer(uuid, uuid)                      from public, anon;
revoke all on function public.handle_new_user()                            from public, anon, authenticated;

grant execute on function public.follow_team(uuid)          to authenticated;
grant execute on function public.get_onboarding_offer()     to authenticated;
grant execute on function public.claim_offer(uuid, uuid)    to authenticated;
