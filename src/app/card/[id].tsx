import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { HoloCard } from '@/components/HoloCard';
import { Button, Loading, Notice, Screen, Text } from '@/components/ui';
import { api } from '@/lib/api';
import { makeStyles, useTheme } from '@/theme';

// One card, large. Opened from "My cards" (with a serial) or "All cards".
export default function CardDetail() {
  const router = useRouter();
  const { id, serial } = useLocalSearchParams<{ id: string; serial?: string }>();
  const { width } = useWindowDimensions();
  const styles = useStyles();
  const t = useTheme();
  const item = useQuery({ queryKey: ['inventory', 'item', id], queryFn: () => api.inventoryItem(id), enabled: !!id });

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
  const serialNumber = serial ? Number(serial) : undefined;
  const cardWidth = Math.min(width - t.space.md * 2, 340);
  const roles = card.attributes.roles ?? [];

  return (
    <Screen footer={<Button label="Back" variant="secondary" onPress={back} />}>
      <View style={styles.hero}>
        <HoloCard item={card} width={cardWidth} serial={serialNumber} useMotion />
      </View>
      <Text variant="heading">{card.name}</Text>
      <Text variant="small" tone="muted">{[card.tier_name, card.team_name, card.season].filter(Boolean).join(', ')}</Text>
      <Text style={styles.paragraph}>{card.description}</Text>
      {roles.length > 0 ? (
        <Text tone="muted" style={styles.note}>
          {`Roles in this moment: ${roles.map((r) => r.replace(/-/g, ' ')).join(', ')}.`}
        </Text>
      ) : null}
      <Text style={styles.paragraph}>
        {serialNumber
          ? `You hold number ${serialNumber.toLocaleString('en-US')} of ${card.total_supply.toLocaleString('en-US')}.`
          : card.remaining === 0
            ? `All ${card.total_supply.toLocaleString('en-US')} copies have been claimed.`
            : `${card.remaining.toLocaleString('en-US')} of ${card.total_supply.toLocaleString('en-US')} copies left to claim.`}
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  hero: { alignItems: 'center', marginVertical: t.space.lg },
  paragraph: { marginTop: t.space.md },
  note: { marginTop: t.space.sm },
}));
