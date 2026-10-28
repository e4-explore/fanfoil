import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { cssAngle, repeatedRainbow, SAMPLES, wave } from '@/components/holoMotion';
import { FocusRing, noBrowserOutline, Text } from '@/components/primitives';
import { makeStyles, useTheme } from '@/theme';

// The primary button: a violet base with a holographic foil on top.
//   foil     the rainbow (overlay blend) slides with the pointer or finger
//   texture  brushed-metal streaks (overlay blend)
//   glare    a soft highlight that follows the pointer (screen blend)
//   shine    a diagonal sweep every few seconds
//   tilt     the button turns toward the pointer in 3D; with no pointer it
//            drifts on its own
//   press    shrinks slightly; releasing throws a burst of holo sparks
// Reduce Motion: no drift, shine, tilt, or sparks. Disabled: still, 40% opacity.

const native = Platform.OS !== 'web';
const TILT = 8; // degrees at the edge
// The original is ~220px wide with 700px perspective; wider buttons get a
// proportionally deeper perspective so they tilt the same amount visually.
const perspectiveFor = (width: number) => 700 * Math.max(1, width / 220);
const texture = require('../../assets/textures/holo-brushed.png');

const BASE_DIR = cssAngle(160);
const FOIL_DIR = cssAngle(115);
const SHINE_DIR = cssAngle(105);

type Spark = { id: number; x: number; y: number; dx: number; dy: number; size: number; color: string; t: Animated.Value };
let sparkId = 0;

