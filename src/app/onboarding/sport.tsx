import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { Lede, Loading, Notice, Row, Screen, Title } from '@/components/ui';
import { api } from '@/lib/api';

export default function PickSport() {
  const router = useRouter();
  const sports = useQuery({ queryKey: ['sports'], queryFn: api.sports });

  if (sports.isLoading) return <Loading />;

  return (
    <Screen>
      <Title>Pick a sport</Title>
      <Lede>You’ll follow one team. More sports are on the way.</Lede>
      {sports.error ? <Notice tone="error" text={sports.error.message} /> : null}
      {sports.data?.map((sport) => (
        <Row
          key={sport.id}
          title={sport.name}
          onPress={() => router.push({ pathname: '/onboarding/league', params: { sportId: sport.id } })}
        />
      ))}
    </Screen>
  );
}
