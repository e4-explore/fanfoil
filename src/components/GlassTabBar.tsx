import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { makeStyles, size, space, useTheme } from '@/theme';

// A floating, glassy tab bar in the style of Apple's Liquid Glass.
//   iOS 26+   the system Liquid Glass material (expo-glass-effect)
//   iOS < 26, web   a blur with a translucent tint
//   Android   a frosted translucent fill (live blur there needs the screens
//             wrapped in a blur target, which the tab bar can't reach)
//   Reduce Transparency   a solid bar
// Screens scroll underneath it; give them `useTabBarSpace()` of bottom room.

const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

// Distance from the bottom of the screen to the bar.
function useBarOffset() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom - space.sm, space.md);
}

// Bottom padding a tab screen needs so its last row clears the floating bar.
export function useTabBarSpace() {
  return size.tabBar + useBarOffset() + space.md;
}

// Reduce Transparency: the OS setting on native, the CSS media query on web
// (React Native Web doesn't implement the AccessibilityInfo call).
const webTransparencyQuery = () =>
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-transparency: reduce)')
    : undefined;

function useReduceTransparency() {
  const [reduce, setReduce] = useState(() => webTransparencyQuery()?.matches ?? false);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const query = webTransparencyQuery();
      if (!query) return;
      const onChange = (e: { matches: boolean }) => setReduce(e.matches);
      query.addEventListener?.('change', onChange);
      return () => query.removeEventListener?.('change', onChange);
    }
    if (typeof AccessibilityInfo.isReduceTransparencyEnabled !== 'function') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// Android resizes for the keyboard, which would lift the bar over it.
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}

export function GlassTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const styles = useStyles();
  const t = useTheme();
  const bottom = useBarOffset();
  const reduceTransparency = useReduceTransparency();
  const keyboardOpen = useKeyboardOpen();
  if (keyboardOpen) return null;

  const surface = reduceTransparency ? (
    <View style={[StyleSheet.absoluteFill, styles.solid]} />
  ) : liquidGlass ? (
    // Rounded by the glass itself (not clipped), so its rim follows the pill's
    // curved ends instead of being cut off at them.
    <GlassView style={styles.glass} glassEffectStyle="regular" colorScheme={t.mode} isInteractive />
  ) : Platform.OS === 'android' ? (
    <View style={[StyleSheet.absoluteFill, styles.fill]} />
  ) : (
    <>
      <BlurView style={StyleSheet.absoluteFill} intensity={60} tint={t.mode === 'dark' ? 'dark' : 'light'} />
      <View style={[StyleSheet.absoluteFill, styles.fill]} />
    </>
  );

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      {/* Outer view casts the shadow. Liquid Glass rounds itself; the blur and
          fill surfaces sit in a clip that rounds them (a view that clips can't
          also show a shadow on iOS). */}
      <View accessibilityRole="tablist" style={styles.bar}>
        {liquidGlass && !reduceTransparency ? surface : <View style={[styles.clip, styles.edge]}>{surface}</View>}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? t.color.accent : t.color.textMuted;

          // Same events as the default tab bar, so listeners keep working.
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          const onLongPress = () => emitter.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              aria-selected={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed, focused: keyboardFocus }: { pressed: boolean; focused?: boolean }) => [
                styles.item,
                focused && styles.itemSelected,
                pressed && styles.pressed,
                keyboardFocus && styles.focusRing,
              ]}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text variant="smallStrong" style={{ color }} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: t.space.lg,
  },
  bar: {
    width: '100%',
    maxWidth: 420,
    height: t.size.tabBar,
    borderRadius: t.size.tabBar / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.space.xs,
    // Soft lift off the page (iOS/web shadow, Android elevation).
    shadowColor: t.glass.shadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glass: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: t.size.tabBar / 2,
  },
  clip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: t.size.tabBar / 2,
    overflow: 'hidden',
  },
  edge: { borderWidth: StyleSheet.hairlineWidth, borderColor: t.glass.edge },
  fill: { backgroundColor: t.glass.fill },
  solid: { backgroundColor: t.glass.solid },
  item: {
    flex: 1,
    height: t.size.tabBar - t.space.xs * 2,
    borderRadius: (t.size.tabBar - t.space.xs * 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space.xxs,
  },
  itemSelected: { backgroundColor: t.glass.selected },
  pressed: { opacity: 0.7 },
  focusRing: { borderWidth: 2, borderColor: t.color.accent },
}));
