import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { FlipCard } from '@/components/FlipCard';
import { CollectibleCard } from '@/components/CollectibleCard';
import { BackButton, Button, Lede, Loading, Notice, Screen, Text, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { availability, cardFacts, ownership } from '@/lib/collectibles';
import { AppError } from '@/lib/errors';
import type { InventoryItem } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { makeStyles, useTheme } from '@/theme';

export default function ClaimFirstCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, refreshProfile } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useStyles();
  const t = useTheme();
  const gap = t.space.sm + t.space.xs;
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

  // Back to the team picker to choose a different team before claiming.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/onboarding/team'));

  // Success: the claimed card, big and tiltable.
  if (claimed) {
    const big = Math.min(screenWidth - t.space.md * 2, 320);
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
        <Lede>{[claimed.item.name, ownership(claimed.item, claimed.serial)].filter(Boolean).join('. ')}</Lede>
        <View style={styles.hero}>
          <CollectibleCard item={claimed.item} width={big} serial={claimed.serial} useMotion />
        </View>
        {claimed.item.kind === 'original' ? (
          <Text variant="small" tone="muted" align="center">
            Tilt your phone or drag the card to see the foil.
          </Text>
        ) : null}
      </Screen>
    );
  }

  if (profile.onboarding_claimed_at) return <Redirect href="/collection" />;
  if (offer.isLoading) return <Loading />;

  if (offer.error) {
    return (
      <Screen>
        <BackButton onPress={goBack} />
        <Title>Your first card</Title>
        <Notice tone="error" text={offer.error.message} />
        <Button label="Try again" style={styles.action} onPress={() => offer.refetch()} />
      </Screen>
    );
  }

  const options = offer.data?.options ?? [];
  const column = Math.min(screenWidth - t.space.md * 2, t.size.maxContent);
  const cardWidth = Math.floor((column - gap * (options.length - 1)) / Math.max(options.length, 1));
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
      <BackButton onPress={goBack} />
      <Title>Your first card</Title>
      <Lede>
        {options.every((o) => o.kind === 'vaulted')
          ? 'Three real graded cards from your team’s roster, held in the vault. Reveal them, then keep one. You only get to pick once.'
          : 'Three cards from your team’s roster. Reveal them, then keep one. You only get to pick once.'}
      </Lede>
      {options.some((o) => o.is_sample) ? (
        <Notice text="These are sample cards for testing. Real graded cards replace them before launch." />
      ) : null}
      {notice ? <Notice text={notice} /> : null}

      <View style={[styles.spread, { gap }]}>
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
              <FlipCard item={item} width={cardWidth - t.space.sm} revealed={isRevealed} />
            </Pressable>
          );
        })}
      </View>

      {selected ? (
        <View style={styles.detail}>
          <Text variant="heading">{selected.name}</Text>
          <Text style={styles.description}>
            {selected.kind === 'vaulted' ? `${cardFacts(selected)}. ${selected.tier_name} tier.` : selected.description}
          </Text>
          <Text variant="small" tone="muted" style={styles.remaining}>
            {availability(selected)}
          </Text>
        </View>
      ) : allRevealed ? (
        <Text tone="muted" style={styles.hint}>Tap a card to read about it.</Text>
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  spread: { flexDirection: 'row', justifyContent: 'center', marginTop: t.space.lg },
  slot: { padding: t.space.xxs, borderRadius: t.radius.card + t.space.xxs, borderWidth: 2, borderColor: 'transparent' },
  slotSelected: { borderColor: t.color.accent },
  detail: {
    marginTop: t.space.lg,
    padding: t.space.md,
    borderRadius: t.radius.md,
    backgroundColor: t.color.surface,
    borderWidth: 1,
    borderColor: t.color.border,
  },
  description: { marginTop: t.space.xs },
  remaining: { marginTop: t.space.sm },
  hint: { marginTop: t.space.lg },
  action: { marginTop: t.space.md },
  hero: { alignItems: 'center', marginVertical: t.space.xl },
}));
