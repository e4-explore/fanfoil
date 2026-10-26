import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardBack } from '@/components/CardBack';
import { CardBanner } from '@/components/CardBanner';
import { CardTile } from '@/components/CardGrid';
import { FlipCard } from '@/components/FlipCard';
import { GlassTabBar } from '@/components/GlassTabBar';
import { HoloCard } from '@/components/HoloCard';
import { SlabCard } from '@/components/SlabCard';
import { SocialButton } from '@/components/SocialButton';
import { TeamLogo } from '@/components/TeamLogo';
import {
  BackButton,
  Button,
  Chips,
  Field,
  HoloFill,
  Lede,
  Notice,
  Row,
  Segmented,
  Spinner,
  Tag,
  Text,
  Title,
} from '@/components/ui';
import { card, makeStyles, ThemeScope, useTheme, type Theme, type TypeVariant } from '@/theme';

import { roleCard, sampleCopy, sampleTeam, slabCard, storylineCard, teamWithoutLogo } from './fixtures';
import usage from './usage.json';

// A living style guide: every token and component, rendered from the real
// theme and components, in light and dark. Edit src/theme or a component and
// this page (and the app) update together. Development builds only.
// "Used in" comes from usage.json; refresh it with `npm run styleguide:usage`.

type Mode = 'light' | 'dark' | 'both';
const noop = () => {};

export function StyleGuide() {
  const device = useTheme().mode;
  const [mode, setMode] = useState<Mode>(device);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const sideBySide = mode === 'both' && width >= 900;
  const modes: ('light' | 'dark')[] = mode === 'both' ? ['light', 'dark'] : [mode];

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={styles.intro}>
        <Title>Style guide</Title>
        <Lede>
          Every token and component in Fanfoil, rendered from the real theme. Change src/theme or a component and this
          page updates with the app.
        </Lede>
        <Segmented
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'both', label: 'Both' },
          ]}
        />
      </View>
      <View style={sideBySide ? styles.columns : undefined}>
        {modes.map((m) => (
          <ThemeScope key={m} mode={m}>
            <Guide label={mode === 'both' ? (m === 'light' ? 'Light' : 'Dark') : undefined} />
          </ThemeScope>
        ))}
      </View>
    </ScrollView>
  );
}

