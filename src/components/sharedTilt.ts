import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import { useEffect } from 'react';
import { Animated, Platform } from 'react-native';

// One motion reading shared by every foil card on screen, so a grid of cards
// all catch the light together without each opening its own sensor. The
// sensor runs only while at least one card is subscribed.
//
// Works at any angle: it reads the direction of gravity (no Euler angles, so
// no flips or gimbal lock when the phone is flat, vertical, or upside down)
// and measures tilt relative to how the phone is being held right now. That
// "neutral" slowly follows the current grip, so the foil reacts to movement
// and eases back to rest when the phone is still, whether you're standing,
// lying down, or the phone is flat on a table.

const tilt = new Animated.ValueXY({ x: 0, y: 0 });
let subscribers = 0;
let subscription: { remove: () => void } | undefined;

const FOLLOW = 0.045; // how fast "neutral" follows the grip, per reading (~0.7s)
const SMOOTH = 0.35;  // jitter smoothing, per reading
const GAIN = 4;       // ~15° of movement reaches full tilt
const MAX_STEP = 0.12; // max change per reading, so fast flips glide instead of snapping
const SHAKE = 0.35;   // ignore readings whose strength is >35% off normal (bumps, shakes)

let neutral: { x: number; y: number } | null = null;
let usualMagnitude = 0; // running average of gravity's strength, whatever the units
const smoothed = { x: 0, y: 0 };
const shown = { x: 0, y: 0 };

const step = (from: number, to: number) => from + Math.max(-MAX_STEP, Math.min(MAX_STEP, to - from));

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

function onMotion({ accelerationIncludingGravity: g }: DeviceMotionMeasurement) {
  if (!g) return;
  const magnitude = Math.hypot(g.x, g.y, g.z);
  if (!Number.isFinite(magnitude) || magnitude <= 0) return; // bad sample
  if (!usualMagnitude) usualMagnitude = magnitude;
  if (Math.abs(magnitude - usualMagnitude) > usualMagnitude * SHAKE) return; // a bump or shake, not a tilt
  usualMagnitude += (magnitude - usualMagnitude) * 0.05;

  // Gravity's direction in screen axes: x = left/right, y = top/bottom.
  const gx = g.x / magnitude;
  const gy = g.y / magnitude;

  if (!neutral) neutral = { x: gx, y: gy };
  neutral.x += (gx - neutral.x) * FOLLOW;
  neutral.y += (gy - neutral.y) * FOLLOW;

  smoothed.x += (gx - neutral.x - smoothed.x) * SMOOTH;
  smoothed.y += (gy - neutral.y - smoothed.y) * SMOOTH;

  shown.x = step(shown.x, clamp(smoothed.x * GAIN));
  shown.y = step(shown.y, clamp(-smoothed.y * GAIN));
  tilt.setValue({ x: shown.x, y: shown.y });
}

function start() {
  DeviceMotion.isAvailableAsync()
    .then((ok) => {
      if (!ok || subscribers === 0 || subscription) return;
      DeviceMotion.setUpdateInterval(32);
      subscription = DeviceMotion.addListener(onMotion);
    })
    .catch(() => {});
}

function stop() {
  subscription?.remove();
  subscription = undefined;
  neutral = null;
  usualMagnitude = 0;
  smoothed.x = 0;
  smoothed.y = 0;
  shown.x = 0;
  shown.y = 0;
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
