import { Redirect } from 'expo-router';

import { Loading } from '@/components/ui';
import { nextStep, shouldPromptForPassword, useAuth } from '@/providers/auth';

// Sends each person to the right step:
// signed out -> sign in, new email user -> optional password, no team -> onboarding,
// no first card -> claim, else collection.
export default function Index() {
  const { session, initializing, profile, profileLoading } = useAuth();

  if (initializing) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  if (shouldPromptForPassword(session)) return <Redirect href="/account/password" />;
  if (profileLoading || !profile) return <Loading />;
  return <Redirect href={nextStep(profile)} />;
}
