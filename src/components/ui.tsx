import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HoloButton } from '@/components/HoloButton';
import { FocusRing, GradientRing, noBrowserOutline, Text, type Tone } from '@/components/primitives';
import { makeStyles, radius, size, useTheme } from '@/theme';

export { FocusRing, noBrowserOutline, Text };

// ---------------------------------------------------------------------------
// Text: Text itself lives in primitives.tsx; these are the fixed roles.
// ---------------------------------------------------------------------------

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" variant="title">
      {children}
    </Text>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <Text tone="muted" style={styles.lede}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Screen({
  children,
  scroll = true,
  footer,
  bottomSpace,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  bottomSpace?: number; // room to leave at the end, e.g. useTabBarSpace() on tab screens
}) {
  const styles = useStyles();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const inner = <View style={styles.column}>{children}</View>;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {scroll ? (
        // "handled": with the keyboard up (e.g. after a search), the first tap
        // on a row selects it instead of only dismissing the keyboard.
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomSpace ?? t.space.xl + insets.bottom }]}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.fill]}>{inner}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: t.space.md + insets.bottom }]}>{footer}</View> : null}
    </View>
  );
}

// Fills its parent with the holographic gradient (primary actions, selections).
export function HoloFill() {
  const t = useTheme();
  return (
    <LinearGradient
      colors={t.holo}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

type PressState = { pressed: boolean; focused?: boolean };


// Top-left of a screen, above the title.
export function BackButton({
  onPress,
  label = 'Back',
  disabled,
}: {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }: PressState) => [styles.back, noBrowserOutline, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {({ focused }: PressState) => (
        <>
          {focused ? <FocusRing radius={radius.sm} /> : null}
          <Text variant="label" tone="muted">{`‹ ${label}`}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  inline,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'minimal';
  loading?: boolean;
  disabled?: boolean;
  inline?: boolean; // hug the label (left-aligned links like "Show password")
  style?: StyleProp<ViewStyle>;
}) {
  // primary    HoloButton: violet base with a holographic foil (see HoloButton)
  // secondary  solid violet, a little softer than the accent
  // quiet      outlined surface
  // minimal    no fill or outline, violet label (lesser actions under a main one)
  // Disabled: the same look at 40% opacity.
  const styles = useStyles();
  const t = useTheme();
  if (variant === 'primary') {
    return <HoloButton label={label} onPress={onPress} disabled={disabled} loading={loading} style={style} />;
  }
  const isDisabled = disabled || loading;
  const tone: Tone = variant === 'secondary' ? 'onSecondary' : variant === 'minimal' ? 'accent' : 'default';
  const spinner = variant === 'secondary' ? t.color.onSecondary : variant === 'minimal' ? t.color.accent : t.color.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }: PressState) => [
        styles.button,
        noBrowserOutline,
        variant === 'secondary' && styles.secondary,
        variant === 'quiet' && styles.quiet,
        inline && styles.inline,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {({ focused }: PressState) => (
        <>
          {focused ? <FocusRing radius={radius.md} /> : null}
          {loading ? (
            <ActivityIndicator color={spinner} />
          ) : (
            <Text variant="label" tone={tone}>
              {label}
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, onFocus, onBlur, ...rest } = props;
  const styles = useStyles();
  const t = useTheme();
  // Our own focus state on every platform, instead of the browser's default
  // outline on web and nothing on native: the gradient takes the place of
  // the field's border, so nothing shifts or doubles up.
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
        placeholderTextColor={t.color.textMuted}
        selectionColor={t.color.accent}
        style={[styles.input, noBrowserOutline, focused && styles.inputFocused, style]}
        accessibilityLabel={label}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
          {...rest}
        />
        {focused ? <GradientRing radius={radius.md} /> : null}
      </View>
    </View>
  );
}

export function Row({
  title,
  detail,
  onPress,
  selected,
  disabled,
  leading,
  trailing,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean; // shown but not choosable (e.g. "Coming soon")
  leading?: ReactNode; // e.g. a team logo, before the title
  trailing?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: PressState) => [
        styles.row,
        noBrowserOutline,
        disabled && styles.rowDisabled,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      {({ focused }: PressState) => (
        <>
      {selected ? <SelectionRing radius={radius.md} border={1} /> : null}
      {/* The selection ring already marks it; don't stack a second ring. */}
      {focused && !selected ? <FocusRing radius={radius.md} /> : null}
      {leading}
      <View style={styles.fill}>
        <Text variant="bodyStrong" tone={disabled ? 'muted' : 'default'}>
          {title}
        </Text>
        {detail ? (
          <Text variant="small" tone="muted">
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing}
        </>
      )}
    </Pressable>
  );
}

// A single-choice row of pills that scrolls sideways (e.g. one per team).
export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
}) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.chipsScroll}
      contentContainerStyle={styles.chips}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, noBrowserOutline, active && styles.chipActive]}
          >
            {({ focused }: PressState) => (
              <>
                {active ? <SelectionRing radius={size.segment / 2} border={1} /> : null}
                {/* The selection ring already marks it; no second ring. */}
                {focused && !active ? <FocusRing radius={size.segment / 2} offset={4} /> : null}
                {o.icon}
                <Text variant="labelSmall">{o.label}</Text>
              </>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// The selected state for chips, segments, and rows: the gradient outline
// around a lightly tinted inside. Drawn over the host's own border (`border`,
// its width) so selecting never shifts the content.
function SelectionRing({ radius, border = 0 }: { radius: number; border?: number }) {
  const styles = useStyles();
  return (
    <>
      <View
        style={[styles.ringFill, { top: -border, right: -border, bottom: -border, left: -border, borderRadius: radius }]}
        pointerEvents="none"
      >
        <View style={styles.ringTint} />
      </View>
      <GradientRing radius={radius - border} offset={border} />
    </>
  );
}

// Small pill label, e.g. "Coming soon".
export function Tag({ label }: { label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.tag}>
      <Text variant="smallStrong" tone="muted">
        {label}
      </Text>
    </View>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const styles = useStyles();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, noBrowserOutline]}
          >
            {({ focused }: PressState) => (
              <>
                {active ? <SelectionRing radius={size.segment / 2} /> : null}
                {focused ? <FocusRing radius={size.segment / 2} /> : null}
                <Text variant="labelSmall">{o.label}</Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' }) {
  const styles = useStyles();
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, tone === 'error' && styles.noticeError]}>
      <Text>{text}</Text>
    </View>
  );
}

