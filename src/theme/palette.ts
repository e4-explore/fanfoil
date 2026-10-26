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

export const status = {
  light: { danger: '#B53333', success: '#2A7247' },
  dark: { danger: '#F28B82', success: '#74D19A' },
} as const;

// Holographic primary. Stops run cyan -> violet -> pink -> gold; dark ink
// reads at 8:1 or better on every stop. `accent` is the solid stand-in for
// places a gradient can't go (borders, spinners, tab tint).
export const holo = {
  stops: ['#8FD8F7', '#B9A6FF', '#F5A6DC', '#FFD68A'] as const,
  ink: '#141413',
  accent: { light: '#6A4FD8', dark: '#B9A6FF' },
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
