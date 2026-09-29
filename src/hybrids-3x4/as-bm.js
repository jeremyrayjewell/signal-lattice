// Hybrid of Scene AS (prototype-43, Codex) and Scene BM (prototype-63,
// "Crystal Shards") for segment 6. AS's 18 gear-wheel cells, BM's 95 jagged
// crystal shards, and BM's dot-grid cells (kept as one item per cell, each
// holding its own internal dots) are merged into ONE array, tagged and
// depth-sorted together every frame, drawn in a single shared loop. BM's
// blurred streak buffer -- a private, globally-blurred canvas with no
// individual-element structure of its own -- stays as its own layer on top.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-43/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
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

// ---- AS's own population ----
const AS_R = (id, k) => randomAt(70943, id * 367 + k);
const asCells = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: AS_R(id, 0) * TAU,
  spokes: AS_R(id, 1) > 0.5 ? 52 : 29,
  filled: AS_R(id, 2) > 0.5,
  radius: 65 + AS_R(id, 3) * 8,
  sides: 6 + Math.floor(AS_R(id, 4) * 4),
  direction: AS_R(id, 5) > 0.5 ? 1 : -1,
}));
function line(g, x1, y1, x2, y2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
function polar(r, a) {
  return [r * Math.cos(a), r * Math.sin(a)];
}
function cap(g, r, a, width) {
  const [x, y] = polar(r, a),
    dx = -Math.sin(a) * width,
    dy = Math.cos(a) * width;
  line(g, x - dx, y - dy, x + dx, y + dy);
}
function asWheel(g, c, t, m, s) {
  g.strokeStyle = '#060606';
  g.lineWidth = 1.25 + 0.3 * m.fast.centroid;
  for (let j = 0; j < c.spokes; j++) {
    const a = (j / c.spokes) * TAU;
    const traveling = Math.sin(a * 3 - t * 1.3 + c.phase);
    const inner =
      c.radius * (0.58 + 0.085 * Math.sin(a * 2 + t * 0.71 + c.phase) + 0.035 * m.slow.bass);
    const outer =
      c.radius * (0.89 + AS_R(c.id, j + 30) * 0.13 + 0.06 * traveling + 0.04 * m.residue);
    const disturbance = m.impulse * s.impulse * 5 * Math.sin(a * 2 + c.phase);
    const tip = outer + disturbance,
      start = inner + 3 * m.fast.high * Math.sin(j * 1.7 + t * 2);
    const [x1, y1] = polar(start, a),
      [x2, y2] = polar(tip, a + 0.012 * Math.sin(t + a * 4));
    line(g, x1, y1, x2, y2);
    if (AS_R(c.id, j + 100) > 0.46) cap(g, start, a, 2.1 + AS_R(c.id, j + 170) * 2.2);
    if (AS_R(c.id, j + 230) > 0.52) cap(g, tip, a, 2.2 + AS_R(c.id, j + 290) * 2.1);
  }
  g.save();
  g.rotate(-c.direction * t * 0.12 + 0.15 * Math.sin(t * 0.63 + c.phase));
  g.beginPath();
  for (let j = 0; j < c.sides; j++) {
    const a = (j / c.sides) * TAU;
    const radius =
      c.radius *
      (0.42 +
        AS_R(c.id, j + 340) * 0.07 +
        0.035 * Math.sin(t * 0.82 + a * 2 + c.phase) +
        m.slow.bass * 0.025);
    const [x, y] = polar(radius, a);
    if (j === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = c.filled ? '#050505' : '#ffffff';
  g.fill();
  g.lineWidth = 1.5;
  g.stroke();
  g.restore();
  for (let j = 0; j < 9; j++) {
    const seed = c.id * 11 + j,
      ph = AS_R(seed, 360) * TAU;
    const reach = c.radius * (0.65 + AS_R(seed, 361) * 0.6);
    const a = ph + t * (AS_R(seed, 362) - 0.5) * 0.45;
    const center =
      (AS_R(seed, 363) - 0.5) * c.radius * 0.6 +
      8 * Math.sin(t * 0.9 + ph) * (1 + 0.3 * m.slow.mid);
    const dx = Math.cos(a) * reach,
      dy = Math.sin(a) * reach;
    g.strokeStyle = j % 3 === 0 ? '#ffffff' : '#070707';
    g.lineWidth = j % 3 === 0 ? 1.9 : 1.25;
    line(g, -dx, center - dy, dx, center + dy);
  }
}

// ---- BM's own populations ----
const S = 540,
  M = S / 4,
  PW = W + 2 * M,
  PH = H + 2 * M,
  SHARDS = 95;
const cp = ['#A33C2A', '#AECCB7', '#1A2C61', '#3F282A', '#537844', '#273F41', '#9AAB6E', '#50796E'];
const rgb = cp.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
});
const shardCache = new Map();
function bmConf(i, e) {
  const key = i * 512 + e + 64,
    hit = shardCache.get(key);
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
  if (shardCache.size > 8000) shardCache.clear();
  shardCache.set(key, c);
  return c;
}
function bmShard(g, c, k) {
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
const shardField = Array.from({ length: SHARDS }, (_, i) => ({
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
const SB = 560,
  streakCache = new Map();
function buildStreaks(e) {
  if (streakCache.has(e)) return streakCache.get(e);
  const raw = document.createElement('canvas');
  raw.width = SB;
  raw.height = SB;
  const g = raw.getContext('2d');
  for (let j = 0; j < 30; j++) {
    const r = (k) => randomAt(11592, e * 300 + j * 9 + k);
    g.strokeStyle = r(0) < 0.5 ? 'rgba(0,0,0,.78)' : 'rgba(255,255,255,.78)';
    g.lineWidth = 1 + r(1) * 3;
    g.beginPath();
    g.moveTo(r(2) * SB, r(3) * SB);
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

  const pool = [];
  for (const c of asCells) {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) continue;
    pool.push({
      kind: 'wheel',
      c,
      entry,
      depth: (AS_R(c.id, 900) - 0.5) * 240 + 20 * Math.sin(t * 0.31 + c.phase),
    });
  }
  for (let i = 0; i < SHARDS; i++) {
    const f = shardField[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 8 * f.k * t, PW) + 16 * Math.sin(t * 0.3 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 6 * f.k * t, PH) + 16 * Math.cos(t * 0.26 + f.ph);
    if (x < -S || x > W + S || y < -S || y > H + S) continue;
    pool.push({
      kind: 'shard',
      f,
      i,
      e,
      x,
      y,
      depth: (Fr(i, 900) - 0.5) * 240 + 20 * Math.sin(t * 0.22 + f.ph),
    });
  }
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 8192 + row,
        e = introFor(400 + (((col % 12) + 12) % 12) * 8 + (((row % 7) + 7) % 7), intro, 360);
      if (!e.active) continue;
      pool.push({ kind: 'dots', h, e, depth: (randomAt(11591, h * 20 + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'wheel') {
      const { c, entry: e } = item;
      const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.2) : quiet;
      g.save();
      g.translate(
        c.x + e.dx + 3 * Math.sin(t * 0.5 + c.phase),
        c.y + e.dy + 3 * Math.cos(t * 0.6 + c.phase),
      );
      g.scale(e.scale, e.scale);
      g.rotate(
        c.phase +
          c.direction * t * (0.17 + AS_R(c.id, 6) * 0.14) +
          0.12 * m.slow.mid * Math.sin(t * 0.7 + c.phase),
      );
      asWheel(g, c, t, m, s);
      g.restore();
    } else if (item.kind === 'shard') {
      const { f, i, e, x, y } = item;
      const P = 5 + randomAt(11593, i * 7 + 1) * 5,
        off = randomAt(11593, i * 7 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const c0 = bmConf(i, ep - 1),
        c1 = bmConf(i, ep),
        sc = e.scale * (1 + 0.05 * Math.sin(t * 0.7 + f.ph) + 0.06 * mBase.slow.bass);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(sc, sc);
      g.rotate(c1.rot + t * 0.04 * (1 + 0.4 * mBase.slow.mid));
      bmShard(g, c0, 1 - ease(fr / 0.16));
      bmShard(g, c1, ease(fr / 0.3));
      g.restore();
    } else {
      const { h, e } = item;
      const col = Math.floor(h / 8192),
        row = h % 8192;
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
      g.globalCompositeOperation = 'overlay';
      g.globalAlpha = ease(fr / 0.3);
      for (const d of cf.dots) {
        g.fillStyle = d.white ? '#ffffff' : '#000000';
        g.globalAlpha = d.alpha * ease(fr / 0.3);
        g.beginPath();
        g.arc(d.x, d.y, d.er / 2, 0, TAU);
        g.fill();
      }
      g.restore();
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.restore();
    }
  }

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
