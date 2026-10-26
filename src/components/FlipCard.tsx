import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native';

import { CardBack } from '@/components/CardBack';
import { CollectibleCard } from '@/components/CollectibleCard';
import type { InventoryItem } from '@/lib/types';

// A card that starts face-down and flips over when `revealed` turns true.
export function FlipCard({ item, width, revealed }: { item: InventoryItem; width: number; revealed: boolean }) {
  const turn = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      turn.setValue(revealed ? 1 : 0);
      return;
    }
    Animated.spring(turn, {
      toValue: revealed ? 1 : 0,
      friction: 7,
      tension: 40,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [revealed, reduceMotion, turn]);

  // Two half-turns instead of relying on backface-visibility, which nested 3D
  // transforms break on web: the back turns away to 90°, then the front turns in.
  const backRotate = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '90deg', '90deg'] });
  const frontRotate = turn.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-90deg', '-90deg', '0deg'] });
  const backOpacity = turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0], extrapolate: 'clamp' });
  const frontOpacity = turn.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
  const height = Math.round(width * 1.4);

  return (
    <View style={{ width, height }}>
      <Animated.View
        importantForAccessibility={revealed ? 'no-hide-descendants' : 'yes'}
        style={[styles.face, { opacity: backOpacity, transform: [{ perspective: 900 }, { rotateY: backRotate }] }]}
      >
        <CardBack width={width} label={width < 160 ? 'Reveal' : 'Tap to reveal'} />
      </Animated.View>
      <Animated.View
        importantForAccessibility={revealed ? 'yes' : 'no-hide-descendants'}
        style={[styles.face, { opacity: frontOpacity, transform: [{ perspective: 900 }, { rotateY: frontRotate }] }]}
      >
        <CollectibleCard item={item} width={width} interactive={false} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
