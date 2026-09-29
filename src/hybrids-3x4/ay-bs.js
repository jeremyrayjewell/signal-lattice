// Hybrid of Scene AY ("Modular Tiles") and Scene BS ("Water Ripples") for
// segment 6, both my own scenes. AY's grid cells, BS's ripple drops, and
// BS's dot-grid vignette dots are merged into one array, tagged and depth-
// sorted together every frame, drawn in a single shared loop. AY's own
// procedural sky (a private per-frame buffer, no per-element structure) is
// used as the shared background in place of BS's vignette gradient.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-49/states.js';

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
const back = (q) => {
  q = Math.max(0, Math.min(1, q)) - 1;
  return 1 + 2.2 * q * q * q + 1.2 * q * q;
};
const mix = (a, b, q) => a + (b - a) * q;
const tint = (a, b, q) =>
  `rgb(${mix(a[0], b[0], q) | 0},${mix(a[1], b[1], q) | 0},${mix(a[2], b[2], q) | 0})`;

// ---- AY's own population and sky ----
const AG = 108,
  cp = [
    '#3E5162',
    '#222327',
    '#DEE0C8',
    '#C4775E',
    '#3A7C69',
    '#DDCA48',
    '#CB90A1',
    '#63BFBF',
    '#777F9D',
    '#9BBFBA',
  ];
const rgb = cp.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
});
const sc = document.createElement('canvas');
sc.width = W;
sc.height = H;
const blob = (rgb0) => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'),
    gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${rgb0},1)`);
  gr.addColorStop(0.58, `rgba(${rgb0},.92)`);
  gr.addColorStop(1, `rgba(${rgb0},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
};
const lit = blob('255,255,255'),
  shade = blob('128,158,205');
