import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CollectibleCard } from '@/components/CollectibleCard';
import { Button, Loading, Notice, Screen, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { availability, cardFacts, edition, formatValue, ownership } from '@/lib/collectibles';
import { makeStyles, useTheme } from '@/theme';

// One card, large. Opened from "My cards" (with a serial) or "All cards".
export default function CardDetail() {
  const router = useRouter();
  const { id, serial } = useLocalSearchParams<{ id: string; serial?: string }>();
  const { width } = useWindowDimensions();
  const styles = useStyles();
  const t = useTheme();
  const item = useQuery({ queryKey: ['inventory', 'item', id], queryFn: () => api.inventoryItem(id), enabled: !!id });
  // If the fan owns this card, show their copy (number, cert, vault status)
  // even when they opened it from All cards.
  const collection = useQuery({ queryKey: ['collection'], queryFn: api.myCollection });
  const mine = collection.data?.find((c) => c.collectible.id === id);

  if (item.isLoading) return <Loading />;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/collection'));

  if (item.error || !item.data) {
    return (
      <Screen>
        <Notice tone="error" text={item.error?.message ?? 'This card isn’t available.'} />
        <Button label="Back" variant="quiet" onPress={back} />
      </Screen>
    );
  }

  const card = item.data;
  const serialNumber = serial ? Number(serial) : mine?.serial_number;
  const copy = mine?.vault_item ?? null;
  const cardWidth = Math.min(width - t.space.md * 2, 340);
  const roles = card.attributes.roles ?? [];

  return (
    <Screen footer={<Button label="Back" variant="secondary" onPress={back} />}>
      <View style={styles.hero}>
        <CollectibleCard item={card} width={cardWidth} serial={serialNumber} copy={copy} useMotion />
      </View>
      <Text variant="heading">{card.name}</Text>
      {card.kind === 'vaulted' ? (
        <>
          <Text variant="small" tone="muted">
            {[cardFacts(card), card.team_name].filter(Boolean).join(' · ')}
          </Text>
          {card.is_sample ? (
            <Notice text="Sample card for testing. A real graded card of this player replaces it once vaulted." />
          ) : null}
          <View style={styles.facts}>
            <Fact label="Tier" value={card.tier_name} />
            <Fact label="Estimated value" value={formatValue(card.est_value_cents) ?? '—'} />
            {serialNumber ? (
              <>
                <Fact label="Your copy" value={edition(card, serialNumber)} />
                <Fact label="Certificate" value={copy?.cert_number ?? '—'} />
                <Fact label="Status" value={vaultStatus[copy?.vault_status ?? 'in_vault']} />
              </>
            ) : (
              <Fact label="Copies" value={availability(card)} />
            )}
          </View>
          {serialNumber ? <Text style={styles.paragraph}>{ownership(card, serialNumber, copy?.cert_number)}</Text> : null}
        </>
      ) : (
        <>
          <Text variant="small" tone="muted">
            {['Fanfoil Original', card.tier_name, card.team_name, card.season].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.paragraph}>{card.description}</Text>
          {roles.length > 0 ? (
            <Text tone="muted" style={styles.note}>
              {`Roles in this moment: ${roles.map((r) => r.replace(/-/g, ' ')).join(', ')}.`}
            </Text>
          ) : null}
          <Text style={styles.paragraph}>
            {serialNumber
              ? `You hold number ${serialNumber.toLocaleString('en-US')} of ${card.total_supply.toLocaleString('en-US')}.`
              : `${availability(card)}.`}
          </Text>
        </>
      )}
    </Screen>
  );
}

const vaultStatus = {
  in_vault: 'In the vault',
  redemption_requested: 'Redemption requested',
  shipped: 'Shipped to the owner',
} as const;

function Fact({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.fact}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  hero: { alignItems: 'center', marginVertical: t.space.lg },
  facts: {
    marginTop: t.space.md,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
    paddingHorizontal: t.space.md,
  },
  fact: {
    paddingVertical: t.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.color.border,
  },
  paragraph: { marginTop: t.space.md },
  note: { marginTop: t.space.sm },
}));
