import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { useTabBarSpace } from '@/components/GlassTabBar';
import { TeamLogo } from '@/components/TeamLogo';
import { Button, Field, Loading, Notice, Row, Screen, Text, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { hasPassword, useAuth } from '@/providers/auth';
import { makeStyles } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');
  const styles = useStyles();
  const tabBarSpace = useTabBarSpace();

  useEffect(() => setName(profile?.display_name ?? ''), [profile?.display_name]);

  const team = useQuery({
    queryKey: ['team', profile?.followed_team_id],
    queryFn: () => api.team(profile!.followed_team_id!),
    enabled: !!profile?.followed_team_id,
  });

  const save = useMutation({
    mutationFn: () => api.updateDisplayName(profile!.id, name.trim()),
    onSuccess: () => refreshProfile(),
  });

  if (!profile) return <Loading />;

  return (
    <Screen bottomSpace={tabBarSpace}>
      <Title>Profile</Title>
      <Text tone="muted" style={styles.email}>{session?.user.email}</Text>

      <Text variant="heading" style={styles.section}>Your team</Text>
      <Row
        title={team.data?.name ?? '…'}
        detail="Switch teams"
        leading={team.data ? <TeamLogo team={team.data} /> : null}
        onPress={() => router.push({ pathname: '/onboarding/team', params: { mode: 'switch' } })}
      />
      <Text variant="small" tone="muted" style={styles.hint}>
        You can switch any time. Your first card is a one-time pick, and switching doesn’t give you another.
      </Text>

      <Text variant="heading" style={styles.section}>Display name</Text>
      <Field label="Shown on your collection" value={name} onChangeText={setName} maxLength={40} />
      <Button
        label={save.isSuccess && name.trim() === profile.display_name ? 'Saved' : 'Save name'}
        variant="secondary"
        style={styles.action}
        disabled={!name.trim() || name.trim() === (profile.display_name ?? '')}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      {save.error ? <Notice tone="error" text={save.error.message} /> : null}

      {session?.user.email ? (
        <>
          <Text variant="heading" style={styles.section}>Password</Text>
          <Row
            title={hasPassword(session) ? 'Change password' : 'Add a password'}
            detail={hasPassword(session) ? undefined : 'Optional. Sign in without waiting for a code.'}
            onPress={() => router.push({ pathname: '/account/password', params: { mode: 'manage' } })}
          />
        </>
      ) : null}

      <Button label="Sign out" variant="quiet" style={styles.section} onPress={signOut} />

      {__DEV__ ? (
        <Row title="Style guide" detail="Development only: tokens and every component" onPress={() => router.push('/styleguide')} />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  email: { marginTop: t.space.xs },
  section: { marginTop: t.space.xl },
  hint: { marginTop: t.space.sm },
  action: { marginTop: t.space.md },
}));
