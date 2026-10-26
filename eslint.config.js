// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Design-system guardrails. Styles come from `@/theme` (makeStyles / useTheme)
// and text from `<Text variant tone>` in `@/components/ui`, so nothing
// off-palette or off-scale gets in.
const colorLiteral = {
  selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/]',
  message: 'Raw colors live in src/theme/palette.ts. Use a theme token (t.color.*, card.*).',
};
const styleLiterals = [
  {
    selector: 'Property[key.name=/^(fontSize|lineHeight|letterSpacing)$/] > Literal',
    message: 'Use a text variant: <Text variant="..."> or t.type.*.',
  },
  {
    selector: 'Property[key.name="fontFamily"] > Literal',
    message: 'Use t.type.* or fonts.* from @/theme.',
  },
  {
    selector: 'Property[key.name=/[cC]olor$/] > Literal[value!="transparent"]',
    message: 'Use a theme color (t.color.*).',
  },
  {
    selector: 'CallExpression[callee.object.name="StyleSheet"][callee.property.name="create"]',
    message: 'Use makeStyles((t) => ({ ... })) from @/theme so styles follow light/dark mode.',
  },
];
const rawText = {
  paths: [
    {
      name: 'react-native',
      importNames: ['Text', 'TextInput'],
      message: 'Use Text / Field from @/components/ui.',
    },
  ],
  patterns: [{ group: ['@/theme/palette', '**/theme/palette'], message: 'Import tokens from @/theme, not the raw palette.' }],
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', colorLiteral, ...styleLiterals],
      'no-restricted-imports': ['error', rawText],
    },
  },
  // The theme defines the system; the UI kit wraps the raw primitives.
  {
    files: ['src/theme/**'],
    rules: { 'no-restricted-syntax': 'off', 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/components/ui.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // Card art scales its own typography with card width and is the same in both
  // modes; it may use raw Text and StyleSheet, but still no raw colors.
  {
    files: ['src/components/HoloCard.tsx', 'src/components/CardBack.tsx', 'src/components/FlipCard.tsx', 'src/components/SlabCard.tsx', 'src/components/CardBanner.tsx'],
    rules: {
      'no-restricted-syntax': ['error', colorLiteral],
      'no-restricted-imports': 'off',
    },
  },
]);
