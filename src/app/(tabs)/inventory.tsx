import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardTile, useGridSizing } from '@/components/CardGrid';
import { useTabBarSpace } from '@/components/GlassTabBar';
import { Chips, Loading, Notice, Segmented, Spinner, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { availability } from '@/lib/collectibles';
import type { CollectibleKind } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { makeStyles, useTheme } from '@/theme';

const PAGE_SIZE = 40;

export default function AllCards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Room for the floating tab bar so the last cards aren't hidden behind it.
  const tabBarSpace = useTabBarSpace();
  const styles = useStyles();
  const t = useTheme();
  const { profile } = useAuth();
  const { columns, gap, cardWidth } = useGridSizing();
  const [kind, setKind] = useState<CollectibleKind | undefined>(undefined);
  const [pickedTeamId, setPickedTeamId] = useState<string | undefined>(undefined);

  // Team filter: the fan's team first (and selected by default), then A-Z.
  const myTeamId = profile?.followed_team_id ?? undefined;
  const myTeam = useQuery({ queryKey: ['team', myTeamId], queryFn: () => api.team(myTeamId!), enabled: !!myTeamId });
  const leagueId = myTeam.data?.league_id;
  const teams = useQuery({ queryKey: ['teams', leagueId], queryFn: () => api.teams(leagueId!), enabled: !!leagueId });
  const teamOptions = useMemo(() => {
    const list = [...(teams.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    const mine = list.filter((tm) => tm.id === myTeamId);
    return [...mine, ...list.filter((tm) => tm.id !== myTeamId)].map((tm) => ({ value: tm.id, label: tm.nickname }));
  }, [teams.data, myTeamId]);
  const teamId = pickedTeamId ?? myTeamId;

  const inventory = useInfiniteQuery({
    queryKey: ['inventory', teamId ?? 'all', kind ?? 'all'],
    queryFn: ({ pageParam }) => api.inventory({ teamId, kind, page: pageParam, pageSize: PAGE_SIZE }),
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + t.space.lg, paddingBottom: tabBarSpace }]}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => inventory.hasNextPage && !inventory.isFetchingNextPage && inventory.fetchNextPage()}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" variant="title">All cards</Text>
          <Text tone="muted" style={styles.intro}>
            Every card, rarest first, and how many copies are left. Vaulted cards are real graded cards; Originals are limited original art.
          </Text>
          <Segmented
            label="Card type"
            value={kind ?? 'any'}
            onChange={(v) => setKind(v === 'any' ? undefined : v)}
            options={[
              { value: 'any', label: 'All' },
              { value: 'vaulted', label: 'Vaulted' },
              { value: 'original', label: 'Originals' },
            ]}
          />
          {teamId && teamOptions.length ? (
            <Chips label="Team" value={teamId} onChange={setPickedTeamId} options={teamOptions} />
          ) : null}
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
            caption: availability(item),
            badge: owned.has(item.id) ? <Text variant="smallStrong" tone="success">Yours</Text> : null,
            banner: item.remaining === 0 ? 'Claimed' : undefined,
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
    width: '100%',
    maxWidth: t.size.maxContent + t.space.md * 2,
    alignSelf: 'center',
  },
  header: { marginBottom: t.space.lg },
  intro: { marginTop: t.space.xs },
  separator: { height: t.space.lg },
  more: { marginTop: t.space.lg },
}));
