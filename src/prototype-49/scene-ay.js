import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  G = 108;
const cp = [
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
const cache = new Map();
// Sky: drawn to one offscreen buffer per frame from time alone, so it stays order-independent.
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
// Three parallax layers of cumulus: each cluster is a hump of overlapping puffs with a flat base.
const layers = [
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
  for (const L of layers)
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
// One cell's composition for one "epoch"; a pure function of (cell, epoch), so any frame can be drawn alone.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11549, key * 160 + k);
  const bv = [1, 2, 4][Math.floor(r(0) * 3)],
    sg = G / bv,
    rects = [];
  for (let i = 0; i < bv; i++)
    for (let j = 0; j < bv; j++) {
      const k = 1 + (i * bv + j) * 4,
        gray = r(k) < 0.5,
        v = (200 + r(k + 1) * 55) | 0,
        w = sg / (r(k + 2) < 0.5 ? 1 : 2),
        h2 = sg / (r(k + 3) < 0.5 ? 1 : 2);
      rects.push({
        x: -G / 2 + sg / 2 + i * sg,
        y: -G / 2 + sg / 2 + j * sg,
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
    rr: G / (r(71) < 0.5 ? 4 : 8),
    sq: rgb[Math.floor(r(72) * 10)],
    ci: rgb[Math.floor(r(73) * 10)],
    ly: ((r(74) * 2 - 1) * G) / 2,
    dense: r(75) < 0.5,
    jt: Array.from({ length: 11 }, (_, i) => r(80 + i) * 2 - 1),
    jb: Array.from({ length: 11 }, (_, i) => r(100 + i) * 2 - 1),
  };
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
function mosaic(g, cf, k, t, mid) {
  if (k <= 0.003) return;
  for (const r of cf.rects) {
    const sc = Math.min(
        r.max,
        k * (1 - 0.06 * (0.5 + 0.5 * Math.sin(t * 0.9 + r.ph)) + 0.08 * mid),
      ),
      w = r.w * sc,
      h = r.h * sc;
    g.fillStyle = r.fill;
    g.fillRect(r.x - w / 2 - 0.4, r.y - h / 2 - 0.4, w + 0.8, h + 0.8);
  }
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const base = reactive ? controls.at(t) : quiet;
  paintSky(t, base);
  if (intro >= 1) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(sc, 0, 0);
    g.restore();
  }
  // The whole tile wall drifts as one sheet, so the grid stays tidy while cells stream past.
  const ox = -(t * 19 + 26 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion)),
    oy = -(t * 11.5 + 18 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  g.save();
  for (let c = c0; c <= c1; c++)
    for (let row = r0; row <= r1; row++) {
      const h = (c + 3000) * 8192 + row + 3000,
        x = c * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
      if (!e.active) continue;
      const P = 4.4 + randomAt(11550, h * 4 + 1) * 4.8,
        off = randomAt(11550, h * 4 + 2) * P,
        ph = randomAt(11550, h * 4 + 3) * TAU;
      const u = (t + off) / P,
        ep = Math.floor(u),
        f = u - ep,
        cur = conf(h, ep),
        prev = conf(h, ep - 1);
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const se = ease(f / 0.34),
        swing = back(f / 0.36);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.save();
        g.beginPath();
        g.rect(-G / 2, -G / 2, G, G);
        g.clip();
        g.drawImage(sc, -x, -y);
        g.restore();
      }
      // Old mosaic shrinks away while the new one grows in.
      mosaic(g, prev, 1 - ease(f / 0.16), t, m.slow.mid);
      mosaic(g, cur, ease(f / 0.3), t, m.slow.mid);
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      const turn = (((cur.q - prev.q + 5) % 4) - 1) * 90;
      g.rotate(
        ((prev.q * 90 + turn * swing) * Math.PI) / 180 +
          0.025 * Math.sin(t * 0.6 + ph) +
          m.impulse * s.impulse * 0.05 * Math.sin(t * 9 + ph),
      );
      const rb = mix(prev.rr, cur.rr, se),
        rr = rb * (1 + 0.1 * m.slow.mid);
      g.fillStyle = tint(prev.sq, cur.sq, se);
      g.fillRect(-G / 2 + rr / 2, -G / 2 + rr / 2, rr, rr);
      const er = G - rb * 2.5,
        rad = (er / 2) * (1 + 0.09 * m.slow.bass + 0.035 * Math.sin(t * 1.1 + ph));
      g.fillStyle = tint(prev.ci, cur.ci, se);
      g.beginPath();
      g.arc(-G / 2 + er / 2, G / 2 - er / 2, rad, 0, TAU);
      g.fill();
      g.strokeStyle = '#000000';
      g.lineWidth = G / 72 + m.fast.centroid * 0.5;
      g.beginPath();
      g.moveTo(-G / 2 + rr, -G / 2 + rr);
      g.lineTo(
        G / 2,
        mix(prev.ly, cur.ly, se) + G * 0.13 * Math.sin(t * 0.8 + ph) * (0.5 + 0.5 * s.motion),
      );
      g.stroke();
      // Hatch: 20 candidate lines, the sparse regime keeps every other one; density change grows/retracts the extras.
      const lgP = G / (prev.dense ? 20 : 10),
        lgC = G / (cur.dense ? 20 : 10);
      g.beginPath();
      for (let i = 0; i <= 10; i++) {
        const wt = mix(prev.dense || i % 2 === 0 ? 1 : 0, cur.dense || i % 2 === 0 ? 1 : 0, se);
        if (wt < 0.02) continue;
        const sway =
            (1.3 + 3.4 * m.fast.high + s.motion * 1.2) *
            Math.sin(t * (1.1 + i * 0.07) + i * 0.8 + ph),
          bx = (i * G) / 20;
        g.moveTo(bx + mix(prev.jt[i] * lgP, cur.jt[i] * lgC, se) / 3 + sway, 0);
        g.lineTo(bx + mix(prev.jb[i] * lgP, cur.jb[i] * lgC, se) / 3 - sway * 0.8, (G / 2) * wt);
      }
      g.stroke();
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