export function HoloButton({
  label,
  onPress,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const styles = useStyles();
  const still = !!disabled;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 320, h: t.size.control });
  const [sparks, setSparks] = useState<Spark[]>([]);

  // Pointer position (-1..1 from the center), whether a pointer is "live",
  // the idle drift phases, press scale, and the shine sweep.
  const [v] = useState(() => ({
    px: new Animated.Value(0),
    py: new Animated.Value(0),
    live: new Animated.Value(0),
    phaseX: new Animated.Value(0),
    phaseY: new Animated.Value(0),
    scale: new Animated.Value(1),
    shine: new Animated.Value(0),
  }));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const animate = !still && !reduceMotion;

  // Idle drift (x and y at different speeds) and the looping shine.
  useEffect(() => {
    if (!animate) return;
    const loops = [
      Animated.loop(Animated.timing(v.phaseX, { toValue: 1, duration: 8976, easing: Easing.linear, useNativeDriver: native })),
      Animated.loop(Animated.timing(v.phaseY, { toValue: 1, duration: 11855, easing: Easing.linear, useNativeDriver: native })),
      Animated.loop(
        Animated.sequence([
          Animated.timing(v.shine, { toValue: 1, duration: 1530, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: native }),
          Animated.delay(1870),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [animate, v]);

  // Where the foil "looks": the pointer while live, otherwise the drift.
  const motion = useMemo(() => {
    const idleX = v.phaseX.interpolate({ inputRange: SAMPLES, outputRange: wave(0.85, 0) });
    const idleY = v.phaseY.interpolate({ inputRange: SAMPLES, outputRange: wave(0.6, Math.PI / 2) });
    const rest = Animated.subtract(1, v.live);
    return {
      x: Animated.add(Animated.multiply(idleX, rest), Animated.multiply(v.px, v.live)),
      y: Animated.add(Animated.multiply(idleY, rest), Animated.multiply(v.py, v.live)),
    };
  }, [v]);

  const spring = (value: Animated.Value, toValue: number) =>
    Animated.spring(value, { toValue, useNativeDriver: native, friction: 9, tension: 70 }).start();

  // Pointer relative to the button center, normalized like the original
  // (half size + 80px of slack), clamped to -1..1.
  const aim = (x: number, y: number) => {
    v.px.setValue(Math.max(-1, Math.min(1, (x - box.w / 2) / (box.w / 2 + 80))));
    v.py.setValue(Math.max(-1, Math.min(1, (y - box.h / 2) / (box.h / 2 + 80))));
  };

  const burst = (x: number, y: number) => {
    const fresh: Spark[] = Array.from({ length: 16 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const dist = 46 + Math.random() * 54;
      return {
        id: sparkId++,
        x,
        y,
        dx: Math.cos(a) * dist,
        dy: Math.sin(a) * dist,
        size: 4 + Math.random() * 5,
        color: t.holo[Math.floor(Math.random() * t.holo.length)],
        t: new Animated.Value(0),
      };
    });
    setSparks((s) => [...s, ...fresh]);
    fresh.forEach((sp) =>
      Animated.timing(sp.t, {
        toValue: 1,
        duration: 520 + Math.random() * 320,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: native,
      }).start(() => setSparks((s) => s.filter((o) => o.id !== sp.id))),
    );
  };

  const interactive = animate && !loading
    ? {
        onHoverIn: () => spring(v.live, 1),
        onHoverOut: () => spring(v.live, 0),
        onPointerMove: (e: { nativeEvent: { offsetX?: number; offsetY?: number; locationX?: number; locationY?: number } }) => {
          const x = e.nativeEvent.offsetX ?? e.nativeEvent.locationX;
          const y = e.nativeEvent.offsetY ?? e.nativeEvent.locationY;
          if (x != null && y != null) aim(x, y);
        },
      }
    : {};

  // Where the press started, for the spark burst (kept across re-renders).
  const pressAt = useRef({ x: 0, y: 0 });
  const onPressIn = (e: GestureResponderEvent) => {
    pressAt.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
    if (!animate) return;
    aim(pressAt.current.x, pressAt.current.y);
    spring(v.live, 1);
    spring(v.scale, 0.96);
  };
  const onPressOut = () => {
    if (!animate) return;
    spring(v.scale, 1);
    if (Platform.OS !== 'web') spring(v.live, 0); // touch has no hover to keep it live
  };
  const handlePress = () => {
    if (animate) burst(pressAt.current.x, pressAt.current.y);
    onPress();
  };

  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // Foil layer is 220% of the button; position follows the motion (0..1).
  const foilW = box.w * 2.2;
  const foilH = box.h * 2.2;
  const foilX = motion.x.interpolate({ inputRange: [-1, 1], outputRange: [0, -(foilW - box.w)], extrapolate: 'clamp' });
  const foilY = motion.y.interpolate({ inputRange: [-1, 1], outputRange: [0, -(foilH - box.h)], extrapolate: 'clamp' });
  const glareD = Math.hypot(box.w, box.h) * 1.16; // radial to 58% of the far corner
  const glareX = motion.x.interpolate({ inputRange: [-1, 1], outputRange: [-glareD / 2, box.w - glareD / 2], extrapolate: 'clamp' });
  const glareY = motion.y.interpolate({ inputRange: [-1, 1], outputRange: [-glareD / 2, box.h - glareD / 2], extrapolate: 'clamp' });
  const rotateY = motion.x.interpolate({ inputRange: [-1, 1], outputRange: [`-${TILT}deg`, `${TILT}deg`], extrapolate: 'clamp' });
  const rotateX = motion.y.interpolate({ inputRange: [-1, 1], outputRange: [`${TILT}deg`, `-${TILT}deg`], extrapolate: 'clamp' });
  const shineX = v.shine.interpolate({ inputRange: [0, 1], outputRange: [-box.w * 1.3, box.w * 1.3] });

  const { colors: foil, locations: foilStops } = repeatedRainbow(t.holo);

  return (
    <View style={[styles.root, still && styles.disabled, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
        disabled={disabled || loading}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onLayout={onLayout}
        {...interactive}
        style={[styles.pressable, noBrowserOutline]}
      >
        {({ focused }: { pressed: boolean; focused?: boolean }) => (
          <>
            {focused ? <FocusRing radius={t.radius.md} /> : null}
            <Animated.View
              style={[
                styles.button,
                {
                  transform: [
                    { perspective: perspectiveFor(box.w) },
                    { rotateX: animate ? rotateX : '0deg' },
                    { rotateY: animate ? rotateY : '0deg' },
                    { scale: v.scale },
                  ],
                },
              ]}
            >
              <LinearGradient colors={t.primary.base} {...BASE_DIR} style={StyleSheet.absoluteFill} />
              <Animated.View
                pointerEvents="none"
                style={[styles.layer, styles.foil, { width: foilW, height: foilH, transform: [{ translateX: foilX }, { translateY: foilY }] }]}
              >
                <LinearGradient colors={foil} locations={foilStops} {...FOIL_DIR} style={StyleSheet.absoluteFill} />
              </Animated.View>
              <Image source={texture} resizeMode="repeat" style={[StyleSheet.absoluteFill, styles.texture]} accessible={false} />
              {loading ? (
                <ActivityIndicator color={t.primary.ink} />
              ) : (
                <Text variant="label" style={styles.label}>
                  {label}
                </Text>
              )}
              <Animated.View
                pointerEvents="none"
                style={[styles.layer, styles.glare, { width: glareD, height: glareD, transform: [{ translateX: glareX }, { translateY: glareY }] }]}
              >
                <Svg width="100%" height="100%">
                  <Defs>
                    <RadialGradient id="holo-glare" cx="50%" cy="50%" r="50%">
                      <Stop offset="0" stopColor={t.primary.glare} stopOpacity={1} />
                      <Stop offset="1" stopColor={t.primary.glare} stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Circle cx="50%" cy="50%" r="50%" fill="url(#holo-glare)" />
                </Svg>
              </Animated.View>
              {animate ? (
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shine, { transform: [{ translateX: shineX }] }]}>
                  <LinearGradient
                    colors={['transparent', t.primary.shine, 'transparent']}
                    locations={[0.38, 0.5, 0.62]}
                    {...SHINE_DIR}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
          </>
        )}
      </Pressable>
      {sparks.map((sp) => (
        <Animated.View
          key={sp.id}
          pointerEvents="none"
          style={[
            styles.spark,
            {
              left: sp.x - sp.size / 2,
              top: sp.y - sp.size / 2,
              width: sp.size,
              height: sp.size,
              backgroundColor: sp.color,
              opacity: sp.t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [
                { translateX: sp.t.interpolate({ inputRange: [0, 1], outputRange: [0, sp.dx] }) },
                { translateY: sp.t.interpolate({ inputRange: [0, 1], outputRange: [0, sp.dy] }) },
                { scale: sp.t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { width: '100%', maxWidth: t.size.maxContent },
  pressable: { borderRadius: t.radius.md },
  disabled: { opacity: 0.4 },
  button: {
    height: t.size.control,
    borderRadius: t.radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.space.lg + t.space.xs,
    boxShadow: t.primary.shadow,
  },
  layer: { position: 'absolute', left: 0, top: 0 },
  foil: { mixBlendMode: 'overlay', opacity: 0.47 },
  texture: { mixBlendMode: 'overlay', opacity: 0.6, width: '100%', height: '100%' },
  glare: { mixBlendMode: 'screen', opacity: 0.52 },
  shine: { mixBlendMode: 'screen' },
  label: {
    color: t.primary.ink,
    textShadowColor: t.primary.inkShadow,
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 0,
  },
  spark: { position: 'absolute', borderRadius: 999, zIndex: 3 },
}));
