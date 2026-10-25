// Design tokens. One loud thing (the foil card); everything else stays quiet.

export const colors = {
  arena: '#16183A',      // app background: arena at night
  arenaDeep: '#0E1030',  // panels, inputs
  line: '#2C2F5C',       // hairlines, court lines
  chalk: '#EEEBF6',      // primary text, card stock
  mist: '#A9ABCB',       // secondary text
  shotClock: '#FFB21E',  // primary actions
  shotClockInk: '#2A1B00',
  danger: '#FF6B6B',
  ok: '#5EE2A0',
} as const;

// Foil palettes per tier. Roles read silver-prismatic, storylines gold.
export const foil = {
  role: {
    stock: '#DCDDEA',
    panel: ['#2B2F66', '#1B1E47'] as const,
    sheen: ['rgba(140,220,255,0)', 'rgba(140,220,255,0.55)', 'rgba(255,140,230,0.5)', 'rgba(255,255,255,0)'] as const,
    ink: '#16183A',
  },
  storyline: {
    stock: '#F2D98A',
    panel: ['#4A2A12', '#21143A'] as const,
    sheen: ['rgba(255,215,120,0)', 'rgba(255,230,150,0.7)', 'rgba(150,255,220,0.45)', 'rgba(255,255,255,0)'] as const,
    ink: '#2A1B00',
  },
} as const;

export type TierSlug = keyof typeof foil;

export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displayHeavy: 'BarlowCondensed_800ExtraBold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodyBold: 'Barlow_600SemiBold',
} as const;

// Modular scale (~1.25) for UI text; the card uses its own larger sizes.
export const type = {
  title: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 42, color: colors.chalk },
  heading: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.chalk },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.chalk },
  bodyMuted: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.mist },
  small: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.mist },
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;
export const radius = { sm: 6, md: 12, card: 16 } as const;

// Content column width; keeps line lengths readable on web and tablets.
export const maxContentWidth = 560;
