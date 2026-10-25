import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { colors } from '@/theme';

export default function OnboardingLayout() {
  const { session, initializing } = useAuth();
  if (initializing) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.arena } }} />;
}
