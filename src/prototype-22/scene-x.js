import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(93017, id * 191 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Flat palette independent of the source's exact hex values.
const palette = [
  [50, 88, 42],
  [190, 68, 32],
  [30, 28, 86],
  [350, 78, 44],
  [20, 10, 6],
];
const hsl = (idx, l = 0, sExtra = 0, alpha = 1) => {
  const [h, s0, li] = palette[idx];
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, li + l))}% / ${alpha})`;
};
const W = 960,
  H = 540,
  COLS = 8,
  ROWS = 4,
  CELL = 135;
const xOffset = (W - COLS * CELL) / 2,
  yOffset = (H - ROWS * CELL) / 2;
// Each tile fixes its own color pair, dot-lattice rotation/squash/density
// once (seeded); the dot positions/radii are precomputed once per tile since
// they don't change frame to frame (only a small pulse/rotation drift does).
const tiles = Array.from({ length: COLS * ROWS }, (_, id) => {
  const col = id % COLS,
    row = Math.floor(id / COLS);
  let bgIdx = Math.floor(r(id, 1) * palette.length),
    dotIdx = Math.floor(r(id, 2) * palette.length);
  if (dotIdx === bgIdx) dotIdx = (dotIdx + 1) % palette.length;
  const rotation = r(id, 3) * TAU;
  const offsetX = (r(id, 4) - 0.5) * CELL,
    offsetY = (r(id, 5) - 0.5) * CELL;
  const squash = 0.3 + 0.5 * r(id, 6);
  const density = 4 + Math.floor(r(id, 7) * 3);
  const sg = CELL / density,
    range = CELL * 0.9;
  const dots = [];
  let k = 0;
  for (let ey = -range; ey <= range; ey += sg) {
    for (let ex = -range; ex <= range; ex += sg) {
      const taper = Math.max(0, sg * (1 - Math.abs(ex) / range));
      if (taper > 1) dots.push({ ex, ey, rad: taper * (0.5 + 0.5 * r(id, 100 + k)) });
      k++;
    }
  }
  return { id, col, row, bgIdx, dotIdx, rotation, offsetX, offsetY, squash, density, dots };
});

// A sparser layer of smooth, continuously looping scribble curves (own
// multi-harmonic closed-path construction, not the source's noise-driven
// curve), in bright accent tones distinct from the tile palette.
const accents = ['#0af0f0', '#f7f4ee', '#0a0908'];
const LOOP_COUNT = 18;
const loops = Array.from({ length: LOOP_COUNT }, (_, k) => {
  const id = 1000 + k;
  const cx = -80 + r(id, 1) * (W + 160),
    cy = -80 + r(id, 2) * (H + 160);
  const scale = 60 + 150 * r(id, 3);
  const rotationBase = r(id, 4) * TAU;
  const accent = accents[Math.floor(r(id, 5) * accents.length)];
  const f1 = 2 + Math.floor(r(id, 6) * 3),
    f2 = 3 + Math.floor(r(id, 7) * 4);
  const a1 = 0.25 + 0.25 * r(id, 8),
    a2 = 0.12 + 0.15 * r(id, 9);
  const p1 = r(id, 10) * TAU,
    p2 = r(id, 11) * TAU;
  const weight = 1.5 + 5 * r(id, 12);
  return { id, cx, cy, scale, rotationBase, accent, f1, f2, a1, a2, p1, p2, weight };
});

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#f7f2ea');
  g.lineJoin = 'round';
  g.lineCap = 'round';

  tiles.forEach(({ id, col, row, bgIdx, dotIdx, rotation, offsetX, offsetY, squash, dots }) => {
    const entry = introFor(id, intro, 420);
    if (!entry.active) return;
    const ripple = (col + row) * 0.016;
    const m = at(0.05 + ripple);
    const phase = r(id, 20) * TAU;
    const selected = (0.5 + 0.5 * Math.sin(id * 1.3 - t * 0.6 + phase)) ** 6;
    const flash = m.impulse * s.impulse;
    const cx = (col + 0.5) * CELL + xOffset + entry.dx,
      cy = (row + 0.5) * CELL + yOffset + entry.dy;
    const tileScale =
      (0.95 + 0.05 * Math.sin(t * 0.15 + phase)) * (1 + 0.1 * m.slow.bass) * entry.scale;
    g.save();
    g.translate(cx, cy);
    g.scale(tileScale, tileScale);
    g.beginPath();
    g.rect(-CELL / 2, -CELL / 2, CELL, CELL);
    g.clip();
    g.fillStyle = hsl(bgIdx, 4 * selected + 3 * m.fast.centroid + 8 * flash, 4 * m.fast.rms);
    g.fillRect(-CELL / 2, -CELL / 2, CELL, CELL);
    g.save();
    g.translate(offsetX, offsetY);
    g.rotate(rotation + t * (r(id, 8) - 0.5) * 0.03 * (1 + 0.5 * m.slow.mid));
    g.scale(1, squash);
    g.fillStyle = hsl(dotIdx, 4 * selected + 3 * m.fast.centroid, 4 * m.fast.rms);
    const pulse = 1 + 0.18 * m.slow.bass * Math.sin(t * 0.3 + phase);
    dots.forEach(({ ex, ey, rad }) => {
      g.beginPath();
      g.arc(ex, ey, Math.max(0.4, (rad / 2) * pulse), 0, TAU);
      g.fill();
    });
    g.restore();
    g.restore();
  });

  const amb = at(0.3);
  g.save();
  g.globalCompositeOperation = 'overlay';
  loops.forEach(({ id, cx, cy, scale, rotationBase, accent, f1, f2, a1, a2, p1, p2, weight }) => {
    const entry = introFor(id, intro, 400);
    if (!entry.active) return;
    const phase = r(id, 20) * TAU;
    const drift = 10 + 8 * r(id, 21);
    const x = cx + drift * s.motion * Math.sin(t * 0.14 + phase) + entry.dx,
      y = cy + drift * s.motion * Math.cos(t * 0.18 + phase * 1.2) + entry.dy;
    const rot = rotationBase + t * (r(id, 22) - 0.5) * 0.05 * (1 + 0.5 * amb.slow.mid);
    const selected = (0.5 + 0.5 * Math.sin(id * 1.4 - t * 0.75 + phase)) ** 7;
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(entry.scale, entry.scale);
    g.beginPath();
    const steps = 90;
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * TAU;
      const px = scale * (Math.cos(u) + a1 * Math.cos(f1 * u + p1) + a2 * Math.cos(f2 * u + p2));
      const py = scale * (Math.sin(u) + a1 * Math.sin(f1 * u + p1) + a2 * Math.sin(f2 * u + p2));
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.strokeStyle = accent;
    g.globalAlpha = 0.5 + 0.25 * amb.fast.high + selected * 0.25 + 0.2 * amb.impulse * s.impulse;
    g.lineWidth = weight;
    g.stroke();
    g.restore();
  });
  g.restore();

  return s;
}
