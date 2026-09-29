import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(64213, id * 257 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
// Own broad neon palette (16 hues plus white and near-black), independent
// of the source's exact hex values.
const HUES = [350, 325, 20, 46, 64, 96, 150, 175, 195, 215, 255, 280, 300, 330, 10, 60];

// Sparse flat-colored accent squares on a fine grid — own placement/timing,
// slowly reshuffling a subset of cells over time rather than the source's
// one-time random draw.
const CELL = 34,
  COLS = Math.ceil(W / CELL) + 1,
  ROWS = Math.ceil(H / CELL) + 1;
const accentCells = [];
for (let row = 0; row < ROWS; row++)
  for (let col = 0; col < COLS; col++) {
    const id = 5000 + row * COLS + col;
    accentCells.push({ id, col, row, cx: col * CELL + CELL / 2, cy: row * CELL + CELL / 2 });
  }

// Each swirl is a stack of nested squircle (rounded-square) outlines that
// progressively rotate, drift sideways and squash as they shrink inward —
// an own independently-authored rotation/drift/squash curve, not the
// source's exact scale/shift/rotate mapping functions.
const SWIRL_COUNT = 58,
  RING_COUNT = 40;
const swirls = Array.from({ length: SWIRL_COUNT }, (_, k) => {
  const id = k;
  const x = -W * 0.15 + r(id, 1) * (W * 1.3),
    y = -H * 0.15 + r(id, 2) * (H * 1.3);
  const baseRot = [0, Math.PI / 2, Math.PI, Math.PI * 1.5][Math.floor(r(id, 3) * 4)];
  const maxR = 55 + r(id, 4) * 95;
  const hueIdx = Math.floor(r(id, 5) * HUES.length);
  const accentChance = 0.06 + r(id, 6) * 0.3;
  const twist = (r(id, 7) - 0.5) * 2.2;
  const spinSpeed = (r(id, 8) - 0.5) * 0.32;
  const phase = r(id, 9) * TAU;
  const driftAmp = 0.3 + 0.4 * r(id, 10);
  return { id, x, y, baseRot, maxR, hueIdx, accentChance, twist, spinSpeed, phase, driftAmp };
});

function drawField(g, t, s, at, intro) {
  accentCells.forEach((c) => {
    const step = Math.floor(t * 0.35 + c.id * 0.017);
    const on = r(c.id + step * 7919, 1) < 0.115;
    if (!on) return;
    const entry = introFor(c.id, intro, 180);
    if (!entry.active) return;
    const m = at(0.02),
      flash = m.impulse * s.impulse;
    const hueIdx = Math.floor(r(c.id + step * 7919, 2) * HUES.length);
    const white = r(c.id + step * 7919, 3) < 0.08;
    g.fillStyle = white
      ? `hsla(0 0% 96% / ${0.8 + 0.2 * flash})`
      : `hsla(${HUES[hueIdx]} 88% 58% / ${0.78 + 0.2 * flash})`;
    const size = CELL * 0.92 * entry.scale;
    g.fillRect(c.cx - size / 2 + entry.dx, c.cy - size / 2 + entry.dy, size, size);
  });

  swirls.forEach((sw) => {
    const entry = introFor(sw.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.06 + (sw.x / W) * 0.1),
      flash = m.impulse * s.impulse;
    const spin = sw.baseRot + t * sw.spinSpeed * (1 + 0.6 * s.motion);
    const breathe = 1 + 0.07 * Math.sin(t * 0.4 + sw.phase) + 0.1 * m.slow.bass + 0.16 * flash;
    const cx = sw.x + entry.dx,
      cy = sw.y + entry.dy;
    g.save();
    g.translate(cx, cy);
    g.rotate(spin);
    for (let i = 0; i < RING_COUNT; i++) {
      const tt = i / RING_COUNT;
      const shrink = (1 - tt) * breathe * entry.scale;
      if (shrink <= 0.008) continue;
      const height = sw.maxR * shrink;
      const width = sw.maxR * Math.pow(Math.max(0, shrink), 1.55);
      if (width < 0.4 || height < 0.4) continue;
      const rot2 =
        tt * Math.PI * 1.85 * sw.twist + 0.25 * Math.sin(t * 0.22 + sw.phase + tt * 2.4) * s.motion;
      const shift = tt * sw.driftAmp * sw.maxR;
      const useAccent = r(sw.id, 200 + i) < sw.accentChance;
      const hueIdx = useAccent ? Math.floor(r(sw.id, 300 + i) * HUES.length) : sw.hueIdx;
      const light = 50 + 8 * m.fast.centroid + 14 * flash;
      g.save();
      g.rotate(rot2);
      g.lineWidth = Math.max(0.3, shrink * sw.maxR * 0.05);
      g.strokeStyle = `hsla(${HUES[hueIdx]} 88% ${Math.min(85, light)}% / ${0.72 + 0.2 * m.fast.high + 0.25 * flash})`;
      g.beginPath();
      g.roundRect(shift - width / 2, -height / 2, width, height, Math.min(width, height) / 3.4);
      g.stroke();
      g.restore();
    }
    g.restore();
  });
}

const layers = new WeakMap();
function getBuffer(p) {
  let c = layers.get(p);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 480;
    c.height = 270;
    layers.set(p, c);
  }
  return c;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#040404');

  const buf = getBuffer(p);
  const b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  drawField(b, t, s, at, intro);
  b.restore();
  g.drawImage(buf, 0, 0, W, H);

  return s;
}
