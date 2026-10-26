import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { Lede, Loading, Notice, Row, Screen, Tag, Title } from '@/components/ui';
import { api } from '@/lib/api';

// First onboarding step: no Back here, so new accounts finish the flow.
// Leagues that aren't live yet are listed but disabled as "Coming soon".
export default function PickLeague() {
  const router = useRouter();
  const leagues = useQuery({ queryKey: ['leagues'], queryFn: api.leagues });

  if (leagues.isLoading) return <Loading />;

  return (
    <Screen>
      <Title>Pick a league</Title>
      <Lede>Your cards come from the league you choose. More leagues are on the way.</Lede>
      {leagues.error ? <Notice tone="error" text={leagues.error.message} /> : null}
      {leagues.data?.map((league) =>
        league.is_active ? (
          <Row
            key={league.id}
            title={league.short_name}
            detail={league.name}
            onPress={() => router.push({ pathname: '/onboarding/team', params: { leagueId: league.id } })}
          />
        ) : (
          <Row key={league.id} title={league.short_name} detail={league.name} disabled trailing={<Tag label="Coming soon" />} />
        ),
      )}
    </Screen>
  );
}
