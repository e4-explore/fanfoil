import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { card } from '@/theme';

// Half-court markings drawn behind the card art. Original line art, no marks.
export function CourtLines({ color = card.courtLine }: { color?: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice">
      {/* baseline + hoop */}
      <Line x1="0" y1="138" x2="100" y2="138" stroke={color} strokeWidth="0.8" />
      <Circle cx="50" cy="126" r="2.4" stroke={color} strokeWidth="0.8" fill="none" />
      <Line x1="44" y1="130" x2="56" y2="130" stroke={color} strokeWidth="0.8" />
      {/* the key and free-throw circle */}
      <Rect x="34" y="96" width="32" height="42" stroke={color} strokeWidth="0.8" fill="none" />
      <Circle cx="50" cy="96" r="12" stroke={color} strokeWidth="0.8" fill="none" />
      {/* three-point line */}
      <Path d="M8 138 L8 118 A44 44 0 0 1 92 118 L92 138" stroke={color} strokeWidth="0.8" fill="none" />
      {/* half-court circle at the top edge */}
      <Line x1="0" y1="8" x2="100" y2="8" stroke={color} strokeWidth="0.8" />
      <Circle cx="50" cy="8" r="14" stroke={color} strokeWidth="0.8" fill="none" />
    </Svg>
  );
}
