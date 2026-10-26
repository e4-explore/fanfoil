import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardTile, useGridSizing } from '@/components/CardGrid';
import { useTabBarSpace } from '@/components/GlassTabBar';
import { Button, Loading, Notice, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth';
import { makeStyles, useTheme } from '@/theme';

export default function MyCards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Room for the floating tab bar so the last cards aren't hidden behind it.
  const tabBarSpace = useTabBarSpace();
  const styles = useStyles();
  const t = useTheme();
  const { profile } = useAuth();
  const { columns, gap, cardWidth } = useGridSizing();
  const collection = useQuery({ queryKey: ['collection'], queryFn: api.myCollection });

  if (collection.isLoading) return <Loading />;

  const cards = collection.data ?? [];

  return (
    <FlatList
      key={columns}
      data={cards}
      numColumns={columns}
      keyExtractor={(c) => c.id}
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + t.space.lg, paddingBottom: tabBarSpace }]}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl refreshing={collection.isRefetching} onRefresh={() => { collection.refetch(); }} tintColor={t.color.accent} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" variant="title">My cards</Text>
          <Text tone="muted" style={styles.intro}>
            {cards.length === 1 ? '1 card claimed' : `${cards.length} cards claimed`}
          </Text>
          {collection.error ? <Notice tone="error" text={collection.error.message} /> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text>No cards yet. Claim your first one from your team’s roster.</Text>
          <Button
            label={profile?.onboarding_claimed_at ? 'Browse all cards' : 'Claim your first card'}
            style={styles.emptyAction}
            onPress={() => router.push(profile?.onboarding_claimed_at ? '/inventory' : '/onboarding/claim')}
          />
        </View>
      }
      renderItem={({ item: owned }) => (
        <CardTile
          width={cardWidth}
          entry={{
            key: owned.id,
            item: owned.collectible,
            serial: owned.serial_number,
            copy: owned.vault_item,
            caption: owned.collectible.team_name ?? undefined,
          }}
          onPress={() => router.push({ pathname: '/card/[id]', params: { id: owned.collectible.id, serial: String(owned.serial_number) } })}
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
  empty: { paddingVertical: t.space.lg },
  emptyAction: { marginTop: t.space.md },
}));
