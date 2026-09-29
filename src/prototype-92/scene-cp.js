import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(72792, i * 359 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const groups = Array.from({ length: 45 }, (_, id) => ({
  id,
  x: 48 + (id % 9) * 108,
  y: 54 + Math.floor(id / 9) * 108,
  phase: R(id, 0) * TAU,
  count: [2, 4, 8][Math.floor(R(id, 1) * 3)],
  corners: R(id, 2) > 0.48,
  angle: (Math.floor(R(id, 3) * 4) * Math.PI) / 2,
  curves: Array.from({ length: 8 }, (_, j) =>
    Array.from({ length: 4 }, (_, k) => [
      (R(id, 10 + j * 8 + k * 2) - 0.5) * 205,
      (R(id, 11 + j * 8 + k * 2) - 0.5) * 205,
    ]),
  ),
}));
function disc(g, x, y, r) {
  g.moveTo(x + r, y);
  g.arc(x, y, r, 0, TAU);
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.strokeStyle = '#000000';
  g.fillStyle = '#000000';
  // Continuous fine curves span neighboring dot fields without clipping to their grid.
  for (const c of groups) {
    const e = introFor(c.id, intro, 390);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.17) : quiet;
    g.save();
    g.translate(c.x + e.dx, c.y + e.dy);
    g.scale(e.scale, e.scale);
    g.lineWidth = 0.62 + m.fast.centroid * 0.18;
    for (let j = 0; j < c.curves.length; j++) {
      const points = c.curves[j].map(([x, y], k) => [
        x + 17 * Math.sin(t * 0.61 + c.phase + j * 0.8 + k) * (1 + s.motion * 0.3),
        y + 17 * Math.cos(t * 0.67 + c.phase + j + k * 0.7) * (1 + m.slow.mid * 0.4),
      ]);
      g.beginPath();
      g.moveTo(...points[0]);
      g.bezierCurveTo(...points[1], ...points[2], ...points[3]);
      g.stroke();
    }
    g.restore();
  }
  for (const c of groups) {
    const e = introFor(c.id, intro, 390);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.17) : quiet;
    g.save();
    g.translate(
      c.x + e.dx + 5 * Math.sin(t * 0.49 + c.phase),
      c.y + e.dy + 5 * Math.cos(t * 0.53 + c.phase),
    );
    g.scale(e.scale, e.scale);
    g.rotate(c.angle + 0.18 * Math.sin(t * 0.57 + c.phase) * (1 + s.motion * 0.4));
    if (c.corners) {
      g.beginPath();
      for (let j = 0; j < 4; j++) {
        const r =
          (R(c.id, j + 100) < 0.5 ? 6.5 : 13) *
          (1 + 0.1 * Math.sin(t * 0.81 + c.phase + j) + m.slow.bass * 0.09);
        const x = (j % 2 ? 1 : -1) * 39,
          y = (j < 2 ? -1 : 1) * 39;
        disc(g, x, y, r);
      }
      g.fill();
      g.rotate(Math.PI / 4);
      g.scale(0.72, 0.72);
    }
    const spacing = 108 / c.count;
    g.beginPath();
    for (let row = 0; row < c.count; row++)
      for (let col = 0; col < c.count; col++) {
        const id = row * c.count + col,
          ph = c.phase + row * 0.6 + col * 0.8;
        const gradient = 1 - (0.72 * col) / Math.max(1, c.count - 1);
        const radius =
          spacing * 0.46 * gradient * (1 + 0.1 * Math.sin(t * 0.93 + ph) + m.slow.bass * 0.09);
        const x = (col - (c.count - 1) / 2) * spacing + spacing * 0.07 * Math.sin(t * 0.77 + ph),
          y = (row - (c.count - 1) / 2) * spacing + spacing * 0.07 * Math.cos(t * 0.83 + ph);
        if (R(c.id, id + 120) > 0.5) disc(g, x, y, radius);
        else {
          const separation =
            spacing * (0.24 + 0.035 * Math.sin(t * 1.07 + ph) + m.impulse * s.impulse * 0.06);
          for (let q = 0; q < 4; q++)
            disc(
              g,
              x + (q % 2 ? 1 : -1) * separation,
              y + (q < 2 ? -1 : 1) * separation,
              radius * (q === 0 ? 0.39 : 0.44),
            );
        }
      }
    g.fill();
    g.restore();
  }
  g.restore();
  return s;
}
