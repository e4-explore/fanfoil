-- =============================================================================
-- SAMPLE vaulted cards: one per rostered player, for building and testing.
--
-- These are NOT real cards. Every row is flagged is_sample, its cert number
-- starts with SAMPLE-, and its set is "Sample Set". There are no photos, so
-- the app shows a neutral slab placeholder (it never draws a card image).
-- Replace with real rows (grader, cert, set, unedited slab photos, value)
-- as cards are acquired and vaulted.
--
-- Value tier is spread deterministically from the player's name so reseeding
-- gives the same result: ~70% Starter, 20% Mid, 8% Premium, 2% Grail.
-- =============================================================================

insert into public.collectibles
  (slug, tier, name, subtitle, description, league_id, team_id, season, total_supply,
   player_id, card_year, card_set, card_number, grader, grade, cert_number,
   est_value_cents, vault_status, is_sample)
select
  'sample-nba-' || tm.slug || '-' || regexp_replace(lower(p.full_name), '[^a-z0-9]+', '-', 'g'),
  x.tier,
  p.full_name,
  'PSA ' || x.grade || ' · Sample Set',
  'Sample card for testing. A real graded card of this player replaces it once vaulted.',
  tm.league_id, tm.id, '2026-27', 1,
  p.id, '2025-26', 'Sample Set', '#' || coalesce(p.jersey, '0'), 'PSA', x.grade,
  'SAMPLE-' || lpad(row_number() over (order by tm.slug, p.full_name)::text, 6, '0'),
  x.value_cents, 'in_vault', true
from public.players p
join public.teams tm on tm.id = p.team_id
cross join lateral (
  select abs(hashtext(p.full_name)) % 100 as roll, abs(hashtext(p.full_name || '#')) % 1000 as jitter
) h
cross join lateral (
  select
    case when h.roll < 70 then 'vault_starter'
         when h.roll < 90 then 'vault_mid'
         when h.roll < 98 then 'vault_premium'
         else 'vault_grail' end as tier,
    case when h.jitter % 3 = 0 then '10' when h.jitter % 3 = 1 then '9' else '8' end as grade,
    case when h.roll < 70 then 2500 + h.jitter * 5        -- $25-$75
         when h.roll < 90 then 10000 + h.jitter * 20      -- $100-$300
         when h.roll < 98 then 50000 + h.jitter * 100     -- $500-$1,500
         else 300000 + h.jitter * 500 end as value_cents  -- $3,000-$8,000
) x;
