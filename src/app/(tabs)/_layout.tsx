import { Redirect, Tabs } from 'expo-router';

import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  const { session, initializing, profile, profileLoading } = useAuth();
  if (initializing || profileLoading) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  if (profile && !profile.followed_team_id) return <Redirect href="/onboarding/sport" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.arena },
        tabBarStyle: { backgroundColor: colors.arenaDeep, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.shotClock,
        tabBarInactiveTintColor: colors.mist,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 15 },
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen name="collection" options={{ title: 'My cards' }} />
      <Tabs.Screen name="inventory" options={{ title: 'All cards' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
