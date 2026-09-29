import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(37711, id * 89 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Flat, unblended Memphis-style palette independent of the source's exact hex values.
const palette = [
  [340, 42, 66],
  [28, 72, 54],
  [230, 42, 34],
  [200, 66, 52],
  [152, 58, 24],
  [72, 40, 34],
  [54, 88, 58],
  [327, 55, 52],
  [174, 20, 56],
  [30, 8, 58],
];
const hsl = (idx, l = 0, sExtra = 0, alpha = 1) => {
  const [h, s0, li] = palette[idx];
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, li + l))}% / ${alpha})`;
};
const COLS = 11,
  ROWS = 6,
  CELL = 90;
// Each cell fixes its own background, motif archetype/colors and arc accents once
// (seeded), so the grid's identity is stable; only rotation, scale and color
// intensity animate per frame.
const cells = Array.from({ length: COLS * ROWS }, (_, id) => {
  const col = id % COLS,
    row = Math.floor(id / COLS);
  const bg = Math.floor(r(id, 1) * palette.length);
  const motifType = Math.floor(r(id, 2) * 4);
  const motifColors = [
    Math.floor(r(id, 3) * palette.length),
    Math.floor(r(id, 4) * palette.length),
    Math.floor(r(id, 5) * palette.length),
  ];
  const arcCount = 1 + Math.floor(r(id, 6) * 3);
  const arcs = Array.from({ length: arcCount }, (_, a) => {
    const k = 10 + a * 6;
    const roll = r(id, k);
    const mode = roll < 0.34 ? 'black' : roll < 0.68 ? 'white' : 'palette';
    const colorIdx = Math.floor(r(id, k + 1) * palette.length);
    const radius = CELL * (0.22 + 0.28 * r(id, k + 2));
    const ox = (r(id, k + 3) - 0.5) * CELL * 0.5,
      oy = (r(id, k + 4) - 0.5) * CELL * 0.5;
    const dashed = r(id, k + 5) < 0.4;
    return {
      mode,
      colorIdx,
      radius,
      ox,
      oy,
      dashed,
      phase: roll * TAU,
      speed: 0.15 + r(id, k + 1) * 0.35,
    };
  });
  return { id, col, row, bg, motifType, motifColors, arcs };
});

// Four flat-fill triangle archetypes echoing the source's split/pinwheel/fan/zigzag
// variety, independently defined (fixed geometry, not the source's vertex sets).
function motif(g, type, colors, R) {
  const c = (i) => colors[i % colors.length];
  if (type === 0) {
    g.fillStyle = c(0);
    g.beginPath();
    g.moveTo(-R, -R);
    g.lineTo(R, -R);
    g.lineTo(-R, R);
    g.closePath();
    g.fill();
    g.fillStyle = c(1);
    g.beginPath();
    g.moveTo(R, R);
    g.lineTo(-R, R);
    g.lineTo(R, -R);
    g.closePath();
    g.fill();
  } else if (type === 1) {
    for (let i = 0; i < 4; i++) {
      g.fillStyle = c(i);
      const a0 = (i / 4) * TAU - Math.PI / 4,
        a1 = ((i + 1) / 4) * TAU - Math.PI / 4;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a0) * R * 1.42, Math.sin(a0) * R * 1.42);
      g.lineTo(Math.cos(a1) * R * 1.42, Math.sin(a1) * R * 1.42);
      g.closePath();
      g.fill();
    }
  } else if (type === 2) {
    for (let i = 0; i < 3; i++) {
      g.fillStyle = c(i);
      const x0 = -R + i * ((2 * R) / 3),
        x1 = -R + (i + 1) * ((2 * R) / 3);
      g.beginPath();
      g.moveTo(x0, -R);
      g.lineTo(x1, -R);
      g.lineTo(0, R);
      g.closePath();
      g.fill();
    }
  } else {
    const xs = [-R, -R / 3, R / 3, R];
    for (let i = 0; i < 3; i++) {
      g.fillStyle = c(i);
      const mid = (xs[i] + xs[i + 1]) / 2;
      g.beginPath();
      if (i % 2 === 0) {
        g.moveTo(xs[i], -R);
        g.lineTo(xs[i + 1], -R);
        g.lineTo(mid, R);
      } else {
        g.moveTo(xs[i], R);
        g.lineTo(xs[i + 1], R);
        g.lineTo(mid, -R);
      }
      g.closePath();
      g.fill();
    }
  }
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#f4efe4');
  g.lineJoin = 'round';
  g.lineCap = 'butt';

  cells.forEach(({ id, col, row, bg, motifType, motifColors, arcs }) => {
    const entry = introFor(id, intro, 400);
    if (!entry.active) return;
    // A small per-cell delay keyed to grid position sends the same transient
    // sweeping diagonally across the grid rather than flashing every cell at once.
    const ripple = (col + row) * 0.018;
    const m = at(0.05 + ripple);
    const selected = (0.5 + 0.5 * Math.sin(id * 1.3 - t * 0.6 + r(id, 30) * TAU)) ** 6;
    const flash = m.impulse * s.impulse * 20;
    const cx = col * CELL + CELL / 2 + entry.dx,
      cy = row * CELL + CELL / 2 + entry.dy;
    g.save();
    g.translate(cx, cy);
    g.scale(entry.scale, entry.scale);

    g.fillStyle = hsl(bg, flash + 4 * m.fast.rms + 3 * selected, 6 * m.fast.centroid);
    g.fillRect(-CELL / 2, -CELL / 2, CELL, CELL);

    const R = CELL * 0.42 * (1 + 0.08 * m.slow.bass * s.motion);
    const rot = r(id, 7) * TAU + t * (0.05 + r(id, 8) * 0.09) * (1 + 0.5 * m.slow.mid);
    g.save();
    g.rotate(rot);
    motif(
      g,
      motifType,
      motifColors.map((ci) => hsl(ci, 3 * selected, 4 * m.fast.centroid)),
      R,
    );
    g.restore();

    arcs.forEach((arc) => {
      const ang = arc.phase + t * arc.speed * (1 + 0.8 * m.fast.high) * (1 + 0.5 * s.articulation);
      g.save();
      g.translate(arc.ox, arc.oy);
      g.rotate(ang);
      g.beginPath();
      g.arc(0, 0, arc.radius, 0, Math.PI);
      g.strokeStyle =
        arc.mode === 'black'
          ? `hsla(0 0% 4% / ${0.75 + 0.2 * selected})`
          : arc.mode === 'white'
            ? `hsla(0 0% 98% / ${0.85 + 0.15 * selected})`
            : hsl(arc.colorIdx, 10, 0, 0.85 + 0.15 * selected);
      g.lineWidth = CELL * (0.03 + 0.02 * selected) + m.residue * 1.5;
      g.setLineDash(arc.dashed ? [g.lineWidth * 1.1, g.lineWidth * (2.4 + 2 * r(id, 9))] : []);
      g.stroke();
      g.restore();
    });

    g.restore();
  });

  return s;
}
