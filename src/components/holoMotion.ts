import { useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// Shared pieces for the holographic surfaces (primary button, foil cards).

const native = Platform.OS !== 'web';

// Direction (CSS degrees: 0 = up, 90 = right) to expo-linear-gradient start/end.
export function cssAngle(deg: number) {
  const rad = (deg * Math.PI) / 180;
  const x = Math.sin(rad) / 2;
  const y = -Math.cos(rad) / 2;
  return { start: { x: 0.5 - x, y: 0.5 - y }, end: { x: 0.5 + x, y: 0.5 + y } };
}

// Sampled sine for drifting values, driven natively by a 0..1 phase.
export const SAMPLES = Array.from({ length: 17 }, (_, i) => i / 16);
export const wave = (amp: number, phase: number) => SAMPLES.map((p) => amp * Math.sin(2 * Math.PI * p + phase));

// A rainbow repeated so a 220% layer shows about two cycles (the CSS
// original's repeating-linear-gradient).
export function repeatedRainbow(stops: readonly string[]) {
  const colors = [...stops, stops[0], ...stops, stops[0]] as unknown as readonly [string, string, ...string[]];
  const locations = colors.map((_, i) => i / (colors.length - 1)) as unknown as readonly [number, number, ...number[]];
  return { colors, locations };
}

// One idle-drift clock shared by every foil card on screen, so a grid runs
// two looping animations instead of two per card. Each card reads it with its
// own phase offset, so they don't all move in lockstep. Runs only while at
// least one card is subscribed.
const phaseX = new Animated.Value(0);
const phaseY = new Animated.Value(0);
let subscribers = 0;
let loops: Animated.CompositeAnimation[] = [];

function start() {
  loops = [
    Animated.loop(Animated.timing(phaseX, { toValue: 1, duration: 8976, easing: Easing.linear, useNativeDriver: native })),
    Animated.loop(Animated.timing(phaseY, { toValue: 1, duration: 11855, easing: Easing.linear, useNativeDriver: native })),
  ];
  loops.forEach((l) => l.start());
}

function stop() {
  loops.forEach((l) => l.stop());
  loops = [];
}

export function useIdleDrift(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    subscribers += 1;
    if (subscribers === 1) start();
    return () => {
      subscribers -= 1;
      if (subscribers === 0) stop();
    };
  }, [enabled]);
  return enabled ? { phaseX, phaseY } : null;
}
