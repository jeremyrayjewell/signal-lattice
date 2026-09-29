import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(91975, i * 157 + k),
  CELL = 108;
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const tiles = Array.from({ length: 45 }, (_, id) => ({
  id,
  x: (id % 9) * CELL + 48,
  y: Math.floor(id / 9) * CELL + 54,
  phase: R(id, 0) * TAU,
  black: R(id, 1) < 0.36,
  count: R(id, 2) > 0.5 ? 10 : 20,
  kind: Math.floor(R(id, 3) * 3),
  orientation: Math.floor(R(id, 4) * 4),
  radius: 18 + R(id, 5) * 33,
}));
function turn(t, c) {
  const q = (t + c.phase) / (9 + R(c.id, 6) * 8),
    cycle = Math.floor(q),
    fraction = q - cycle;
  const u = Math.max(0, Math.min(1, (fraction - 0.72) / 0.28)),
    ease = u * u * u * (u * (u * 6 - 15) + 10);
  return ((c.orientation + cycle + ease) * Math.PI) / 2;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (const c of tiles) {
    const entry = introFor(c.id, intro, 370);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.16) : quiet;
    g.save();
    g.translate(c.x + entry.dx, c.y + entry.dy);
    g.scale(entry.scale, entry.scale);
    g.beginPath();
    g.rect(-54, -54, 108, 108);
    g.clip();
    g.fillStyle = c.black ? '#000000' : '#ffffff';
    g.fillRect(-54, -54, 108, 108);
    g.save();
    g.rotate(turn(t, c) + 0.025 * Math.sin(t * 0.53 + c.phase) * (1 + s.motion));
    const step = CELL / c.count;
    const flow = step * 0.38 * Math.sin(t * 0.81 + c.phase) * (1 + m.slow.mid * 0.5);
    for (let j = -2; j < c.count + 2; j++) {
      const center = -54 + (j + 0.5) * step + flow,
        ph = c.phase + j * 0.63;
      const tilt = step * (0.25 * Math.sin(t * 0.61 + ph) + 0.24 * (R(c.id, j + 30) - 0.5));
      const breathing = 1 + 0.1 * Math.sin(t * 0.73 + ph) + m.slow.bass * 0.09;
      let left = -78,
        right = 78;
      if (c.kind === 1) {
        const length = 27 + 7 * Math.sin(t * 0.67 + c.phase) + m.impulse * s.impulse * 5;
        left = -length;
        right = length;
      }
      if (c.kind === 2) {
        left = -60;
        right =
          -43 +
          ((j + 0.5) / c.count) * 103 +
          9 * Math.sin(t * 0.71 + ph) +
          m.impulse * s.impulse * 7;
      }
      const half = step * 0.53 * breathing;
      g.fillStyle = (((j + c.id) % 2) + 2) % 2 ? '#000000' : '#ffffff';
      g.beginPath();
      g.moveTo(left, center - half - tilt);
      g.lineTo(right, center - half + tilt);
      g.lineTo(right, center + half + tilt);
      g.lineTo(left, center + half - tilt);
      g.closePath();
      g.fill();
    }
    g.restore();
    const radius = c.radius * (1 + 0.075 * Math.sin(t * 0.57 + c.phase) + m.slow.bass * 0.055);
    const margin = Math.max(0, 53 - radius);
    const x = margin * 0.75 * Math.sin(t * 0.37 + c.phase),
      y = margin * 0.75 * Math.cos(t * 0.43 + c.phase);
    const weight = 2.15 + m.fast.rms * 0.45;
    // Individually drawn short tangential dashes keep the contour crisp while it circulates.
    const count = Math.round((TAU * c.radius) / 5.1),
      phase = t * (0.19 + 0.05 * s.motion) + c.phase + m.slow.mid * 0.13;
    g.strokeStyle = c.black ? '#ffffff' : '#000000';
    g.lineWidth = weight;
    g.lineCap = 'butt';
    for (let k = 0; k < count; k++) {
      const a = phase + (k / count) * TAU,
        span = 1.55 / radius;
      g.beginPath();
      g.arc(x, y, radius, a, a + span);
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
