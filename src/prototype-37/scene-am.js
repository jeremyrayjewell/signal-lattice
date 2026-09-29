import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(71603, id * 263 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540,
  CX = W / 2,
  CY = H / 2;
// Own muted, earthy ten-color palette, independent of the source's exact
// hex values.
const PALETTE = [
  [22, 42, 35],
  [48, 28, 86],
  [222, 38, 28],
  [54, 62, 54],
  [8, 52, 25],
  [130, 34, 25],
  [95, 28, 30],
  [72, 58, 50],
  [18, 62, 47],
  [340, 32, 68],
];
function hsl(idx, alpha = 1) {
  const [h, s, l] = PALETTE[idx];
  return `hsla(${h} ${s}% ${l}% / ${alpha})`;
}

// A set of pre-rendered circular two-color brick-texture tiles — an own
// sum-of-sines pseudo-noise threshold for the coherent mottled boundaries
// (not the source's Perlin `noise()` calls), clipped to a circle. Rendered
// once and reused across many patch instances (matching this project's
// established pre-render-and-reuse pattern), so the per-patch subdivision
// can stay reasonably fine without costing anything per frame.
const TEX_COUNT = 26,
  TEX_RES = 160;
const textures = Array.from({ length: TEX_COUNT }, (_, h) => {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_RES;
  canvas.height = TEX_RES;
  const ctx = canvas.getContext('2d');
  let idxA = Math.floor(r(h, 1) * PALETTE.length);
  let idxB = Math.floor(r(h, 2) * PALETTE.length);
  if (idxB === idxA) idxB = (idxB + 1) % PALETTE.length;
  const v = 6 + Math.floor(r(h, 3) * 11);
  const g = TEX_RES / v;
  const freqX = 0.035 + r(h, 4) * 0.07,
    freqY = 0.035 + r(h, 5) * 0.07,
    freqD = 0.02 + r(h, 6) * 0.05;
  const phaseX = r(h, 7) * TAU,
    phaseY = r(h, 8) * TAU,
    phaseD = r(h, 9) * TAU;
  const sw = 2 + Math.floor(r(h, 10) * 8);
  const cx = TEX_RES / 2,
    cy = TEX_RES / 2,
    rad = TEX_RES / 2;
  let ci = 0;
  for (let x = -rad; x <= rad; x += g) {
    for (let y = -rad; y <= rad; y += g) {
      if (Math.hypot(x, y) >= rad) continue;
      const n =
        Math.sin(x * freqX + phaseX) +
        Math.sin(y * freqY + phaseY) +
        Math.sin((x + y) * freqD + phaseD);
      ctx.save();
      ctx.translate(cx + x, cy + y);
      if (r(h, 20 + ci) < 1 / sw) ctx.rotate((Math.floor(r(h, 21 + ci) * 4) * Math.PI) / 2);
      ctx.fillStyle = hsl(n >= 0 ? idxA : idxB, 1);
      ctx.fillRect(-g / 2 - 0.5, -g / 4, g + 1, g / 2);
      ctx.restore();
      ci++;
    }
  }
  return canvas;
});

// Background grid of independently-colored, independently-opaque lines —
// own placement, not the source's exact per-line alpha draw sequence.
const LINE_COUNT = 110;
const vLines = Array.from({ length: LINE_COUNT }, (_, k) => {
  const id = 3000 + k;
  return {
    id,
    x: r(id, 1) * W,
    hueIdx: Math.floor(r(id, 2) * PALETTE.length),
    alphaBase: r(id, 3),
    phase: r(id, 4) * TAU,
  };
});
const hLines = Array.from({ length: LINE_COUNT }, (_, k) => {
  const id = 4000 + k;
  return {
    id,
    y: r(id, 1) * H,
    hueIdx: Math.floor(r(id, 2) * PALETTE.length),
    alphaBase: r(id, 3),
    phase: r(id, 4) * TAU,
  };
});

// Patches sit on a jittered grid, spread evenly across the whole canvas
// (not concentrated toward the center) across two independent populations,
// echoing the source's own two-pass normal-then-overlay structure. Size
// varies per patch independently of position, rather than shrinking with
// distance from a center point.
function buildPatches(cols, rows, idBase) {
  const cw = W / cols,
    ch = H / rows;
  const list = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const id = idBase + row * cols + col;
      const bx = (col + 0.5) * cw + (r(id, 1) - 0.5) * cw * 0.85;
      const by = (row + 0.5) * ch + (r(id, 2) - 0.5) * ch * 0.85;
      const size = 36 + r(id, 7) * 56;
      const texIdx = Math.floor(r(id, 3) * TEX_COUNT);
      const baseRot = (Math.floor(r(id, 4) * 4) * Math.PI) / 2;
      const spinSpeed = (r(id, 5) - 0.5) * 0.5;
      const phase = r(id, 6) * TAU;
      list.push({ id, bx, by, size, texIdx, baseRot, spinSpeed, phase });
    }
  return list;
}
const patchesBlend = buildPatches(13, 10, 0);
const patchesOverlay = buildPatches(9, 6, 2000);

function drawPatches(g, list, t, s, at, intro) {
  list.forEach((p) => {
    const entry = introFor(p.id, intro, 260);
    if (!entry.active) return;
    const m = at(0.04 + (p.bx / W) * 0.12),
      flash = m.impulse * s.impulse;
    const size = Math.max(2, p.size * entry.scale * (1 + 0.08 * m.slow.bass + 0.14 * flash));
    const rot = p.baseRot + t * p.spinSpeed * (1 + 0.5 * s.motion);
    g.save();
    g.translate(p.bx + entry.dx, p.by + entry.dy);
    g.rotate(rot);
    g.globalAlpha = 0.85 + 0.15 * m.fast.high;
    g.drawImage(textures[p.texIdx], -size / 2, -size / 2, size, size);
    g.globalAlpha = 1;
    g.restore();
  });
}

function drawField(g, t, s, at, intro) {
  const ambient = at(0.03),
    aflash = ambient.impulse * s.impulse;
  vLines.forEach((ln) => {
    const alpha =
      ln.alphaBase *
      (0.4 + 0.35 * Math.sin(t * 0.25 + ln.phase) + 0.35) *
      (0.6 + 0.4 * ambient.fast.high + 0.4 * aflash);
    g.strokeStyle = hsl(ln.hueIdx, Math.max(0, Math.min(1, alpha)));
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(ln.x, 0);
    g.lineTo(ln.x, H);
    g.stroke();
  });
  hLines.forEach((ln) => {
    const alpha =
      ln.alphaBase *
      (0.4 + 0.35 * Math.sin(t * 0.22 + ln.phase) + 0.35) *
      (0.6 + 0.4 * ambient.fast.high + 0.4 * aflash);
    g.strokeStyle = hsl(ln.hueIdx, Math.max(0, Math.min(1, alpha)));
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, ln.y);
    g.lineTo(W, ln.y);
    g.stroke();
  });

  drawPatches(g, patchesBlend, t, s, at, intro);
  g.save();
  g.globalCompositeOperation = 'overlay';
  drawPatches(g, patchesOverlay, t, s, at, intro);
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
  if (intro >= 1) p.background('#040403');

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
