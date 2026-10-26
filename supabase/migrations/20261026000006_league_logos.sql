-- Leagues get logos (light and dark-background versions), shown on the back of
-- that league's cards. Exposed on the inventory view so a card can show its
-- league's mark without another query.
alter table public.leagues
  add column logo_url text,
  add column logo_dark_url text;

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
  c.card_year, c.card_set, c.card_number, c.grader, c.grade,
  c.photo_front_url, c.est_value_cents, c.is_sample,
  l.logo_url as league_logo_url, l.logo_dark_url as league_logo_dark_url
from public.collectibles c
join public.collectible_tiers t on t.slug = c.tier
join public.leagues l on l.id = c.league_id
left join public.teams tm on tm.id = c.team_id
left join public.players p on p.id = c.player_id
where c.is_active;
