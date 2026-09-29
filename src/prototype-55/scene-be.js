import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 220,
  PW = W + 2 * M,
  PH = H + 2 * M;
const BUNDLES = 130,
  COPIES = 9,
  LOOPS = 14,
  PTS = 110,
  FG = S / 8,
  COLS = 19,
  ROWS = 8,
  CELLS = COLS * ROWS;
const cp = [
  '#046CD2',
  '#F1C701',
  '#F30174',
  '#F77CCA',
  '#D16C07',
  '#337F33',
  '#7076DF',
  '#C7B7CA',
  '#18181A',
  '#63282F',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const ease = (q) => {
  q = Math.max(0, Math.min(1, q));
  return q * q * (3 - 2 * q);
};
const mix = (a, b, q) => a + (b - a) * q;
const smooth = (q) => q * q * (3 - 2 * q);
// Seeded value noise: lattice corners hashed, bilinearly blended. Used for every flowing curve below.
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}
const cache = new Map();
// A bundle's look for one "epoch": a pure function of (bundle, epoch), so any frame can be drawn alone.
function bundleConf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11563, key * 24 + k);
  const len = S / 2 + (r(0) * S) / 2,
    c = {
      rot: r(1) * TAU,
      len,
      g: len / 10,
      col: Math.floor(r(2) * 10),
      alpha: 0.14 + r(3) * 0.28,
      sy: Math.floor(r(4) * 1e9),
      flow: 0.35 + r(5) * 0.6,
      copies: Array.from({ length: COPIES }, (_, k) => ({
        o: (k - (COPIES - 1) / 2) / COPIES,
        ph: r(10 + k) * 40,
        w: 0.6 + r(11 + k) * 1,
      })),
    };
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
function loopConf(i, e) {
  const key = (i + 9000) * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11564, key * 8 + k);
  const c = {
    sx: Math.floor(r(0) * 1e9),
    sy: Math.floor(r(1) * 1e9),
    white: r(2) < 0.5,
    speed: 0.15 + r(3) * 0.3,
    cx: r(4) * W,
    cy: r(5) * H,
  };
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
const Fr = (i, k) => randomAt(11565, i * 61 + k);
const bundleField = Array.from({ length: BUNDLES }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
const cellBase = Array.from({ length: CELLS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
  ph: Fr(i + 20000, 0) * TAU,
  white: Fr(i + 20000, 1) < 0.5,
}));
function bundle(g, c, x, y, k, t, m, ph) {
  if (k <= 0.004) return;
  const rgbHex = cp[c.col],
    n = parseInt(rgbHex.slice(1), 16),
    rC = n >> 16,
    gC = (n >> 8) & 255,
    bC = n & 255;
  g.save();
  g.translate(x, y);
  g.rotate(c.rot);
  const len = c.len * k,
    gw = c.g * k,
    pts = [];
  for (let j = 0; j < PTS; j++) {
    const u = j / (PTS - 1),
      lx = (u - 0.5) * len;
    pts.push([lx, vn(c.sy, u * 3 + t * c.flow + 0.001 * ph) * gw * 3.4 * (1 + 0.4 * m.slow.mid)]);
  }
  for (const cp2 of c.copies) {
    g.strokeStyle = `rgba(${rC},${gC},${bC},${c.alpha * (1 + 0.5 * m.fast.rms) * (1 - Math.abs(cp2.o) * 0.6)})`;
    g.lineWidth = Math.max(1, gw * cp2.w * 0.5 * k);
    g.beginPath();
    for (let j = 0; j < pts.length; j++) {
      const off = cp2.o * gw * 2 + 2 * vn(c.sy + 7, pts[j][0] * 0.02 + cp2.ph + t * 0.2);
      const px = pts[j][0],
        py = pts[j][1] + off;
      if (j === 0) g.moveTo(px, py);
      else {
        const pp = pts[j - 1],
          poff = cp2.o * gw * 2 + 2 * vn(c.sy + 7, pp[0] * 0.02 + cp2.ph + t * 0.2);
        g.quadraticCurveTo(pp[0], pp[1] + poff, (px + pp[0]) / 2, (py + pp[1] + poff) / 2);
      }
    }
    g.stroke();
  }
  g.restore();
}
function loop(g, c, t, m, ph) {
  g.strokeStyle = c.white ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)';
  g.lineWidth = 1 + m.fast.centroid * 0.8;
  g.beginPath();
  for (let j = 0; j < PTS; j++) {
    const u = (j / (PTS - 1)) * 4 + t * c.speed;
    const px = c.cx + vn(c.sx, u) * W * 1.15,
      py = c.cy + vn(c.sy, u + 50) * H * 1.15;
    j === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.globalCompositeOperation = 'hard-light';
  for (let i = 0; i < BUNDLES; i++) {
    const f = bundleField[i],
      e = introFor(i, intro, 400);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 9 * f.k * t, PW) + 18 * Math.sin(t * 0.29 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 6 * f.k * t, PH) + 18 * Math.cos(t * 0.24 + f.ph);
    if (x < -S || x > W + S || y < -S || y > H + S) continue;
    const u = (t + f.off * f.life) / f.life,
      ep = Math.floor(u),
      fr = u - ep,
      m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    bundle(
      g,
      bundleConf(i, ep - 1),
      x + e.dx,
      y + e.dy,
      (1 - ease(fr / 0.16)) * e.scale,
      t,
      m,
      f.ph,
    );
    bundle(g, bundleConf(i, ep), x + e.dx, y + e.dy, ease(fr / 0.3) * e.scale, t, m, f.ph);
  }
  g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < LOOPS; i++) {
    const e = introFor(BUNDLES + i, intro, 400);
    if (!e.active) continue;
    const c = loopConf(i, Math.floor((t + i * 3.7) / 9));
    g.save();
    g.translate(e.dx * 0.3, e.dy * 0.3);
    g.scale(e.scale, e.scale);
    loop(g, c, t, mBase, i);
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < CELLS; i++) {
    const b = cellBase[i],
      e = introFor(BUNDLES + LOOPS + i, intro, 380);
    if (!e.active) continue;
    const shift = FG * Math.sin(t * 0.15 + b.row * 1.3) * 0.8;
    const x = (b.col - 2) * FG + FG / 2 + shift,
      y = b.row * FG + FG / 2;
    // A stepped, time-quantized hash decides on/off per cell so the checker flickers at a steady cadence.
    const clock = Math.floor((t + b.ph) * 1.1),
      on = randomAt(11566, i * 7 + clock) < 0.5;
    if (!on) continue;
    const alpha = (0.12 + 0.4 * randomAt(11566, i * 7 + clock + 3)) * (1 + 0.3 * mBase.fast.high);
    g.globalAlpha = Math.min(1, alpha) * e.scale;
    g.fillStyle = b.white ? '#ffffff' : '#000000';
    g.fillRect(x - FG / 2 + e.dx, y - FG / 2 + e.dy, FG, FG);
  }
  g.globalAlpha = 1;
  g.restore();
  return s;
}