const K = (id, k) => randomAt(11551, id * 97 + k);
const skyLayers = [
  { P: 1500, speed: 3.5, scale: 0.8, alpha: 0.7, n: 8, y0: 60, y1: 260 },
  { P: 1900, speed: 7, scale: 1.3, alpha: 0.88, n: 7, y0: 130, y1: 400 },
  { P: 2400, speed: 12, scale: 2, alpha: 1, n: 6, y0: 230, y1: 520 },
].map((L, li) => ({
  ...L,
  clusters: Array.from({ length: L.n }, (_, i) => {
    const id = li * 50 + i,
      count = 8 + Math.floor(K(id, 0) * 7),
      width = (120 + K(id, 1) * 170) * L.scale;
    return {
      x: ((i + K(id, 2) * 0.8) / L.n) * L.P,
      y: L.y0 + K(id, 3) * (L.y1 - L.y0),
      puffs: Array.from({ length: count }, (_, j) => {
        const u = ((j + K(id, 10 + j)) / count) * 2 - 1,
          hump = 1 - u * u,
          r = (24 + 36 * hump * (0.55 + 0.45 * K(id, 30 + j))) * L.scale;
        return {
          x: (u * width) / 2,
          y: -r * 0.62 + (K(id, 50 + j) - 0.5) * 6 * L.scale,
          r,
          ph: K(id, 70 + j) * TAU,
        };
      }),
    };
  }),
}));
function paintSky(t, m) {
  const g = sc.getContext('2d'),
    gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#0f56b8');
  gr.addColorStop(0.55, '#2f86df');
  gr.addColorStop(1, '#82c0f0');
  g.globalAlpha = 1;
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (const L of skyLayers)
    for (const c of L.clusters) {
      const X = (((c.x - t * L.speed) % L.P) + L.P) % L.P,
        live = [];
      for (const q of c.puffs) {
        const r = q.r * (1 + 0.05 * Math.sin(t * 0.35 + q.ph) + 0.05 * m.slow.bass),
          y = c.y + q.y + 2 * Math.sin(t * 0.23 + q.ph);
        for (const shift of [0, -L.P]) {
          const x = X + q.x + shift;
          if (x > -r * 1.4 && x < W + r * 1.4) live.push({ x, y, r });
        }
      }
      g.globalAlpha = L.alpha * 0.55;
      for (const q of live)
        g.drawImage(shade, q.x - q.r * 1.1, q.y - q.r * 1.1 + q.r * 0.3, q.r * 2.2, q.r * 2.2);
      g.globalAlpha = L.alpha;
      for (const q of live)
        g.drawImage(lit, q.x - q.r * 1.1, q.y - q.r * 1.1, q.r * 2.2, q.r * 2.2);
    }
  g.globalAlpha = 1;
}
const ayCache = new Map();
function ayConf(h, e) {
  const key = h * 512 + e + 64,
    hit = ayCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11549, key * 160 + k);
  const bv = [1, 2, 4][Math.floor(r(0) * 3)],
    sg = AG / bv,
    rects = [];
  for (let i = 0; i < bv; i++)
    for (let j = 0; j < bv; j++) {
      const k = 1 + (i * bv + j) * 4,
        gray = r(k) < 0.5,
        v = (200 + r(k + 1) * 55) | 0,
        w = sg / (r(k + 2) < 0.5 ? 1 : 2),
        h2 = sg / (r(k + 3) < 0.5 ? 1 : 2);
      rects.push({
        x: -AG / 2 + sg / 2 + i * sg,
        y: -AG / 2 + sg / 2 + j * sg,
        w,
        h: h2,
        max: sg / Math.max(w, h2),
        ph: ((r(k + 3) * 13) % 1) * TAU,
        fill: gray ? `rgba(${v},${v},${v},.58)` : cp[Math.floor(r(k + 1) * 10)],
      });
    }
  const c = {
    rects,
    q: Math.floor(r(70) * 4),
    rr: AG / (r(71) < 0.5 ? 4 : 8),
    sq: rgb[Math.floor(r(72) * 10)],
    ci: rgb[Math.floor(r(73) * 10)],
    ly: ((r(74) * 2 - 1) * AG) / 2,
    dense: r(75) < 0.5,
    jt: Array.from({ length: 11 }, (_, i) => r(80 + i) * 2 - 1),
    jb: Array.from({ length: 11 }, (_, i) => r(100 + i) * 2 - 1),
  };
  if (ayCache.size > 6000) ayCache.clear();
  ayCache.set(key, c);
  return c;
}
function ayMosaic(g, cf, k, t, mid) {
  if (k <= 0.003) return;
  for (const r of cf.rects) {
    const sc2 = Math.min(
        r.max,
        k * (1 - 0.06 * (0.5 + 0.5 * Math.sin(t * 0.9 + r.ph)) + 0.08 * mid),
      ),
      w = r.w * sc2,
      h = r.h * sc2;
    g.fillStyle = r.fill;
    g.fillRect(r.x - w / 2 - 0.4, r.y - h / 2 - 0.4, w + 0.8, h + 0.8);
  }
}
function ayTile(g, x, y, e, t, s, m, h) {
  const P = 4.4 + randomAt(11550, h * 4 + 1) * 4.8,
    off = randomAt(11550, h * 4 + 2) * P,
    ph = randomAt(11550, h * 4 + 3) * TAU;
  const u = (t + off) / P,
    ep = Math.floor(u),
    f = u - ep,
    cur = ayConf(h, ep),
    prev = ayConf(h, ep - 1);
  const se = ease(f / 0.34),
    swing = back(f / 0.36);
  g.save();
  g.translate(x + e.dx, y + e.dy);
  g.scale(e.scale, e.scale);
  g.save();
  g.beginPath();
  g.rect(-AG / 2, -AG / 2, AG, AG);
  g.clip();
  g.drawImage(sc, -x, -y);
  g.restore();
  ayMosaic(g, prev, 1 - ease(f / 0.16), t, m.slow.mid);
  ayMosaic(g, cur, ease(f / 0.3), t, m.slow.mid);
  g.save();
  g.beginPath();
  g.rect(-AG / 2, -AG / 2, AG, AG);
  g.clip();
  const turn = (((cur.q - prev.q + 5) % 4) - 1) * 90;
  g.rotate(((prev.q * 90 + turn * swing) * Math.PI) / 180 + 0.025 * Math.sin(t * 0.6 + ph));
  const rb = mix(prev.rr, cur.rr, se),
    rr = rb * (1 + 0.1 * m.slow.mid);
  g.fillStyle = tint(prev.sq, cur.sq, se);
  g.fillRect(-AG / 2 + rr / 2, -AG / 2 + rr / 2, rr, rr);
  const er = AG - rb * 2.5,
    rad = (er / 2) * (1 + 0.09 * m.slow.bass + 0.035 * Math.sin(t * 1.1 + ph));
  g.fillStyle = tint(prev.ci, cur.ci, se);
  g.beginPath();
  g.arc(-AG / 2 + er / 2, AG / 2 - er / 2, rad, 0, TAU);
  g.fill();
  g.strokeStyle = '#000000';
  g.lineWidth = AG / 72 + m.fast.centroid * 0.5;
  g.beginPath();
  g.moveTo(-AG / 2 + rr, -AG / 2 + rr);
  g.lineTo(AG / 2, mix(prev.ly, cur.ly, se) + AG * 0.13 * Math.sin(t * 0.8 + ph));
  g.stroke();
  const lgP = AG / (prev.dense ? 20 : 10),
    lgC = AG / (cur.dense ? 20 : 10);
  g.beginPath();
  for (let i = 0; i <= 10; i++) {
    const wt = mix(prev.dense || i % 2 === 0 ? 1 : 0, cur.dense || i % 2 === 0 ? 1 : 0, se);
    if (wt < 0.02) continue;
    const sway = (1.3 + 3.4 * m.fast.high) * Math.sin(t * (1.1 + i * 0.07) + i * 0.8 + ph),
      bx = (i * AG) / 20;
    g.moveTo(bx + mix(prev.jt[i] * lgP, cur.jt[i] * lgC, se) / 3 + sway, 0);
    g.lineTo(bx + mix(prev.jb[i] * lgP, cur.jb[i] * lgC, se) / 3 - sway * 0.8, (AG / 2) * wt);
  }
  g.stroke();
  g.restore();
  g.restore();
}

