import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CourtLines } from '@/components/CourtLines';
import { useSharedTilt } from '@/components/sharedTilt';
import type { InventoryItem } from '@/lib/types';
import { card, fonts, radius, type CardTier } from '@/theme';

type Props = {
  item: InventoryItem;
  width: number;
  serial?: number;           // shown as "#12 of 1,000" for owned copies
  interactive?: boolean;     // drag to tilt (single-card views; off in grids, where it would fight scrolling)
  useMotion?: boolean;       // tilt with the phone's gyroscope (native only; shared by all cards on screen)
};
// Web hover tilt is always on (unless Reduce Motion is set), so grids shimmer too.

const MAX_TILT = 14; // degrees
const ZERO = new Animated.Value(0); // stand-in when phone tilt is off

export function HoloCard({ item, width, serial, interactive = true, useMotion = false }: Props) {
  const height = Math.round(width * 1.4);
  const palette = card.foil[item.tier as CardTier] ?? card.foil.role;
  // This card's own drag/hover tilt, added to the shared phone tilt.
  const local = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [size, setSize] = useState({ w: width, h: height });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const canTilt = interactive && !reduceMotion;
  const canHover = Platform.OS === 'web' && !reduceMotion;
  const shared = useSharedTilt(useMotion && !reduceMotion);
  const tilt = useMemo(
    () => ({ x: Animated.add(local.x, shared?.x ?? ZERO), y: Animated.add(local.y, shared?.y ?? ZERO) }),
    [shared, local],
  );

  const moveTo = (x: number, y: number) => {
    local.setValue({ x: clamp(x), y: clamp(y) });
  };
  const settle = () => {
    Animated.spring(local, { toValue: { x: 0, y: 0 }, useNativeDriver: Platform.OS !== 'web', friction: 6 }).start();
  };

  // Finger drag (native) and pointer drag (web).
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canTilt,
        onMoveShouldSetPanResponder: () => canTilt,
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          moveTo((locationX / size.w) * 2 - 1, (locationY / size.h) * 2 - 1);
        },
        onPanResponderRelease: settle,
        onPanResponderTerminate: settle,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canTilt, size.w, size.h],
  );

  // Hover tilt on web, no click needed. Works in grids too.
  const webHover =
    canHover
      ? {
          onPointerMove: (e: { nativeEvent: { offsetX?: number; offsetY?: number } }) => {
            const { offsetX = 0, offsetY = 0 } = e.nativeEvent;
            moveTo((offsetX / size.w) * 2 - 1, (offsetY / size.h) * 2 - 1);
          },
          onPointerLeave: settle,
        }
      : {};

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // Drag/hover plus phone tilt can exceed 1, so every mapping clamps.
  const clampMode = 'clamp' as const;
  const rotateY = tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [`-${MAX_TILT}deg`, `${MAX_TILT}deg`], extrapolate: clampMode });
  const rotateX = tilt.y.interpolate({ inputRange: [-1, 1], outputRange: [`${MAX_TILT}deg`, `-${MAX_TILT}deg`], extrapolate: clampMode });
  // The band is 3x the card in both directions and centered on it, so even at
  // full tilt (and rotated) its edges never come into view.
  const sheenX = tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [-width * 0.5, width * 0.7], extrapolate: clampMode });
  const sheenY = tilt.y.interpolate({ inputRange: [-1, 1], outputRange: [-height * 0.15, height * 0.35], extrapolate: clampMode });
  const glareX = tilt.x.interpolate({ inputRange: [-1, 1], outputRange: [-width * 0.35, width * 0.85], extrapolate: clampMode });
  const glareY = tilt.y.interpolate({ inputRange: [-1, 1], outputRange: [-height * 0.3, height * 0.9], extrapolate: clampMode });
  // Glare only shows while the card is tilted, so resting cards stay clean.
  const glareOpacity = Animated.add(
    tilt.x.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, 1], extrapolate: 'clamp' }),
    tilt.y.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, 1], extrapolate: 'clamp' }),
  ).interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], extrapolate: 'clamp' });
  const glareSize = width * 0.9;

  const glyph = item.art?.glyph ?? item.name.slice(0, 2).toUpperCase();
  const supply = item.total_supply.toLocaleString('en-US');
  const s = width / 300; // scale card typography with card width

  return (
    <View style={{ width, height }} {...pan.panHandlers} {...(webHover as object)} onLayout={onLayout}>
      <Animated.View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${item.name}, ${item.tier_name} card${item.team_name ? `, ${item.team_name}` : ''}${serial ? `, number ${serial} of ${supply}` : ''}`}
        style={[
          styles.stock,
          { width, height, backgroundColor: palette.stock, borderRadius: radius.card * s },
          { transform: [{ perspective: 900 }, { rotateX }, { rotateY }] },
        ]}
      >
        <LinearGradient colors={palette.panel} style={[styles.panel, { borderRadius: (radius.card - 6) * s }]}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <CourtLines />
          </View>

          <View style={[styles.topRow, { padding: 14 * s }]}>
            <Text style={[styles.meta, { fontSize: 13 * s, color: palette.stock }]}>{item.tier_name}</Text>
            {item.team_abbreviation ? (
              <Text style={[styles.meta, { fontSize: 13 * s, color: palette.stock }]}>{item.team_abbreviation}</Text>
            ) : null}
          </View>

          <Text
            style={[styles.glyph, { fontSize: 128 * s, lineHeight: 128 * s, color: palette.stock }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {glyph}
          </Text>

          <View style={[styles.footer, { padding: 14 * s }]}>
            <Text style={[styles.name, { fontSize: 34 * s, lineHeight: 36 * s }]} numberOfLines={1} adjustsFontSizeToFit>
              {item.name}
            </Text>
            {item.subtitle ? (
              <Text style={[styles.subtitle, { fontSize: 14 * s }]} numberOfLines={1}>
                {item.subtitle}
              </Text>
            ) : null}
            <Text style={[styles.serial, { fontSize: 13 * s, marginTop: 8 * s }]}>
              {serial ? `#${serial.toLocaleString('en-US')} of ${supply}` : `${supply} made`}
            </Text>
          </View>
        </LinearGradient>

        {/* Foil: a prismatic band that slides with the tilt */}
        <View style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius.card * s }]} pointerEvents="none">
          <Animated.View
            style={{
              position: 'absolute',
              left: -width,
              top: -height,
              width: width * 3,
              height: height * 3,
              transform: [{ translateX: sheenX }, { translateY: sheenY }, { rotate: '-24deg' }],
              opacity: 0.55,
              ...(Platform.OS === 'web' ? ({ mixBlendMode: 'color-dodge' } as object) : {}),
            }}
          >
            <LinearGradient
              colors={palette.sheen}
              locations={[0.37, 0.47, 0.53, 0.63]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Glare: a soft highlight that follows the light source */}
          <Animated.View
            style={[
              styles.glare,
              { width: glareSize, height: glareSize, opacity: glareOpacity },
              { transform: [{ translateX: glareX }, { translateY: glareY }, { translateX: -glareSize / 4 }, { translateY: -glareSize / 4 }] },
            ]}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <RadialGradient id="glare" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor={card.glare} stopOpacity={0.38} />
                  <Stop offset="1" stopColor={card.glare} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#glare)" />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

const styles = StyleSheet.create({
  stock: { padding: 7, shadowColor: card.shadow, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  panel: { flex: 1, overflow: 'hidden', justifyContent: 'space-between' },
  clip: { overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: fonts.bodyBold, letterSpacing: 0.4 },
  glyph: { fontFamily: fonts.displayHeavy, textAlign: 'center', opacity: 0.92, letterSpacing: -2 },
  footer: {},
  name: { fontFamily: fonts.displayHeavy, color: card.ink },
  subtitle: { fontFamily: fonts.bodyMedium, color: card.inkMuted },
  serial: { fontFamily: fonts.bodyBold, color: card.ink, fontVariant: ['tabular-nums'] },
  glare: { position: 'absolute' },
});
