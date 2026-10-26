import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { makeStyles, useTheme } from '@/theme';

// The primary button's surface: the holographic gradient with depth (a
// light-to-dark shade and a fine diagonal texture) that comes alive under the
// pointer or finger. The colors slide toward where you hover or tap, and a
// soft sheen follows. Reduce Motion keeps it still.

const native = Platform.OS !== 'web';

// Pointer/touch tracking for a Pressable. Spread `handlers` onto it and pass
// `surface` to <HoloSurface>.
export function useHoloPointer() {
  // Pointer position across the button: 0 = left edge, 1 = right edge. At rest
  // it's 0, which shows the full spectrum; moving right slides the colors.
  const [pos] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const to = (value: Animated.Value, toValue: number) =>
    Animated.spring(value, { toValue, useNativeDriver: native, friction: 8, tension: 60 }).start();
  const at = (x: number) => Math.max(0, Math.min(1, x / width));

  const handlers = reduceMotion
    ? { onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width) }
    : {
        onLayout: (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width),
        onHoverIn: () => to(glow, 1),
        onHoverOut: () => {
          to(glow, 0);
          to(pos, 0);
        },
        onPointerMove: (e: { nativeEvent: { offsetX?: number; locationX?: number } }) => {
          const x = e.nativeEvent.offsetX ?? e.nativeEvent.locationX;
          if (x != null) pos.setValue(at(x));
        },
        onPressIn: (e: GestureResponderEvent) => {
          to(pos, at(e.nativeEvent.locationX));
          to(glow, 1);
        },
        onPressOut: () => {
          to(glow, 0);
          to(pos, 0);
        },
      };

  return { handlers, surface: { pos, glow, width } };
}

export function HoloSurface({ pos, glow, width }: { pos: Animated.Value; glow: Animated.Value; width: number }) {
  const t = useTheme();
  const styles = useStyles();
  // Gradient drawn twice as wide (colors there and back) so it can slide.
  const loop = [...t.holo, ...[...t.holo].reverse()] as unknown as readonly [string, string, ...string[]];
  const slide = pos.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 0.5] });
  const sheenWidth = Math.max(width * 0.45, 80);
  const sheenX = pos.interpolate({ inputRange: [0, 1], outputRange: [-sheenWidth / 2, width - sheenWidth / 2] });
  const sheenOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.slider, { width: width * 2, transform: [{ translateX: slide }] }]}>
        <LinearGradient colors={loop} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {/* Depth: lighter at the top, a touch darker at the bottom. */}
      <LinearGradient
        colors={[t.holoFx.shadeTop, 'transparent', t.holoFx.shadeBottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Texture: fine diagonal lines. */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="holo-texture" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <Line x1="0" y1="0" x2="0" y2="6" stroke={t.holoFx.texture} strokeWidth="2" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#holo-texture)" />
      </Svg>
      {/* Sheen that follows the pointer or finger. */}
      <Animated.View style={[styles.sheen, { width: sheenWidth, opacity: sheenOpacity, transform: [{ translateX: sheenX }] }]}>
        <LinearGradient
          colors={['transparent', t.holoFx.sheen, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  slider: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  sheen: { position: 'absolute', top: 0, bottom: 0, left: 0 },
}));
