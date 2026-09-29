// Hybrid of Scene BE ("Overlay Bundles", mine, prototype-55) and Scene BY
// (Codex, prototype-75, 45 rotating quadrant tiles) for segment 6. BE's
// three populations (130 blend-mode line bundles, 14 overlay loop curves,
// 152 checker cells) and BY's 45 tiles are merged into one array, tagged
// and depth-sorted together every frame, drawn in a single shared loop;
// each bundle/loop item sets and restores its own blend mode so mixing
// with BY's plain source-over tiles stays correct regardless of draw order.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-55/states.js';

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
const smooth = (q) => q * q * (3 - 2 * q);
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}

// ---- BE's own populations ----
const beS = 540,
  beM = 220,
  bePW = W + 2 * beM,
  bePH = H + 2 * beM;
const BUNDLES = 130,
  COPIES = 9,
  LOOPS = 14,
  PTS = 110,
  FG = beS / 8,
  COLS = 19,
  ROWS = 8,
  CELLS = COLS * ROWS;
const beCp = [
  '#046CD2',
  '#F1C701',
  '#F30174',
  '#F77CCA',
  '#D16C07',
  '#337F33',
  '#7076DF',
  '#C7B7CA',
  '#18181A',
  '#63282F',
];
const beCache = new Map();
function bundleConf(i, e) {
  const key = i * 512 + e + 64,
    hit = beCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11563, key * 24 + k);
  const len = beS / 2 + (r(0) * beS) / 2,
    c = {
      rot: r(1) * TAU,
      len,
      g: len / 10,
      col: Math.floor(r(2) * 10),
      alpha: 0.14 + r(3) * 0.28,
      sy: Math.floor(r(4) * 1e9),
      flow: 0.35 + r(5) * 0.6,
      copies: Array.from({ length: COPIES }, (_, k) => ({
        o: (k - (COPIES - 1) / 2) / COPIES,
        ph: r(10 + k) * 40,
        w: 0.6 + r(11 + k) * 1,
      })),
    };
  if (beCache.size > 6000) beCache.clear();
  beCache.set(key, c);
  return c;
}
function loopConf(i, e) {
  const key = (i + 9000) * 512 + e + 64,
    hit = beCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11564, key * 8 + k);
  const c = {
    sx: Math.floor(r(0) * 1e9),
    sy: Math.floor(r(1) * 1e9),
    white: r(2) < 0.5,
    speed: 0.15 + r(3) * 0.3,
    cx: r(4) * W,
    cy: r(5) * H,
  };
  if (beCache.size > 6000) beCache.clear();
  beCache.set(key, c);
  return c;
}
const beFr = (i, k) => randomAt(11565, i * 61 + k);
const bundleField = Array.from({ length: BUNDLES }, (_, i) => ({
  x: beFr(i, 0) * bePW,
  y: beFr(i, 1) * bePH,
  k: 0.5 + beFr(i, 2) * 0.8,
  life: 6 + beFr(i, 3) * 6,
  off: beFr(i, 4),
  ph: beFr(i, 5) * TAU,
}));
const cellBase = Array.from({ length: CELLS }, (_, i) => ({
  col: i % COLS,
  row: Math.floor(i / COLS),
  ph: beFr(i + 20000, 0) * TAU,
  white: beFr(i + 20000, 1) < 0.5,
}));
function bundle(g, c, x, y, k, t, m, ph) {
  if (k <= 0.004) return;
  const rgbHex = beCp[c.col],
    n = parseInt(rgbHex.slice(1), 16),
    rC = n >> 16,
    gC = (n >> 8) & 255,
    bC = n & 255;
  g.save();
  g.globalCompositeOperation = 'hard-light';
  g.translate(x, y);
  g.rotate(c.rot);
  const len = c.len * k,
    gw = c.g * k,
    pts = [];
  for (let j = 0; j < PTS; j++) {
    const u = j / (PTS - 1),
      lx = (u - 0.5) * len;
    pts.push([lx, vn(c.sy, u * 3 + t * c.flow + 0.001 * ph) * gw * 3.4 * (1 + 0.4 * m.slow.mid)]);
  }
  for (const cp2 of c.copies) {
    g.strokeStyle = `rgba(${rC},${gC},${bC},${c.alpha * (1 + 0.5 * m.fast.rms) * (1 - Math.abs(cp2.o) * 0.6)})`;
    g.lineWidth = Math.max(1, gw * cp2.w * 0.5 * k);
    g.beginPath();
    for (let j = 0; j < pts.length; j++) {
      const off = cp2.o * gw * 2 + 2 * vn(c.sy + 7, pts[j][0] * 0.02 + cp2.ph + t * 0.2);
      const px = pts[j][0],
        py = pts[j][1] + off;
      if (j === 0) g.moveTo(px, py);
      else {
        const pp = pts[j - 1],
          poff = cp2.o * gw * 2 + 2 * vn(c.sy + 7, pp[0] * 0.02 + cp2.ph + t * 0.2);
        g.quadraticCurveTo(pp[0], pp[1] + poff, (px + pp[0]) / 2, (py + pp[1] + poff) / 2);
      }
    }
    g.stroke();
  }
  g.restore();
}
function beLoop(g, c, t, m, ph, e) {
  g.save();
  g.globalCompositeOperation = 'overlay';
  g.translate(e.dx * 0.3, e.dy * 0.3);
  g.scale(e.scale, e.scale);
  g.strokeStyle = c.white ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.7)';
  g.lineWidth = 1 + m.fast.centroid * 0.8;
  g.beginPath();
  for (let j = 0; j < PTS; j++) {
    const u = (j / (PTS - 1)) * 4 + t * c.speed;
    const px = c.cx + vn(c.sx, u) * W * 1.15,
      py = c.cy + vn(c.sy, u + 50) * H * 1.15;
    j === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
  g.restore();
}

