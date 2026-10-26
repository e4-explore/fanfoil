// Sample data for the style guide. Shapes match real rows so components
// render exactly as they do in the app.

import type { InventoryItem, Team } from '@/lib/types';

const base = {
  league_id: 'sample-league',
  team_id: 'sample-team',
  team_name: 'Minnesota Timberwolves',
  team_abbreviation: 'MIN',
  season: '2026-27',
  attributes: {},
  player_name: null,
  card_year: null,
  card_set: null,
  card_number: null,
  grader: null,
  grade: null,
  photo_front_url: null,
  est_value_cents: null,
  is_sample: false,
  league_logo_url: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  league_logo_dark_url: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/nba.png',
} satisfies Partial<InventoryItem>;

export const roleCard: InventoryItem = {
  ...base,
  id: 'sample-role',
  slug: 'sample-role',
  tier: 'role',
  tier_name: 'Role',
  rarity_rank: 5,
  kind: 'original',
  name: 'Floor General',
  subtitle: 'Runs the offense',
  description: 'Sees the play before it happens.',
  art: { glyph: 'FG' },
  total_supply: 50,
  claimed_count: 12,
  remaining: 38,
};

export const storylineCard: InventoryItem = {
  ...roleCard,
  id: 'sample-storyline',
  slug: 'sample-storyline',
  tier: 'storyline',
  tier_name: 'Storyline',
  rarity_rank: 6,
  name: 'Beat the Buzzer',
  subtitle: 'Zero on the clock',
  art: { glyph: 'BZ' },
  total_supply: 10,
  claimed_count: 10,
  remaining: 0,
};

export const slabCard: InventoryItem = {
  ...base,
  id: 'sample-slab',
  slug: 'sample-slab',
  tier: 'vault_mid',
  tier_name: 'Mid',
  rarity_rank: 2,
  kind: 'vaulted',
  name: 'Anthony Edwards',
  subtitle: 'PSA 10 · Sample Set',
  description: null,
  art: {},
  total_supply: 25,
  claimed_count: 3,
  remaining: 22,
  player_name: 'Anthony Edwards',
  card_year: '2025-26',
  card_set: 'Sample Set',
  card_number: '#5',
  grader: 'PSA',
  grade: '10',
  est_value_cents: 18000,
  is_sample: true,
};

export const sampleCopy = { cert_number: 'SAMPLE-0001-03', photo_front_url: null };

export const sampleTeam: Team = {
  id: 'sample-team',
  league_id: 'sample-league',
  slug: 'minnesota-timberwolves',
  name: 'Minnesota Timberwolves',
  location: 'Minnesota',
  nickname: 'Timberwolves',
  abbreviation: 'MIN',
  conference: 'West',
  logo_url: 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
  logo_dark_url: 'https://a.espncdn.com/i/teamlogos/nba/500-dark/min.png',
};

export const teamWithoutLogo: Team = { ...sampleTeam, id: 'sample-team-2', abbreviation: 'NEW', logo_url: null, logo_dark_url: null };
