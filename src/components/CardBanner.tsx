import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { card, fonts, holo } from '@/theme';

export type BannerTone = 'neutral' | 'holo';

// A band across the middle of a card. Sits on top of the card (never baked
// into a slab photo).
//   neutral  dark band, e.g. "All claimed" when no copies are left
//   holo     holographic band, e.g. "Yours" on cards you own
export function CardBanner({ label, width, tone = 'neutral' }: { label: string; width: number; tone?: BannerTone }) {
  const s = width / 300;
  const isHolo = tone === 'holo';
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.band, !isHolo && styles.neutral, { paddingVertical: 10 * s }]}>
        {isHolo ? (
          <LinearGradient colors={holo.stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        ) : null}
        <Text style={[styles.text, { color: isHolo ? holo.ink : card.banner.ink, fontSize: 26 * s, letterSpacing: 3 * s }]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center' },
  band: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: card.banner.edge,
    alignItems: 'center',
    overflow: 'hidden',
  },
  neutral: { backgroundColor: card.banner.fill },
  text: { fontFamily: fonts.displayHeavy },
});
