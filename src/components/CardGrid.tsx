import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { HoloCard } from '@/components/HoloCard';
import type { InventoryItem } from '@/lib/types';
import { maxContentWidth, space, type } from '@/theme';

export type GridEntry = { key: string; item: InventoryItem; serial?: number; caption?: string; badge?: ReactNode };

// Responsive grid: 2 columns on phones, 3 on wider screens.
export function useGridSizing() {
  const { width } = useWindowDimensions();
  const column = Math.min(width - space.md * 2, maxContentWidth);
  const columns = column >= 480 ? 3 : 2;
  const gap = space.md;
  const cardWidth = Math.floor((column - gap * (columns - 1)) / columns);
  return { columns, gap, cardWidth };
}

export function CardTile({ entry, width, onPress }: { entry: GridEntry; width: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ width }, pressed && { opacity: 0.85 }]}
    >
      <HoloCard item={entry.item} width={width} serial={entry.serial} interactive={false} />
      <View style={styles.caption}>
        {entry.caption ? <Text style={type.small}>{entry.caption}</Text> : null}
        {entry.badge}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm, minHeight: 20 },
});
