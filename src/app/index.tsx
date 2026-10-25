import { Redirect } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth';

// Sends each person to the right step:
// signed out -> sign in, no team -> onboarding, no first card -> claim, else collection.
export default function Index() {
  const { session, initializing, profile, profileLoading } = useAuth();

  if (initializing) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  if (profileLoading || !profile) return <Loading />;
  if (!profile.followed_team_id) return <Redirect href="/onboarding/sport" />;
  if (!profile.onboarding_claimed_at) return <Redirect href="/onboarding/claim" />;
  return <Redirect href="/collection" />;
}