function Guide({ label }: { label?: string }) {
  const styles = useStyles();
  const t = useTheme();
  return (
    <View style={styles.guide}>
      {label ? <Text variant="title">{label}</Text> : null}

      <Section title="Colors" note="Semantic tokens (t.color). Contrast is against background and surface; text needs 4.5:1, borders and indicators 3:1.">
        {Object.entries(t.color).map(([name, value]) => (
          <Swatch key={name} name={`color.${name}`} value={value} />
        ))}
      </Section>

      <Section title="Holographic primary" note="t.holo stops (primary buttons, selections) and t.color.accent (borders, spinners, active tab).">
        <View style={styles.holo}>
          <HoloFill />
        </View>
        <Text variant="small" tone="muted">
          {t.holo.join('  →  ')}
        </Text>
      </Section>

      <Section title="Glass" note="t.glass: the floating tab bar surface off iOS 26 (on iOS 26 the system Liquid Glass is used).">
        {Object.entries(t.glass).map(([name, value]) => (
          <Swatch key={name} name={`glass.${name}`} value={value} />
        ))}
      </Section>

      <Section title="Social sign-in" note="t.social: Google and Apple button colors (inverted from the page for emphasis).">
        {(['fill', 'ink', 'stroke'] as const).map((name) => (
          <Swatch key={name} name={`social.${name}`} value={t.social[name]} />
        ))}
      </Section>

      <Section title="Card art" note="card.* palette: the same in light and dark, because cards are physical-looking objects.">
        <View style={styles.cardSwatches}>
          {(['role', 'storyline'] as const).map((tier) => (
            <View key={tier} style={styles.cardSwatch}>
              <LinearGradient colors={card.foil[tier].panel} style={styles.cardPanel}>
                <View style={[styles.cardStock, { backgroundColor: card.foil[tier].stock }]} />
              </LinearGradient>
              <Text variant="small" tone="muted">{`foil.${tier}`}</Text>
            </View>
          ))}
          <View style={styles.cardSwatch}>
            <View style={[styles.cardPanel, { backgroundColor: card.slab.shell }]}>
              <View style={[styles.cardStock, { backgroundColor: card.slab.window }]} />
            </View>
            <Text variant="small" tone="muted">slab</Text>
          </View>
          <View style={styles.cardSwatch}>
            <View style={[styles.cardPanel, { backgroundColor: card.slab.window, justifyContent: 'center' }]}>
              <View style={[styles.bannerSwatch, { backgroundColor: card.banner.fill }]} />
            </View>
            <Text variant="small" tone="muted">banner</Text>
          </View>
        </View>
      </Section>

      <Section title="Typography" note="t.type: the only text styles. Use <Text variant tone>; never set font sizes in screens.">
        {(Object.entries(t.type) as [TypeVariant, Theme['type'][TypeVariant]][]).map(([variant, spec]) => (
          <View key={variant} style={styles.typeRow}>
            <Text variant={variant} numberOfLines={1}>
              {variant === 'title' || variant === 'heading' ? 'Pick your team' : 'Every card, rarest first'}
            </Text>
            <Text variant="small" tone="muted">{`${variant} · ${spec.fontSize}/${spec.lineHeight} · ${spec.fontFamily}`}</Text>
          </View>
        ))}
        <View style={styles.tones}>
          {(['default', 'muted', 'success', 'danger'] as const).map((tone) => (
            <Text key={tone} tone={tone}>{`tone="${tone}"`}</Text>
          ))}
        </View>
      </Section>

      <Section title="Spacing" note="t.space: all margins, padding, and gaps.">
        {Object.entries(t.space).map(([name, value]) => (
          <View key={name} style={styles.scaleRow}>
            <View style={[styles.scaleBar, { width: value * 4 }]} />
            <Text variant="small" tone="muted">{`space.${name} = ${value}`}</Text>
          </View>
        ))}
      </Section>

      <Section title="Radius and sizes" note="t.radius and t.size.">
        <View style={styles.radii}>
          {Object.entries(t.radius).map(([name, value]) => (
            <View key={name} style={styles.radiusItem}>
              <View style={[styles.radiusBox, { borderRadius: value }]} />
              <Text variant="small" tone="muted">{`radius.${name} = ${value}`}</Text>
            </View>
          ))}
        </View>
        {Object.entries(t.size).map(([name, value]) => (
          <Text key={name} variant="small" tone="muted">{`size.${name} = ${value}`}</Text>
        ))}
      </Section>

      <Text variant="title" style={styles.partTitle}>Components</Text>

      <Component name="Text, Title, Lede" uses={['ui.Text', 'ui.Title', 'ui.Lede']} note="All text. Title is a screen's main heading; Lede is the muted intro under it.">
        <Title>Title</Title>
        <Lede>Lede: the short intro under a title.</Lede>
      </Component>

      <Component name="Button" uses={['ui.Button']} note="primary: holographic with depth; colors and sheen follow hover and tap. secondary: solid accent. quiet: outlined. Disabled = the same look at 40% opacity. inline hugs its label.">
        <Button label="Primary" onPress={noop} />
        <Button label="Primary disabled" disabled onPress={noop} style={styles.stack} />
        <Button label="Loading" loading onPress={noop} style={styles.stack} />
        <Button label="Secondary" variant="secondary" onPress={noop} style={styles.stack} />
        <Button label="Secondary disabled" variant="secondary" disabled onPress={noop} style={styles.stack} />
        <Button label="Quiet" variant="quiet" onPress={noop} style={styles.stack} />
        <Button label="Inline quiet" variant="quiet" inline onPress={noop} style={styles.stack} />
      </Component>

      <Component name="SocialButton" uses={['SocialButton.SocialButton']} note="Google / Apple sign-in. Follows Google's and Apple's button rules.">
        <SocialButton provider="google" onPress={noop} />
        <SocialButton provider="apple" onPress={noop} style={styles.stack} />
      </Component>

      <Component name="BackButton" uses={['ui.BackButton']} note="Top-left of a screen. Disabled once a choice is locked in.">
        <View style={styles.inlineRow}>
          <BackButton onPress={noop} />
          <BackButton onPress={noop} disabled />
        </View>
      </Component>

      <Component name="Field" uses={['ui.Field']} note="Labeled text input. Accent border when focused.">
        <Field label="Email" placeholder="you@example.com" />
        <Field label="Display name" defaultValue="fan8" />
      </Component>

      <Component name="Row" uses={['ui.Row']} note="Tappable list row: leading (e.g. team logo), title, detail, trailing. Selected and disabled states.">
        <Row title="Minnesota Timberwolves" detail="Switch teams" leading={<TeamLogo team={sampleTeam} />} onPress={noop} />
        <Row title="Selected row" selected onPress={noop} />
        <Row title="NFL" detail="National Football League" disabled trailing={<Tag label="Coming soon" />} />
      </Component>

      <Component name="Segmented" uses={['ui.Segmented']} note="2 to 3 mutually exclusive options that fit in one row.">
        <SegmentedDemo />
      </Component>

      <Component name="Chips" uses={['ui.Chips']} note="Single choice from many options; scrolls sideways. Optional icon per chip.">
        <ChipsDemo />
      </Component>

      <Component name="Tag, Notice, Spinner" uses={['ui.Tag', 'ui.Notice', 'ui.Spinner']} note="Small label; inline message (info or error); loading indicator.">
        <Tag label="Coming soon" />
        <Notice text="These are sample cards for testing." />
        <Notice tone="error" text="That email and password don't match." />
        <Spinner style={styles.stack} />
      </Component>

      <Component name="TeamLogo" uses={['TeamLogo.TeamLogo']} note="Team logo for the current mode; falls back to the abbreviation.">
        <View style={styles.inlineRow}>
          <TeamLogo team={sampleTeam} />
          <TeamLogo team={sampleTeam} size="sm" />
          <TeamLogo team={teamWithoutLogo} />
          <TeamLogo team={teamWithoutLogo} size="sm" />
        </View>
      </Component>

      <Component name="Cards" uses={['HoloCard.HoloCard', 'SlabCard.SlabCard', 'CardBack.CardBack', 'CollectibleCard.CollectibleCard']} note="HoloCard: Fanfoil Originals (foil art). SlabCard: vaulted cards (unedited slab photo, no effects). CardBack: face-down. CollectibleCard picks Holo vs Slab.">
        <View style={styles.cards}>
          <HoloCard item={roleCard} width={140} serial={12} />
          <HoloCard item={storylineCard} width={140} />
          <SlabCard item={slabCard} width={140} />
          <SlabCard item={slabCard} width={140} serial={3} copy={sampleCopy} />
          <CardBack width={140} logoUrl={roleCard.league_logo_dark_url} />
        </View>
      </Component>

      <Component name="FlipCard" uses={['FlipCard.FlipCard']} note="Face-down card that flips when revealed (claim screen).">
        <FlipDemo />
      </Component>

      <Component name="CardTile and CardBanner" uses={['CardGrid.CardTile', 'CardBanner.CardBanner']} note="Grid tile: card, caption, optional badge, and an optional banner: holo 'Yours' on cards you own, dark 'All claimed' when no copies are left.">
        <View style={styles.cards}>
          <CardTile width={140} onPress={noop} entry={{ key: 'a', item: roleCard, caption: '38 of 50 left', banner: { label: 'Yours', tone: 'holo' } }} />
          <CardTile width={140} onPress={noop} entry={{ key: 'b', item: storylineCard, caption: '0 of 10 left', banner: { label: 'All claimed', tone: 'neutral' } }} />
        </View>
        <View style={styles.bannerDemo}>
          <SlabCard item={slabCard} width={140} />
          <CardBanner label="All claimed" width={140} />
        </View>
      </Component>

      <Component name="GlassTabBar" uses={['GlassTabBar.GlassTabBar', 'GlassTabBar.useTabBarSpace']} note="Floating Liquid Glass tab bar. Tab screens add useTabBarSpace() of bottom padding.">
        <TabBarDemo />
      </Component>

      <Component name="Screen, Loading" uses={['ui.Screen', 'ui.Loading']} note="Screen: safe-area page with scrolling content and an optional pinned footer. Loading: full-screen spinner. (Layout wrappers; not shown here.)" />
    </View>
  );
}

