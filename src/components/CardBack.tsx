import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import { card, radius } from '@/theme';

// The face-down side shown before a card is revealed: a woven panel with the
// center-court circle and the card's league logo inside it.
export function CardBack({ width, logoUrl }: { width: number; logoUrl?: string | null }) {
  const height = Math.round(width * 1.4);
  const s = width / 300;
  const ring = 58 * s;
  return (
    <View style={[styles.stock, { width, height, borderRadius: radius.card * s }]}>
      <LinearGradient colors={card.back.panel} style={[styles.panel, { borderRadius: (radius.card - 6) * s }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse">
              <Line x1="0" y1="0" x2="18" y2="18" stroke={card.back.weave} strokeWidth="1" />
              <Line x1="18" y1="0" x2="0" y2="18" stroke={card.back.weave} strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#weave)" />
          <Circle cx="50%" cy="50%" r={ring} stroke={card.back.mark} strokeWidth={3 * s} fill="none" />
        </Svg>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={{ width: ring * 1.6, height: ring * 1.6 /* file has built-in padding; fills ~80% of the circle */ }}
            resizeMode="contain"
            accessible={false}
          />
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  stock: { padding: 7, backgroundColor: card.back.stock },
  panel: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