// ---- BS's own populations ----
const CX = W / 2,
  CY = H / 2,
  VR = Math.hypot(CX, CY),
  G2 = 27 /*S/30 approximated with S=540/20*/,
  N = 150,
  Kd = 9;
const vignette = (x, y) => {
  const d = Math.min(1, Math.hypot(x - CX, y - CY) / VR);
  return Math.round(mix(255, 0, d));
};
const bsCache = new Map();
function bsConf(i, e) {
  const key = i * 512 + e + 64,
    hit = bsCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11611, key * 20 + k);
  const clustered = r(6) < 0.62,
    HOTSPOTS_x = randomAt(11613, 0) * W,
    HOTSPOTS_y = randomAt(11613, 1) * H;
  const x = clustered
    ? Math.max(0, Math.min(W, HOTSPOTS_x + (r(0) * 2 - 1) * 270 * 0.32))
    : r(0) * W;
  const y = clustered
    ? Math.max(0, Math.min(H, HOTSPOTS_y + (r(1) * 2 - 1) * 270 * 0.32))
    : r(1) * H;
  const c = {
    x,
    y,
    R: 135 + r(2) * 135,
    white: r(3) < 0.5,
    seed: Math.floor(r(4) * 1e6),
    period: 2 + r(5) * 1.6,
  };
  if (bsCache.size > 8000) bsCache.clear();
  bsCache.set(key, c);
  return c;
}
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, f * f * (3 - 2 * f));
}
function bsRing(g, c, t, m, k) {
  if (k <= 0.004) return;
  g.strokeStyle = c.white ? '#ffffff' : '#000000';
  const reach = c.R * (1 + 0.08 * m.slow.bass);
  for (let ri = 0; ri < Kd; ri++) {
    const phase = (((t / c.period + ri / Kd) % 1) + 1) % 1,
      radius = phase * reach * k;
    if (radius < 1) continue;
    const alpha = (1 - phase * 0.85) * (1 - phase * 0.85) * k;
    if (alpha <= 0.015) continue;
    g.globalAlpha = Math.min(1, alpha * 1.15);
    g.lineWidth = Math.max(0.6, 2.6 * (1 - phase * 0.55));
    g.beginPath();
    for (let a2 = 0; a2 <= 64; a2++) {
      const ang = (a2 / 64) * TAU,
        wob = 1 + 0.02 * vn(c.seed, ang * 3 + phase * 5);
      const px = c.x + Math.cos(ang) * radius * wob,
        py = c.y + Math.sin(ang) * radius * wob;
      a2 === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  paintSky(t, mBase);
  if (intro >= 1) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(sc, 0, 0);
    g.restore();
  }
  g.save();

  const pool = [];
  const ox = -(t * 19 + 26 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion)),
    oy = -(t * 11.5 + 18 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / AG) - 1,
    c1 = Math.ceil((W - ox) / AG),
    r0 = Math.floor(-oy / AG) - 1,
    r1 = Math.ceil((H - oy) / AG);
  for (let c = c0; c <= c1; c++)
    for (let row = r0; row <= r1; row++) {
      const h = (c + 3000) * 8192 + row + 3000,
        x = c * AG + AG / 2 + ox,
        y = row * AG + AG / 2 + oy;
      const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
      if (!e.active) continue;
      pool.push({ kind: 'tile', h, x, y, e, depth: (randomAt(11550, h * 4 + 900) - 0.5) * 240 });
    }
  for (let i = 0; i < N; i++) {
    const e = introFor(3000 + i, intro, 420);
    if (!e.active) continue;
    pool.push({ kind: 'ring', i, e, depth: (randomAt(11611, i * 20 + 900) - 0.5) * 240 });
  }
  const cols = Math.round(W / G2),
    rows = Math.round(H / G2);
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 4096 + row,
        e = introFor(4000 + (((col % 20) + 20) % 20) * 14 + (((row % 12) + 12) % 12), intro, 340);
      if (!e.active) continue;
      pool.push({ kind: 'dot', h, e, depth: (randomAt(11573, h + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'tile') {
      const { h, x, y, e } = item,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      ayTile(g, x, y, e, t, s, m, h);
    } else if (item.kind === 'ring') {
      const { i, e } = item;
      const P = 8 + randomAt(11612, i * 7 + 1) * 6,
        off = randomAt(11612, i * 7 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const c0 = bsConf(i, ep - 1),
        c1 = bsConf(i, ep),
        m = reactive ? controls.at(t - 0.03 - (c1.x / W) * 0.16) : quiet;
      bsRing(g, { ...c0, x: c0.x + e.dx, y: c0.y + e.dy }, t, m, 1 - ease(fr / 0.16));
      bsRing(g, { ...c1, x: c1.x + e.dx, y: c1.y + e.dy }, t, m, ease(fr / 0.3));
    } else {
      const { h, e } = item,
        col = Math.floor(h / 4096),
        row = h % 4096;
      const x = col * G2 + G2 / 2,
        y = row * G2 + G2 / 2,
        tone = vignette(x, y);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.shadowOffsetX = 0;
      g.shadowOffsetY = 0;
      g.shadowBlur = G2 / 4;
      g.shadowColor = '#000000';
      g.fillStyle = `rgb(${tone},${tone},${tone})`;
      g.beginPath();
      g.arc(0, 0, G2 / 1.15 / 2, 0, TAU);
      g.fill();
      g.restore();
    }
  }
  g.shadowBlur = 0;
  g.restore();
  return s;
}
