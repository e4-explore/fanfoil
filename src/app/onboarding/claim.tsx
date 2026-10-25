import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { FlipCard } from '@/components/FlipCard';
import { HoloCard } from '@/components/HoloCard';
import { Button, Lede, Loading, Notice, Screen, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { AppError } from '@/lib/errors';
import type { InventoryItem } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { colors, maxContentWidth, radius, space, type } from '@/theme';

const GAP = 12;

export default function ClaimFirstCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, refreshProfile } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<{ item: InventoryItem; serial: number } | null>(null);

  const offer = useQuery({
    queryKey: ['offer', 'onboarding', profile?.followed_team_id],
    queryFn: api.onboardingOffer,
    enabled: !!profile?.followed_team_id && !profile?.onboarding_claimed_at,
    staleTime: Infinity,
  });

  // Keep reveals for cards still on offer; a swapped-in card starts face-down.
  useEffect(() => {
    if (!offer.data) return;
    const ids = new Set(offer.data.options.map((o) => o.id));
    setRevealed((prev) => new Set([...prev].filter((id) => ids.has(id))));
    setSelectedId((prev) => (prev && ids.has(prev) ? prev : null));
  }, [offer.data]);

  const claim = useMutation({
    mutationFn: (collectibleId: string) => api.claim(offer.data!.id, collectibleId),
    onSuccess: async (result) => {
      setClaimed({ item: result.collectible, serial: result.claim.serial_number });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: async (error) => {
      const code = error instanceof AppError ? error.code : 'unknown';
      if (code === 'already_claimed') {
        await refreshProfile();
        router.replace('/collection');
        return;
      }
      if (['sold_out', 'offer_closed', 'offer_not_found', 'team_changed'].includes(code)) {
        setNotice(error.message);
        await offer.refetch();
        return;
      }
      setNotice(error.message);
    },
  });

  if (!profile) return <Loading />;
  if (!profile.followed_team_id) return <Redirect href="/onboarding/team" />;

  // Success: the claimed card, big and tiltable.
  if (claimed) {
    const big = Math.min(screenWidth - space.md * 2, 320);
    return (
      <Screen
        footer={
          <Button
            label="See your collection"
            onPress={async () => {
              await refreshProfile();
              router.replace('/collection');
            }}
          />
        }
      >
        <Title>It’s yours</Title>
        <Lede>
          {`${claimed.item.name}, number ${claimed.serial.toLocaleString('en-US')} of ${claimed.item.total_supply.toLocaleString('en-US')}. No one else will ever hold this number.`}
        </Lede>
        <View style={styles.hero}>
          <HoloCard item={claimed.item} width={big} serial={claimed.serial} useMotion />
        </View>
        <Text style={[type.small, { textAlign: 'center' }]}>Tilt your phone or drag the card to see the foil.</Text>
      </Screen>
    );
  }

  if (profile.onboarding_claimed_at) return <Redirect href="/collection" />;
  if (offer.isLoading) return <Loading />;

  if (offer.error) {
    return (
      <Screen>
        <Title>Your first card</Title>
        <Notice tone="error" text={offer.error.message} />
        <Button label="Try again" style={{ marginTop: space.md }} onPress={() => offer.refetch()} />
      </Screen>
    );
  }

  const options = offer.data?.options ?? [];
  const column = Math.min(screenWidth - space.md * 2, maxContentWidth);
  const cardWidth = Math.floor((column - GAP * (options.length - 1)) / Math.max(options.length, 1));
  const allRevealed = options.length > 0 && options.every((o) => revealed.has(o.id));
  const selected = options.find((o) => o.id === selectedId) ?? null;

  const onCardPress = (item: InventoryItem) => {
    if (!revealed.has(item.id)) {
      setRevealed((prev) => new Set(prev).add(item.id));
      return;
    }
    setSelectedId(item.id);
  };

  return (
    <Screen
      footer={
        allRevealed ? (
          <Button
            label={selected ? `Claim ${selected.name}` : 'Pick one card to claim'}
            disabled={!selected}
            loading={claim.isPending}
            onPress={() => selected && claim.mutate(selected.id)}
          />
        ) : (
          <Button
            label="Reveal all three"
            variant="secondary"
            onPress={() => setRevealed(new Set(options.map((o) => o.id)))}
          />
        )
      }
    >
      <Title>Your first card</Title>
      <Lede>Three roles from your team’s roster. Reveal them, then keep one. You only get to pick once.</Lede>
      {notice ? <Notice text={notice} /> : null}

      <View style={[styles.spread, { gap: GAP }]}>
        {options.map((item) => {
          const isRevealed = revealed.has(item.id);
          const isSelected = item.id === selectedId;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={isRevealed ? `${item.name}. Select to claim.` : 'Face-down card. Reveal.'}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onCardPress(item)}
              style={[styles.slot, isSelected && styles.slotSelected]}
            >
              <FlipCard item={item} width={cardWidth - 8} revealed={isRevealed} />
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.detail}>
          <Text style={type.heading}>{selected.name}</Text>
          <Text style={[type.body, { marginTop: space.xs }]}>{selected.description}</Text>
          <Text style={[type.small, { marginTop: space.sm }]}>
            {`${selected.remaining.toLocaleString('en-US')} of ${selected.total_supply.toLocaleString('en-US')} still unclaimed`}
          </Text>
        </View>
      ) : allRevealed ? (
        <Text style={[type.bodyMuted, { marginTop: space.lg }]}>Tap a card to read about it.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spread: { flexDirection: 'row', justifyContent: 'center', marginTop: space.lg },
  slot: { padding: 2, borderRadius: radius.card + 2, borderWidth: 2, borderColor: 'transparent' },
  slotSelected: { borderColor: colors.shotClock },
  detail: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.arenaDeep,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hero: { alignItems: 'center', marginVertical: space.xl },
});
