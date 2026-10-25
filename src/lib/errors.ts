// The database raises short codes (see supabase/migrations/*_claim_logic.sql).
// This turns them into messages that tell people what to do next.

const messages: Record<string, string> = {
  not_authenticated: 'Your session ended. Sign in again to continue.',
  team_not_found: 'That team isn’t available. Pick another one.',
  no_team: 'Pick a team first, then your cards will appear.',
  already_claimed: 'You’ve already claimed your first card.',
  sold_out: 'That card just ran out. We’ve swapped in another option.',
  offer_not_found: 'These options expired. Here’s a fresh look.',
  offer_closed: 'You’ve already claimed from these options.',
  not_in_offer: 'That card isn’t one of your options. Pick one of the three shown.',
  team_changed: 'You switched teams. Here are the options for your current team.',
};

export class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export function toAppError(error: unknown): AppError {
  const raw =
    typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : '';
  const code = Object.keys(messages).find((key) => raw === key || raw.includes(key));
  if (code) return new AppError(code, messages[code]);
  return new AppError('unknown', raw || 'Something went wrong. Check your connection and try again.');
}
