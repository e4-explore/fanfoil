import type { ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { HoloCard } from '@/components/HoloCard';
import { Text } from '@/components/ui';
import type { InventoryItem } from '@/lib/types';
import { makeStyles, size, space } from '@/theme';

export type GridEntry = { key: string; item: InventoryItem; serial?: number; caption?: string; badge?: ReactNode };

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
      <HoloCard item={entry.item} width={width} serial={entry.serial} interactive={false} />
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
