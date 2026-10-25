import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Lede, Loading, Notice, Row, Screen, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { space } from '@/theme';

export default function PickLeague() {
  const router = useRouter();
  const { sportId } = useLocalSearchParams<{ sportId: string }>();
  const leagues = useQuery({ queryKey: ['leagues', sportId], queryFn: () => api.leagues(sportId), enabled: !!sportId });

  if (leagues.isLoading) return <Loading />;

  return (
    <Screen>
      <Title>Pick a league</Title>
      <Lede>Your cards come from the league you choose.</Lede>
      {leagues.error ? <Notice tone="error" text={leagues.error.message} /> : null}
      {leagues.data?.map((league) => (
        <Row
          key={league.id}
          title={league.short_name}
          detail={league.name}
          onPress={() => router.push({ pathname: '/onboarding/team', params: { leagueId: league.id } })}
        />
      ))}
      <Button label="Back" variant="quiet" style={{ marginTop: space.md }} onPress={() => router.back()} />
    </Screen>
  );
}
