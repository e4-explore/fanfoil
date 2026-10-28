import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { CardBack } from '@/components/CardBack';
import { CollectibleCard } from '@/components/CollectibleCard';
import type { InventoryItem } from '@/lib/types';

// A card that starts face-down and flips over when `revealed` turns true.
// With `onTap`, tapping either side calls it (e.g. to flip back and forth);
// `interactive` lets the front be dragged to tilt.
export function FlipCard({
  item,
  width,
  revealed,
  serial,
  interactive = false,
  onTap,
}: {
  item: InventoryItem;
  width: number;
  revealed: boolean;
  serial?: number;
  interactive?: boolean;
  onTap?: () => void;
}) {
  const turn = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  // The side the card last came to rest on. While it differs from `revealed`
  // the card is mid-turn.
  const [settled, setSettled] = useState(revealed);
  const turning = settled !== revealed;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    const native = Platform.OS !== 'web';
    const motion = reduceMotion
      ? Animated.timing(turn, { toValue: revealed ? 1 : 0, duration: 0, useNativeDriver: native })
      : Animated.spring(turn, { toValue: revealed ? 1 : 0, friction: 7, tension: 40, useNativeDriver: native });
    motion.start(({ finished }) => {
      if (finished) setSettled(revealed);
    });
  }, [revealed, reduceMotion, turn]);

  // Two half-turns instead of relying on backface-visibility, which nested 3D
  // transforms break on web: the back turns away to 90°, then the front turns in.
  const backRotate = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] });
  const frontRotate = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] });
  const backOpacity = turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0], extrapolate: 'clamp' });
  const frontOpacity = turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
  const height = Math.round(width * 1.4);
  // At rest the faces carry no 3D transform at all. A foil card does its own
  // perspective tilt, and nesting it inside a second 3D transform makes iOS
  // split its blend layers into two triangles (a hard diagonal across the
  // card). So the flip's transform exists only while turning.
  const backStyle = turning
    ? { opacity: backOpacity, transform: [{ perspective: 900 }, { rotateY: backRotate }] }
    : { opacity: revealed ? 0 : 1 };
  const frontStyle = turning
    ? { opacity: frontOpacity, transform: [{ perspective: 900 }, { rotateY: frontRotate }] }
    : { opacity: revealed ? 1 : 0 };

  return (
    <View style={{ width, height }}>
      <Animated.View
        importantForAccessibility={revealed ? 'no-hide-descendants' : 'yes'}
        aria-hidden={revealed}
        pointerEvents={revealed ? 'none' : 'auto'}
        style={[styles.face, backStyle]}
      >
        {onTap ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Card back. Tap to flip." onPress={onTap}>
            <CardBack width={width} logoUrl={item.league_logo_dark_url ?? item.league_logo_url} />
          </Pressable>
        ) : (
          <CardBack width={width} logoUrl={item.league_logo_dark_url ?? item.league_logo_url} />
        )}
      </Animated.View>
      <Animated.View
        importantForAccessibility={revealed ? 'yes' : 'no-hide-descendants'}
        aria-hidden={!revealed}
        pointerEvents={revealed ? 'auto' : 'none'}
        style={[styles.face, frontStyle]}
      >
        <CollectibleCard item={item} width={width} serial={serial} interactive={interactive} useMotion={revealed} onTap={onTap} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
