// Hybrid of Scene AZ ("Pinwheel Shards") and Scene BT ("Scribble Bloom") for
// segment 6, both my own scenes. AZ's grid cells, BT's scribble clusters,
// and BT's overlay dot-grid are merged into one array, tagged and depth-
// sorted together every frame, drawn in a single shared loop. AZ's own
// procedural star field (a private per-frame buffer) is used as the shared
// background.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-50/states.js';

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
const tint = (a, b, q) =>
  `rgb(${mix(a[0], b[0], q) | 0},${mix(a[1], b[1], q) | 0},${mix(a[2], b[2], q) | 0})`;
const wrap = (a) => a - TAU * Math.round(a / TAU);

// ---- AZ's own population and star field ----
const AG = 135,
  AN = 60,
  cp = [
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
const starLayers = [
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
  for (const L of starLayers)
    for (const q of L.stars) {
      const x = (((q.x + t * L.v[0]) % W) + W) % W,
        y = (((q.y + t * L.v[1]) % H) + H) % H;
      const tw = Math.pow(0.5 + 0.5 * Math.sin(t * q.f * (1 + 0.6 * m.fast.high) + q.ph), 2.2),
        b = Math.min(1, L.a * (0.25 + 0.75 * tw));
      const size = q.r * 2 * (1 + 0.6 * tw);
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
const azCache = new Map();
function azConf(h, e) {
  const key = h * 512 + e + 64,
    hit = azCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11552, key * 700 + k);
  const sv = [1, 2, 4, 8][Math.floor(r(0) * 4)],
    sg = AG / sv,
    tiles = [];
  for (let i = 0; i < sv; i++)
    for (let j = 0; j < sv; j++) {
      const k = 10 + (i * sv + j) * 3;
      if (r(k) < 0.5) continue;
      const gray = r(k + 1) < 0.5,
        v = (r(k + 2) * 255) | 0;
      tiles.push({
        x: -AG / 2 + sg / 2 + i * sg,
        y: -AG / 2 + sg / 2 + j * sg,
        ph: ((r(k + 2) * 17) % 1) * TAU,
        fill: gray ? `rgb(${v},${v},${v})` : cp[Math.floor(r(k + 2) * 10)],
      });
    }
  const er = AG / 4 + (r(212) * AG) / 4,
    cc = r(215);
  const c = {
    tiles,
    size: sg + 1,
    rot: r(210) * TAU,
    step: AN / [10, 20, 30][Math.floor(r(211) * 3)],
    er,
    cx: (r(213) * 2 - 1) * (AG / 2 - er / 2),
    cy: (r(214) * 2 - 1) * (AG / 2 - er / 2),
    ci: cc < 1 / 3 ? [0, 0, 0] : cc < 2 / 3 ? [255, 255, 255] : rgb[Math.floor(r(216) * 10)],
    tri: Array.from({ length: AN }, (_, i) => {
      const b = 230 + i * 7;
      return {
        fill: r(b) < 0.5,
        col: rgb[Math.floor(r(b + 1) * 10)],
        x0: (r(b + 2) * AG) / 4,
        y0: -(AG / 20 + r(b + 3) * (AG / 4 - AG / 20)),
        x1: AG / 4 + r(b + 4) * (AG / 1.5 - AG / 4),
        x2: (r(b + 5) * AG) / 4,
        y2: AG / 20 + r(b + 6) * (AG / 4 - AG / 20),
      };
    }),
  };
  if (azCache.size > 6000) azCache.clear();
  azCache.set(key, c);
  return c;
}
function azMosaic(g, cf, k, t, mid) {
  if (k <= 0.003) return;
  for (const q of cf.tiles) {
    const s =
      cf.size * Math.min(1, k * (1 - 0.07 * (0.5 + 0.5 * Math.sin(t * 0.8 + q.ph)) + 0.08 * mid));
    g.fillStyle = q.fill;
    g.fillRect(q.x - s / 2, q.y - s / 2, s, s);
  }
}
function azTile(g, x, y, e, t, s, m, h) {
  const P = 5 + randomAt(11553, h * 4 + 1) * 4.5,
    off = randomAt(11553, h * 4 + 2) * P,
    ph = randomAt(11553, h * 4 + 3) * TAU;
  const spin = (randomAt(11553, h * 4) < 0.5 ? -1 : 1) * (0.09 + randomAt(11553, h * 7 + 3) * 0.17);
  const u = (t + off) / P,
    ep = Math.floor(u),
    f = u - ep,
    cur = azConf(h, ep),
    prev = azConf(h, ep - 1);
  const se = ease(f / 0.4),
    bass = m.slow.bass;
  g.save();
  g.translate(x + e.dx, y + e.dy);
  g.scale(e.scale, e.scale);
  g.save();
  g.beginPath();
  g.rect(-AG / 2, -AG / 2, AG, AG);
  g.clip();
  g.drawImage(sc, -x, -y);
  g.restore();
  azMosaic(g, prev, 1 - ease(f / 0.16), t, m.slow.mid);
  azMosaic(g, cur, ease(f / 0.3), t, m.slow.mid);
  g.rotate(prev.rot + wrap(cur.rot - prev.rot) * ease(f / 0.5) + spin * t);
  g.lineWidth = AG / 100 + m.fast.centroid * 0.5;
  for (let i = 0; i < AN; i++) {
    const w = mix(i % prev.step === 0 ? 1 : 0, i % cur.step === 0 ? 1 : 0, se);
    if (w < 0.02) continue;
    const a = prev.tri[i],
      b = cur.tri[i],
      fillA = mix(a.fill ? 1 : 0, b.fill ? 1 : 0, se);
    const k = w * (1 + 0.08 * Math.sin(t * 0.9 + i * 0.5 + ph) + 0.12 * bass);
    g.save();
    g.rotate((i * TAU) / AN);
    g.beginPath();
    g.moveTo(mix(a.x0, b.x0, se) * k, mix(a.y0, b.y0, se) * k);
    g.lineTo(mix(a.x1, b.x1, se) * k, 0);
    g.lineTo(mix(a.x2, b.x2, se) * k, mix(a.y2, b.y2, se) * k);
    g.closePath();
    const col = tint(a.col, b.col, se);
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
  const er = mix(prev.er, cur.er, se) * (1 + 0.08 * bass);
  g.fillStyle = tint(prev.ci, cur.ci, se);
  g.beginPath();
  g.arc(mix(prev.cx, cur.cx, se), mix(prev.cy, cur.cy, se), er / 2, 0, TAU);
  g.fill();
  g.restore();
}

// ---- BT's own populations ----
const S = 540,
  M = S / 4,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 220,
  STRANDS = 80;
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, f * f * (3 - 2 * f));
}
function hsl(h, s, l) {
  return `hsl(${h},${s}%,${l}%)`;
}
const btCache = new Map();
function btConf(i, e) {
  const key = i * 512 + e + 64,
    hit = btCache.get(key);
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
  if (btCache.size > 8000) btCache.clear();
  btCache.set(key, c);
  return c;
}
function btCluster(g, c, t, m, k) {
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
const btField = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 5,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  paintStars(t, mBase);
  if (intro >= 1) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(sc, 0, 0);
    g.restore();
  }
  g.save();

  const pool = [];
  const ox = t * 15 + 22 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion),
    oy = t * 8 + 16 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / AG) - 2,
    c1 = Math.ceil((W - ox) / AG) + 1,
    r0 = Math.floor(-oy / AG) - 1,
    r1 = Math.ceil((H - oy) / AG) + 1;
  for (let c = c0; c <= c1; c++)
    for (let row = r0; row <= r1; row++) {
      const h = (c + 3000) * 8192 + row + 3000,
        x = c * AG + AG / 2 + ox,
        y = row * AG + AG / 2 + oy;
      const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
      if (!e.active) continue;
      pool.push({ kind: 'tile', h, x, y, e, depth: (randomAt(11553, h * 4 + 900) - 0.5) * 240 });
    }
  const pace = intro * intro;
  for (let i = 0; i < N; i++) {
    const f = btField[i],
      e = introFor(i, pace, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 7 * f.k * t, PW) + 16 * Math.sin(t * 0.27 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 5 * f.k * t, PH) + 16 * Math.cos(t * 0.23 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    pool.push({ kind: 'cluster', f, i, e, x, y, depth: (Fr(i, 900) - 0.5) * 240 });
  }
  const cols = Math.round(W / (S / 30)),
    rows = Math.round(H / (S / 30));
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 4096 + row,
        e = introFor(2000 + (((col % 20) + 20) % 20) * 14 + (((row % 12) + 12) % 12), pace, 340);
      if (!e.active) continue;
      pool.push({ kind: 'dot', h, e, depth: (randomAt(11616, h + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'tile') {
      const { h, x, y, e } = item,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      azTile(g, x, y, e, t, s, m, h);
    } else if (item.kind === 'cluster') {
      const { f, i, e, x, y } = item;
      const P = f.life,
        off = f.off * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      btCluster(g, btConf(i, ep - 1), t, m, 1 - ease(fr / 0.16));
      btCluster(g, btConf(i, ep), t, m, ease(fr / 0.3));
      g.restore();
    } else {
      const { h, e } = item,
        col = Math.floor(h / 4096),
        row = h % 4096,
        G3 = S / 30;
      const x = col * G3 + G3 / 2,
        y = row * G3 + G3 / 2,
        clock = Math.floor((t + randomAt(11616, h) * 3) * 1.3);
      const white = randomAt(11616, h * 7 + clock) < 0.5,
        alpha = randomAt(11616, h * 7 + clock + 1),
        big = randomAt(11616, h * 7 + clock + 2) < 0.5;
      const er = (big ? G3 : G3 / 2) * (1 + 0.15 * Math.sin(t * 0.6 + h) + 0.1 * mBase.fast.high);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.globalCompositeOperation = 'overlay';
      g.globalAlpha = alpha * (0.7 + 0.3 * mBase.fast.rms);
      g.fillStyle = white ? '#ffffff' : '#000000';
      g.beginPath();
      g.arc(0, 0, er / 2, 0, TAU);
      g.fill();
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.restore();
    }
  }
  g.restore();
  return s;
}
