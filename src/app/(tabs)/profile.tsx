import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button, Field, Loading, Notice, Row, Screen, Title } from '@/components/ui';
import { api } from '@/lib/api';
import { hasPassword, useAuth } from '@/providers/auth';
import { space, type } from '@/theme';

export default function Profile() {
  const router = useRouter();
  const { session, profile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? '');

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
    <Screen>
      <Title>Profile</Title>
      <Text style={[type.bodyMuted, { marginTop: space.xs }]}>{session?.user.email}</Text>

      <Text style={[type.heading, { marginTop: space.xl }]}>Your team</Text>
      <Row
        title={team.data?.name ?? '…'}
        detail="Switch teams"
        onPress={() => router.push({ pathname: '/onboarding/team', params: { mode: 'switch' } })}
      />
      <Text style={[type.small, { marginTop: space.sm }]}>
        You can switch any time. Your first card is a one-time pick, and switching doesn’t give you another.
      </Text>

      <Text style={[type.heading, { marginTop: space.xl }]}>Display name</Text>
      <Field label="Shown on your collection" value={name} onChangeText={setName} maxLength={40} />
      <Button
        label={save.isSuccess && name.trim() === profile.display_name ? 'Saved' : 'Save name'}
        variant="secondary"
        style={{ marginTop: space.md }}
        disabled={!name.trim() || name.trim() === (profile.display_name ?? '')}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      {save.error ? <Notice tone="error" text={save.error.message} /> : null}

      {session?.user.email ? (
        <>
          <Text style={[type.heading, { marginTop: space.xl }]}>Password</Text>
          <Row
            title={hasPassword(session) ? 'Change password' : 'Add a password'}
            detail={hasPassword(session) ? undefined : 'Optional. Sign in without waiting for a code.'}
            onPress={() => router.push({ pathname: '/account/password', params: { mode: 'manage' } })}
          />
        </>
      ) : null}

      <Button label="Sign out" variant="quiet" style={{ marginTop: space.xl }} onPress={signOut} />
    </Screen>
  );
}
