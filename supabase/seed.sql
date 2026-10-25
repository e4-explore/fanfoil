-- =============================================================================
-- Seed: NBA inventory for the 2026-27 season.
--
-- Team names are used only to identify teams in the picker. No logos, no
-- player names, no likenesses. Cards are original archetypes ("roles") and
-- team moments ("storylines").
--
-- Supply per card (edition size) drives rarity:
--   role       1,000 copies per team  (8 roles x 30 teams)
--   storyline    100 copies per team  (4 storylines x 30 teams)
-- =============================================================================

insert into public.collectible_tiers (slug, name, description, rarity_rank, default_supply) values
  ('role',      'Role',      'A position on the roster. The foundation of every collection.',      1, 1000),
  ('storyline', 'Storyline', 'A big moment that takes the whole rotation. Rarer and harder to land.', 2, 100);

-- Onboarding offers roles only for now. Raise the storyline multiplier (e.g.
-- to 1) to "sprinkle" storylines into the first claim without a code change.
insert into public.offer_rules (source, tier, weight_multiplier) values
  ('onboarding', 'role',      1),
  ('onboarding', 'storyline', 0);

insert into public.sports (slug, name, sort_order) values ('basketball', 'Basketball', 1);

insert into public.leagues (sport_id, slug, name, short_name, sort_order)
select id, 'nba', 'National Basketball Association', 'NBA', 1 from public.sports where slug = 'basketball';

insert into public.teams (league_id, slug, name, location, nickname, abbreviation, conference)
select l.id, t.slug, t.location || ' ' || t.nickname, t.location, t.nickname, t.abbr, t.conf
from public.leagues l
cross join (values
  ('atl', 'Atlanta',       'Hawks',         'ATL', 'East'),
  ('bos', 'Boston',        'Celtics',       'BOS', 'East'),
  ('bkn', 'Brooklyn',      'Nets',          'BKN', 'East'),
  ('cha', 'Charlotte',     'Hornets',       'CHA', 'East'),
  ('chi', 'Chicago',       'Bulls',         'CHI', 'East'),
  ('cle', 'Cleveland',     'Cavaliers',     'CLE', 'East'),
  ('det', 'Detroit',       'Pistons',       'DET', 'East'),
  ('ind', 'Indiana',       'Pacers',        'IND', 'East'),
  ('mia', 'Miami',         'Heat',          'MIA', 'East'),
  ('mil', 'Milwaukee',     'Bucks',         'MIL', 'East'),
  ('nyk', 'New York',      'Knicks',        'NYK', 'East'),
  ('orl', 'Orlando',       'Magic',         'ORL', 'East'),
  ('phi', 'Philadelphia',  '76ers',         'PHI', 'East'),
  ('tor', 'Toronto',       'Raptors',       'TOR', 'East'),
  ('was', 'Washington',    'Wizards',       'WAS', 'East'),
  ('dal', 'Dallas',        'Mavericks',     'DAL', 'West'),
  ('den', 'Denver',        'Nuggets',       'DEN', 'West'),
  ('gsw', 'Golden State',  'Warriors',      'GSW', 'West'),
  ('hou', 'Houston',       'Rockets',       'HOU', 'West'),
  ('lac', 'LA',            'Clippers',      'LAC', 'West'),
  ('lal', 'Los Angeles',   'Lakers',        'LAL', 'West'),
  ('mem', 'Memphis',       'Grizzlies',     'MEM', 'West'),
  ('min', 'Minnesota',     'Timberwolves',  'MIN', 'West'),
  ('nop', 'New Orleans',   'Pelicans',      'NOP', 'West'),
  ('okc', 'Oklahoma City', 'Thunder',       'OKC', 'West'),
  ('phx', 'Phoenix',       'Suns',          'PHX', 'West'),
  ('por', 'Portland',      'Trail Blazers', 'POR', 'West'),
  ('sac', 'Sacramento',    'Kings',         'SAC', 'West'),
  ('sas', 'San Antonio',   'Spurs',         'SAS', 'West'),
  ('uta', 'Utah',          'Jazz',          'UTA', 'West')
) as t (slug, location, nickname, abbr, conf)
where l.slug = 'nba';

-- Roles: original archetypes, one set per team.
insert into public.collectibles
  (slug, tier, name, subtitle, description, league_id, team_id, season, total_supply, art, attributes)
select
  'nba-' || tm.slug || '-' || r.slug || '-2026',
  'role', r.name, r.subtitle, r.description,
  tm.league_id, tm.id, '2026-27', 1000,
  jsonb_build_object('glyph', r.glyph),
  jsonb_build_object('archetype', r.slug)
from public.teams tm
cross join (values
  ('floor-general', 'Floor General', 'Runs the offense',        'Sets the tempo, calls the sets, and finds the open man before the defense knows it.', 'FG'),
  ('sharpshooter',  'Sharpshooter',  'Stretches the floor',     'Every closeout is a decision. Leave this one open and it costs three.',               'SS'),
  ('rim-protector', 'Rim Protector', 'Owns the paint',          'Changes shots without touching them. Drivers think twice.',                           'RP'),
  ('two-way-wing',  'Two-Way Wing',  'Guards the best scorer',  'Takes the toughest assignment, then runs the floor the other way.',                    'TW'),
  ('sixth-man',     'Sixth Man',     'Instant offense',         'Checks in cold and scores hot. The bench changes the game.',                          '6M'),
  ('glue-guy',      'Glue Guy',      'Does the little things',  'Screens, deflections, charges taken. Never in the box score, always in the win.',      'GG'),
  ('stretch-big',   'Stretch Big',   'Pulls bigs to the arc',   'A center who shoots, so the lane opens for everyone else.',                           'SB'),
  ('rookie-spark',  'Rookie Spark',  'Writing the first chapter','New legs, no fear. The story is just starting.',                                     'RS')
) as r (slug, name, subtitle, description, glyph);

-- Storylines: rarer team moments that involve several roles at once.
insert into public.collectibles
  (slug, tier, name, subtitle, description, league_id, team_id, season, total_supply, art, attributes)
select
  'nba-' || tm.slug || '-' || s.slug || '-2026',
  'storyline', s.name, s.subtitle, s.description,
  tm.league_id, tm.id, '2026-27', 100,
  jsonb_build_object('glyph', s.glyph),
  jsonb_build_object('storyline', s.slug, 'roles', s.roles)
from public.teams tm
cross join (values
  ('the-comeback',   'The Comeback',    'Down big, never out',  'Down double digits late, the whole rotation clawed it back one stop at a time.', 'CB',
     '["floor-general","sixth-man","glue-guy"]'::jsonb),
  ('beat-the-buzzer','Beat the Buzzer', 'Zero on the clock',    'One possession, the clock at zero, and the bench already off its feet.',          'BZ',
     '["floor-general","sharpshooter","stretch-big"]'::jsonb),
  ('rivalry-night',  'Rivalry Night',   'It''s personal',       'The building is loud before tip-off. Everyone knows what this one means.',       'RN',
     '["two-way-wing","rim-protector","rookie-spark"]'::jsonb),
  ('the-stand',      'The Stand',       'Three straight stops', 'Game on the line, and the defense gets three stops in a row to close it out.',   'ST',
     '["rim-protector","two-way-wing","glue-guy"]'::jsonb)
) as s (slug, name, subtitle, description, glyph, roles);
