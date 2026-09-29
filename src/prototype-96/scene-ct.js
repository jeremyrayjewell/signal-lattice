import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(42196, i * 503 + k);
const palette = ['#721817', '#FA9F42', '#2B4162', '#0B6E4F', '#E0E0E2'];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const patches = Array.from({ length: 280 }, (_, id) => ({
  id,
  x: R(id, 0) * 1220 - 130,
  y: R(id, 1) * 800 - 130,
  size: 145 + R(id, 2) * 36,
  phase: R(id, 3) * TAU,
  angle: R(id, 4) * TAU,
  spin: (R(id, 5) - 0.5) * 0.065,
}));
const boards = new Map();
function checker(c) {
  if (boards.has(c.id)) return boards.get(c.id);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 160;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000000';
  g.fillRect(0, 0, 160, 160);
  for (let row = 0; row < 20; row++)
    for (let col = 0; col < 20; col++) {
      if ((row + col) % 2 === 0) continue;
      g.fillStyle = palette[Math.floor(R(c.id, 20 + row * 20 + col) * 5)];
      g.fillRect(col * 8, row * 8, 8, 8);
    }
  boards.set(c.id, canvas);
  return canvas;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (const c of patches) {
    const e = introFor(c.id, intro, 390);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.18) : quiet;
    const size = c.size * (1 + 0.045 * Math.sin(t * 0.71 + c.phase) + m.slow.bass * 0.045),
      cell = size / 20;
    g.save();
    g.translate(
      c.x + e.dx + 22 * Math.sin(t * 0.43 + c.phase),
      c.y + e.dy + 22 * Math.cos(t * 0.49 + c.phase),
    );
    g.scale(e.scale, e.scale);
    g.rotate(c.angle + t * c.spin + 0.16 * Math.sin(t * 0.53 + c.phase) * (1 + s.motion * 0.3));
    const board = checker(c),
      bend = size * (0.1 + 0.025 * Math.sin(t * 0.67 + c.phase) + m.impulse * s.impulse * 0.05);
    for (let col = 0; col < 20; col++) {
      const phase = col * 0.2 + c.phase;
      const shift =
        bend * Math.sin(phase + t * 0.81) +
        size * 0.035 * Math.cos(col * 0.47 - t * 0.59 + c.phase) +
        m.slow.mid * size * 0.025 * Math.sin(col * 0.31 + t);
      g.drawImage(
        board,
        col * 8,
        0,
        8,
        160,
        -size / 2 + col * cell,
        -size / 2 + shift,
        cell + 0.18,
        size,
      );
    }
    g.restore();
  }
  g.restore();
  return s;
}
