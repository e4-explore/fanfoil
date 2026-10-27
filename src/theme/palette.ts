// Raw color values. This file and nothing else holds hex codes; everything
// else reads semantic tokens from `@/theme` (lint enforces it).
//
// UI neutrals follow Claude's warm palette (ivory/slate). The primary action
// is a holographic gradient that echoes the foil cards. Contrast is checked:
// text >= 4.5:1 and borders/indicators >= 3:1 on every surface they sit on.

export const neutrals = {
  light: {
    background: '#FAF9F5',
    surface: '#FFFFFF',
    sunken: '#F0EEE6',
    border: '#D9D6CB',
    borderStrong: '#8C8A82',
    text: '#141413',
    textMuted: '#5E5D59',
  },
  dark: {
    background: '#262624',
    surface: '#30302E',
    sunken: '#1F1E1D',
    border: '#4A4944',
    borderStrong: '#7E7C75',
    text: '#FAF9F5',
    textMuted: '#B8B5A9',
  },
} as const;

// Floating glass surfaces (tab bar). On iOS 26 the system Liquid Glass
// material is used and only `selected` applies; elsewhere `fill` sits over a
// blur (iOS < 26, web) or alone (Android, Reduce Transparency: `solid`).
export const glass = {
  light: {
    fill: 'rgba(255,255,255,0.72)',
    solid: '#FFFFFF',
    edge: 'rgba(20,20,19,0.10)',
    selected: 'rgba(20,20,19,0.07)',
    shadow: 'rgba(20,20,19,0.18)',
  },
  dark: {
    fill: 'rgba(48,48,46,0.72)',
    solid: '#30302E',
    edge: 'rgba(250,249,245,0.14)',
    selected: 'rgba(250,249,245,0.10)',
    shadow: 'rgba(0,0,0,0.45)',
  },
} as const;

// Sign in with Google / Apple. Values are Google's published button themes:
// the light app gets their dark button, the dark app gets their light one,
// so these buttons stand out in both. Apple's black/white styles match.
// The Google "G" must stay full color on white (never monochrome).
export const social = {
  light: { fill: '#131314', ink: '#E3E3E3', stroke: '#8E918F' },
  dark: { fill: '#FFFFFF', ink: '#1F1F1F', stroke: '#747775' },
  googleG: { red: '#EA4335', blue: '#4285F4', yellow: '#FBBC05', green: '#34A853', backdrop: '#FFFFFF' },
} as const;

export const status = {
  light: { danger: '#B53333', success: '#2A7247' },
  dark: { danger: '#F28B82', success: '#74D19A' },
} as const;

// Holographic gradient (selection and focus rings, "Yours" banner, and the
// primary button's foil). Stops are the primary button's rainbow:
// hsl(330 / 42 / 150 / 192 / 262, 100%, 62%). Text never sits directly on it;
// the banner adds a white veil first (dark ink then reads 7:1 or better).
// `accent` is the solid stand-in for places a gradient can't go.
export const holo = {
  stops: ['#FF3D9E', '#FFC53D', '#3DFF9E', '#3DD8FF', '#843DFF'] as const,
  ink: '#141413',
  accent: { light: '#6A4FD8', dark: '#B9A6FF' },
  // Secondary button: a slightly softer shade of the accent violet, a step
  // below the holographic primary. Ink is 4.7:1 light, 7.6:1 dark.
  secondary: { light: '#7761DB', dark: '#AD99F7' },
  secondaryInk: { light: '#FFFFFF', dark: '#141413' },
  // Selection and focus outlines: pinks into purples, like the primary
  // button. Deeper in light mode, brighter in dark; every stop is 4:1 or
  // better on the surfaces it sits on (3:1 needed).
  ring: {
    light: ['#E0267D', '#C026D3', '#9333EA', '#7C3AED'],
    dark: ['#FF5FB0', '#E879F9', '#C084FC', '#A78BFA'],
  },
  // Faint accent wash inside selected chips.
  tint: { light: 'rgba(106,79,216,0.08)', dark: 'rgba(185,166,255,0.14)' },
} as const;

// The primary button: a violet base under the holographic foil (overlay),
// brushed texture, a glare that follows the pointer, and a looping shine.
// White label: 5.7:1 on the middle of the base, where the text sits.
export const primaryButton = {
  base: ['#9965F1', '#7C3AED', '#592AAB'] as const,
  ink: '#FFFFFF',
  inkShadow: 'rgba(0,0,0,0.6)',
  glare: 'rgba(255,255,255,0.95)',
  shine: 'rgba(255,255,255,0.55)',
  shadow: '0px 16px 30px -12px rgba(0,0,0,0.6), 0px 2px 6px rgba(0,0,0,0.3), inset 0px 1px 0px rgba(255,255,255,0.16)',
  shadowPressed: '0px 6px 12px -8px rgba(0,0,0,0.6), 0px 1px 3px rgba(0,0,0,0.3), inset 0px 1px 0px rgba(255,255,255,0.1)',
} as const;

// The cards are physical-looking objects: same in light and dark mode.
export const card = {
  ink: '#EEEBF6',
  inkMuted: '#A9ABCB',
  shadow: '#000000',
  glare: '#FFFFFF',
  courtLine: 'rgba(255,255,255,0.13)',
  back: {
    stock: '#3A3F7A',
    panel: ['#262A5E', '#0E1030'] as const,
    weave: 'rgba(255,255,255,0.06)',
    mark: '#B9A6FF',
  },
  // Bands across a card: "All claimed" (no copies left) and "Yours" (owned;
  // drawn on the holographic gradient with holo.ink).
  banner: { fill: 'rgba(20,20,19,0.82)', ink: '#FAF9F5', edge: 'rgba(250,249,245,0.35)', holoVeil: 'rgba(255,255,255,0.40)' },
  // Vaulted cards: a plain frame around the unedited slab photo. The label is
  // Fanfoil's own neutral design (not any grader's label colors).
  slab: {
    shell: '#E6E7EC',
    edge: '#BFC2CC',
    label: '#FFFFFF',
    labelInk: '#141413',
    labelMuted: '#5E5D59',
    window: '#2A2B30',
    windowInk: '#B8B5A9',
    sample: '#FFD68A',
    sampleInk: '#141413',
  },
  foil: {
    role: {
      stock: '#DCDDEA',
      panel: ['#2B2F66', '#1B1E47'] as const,
      sheen: ['rgba(140,220,255,0)', 'rgba(140,220,255,0.55)', 'rgba(255,140,230,0.5)', 'rgba(255,255,255,0)'] as const,
    },
    storyline: {
      stock: '#F2D98A',
      panel: ['#4A2A12', '#21143A'] as const,
      sheen: ['rgba(255,215,120,0)', 'rgba(255,230,150,0.7)', 'rgba(150,255,220,0.45)', 'rgba(255,255,255,0)'] as const,
    },
  },
} as const;
