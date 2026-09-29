import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(92071, i * 431 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const clusters = Array.from({ length: 112 }, (_, id) => ({
  id,
  x: R(id, 0) * 1120 - 80,
  y: R(id, 1) * 700 - 80,
  size: 145 + R(id, 2) * 180,
  phase: R(id, 3) * TAU,
  angle: (Math.floor(R(id, 4) * 4) * Math.PI) / 2,
  white: R(id, 5) > 0.62,
}));
let meshes;
function etchings() {
  if (meshes) return meshes;
  meshes = clusters.map((c) =>
    Array.from({ length: 4 }, (_, bank) => {
      const main = new Path2D(),
        contrast = new Path2D();
      for (let j = 0; j < 32; j++) {
        const key = bank * 40 + j;
        const angle = (R(c.id, key + 20) - 0.5) * 0.28;
        const co = Math.cos(angle),
          si = Math.sin(angle);
        const point = (x, y) => [x * co - y * si, x * si + y * co];
        const x = R(c.id, key + 160) - 0.5,
          y = R(c.id, key + 210) - 0.5;
        const endX = -0.42 + R(c.id, key + 260) * 0.92,
          endY = -0.42 + R(c.id, key + 310) * 0.92;
        const path = R(c.id, key + 360) < 0.12 ? contrast : main;
        path.moveTo(...point(x, -0.5));
        path.lineTo(...point(x, endY));
        path.moveTo(...point(-0.5, y));
        path.lineTo(...point(endX, y));
      }
      return { main, contrast };
    }),
  );
  return meshes;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  const paths = etchings();
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineCap = 'butt';
  for (const c of clusters) {
    const e = introFor(c.id, intro, 370);
    if (!e.active) continue;
    const local = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.18) : quiet;
    const x = c.x + 24 * Math.sin(t * 0.31 + c.phase) * (1 + s.motion * 0.4),
      y = c.y + 21 * Math.cos(t * 0.37 + c.phase);
    const size = c.size * (1 + 0.07 * Math.sin(t * 0.49 + c.phase) + local.slow.bass * 0.07);
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(c.angle + 0.12 * Math.sin(t * 0.27 + c.phase) * (1 + s.motion));
    g.scale(size * e.scale, size * e.scale);
    for (let bank = 0; bank < 4; bank++) {
      const phase = c.phase + bank * 1.7;
      g.save();
      g.rotate(0.035 * Math.sin(t * 0.73 + phase) * (1 + local.slow.mid));
      g.translate(0.025 * Math.sin(t * 0.61 + phase), 0.023 * Math.cos(t * 0.67 + phase));
      g.scale(1 + 0.04 * Math.sin(t * 0.81 + phase) + local.impulse * s.impulse * 0.025, 1);
      g.lineWidth = (0.62 + 0.5 * R(c.id, bank + 9) + local.fast.rms * 0.18) / size;
      g.strokeStyle = c.white ? '#ffffff' : '#000000';
      g.stroke(paths[c.id][bank].main);
      g.strokeStyle = c.white ? '#000000' : '#ffffff';
      g.stroke(paths[c.id][bank].contrast);
      g.restore();
    }
    g.restore();
  }
  // Continuous annular polarity changes retain the hatching inside every band.
  g.globalCompositeOperation = 'difference';
  g.strokeStyle = '#ffffff';
  const cx = 480 + 13 * Math.sin(t * 0.23),
    cy = 270 + 11 * Math.cos(t * 0.29);
  for (let ring = 0; ring < 12; ring++) {
    const e = introFor(ring + 200, intro, 380);
    if (!e.active) continue;
    const radius =
      18 + ring * 28 + 4 * Math.sin(t * 0.62 - ring * 0.68) + m.slow.bass * (2 + ring * 0.25);
    g.lineWidth =
      (7 + R(ring, 420) * 15) *
      (1 + 0.18 * Math.sin(t * 0.77 - ring * 0.9) + m.impulse * s.impulse * 0.12);
    g.beginPath();
    g.arc(cx + e.dx, cy + e.dy, radius * e.scale, 0, TAU);
    g.stroke();
  }
  g.restore();
  return s;
}
