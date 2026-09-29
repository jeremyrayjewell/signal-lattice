import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(69211, id * 101 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Flat, muted palette on black, independent of the source's exact hex values.
const palette = [
  [345, 32, 66],
  [195, 68, 58],
  [330, 58, 62],
  [195, 28, 46],
  [24, 10, 58],
  [24, 58, 62],
  [20, 10, 90],
  [160, 14, 42],
  [358, 62, 58],
  [270, 12, 42],
];
const hsl = (idx, l = 0, sExtra = 0, alpha = 1) => {
  const [h, s0, li] = palette[idx];
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, li + l))}% / ${alpha})`;
};
const COLS = 8,
  ROWS = 5,
  CELL = 120;
// Each cell fixes its own rotation/mirror, comb colors and teeth counts once
// (seeded); only rotation offset, taper depth and arc rotation animate per frame.
const cells = Array.from({ length: COLS * ROWS }, (_, id) => {
  const col = id % COLS,
    row = Math.floor(id / COLS);
  const baseRot = (Math.floor(r(id, 1) * 4) * Math.PI) / 2;
  const flipX = r(id, 2) < 0.5 ? -1 : 1,
    flipY = r(id, 3) < 0.5 ? -1 : 1;
  const colorA = Math.floor(r(id, 4) * palette.length),
    colorB = Math.floor(r(id, 5) * palette.length);
  const teethA = 6 + Math.floor(r(id, 6) * 10),
    teethB = 6 + Math.floor(r(id, 7) * 10);
  const hasArc = r(id, 8) < 0.34;
  const arcRot = r(id, 9) * TAU,
    arcFill = r(id, 10) < 0.4;
  return {
    id,
    col,
    row,
    baseRot,
    flipX,
    flipY,
    colorA,
    colorB,
    teethA,
    teethB,
    hasArc,
    arcRot,
    arcFill,
  };
});

// Two independently generated "sawtooth comb" fans anchored at opposite
// corners: a row of triangular spikes along one edge, closed by a tapering
// diagonal back to the anchor corner. Own zigzag construction (index-based
// alternation, own taper endpoints), not the source's vertex loop.
function combTopLeft(R, teeth, taper) {
  const pts = [[-R, -R]];
  for (let i = 0; i <= teeth; i++) {
    const x = -R + (2 * R * i) / teeth;
    const y = i % 2 === 0 ? -R : taper[0] + (taper[1] - taper[0]) * (i / teeth);
    pts.push([x, y]);
  }
  return pts;
}
function combBottomRight(R, teeth, taper) {
  const pts = [[R, R]];
  for (let i = 0; i <= teeth; i++) {
    const y = (R * i) / teeth;
    const x = i % 2 === 0 ? R : taper[0] + (taper[1] - taper[0]) * (i / teeth);
    pts.push([x, y]);
  }
  return pts;
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
    ({
      id,
      col,
      row,
      baseRot,
      flipX,
      flipY,
      colorA,
      colorB,
      teethA,
      teethB,
      hasArc,
      arcRot,
      arcFill,
    }) => {
      const entry = introFor(id, intro, 400);
      if (!entry.active) return;
      // A small per-cell delay keyed to grid position sends the same transient
      // sweeping diagonally across the grid rather than flashing every cell at once.
      const ripple = (col + row) * 0.018;
      const m = at(0.05 + ripple);
      const selected = (0.5 + 0.5 * Math.sin(id * 1.3 - t * 0.6 + r(id, 30) * TAU)) ** 6;
      const flash = m.impulse * s.impulse * 16;
      const cx = col * CELL + CELL / 2 + entry.dx,
        cy = row * CELL + CELL / 2 + entry.dy;
      const R = CELL * 0.48 * (hasArc ? 0.72 : 1) * entry.scale;
      g.save();
      g.translate(cx, cy);
      g.rotate(baseRot);
      g.scale(flipX, flipY);

      // Bass swells the taper depth (teeth read longer/shorter); mids offset the
      // two combs' relative rotation, like a slow scissoring motion.
      const depth = 1 + 0.22 * m.slow.bass * s.motion;
      const scissor = t * (0.03 + r(id, 11) * 0.05) * (1 + 0.6 * m.slow.mid);
      const taperA = [
        R * (0.86 + 0.06 * Math.sin(t * 0.2 + r(id, 12) * TAU)) * depth,
        -R * 0.16 * depth,
      ];
      const taperB = [
        R * (0.44 + 0.06 * Math.cos(t * 0.23 + r(id, 13) * TAU)) * depth,
        -R * 0.86 * depth,
      ];

      g.save();
      g.rotate(scissor * 0.3);
      const ptsA = combTopLeft(R, teethA, taperA);
      g.beginPath();
      ptsA.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
      g.closePath();
      g.fillStyle = hsl(colorA, flash + 4 * selected + 3 * m.fast.centroid, 4 * m.fast.rms);
      g.fill();
      g.restore();

      g.save();
      g.rotate(-scissor * 0.3);
      const ptsB = combBottomRight(R, teethB, taperB);
      g.beginPath();
      ptsB.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
      g.closePath();
      g.fillStyle = hsl(colorB, flash + 4 * selected + 3 * m.fast.centroid, 4 * m.fast.rms);
      g.fill();
      g.restore();

      if (hasArc) {
        const rot = arcRot + t * (0.06 + r(id, 14) * 0.1) * (1 + 0.7 * m.fast.high);
        g.save();
        g.rotate(rot);
        g.beginPath();
        g.arc(0, 0, R * 1.02, 0, Math.PI);
        if (arcFill) {
          g.lineTo(-R * 1.02, 0);
          g.closePath();
          g.fillStyle = `hsla(0 0% 98% / ${0.7 + 0.2 * selected + 0.15 * m.fast.rms})`;
          g.fill();
        } else {
          g.strokeStyle = `hsla(0 0% 98% / ${0.75 + 0.2 * selected + 0.15 * m.fast.rms})`;
          g.lineWidth = CELL * (0.025 + 0.015 * selected) + m.residue * 1.2;
          g.stroke();
        }
        g.restore();
      }
      g.restore();
    },
  );

  return s;
}
