import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(61207, id * 223 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
// Four evenly-spaced hues (own values, not the source's exact HSB draws).
const HUE4 = [350, 95, 190, 270];

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
const lerp3 = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// A true bilinear four-corner gradient, computed once per pixel via
// ImageData — Canvas2D has no built-in four-corner gradient, and this is
// the own independent way to get one, standing in for the source's
// per-vertex-colored WEBGL quad.
function bilinearTile(res, cornerHues, sat, light) {
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(res, res);
  const c = cornerHues.map((h) => hslToRgb(h, sat, light));
  for (let y = 0; y < res; y++) {
    const fy = res <= 1 ? 0 : y / (res - 1);
    for (let x = 0; x < res; x++) {
      const fx = res <= 1 ? 0 : x / (res - 1);
      const tRow = lerp3(c[0], c[3], fx),
        bRow = lerp3(c[1], c[2], fx);
      const px = lerp3(tRow, bRow, fy);
      const i = (y * res + x) * 4;
      img.data[i] = px[0];
      img.data[i + 1] = px[1];
      img.data[i + 2] = px[2];
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// A modest set of pre-rendered tile bitmaps — each a background four-corner
// gradient with a nested smaller gradient shape (square or, via a 45°
// rotation, diamond), a circle outline, a filled circle, and four corner
// dots — matching the source's structural recipe with an own gradient
// technique and own random draws.
const TILE_RES = 64,
  TILE_COUNT = 16;
const tiles = Array.from({ length: TILE_COUNT }, (_, i) => {
  const id = i;
  const bgRot = Math.floor(r(id, 1) * 4);
  const bgHues = [0, 1, 2, 3].map((k) => HUE4[(k + bgRot) % 4]);
  const canvas = bilinearTile(TILE_RES, bgHues, 82, 60);
  const ctx = canvas.getContext('2d');
  const cx = TILE_RES / 2,
    cy = TILE_RES / 2;

  const isDiamond = r(id, 2) < 0.5;
  const shapeRot = Math.floor(r(id, 3) * 4);
  const shapeHues = [0, 1, 2, 3].map((k) => HUE4[(k + shapeRot) % 4]);
  const rr = TILE_RES * 0.22 + r(id, 4) * TILE_RES * 0.15;
  const shapeRes = Math.max(6, Math.round(rr * 2));
  const shapeTile = bilinearTile(shapeRes, shapeHues, 88, 62);
  ctx.save();
  ctx.translate(cx, cy);
  if (isDiamond) ctx.rotate(Math.PI / 4);
  ctx.drawImage(shapeTile, -rr, -rr, rr * 2, rr * 2);
  ctx.restore();

  ctx.strokeStyle = `hsl(${HUE4[Math.floor(r(id, 5) * 4)]} 90% 52%)`;
  ctx.lineWidth = Math.max(0.6, TILE_RES * 0.014);
  const nr = rr + r(id, 6) * rr;
  ctx.beginPath();
  ctx.arc(cx, cy, nr, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = `hsla(${HUE4[Math.floor(r(id, 7) * 4)]} 88% 55% / .82)`;
  ctx.beginPath();
  ctx.arc(cx, cy, nr / 1.5, 0, TAU);
  ctx.fill();

  [
    [-rr, -rr],
    [-rr, rr],
    [rr, -rr],
    [rr, rr],
  ].forEach(([dx, dy], k) => {
    ctx.fillStyle = `hsla(${HUE4[Math.floor(r(id, 8 + k) * 4)]} 88% 55% / .82)`;
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, rr * 0.22, 0, TAU);
    ctx.fill();
  });
  return canvas;
});

const COLS = 9,
  ROWS = 5,
  CELL = 108;
const X_OFF = (W - COLS * CELL) / 2,
  Y_OFF = (H - ROWS * CELL) / 2;
const ROTATIONS = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
const gridCells = [];
for (let row = 0; row < ROWS; row++)
  for (let col = 0; col < COLS; col++) {
    const id = row * COLS + col;
    const rotIdx = Math.floor(r(id, 1) * 4);
    const flip = r(id, 2) < 0.5 ? -1 : 1;
    const tileIndex = id % TILE_COUNT;
    const hueSpeed = (r(id, 3) - 0.5) * 36;
    const huePhase = r(id, 4) * 360;
    const wobblePhase = r(id, 5) * TAU,
      wobblePhase2 = r(id, 6) * TAU;
    const breathePhase = r(id, 7) * TAU;
    const arcVariant = r(id, 8) < 0.5;
    const cx = X_OFF + col * CELL + CELL / 2,
      cy = Y_OFF + row * CELL + CELL / 2;
    gridCells.push({
      id,
      cx,
      cy,
      rotIdx,
      flip,
      tileIndex,
      hueSpeed,
      huePhase,
      wobblePhase,
      wobblePhase2,
      breathePhase,
      arcVariant,
    });
  }

function drawField(g, t, s, at, intro) {
  gridCells.forEach((c) => {
    const entry = introFor(c.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.05 + (c.cx / W) * 0.12),
      flash = m.impulse * s.impulse;
    const wobble =
      (0.06 + 0.11 * s.motion + 0.13 * flash) * Math.sin(t * 0.28 + c.wobblePhase) +
      (0.025 + 0.04 * s.motion) * Math.sin(t * 0.7 + c.wobblePhase2);
    const breathe =
      1 + 0.03 * Math.sin(t * 0.45 + c.breathePhase) + 0.06 * m.slow.bass + 0.08 * flash;
    g.save();
    g.translate(c.cx + entry.dx, c.cy + entry.dy);
    g.rotate(ROTATIONS[c.rotIdx] + wobble);
    g.scale(c.flip * entry.scale * 0.94 * breathe, entry.scale * 0.94 * breathe);

    const hueAngle = c.huePhase + t * c.hueSpeed * (1 + 0.7 * s.motion + 0.5 * m.fast.high);
    g.filter = `hue-rotate(${hueAngle}deg)`;
    g.drawImage(tiles[c.tileIndex], -CELL / 2, -CELL / 2, CELL, CELL);
    g.filter = 'none';

    g.strokeStyle = `rgba(255,255,255,${0.55 + 0.25 * m.fast.high + 0.3 * flash})`;
    g.lineWidth = Math.max(0.5, CELL * 0.011);
    g.beginPath();
    g.arc(-CELL / 2, -CELL / 2, CELL * 0.75, 0, Math.PI / 2);
    g.stroke();
    g.beginPath();
    if (c.arcVariant) g.arc(CELL / 2, CELL / 2, CELL / 4, Math.PI, Math.PI * 1.5);
    else g.arc(CELL / 2 - CELL / 4, CELL / 2 - CELL / 4, CELL / 4, 0, Math.PI / 2);
    g.stroke();

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
  if (intro >= 1) p.background('#f4f4f2');

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
