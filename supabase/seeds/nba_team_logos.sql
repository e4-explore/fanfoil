-- =============================================================================
-- NBA league and team logos (light and dark-background versions), from
-- ESPN's public feeds, pulled 2026-10-26. Team logos show wherever the app
-- shows a team; the league logo is on the back of NBA cards.
--
-- These are team trademarks used without a license, at the owner's direction
-- and against the strategy doc's guidance. To remove or replace them (e.g.
-- with licensed files), change only this data: the app falls back to the
-- team abbreviation when a team has no logo.
-- =============================================================================

update public.teams tm
   set logo_url = v.logo_url, logo_dark_url = v.logo_dark_url
  from (values
  ('ATL', 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/atl.png'),
  ('BKN', 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/bkn.png'),
  ('BOS', 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/bos.png'),
  ('CHA', 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/cha.png'),
  ('CHI', 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/chi.png'),
  ('CLE', 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/cle.png'),
  ('DAL', 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/dal.png'),
  ('DEN', 'https://a.espncdn.com/i/teamlogos/nba/500/den.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/den.png'),
  ('DET', 'https://a.espncdn.com/i/teamlogos/nba/500/det.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/det.png'),
  ('GSW', 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/gs.png'),
  ('HOU', 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/hou.png'),
  ('IND', 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/ind.png'),
  ('LAC', 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/lac.png'),
  ('LAL', 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/lal.png'),
  ('MEM', 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/mem.png'),
  ('MIA', 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/mia.png'),
  ('MIL', 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/mil.png'),
  ('MIN', 'https://a.espncdn.com/i/teamlogos/nba/500/min.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/min.png'),
  ('NOP', 'https://a.espncdn.com/i/teamlogos/nba/500/no.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/no.png'),
  ('NYK', 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/ny.png'),
  ('OKC', 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/okc.png'),
  ('ORL', 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/orl.png'),
  ('PHI', 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/phi.png'),
  ('PHX', 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/phx.png'),
  ('POR', 'https://a.espncdn.com/i/teamlogos/nba/500/por.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/por.png'),
  ('SAC', 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/sac.png'),
  ('SAS', 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/sa.png'),
  ('TOR', 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/tor.png'),
  ('UTA', 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/utah.png'),
  ('WAS', 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png', 'https://a.espncdn.com/i/teamlogos/nba/500-dark/wsh.png')
  ) as v (abbr, logo_url, logo_dark_url)
 where tm.abbreviation = v.abbr
   and tm.league_id = (select id from public.leagues where slug = 'nba');

update public.leagues
   set logo_url = 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
       logo_dark_url = 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/nba.png'
 where slug = 'nba';
