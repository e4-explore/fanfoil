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

// Short status for grids and the claim panel. Every card is an edition:
// vaulted types have one physical copy per unit of supply.
export function availability(item: InventoryItem) {
  return `${count(item.remaining)} of ${count(item.total_supply)} left`;
}

// "#2 of 50"
export function edition(item: InventoryItem, serial: number) {
  return `#${count(serial)} of ${count(item.total_supply)}`;
}

// What owning it means, for the claim success screen and card detail.
export function ownership(item: InventoryItem, serial?: number, cert?: string | null) {
  if (!serial) return null;
  const number = `Number ${count(serial)} of ${count(item.total_supply)}.`;
  if (item.kind === 'vaulted') {
    return `${number} This exact graded card${cert ? ` (cert ${cert})` : ''} is yours. It stays in the vault until you redeem it.`;
  }
  return `${number} No one else will ever hold this number.`;
}

export function formatValue(cents: number | null) {
  if (cents == null) return null;
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
