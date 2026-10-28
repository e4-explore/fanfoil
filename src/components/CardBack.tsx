import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import { cssAngle, repeatedRainbow } from '@/components/holoMotion';
import { card, holo } from '@/theme';

const PANEL_DIR = cssAngle(160);
const FOIL_DIR = cssAngle(115);
const foil = repeatedRainbow(holo.stops);

// The face-down side shown before a card is revealed: a dark panel under a
// faint holographic wash, a thin inner frame with a crosshatch, and a
// double-ring medallion around the card's league logo.
// Proportions follow the card front (all relative to the card's width).
export function CardBack({ width, logoUrl }: { width: number; logoUrl?: string | null }) {
  const height = Math.round(width * 1.4);
  const u = width / 100; // 1% of the card's width
  const inset = 3.6 * u;
  const corner = 5 * u;
  const hatch = 3 * u;
  const innerRing = 8.9 * u;
  const outerRing = 15.1 * u;
  return (
    <View style={[styles.card, { width, height, borderRadius: corner }]}>
      <LinearGradient colors={card.back.panel} {...PANEL_DIR} style={StyleSheet.absoluteFill} />
      {/* Holo wash, still (the back never tilts) */}
      <View style={[styles.wash, { left: -width * 0.6, top: -height * 0.6, width: width * 2.2, height: height * 2.2 }]} pointerEvents="none">
        <LinearGradient colors={foil.colors} locations={foil.locations} {...FOIL_DIR} style={StyleSheet.absoluteFill} />
      </View>

      <View
        style={[
          styles.frame,
          { top: inset, right: inset, bottom: inset, left: inset, borderRadius: Math.max(0.5 * u, corner - inset), borderWidth: Math.max(1, 0.3 * u) },
        ]}
      >
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="hatch" width={hatch} height={hatch} patternUnits="userSpaceOnUse">
              <Line x1="0" y1="0" x2={hatch} y2={hatch} stroke={card.back.hatch} strokeWidth={Math.max(0.6, 0.3 * u)} />
              <Line x1={hatch} y1="0" x2="0" y2={hatch} stroke={card.back.hatch} strokeWidth={Math.max(0.6, 0.3 * u)} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#hatch)" />
        </Svg>
      </View>

      <View style={styles.medallion} pointerEvents="none">
        <Svg width={outerRing * 2 + 2} height={outerRing * 2 + 2} style={styles.rings}>
          <Circle cx={outerRing + 1} cy={outerRing + 1} r={outerRing - 0.25 * u} stroke={card.back.ringOuter} strokeWidth={Math.max(1, 0.5 * u)} fill="none" />
          <Circle cx={outerRing + 1} cy={outerRing + 1} r={innerRing} stroke={card.back.ringInner} strokeWidth={Math.max(1, 0.6 * u)} fill="none" />
        </Svg>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            // the logo file has built-in padding; this fills the inner ring
            style={{ width: innerRing * 1.9, height: innerRing * 1.9 }}
            resizeMode="contain"
            accessible={false}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', boxShadow: card.dropShadow },
  wash: { position: 'absolute', opacity: 0.25, mixBlendMode: 'overlay' },
  frame: { position: 'absolute', borderColor: card.back.frame, overflow: 'hidden' },
  medallion: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  rings: { position: 'absolute' },
});
