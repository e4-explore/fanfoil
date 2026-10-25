import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardTile, useGridSizing } from '@/components/CardGrid';
import { Button, Loading, Notice } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth';
import { colors, maxContentWidth, space, type } from '@/theme';

export default function MyCards() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      style={{ backgroundColor: colors.arena }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      columnWrapperStyle={columns > 1 ? { gap } : undefined}
      ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
      refreshControl={
        <RefreshControl refreshing={collection.isRefetching} onRefresh={() => { collection.refetch(); }} tintColor={colors.shotClock} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text accessibilityRole="header" style={type.title}>My cards</Text>
          <Text style={[type.bodyMuted, { marginTop: space.xs }]}>
            {cards.length === 1 ? '1 card claimed' : `${cards.length} cards claimed`}
          </Text>
          {collection.error ? <Notice tone="error" text={collection.error.message} /> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={type.body}>No cards yet. Claim your first one from your team’s roster.</Text>
          <Button
            label={profile?.onboarding_claimed_at ? 'Browse all cards' : 'Claim your first card'}
            style={{ marginTop: space.md }}
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
            caption: owned.collectible.team_name ?? undefined,
          }}
          onPress={() => router.push({ pathname: '/card/[id]', params: { id: owned.collectible.id, serial: String(owned.serial_number) } })}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingBottom: space.xl, width: '100%', maxWidth: maxContentWidth + space.md * 2, alignSelf: 'center' },
  header: { marginBottom: space.lg },
  empty: { paddingVertical: space.lg },
});
