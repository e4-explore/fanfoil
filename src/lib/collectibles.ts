// How collectibles are described in the UI, in one place so every screen
// words vaulted cards and Fanfoil Originals the same way.

import type { InventoryItem } from './types';

const count = (n: number) => n.toLocaleString('en-US');

// "2025-26 Sample Set #24 · PSA 9"
export function cardFacts(item: InventoryItem) {
  const card = [item.card_year, item.card_set, item.card_number].filter(Boolean).join(' ');
  const grade = [item.grader, item.grade].filter(Boolean).join(' ');
  return [card, grade].filter(Boolean).join(' · ');
}

// Short status for grids and the claim panel.
export function availability(item: InventoryItem) {
  if (item.kind === 'vaulted') return item.remaining > 0 ? 'In the vault' : 'Claimed';
  return item.remaining === 0 ? 'All claimed' : `${count(item.remaining)} of ${count(item.total_supply)} left`;
}

// What owning it means, for the claim success screen and card detail.
export function ownership(item: InventoryItem, serial?: number) {
  if (item.kind === 'vaulted') {
    return 'This exact graded card is yours. It stays in the vault until you redeem it.';
  }
  if (!serial) return null;
  return `Number ${count(serial)} of ${count(item.total_supply)}. No one else will ever hold this number.`;
}

export function formatValue(cents: number | null) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
