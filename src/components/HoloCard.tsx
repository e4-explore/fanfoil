import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CourtLines } from '@/components/CourtLines';
import { cssAngle, repeatedRainbow, SAMPLES, useIdleDrift, wave } from '@/components/holoMotion';
import { useSharedTilt } from '@/components/sharedTilt';
import type { InventoryItem } from '@/lib/types';
import { card, fonts, holo, type CardTier } from '@/theme';

// A Fanfoil Original: card art in a metallic frame, under a holographic foil.
//   frame    brushed metal (silver, or gold for storylines) around the art
//   foil     rainbow washes over the frame and the art (overlay blend) that
//            slide with the light
//   art      shifts slightly against the frame as the card turns (depth)
//   texture  brushed-metal streaks, the same as the primary button
//   glare    a soft highlight where the light hits (screen blend)
//   shine    a diagonal sweep every few seconds
//   edge     a thin rainbow rim
// The light comes from the pointer or finger, the phone's tilt (shared by all
// cards on screen), and otherwise a slow idle drift, so cards shimmer even
// at rest. The single-card view also lifts on press, glows (aura), and can
// be tapped (e.g. to flip). Reduce Motion: still, no drift or shine.

type Props = {
  item: InventoryItem;
  width: number;
  serial?: number;           // shown as "#12 of 1,000" for owned copies
  interactive?: boolean;     // drag to tilt, press to lift, glow (single-card views; off in grids, where it would fight scrolling)
  useMotion?: boolean;       // tilt with the phone's gyroscope (native only; shared by all cards on screen)
  onTap?: () => void;        // a tap (not a drag) on an interactive card
};
// Web hover tilt is always on (unless Reduce Motion is set), so grids shimmer too.

const native = Platform.OS !== 'web';
const TILT = 10; // degrees at the edge
const DEPTH = 0.0165; // art parallax, as a share of the card's width at full tilt
const TAP_SLOP = 8; // px a press can move and still count as a tap
const brushed = require('../../assets/textures/holo-brushed.png');
const FRAME_DIR = cssAngle(145);
const FOIL_DIR = cssAngle(115);
const SHINE_DIR = cssAngle(105);
const foil = repeatedRainbow(holo.stops);
const ZERO = new Animated.Value(0); // stand-in when a motion source is off

// Stable per-card number in 0..1, so drift and shine are offset card to card.
const offsetFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
};

