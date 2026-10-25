import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Rect } from 'react-native-svg';

import { colors, fonts, radius } from '@/theme';

// The face-down side shown before a card is revealed.
export function CardBack({ width, label = 'Tap to reveal' }: { width: number; label?: string }) {
  const height = Math.round(width * 1.4);
  const s = width / 300;
  return (
    <View style={[styles.stock, { width, height, borderRadius: radius.card * s }]}>
      <LinearGradient colors={['#262A5E', colors.arenaDeep]} style={[styles.panel, { borderRadius: (radius.card - 6) * s }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <Pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse">
              <Line x1="0" y1="0" x2="18" y2="18" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <Line x1="18" y1="0" x2="0" y2="18" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#weave)" />
          <Circle cx="50%" cy="46%" r={58 * s} stroke={colors.shotClock} strokeWidth={3 * s} fill="none" />
          <Line x1="0" y1="46%" x2="100%" y2="46%" stroke={colors.shotClock} strokeWidth={1.5 * s} opacity={0.7} />
        </Svg>
        <Text style={[styles.label, { fontSize: 18 * s, bottom: 28 * s }]}>{label}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  stock: { padding: 7, backgroundColor: '#3A3F7A' },
  panel: { flex: 1, overflow: 'hidden', alignItems: 'center' },
  label: { position: 'absolute', fontFamily: fonts.display, color: colors.chalk, letterSpacing: 0.5 },
});
