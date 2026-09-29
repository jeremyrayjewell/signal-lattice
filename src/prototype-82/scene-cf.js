import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(92382, i * 331 + k);
const palette = [
  '#050505',
  '#F5F1E8',
  '#D6C7AA',
  '#E12D25',
  '#F15A24',
  '#F2C230',
  '#005B78',
  '#173F5F',
  '#7A1F1F',
  '#557A3E',
  '#9B9485',
  '#C9C9C2',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const layers = Array.from({ length: 180 }, (_, id) => ({
  id,
  x: R(id, 0) * 1120 - 80,
  y: R(id, 1) * 700 - 80,
  size: 280 - (235 * id) / 179,
  phase: R(id, 2) * TAU,
  checker: R(id, 3) < 0.53,
  count: [10, 20, 30][Math.floor(R(id, 4) * 3)],
  color: palette[Math.floor(R(id, 5) * 12)],
  hole: 0.26 + R(id, 6) * 0.55,
}));
const boards = new Map();
function board(c, g) {
  if (boards.has(c.id)) return boards.get(c.id);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = c.count * 8;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < c.count; y++)
    for (let x = 0; x < c.count; x++)
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = palette[Math.floor(R(c.id, 20 + y * c.count + x) * 12)];
        ctx.fillRect(x * 8, y * 8, 8, 8);
      }
  const pattern = g.createPattern(canvas, 'repeat');
  boards.set(c.id, pattern);
  return pattern;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const c of layers) {
    const e = introFor(c.id, intro, 390);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.17) : quiet;
    const size = c.size * (1 + 0.06 * Math.sin(t * 0.71 + c.phase) + m.slow.bass * 0.06);
    g.save();
    g.translate(
      c.x + e.dx + 23 * Math.sin(t * 0.43 + c.phase) * (1 + s.motion * 0.25),
      c.y + e.dy + 21 * Math.cos(t * 0.47 + c.phase),
    );
    g.scale(e.scale, e.scale);
    g.rotate(0.018 * Math.sin(t * 0.51 + c.phase));
    if (c.checker) {
      const pat = board(c, g),
        scale = size / (c.count * 8),
        cell = size / c.count;
      const drift = cell * (t * 0.21 + 0.35 * Math.sin(t * 0.79 + c.phase) + m.slow.mid * 0.4);
      pat.setTransform(
        new DOMMatrix([
          scale,
          0,
          0,
          scale,
          -size / 2 + drift,
          -size / 2 + cell * 0.4 * Math.sin(t * 0.67 + c.phase),
        ]),
      );
      g.fillStyle = pat;
      g.fillRect(-size / 2, -size / 2, size, size);
    } else {
      const hole =
        size *
        Math.max(
          0.16,
          Math.min(
            0.88,
            c.hole + 0.09 * Math.sin(t * 0.89 + c.phase) + m.impulse * s.impulse * 0.07,
          ),
        );
      g.fillStyle = c.color;
      g.beginPath();
      g.rect(-size / 2, -size / 2, size, size);
      g.rect(-hole / 2, -hole / 2, hole, hole);
      g.fill('evenodd');
      g.strokeStyle = '#ffffff';
      for (let j = 0; j < 4; j++) {
        const phase = c.phase + j * 1.6,
          points = [];
        for (let k = 0; k < 5; k++)
          points.push([
            (R(c.id, 1100 + j * 15 + k * 2) - 0.5) * size * 1.55 +
              size * 0.11 * Math.sin(t * 0.93 + phase + k),
            (R(c.id, 1101 + j * 15 + k * 2) - 0.5) * size * 1.55 +
              size * 0.11 * Math.cos(t * 0.87 + phase + k * 0.8),
          ]);
        g.lineWidth = size * (0.012 + R(c.id, j + 1200) * 0.034) * (1 + m.fast.rms * 0.2);
        g.beginPath();
        g.moveTo(...points[0]);
        for (let k = 1; k < 4; k++)
          g.quadraticCurveTo(
            ...points[k],
            (points[k][0] + points[k + 1][0]) / 2,
            (points[k][1] + points[k + 1][1]) / 2,
          );
        g.lineTo(...points[4]);
        g.stroke();
      }
    }
    g.restore();
  }
  g.restore();
  return s;
}
