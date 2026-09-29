import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 4,
  SG = G / 2;
const cp = ['#E8B923', '#F5D400', '#A69200', '#FFF3B0', '#FFE066'];
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
const smooth = (q) => q * q * (3 - 2 * q);
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}

// ---- background: a fixed grid of gold/yellow quilt cells, each independently colour-cycling ----
const cols = Math.ceil(W / SG) + 1,
  rows = Math.ceil(H / SG) + 1;
const cells = Array.from({ length: cols * rows }, (_, i) => ({
  col: i % cols,
  row: Math.floor(i / cols),
  ph: randomAt(11637, i * 7) * TAU,
  interval: 5 + randomAt(11637, i * 7 + 1) * 5,
}));
const cellColor = (h, e) => rgb[Math.floor(randomAt(11637, h * 4 + e * 97 + 2) * rgb.length)];
function paintBackground(g, t) {
  for (const c of cells) {
    const h = c.row * cols + c.col,
      u = (t + c.ph) / c.interval,
      ep = Math.floor(u),
      fr = ease(u - ep);
    const a = cellColor(h, ep - 1),
      b = cellColor(h, ep);
    const r = Math.round(mix(a[0], b[0], fr)),
      gc = Math.round(mix(a[1], b[1], fr)),
      bl = Math.round(mix(a[2], b[2], fr));
    g.fillStyle = `rgb(${r},${gc},${bl})`;
    g.fillRect(c.col * SG, c.row * SG, SG + 1, SG + 1);
  }
}

// ---- foreground: noise-walked thread-blobs, one continuous smooth stroke standing in for the
// source's own thousand overlapping filled circles along the same kind of drifting noise path ----
const BG = 170,
  PW = W + 2 * BG,
  PH = H + 2 * BG,
  N = 48,
  PTS = 300,
  STEP = 0.065;
const cache = new Map();
// One thread's recipe for one "epoch": a pure function of (thread, epoch), so any frame's picture
// is reproducible from time alone. Two independent 1D noise walks give the path's x and y; colour
// is either a single grey value or a single palette tone, chosen once for the whole thread, as in
// the source's own fifty-fifty `random([random(255), random(cp)])`.
function walk(sx, sy, mxr) {
  const pts = [];
  for (let j = 0; j < PTS; j++) {
    const u = j * STEP;
    pts.push([vn(sx, u) * mxr, vn(sy, u + 50) * mxr]);
  }
  return pts;
}
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11638, key * 30 + k);
  const mxr = BG * (0.35 + r(0) * 0.65),
    sx = Math.floor(r(1) * 1e6),
    sy = Math.floor(r(2) * 1e6);
  const gray = r(3) < 0.5,
    tone = gray ? Math.round(r(4) * 255) : 0,
    colIdx = gray ? 0 : Math.floor(r(5) * cp.length);
  // Three overlapping strands (independent seeds, slightly different amplitude) stand in for the
  // source's own thousand overlapping filled circles building up one ribbon's apparent thickness.
  const strands = [
    walk(sx, sy, mxr),
    walk(sx + 37, sy + 41, mxr * 0.82),
    walk(sx + 83, sy + 97, mxr * 0.93),
  ];
  const c = { mxr, gray, tone, colIdx, strands };
  if (cache.size > 3000) cache.clear();
  cache.set(key, c);
  return c;
}
function strokeStrand(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let j = 1; j < pts.length; j++) {
    const p0 = pts[j - 1],
      p1 = pts[j],
      mx = (p0[0] + p1[0]) / 2,
      my = (p0[1] + p1[1]) / 2;
    g.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  g.stroke();
}
function thread(g, c, k, lw) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.strokeStyle = c.gray ? `rgb(${c.tone},${c.tone},${c.tone})` : cp[c.colIdx];
  g.lineWidth = lw;
  for (const pts of c.strands) strokeStrand(g, pts);
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11639, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 7 + Fr(i, 3) * 7,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.03 + Fr(i, 8) * 0.05),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) {
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    paintBackground(g, t);
    g.restore();
  }
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - BG;
    const x = lap(f.x + 4 * f.k * t, PW) + 12 * Math.sin(t * 0.17 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 3 * f.k * t, PH) + 12 * Math.cos(t * 0.14 + f.ph);
    if (x < -BG || x > W + BG || y < -BG || y > H + BG) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.5 * m.fast.high) * (1 + s.motion * 0.2);
    const scale = e.scale * (1 + 0.05 * Math.sin(t * 0.4 + f.ph) + 0.05 * m.slow.bass);
    const lw = Math.max(0.7, (S / 280) * (1 + 0.8 * m.impulse * s.impulse));
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    thread(g, conf(i, ep - 1), 1 - ease(fr / 0.16), lw);
    thread(g, conf(i, ep), ease(fr / 0.3), lw);
    g.restore();
  }
  g.restore();
  return s;
}
