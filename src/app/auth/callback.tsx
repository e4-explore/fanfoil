import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button, Lede, Loading, Screen, Title } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { space } from '@/theme';

// Landing spot for magic links and OAuth redirects. The auth provider finishes
// the sign-in; once there's a session, the index route picks the next step.
export default function AuthCallback() {
  const { session, initializing } = useAuth();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (session) return <Redirect href="/" />;
  if (initializing || !timedOut) return <Loading />;

  return (
    <Screen>
      <Title>That link didn’t sign you in</Title>
      <Lede>Links work once and only on the device that asked for them. Request a new code to continue.</Lede>
      <Button label="Back to sign in" style={{ marginTop: space.lg }} onPress={() => router.replace('/sign-in')} />
    </Screen>
  );
}
