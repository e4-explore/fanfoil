import { StyleSheet, Text, View } from 'react-native';

import { card, fonts } from '@/theme';

// A band across the middle of a card, e.g. "Claimed" when no copies are left.
// Sits on top of the card (never baked into a slab photo).
export function CardBanner({ label, width }: { label: string; width: number }) {
  const s = width / 300;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.band, { paddingVertical: 10 * s }]}>
        <Text style={[styles.text, { fontSize: 26 * s, letterSpacing: 3 * s }]}>{label.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center' },
  band: {
    backgroundColor: card.banner.fill,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: card.banner.edge,
    alignItems: 'center',
  },
  text: { fontFamily: fonts.displayHeavy, color: card.banner.ink },
});
