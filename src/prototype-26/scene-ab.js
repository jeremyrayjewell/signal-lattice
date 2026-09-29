import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const r = (id, k = 0) => randomAt(46703, id * 211 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
// Own six-hue neon palette, independent of the source's exact hex values.
const HUES = [228, 326, 90, 268, 182, 26];

// A modest set of pre-rendered square dot/ring texture tiles — each built
// from several independently-rotated, independently-colored, independently
// dense layers of small filled-or-stroked circles (own primitive, not the
// source's quarter-arc-clover-plus-ellipse construction). Pre-rendering
// once and compositing copies across the grid at draw time (matching the
// source's own `pg[]` reuse strategy) keeps per-frame cost to simple
// `drawImage` calls.
const TEX_SIZE = 128,
  TEX_COUNT = 14;
const textures = Array.from({ length: TEX_COUNT }, (_, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');
  const passes = 3 + Math.floor(r(h, 1) * 2);
  for (let p = 0; p < passes; p++) {
    const pivotX = r(h, 10 + p * 13) * TEX_SIZE,
      pivotY = r(h, 11 + p * 13) * TEX_SIZE;
    const rot = r(h, 12 + p * 13) * 360;
    const v = 2 + Math.floor(r(h, 13 + p * 13) * 7);
    const cellSize = TEX_SIZE / v;
    const hue = HUES[Math.floor(r(h, 14 + p * 13) * HUES.length)];
    const strokeChance = r(h, 15 + p * 13) * 0.6;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(rot * DEG);
    ctx.translate(-TEX_SIZE, -TEX_SIZE);
    const steps = Math.ceil((TEX_SIZE * 2) / cellSize) + 1;
    for (let gy = 0; gy < steps; gy++) {
      const shearRow = (r(h, 16 + p * 13 + gy * 3) - 0.5) * cellSize * 1.6;
      for (let gx = 0; gx < steps; gx++) {
        const cx = gx * cellSize + cellSize / 2 + shearRow,
          cy = gy * cellSize + cellSize / 2;
        const jr = r(h, 17 + p * 13 + gx * 7 + gy * 101);
        const radius = cellSize * 0.36 * (0.65 + 0.5 * jr);
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.5, radius), 0, TAU);
        if (jr < strokeChance) {
          ctx.strokeStyle = `hsl(${hue} 92% 58%)`;
          ctx.lineWidth = Math.max(0.6, cellSize * 0.07);
          ctx.stroke();
        } else {
          ctx.fillStyle = `hsl(${hue} 92% 58%)`;
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  return canvas;
});

// The 45°-rotated main grid, over-provisioned well past the canvas bounds
// so full coverage survives the rotation, echoing the source's own
// oversized "w*2" grid range for the same reason.
const CELL = 128,
  GRID_RANGE = 700;
const cols = [];
for (let gx = -GRID_RANGE; gx <= GRID_RANGE; gx += CELL) cols.push(gx);
const cellList = [];
cols.forEach((gx, ix) =>
  cols.forEach((gy, iy) => {
    const id = ix * 1000 + iy;
    const hasBacking = r(id, 1) < 0.5;
    const backingHue = HUES[Math.floor(r(id, 2) * HUES.length)];
    const texBase = Math.floor(r(id, 3) * TEX_COUNT);
    const cycleSpeed = (0.01 + r(id, 4) * 0.03) * (r(id, 5) < 0.5 ? 1 : -1);
    const spinSpeed = (r(id, 6) - 0.5) * 0.5;
    const phase = r(id, 7) * TAU;
    const baseScale = 0.72 + r(id, 8) * 0.26;
    cellList.push({
      id,
      gx,
      gy,
      hasBacking,
      backingHue,
      texBase,
      cycleSpeed,
      spinSpeed,
      phase,
      baseScale,
    });
  }),
);

function drawField(g, t, s, at, intro) {
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(45 * DEG);

  cellList.forEach((c) => {
    const entry = introFor(c.id, intro, 340);
    if (!entry.active) return;
    const m = at(0.08 + ((c.gx + GRID_RANGE) / (2 * GRID_RANGE)) * 0.2),
      flash = m.impulse * s.impulse;
    const selected = (0.5 + 0.5 * Math.sin(c.id * 0.7 - t * 0.5 + c.phase)) ** 6;
    const scale = Math.max(
      0.05,
      c.baseScale * (1 + 0.1 * m.slow.bass + 0.18 * flash) * entry.scale,
    );
    const rot = t * c.spinSpeed * (0.4 + 0.8 * s.motion);
    const texIndex =
      ((Math.floor(c.texBase + t * c.cycleSpeed * (1 + 2 * m.fast.high)) % TEX_COUNT) + TEX_COUNT) %
      TEX_COUNT;
    g.save();
    g.translate(c.gx + entry.dx, c.gy + entry.dy);
    if (c.hasBacking) {
      g.fillStyle = `hsla(${c.backingHue} 88% 52% / ${0.85 + 0.12 * flash})`;
      g.fillRect(-CELL / 2, -CELL / 2, CELL, CELL);
    }
    g.rotate(rot);
    g.scale(scale, scale);
    g.globalAlpha = 0.55 + 0.3 * selected + 0.25 * m.fast.centroid + 0.2 * flash;
    g.drawImage(textures[texIndex], -TEX_SIZE / 2, -TEX_SIZE / 2, TEX_SIZE, TEX_SIZE);
    g.globalAlpha = 1;
    g.restore();
  });

  g.restore();
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
  if (intro >= 1) p.background('#050505');

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
