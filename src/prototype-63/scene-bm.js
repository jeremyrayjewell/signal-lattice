import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = S / 4,
  PW = W + 2 * M,
  PH = H + 2 * M,
  SHARDS = 95;
const cp = ['#A33C2A', '#AECCB7', '#1A2C61', '#3F282A', '#537844', '#273F41', '#9AAB6E', '#50796E'];
const rgb = cp.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
});
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
const cache = new Map();
// A shard's vertex ring for one "epoch": a pure function of (shard, epoch). Vertices sit near a
// shared radius but jitter by up to half of it, so the triangle strip between them reads as a
// jagged crystalline ring rather than a smooth star -- the source's TRIANGLE_STRIP only connects
// boundary vertices, it never fills to a centre.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11589, key * 90 + k);
  const av = (1 + Math.floor(r(0) * 10)) * 10,
    ag = TAU / av,
    mr = S / 4 + (r(1) * S) / 4,
    alpha = (120 + r(2) * 135) / 255;
  const verts = [];
  for (let k = 0; k <= av; k++) {
    const b = 10 + k * 3,
      a = k * ag,
      z = 1 + r(b) * (mr / 2 - 1),
      rad = mr / 2 + (r(b + 1) * 2 - 1) * z;
    verts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad, col: rgb[Math.floor(r(b + 2) * 8)] });
  }
  const c = { rot: r(500) * TAU, alpha, verts };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function shard(g, c, k) {
  if (k <= 0.004) return;
  g.globalAlpha = c.alpha * k;
  const v = c.verts;
  for (let i = 0; i < v.length - 2; i++) {
    const a = v[i],
      b = v[i + 1],
      cc = v[i + 2];
    const col = [
      (a.col[0] + b.col[0] + cc.col[0]) / 3,
      (a.col[1] + b.col[1] + cc.col[1]) / 3,
      (a.col[2] + b.col[2] + cc.col[2]) / 3,
    ];
    g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.lineTo(cc.x, cc.y);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11590, i * 61 + k);
const field = Array.from({ length: SHARDS }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
const G = S / 10,
  cols = Math.ceil(W / G) + 1,
  rows = Math.ceil(H / G) + 1;
const dotCache = new Map();
function dotConf(h, e) {
  const key = h * 512 + e + 64,
    hit = dotCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11591, key * 20 + k);
  const v = [1, 2, 4][Math.floor(r(0) * 3)],
    sg = G / v,
    dots = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 5 + (i * v + j) * 5;
      const er = sg / 3 + (r(b) * sg * 2) / 3;
      dots.push({
        x: -G / 2 + sg / 2 + i * sg + (r(b + 1) * 2 - 1) * (sg / 2 - er / 2),
        y: -G / 2 + sg / 2 + j * sg + (r(b + 2) * 2 - 1) * (sg / 2 - er / 2),
        er,
        white: r(b + 3) < 0.5,
        alpha: r(b + 4),
      });
    }
  const c = { dots };
  if (dotCache.size > 8000) dotCache.clear();
  dotCache.set(key, c);
  return c;
}
// Blurred, gently posterized bezier streaks: built into a small private buffer once per epoch,
// like the ring target in Scene BK, since blur is a global operation best kept off the shared
// canvas. Curves have plenty of transparent gaps, so introducing the whole layer as one flying
// element (unlike the opaque checkerboard in Scene BL) still lets the outgoing scene show through.
const SB = 560,
  streakCache = new Map();
function buildStreaks(e) {
  if (streakCache.has(e)) return streakCache.get(e);
  const raw = document.createElement('canvas');
  raw.width = SB;
  raw.height = SB;
  const g = raw.getContext('2d'),
    half = SB / 2;
  for (let j = 0; j < 30; j++) {
    const r = (k) => randomAt(11592, e * 300 + j * 9 + k);
    g.strokeStyle = r(0) < 0.5 ? 'rgba(0,0,0,.78)' : 'rgba(255,255,255,.78)';
    g.lineWidth = 1 + r(1) * 3;
    g.beginPath();
    g.moveTo(r(2) * SB - half + half, r(3) * SB - half + half);
    g.bezierCurveTo(r(4) * SB, r(5) * SB, r(6) * SB, r(7) * SB, r(8) * SB, r(9) * SB);
    g.stroke();
  }
  const out = document.createElement('canvas');
  out.width = SB;
  out.height = SB;
  const og = out.getContext('2d');
  og.filter = `blur(${SB / 100}px)`;
  og.drawImage(raw, 0, 0);
  const id = og.getImageData(0, 0, SB, SB),
    d = id.data,
    levels = 8,
    step = 255 / (levels - 1);
  for (let p = 0; p < d.length; p += 4) {
    if (d[p + 3] < 3) continue;
    d[p] = Math.round(Math.round(d[p] / step) * step);
    d[p + 1] = Math.round(Math.round(d[p + 1] / step) * step);
    d[p + 2] = Math.round(Math.round(d[p + 2] / step) * step);
  }
  og.putImageData(id, 0, 0);
  streakCache.set(e, out);
  if (streakCache.size > 60) streakCache.clear();
  return out;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  g.save();
  for (let i = 0; i < SHARDS; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 8 * f.k * t, PW) + 16 * Math.sin(t * 0.3 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 6 * f.k * t, PH) + 16 * Math.cos(t * 0.26 + f.ph);
    if (x < -S || x > W + S || y < -S || y > H + S) continue;
    const P = 5 + randomAt(11593, i * 7 + 1) * 5,
      off = randomAt(11593, i * 7 + 2) * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet,
      c0 = conf(i, ep - 1),
      c1 = conf(i, ep);
    const spin = t * 0.04 * (1 + 0.4 * m.slow.mid);
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(
      e.scale * (1 + 0.05 * Math.sin(t * 0.7 + f.ph) + 0.06 * m.slow.bass),
      e.scale * (1 + 0.05 * Math.sin(t * 0.7 + f.ph) + 0.06 * m.slow.bass),
    );
    g.rotate(c1.rot + spin);
    shard(g, c0, 1 - ease(fr / 0.16));
    shard(g, c1, ease(fr / 0.3));
    g.restore();
  }
  g.globalCompositeOperation = 'overlay';
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 8192 + row,
        e = introFor(400 + (((col % 12) + 12) % 12) * 8 + (((row % 7) + 7) % 7), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2,
        y = row * G + G / 2,
        P = 5 + randomAt(11594, h * 4 + 1) * 4,
        off = randomAt(11594, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const cf = dotConf(h, ep);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      g.globalAlpha = ease(fr / 0.3);
      for (const d of cf.dots) {
        g.fillStyle = d.white ? '#ffffff' : '#000000';
        g.globalAlpha = d.alpha * ease(fr / 0.3);
        g.beginPath();
        g.arc(d.x, d.y, d.er / 2, 0, TAU);
        g.fill();
      }
      g.restore();
      g.restore();
    }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  const es = introFor(900, intro, 420);
  if (es.active) {
    const P = 8 + randomAt(11595, 1) * 4,
      ep = Math.floor(t / P),
      tex = buildStreaks(ep);
    g.save();
    g.translate(W / 2 + es.dx, H / 2 + es.dy);
    g.scale(es.scale, es.scale);
    g.drawImage(tex, -W / 2, -H / 2, W, H);
    g.restore();
  }
  g.restore();
  return s;
}
