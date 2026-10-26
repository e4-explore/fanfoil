import { Image, StyleSheet, Text, View } from 'react-native';

import type { CopyLabel, InventoryItem } from '@/lib/types';
import { card, fonts, radius } from '@/theme';

// A vaulted card: a real graded card in its slab. We show only an unedited
// photo of the slab (no overlays or effects on the photo itself) under a
// plain label with the facts that identify that specific card. Until a card
// is photographed, a neutral placeholder stands in. Never draw card art here.
//
// Browsing shows the card type ("50 made"); an owned copy shows its number in
// the edition and its own cert ("#2 of 50 · Cert ...").
export function SlabCard({
  item,
  width,
  serial,
  copy,
}: {
  item: InventoryItem;
  width: number;
  serial?: number;
  copy?: CopyLabel | null;
}) {
  const height = Math.round(width * 1.4);
  const s = width / 300; // scale with card width, like the foil cards
  const facts = [item.card_year, item.card_set, item.card_number].filter(Boolean).join(' ');
  const grade = [item.grader, item.grade].filter(Boolean).join(' ');
  const supply = item.total_supply.toLocaleString('en-US');
  const editionLine = serial
    ? [`#${serial.toLocaleString('en-US')} of ${supply}`, copy?.cert_number ? `Cert ${copy.cert_number}` : null]
        .filter(Boolean)
        .join(' · ')
    : `${supply} made`;
  const photo = copy?.photo_front_url ?? item.photo_front_url;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${item.name}${facts ? `, ${facts}` : ''}${grade ? `, graded ${grade}` : ''}, ${editionLine}${item.is_sample ? ', sample card' : ''}`}
      style={[styles.shell, { width, height, borderRadius: radius.card * s, padding: 8 * s }]}
    >
      <View style={[styles.label, { borderRadius: 6 * s, paddingHorizontal: 10 * s, paddingVertical: 8 * s }]}>
        <View style={styles.labelRow}>
          <Text style={[styles.player, { fontSize: 20 * s, lineHeight: 22 * s }]} numberOfLines={1} adjustsFontSizeToFit>
            {item.player_name ?? item.name}
          </Text>
          {grade ? <Text style={[styles.grade, { fontSize: 20 * s, lineHeight: 22 * s }]}>{grade}</Text> : null}
        </View>
        <Text style={[styles.meta, { fontSize: 12 * s, marginTop: 2 * s }]} numberOfLines={1}>
          {[facts, item.team_abbreviation].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[styles.meta, { fontSize: 11 * s }]} numberOfLines={1}>
          {editionLine}
        </Text>
      </View>

      <View style={[styles.window, { marginTop: 8 * s, borderRadius: 6 * s }]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Text style={[styles.placeholder, { fontSize: 14 * s, paddingHorizontal: 16 * s }]}>
            Photo added when the card is vaulted
          </Text>
        )}
        {item.is_sample ? (
          <View style={[styles.sample, { top: 8 * s, right: 8 * s, borderRadius: 4 * s, paddingHorizontal: 6 * s }]}>
            <Text style={[styles.sampleText, { fontSize: 11 * s }]}>SAMPLE</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: card.slab.shell, borderWidth: 1, borderColor: card.slab.edge },
  label: { backgroundColor: card.slab.label },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  player: { flex: 1, fontFamily: fonts.displayHeavy, color: card.slab.labelInk },
  grade: { fontFamily: fonts.displayHeavy, color: card.slab.labelInk },
  meta: { fontFamily: fonts.bodyMedium, color: card.slab.labelMuted },
  window: { flex: 1, backgroundColor: card.slab.window, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  placeholder: { fontFamily: fonts.bodyMedium, color: card.slab.windowInk, textAlign: 'center' },
  sample: { position: 'absolute', backgroundColor: card.slab.sample },
  sampleText: { fontFamily: fonts.bodyBold, color: card.slab.sampleInk, letterSpacing: 0.5 },
});
