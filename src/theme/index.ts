// The design system. Screens and components get every color, size, and text
// style from here:
//
//   const useStyles = makeStyles((t) => ({ panel: { backgroundColor: t.color.surface, padding: t.space.md } }));
//   const styles = useStyles();          // inside the component
//   const t = useTheme();                // for values passed as props (tint colors, gradients)
//
// Light or dark follows the device setting. Each makeStyles sheet is built at
// most once per mode and shared by every instance, so switching is cheap.

import { createContext, createElement, useContext, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { card, glass, holo, neutrals, primaryButton, social, status } from './palette';

export const fonts = {
  display: 'BarlowCondensed_700Bold', // titles and headings
  displayHeavy: 'BarlowCondensed_800ExtraBold', // card art
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodyBold: 'Barlow_600SemiBold',
} as const;

// The only text styles in the app. Color is applied separately (see <Text tone>).
export const type = {
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42 },
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
      secondary: holo.secondary[mode],
      onSecondary: holo.secondaryInk[mode],
      accentTint: holo.tint[mode],
      onAction: holo.ink,
    },
    holo: holo.stops,
    primary: primaryButton,
    glass: glass[mode],
    social: { ...social[mode], googleG: social.googleG },
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

// Lets a subtree render in a fixed mode (the style guide shows light and dark
// side by side). Everywhere else the theme follows the device setting.
const ThemeOverride = createContext<Theme | null>(null);

export function ThemeScope({ mode, children }: { mode: 'light' | 'dark'; children: ReactNode }) {
  return createElement(ThemeOverride.Provider, { value: themes[mode] }, children);
}

export function useTheme(): Theme {
  const override = useContext(ThemeOverride);
  const scheme = useColorScheme();
  return override ?? (scheme === 'dark' ? themes.dark : themes.light);
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

// Card art is the same in both modes (holo: the holographic stops and ink,
// for mode-independent art such as the "Yours" banner).
export { card, holo };
export type CardTier = keyof typeof card.foil;
