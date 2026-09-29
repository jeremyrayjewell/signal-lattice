import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = S / 4,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 220,
  STRANDS = 80;
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
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}
function hsl(h, s, l) {
  return `hsl(${h},${s}%,${l}%)`;
}
const cache = new Map();
// A strand cluster's recipe for one "epoch": a pure function of (cluster, epoch). Each strand's
// colour lerps from the cluster's saturated hue to black or white as it descends, matching the
// source's per-row lerpColor; the wandering end points come from our own seeded noise walk.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11614, key * 50 + k);
  const mr = S / 4 + (r(0) * S) / 4,
    hue = Math.floor(r(1) * 360),
    lig = r(2) < 0.5 ? 0 : 100,
    rot = (Math.floor(r(3) * 4) * Math.PI) / 2;
  const seedA = Math.floor(r(4) * 1e6),
    seedB = Math.floor(r(5) * 1e6),
    xna = r(6) * 40,
    xnb = r(6) * 40 + 90;
  const strands = Array.from({ length: STRANDS }, (_, k) => {
    const b = 10 + k * 4;
    return {
      p1y: ((r(b) * 2 - 1) * mr) / 2,
      p2y: ((r(b + 1) * 2 - 1) * mr) / 2,
      ph: r(b + 2) * TAU,
    };
  });
  const c = { mr, hue, lig, rot, seedA, seedB, xna, xnb, strands };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function cluster(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.save();
  g.rotate(c.rot);
  g.scale(1.3, 1);
  g.lineWidth = Math.max(1, (c.mr / 95) * (1 + 0.3 * m.fast.centroid));
  g.globalAlpha = k;
  const n = STRANDS;
  for (let si = 0; si < n; si++) {
    const s2 = c.strands[si],
      ly = -c.mr / 2 + (si / (n - 1)) * c.mr;
    const wave = 6 * Math.sin(t * 0.8 + s2.ph) * (1 + 0.4 * m.fast.high);
    const xa = (vn(c.seedA, c.xna + si * 0.28) * c.mr) / 4 - c.mr / 4 + wave * 0.3;
    const xb = (vn(c.seedB, c.xnb + si * 0.28) * c.mr) / 4 + c.mr / 4 - wave * 0.3;
    const q = Math.max(0, Math.min(1, ly / c.mr + 0.5));
    g.strokeStyle = hsl(c.hue, mix(100, 0, q), mix(50, c.lig, q));
    g.beginPath();
    g.moveTo(xa, ly);
    g.bezierCurveTo(0, s2.p1y + wave, 0, s2.p2y - wave, xb, ly);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
}
const Fr = (i, k) => randomAt(11615, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 5,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
const G = S / 30,
  cols = Math.round(W / G),
  rows = Math.round(H / G);
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  // A busy scene fills its footprints fast, so introduction progress is squared before the
  // per-element stagger, keeping the outgoing scene visible longer while still landing exactly
  // on the finished picture at completion.
  const pace = intro * intro;
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, pace, 420);
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
    cluster(g, conf(i, ep - 1), t, m, f.ph, 1 - ease(fr / 0.16));
    cluster(g, conf(i, ep), t, m, f.ph, ease(fr / 0.3));
    g.restore();
  }
  g.globalCompositeOperation = 'overlay';
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 4096 + row,
        e = introFor(2000 + (((col % 20) + 20) % 20) * 14 + (((row % 12) + 12) % 12), intro, 340);
      if (!e.active) continue;
      const x = col * G + G / 2,
        y = row * G + G / 2,
        clock = Math.floor((t + randomAt(11616, h) * 3) * 1.3);
      const white = randomAt(11616, h * 7 + clock) < 0.5,
        alpha = randomAt(11616, h * 7 + clock + 1),
        big = randomAt(11616, h * 7 + clock + 2) < 0.5;
      const er = (big ? G : G / 2) * (1 + 0.15 * Math.sin(t * 0.6 + h) + 0.1 * mBase.fast.high);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.globalAlpha = alpha * (0.7 + 0.3 * mBase.fast.rms);
      g.fillStyle = white ? '#ffffff' : '#000000';
      g.beginPath();
      g.arc(0, 0, er / 2, 0, TAU);
      g.fill();
      g.restore();
    }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
