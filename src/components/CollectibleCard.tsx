import { HoloCard } from '@/components/HoloCard';
import { SlabCard } from '@/components/SlabCard';
import type { CopyLabel, InventoryItem } from '@/lib/types';

// Renders any collectible: vaulted cards as their slab, Fanfoil Originals as
// foil art. Screens use this instead of picking a card component themselves.
export function CollectibleCard({
  item,
  width,
  serial,
  copy,
  interactive,
  useMotion,
  onTap,
}: {
  item: InventoryItem;
  width: number;
  serial?: number;
  copy?: CopyLabel | null; // the owned physical copy, for vaulted cards
  interactive?: boolean;
  useMotion?: boolean;
  onTap?: () => void; // foil cards: a tap (not a drag), e.g. to flip
}) {
  if (item.kind === 'vaulted') return <SlabCard item={item} width={width} serial={serial} copy={copy} />;
  return <HoloCard item={item} width={width} serial={serial} interactive={interactive} useMotion={useMotion} onTap={onTap} />;
}
