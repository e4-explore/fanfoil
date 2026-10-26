import { DeviceMotion } from 'expo-sensors';
import { useEffect } from 'react';
import { Animated, Platform } from 'react-native';

// One gyroscope reading shared by every foil card on screen, so a grid of
// cards all catch the light together without each opening its own sensor.
// The sensor runs only while at least one card is subscribed.

const tilt = new Animated.ValueXY({ x: 0, y: 0 });
let subscribers = 0;
let subscription: { remove: () => void } | undefined;

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

function start() {
  DeviceMotion.isAvailableAsync()
    .then((ok) => {
      if (!ok || subscribers === 0 || subscription) return;
      DeviceMotion.setUpdateInterval(32);
      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        // gamma: left/right, beta: front/back (holding upright is about 0.6 rad)
        tilt.setValue({ x: clamp(rotation.gamma / 0.6), y: clamp((rotation.beta - 0.6) / 0.6) });
      });
    })
    .catch(() => {});
}

function stop() {
  subscription?.remove();
  subscription = undefined;
  tilt.setValue({ x: 0, y: 0 });
}

// Returns the shared tilt while `enabled` (native only), otherwise null.
export function useSharedTilt(enabled: boolean) {
  const active = enabled && Platform.OS !== 'web';
  useEffect(() => {
    if (!active) return;
    subscribers += 1;
    if (subscribers === 1) start();
    return () => {
      subscribers -= 1;
      if (subscribers === 0) stop();
    };
  }, [active]);
  return active ? tilt : null;
}
