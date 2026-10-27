-- All-time greats get the rarest cards regardless of current form (e.g. a
-- veteran legend whose recent numbers alone would rank him outside the top
-- 10). Set by the rankings seed.
alter table public.players add column all_time boolean not null default false;
comment on column public.players.all_time is
  'All-time great (NBA 75th Anniversary Team, or a league MVP). Always Grail rarity.';
