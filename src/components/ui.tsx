import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles, useTheme, type Theme, type TypeVariant } from '@/theme';

// ---------------------------------------------------------------------------
// Text: the only way screens render text. Pick a variant from the type scale
// and a tone; no font sizes or colors at the call site.
// ---------------------------------------------------------------------------

type Tone = 'default' | 'muted' | 'danger' | 'success' | 'onAction';

const toneColor = (t: Theme, tone: Tone) =>
  ({
    default: t.color.text,
    muted: t.color.textMuted,
    danger: t.color.danger,
    success: t.color.success,
    onAction: t.color.onAction,
  })[tone];

export function Text({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...rest
}: TextProps & { variant?: TypeVariant; tone?: Tone; align?: TextStyle['textAlign']; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <RNText style={[t.type[variant], { color: toneColor(t, tone), textAlign: align }, style]} {...rest} />;
}

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
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
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
          contentContainerStyle={[styles.scroll, { paddingBottom: t.space.xl + insets.bottom }]}
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
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.back,
        pressed && styles.pressed,
        disabled && styles.disabled,
        focused && styles.focused,
      ]}
    >
      <Text variant="label" tone="muted">{`‹ ${label}`}</Text>
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
  variant?: 'primary' | 'secondary' | 'quiet';
  loading?: boolean;
  disabled?: boolean;
  inline?: boolean; // hug the label (left-aligned links like "Show password")
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const t = useTheme();
  const isDisabled = disabled || loading;
  const holo = variant === 'primary' && !disabled;
  const tone: Tone = holo ? 'onAction' : variant === 'primary' && disabled ? 'muted' : 'default';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.button,
        variant === 'primary' && (holo ? styles.primary : styles.secondary),
        variant === 'secondary' && styles.secondary,
        variant === 'quiet' && styles.quiet,
        inline && styles.inline,
        pressed && styles.pressed,
        isDisabled && variant !== 'primary' && styles.disabled,
        focused && styles.focused,
        style,
      ]}
    >
      {holo ? <HoloFill /> : null}
      {loading ? (
        <ActivityIndicator color={holo ? t.color.onAction : t.color.text} />
      ) : (
        <Text variant={variant === 'quiet' ? 'labelSmall' : 'label'} tone={tone}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, onFocus, onBlur, ...rest } = props;
  const styles = useStyles();
  const t = useTheme();
  // Our own focus style (accent border) on every platform, instead of the
  // browser's default ring on web and nothing on native.
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <TextInput
        placeholderTextColor={t.color.textMuted}
        selectionColor={t.color.accent}
        style={[styles.input, focused && styles.inputFocused, style]}
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
    </View>
  );
}

export function Row({
  title,
  detail,
  onPress,
  selected,
  disabled,
  trailing,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean; // shown but not choosable (e.g. "Coming soon")
  trailing?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.row,
        disabled && styles.rowDisabled,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
        // The selected border already marks it; don't stack a second ring.
        focused && !selected && styles.focused,
      ]}
    >
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
  options: { value: T; label: string }[];
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
            style={({ focused }: { pressed: boolean; focused?: boolean }) => [
              styles.chip,
              active && styles.chipActive,
              // The holo fill already marks the active chip; no second ring.
              focused && !active && styles.focused,
            ]}
          >
            {active ? <HoloFill /> : null}
            <Text variant="labelSmall" tone={active ? 'onAction' : 'default'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
            style={({ focused }: { pressed: boolean; focused?: boolean }) => [styles.segment, focused && styles.focused]}
          >
            {active ? <HoloFill /> : null}
            <Text variant="labelSmall" tone={active ? 'onAction' : 'default'}>
              {o.label}
            </Text>
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
    overflow: 'hidden',
  },
  primary: {},
  secondary: { backgroundColor: t.color.surface, borderWidth: 1, borderColor: t.color.border },
  quiet: { backgroundColor: 'transparent', minHeight: t.size.touch },
  inline: { alignSelf: 'flex-start', width: 'auto', paddingHorizontal: 0 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },
  focused: { outlineColor: t.color.accent, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 } as ViewStyle,
  field: { marginTop: t.space.md },
  input: {
    ...t.type.body,
    marginTop: t.space.xs,
    minHeight: t.size.control,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.borderStrong,
    backgroundColor: t.color.surface,
    paddingHorizontal: t.space.md,
    color: t.color.text,
    fontSize: t.type.label.fontSize,
    // Web only: drop the browser's focus ring; inputFocused draws ours.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  // Border grows 1 -> 2, so padding shrinks by 1 to keep the text still.
  inputFocused: { borderColor: t.color.accent, borderWidth: 2, paddingHorizontal: t.space.md - 1 },
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
  // Border grows 1 -> 2; trim padding by 1 so the content doesn't shift.
  rowSelected: {
    borderColor: t.color.accent,
    borderWidth: 2,
    paddingHorizontal: t.space.md - 1,
    paddingVertical: t.space.sm - 1,
  },
  rowPressed: { backgroundColor: t.color.sunken },
  // No opacity fade: muted text on the sunken surface still meets contrast.
  rowDisabled: { backgroundColor: t.color.sunken },
  // Bleeds to the screen edges so chips scroll under the gutter.
  chipsScroll: { marginTop: t.space.md, marginHorizontal: -t.space.md },
  chips: { gap: t.space.sm, paddingHorizontal: t.space.md },
  chip: {
    minHeight: t.size.segment,
    paddingHorizontal: t.space.md,
    borderRadius: t.size.segment / 2,
    borderWidth: 1,
    borderColor: t.color.border,
    backgroundColor: t.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipActive: { borderColor: 'transparent' },
  tag: {
    paddingHorizontal: t.space.sm,
    paddingVertical: t.space.xxs,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border,
  },
  segmented: {
    flexDirection: 'row',
    gap: t.space.xxs,
    marginTop: t.space.md,
    padding: t.space.xxs,
    borderRadius: t.radius.md,
    backgroundColor: t.color.sunken,
    borderWidth: 1,
    borderColor: t.color.border,
  },
  segment: {
    flex: 1,
    minHeight: t.size.segment,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md - t.space.xxs,
    overflow: 'hidden',
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
