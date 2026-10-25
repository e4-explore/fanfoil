import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, maxContentWidth, radius, space, type } from '@/theme';

export function Screen({
  children,
  scroll = true,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const inner = <View style={styles.column}>{children}</View>;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: space.xl + insets.bottom }]}>{inner}</ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1 }]}>{inner}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: space.md + insets.bottom }]}>{footer}</View> : null}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text accessibilityRole="header" style={type.title}>{children}</Text>;
}

export function Lede({ children }: { children: ReactNode }) {
  return <Text style={[type.bodyMuted, { marginTop: space.sm }]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.button,
        variant === 'primary' && (disabled ? styles.secondary : styles.primary),
        variant === 'secondary' && styles.secondary,
        variant === 'quiet' && styles.quiet,
        pressed && { opacity: 0.85 },
        isDisabled && variant !== 'primary' && { opacity: 0.45 },
        focused && styles.focused,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.shotClockInk : colors.chalk} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && !disabled ? { color: colors.shotClockInk } : { color: colors.chalk },
            variant === 'primary' && disabled && { color: colors.mist },
            variant === 'quiet' && { fontFamily: fonts.bodyMedium, fontSize: 15 },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginTop: space.md }}>
      <Text style={type.small}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mist}
        style={[styles.input, style]}
        accessibilityLabel={label}
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
  trailing,
}: {
  title: string;
  detail?: string;
  onPress: () => void;
  selected?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.row,
        selected && { borderColor: colors.shotClock },
        pressed && { backgroundColor: colors.line },
        focused && styles.focused,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontFamily: fonts.bodyBold }]}>{title}</Text>
        {detail ? <Text style={type.small}>{detail}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  );
}

export function Notice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'error' }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, tone === 'error' && { borderColor: colors.danger }]}
    >
      <Text style={[type.body, { fontSize: 15 }]}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.shotClock} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.arena },
  scroll: { paddingHorizontal: space.md, paddingTop: space.lg, alignItems: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth },
  footer: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.arena,
    alignItems: 'center',
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    width: '100%',
    maxWidth: maxContentWidth,
  },
  primary: { backgroundColor: colors.shotClock },
  secondary: { backgroundColor: colors.arenaDeep, borderWidth: 1, borderColor: colors.line },
  quiet: { backgroundColor: 'transparent', minHeight: 44 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 17 },
  focused: { outlineColor: colors.shotClock, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 } as ViewStyle,
  input: {
    marginTop: space.xs,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.arenaDeep,
    paddingHorizontal: space.md,
    color: colors.chalk,
    fontFamily: fonts.body,
    fontSize: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.arenaDeep,
    marginTop: space.sm,
  },
  notice: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.arenaDeep,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.arena },
});
