-- =============================================================================
-- SAMPLE vaulted cards: one card type per rostered player, for building and
-- testing.
--
-- These are NOT real cards. Every row is flagged is_sample, the set is
-- "Sample Set", and every copy's cert starts with SAMPLE-. There are no
-- photos, so the app shows a neutral slab placeholder (it never draws a card
-- image). Replace with real rows as cards are acquired: one collectibles row
-- per card type, one vault_items row per physical copy (total_supply must
-- equal the number of copies).
--
-- Value tier follows the player ranking (players.rank, set by
-- nba_player_rankings_2026_27.sql), so better players are rarer:
--   Grail    league top 10                          1 copy
--   Premium  league 11-40                          10 copies
--   Mid      each team's top 5 not already above   25 copies
--   Base     everyone else, including unranked     50 copies
-- "Each team's top 5" means every team's real core is rarer than its bench.
-- Grade and value still vary deterministically by name within a tier.
-- =============================================================================

insert into public.collectibles
  (slug, tier, name, subtitle, description, league_id, team_id, season, total_supply,
   player_id, card_year, card_set, card_number, grader, grade, est_value_cents, is_sample)
select
  'sample-nba-' || tm.slug || '-' || regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g'),
  x.tier,
  p.full_name,
  'PSA ' || x.grade || ' · Sample Set',
  'Sample card for testing. A real graded card of this player replaces it once vaulted.',
  tm.league_id, tm.id, '2026-27', x.supply,
  p.id, '2025-26', 'Sample Set', '#' || coalesce(p.jersey, '0'), 'PSA', x.grade,
  x.value_cents, true
from (
  select pl.*, rank() over (partition by pl.team_id order by pl.rank nulls last) as team_rank
  from public.players pl
) p
join public.teams tm on tm.id = p.team_id
cross join lateral (
  select
    case when p.rank <= 10 then 4
         when p.rank <= 40 then 3
         when p.rank is not null and p.team_rank <= 5 then 2
         else 1 end as level,
    abs(hashtext(p.full_name || '#')) % 1000 as jitter
) h
cross join lateral (
  select
    (array['vault_starter', 'vault_mid', 'vault_premium', 'vault_grail'])[h.level] as tier,
    (array[50, 25, 10, 1])[h.level] as supply,
    case when h.jitter % 3 = 0 then '10' when h.jitter % 3 = 1 then '9' else '8' end as grade,
    case h.level when 1 then 2500 + h.jitter * 5        -- $25-$75
                 when 2 then 10000 + h.jitter * 20      -- $100-$300
                 when 3 then 50000 + h.jitter * 100     -- $500-$1,500
                 else 300000 + h.jitter * 500 end as value_cents  -- $3,000-$8,000
) x;

-- One sample physical copy per unit of supply: SAMPLE-<type>-<copy>.
insert into public.vault_items (collectible_id, cert_number, is_sample)
select c.id,
       'SAMPLE-' || lpad(c.n::text, 4, '0') || '-' || lpad(g::text, 2, '0'),
       true
from (
  select id, total_supply, row_number() over (order by slug) as n
  from public.collectibles
  where is_sample
) c
cross join lateral generate_series(1, c.total_supply) as g;
