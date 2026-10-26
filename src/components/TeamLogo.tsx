import { Image, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Team } from '@/lib/types';
import { makeStyles, useTheme } from '@/theme';

type LogoTeam = Pick<Team, 'abbreviation' | 'logo_url' | 'logo_dark_url'>;

// A team's logo wherever the app shows a team (picker, profile, filters,
// card detail). Uses the dark-background version in dark mode, and falls back
// to the abbreviation when a team has no logo. Logos are data
// (teams.logo_url / logo_dark_url), so swapping or removing them needs no code.
export function TeamLogo({ team, size = 'md' }: { team: LogoTeam; size?: 'sm' | 'md' }) {
  const styles = useStyles();
  const t = useTheme();
  const uri = t.mode === 'dark' ? (team.logo_dark_url ?? team.logo_url) : team.logo_url;
  const box = size === 'sm' ? styles.sm : styles.md;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={box}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  return (
    <View style={[box, styles.fallback]}>
      <Text variant={size === 'sm' ? 'smallStrong' : 'mark'}>{team.abbreviation}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  md: { width: t.size.touch, height: t.size.touch },
  sm: { width: t.space.lg, height: t.space.lg },
  fallback: {
    borderRadius: t.radius.sm,
    backgroundColor: t.color.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
