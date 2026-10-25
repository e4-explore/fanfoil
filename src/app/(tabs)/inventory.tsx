import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardTile, useGridSizing } from '@/components/CardGrid';
import { Loading, Notice } from '@/components/ui';
import { api } from '@/lib/api';
import type { Tier } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { colors, fonts, maxContentWidth, radius, space, type } from '@/theme';

const PAGE_SIZE = 40;

type Scope = 'team' | 'all';

export default function AllCards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { columns, gap, cardWidth } = useGridSizing();
  const [scope, setScope] = useState<Scope>('team');
  const [tier, setTier] = useState<Tier | undefined>(undefined);

  const teamId = scope === 'team' ? profile?.followed_team_id ?? undefined : undefined;

  const inventory = useInfiniteQuery({
    queryKey: ['inventory', teamId ?? 'all', tier ?? 'all'],
    queryFn: ({ pageParam }) => api.inventory({ teamId, tier, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.length === PAGE_SIZE ? pages.length : undefined),
  });

  // Mark cards the person already owns.
  const collection = useQuery({ queryKey: ['collection'], queryFn: api.myCollection });
  const owned = useMemo(() => new Set((collection.data ?? []).map((c) => c.collectible.id)), [collection.data]);

  const items = inventory.data?.pages.flat() ?? [];

  return (
    <FlatList
      key={columns}
      data={items}
      numColumns={columns}
      keyExtractor={(i) => i.id}
      style={{ backgroundColor: colors.arena }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => inventory.hasNextPage && !inventory.isFetchingNextPage && inventory.fetchNextPage()}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" style={type.title}>All cards</Text>
          <Text style={[type.bodyMuted, { marginTop: space.xs }]}>
            Every card in the set and how many are left. Fewer copies means rarer.
          </Text>
          <Segmented
            label="Teams"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'team', label: 'My team' },
              { value: 'all', label: 'All teams' },
            ]}
          />
          <Segmented
            label="Card type"
            value={tier ?? 'any'}
            onChange={(v) => setTier(v === 'any' ? undefined : (v as Tier))}
            options={[
              { value: 'any', label: 'All types' },
              { value: 'role', label: 'Roles' },
              { value: 'storyline', label: 'Storylines' },
            ]}
          />
          {inventory.error ? <Notice tone="error" text={inventory.error.message} /> : null}
        </View>
      }
      ListEmptyComponent={inventory.isLoading ? <Loading /> : <Text style={type.bodyMuted}>No cards match these filters.</Text>}
      ListFooterComponent={inventory.isFetchingNextPage ? <ActivityIndicator color={colors.shotClock} style={{ marginTop: space.lg }} /> : undefined}
      renderItem={({ item }) => (
        <CardTile
          width={cardWidth}
          entry={{
            key: item.id,
            item,
            caption:
              item.remaining === 0
                ? 'All claimed'
                : `${item.remaining.toLocaleString('en-US')} of ${item.total_supply.toLocaleString('en-US')} left`,
            badge: owned.has(item.id) ? <Text style={styles.owned}>Yours</Text> : null,
          }}
          onPress={() => router.push({ pathname: '/card/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && { color: colors.shotClockInk }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingBottom: space.xl, width: '100%', maxWidth: maxContentWidth + space.md * 2, alignSelf: 'center' },
  header: { marginBottom: space.lg },
  segmented: {
    flexDirection: 'row',
    marginTop: space.md,
    padding: 3,
    borderRadius: radius.md,
    backgroundColor: colors.arenaDeep,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segment: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm + 3 },
  segmentActive: { backgroundColor: colors.shotClock },
  segmentText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.chalk },
  owned: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ok },
});
