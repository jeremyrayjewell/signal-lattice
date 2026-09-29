export const PRESETS = {
  CALM: {
    fold: 0.45,
    width: 0.95,
    drift: 0.35,
    intensity: 0.65,
    mosaic: 0.55,
    impulse: 0.4,
    trailSpeed: 0.15,
  },
  ACTIVE: {
    fold: 0.85,
    width: 1,
    drift: 0.7,
    intensity: 0.85,
    mosaic: 0.7,
    impulse: 1,
    trailSpeed: 0.35,
  },
  EXTREME: {
    fold: 1.25,
    width: 1.1,
    drift: 1,
    intensity: 1,
    mosaic: 1,
    impulse: 1.65,
    trailSpeed: 0.6,
  },
};
const keys = [
  { time: 0, state: 'CALM' },
  { time: 5, state: 'CALM' },
  { time: 11, state: 'ACTIVE' },
  { time: 20, state: 'EXTREME' },
  { time: 25, state: 'EXTREME' },
];
const smooth = (q) => q * q * (3 - 2 * q);
const integral = (q) => q * q * q - 0.5 * q * q * q * q;

export function stateAt(seconds) {
  let travel = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i],
      b = keys[i + 1],
      duration = b.time - a.time;
    const q = Math.max(0, Math.min(1, (seconds - a.time) / duration));
    const from = PRESETS[a.state],
      to = PRESETS[b.state];
    travel += duration * (from.trailSpeed * q + (to.trailSpeed - from.trailSpeed) * integral(q));
    if (seconds < b.time || i === keys.length - 2) {
      return {
        ...Object.fromEntries(
          Object.keys(from).map((k) => [k, from[k] + (to[k] - from[k]) * smooth(q)]),
        ),
        travel,
        from: a.state,
        to: b.state,
      };
    }
  }
}
