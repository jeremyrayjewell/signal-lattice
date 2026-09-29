// Finale hybrid of Scene Q ("Ring Clusters", segment 1) and Scene CP ("Dot Counterpoint", Codex,
// segment 7). Q's macro-grid ring clusters and CP's grid of bezier-curve + disc groups are merged
// into one array, tagged and depth-sorted together every frame, drawn in a single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateQ } from '../prototype-15/states.js';
import { stateAt as stateCP } from '../prototype-92/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};

// ---- Scene Q's own population ----
const qr = (id, k = 0) => randomAt(24107, id * 127 + k);
const qPalette = [
  [355, 72, 45],
  [86, 62, 52],
  [46, 88, 52],
  [335, 78, 58],
  [228, 48, 40],
  [312, 32, 38],
  [345, 55, 20],
  [22, 68, 38],
];
const qLerp = (idxA, idxB, frac, lExtra = 0, sExtra = 0, alpha = 1) => {
  const [ha, sa, la] = qPalette[idxA],
    [hb, sb, lb] = qPalette[idxB];
  const h = ha + (hb - ha) * frac,
    s0 = sa + (sb - sa) * frac,
    l = la + (lb - la) * frac;
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, l + lExtra))}% / ${alpha})`;
};
const Q_MACRO_COLS = 9,
  Q_MACRO_ROWS = 5,
  Q_CELL = 108;
const qClusters = [];
{
  let uid = 0;
  for (let mc = 0; mc < Q_MACRO_COLS * Q_MACRO_ROWS; mc++) {
    const col = mc % Q_MACRO_COLS,
      row = Math.floor(mc / Q_MACRO_COLS);
    const split = qr(mc, 1) < 0.55 ? 1 : 2;
    const sg = Q_CELL / split;
    for (let sx = 0; sx < split; sx++)
      for (let sy = 0; sy < split; sy++) {
        const id = uid++;
        const cx = col * Q_CELL + (sx + 0.5) * sg,
          cy = row * Q_CELL + (sy + 0.5) * sg;
        let ca = Math.floor(qr(id, 10) * qPalette.length),
          cb = Math.floor(qr(id, 11) * qPalette.length);
        if (cb === ca) cb = (cb + 1) % qPalette.length;
        const ringCount = 16 + Math.floor(qr(id, 12) * 10);
        const rotationBase = qr(id, 13) * TAU;
        qClusters.push({ id, cx, cy, sg, ca, cb, ringCount, rotationBase });
      }
  }
}
function drawQCluster(g, c, t, s, at) {
  const { id, cx, cy, sg, ca, cb, ringCount, rotationBase } = c;
  const m = at((id % 9) * 0.025);
  const phase = qr(id, 20) * TAU;
  const drift = 11 + 9 * qr(id, 21);
  const x = cx + drift * s.motion * Math.sin(t * 0.32 + phase) + c.entryDx,
    y = cy + drift * s.motion * Math.cos(t * 0.38 + phase * 1.2) + c.entryDy;
  const scale =
    (0.88 + 0.14 * Math.sin(t * 0.27 + phase)) *
    (1 + 0.32 * m.slow.bass + 0.18 * m.impulse * s.impulse) *
    c.entryScale;
  const rot = rotationBase + t * (qr(id, 22) - 0.5) * 0.11 * (1 + 0.9 * m.slow.mid);
  const selected = (0.5 + 0.5 * Math.sin(id * 1.6 - t * 0.7 + phase)) ** 8;
  const colorPhase = 0.5 + 0.5 * Math.sin(t * (0.11 + qr(id, 23) * 0.12) + phase);
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(scale, scale);
  for (let i = 0; i < ringCount; i++) {
    const er = sg * (1 - i / ringCount);
    const base = 100 + i * 6;
    const offsetChoice = qr(id, base) < 0.5;
    const ox = offsetChoice ? (qr(id, base + 1) - 0.5) * (sg - er) : 0;
    const oy = offsetChoice ? (qr(id, base + 2) - 0.5) * (sg - er) : 0;
    const strokeRoll = qr(id, base + 3);
    const frac = Math.min(1, er / (sg * 2)) * 0.7 + colorPhase * 0.3;
    g.fillStyle = qLerp(ca, cb, frac, 8 * selected + 6 * m.fast.centroid, 4 * m.fast.rms);
    const glowRings = 6;
    g.shadowBlur =
      i < glowRings
        ? er *
          0.55 *
          (1 - (i / glowRings) * 0.4) *
          (1 + 0.6 * m.fast.high + 1.1 * m.impulse * s.impulse)
        : 0;
    g.shadowColor = i < glowRings ? qLerp(cb, ca, frac, 14) : 'transparent';
    g.beginPath();
    g.arc(ox, oy, Math.max(0.5, er / 2), 0, TAU);
    g.fill();
    if (strokeRoll < 0.3) {
      g.strokeStyle = '#050505';
      g.lineWidth = sg * 0.01;
      g.stroke();
    } else if (strokeRoll < 0.55) {
      g.strokeStyle = '#fbf8f2';
      g.lineWidth = sg * 0.01;
      g.stroke();
    }
  }
  g.shadowBlur = 0;
  g.restore();
}

// ---- Scene CP's own population ----
const cpR = (i, k) => randomAt(72792, i * 359 + k);
const cpGroups = Array.from({ length: 45 }, (_, id) => ({
  id,
  x: 48 + (id % 9) * 108,
  y: 54 + Math.floor(id / 9) * 108,
  phase: cpR(id, 0) * TAU,
  count: [2, 4, 8][Math.floor(cpR(id, 1) * 3)],
  corners: cpR(id, 2) > 0.48,
  angle: (Math.floor(cpR(id, 3) * 4) * Math.PI) / 2,
  curves: Array.from({ length: 8 }, (_, j) =>
    Array.from({ length: 4 }, (_, k) => [
      (cpR(id, 10 + j * 8 + k * 2) - 0.5) * 205,
      (cpR(id, 11 + j * 8 + k * 2) - 0.5) * 205,
    ]),
  ),
}));
function cpDisc(g, x, y, r) {
  g.moveTo(x + r, y);
  g.arc(x, y, r, 0, TAU);
}
function drawCPGroup(g, c, t, s, m, entry) {
  g.save();
  g.strokeStyle = '#000000';
  g.fillStyle = '#000000';
  g.save();
  g.translate(c.x + entry.dx, c.y + entry.dy);
  g.scale(entry.scale, entry.scale);
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
  g.save();
  g.translate(
    c.x + entry.dx + 5 * Math.sin(t * 0.49 + c.phase),
    c.y + entry.dy + 5 * Math.cos(t * 0.53 + c.phase),
  );
  g.scale(entry.scale, entry.scale);
  g.rotate(c.angle + 0.18 * Math.sin(t * 0.57 + c.phase) * (1 + s.motion * 0.4));
  if (c.corners) {
    g.beginPath();
    for (let j = 0; j < 4; j++) {
      const r =
        (cpR(c.id, j + 100) < 0.5 ? 6.5 : 13) *
        (1 + 0.1 * Math.sin(t * 0.81 + c.phase + j) + m.slow.bass * 0.09);
      const x = (j % 2 ? 1 : -1) * 39,
        y = (j < 2 ? -1 : 1) * 39;
      cpDisc(g, x, y, r);
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
      if (cpR(c.id, id + 120) > 0.5) cpDisc(g, x, y, radius);
      else {
        const separation =
          spacing * (0.24 + 0.035 * Math.sin(t * 1.07 + ph) + m.impulse * s.impulse * 0.06);
        for (let q = 0; q < 4; q++)
          cpDisc(
            g,
            x + (q % 2 ? 1 : -1) * separation,
            y + (q < 2 ? -1 : 1) * separation,
            radius * (q === 0 ? 0.39 : 0.44),
          );
      }
    }
  g.fill();
  g.restore();
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sQ = stateQ(elapsed),
    sCP = stateCP(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#f7f2ea');
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.save();

  const pool = [];
  qClusters.forEach((c) => {
    const entry = introFor(c.id, intro, 420);
    if (!entry.active) return;
    pool.push({
      kind: 'ring',
      c: { ...c, entryDx: entry.dx, entryDy: entry.dy, entryScale: entry.scale },
      depth: (qr(c.id, 900) - 0.5) * 240,
    });
  });
  cpGroups.forEach((c) => {
    const entry = introFor(c.id + 3000, intro, 390);
    if (!entry.active) return;
    pool.push({ kind: 'group', c, entry, depth: (cpR(c.id, 900) - 0.5) * 240 });
  });
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'ring') drawQCluster(g, item.c, t, sQ, at);
    else {
      const m = reactive ? controls.at(t - 0.02 - (item.c.x / 960) * 0.17) : zero;
      drawCPGroup(g, item.c, t, sCP, m, item.entry);
    }
  }
  g.restore();
  return sCP;
}
