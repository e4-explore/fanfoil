// Every network call the app makes lives here, so screens stay simple and
// a future backend change touches one file.

import { toAppError } from './errors';
import { supabase } from './supabase';
import type { CollectibleKind, InventoryItem, League, Offer, OwnedCollectible, Profile, Team } from './types';

async function run<T>(promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw toAppError(error);
  return data as T;
}

export const api = {
  // Every league, live ones first. Inactive leagues show as "coming soon".
  leagues: () =>
    run<League[]>(
      supabase
        .from('leagues')
        .select('id, sport_id, slug, name, short_name, is_active')
        .order('is_active', { ascending: false })
        .order('sort_order'),
    ),

  teams: (leagueId: string) =>
    run<Team[]>(
      supabase
        .from('teams')
        .select('id, league_id, slug, name, location, nickname, abbreviation, conference, logo_url')
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .order('name'),
    ),

  team: (teamId: string) =>
    run<Team>(
      supabase
        .from('teams')
        .select('id, league_id, slug, name, location, nickname, abbreviation, conference, logo_url')
        .eq('id', teamId)
        .single(),
    ),

  profile: (userId: string) =>
    run<Profile>(
      supabase
        .from('profiles')
        .select('id, display_name, followed_team_id, onboarding_claimed_at')
        .eq('id', userId)
        .single(),
    ),

  followTeam: (teamId: string) => run<Profile>(supabase.rpc('follow_team', { p_team_id: teamId })),

  onboardingOffer: () => run<Offer>(supabase.rpc('get_onboarding_offer')),

  claim: (offerId: string, collectibleId: string) =>
    run<{ claim: { id: string; serial_number: number }; collectible: InventoryItem }>(
      supabase.rpc('claim_offer', { p_offer_id: offerId, p_collectible_id: collectibleId }),
    ),

  // Paged so the inventory scales past a single league.
  // Ranked: rarest tier first, then highest estimated value, then name.
  inventory: (opts: { teamId?: string; kind?: CollectibleKind; page: number; pageSize?: number }) => {
    const size = opts.pageSize ?? 40;
    let query = supabase
      .from('collectible_inventory')
      .select('*')
      .order('rarity_rank', { ascending: false })
      .order('est_value_cents', { ascending: false, nullsFirst: false })
      .order('team_name')
      .order('name')
      .range(opts.page * size, opts.page * size + size - 1);
    if (opts.teamId) query = query.eq('team_id', opts.teamId);
    if (opts.kind) query = query.eq('kind', opts.kind);
    return run<InventoryItem[]>(query);
  },

  inventoryItem: (id: string) =>
    run<InventoryItem>(supabase.from('collectible_inventory').select('*').eq('id', id).single()),

  myCollection: async (): Promise<OwnedCollectible[]> => {
    const rows = await run<{ id: string; serial_number: number; claimed_at: string; source: string; collectible_id: string }[]>(
      supabase
        .from('user_collectibles')
        .select('id, serial_number, claimed_at, source, collectible_id')
        .order('claimed_at', { ascending: false }),
    );
    if (rows.length === 0) return [];
    const items = await run<InventoryItem[]>(
      supabase.from('collectible_inventory').select('*').in('id', [...new Set(rows.map((r) => r.collectible_id))]),
    );
    const byId = new Map(items.map((i) => [i.id, i]));
    return rows
      .filter((r) => byId.has(r.collectible_id))
      .map((r) => ({ ...r, collectible: byId.get(r.collectible_id)! }));
  },

  updateDisplayName: (userId: string, displayName: string) =>
    run<null>(supabase.from('profiles').update({ display_name: displayName }).eq('id', userId)),
};
