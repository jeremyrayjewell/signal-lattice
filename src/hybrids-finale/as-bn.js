// Finale hybrid of Scene AS ("Spoke Wheels", segment 3) and Scene BN ("Spiral Dust", segment 4).
// AS's 18 fixed radial-spoke wheel panels and BN's 200 wrapped-field cached spiral sprites are
// merged into one array, tagged and depth-sorted together every frame, drawn in a single shared
// loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateAS } from '../prototype-43/states.js';
import { stateAt as stateBN } from '../prototype-64/states.js';

const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
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
const smooth = (q) => q * q * (3 - 2 * q);
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}

// ---- Scene AS's own population ----
const asR = (id, k) => randomAt(70943, id * 367 + k);
const asCells = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: asR(id, 0) * TAU,
  spokes: asR(id, 1) > 0.5 ? 52 : 29,
  filled: asR(id, 2) > 0.5,
  radius: 65 + asR(id, 3) * 8,
  sides: 6 + Math.floor(asR(id, 4) * 4),
  direction: asR(id, 5) > 0.5 ? 1 : -1,
}));
function asLine(g, x1, y1, x2, y2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
function asPolar(r, a) {
  return [r * Math.cos(a), r * Math.sin(a)];
}
function asCap(g, r, a, width) {
  const [x, y] = asPolar(r, a),
    dx = -Math.sin(a) * width,
    dy = Math.cos(a) * width;
  asLine(g, x - dx, y - dy, x + dx, y + dy);
}
function drawASCell(g, c, t, s, m, entry) {
  g.save();
  g.translate(
    c.x + entry.dx + 3 * Math.sin(t * 0.5 + c.phase),
    c.y + entry.dy + 3 * Math.cos(t * 0.6 + c.phase),
  );
  g.scale(entry.scale, entry.scale);
  g.rotate(
    c.phase +
      c.direction * t * (0.17 + asR(c.id, 6) * 0.14) +
      0.12 * m.slow.mid * Math.sin(t * 0.7 + c.phase),
  );
  g.strokeStyle = '#060606';
  g.lineWidth = 1.25 + 0.3 * m.fast.centroid;
  for (let j = 0; j < c.spokes; j++) {
    const a = (j / c.spokes) * TAU;
    const traveling = Math.sin(a * 3 - t * 1.3 + c.phase);
    const inner =
      c.radius * (0.58 + 0.085 * Math.sin(a * 2 + t * 0.71 + c.phase) + 0.035 * m.slow.bass);
    const outer =
      c.radius * (0.89 + asR(c.id, j + 30) * 0.13 + 0.06 * traveling + 0.04 * m.residue);
    const disturbance = m.impulse * s.impulse * 5 * Math.sin(a * 2 + c.phase);
    const tip = outer + disturbance,
      start = inner + 3 * m.fast.high * Math.sin(j * 1.7 + t * 2);
    const [x1, y1] = asPolar(start, a),
      [x2, y2] = asPolar(tip, a + 0.012 * Math.sin(t + a * 4));
    asLine(g, x1, y1, x2, y2);
    if (asR(c.id, j + 100) > 0.46) asCap(g, start, a, 2.1 + asR(c.id, j + 170) * 2.2);
    if (asR(c.id, j + 230) > 0.52) asCap(g, tip, a, 2.2 + asR(c.id, j + 290) * 2.1);
  }
  g.save();
  g.rotate(-c.direction * t * 0.12 + 0.15 * Math.sin(t * 0.63 + c.phase));
  g.beginPath();
  for (let j = 0; j < c.sides; j++) {
    const a = (j / c.sides) * TAU;
    const radius =
      c.radius *
      (0.42 +
        asR(c.id, j + 340) * 0.07 +
        0.035 * Math.sin(t * 0.82 + a * 2 + c.phase) +
        m.slow.bass * 0.025);
    const [x, y] = asPolar(radius, a);
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
      ph = asR(seed, 360) * TAU;
    const reach = c.radius * (0.65 + asR(seed, 361) * 0.6);
    const a = ph + t * (asR(seed, 362) - 0.5) * 0.45;
    const center =
      (asR(seed, 363) - 0.5) * c.radius * 0.6 + 8 * Math.sin(t * 0.9 + ph) * (1 + 0.3 * m.slow.mid);
    const dx = Math.cos(a) * reach,
      dy = Math.sin(a) * reach;
    g.strokeStyle = j % 3 === 0 ? '#ffffff' : '#070707';
    g.lineWidth = j % 3 === 0 ? 1.9 : 1.25;
    asLine(g, -dx, center - dy, dx, center + dy);
  }
  g.restore();
}

// ---- Scene BN's own population ----
const bnS = 540,
  bnM = bnS / 4,
  bnPW = W + 2 * bnM,
  bnPH = H + 2 * bnM;
const bnAG = 3.6,
  bnTURNS = 22,
  bnSTEPS = bnTURNS * 100;
const BUILD = 0.32,
  CB = 148,
  HC = CB / 2,
  bnCache = new Map();
function bnBuildSpiral(i, e) {
  const key = i * 512 + e + 64,
    hit = bnCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11596, key * 20 + k);
  const mr = bnS / 4 + (r(0) * bnS) / 4,
    mxr = 1 + r(1) * (mr / 30 - 1),
    strokeMode = r(2) < 0.5,
    tone = Math.round(r(3) * 220);
  const rSeed = Math.floor(r(4) * 1e6),
    aSeed = Math.floor(r(5) * 1e6),
    rn0 = r(6) * 40,
    an0 = r(7) * 40;
  const canvas = document.createElement('canvas');
  canvas.width = CB;
  canvas.height = CB;
  const g = canvas.getContext('2d');
  g.fillStyle = `rgb(${tone},${tone},${tone})`;
  g.strokeStyle = `rgb(${tone},${tone},${tone})`;
  g.translate(HC, HC);
  g.scale(BUILD, BUILD);
  for (let k = 0; k <= bnSTEPS; k++) {
    const q = k / bnSTEPS,
      a = k * bnAG * DEG,
      wr = mix(mr, 0, q),
      rr = mix(mxr, 0, q);
    const sr = (vn(rSeed, rn0 + k * 0.1) * mr) / 4,
      ada = vn(aSeed, an0 + k * 0.1) * bnAG * 2 * DEG;
    const rad = wr / 2 + sr,
      x = Math.cos(a + ada) * rad,
      y = Math.sin(a + ada) * rad;
    if (strokeMode) {
      g.lineWidth = Math.max(0.3, rr / 10 / BUILD);
      g.strokeRect(x - rr / 2, y - rr / 2, rr, rr);
    } else g.fillRect(x - rr / 2, y - rr / 2, rr, rr);
  }
  if (bnCache.size > 4000) bnCache.clear();
  bnCache.set(key, canvas);
  return canvas;
}
const bnFr = (i, k) => randomAt(11597, i * 61 + k);
const bnField = Array.from({ length: 200 }, (_, i) => ({
  x: bnFr(i, 0) * bnPW,
  y: bnFr(i, 1) * bnPH,
  k: 0.5 + bnFr(i, 2) * 0.8,
  life: 6 + bnFr(i, 3) * 5,
  off: bnFr(i, 4),
  ph: bnFr(i, 5) * TAU,
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sAS = stateAS(elapsed),
    sBN = stateBN(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineCap = 'butt';
  g.lineJoin = 'miter';

  const pool = [];
  asCells.forEach((c) => {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) return;
    pool.push({ kind: 'cell', c, entry, depth: (asR(c.id, 900) - 0.5) * 240 });
  });
  bnField.forEach((f, i) => {
    const entry = introFor(i + 9000, intro, 420);
    if (!entry.active) return;
    const lap = (v, P) => (((v % P) + P) % P) - bnM;
    const x = lap(f.x + 9 * f.k * t, bnPW) + 16 * Math.sin(t * 0.28 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 7 * f.k * t, bnPH) + 16 * Math.cos(t * 0.24 + f.ph);
    if (x < -bnS / 2 || x > W + bnS / 2 || y < -bnS / 2 || y > H + bnS / 2) return;
    pool.push({ kind: 'spiral', i, f, entry, x, y, depth: (bnFr(i, 900) - 0.5) * 240 });
  });
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'cell') {
      const m = reactive ? controls.at(t - 0.025 - (item.c.x / 960) * 0.2) : quiet;
      drawASCell(g, item.c, t, sAS, m, item.entry);
    } else {
      const m = reactive ? controls.at(t - 0.03 - (item.x / W) * 0.16) : quiet;
      const P = item.f.life,
        off = item.f.off * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const rot = t * 0.03 * (1 + 0.3 * m.slow.mid) * (item.i % 2 ? 1 : -1),
        pulse = 1 + 0.06 * Math.sin(t * 0.6 + item.f.ph) + 0.08 * m.slow.bass;
      g.save();
      g.translate(item.x + item.entry.dx, item.y + item.entry.dy);
      g.rotate(rot);
      g.scale((item.entry.scale * pulse) / BUILD, (item.entry.scale * pulse) / BUILD);
      const alpha = 0.65 + 0.3 * m.fast.high;
      const drawE = (ep2, k) => {
        if (k <= 0.004) return;
        g.globalAlpha = alpha * k;
        g.drawImage(bnBuildSpiral(item.i, ep2), -HC, -HC);
      };
      drawE(ep - 1, 1 - ease(fr / 0.16));
      drawE(ep, ease(fr / 0.3));
      g.globalAlpha = 1;
      g.restore();
    }
  }
  g.restore();
  return sBN;
}
