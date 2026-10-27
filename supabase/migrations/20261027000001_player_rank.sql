-- League-wide player ranking, used to set card rarity: better players get
-- rarer value tiers and smaller editions. 1 = best. Null = not ranked yet
-- (e.g. rookies with no NBA games). Set by the rankings seed; refresh it
-- with the rosters before each drop.
alter table public.players add column rank integer check (rank > 0);
comment on column public.players.rank is
  'League-wide ranking (1 = best) from recent per-game production; drives card rarity. Null = unranked (no NBA games yet).';
