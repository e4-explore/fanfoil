// The design system. Screens and components get every color, size, and text
// style from here:
//
//   const useStyles = makeStyles((t) => ({ panel: { backgroundColor: t.color.surface, padding: t.space.md } }));
//   const styles = useStyles();          // inside the component
//   const t = useTheme();                // for values passed as props (tint colors, gradients)
//
// Light or dark follows the device setting. Each makeStyles sheet is built at
// most once per mode and shared by every instance, so switching is cheap.

import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { card, glass, holo, neutrals, status } from './palette';

export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displayHeavy: 'BarlowCondensed_800ExtraBold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodyBold: 'Barlow_600SemiBold',
} as const;

// The only text styles in the app. Color is applied separately (see <Text tone>).
export const type = {
  title: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 42 },
  heading: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 22 },
  labelSmall: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20 },
  small: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18 },
  mark: { fontFamily: fonts.display, fontSize: 17, lineHeight: 20 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const space = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;
export const radius = { sm: 6, md: 12, card: 16 } as const;
export const size = {
  touch: 44,        // minimum tap target
  control: 52,      // buttons and inputs
  row: 60,          // list rows
  segment: 40,      // segmented control options
  tabBar: 64,       // floating tab bar height
  maxContent: 560,  // readable column on web and tablets
} as const;

function build(mode: 'light' | 'dark') {
  return {
    mode,
    color: {
      ...neutrals[mode],
      ...status[mode],
      accent: holo.accent[mode],
      onAction: holo.ink,
    },
    holo: holo.stops,
    glass: glass[mode],
    statusBar: mode === 'dark' ? ('light' as const) : ('dark' as const),
    space,
    radius,
    size,
    type,
    fonts,
  };
}

export type Theme = ReturnType<typeof build>;

export const themes = { light: build('light'), dark: build('dark') } as const;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? themes.dark : themes.light;
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles<T>>(factory: (t: Theme) => T | NamedStyles<T>): () => T {
  const cache = new Map<Theme, T>();
  return function useStyles() {
    const theme = useTheme();
    let sheet = cache.get(theme);
    if (!sheet) {
      sheet = StyleSheet.create(factory(theme) as T);
      cache.set(theme, sheet);
    }
    return sheet;
  };
}

// Card art is the same in both modes.
export { card };
export type CardTier = keyof typeof card.foil;
