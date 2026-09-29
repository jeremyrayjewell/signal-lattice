import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(30142, id * 239 + k);
const palette = [
  '#79483f',
  '#d1a363',
  '#af5873',
  '#241d23',
  '#668578',
  '#d66080',
  '#812d40',
  '#2d526f',
  '#e5c345',
  '#30524d',
  '#565143',
  '#34344a',
  '#4ba0ae',
  '#b84648',
  '#d29a49',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const patches = Array.from({ length: 24 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 166 + (R(id, 0) - 0.5) * 35,
  y: 30 + Math.floor(id / 6) * 167 + (R(id, 1) - 0.5) * 35,
  size: 167 + R(id, 2) * 62,
  phase: R(id, 3) * TAU,
  angle: R(id, 4) * TAU,
  base: Math.floor(R(id, 5) * palette.length),
}));
function blocks(g, t, intro) {
  if (intro >= 1) {
    g.fillStyle = '#030405';
    g.fillRect(0, 0, 960, 540);
  }
  for (let id = 0; id < 150; id++) {
    const entry = introFor(id + 1000, intro, 320);
    if (!entry.active) continue;
    const size = 35 + R(id, 100) * 107;
    const choice = R(id, 101);
    g.fillStyle =
      choice < 0.33
        ? '#050606'
        : choice < 0.64
          ? '#777874'
          : palette[Math.floor(R(id, 102) * palette.length)];
    const x = R(id, 103) * 1050 - 45 + 8 * Math.sin(t * 0.23 + id),
      y = R(id, 104) * 630 - 45 + 7 * Math.cos(t * 0.19 + id);
    g.fillRect(x + entry.dx, y + entry.dy, size * entry.scale, size * entry.scale);
  }
}
function bundle(g, c, t, m, s, axis) {
  g.save();
  g.rotate((axis * Math.PI) / 2 + 0.08 * Math.sin(t * 0.43 + c.phase + axis));
  const count = axis ? (R(c.id, 12) > 0.5 ? 30 : 19) : R(c.id, 13) > 0.5 ? 34 : 21;
  const spacing = c.size / count;
  for (let line = 0; line < count; line++) {
    const key = line + axis * 70;
    if (R(c.id, key + 150) < 0.19) continue;
    const offset = (line - (count - 1) / 2) * spacing;
    const dashed = R(c.id, key + 230) > 0.48;
    const width = (axis ? 0.85 : 1.05) + R(c.id, key + 320) * 1.5;
    const color =
      (R(c.id, key + 400) > 0.62
        ? Math.floor(R(c.id, key + 460) * palette.length)
        : c.base + axis * 3) % palette.length;
    g.strokeStyle = palette[color];
    g.lineWidth = width * (1 + 0.13 * m.fast.centroid);
    g.setLineDash(dashed ? [width * 0.8, width * 2.2] : []);
    g.lineDashOffset = -t * (9 + R(c.id, key + 510) * 13) - m.residue * 5;
    g.beginPath();
    // Coherent warping across each family of lines, with slower divergence between rows.
    for (let j = 0; j <= 64; j++) {
      const u = j / 64,
        x = (u - 0.5) * c.size * 1.25;
      const phase = c.phase + axis * 1.4;
      const longWave = Math.sin(u * 8 + t * 0.85 + phase + offset * 0.006);
      const fold = Math.sin(u * 19 - t * 0.67 + phase + offset * 0.012);
      const small = Math.sin(u * 33 + t * 1.13 + phase + offset * 0.018);
      const amplitude = (15 + R(c.id, 14) * 14) * (1 + 0.3 * m.slow.bass);
      const y =
        offset +
        amplitude * (0.75 * longWave + 0.32 * fold + 0.12 * small) +
        m.impulse *
          s.impulse *
          8 *
          Math.sin(u * 10 - t * 1.6 + phase) *
          Math.exp(-Math.pow((u - 0.5) * 2, 2));
      const xx = x + 5 * Math.sin(offset * 0.03 + t * 0.6 + u * 5) * (1 + m.slow.mid * 0.5);
      if (j === 0) g.moveTo(xx, y);
      else g.lineTo(xx, y);
    }
    g.stroke();
  }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  g.save();
  g.lineCap = 'square';
  g.lineJoin = 'round';
  blocks(g, t, intro);
  for (const c of patches) {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.23) : quiet;
    const x = c.x + 16 * Math.sin(t * 0.38 + c.phase) + m.slow.bass * 8 * Math.cos(c.phase);
    const y = c.y + 14 * Math.cos(t * 0.49 + c.phase);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale, entry.scale);
    g.rotate(
      c.angle +
        0.16 * Math.sin(t * 0.42 + c.phase) * (1 + s.motion) +
        m.slow.mid * 0.09 * Math.cos(c.phase),
    );
    bundle(g, c, t, m, s, 0);
    bundle(g, c, t + 1.7, m, s, 1);
    g.restore();
  }
  g.restore();
  return s;
}
