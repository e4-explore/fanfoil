-- =============================================================================
-- Fixed odds per tier for random offers.
--
-- Before: every eligible card was weighted (copies left x tier multiplier),
-- so the chance of a Mid card depended on how many Starter and Mid cards a
-- team happened to have (2% for one team, 29% for another).
--
-- Now: each offer slot first rolls a TIER using offer_rules.tier_weight
-- (relative odds, e.g. 90 / 10), then picks a random eligible card in that
-- tier. Every fan gets the same published odds whatever team they follow.
-- If a team has no eligible card left in the rolled tier, that slot rolls
-- again among tiers that still have cards.
--
-- The first claim is free, so it isn't a lottery. A paid pack later must use
-- the same odds for its free entry route (AMOE).
-- =============================================================================

alter table public.offer_rules rename column weight_multiplier to tier_weight;
comment on column public.offer_rules.tier_weight is
  'Relative chance of this tier per offer slot (e.g. 90 and 10 = 90% / 10%). 0 = never offered from this source.';

create or replace function public._pick_offer_options(
  p_team_id  uuid,
  p_source   text,
  p_count    int default 3,
  p_exclude  uuid[] default '{}'
)
returns uuid[]
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_picked  uuid[] := '{}';
  v_tier    text;
  v_card    uuid;
begin
  for i in 1 .. greatest(p_count, 0) loop
    -- Roll a tier, weighted by tier_weight, among tiers that still have an
    -- eligible card for this team (exponential race: P(tier) = w / sum w).
    select r.tier into v_tier
    from public.offer_rules r
    where r.source = p_source
      and r.tier_weight > 0
      and exists (
        select 1
        from public.collectibles c
        join public.teams tm on tm.id = p_team_id
        where c.tier = r.tier
          and c.is_active
          and c.claimed_count < c.total_supply
          and (c.team_id = p_team_id or (c.team_id is null and c.league_id = tm.league_id))
          and not (c.id = any (p_exclude || v_picked))
      )
    order by -ln(1 - random()) / r.tier_weight
    limit 1;

    exit when v_tier is null;  -- nothing left to offer

    -- Then any eligible card in that tier, uniformly.
    select c.id into v_card
    from public.collectibles c
    join public.teams tm on tm.id = p_team_id
    where c.tier = v_tier
      and c.is_active
      and c.claimed_count < c.total_supply
      and (c.team_id = p_team_id or (c.team_id is null and c.league_id = tm.league_id))
      and not (c.id = any (p_exclude || v_picked))
    order by random()
    limit 1;

    v_picked := v_picked || v_card;
  end loop;

  return v_picked;
end;
$$;

revoke all on function public._pick_offer_options(uuid, text, int, uuid[]) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Same as before; only the renamed column changes.
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
    where c.is_active and c.claimed_count < c.total_supply and r.tier_weight > 0;

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
