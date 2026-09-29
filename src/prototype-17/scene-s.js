import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(81733, id * 131 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Soft pastel palette, independent of the source's exact hex values.
const palette = [
  [204, 72, 78],
  [265, 18, 54],
  [140, 52, 74],
  [352, 62, 54],
  [52, 78, 76],
];
const hsl = (idx, l = 0, sExtra = 0, alpha = 1) => {
  const [h, s0, li] = palette[idx];
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, li + l))}% / ${alpha})`;
};
const COLS = 10,
  ROWS = 6,
  CELL = 96;
// Each cell fixes its own archetype, base rotation and sub-shape colors once
// (seeded); only spacing, scale and noise intensity animate per frame.
const cells = Array.from({ length: COLS * ROWS }, (_, id) => {
  const col = id % COLS,
    row = Math.floor(id / COLS);
  const archetype = r(id, 1) < 0.5 ? 0 : 1;
  const baseRot = (Math.floor(r(id, 2) * 4) * Math.PI) / 2;
  const colors = Array.from({ length: 8 }, (_, k) => Math.floor(r(id, 10 + k) * palette.length));
  const wedgeCount = 3 + Math.floor(r(id, 20) * 2);
  const barCount = 4 + Math.floor(r(id, 21) * 2);
  const barHeights = Array.from({ length: 6 }, (_, k) => (r(id, 30 + k) < 0.5 ? 1 : 2));
  return { id, col, row, archetype, baseRot, colors, wedgeCount, barCount, barHeights };
});

// Archetype A: a large circle, a fan of nested quarter-wedges stepping inward
// from one edge, a corner pie and a corner triangle. Independent geometry, not
// the source's arc/ellipse calls.
function drawArcFan(g, R, colors, wedgeCount, spacing) {
  g.fillStyle = hsl(colors[0]);
  g.beginPath();
  g.arc(-R * 0.5, 0, R * 0.5, 0, TAU);
  g.fill();
  const ar = R * 0.5 * spacing;
  for (let i = 0; i < wedgeCount; i++) {
    const ax = R - ar * 0.5 - i * ar * 0.55;
    if (ax < ar * 0.2) break;
    g.fillStyle = hsl(colors[1 + (i % 4)]);
    g.beginPath();
    g.moveTo(ax, 0);
    g.arc(ax, 0, ar * 0.5, 0, Math.PI / 2);
    g.closePath();
    g.fill();
  }
  g.fillStyle = hsl(colors[6]);
  g.beginPath();
  g.moveTo(R, R);
  g.arc(R, R, R - ar * 0.5, Math.PI, Math.PI * 1.5);
  g.closePath();
  g.fill();
  g.fillStyle = hsl(colors[7]);
  g.beginPath();
  g.moveTo(R, -R);
  g.lineTo(0, -ar * 0.5);
  g.lineTo(R, 0);
  g.closePath();
  g.fill();
}
// Archetype B: a corner triangle, a comb of alternating-height vertical bars
// stepping inward from one edge, and a circle near the opposite corner.
function drawBarComb(g, R, colors, barCount, barHeights, spacing) {
  g.fillStyle = hsl(colors[0]);
  g.beginPath();
  g.moveTo(-R, -R);
  g.lineTo(-R, R);
  g.lineTo(0, -R);
  g.closePath();
  g.fill();
  const rr = (R / 5) * spacing;
  for (let i = 0; i < barCount; i++) {
    const rx = R - rr * 0.5 - i * rr;
    if (rx < 0) break;
    const h = R * barHeights[i % barHeights.length];
    g.fillStyle = hsl(colors[1 + (i % 4)]);
    g.fillRect(rx - rr * 0.25, -h / 2, rr * 0.5, h);
  }
  const er = R * 0.66;
  g.fillStyle = hsl(colors[6]);
  g.beginPath();
  g.arc(-er * 0.5, R - er * 0.9, er * 0.5, 0, TAU);
  g.fill();
}

// A fine grayscale noise-dither texture, independent of the cell grid,
// blended with 'overlay' so it lightens/darkens the flat shapes beneath —
// echoing the source's tiled blend-mode static without copying its loop.
const W = 960,
  H = 540,
  NOISE_CELL = 14;
const noiseCols = Math.ceil(W / NOISE_CELL) + 1,
  noiseRows = Math.ceil(H / NOISE_CELL) + 1;
const noiseTiles = [];
for (let ny = 0; ny < noiseRows; ny++)
  for (let nx = 0; nx < noiseCols; nx++) {
    const id = ny * noiseCols + nx;
    noiseTiles.push({ nx, ny, bright: r(90000 + id, 1), baseAlpha: r(90000 + id, 2) * 0.5 });
  }

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#050505');
  g.lineJoin = 'round';
  g.lineCap = 'round';

  cells.forEach(
    ({ id, col, row, archetype, baseRot, colors, wedgeCount, barCount, barHeights }) => {
      const entry = introFor(id, intro, 400);
      if (!entry.active) return;
      const ripple = (col + row) * 0.018;
      const m = at(0.05 + ripple);
      const phase = r(id, 40) * TAU;
      const selected = (0.5 + 0.5 * Math.sin(id * 1.3 - t * 0.6 + phase)) ** 6;
      const flash = m.impulse * s.impulse * 18;
      const cx = col * CELL + CELL / 2 + entry.dx,
        cy = row * CELL + CELL / 2 + entry.dy;
      const R = CELL * 0.46;
      const rot = baseRot + 0.02 * s.motion * Math.sin(t * 0.3 + phase);
      const scale =
        (0.94 + 0.06 * Math.sin(t * 0.18 + phase)) * (1 + 0.14 * m.slow.bass) * entry.scale;
      const spacing =
        1 + 0.22 * Math.sin(t * (0.1 + r(id, 41) * 0.08) + phase) * (1 + 0.5 * m.slow.mid);
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.scale(scale, scale);
      g.save();
      g.globalAlpha = 1;
      const tint = flash + 4 * selected + 3 * m.fast.centroid;
      if (tint) g.filter = `brightness(${1 + tint / 100})`;
      if (archetype === 0) drawArcFan(g, R, colors, wedgeCount, spacing);
      else drawBarComb(g, R, colors, barCount, barHeights, spacing);
      g.filter = 'none';
      g.restore();
      g.restore();
    },
  );

  // Global noise-dither overlay, independent of cell boundaries. Highs add a
  // subtle shimmer; transients briefly spike it into a static burst. Skipped
  // while the scene is still being introduced (intro<1) so this ancillary
  // texture layer doesn't tint the outgoing scene underneath.
  if (intro < 1) return s;
  const amb = at(0.3);
  g.save();
  g.globalCompositeOperation = 'overlay';
  const boost = 1 + 0.5 * amb.fast.high + 1.6 * amb.impulse * s.impulse;
  noiseTiles.forEach(({ nx, ny, bright, baseAlpha }) => {
    g.fillStyle = `hsla(0 0% ${Math.round(bright * 100)}% / ${Math.min(1, baseAlpha * boost)})`;
    g.fillRect(
      nx * NOISE_CELL - NOISE_CELL / 2,
      ny * NOISE_CELL - NOISE_CELL / 2,
      NOISE_CELL,
      NOISE_CELL,
    );
  });
  g.restore();

  return s;
}
