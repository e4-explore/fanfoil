// Shapes returned by the database. Kept by hand for now; once the schema
// settles, generate them with `npx supabase gen types typescript --local`.

export type Sport = { id: string; slug: string; name: string };

export type League = { id: string; sport_id: string; slug: string; name: string; short_name: string };

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

export type Tier = 'role' | 'storyline';

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