// ---------------------------------------------------------------------------

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="heading">{title}</Text>
      {note ? (
        <Text variant="small" tone="muted" style={styles.note}>
          {note}
        </Text>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Component({ name, uses, note, children }: { name: string; uses: string[]; note: string; children?: ReactNode }) {
  const styles = useStyles();
  const usedIn = [...new Set(uses.flatMap((key) => (usage as Record<string, string[]>)[key] ?? []))].sort();
  return (
    <View style={styles.component}>
      <Text variant="heading">{name}</Text>
      <Text variant="small" tone="muted" style={styles.note}>
        {note}
      </Text>
      {children ? <View style={styles.demo}>{children}</View> : null}
      <Text variant="smallStrong" style={styles.usedInTitle}>{`Used in (${usedIn.length})`}</Text>
      <Text variant="small" tone="muted">
        {usedIn.length ? usedIn.join('\n') : 'Not used yet'}
      </Text>
    </View>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  const styles = useStyles();
  const t = useTheme();
  const ratios = contrastNotes(value, t);
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: value }]} />
      <View style={styles.fill}>
        <Text variant="bodyStrong">{name}</Text>
        <Text variant="small" tone="muted">
          {[value, ratios].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </View>
  );
}

function SegmentedDemo() {
  const [v, setV] = useState<'all' | 'vaulted' | 'original'>('all');
  return (
    <Segmented
      label="Card type"
      value={v}
      onChange={setV}
      options={[
        { value: 'all', label: 'All' },
        { value: 'vaulted', label: 'Vaulted' },
        { value: 'original', label: 'Originals' },
      ]}
    />
  );
}

