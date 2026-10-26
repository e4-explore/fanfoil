// Shapes returned by the database. Kept by hand for now; once the schema
// settles, generate them with `npx supabase gen types typescript --local`.

export type League = { id: string; sport_id: string; slug: string; name: string; short_name: string; is_active: boolean };

export type Team = {
  id: string;
  league_id: string;
  slug: string;
  name: string;
  location: string;
  nickname: string;
  abbreviation: string;
  conference: string | null;
  logo_url: string | null;
};

// Vaulted tiers are value levels of real graded cards; role/storyline are
// Fanfoil Originals (original art).
export type Tier = 'vault_starter' | 'vault_mid' | 'vault_premium' | 'vault_grail' | 'role' | 'storyline';
export type CollectibleKind = 'vaulted' | 'original';
export type VaultStatus = 'in_vault' | 'redemption_requested' | 'shipped';

// One row of public.collectible_inventory
export type InventoryItem = {
  id: string;
  slug: string;
  tier: Tier;
  tier_name: string;
  rarity_rank: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  league_id: string;
  team_id: string | null;
  team_name: string | null;
  team_abbreviation: string | null;
  season: string | null;
  art: { glyph?: string };
  attributes: { archetype?: string; storyline?: string; roles?: string[] };
  total_supply: number;
  claimed_count: number;
  remaining: number;
  kind: CollectibleKind;
  // Vaulted cards only (null for Originals)
  player_name: string | null;
  card_year: string | null;
  card_set: string | null;
  card_number: string | null;
  grader: string | null;
  grade: string | null;
  cert_number: string | null;
  photo_front_url: string | null;
  photo_back_url: string | null;
  est_value_cents: number | null;
  vault_status: VaultStatus | null;
  is_sample: boolean;
};

export type Profile = {
  id: string;
  display_name: string | null;
  followed_team_id: string | null;
  onboarding_claimed_at: string | null;
};

export type Offer = {
  id: string;
  source: 'onboarding' | 'matchday' | 'pack' | 'promo';
  team_id: string | null;
  status: 'open' | 'claimed' | 'void' | 'expired';
  options: InventoryItem[];
};

export type OwnedCollectible = {
  id: string;
  serial_number: number;
  claimed_at: string;
  source: string;
  collectible: InventoryItem;
};
