import { HoloCard } from '@/components/HoloCard';
import { SlabCard } from '@/components/SlabCard';
import type { InventoryItem } from '@/lib/types';

// Renders any collectible: vaulted cards as their slab, Fanfoil Originals as
// foil art. Screens use this instead of picking a card component themselves.
export function CollectibleCard({
  item,
  width,
  serial,
  interactive,
  useMotion,
}: {
  item: InventoryItem;
  width: number;
  serial?: number;
  interactive?: boolean;
  useMotion?: boolean;
}) {
  if (item.kind === 'vaulted') return <SlabCard item={item} width={width} />;
  return <HoloCard item={item} width={width} serial={serial} interactive={interactive} useMotion={useMotion} />;
}
