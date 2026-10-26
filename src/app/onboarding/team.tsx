import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, View } from 'react-native';

import { BackButton, Button, Field, Lede, Loading, Notice, Row, Screen, Text, Title } from '@/components/ui';
import { api } from '@/lib/api';
import type { Team } from '@/lib/types';
import { useAuth } from '@/providers/auth';
import { makeStyles } from '@/theme';

export default function PickTeam() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ leagueId?: string; mode?: string }>();
  const switching = params.mode === 'switch';
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Team | null>(null);
  const styles = useStyles();

  // When switching from the profile tab, stay in the current team's league.
  const currentTeam = useQuery({
    queryKey: ['team', profile?.followed_team_id],
    queryFn: () => api.team(profile!.followed_team_id!),
    enabled: !params.leagueId && !!profile?.followed_team_id,
  });
  const leagueId = params.leagueId ?? currentTeam.data?.league_id;

  const teams = useQuery({ queryKey: ['teams', leagueId], queryFn: () => api.teams(leagueId!), enabled: !!leagueId });

  const follow = useMutation({
    mutationFn: (teamId: string) => api.followTeam(teamId),
    onSuccess: async (next) => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      // Push (not replace) so Back on the claim screen returns here to re-pick.
      if (next.onboarding_claimed_at) router.replace('/collection');
      else router.push('/onboarding/claim');
    },
  });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(switching ? '/profile' : '/onboarding/league');
  };

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (teams.data ?? []).filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q),
    );
    const byConference = new Map<string, Team[]>();
    for (const t of list) {
      const key = t.conference ?? 'Teams';
      byConference.set(key, [...(byConference.get(key) ?? []), t]);
    }
    return [...byConference.entries()];
  }, [teams.data, query]);

  if (!leagueId || teams.isLoading) return <Loading />;

  const alreadyClaimed = !!profile?.onboarding_claimed_at;

  return (
    <Screen
      footer={
        <Button
          label={selected ? `Follow the ${selected.nickname}` : 'Pick a team'}
          disabled={!selected || (switching && selected.id === profile?.followed_team_id)}
          loading={follow.isPending}
          onPress={() => {
            if (!selected) return;
            // Came back from the claim screen and kept the same team: just continue.
            if (selected.id === profile?.followed_team_id) router.push('/onboarding/claim');
            else follow.mutate(selected.id);
          }}
        />
      }
    >
      <BackButton onPress={goBack} />
      <Title>{switching ? 'Switch teams' : 'Pick your team'}</Title>
      <Lede>
        {switching
          ? 'Your cards will follow your new team from here.'
          : 'This is the team you’ll follow this season. Your first cards come from its roster roles.'}
      </Lede>
      {switching && alreadyClaimed ? (
        <Notice text="Switching doesn’t give you another first card. Everything you’ve claimed stays in your collection." />
      ) : null}
      {teams.error ? <Notice tone="error" text={teams.error.message} /> : null}
      {follow.error ? <Notice tone="error" text={follow.error.message} /> : null}

      <Field label="Search teams" value={query} onChangeText={setQuery} placeholder="Pacers, IND…" autoCorrect={false} />

      {groups.map(([conference, list]) => (
        <View key={conference} style={styles.group}>
          <Text variant="heading">{conference}</Text>
          {list.map((team) => (
            <Row
              key={team.id}
              title={team.name}
              detail={team.id === profile?.followed_team_id ? 'Your team' : undefined}
              selected={selected?.id === team.id}
              onPress={() => setSelected(team)}
              trailing={<TeamMark team={team} />}
            />
          ))}
        </View>
      ))}
      {groups.length === 0 ? <Notice text="No teams match that search." /> : null}
    </Screen>
  );
}

// Shows a logo if you've added one (teams.logo_url), otherwise the abbreviation.
function TeamMark({ team }: { team: Team }) {
  const styles = useStyles();
  if (team.logo_url) {
    return <Image source={{ uri: team.logo_url }} style={styles.mark} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={styles.mark}>
      <Text variant="mark">{team.abbreviation}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  group: { marginTop: t.space.lg },
  mark: {
    width: t.size.touch,
    height: t.size.touch,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
