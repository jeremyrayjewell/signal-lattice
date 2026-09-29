export const PRESETS = {
  CALM: {
    curvature: 0.35,
    overlap: 0.46,
    drift: 0.22,
    saturation: 0.9,
    trailSpeed: 0.24,
    detail: 0.45,
    impulse: 0.4,
    scale: 1,
    depth: 0.25,
    aperture: 1,
  },
  ACTIVE: {
    curvature: 0.8,
    overlap: 0.62,
    drift: 0.65,
    saturation: 1,
    trailSpeed: 0.48,
    detail: 0.75,
    impulse: 1,
    scale: 1.03,
    depth: 0.6,
    aperture: 1.1,
  },
  EXTREME: {
    curvature: 1.3,
    overlap: 0.78,
    drift: 1,
    saturation: 1,
    trailSpeed: 0.78,
    detail: 1,
    impulse: 1.8,
    scale: 1.06,
    depth: 1,
    aperture: 1.22,
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