export function Spinner({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <ActivityIndicator color={t.color.accent} style={style} />;
}

export function Loading() {
  const styles = useStyles();
  const t = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={t.color.accent} size="large" />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.color.background },
  scroll: { paddingHorizontal: t.space.md, paddingTop: t.space.lg, alignItems: 'center' },
  column: { width: '100%', maxWidth: t.size.maxContent },
  fill: { flex: 1 },
  lede: { marginTop: t.space.sm },
  footer: {
    paddingHorizontal: t.space.md,
    paddingTop: t.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.color.border,
    backgroundColor: t.color.background,
    alignItems: 'center',
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: t.size.touch,
    justifyContent: 'center',
    marginTop: -t.space.md,
    marginBottom: t.space.xs,
    borderRadius: t.radius.sm,
  },
  button: {
    minHeight: t.size.control,
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.space.lg,
    width: '100%',
    maxWidth: t.size.maxContent,
  },
  secondary: { backgroundColor: t.color.secondary },
  quiet: { backgroundColor: t.color.surface, borderWidth: 1, borderColor: t.color.border },
  // Hug the label (e.g. "Show password"), keeping the button's padding.
  inline: { alignSelf: 'flex-start', width: 'auto' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.4 },
  field: { marginTop: t.space.md },
  inputWrap: { marginTop: t.space.xs },
  inputFocused: { borderColor: 'transparent' },
  input: {
    ...t.type.body,
    minHeight: t.size.control,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.borderStrong,
    backgroundColor: t.color.surface,
    paddingHorizontal: t.space.md,
    color: t.color.text,
    fontSize: t.type.label.fontSize,
    // Web only: drop the browser's focus outline; FocusRing draws ours.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.md,
    minHeight: t.size.row,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
    marginTop: t.space.sm,
  },
  rowSelected: { borderColor: 'transparent' },
  rowPressed: { backgroundColor: t.color.sunken },
  // No opacity fade: muted text on the sunken surface still meets contrast.
  // No outline, dimmed: shown but not choosable.
  rowDisabled: { backgroundColor: t.color.sunken, borderColor: 'transparent', opacity: 0.6 },
  // Bleeds to the screen edges so chips scroll under the gutter.
  chipsScroll: { marginTop: t.space.md, marginHorizontal: -t.space.md },
  // Vertical room so a focused chip's ring isn't clipped by the scroll view.
  chips: { gap: t.space.sm, paddingHorizontal: t.space.md, paddingVertical: t.space.xs },
  chip: {
    flexDirection: 'row',
    gap: t.space.xs + t.space.xxs,
    minHeight: t.size.segment,
    paddingHorizontal: t.space.md,
    borderRadius: t.size.segment / 2,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: 'transparent' },
  ringFill: { position: 'absolute', backgroundColor: t.color.surface, overflow: 'hidden' },
  ringTint: { flex: 1, backgroundColor: t.color.accentTint },
  tag: {
    paddingHorizontal: t.space.sm,
    paddingVertical: t.space.xxs,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
  },
  // Same language as the floating tab bar: a pill track, and the selected
  // option on a soft capsule with an accent label.
  segmented: {
    flexDirection: 'row',
    gap: t.space.xxs,
    marginTop: t.space.md,
    padding: t.space.xs,
    borderRadius: (t.size.segment + t.space.xs * 2) / 2,
    backgroundColor: t.color.surface,
    borderWidth: 1,
    borderColor: t.glass.edge,
  },
  segment: {
    flex: 1,
    minHeight: t.size.segment,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.size.segment / 2,
  },
  notice: {
    marginTop: t.space.md,
    padding: t.space.md,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
  },
  noticeError: { borderColor: t.color.danger },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.color.background },
}));
