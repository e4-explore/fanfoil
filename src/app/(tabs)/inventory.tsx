import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardTile, useGridSizing } from '@/components/CardGrid';
import { Loading, Notice, Segmented, Spinner, Text } from '@/components/ui';
import { api } from '@/lib/api';
import type { Tier } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { makeStyles, useTheme } from '@/theme';

const PAGE_SIZE = 40;

type Scope = 'team' | 'all';

export default function AllCards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const t = useTheme();
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
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + t.space.lg }]}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => inventory.hasNextPage && !inventory.isFetchingNextPage && inventory.fetchNextPage()}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" variant="title">All cards</Text>
          <Text tone="muted" style={styles.intro}>
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
      ListEmptyComponent={inventory.isLoading ? <Loading /> : <Text tone="muted">No cards match these filters.</Text>}
      ListFooterComponent={inventory.isFetchingNextPage ? <Spinner style={styles.more} /> : undefined}
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
            badge: owned.has(item.id) ? <Text variant="smallStrong" tone="success">Yours</Text> : null,
          }}
          onPress={() => router.push({ pathname: '/card/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

const useStyles = makeStyles((t) => ({
  list: { backgroundColor: t.color.background },
  content: {
    paddingHorizontal: t.space.md,
    paddingBottom: t.space.xl,
    width: '100%',
    maxWidth: t.size.maxContent + t.space.md * 2,
    alignSelf: 'center',
  },
  header: { marginBottom: t.space.lg },
  intro: { marginTop: t.space.xs },
  separator: { height: t.space.lg },
  more: { marginTop: t.space.lg },
}));
