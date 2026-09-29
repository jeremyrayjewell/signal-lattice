import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(92684, i * 191 + k);
const palette = [
  '#111111',
  '#F1E7D0',
  '#E83B30',
  '#F5C518',
  '#1757A6',
  '#D96C2C',
  '#7A3E32',
  '#5B5148',
  '#B7A58A',
  '#6E8B8A',
  '#C6D23A',
  '#8A4F9E',
  '#E4A0A8',
  '#263C4A',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const tiles = Array.from({ length: 45 }, (_, id) => ({
  id,
  x: 48 + (id % 9) * 108,
  y: 54 + Math.floor(id / 9) * 108,
  phase: R(id, 0) * TAU,
  scale: R(id, 1) < 0.45 ? 0.72 : 1,
  orientation: Math.floor(R(id, 2) * 4),
  colors: Array.from({ length: 7 }, (_, k) => palette[Math.floor(R(id, k + 10) * palette.length)]),
}));
const sectors = [
  [-0.5, 0, 0.5, -Math.PI / 2, Math.PI / 2],
  [0.5, -0.5, 0.63, Math.PI / 2, Math.PI],
  [0.5, 0.5, 0.39, Math.PI, Math.PI * 1.5],
  [-0.04, 0.5, 0.18, Math.PI, TAU],
];
const dots = [
  [0.105, 0.16, 0.125],
  [0.37, -0.37, 0.1],
  [0.37, 0.37, 0.062],
];
function angle(t, c) {
  const q = (t + c.phase) / (10 + R(c.id, 3) * 7),
    cycle = Math.floor(q),
    v = Math.max(0, Math.min(1, (q - cycle - 0.8) / 0.2));
  return ((c.orientation + cycle + v * v * (3 - 2 * v)) * Math.PI) / 2;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineCap = 'butt';
  for (const c of tiles) {
    const e = introFor(c.id, intro, 380);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.17) : quiet;
    g.save();
    g.translate(c.x + e.dx, c.y + e.dy);
    g.scale(e.scale, e.scale);
    g.save();
    g.beginPath();
    g.rect(-54, -54, 108, 108);
    g.clip();
    g.rotate(angle(t, c));
    const scale = 108 * c.scale * (1 + 0.025 * Math.sin(t * 0.63 + c.phase) + m.slow.bass * 0.035);
    g.scale(scale, scale);
    for (let k = 0; k < sectors.length; k++) {
      const [x, y, r, a, b] = sectors[k],
        phase = c.phase + k * 1.7;
      const radius =
        r *
        (1 +
          0.06 * Math.sin(t * 0.81 + phase) * (1 + s.motion * 0.25) +
          m.impulse * s.impulse * 0.035);
      g.fillStyle = c.colors[k];
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, radius, a, b);
      g.closePath();
      g.fill();
    }
    for (let k = 0; k < dots.length; k++) {
      const [x, y, r] = dots[k],
        phase = c.phase + k * 2;
      g.fillStyle = c.colors[k + 4];
      g.beginPath();
      g.arc(
        x + 0.028 * Math.sin(t * 0.97 + phase),
        y + 0.028 * Math.cos(t * 0.89 + phase),
        r * (1 + 0.1 * Math.sin(t * 0.73 + phase) + m.fast.rms * 0.1),
        0,
        TAU,
      );
      g.fill();
    }
    // White contours stay inside the main semicircle while their spacing breathes.
    g.strokeStyle = '#ffffff';
    g.lineWidth = 0.013;
    for (let j = 1; j <= 9; j++) {
      if (R(c.id, j + 30) < 0.32) continue;
      const radius =
        j * 0.048 * (1 + 0.045 * Math.sin(t * 0.91 + c.phase - j * 0.4) + m.slow.mid * 0.04);
      g.beginPath();
      g.arc(-0.5, 0, radius, -Math.PI / 2, Math.PI / 2);
      g.stroke();
    }
    g.restore();
    // Independent slender curves connect the geometric clusters across the white gaps.
    g.strokeStyle = '#111111';
    g.lineWidth = 1.05 + m.fast.centroid * 0.2;
    for (let j = 0; j < 2; j++) {
      const phase = c.phase + j * 2,
        vertical = R(c.id, j + 50) > 0.5;
      const offsets = Array.from(
        { length: 4 },
        (_, k) =>
          (R(c.id, 60 + j * 6 + k) - 0.5) * 100 +
          12 * Math.sin(t * 0.69 + phase + k * 0.9) * (1 + s.motion * 0.3 + m.slow.mid * 0.3),
      );
      g.save();
      if (vertical) g.rotate(Math.PI / 2);
      g.beginPath();
      g.moveTo(-54, offsets[0]);
      g.bezierCurveTo(-23, offsets[1], 23, offsets[2], 54, offsets[3]);
      g.stroke();
      g.restore();
    }
    g.restore();
  }
  g.restore();
  return s;
}