function ChipsDemo() {
  const [v, setV] = useState('min');
  return (
    <Chips
      label="Team"
      value={v}
      onChange={setV}
      options={[
        { value: 'min', label: 'Timberwolves', icon: <TeamLogo team={sampleTeam} size="sm" /> },
        { value: 'new', label: 'No logo', icon: <TeamLogo team={teamWithoutLogo} size="sm" /> },
        { value: 'plain', label: 'Plain chip' },
      ]}
    />
  );
}

function FlipDemo() {
  const styles = useStyles();
  const [revealed, setRevealed] = useState(false);
  return (
    <View>
      <FlipCard item={roleCard} width={140} revealed={revealed} />
      <Button label={revealed ? 'Flip back' : 'Reveal'} variant="secondary" onPress={() => setRevealed((r) => !r)} style={styles.stack} />
    </View>
  );
}

function TabBarDemo() {
  const styles = useStyles();
  const [index, setIndex] = useState(1);
  const tabs = [
    { key: 'collection', title: 'My cards', icon: 'albums' },
    { key: 'inventory', title: 'All cards', icon: 'grid' },
    { key: 'profile', title: 'Profile', icon: 'person-circle' },
  ] as const;
  const props = {
    state: { index, routes: tabs.map((tab) => ({ key: tab.key, name: tab.key })) },
    descriptors: Object.fromEntries(
      tabs.map((tab) => [
        tab.key,
        {
          options: {
            title: tab.title,
            tabBarIcon: ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
              <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} color={color as string} size={size} />
            ),
          },
        },
      ]),
    ),
    emitter: { emit: () => ({ defaultPrevented: false }) },
    navigateToTab: (key: string) => setIndex(tabs.findIndex((tab) => tab.key === key)),
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as unknown as BottomTabBarProps;
  return (
    <View style={styles.tabBarDemo}>
      <GlassTabBar {...props} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Contrast (WCAG) for hex colors against the page and surface.

function luminance(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function contrastNotes(value: string, t: Theme) {
  const onBg = ratio(value, t.color.background);
  const onSurface = ratio(value, t.color.surface);
  if (onBg == null || onSurface == null) return null;
  return `${onBg.toFixed(1)}:1 on background, ${onSurface.toFixed(1)}:1 on surface`;
}

const useStyles = makeStyles((t) => ({
  page: { flex: 1, backgroundColor: t.color.background },
  intro: { paddingHorizontal: t.space.md, paddingTop: t.space.lg, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  columns: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', maxWidth: 1200, alignSelf: 'center' },
  guide: { flex: 1, backgroundColor: t.color.background, padding: t.space.md, paddingBottom: t.space.xl },
  partTitle: { marginTop: t.space.xl },
  section: { marginTop: t.space.xl },
  sectionBody: { marginTop: t.space.sm, gap: t.space.sm },
  component: {
    marginTop: t.space.lg,
    padding: t.space.md,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
  },
  demo: { marginTop: t.space.md, paddingTop: t.space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.color.border },
  note: { marginTop: t.space.xs },
  usedInTitle: { marginTop: t.space.md },
  stack: { marginTop: t.space.sm },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, flexWrap: 'wrap' },
  fill: { flex: 1 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  swatch: { width: t.size.touch, height: t.size.touch, borderRadius: t.radius.sm, borderWidth: 1, borderColor: t.color.border },
  holo: { height: t.size.control, borderRadius: t.radius.md, overflow: 'hidden' },
  cardSwatches: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md },
  cardSwatch: { alignItems: 'center', gap: t.space.xs },
  cardPanel: { width: 64, height: 90, borderRadius: t.radius.sm, padding: t.space.sm, overflow: 'hidden' },
  cardStock: { flex: 1, borderRadius: t.space.xs, opacity: 0.85 },
  bannerSwatch: { height: t.space.md },
  typeRow: { gap: t.space.xxs },
  tones: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md },
  scaleRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  scaleBar: { height: t.space.md, backgroundColor: t.color.accent, borderRadius: t.space.xxs },
  radii: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md },
  radiusItem: { alignItems: 'center', gap: t.space.xs },
  radiusBox: { width: 56, height: 56, backgroundColor: t.color.sunken, borderWidth: 1, borderColor: t.color.borderStrong },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.md },
  bannerDemo: { marginTop: t.space.md, width: 140 },
  tabBarDemo: { height: t.size.tabBar + t.space.xl, position: 'relative', borderRadius: t.radius.md, backgroundColor: t.color.sunken, overflow: 'hidden' },
}));