export function HoloCard({ item, width, serial, interactive = true, useMotion = false, onTap }: Props) {
  const height = Math.round(width * 1.4);
  const u = width / 100; // 1% of the card's width; the layout scales with it
  const s = width / 300; // type scale, as before
  const palette = card.foil[item.tier as CardTier] ?? card.foil.role;
  const [reduceMotion, setReduceMotion] = useState(false);

  // This card's own pointer/drag aim (-1..1), and whether it's live (1) or
  // the idle drift should lead (0). Also the press lift and the shine clock.
  const [v] = useState(() => ({
    aim: new Animated.ValueXY({ x: 0, y: 0 }),
    live: new Animated.Value(0),
    lift: new Animated.Value(1),
    shine: new Animated.Value(0),
  }));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  const animate = !reduceMotion;
  const canDrag = interactive && animate;
  const canHover = Platform.OS === 'web' && animate;
  const shared = useSharedTilt(useMotion && animate);
  const drift = useIdleDrift(animate);
  const offset = offsetFor(item.id);

  // The shine: sweep across in 45% of a 3.6s cycle, then rest. Per card, so
  // cards in a grid don't all flash at once.
  useEffect(() => {
    if (!animate) return;
    v.shine.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(offset * 3600),
        Animated.timing(v.shine, { toValue: 1, duration: 1620, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: native }),
        Animated.delay(1980 - offset * 1980),
        Animated.timing(v.shine, { toValue: 0, duration: 0, useNativeDriver: native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, offset, v]);

  // Where the light is (-1..1 each way): the pointer while live, otherwise
  // the idle drift; plus the phone's tilt. Mappings below clamp.
  const light = useMemo(() => {
    const rest = Animated.subtract(1, v.live);
    const phase = offset * Math.PI * 2;
    const idleX = drift ? drift.phaseX.interpolate({ inputRange: SAMPLES, outputRange: wave(0.85, phase) }) : ZERO;
    const idleY = drift ? drift.phaseY.interpolate({ inputRange: SAMPLES, outputRange: wave(0.6, phase + Math.PI / 2) }) : ZERO;
    return {
      x: Animated.add(Animated.add(Animated.multiply(v.aim.x, v.live), Animated.multiply(idleX, rest)), shared?.x ?? ZERO),
      y: Animated.add(Animated.add(Animated.multiply(v.aim.y, v.live), Animated.multiply(idleY, rest)), shared?.y ?? ZERO),
    };
  }, [v, drift, shared, offset]);

  const clampTo = (n: number) => Math.max(-1, Math.min(1, n));
  // Pointer relative to the card's center, with some slack past the edges
  // (as in the original), clamped to -1..1.
  const aimAt = (x: number, y: number) => {
    v.aim.setValue({ x: clampTo((x - width / 2) / (width / 2 + 70)), y: clampTo((y - height / 2) / (height / 2 + 70)) });
    v.live.setValue(1);
  };
  const letGo = () => {
    Animated.timing(v.live, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  };
  const springLift = (to: number) =>
    Animated.spring(v.lift, { toValue: to, friction: 7, tension: 80, useNativeDriver: native }).start();

  // Finger or mouse drag: tilt toward it and lift; a tap (barely moved) calls onTap.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canDrag || !!onTap,
        onMoveShouldSetPanResponder: () => canDrag,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          if (canDrag) {
            aimAt(locationX, locationY);
            springLift(1.04);
          }
        },
        onPanResponderMove: (e) => {
          if (canDrag) aimAt(e.nativeEvent.locationX, e.nativeEvent.locationY);
        },
        onPanResponderRelease: (_e, g) => {
          springLift(1);
          if (!canHover) letGo();
          if (Math.hypot(g.dx, g.dy) <= TAP_SLOP) onTap?.();
        },
        onPanResponderTerminate: () => {
          springLift(1);
          letGo();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canDrag, canHover, onTap, width, height],
  );

  // Hover on web, no click needed. Works in grids too.
  const webHover = canHover
    ? {
        onPointerMove: (e: { nativeEvent: { offsetX?: number; offsetY?: number } }) => {
          const { offsetX = 0, offsetY = 0 } = e.nativeEvent;
          aimAt(offsetX, offsetY);
        },
        onPointerLeave: letGo,
      }
    : {};

  // Map the light (-1..1) onto a range, clamped.
  const span = (range: [number, number], value: Animated.AnimatedAddition) =>
    value.interpolate({ inputRange: [-1, 1], outputRange: range, extrapolate: 'clamp' });
  const turn = (range: [string, string], value: Animated.AnimatedAddition) =>
    value.interpolate({ inputRange: [-1, 1], outputRange: range, extrapolate: 'clamp' });

  const rotateY = turn([`-${TILT}deg`, `${TILT}deg`], light.x);
  const rotateX = turn([`${TILT}deg`, `-${TILT}deg`], light.y);
  // Foil layers are 220% of the card; sliding them by the light reads as the
  // rainbow moving across the surface.
  const foilX = span([0, -width * 1.2], light.x);
  const foilY = span([0, -height * 1.2], light.y);
  const artX = span([width * DEPTH, -width * DEPTH], light.x);
  const artY = span([width * DEPTH, -width * DEPTH], light.y);
  const glareD = Math.hypot(width, height) * 0.8;
  const glareX = span([-glareD / 2, width - glareD / 2], light.x);
  const glareY = span([-glareD / 2, height - glareD / 2], light.y);
  const shadowX = span([TILT * 0.6, -TILT * 0.6], light.x);
  const shineX = v.shine.interpolate({ inputRange: [0, 1], outputRange: [-width * 1.3, width * 1.3] });

  const corner = 5 * u;
  const inset = 3.6 * u;
  const glyph = item.art?.glyph ?? item.name.slice(0, 2).toUpperCase();
  const supply = item.total_supply.toLocaleString('en-US');
  const edgeId = `edge-${item.id}`;
  const glareId = `glare-${item.id}`;

  const foilLayer = (w: number, h: number) => (
    <Animated.View
      pointerEvents="none"
      style={[styles.foil, { width: w * 2.2, height: h * 2.2, transform: [{ translateX: foilX }, { translateY: foilY }] }]}
    >
      <LinearGradient colors={foil.colors} locations={foil.locations} {...FOIL_DIR} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );

  return (
    <View style={{ width, height }} {...pan.panHandlers} {...(webHover as object)}>
      {interactive ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.aura, { borderRadius: corner, transform: [{ translateX: shadowX }] }]}
        />
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shadow,
          { top: height * 0.04, bottom: -height * 0.01 + 14, left: width * 0.05, right: width * 0.05, borderRadius: corner },
          { transform: [{ translateX: shadowX }] },
        ]}
      />
      <Animated.View
        accessible
        accessibilityRole={onTap ? 'button' : 'image'}
        accessibilityLabel={`${item.name}, ${item.tier_name} card${item.team_name ? `, ${item.team_name}` : ''}${serial ? `, number ${serial} of ${supply}` : ''}`}
        style={[
          styles.face,
          { width, height, borderRadius: corner },
          { transform: [{ perspective: 900 }, { rotateX: animate ? rotateX : '0deg' }, { rotateY: animate ? rotateY : '0deg' }, { scale: v.lift }] },
        ]}
      >
        {/* Frame, and the foil over it */}
        <LinearGradient colors={palette.frame} {...FRAME_DIR} style={StyleSheet.absoluteFill} />
        {foilLayer(width, height)}

        {/* Art window: the art moves a little against the frame (depth) */}
        <View style={[styles.window, { top: inset, right: inset, bottom: inset, left: inset, borderRadius: 1.4 * u }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: artX }, { translateY: artY }, { scale: 1.047 }] }]}>
            <LinearGradient colors={palette.panel} style={[StyleSheet.absoluteFill, styles.panel]}>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <CourtLines />
              </View>

              <View style={[styles.topRow, { padding: 12 * s }]}>
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

              <View style={{ padding: 12 * s }}>
                <Text style={[styles.name, { fontSize: 32 * s, lineHeight: 34 * s }]} numberOfLines={1} adjustsFontSizeToFit>
                  {item.name}
                </Text>
                {item.subtitle ? (
                  <Text style={[styles.subtitle, { fontSize: 14 * s }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text style={[styles.serial, { fontSize: 13 * s, marginTop: 6 * s }]}>
                  {serial ? `#${serial.toLocaleString('en-US')} of ${supply}` : `${supply} made`}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
          {foilLayer(width - inset * 2, height - inset * 2)}
        </View>

        {/* Brushed texture over everything, then light */}
        <Image source={brushed} resizeMode="repeat" style={styles.texture} accessible={false} />
        <Animated.View
          pointerEvents="none"
          style={[styles.glare, { width: glareD, height: glareD, transform: [{ translateX: glareX }, { translateY: glareY }] }]}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id={glareId} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={card.glare} stopOpacity={0.95} />
                <Stop offset="1" stopColor={card.glare} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50%" cy="50%" r="50%" fill={`url(#${glareId})`} />
          </Svg>
        </Animated.View>
        {animate ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.shine, { transform: [{ translateX: shineX }] }]}>
            <LinearGradient
              colors={['transparent', card.shine, 'transparent']}
              locations={[0.38, 0.5, 0.62]}
              {...SHINE_DIR}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : null}

        {/* Rainbow rim */}
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgGradient id={edgeId} x1="0" y1="0" x2="1" y2="1">
              {card.edge.map((color, i) => (
                <Stop key={`${color}${i}`} offset={i / (card.edge.length - 1)} stopColor={color} />
              ))}
            </SvgGradient>
          </Defs>
          <Rect x={1.25} y={1.25} width={width - 2.5} height={height - 2.5} rx={corner - 1.25} fill="none" stroke={`url(#${edgeId})`} strokeWidth={2.5} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  aura: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: card.auraFill, boxShadow: card.aura },
  shadow: { position: 'absolute', boxShadow: card.dropShadow },
  face: { overflow: 'hidden' },
  foil: { position: 'absolute', top: 0, left: 0, opacity: 0.25, mixBlendMode: 'overlay' },
  window: { position: 'absolute', overflow: 'hidden' },
  panel: { justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: fonts.bodyBold, letterSpacing: 0.4 },
  glyph: { fontFamily: fonts.displayHeavy, textAlign: 'center', opacity: 0.92, letterSpacing: -2 },
  name: { fontFamily: fonts.displayHeavy, color: card.ink },
  subtitle: { fontFamily: fonts.bodyMedium, color: card.inkMuted },
  serial: { fontFamily: fonts.bodyBold, color: card.ink, fontVariant: ['tabular-nums'] },
  texture: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.9 },
  glare: { position: 'absolute', top: 0, left: 0, opacity: 0.38, mixBlendMode: 'screen' },
  shine: { mixBlendMode: 'screen' },
});
