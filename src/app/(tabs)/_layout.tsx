import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { GlassTabBar } from '@/components/GlassTabBar';
import { Loading } from '@/components/ui';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type IconProps = { focused: boolean; color: ColorValue; size: number };

// Filled when selected, outlined otherwise (as on iOS).
function TabIcon({ filled, outline, focused, color, size }: IconProps & { filled: IconName; outline: IconName }) {
  // GlassTabBar always passes a theme color string.
  return <Ionicons name={focused ? filled : outline} color={color as string} size={size} />;
}

export default function TabsLayout() {
  const { session, initializing, profile, profileLoading } = useAuth();
  const t = useTheme();
  if (initializing || profileLoading) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  if (profile && !profile.followed_team_id) return <Redirect href="/onboarding/league" />;

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.color.background },
      }}
    >
      <Tabs.Screen name="collection" options={{ title: 'My cards', tabBarIcon: (p: IconProps) => <TabIcon filled="albums" outline="albums-outline" {...p} /> }} />
      <Tabs.Screen name="inventory" options={{ title: 'All cards', tabBarIcon: (p: IconProps) => <TabIcon filled="grid" outline="grid-outline" {...p} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: (p: IconProps) => <TabIcon filled="person-circle" outline="person-circle-outline" {...p} /> }} />
    </Tabs>
  );
}
