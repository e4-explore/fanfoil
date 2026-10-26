import { Redirect, Tabs } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { session, initializing, profile, profileLoading } = useAuth();
  const t = useTheme();
  if (initializing || profileLoading) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  if (profile && !profile.followed_team_id) return <Redirect href="/onboarding/league" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.color.background },
        tabBarStyle: { backgroundColor: t.color.sunken, borderTopColor: t.color.border },
        tabBarActiveTintColor: t.color.accent,
        tabBarInactiveTintColor: t.color.textMuted,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: t.type.labelSmall,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen name="collection" options={{ title: 'My cards' }} />
      <Tabs.Screen name="inventory" options={{ title: 'All cards' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
