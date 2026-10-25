import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, useWindowDimensions, View } from 'react-native';

import { HoloCard } from '@/components/HoloCard';
import { Button, Loading, Notice, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { space, type } from '@/theme';

// One card, large. Opened from "My cards" (with a serial) or "All cards".
export default function CardDetail() {
  const router = useRouter();
  const { id, serial } = useLocalSearchParams<{ id: string; serial?: string }>();
  const { width } = useWindowDimensions();
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
  const cardWidth = Math.min(width - space.md * 2, 340);
  const roles = card.attributes.roles ?? [];

  return (
    <Screen footer={<Button label="Back" variant="secondary" onPress={back} />}>
      <View style={{ alignItems: 'center', marginVertical: space.lg }}>
        <HoloCard item={card} width={cardWidth} serial={serialNumber} useMotion />
      </View>
      <Text style={type.heading}>{card.name}</Text>
      <Text style={type.small}>{[card.tier_name, card.team_name, card.season].filter(Boolean).join(', ')}</Text>
      <Text style={[type.body, { marginTop: space.md }]}>{card.description}</Text>
      {roles.length > 0 ? (
        <Text style={[type.bodyMuted, { marginTop: space.sm }]}>
          {`Roles in this moment: ${roles.map((r) => r.replace(/-/g, ' ')).join(', ')}.`}
        </Text>
      ) : null}
      <Text style={[type.body, { marginTop: space.md }]}>
        {serialNumber
          ? `You hold number ${serialNumber.toLocaleString('en-US')} of ${card.total_supply.toLocaleString('en-US')}.`
          : card.remaining === 0
            ? `All ${card.total_supply.toLocaleString('en-US')} copies have been claimed.`
            : `${card.remaining.toLocaleString('en-US')} of ${card.total_supply.toLocaleString('en-US')} copies left to claim.`}
      </Text>
    </Screen>
  );
}
