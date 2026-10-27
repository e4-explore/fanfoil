import { useId, useState } from 'react';
import { Platform, Text as RNText, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';

import { useTheme, type Theme, type TypeVariant } from '@/theme';

// The lowest layer of the UI kit, kept apart from ui.tsx so components that
// ui.tsx itself renders (HoloButton) can use them without an import cycle.
// Import them from '@/components/ui' everywhere else.

// ---------------------------------------------------------------------------
// Text: the only way screens render text. Pick a variant from the type scale
// and a tone; no font sizes or colors at the call site.
// ---------------------------------------------------------------------------

export type Tone = 'default' | 'muted' | 'danger' | 'success' | 'accent' | 'onAction' | 'onAccent';

const toneColor = (t: Theme, tone: Tone) =>
  ({
    default: t.color.text,
    muted: t.color.textMuted,
    danger: t.color.danger,
    success: t.color.success,
    accent: t.color.accent,
    onAction: t.color.onAction, // on the holographic surface
    onAccent: t.color.onAccent, // on a solid accent fill
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

// Controls draw FocusRing themselves; this turns off the browser's own focus
// outline on web so the two don't stack.
export const noBrowserOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as ViewStyle; // 'none' is web-only, so not in RN's types

// Keyboard focus on any control: the holographic gradient as an outline just
// outside the control (same language as the selected state). Drawn as an SVG
// stroke so it's a true outline, transparent inside.
export function FocusRing({ radius: r, offset = 3 }: { radius: number; offset?: number }) {
  const t = useTheme();
  const id = `focus${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [box, setBox] = useState<{ width: number; height: number } | null>(null);
  const stroke = 2;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: -offset, right: -offset, bottom: -offset, left: -offset }}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
    >
      {box ? (
        <Svg width={box.width} height={box.height}>
          <Defs>
            <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
              {t.holo.map((color, i) => (
                <Stop key={color} offset={i / (t.holo.length - 1)} stopColor={color} />
              ))}
            </SvgGradient>
          </Defs>
          <Rect
            x={stroke / 2}
            y={stroke / 2}
            width={box.width - stroke}
            height={box.height - stroke}
            rx={r + offset - stroke / 2}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={stroke}
          />
        </Svg>
      ) : null}
    </View>
  );
}