// ---- BY's own population (45 fixed quadrant tiles) ----
const byR = (i, k) => randomAt(91975, i * 157 + k),
  CELL = 108;
const byTiles = Array.from({ length: 45 }, (_, id) => ({
  id,
  x: (id % 9) * CELL + 48,
  y: Math.floor(id / 9) * CELL + 54,
  phase: byR(id, 0) * TAU,
  black: byR(id, 1) < 0.36,
  count: byR(id, 2) > 0.5 ? 10 : 20,
  kind: Math.floor(byR(id, 3) * 3),
  orientation: Math.floor(byR(id, 4) * 4),
  radius: 18 + byR(id, 5) * 33,
}));
function byTurn(t, c) {
  const q = (t + c.phase) / (9 + byR(c.id, 6) * 8),
    cycle = Math.floor(q),
    fraction = q - cycle;
  const u = Math.max(0, Math.min(1, (fraction - 0.72) / 0.28)),
    ez = u * u * u * (u * (u * 6 - 15) + 10);
  return ((c.orientation + cycle + ez) * Math.PI) / 2;
}
function byTile(g, c, t, m, s, e) {
  g.save();
  g.translate(c.x + e.dx, c.y + e.dy);
  g.scale(e.scale, e.scale);
  g.beginPath();
  g.rect(-54, -54, 108, 108);
  g.clip();
  g.fillStyle = c.black ? '#000000' : '#ffffff';
  g.fillRect(-54, -54, 108, 108);
  g.save();
  g.rotate(byTurn(t, c) + 0.025 * Math.sin(t * 0.53 + c.phase) * (1 + s.motion));
  const step = CELL / c.count;
  const flow = step * 0.38 * Math.sin(t * 0.81 + c.phase) * (1 + m.slow.mid * 0.5);
  for (let j = -2; j < c.count + 2; j++) {
    const center = -54 + (j + 0.5) * step + flow,
      ph = c.phase + j * 0.63;
    const tilt = step * (0.25 * Math.sin(t * 0.61 + ph) + 0.24 * (byR(c.id, j + 30) - 0.5));
    const breathing = 1 + 0.1 * Math.sin(t * 0.73 + ph) + m.slow.bass * 0.09;
    let left = -78,
      right = 78;
    if (c.kind === 1) {
      const length = 27 + 7 * Math.sin(t * 0.67 + c.phase) + m.impulse * s.impulse * 5;
      left = -length;
      right = length;
    }
    if (c.kind === 2) {
      left = -60;
      right =
        -43 + ((j + 0.5) / c.count) * 103 + 9 * Math.sin(t * 0.71 + ph) + m.impulse * s.impulse * 7;
    }
    const half = step * 0.53 * breathing;
    g.fillStyle = (((j + c.id) % 2) + 2) % 2 ? '#000000' : '#ffffff';
    g.beginPath();
    g.moveTo(left, center - half - tilt);
    g.lineTo(right, center - half + tilt);
    g.lineTo(right, center + half + tilt);
    g.lineTo(left, center + half - tilt);
    g.closePath();
    g.fill();
  }
  g.restore();
  const radius = c.radius * (1 + 0.075 * Math.sin(t * 0.57 + c.phase) + m.slow.bass * 0.055);
  const margin = Math.max(0, 53 - radius);
  const x = margin * 0.75 * Math.sin(t * 0.37 + c.phase),
    y = margin * 0.75 * Math.cos(t * 0.43 + c.phase);
  const weight = 2.15 + m.fast.rms * 0.45;
  const count = Math.round((TAU * c.radius) / 5.1),
    phase = t * (0.19 + 0.05 * s.motion) + c.phase + m.slow.mid * 0.13;
  g.strokeStyle = c.black ? '#ffffff' : '#000000';
  g.lineWidth = weight;
  g.lineCap = 'butt';
  for (let k = 0; k < count; k++) {
    const a = phase + (k / count) * TAU,
      span = 1.55 / radius;
    g.beginPath();
    g.arc(x, y, radius, a, a + span);
    g.stroke();
  }
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  g.save();

  const pool = [];
  for (let i = 0; i < BUNDLES; i++) {
    const f = bundleField[i],
      e = introFor(i, intro, 400);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - beM;
    const x = lap(f.x + 9 * f.k * t, bePW) + 18 * Math.sin(t * 0.29 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 6 * f.k * t, bePH) + 18 * Math.cos(t * 0.24 + f.ph);
    if (x < -beS || x > W + beS || y < -beS || y > H + beS) continue;
    pool.push({ kind: 'bundle', i, f, e, x, y, depth: (beFr(i, 900) - 0.5) * 240 });
  }
  for (let i = 0; i < LOOPS; i++) {
    const e = introFor(BUNDLES + i, intro, 400);
    if (!e.active) continue;
    pool.push({ kind: 'loop', i, e, depth: (randomAt(11564, (i + 9000) * 8 + 900) - 0.5) * 240 });
  }
  for (let i = 0; i < CELLS; i++) {
    const e = introFor(BUNDLES + LOOPS + i, intro, 380);
    if (!e.active) continue;
    pool.push({ kind: 'cell', i, e, depth: (beFr(i + 20000, 900) - 0.5) * 240 });
  }
  for (const c of byTiles) {
    const e = introFor(200 + c.id, intro, 370);
    if (!e.active) continue;
    pool.push({ kind: 'tile', c, e, depth: (byR(c.id, 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'bundle') {
      const { i, f, e, x, y } = item,
        u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      bundle(
        g,
        bundleConf(i, ep - 1),
        x + e.dx,
        y + e.dy,
        (1 - ease(fr / 0.16)) * e.scale,
        t,
        m,
        f.ph,
      );
      bundle(g, bundleConf(i, ep), x + e.dx, y + e.dy, ease(fr / 0.3) * e.scale, t, m, f.ph);
    } else if (item.kind === 'loop') {
      const { i, e } = item,
        c = loopConf(i, Math.floor((t + i * 3.7) / 9));
      beLoop(g, c, t, mBase, i, e);
    } else if (item.kind === 'cell') {
      const { i, e } = item,
        b = cellBase[i];
      const shift = FG * Math.sin(t * 0.15 + b.row * 1.3) * 0.8;
      const x = (b.col - 2) * FG + FG / 2 + shift,
        y = b.row * FG + FG / 2;
      const clock = Math.floor((t + b.ph) * 1.1),
        on = randomAt(11566, i * 7 + clock) < 0.5;
      if (!on) continue;
      const alpha = (0.12 + 0.4 * randomAt(11566, i * 7 + clock + 3)) * (1 + 0.3 * mBase.fast.high);
      g.save();
      g.globalAlpha = Math.min(1, alpha) * e.scale;
      g.fillStyle = b.white ? '#ffffff' : '#000000';
      g.fillRect(x - FG / 2 + e.dx, y - FG / 2 + e.dy, FG, FG);
      g.restore();
    } else {
      const { c, e } = item,
        m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.16) : quiet;
      byTile(g, c, t, m, s, e);
    }
  }
  g.restore();
  return s;
}
