import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const { session, initializing } = useAuth();
  const t = useTheme();
  if (initializing) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.color.background } }} />;
}
