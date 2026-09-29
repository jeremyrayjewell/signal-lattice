import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 300,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 42,
  DOTS = 90,
  LEAVES = 26,
  VPTS = 260,
  VEINS = 8;
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
function hsb2rgb(h, s, br, a = 100) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  br = Math.max(0, Math.min(100, br)) / 100;
  const c = br * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = br - c;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `rgba(${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)},${a / 100})`;
}

// One cluster's recipe for one "epoch": a pure function of (cluster, epoch), so any frame's
// picture is reproducible from time alone. A cluster is three layers sharing one local origin: a
// scatter of small brown dots over a disc (uniform-disc sampling, the source's own sqrt(random())
// radius factor), a thin vine stem traced by a tightly-coiled noise walk, and a handful of pointed
// leaves -- the source's own filled-bezier leaf outline plus a centre vein and side-vein herringbone
// -- attached at points along that vine.
const cache = new Map();
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11644, key * 900 + k);
  const pmr = S / 4 + r(0) * (S / 2 - S / 4);
  const dots = Array.from({ length: DOTS }, (_, k) => {
    const b = 10 + k * 4;
    const a = r(b) * TAU,
      sq = Math.sqrt(r(b + 1)),
      pr = 1 + r(b + 2) * 4;
    return {
      x: (pmr / 2) * sq * Math.cos(a),
      y: (pmr / 2) * sq * Math.sin(a),
      pr,
      bright: r(b + 3) * 60,
    };
  });
  const sx = Math.floor(r(400) * 1e6),
    sy = Math.floor(r(401) * 1e6),
    vineAmp = S * 0.3 + r(402) * S * 0.14;
  const mhue = 30 + r(403) * 120,
    z = 4 + r(404) * 26;
  const vine = [];
  for (let j = 0; j < VPTS; j++) {
    const u = j * 0.055;
    vine.push([vn(sx, u) * vineAmp, vn(sy, u + 50) * vineAmp]);
  }
  const leaves = Array.from({ length: LEAVES }, (_, k) => {
    const b = 1000 + k * 70;
    const t0 = r(b) * 0.94,
      idx = Math.min(VPTS - 2, Math.floor(t0 * (VPTS - 1))),
      fr = t0 * (VPTS - 1) - idx;
    const px = mix(vine[idx][0], vine[idx + 1][0], fr),
      py = mix(vine[idx][1], vine[idx + 1][1], fr);
    const rot = r(b + 1) * TAU,
      hr = (3 + r(b + 2) * 13) * (1 + r(b + 3) * 5);
    const bc1x = r(b + 4) * hr,
      bc1y = -hr / 2 + r(b + 5) * (hr / 4),
      bc2x = r(b + 6) * hr,
      bc2y = hr / 4 + r(b + 7) * (hr / 4);
    const hhue = mhue + (r(b + 8) * 2 - 1) * z,
      hlig = 20 + r(b + 9) * 60,
      halp = 60 + r(b + 10) * 40;
    const veins = Array.from({ length: VEINS }, (_, v) => {
      const bb = b + 20 + v * 4;
      return {
        uf1: 0.667 + r(bb) * 0.333,
        uf2: 0.667 + r(bb + 1) * 0.333,
        alphaU: 10 + r(bb + 2) * 90,
        alphaD: 10 + r(bb + 3) * 90,
      };
    });
    return {
      px,
      py,
      rot,
      hr,
      bc1x,
      bc1y,
      bc2x,
      bc2y,
      hhue,
      hlig,
      halp,
      veins,
      phase: r(b + 65) * TAU,
      rate: 0.3 + r(b + 66) * 0.5,
    };
  });
  const c = { pmr, dots, mhue, vine, leaves };
  if (cache.size > 800) cache.clear();
  cache.set(key, c);
  return c;
}
function drawLeaf(g, lf, t, sway, punch) {
  g.save();
  g.translate(lf.px, lf.py);
  g.rotate(lf.rot + sway * Math.sin(t * lf.rate + lf.phase));
  const hr = lf.hr;
  g.fillStyle = hsb2rgb(lf.hhue, 100, lf.hlig, lf.halp);
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(0, 0, lf.bc1x, lf.bc1y, hr, 0);
  g.bezierCurveTo(hr, 0, lf.bc2x, lf.bc2y, 0, 0);
  g.closePath();
  g.fill();
  const veinTone = Math.max(0, lf.hlig - 20);
  g.lineWidth = Math.max(0.3, (hr / 60) * (1 + 0.5 * punch));
  g.strokeStyle = hsb2rgb(lf.hhue, 100, veinTone, 100);
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(hr / 1.15, 0);
  g.stroke();
  const step = hr / (VEINS + 1);
  for (let vi = 0; vi < VEINS; vi++) {
    const v = lf.veins[vi],
      lx = (vi + 1) * step;
    const ly = lx < hr / 2 ? (lx / (hr / 2)) * (hr / 8) : ((hr - lx) / (hr / 2)) * (hr / 8);
    g.strokeStyle = hsb2rgb(lf.hhue, 100, veinTone, v.alphaU);
    g.beginPath();
    g.moveTo(lx, 0);
    g.lineTo(lx - step, ly * v.uf1);
    g.stroke();
    g.strokeStyle = hsb2rgb(lf.hhue, 100, veinTone, v.alphaD);
    g.beginPath();
    g.moveTo(lx, 0);
    g.lineTo(lx - step, -ly * v.uf2);
    g.stroke();
  }
  g.restore();
}
function cluster(g, c, t, k, sway, punch) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (const d of c.dots) {
    g.fillStyle = hsb2rgb(25, 40, d.bright);
    g.beginPath();
    g.arc(d.x, d.y, d.pr / 2, 0, TAU);
    g.fill();
  }
  g.strokeStyle = hsb2rgb(c.mhue, 60, 22);
  g.lineWidth = Math.max(0.5, 1.4 * (1 + 0.4 * punch));
  g.beginPath();
  g.moveTo(c.vine[0][0], c.vine[0][1]);
  for (let j = 1; j < c.vine.length; j++) {
    const p0 = c.vine[j - 1],
      p1 = c.vine[j],
      mx = (p0[0] + p1[0]) / 2,
      my = (p0[1] + p1[1]) / 2;
    g.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  g.lineTo(c.vine[c.vine.length - 1][0], c.vine[c.vine.length - 1][1]);
  g.stroke();
  for (const lf of c.leaves) drawLeaf(g, lf, t, sway, punch);
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11645, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 10 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.015 + Fr(i, 8) * 0.025),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 3 * f.k * t, PW) + 10 * Math.sin(t * 0.13 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 2 * f.k * t, PH) + 10 * Math.cos(t * 0.11 + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.4 * m.fast.high) * (1 + s.motion * 0.15);
    const scale = e.scale * (1 + 0.04 * Math.sin(t * 0.3 + f.ph) + 0.05 * m.slow.bass);
    const sway = 0.12 + 0.15 * m.fast.high,
      punch = m.impulse * s.impulse;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    cluster(g, conf(i, ep - 1), t, 1 - ease(fr / 0.16), sway, punch);
    cluster(g, conf(i, ep), t, ease(fr / 0.3), sway, punch);
    g.restore();
  }
  g.restore();
  return s;
}
