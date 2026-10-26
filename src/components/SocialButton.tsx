import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

// "Continue with Google / Apple": the high-contrast buttons on the sign-in
// screen. Black in light mode, white in dark mode (Google's dark/light button
// themes; Apple's black/white styles), logo just left of the label. Google
// requires its full-color "G" on white, so on the black button it sits on a
// small white disc.

type Provider = 'google' | 'apple';

const LABEL: Record<Provider, string> = { google: 'Continue with Google', apple: 'Continue with Apple' };
const LOGO = 20;

export function SocialButton({
  provider,
  onPress,
  loading,
  style,
}: {
  provider: Provider;
  onPress: () => void;
  loading?: boolean;
  style?: object;
}) {
  const styles = useStyles();
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={LABEL[provider]}
      accessibilityState={{ busy: !!loading, disabled: !!loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed, focused }: { pressed: boolean; focused?: boolean }) => [
        styles.button,
        pressed && styles.pressed,
        focused && styles.focused,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.social.ink} />
      ) : (
        <View style={styles.content}>
          {provider === 'google' ? <GoogleG onDark={t.mode === 'light'} /> : <Ionicons name="logo-apple" size={LOGO} color={t.social.ink} />}
          <Text variant="label" style={styles.label}>
            {LABEL[provider]}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// Google's standard multicolor "G" (from Google's sign-in button assets).
function GoogleG({ onDark }: { onDark: boolean }) {
  const styles = useStyles();
  const { googleG } = useTheme().social;
  const mark = (
    <Svg width={onDark ? LOGO - 4 : LOGO} height={onDark ? LOGO - 4 : LOGO} viewBox="0 0 48 48">
      <Path fill={googleG.red} d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill={googleG.blue} d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill={googleG.yellow} d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill={googleG.green} d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
  return onDark ? <View style={styles.gDisc}>{mark}</View> : mark;
}

const useStyles = makeStyles((t) => ({
  button: {
    minHeight: t.size.control,
    width: '100%',
    maxWidth: t.size.maxContent,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.social.stroke,
    backgroundColor: t.social.fill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.space.md,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm + t.space.xxs },
  label: { color: t.social.ink },
  gDisc: {
    width: LOGO + 4,
    height: LOGO + 4,
    borderRadius: (LOGO + 4) / 2,
    backgroundColor: t.social.googleG.backdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  focused: { outlineColor: t.color.accent, outlineWidth: 2, outlineStyle: 'solid', outlineOffset: 2 } as object,
}));
