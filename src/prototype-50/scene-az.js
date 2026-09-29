import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  G = 135,
  N = 60;
const cp = [
  '#986A51',
  '#7CB1CB',
  '#F2852B',
  '#67212B',
  '#0F5282',
  '#C13026',
  '#C5B4BA',
  '#102C47',
  '#194D67',
  '#0C1B33',
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
const mix = (a, b, q) => a + (b - a) * q;
const tint = (a, b, q) =>
  `rgb(${mix(a[0], b[0], q) | 0},${mix(a[1], b[1], q) | 0},${mix(a[2], b[2], q) | 0})`;
const wrap = (a) => a - TAU * Math.round(a / TAU);
const cache = new Map();
// Star field: painted to one offscreen buffer per frame from time alone, so it stays order-independent.
const sc = document.createElement('canvas');
sc.width = W;
sc.height = H;
const glow = (rgb0) => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d'),
    gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, `rgba(${rgb0},1)`);
  gr.addColorStop(0.25, `rgba(${rgb0},.85)`);
  gr.addColorStop(1, `rgba(${rgb0},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  return c;
};
const hues = ['255,255,255', '188,214,255', '255,228,184', '255,200,216'].map(glow);
const Q = (id, k) => randomAt(11554, id * 61 + k);
// Three parallax layers drifting with the wall's new heading; only the nearest carry cross glints.
const layers = [
  { n: 260, r0: 1, r1: 1.7, v: [2.5, 1.4], a: 0.7 },
  { n: 130, r0: 1.6, r1: 2.6, v: [5, 2.8], a: 0.9 },
  { n: 44, r0: 2.4, r1: 3.8, v: [9, 5], a: 1, glint: true },
].map((L, li) => ({
  ...L,
  stars: Array.from({ length: L.n }, (_, i) => {
    const id = li * 400 + i;
    return {
      x: Q(id, 0) * W,
      y: Q(id, 1) * H,
      r: L.r0 + Q(id, 2) * (L.r1 - L.r0),
      f: 0.8 + Q(id, 3) * 2.6,
      ph: Q(id, 4) * TAU,
      hue: hues[Q(id, 5) < 0.6 ? 0 : 1 + Math.floor(Q(id, 6) * 3)],
      glint: Q(id, 7),
    };
  }),
}));
function paintStars(t, m) {
  const g = sc.getContext('2d'),
    gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#040a1e');
  gr.addColorStop(1, '#000000');
  g.globalAlpha = 1;
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  for (const L of layers)
    for (const q of L.stars) {
      const x = (((q.x + t * L.v[0]) % W) + W) % W,
        y = (((q.y + t * L.v[1]) % H) + H) % H;
      const tw = Math.pow(0.5 + 0.5 * Math.sin(t * q.f * (1 + 0.6 * m.fast.high) + q.ph), 2.2),
        b = Math.min(1, L.a * (0.25 + 0.75 * tw) * (1 + 0.3 * m.fast.high));
      const size = q.r * 2 * (1 + 0.6 * tw) * (1 + 0.15 * m.slow.bass);
      g.globalAlpha = b;
      g.drawImage(q.hue, x - size, y - size, size * 2, size * 2);
      if (L.glint && q.glint > 0.2) {
        const len = size * (2.5 + 5 * tw);
        g.globalAlpha = b * 0.85 * tw;
        g.fillStyle = '#ffffff';
        g.fillRect(x - len, y - 0.6, len * 2, 1.2);
        g.fillRect(x - 0.6, y - len, 1.2, len * 2);
      }
    }
  g.globalAlpha = 1;
}
// One cell's composition for one "epoch": a pure function of (cell, epoch), so any frame can be drawn alone.
// The pinwheel has 60 candidate spokes; 10, 20 or 30 evenly spaced ones are active (every 6th, 3rd or 2nd).
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11552, key * 700 + k);
  const sv = [1, 2, 4, 8][Math.floor(r(0) * 4)],
    sg = G / sv,
    tiles = [];
  for (let i = 0; i < sv; i++)
    for (let j = 0; j < sv; j++) {
      const k = 10 + (i * sv + j) * 3;
      if (r(k) < 0.5) continue;
      const gray = r(k + 1) < 0.5,
        v = (r(k + 2) * 255) | 0;
      tiles.push({
        x: -G / 2 + sg / 2 + i * sg,
        y: -G / 2 + sg / 2 + j * sg,
        ph: ((r(k + 2) * 17) % 1) * TAU,
        fill: gray ? `rgb(${v},${v},${v})` : cp[Math.floor(r(k + 2) * 10)],
      });
    }
  const er = G / 4 + (r(212) * G) / 4,
    cc = r(215);
  const c = {
    tiles,
    size: sg + 1,
    rot: r(210) * TAU,
    step: N / [10, 20, 30][Math.floor(r(211) * 3)],
    er,
    cx: (r(213) * 2 - 1) * (G / 2 - er / 2),
    cy: (r(214) * 2 - 1) * (G / 2 - er / 2),
    ci: cc < 1 / 3 ? [0, 0, 0] : cc < 2 / 3 ? [255, 255, 255] : rgb[Math.floor(r(216) * 10)],
    tri: Array.from({ length: N }, (_, i) => {
      const b = 230 + i * 7;
      return {
        fill: r(b) < 0.5,
        col: rgb[Math.floor(r(b + 1) * 10)],
        x0: (r(b + 2) * G) / 4,
        y0: -(G / 20 + r(b + 3) * (G / 4 - G / 20)),
        x1: G / 4 + r(b + 4) * (G / 1.5 - G / 4),
        x2: (r(b + 5) * G) / 4,
        y2: G / 20 + r(b + 6) * (G / 4 - G / 20),
      };
    }),
  };
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
function mosaic(g, cf, k, t, mid) {
  if (k <= 0.003) return;
  for (const q of cf.tiles) {
    const s =
      cf.size * Math.min(1, k * (1 - 0.07 * (0.5 + 0.5 * Math.sin(t * 0.8 + q.ph)) + 0.08 * mid));
    g.fillStyle = q.fill;
    g.fillRect(q.x - s / 2, q.y - s / 2, s, s);
  }
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  paintStars(t, reactive ? controls.at(t) : quiet);
  if (intro >= 1) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(sc, 0, 0);
    g.restore();
  }
  // The wall drifts as one sheet, right and down; cells are drawn column by column so later cells overlap earlier spikes.
  const ox = t * 15 + 22 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion),
    oy = t * 8 + 16 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 2,
    c1 = Math.ceil((W - ox) / G) + 1,
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G) + 1;
  g.save();
  for (let c = c0; c <= c1; c++)
    for (let row = r0; row <= r1; row++) {
      const h = (c + 3000) * 8192 + row + 3000,
        x = c * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
      if (!e.active) continue;
      const P = 5 + randomAt(11553, h * 4 + 1) * 4.5,
        off = randomAt(11553, h * 4 + 2) * P,
        ph = randomAt(11553, h * 4 + 3) * TAU;
      const spin =
        (randomAt(11553, h * 4) < 0.5 ? -1 : 1) * (0.09 + randomAt(11553, h * 7 + 3) * 0.17);
      const u = (t + off) / P,
        ep = Math.floor(u),
        f = u - ep,
        cur = conf(h, ep),
        prev = conf(h, ep - 1);
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const se = ease(f / 0.4),
        bass = m.slow.bass;
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
      g.rotate(
        prev.rot +
          wrap(cur.rot - prev.rot) * ease(f / 0.5) +
          spin * t +
          0.1 * m.impulse * s.impulse * Math.sin(t * 7 + ph),
      );
      g.lineWidth = G / 100 + m.fast.centroid * 0.5;
      for (let i = 0; i < N; i++) {
        const w = mix(i % prev.step === 0 ? 1 : 0, i % cur.step === 0 ? 1 : 0, se);
        if (w < 0.02) continue;
        const a = prev.tri[i],
          b = cur.tri[i],
          fillA = mix(a.fill ? 1 : 0, b.fill ? 1 : 0, se);
        const k =
          w *
          (1 +
            0.08 * Math.sin(t * 0.9 + i * 0.5 + ph) +
            0.12 * bass +
            0.05 * m.fast.high * Math.sin(t * 11 + i));
        g.save();
        g.rotate((i * TAU) / N);
        g.beginPath();
        g.moveTo(mix(a.x0, b.x0, se) * k, mix(a.y0, b.y0, se) * k);
        g.lineTo(mix(a.x1, b.x1, se) * k, 0);
        g.lineTo(mix(a.x2, b.x2, se) * k, mix(a.y2, b.y2, se) * k);
        g.closePath();
        const col = tint(a.col, b.col, se);
        // Filled and outlined spokes trade weight rather than popping between styles.
        if (fillA > 0.02) {
          g.globalAlpha = fillA;
          g.fillStyle = col;
          g.fill();
        }
        if (fillA < 0.98) {
          g.globalAlpha = 1 - fillA;
          g.strokeStyle = col;
          g.stroke();
        }
        g.restore();
      }
      g.globalAlpha = 1;
      const er = mix(prev.er, cur.er, se) * (1 + 0.08 * bass + 0.04 * Math.sin(t * 1.3 + ph));
      g.fillStyle = tint(prev.ci, cur.ci, se);
      g.beginPath();
      g.arc(
        mix(prev.cx, cur.cx, se) + G * 0.05 * Math.sin(t * 0.5 + ph),
        mix(prev.cy, cur.cy, se) + G * 0.05 * Math.cos(t * 0.43 + ph),
        er / 2,
        0,
        TAU,
      );
      g.fill();
      g.restore();
    }
  g.restore();
  return s;
}
