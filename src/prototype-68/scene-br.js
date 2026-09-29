import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = S / 3,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 140;
const G = S / 5;
const cp = ['#316C9C', '#CBC743', '#DB5745', '#46134F', '#371B22'];
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
const cache = new Map();
// A wireframe "sphere" is approximated in plain Canvas2D as a bundle of great-circle ellipses,
// each sharing the sphere's centre and radius but with its own eccentricity and rotation -- close
// to how a real wireframe sphere's latitude/longitude lines project under an oblique view,
// without doing true 3D projection. One colour per sphere, as in the source.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11607, key * 70 + k);
  const v = [8, 12, 24][Math.floor(r(0) * 3)],
    col = cp[Math.floor(r(1) * 5)];
  const rings = Array.from({ length: v }, (_, k) => {
    const b = 10 + k * 3;
    return { ecc: 0.15 + r(b) * 0.85, rot: r(b + 1) * TAU, ph: r(b + 2) * TAU };
  });
  const c = { v, col, rings, R: (S / 3) * (0.55 + r(2) * 0.55) };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function sphere(g, c, k, t, m, ph) {
  if (k <= 0.004) return;
  g.globalAlpha = 0.55 * k + 0.15 * m.fast.rms;
  g.strokeStyle = c.col;
  g.lineWidth = Math.max(0.4, (c.R / 80) * (1 + 0.3 * m.fast.centroid));
  const R = c.R * k * (1 + 0.05 * Math.sin(t * 0.6 + ph) + 0.06 * m.slow.bass);
  for (const rg of c.rings) {
    g.save();
    g.rotate(rg.rot + t * 0.02 * (1 + 0.3 * m.slow.mid) + ph * 0.1);
    g.beginPath();
    g.ellipse(0, 0, R, R * rg.ecc, 0, 0, TAU);
    g.stroke();
    g.restore();
  }
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11608, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 5,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
const sqCache = new Map();
function sqConf(h, e) {
  const key = h * 512 + e + 64,
    hit = sqCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11609, key * 20 + k);
  const v = [1, 2, 4][Math.floor(r(0) * 3)],
    sg = G / v,
    cells = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 5 + (i * v + j) * 2;
      if (r(b) < 0.5) cells.push({ x: -G / 2 + sg / 2 + i * sg, y: -G / 2 + sg / 2 + j * sg });
    }
  const c = { sg, cells };
  if (sqCache.size > 8000) sqCache.clear();
  sqCache.set(key, c);
  return c;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 7 * f.k * t, PW) + 16 * Math.sin(t * 0.27 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 5 * f.k * t, PH) + 16 * Math.cos(t * 0.23 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(e.scale, e.scale);
    sphere(g, conf(i, ep - 1), 1 - ease(fr / 0.16), t, m, f.ph);
    sphere(g, conf(i, ep), ease(fr / 0.3), t, m, f.ph);
    g.restore();
  }
  g.globalCompositeOperation = 'difference';
  g.fillStyle = '#ffffff';
  const cols = Math.ceil(W / G) + 1,
    rows = Math.ceil(H / G) + 1;
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 8192 + row,
        e = introFor(1000 + (((col % 12) + 12) % 12) * 8 + (((row % 7) + 7) % 7), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2,
        y = row * G + G / 2,
        P = 5 + randomAt(11610, h * 4 + 1) * 4,
        off = randomAt(11610, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const cf = sqConf(h, ep);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.globalAlpha = ease(fr / 0.3);
      for (const c2 of cf.cells) g.fillRect(c2.x - cf.sg / 2, c2.y - cf.sg / 2, cf.sg, cf.sg);
      g.restore();
    }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
