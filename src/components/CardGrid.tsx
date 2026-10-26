import type { ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { CardBanner, type BannerTone } from '@/components/CardBanner';
import { CollectibleCard } from '@/components/CollectibleCard';
import { Text } from '@/components/ui';
import type { CopyLabel, InventoryItem } from '@/lib/types';
import { makeStyles, size, space } from '@/theme';

export type GridEntry = {
  key: string;
  item: InventoryItem;
  serial?: number;
  copy?: CopyLabel | null;
  caption?: string;
  badge?: ReactNode;
  banner?: { label: string; tone: BannerTone }; // drawn across the card, e.g. Yours / All claimed
};

// Responsive grid: 2 columns on phones, 3 on wider screens.
export function useGridSizing() {
  const { width } = useWindowDimensions();
  const column = Math.min(width - space.md * 2, size.maxContent);
  const columns = column >= 480 ? 3 : 2;
  const gap = space.md;
  const cardWidth = Math.floor((column - gap * (columns - 1)) / columns);
  return { columns, gap, cardWidth };
}

export function CardTile({ entry, width, onPress }: { entry: GridEntry; width: number; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
    >
      <View>
        {/* Foil follows the phone's tilt (shared by all cards) and web hover; no
            drag here, so scrolling and tapping work as usual. */}
        <CollectibleCard item={entry.item} width={width} serial={entry.serial} copy={entry.copy} interactive={false} useMotion />
        {entry.banner ? <CardBanner label={entry.banner.label} tone={entry.banner.tone} width={width} /> : null}
      </View>
      <View style={styles.caption}>
        {entry.caption ? <Text variant="small" tone="muted">{entry.caption}</Text> : null}
        {entry.badge}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  caption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.space.sm, minHeight: t.space.lg },
  pressed: { opacity: 0.85 },
}));
