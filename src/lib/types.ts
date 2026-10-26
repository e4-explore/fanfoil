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
  logo_dark_url: string | null;
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
  photo_front_url: string | null; // representative photo of this card type
  est_value_cents: number | null;
  is_sample: boolean;
};

// The specific physical copy a fan owns (vaulted cards only).
export type VaultItem = {
  id: string;
  cert_number: string;
  vault_status: VaultStatus;
  photo_front_url: string | null;
};

// What a card needs to show a specific copy on its label.
export type CopyLabel = Pick<VaultItem, 'cert_number' | 'photo_front_url'>;

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
  vault_item: VaultItem | null;
};
