export const PRESETS = {
  CALM: {
    curvature: 0.25,
    overlap: 0.32,
    drift: 0.22,
    saturation: 0.72,
    trailSpeed: 0.18,
    detail: 0.4,
    impulse: 0.35,
    scale: 0.85,
  },
  ACTIVE: {
    curvature: 0.7,
    overlap: 0.52,
    drift: 0.65,
    saturation: 0.95,
    trailSpeed: 0.4,
    detail: 0.7,
    impulse: 1,
    scale: 1,
  },
  EXTREME: {
    curvature: 1.1,
    overlap: 0.7,
    drift: 1,
    saturation: 1,
    trailSpeed: 0.65,
    detail: 1,
    impulse: 1.7,
    scale: 1.2,
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
