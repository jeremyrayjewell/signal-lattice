// Hybrid of Scene BF ("Circle Mosaic", mine, prototype-56) and Scene BZ
// ("Ink Blots + Noise Clouds", mine, prototype-76) for segment 6. BF's
// drifting grid of buffer-painted mosaic cells and BZ's two wrapped-field
// populations (ink blots, noise clouds) are merged into one array, tagged
// and depth-sorted together every frame, drawn in a single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-56/states.js';

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

// ---- BF's own population (drifting mosaic grid) ----
const bfS = 540,
  bfG = bfS / 5,
  CB = Math.ceil(bfG + 32);
const bfCp = ['#F75137', '#22BA8A', '#F2D15D', '#DA8648', '#560554', '#103E7C', '#E5C7A5'];
const bfCache = new Map();
function bfSubPass(r, base) {
  const v = [1, 2, 4][Math.floor(r(base) * 3)],
    sg = bfG / v;
  return {
    v,
    sg,
    cells: Array.from({ length: v * v }, (_, k) => {
      const i = k % v,
        j = Math.floor(k / v),
        x = (i - (v - 1) / 2) * sg,
        y = (j - (v - 1) / 2) * sg,
        b = base + 2 + k * 3;
      return { x, y, col: Math.floor(r(b) * 7) };
    }),
  };
}
function bfConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bfCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11567, key * 300 + k);
  const a = bfSubPass(r, 0),
    b = bfSubPass(r, 60),
    cpass = bfSubPass(r, 120);
  const dotsPer = Math.max(6, Math.round(60 / (cpass.v * cpass.v)));
  const cells = cpass.cells.map((c, k) => {
    const b0 = 180 + k * 40,
      er = cpass.sg * (0.5 + r(b0) * 0.5),
      round = r(b0 + 1) < 0.5;
    return {
      ...c,
      er,
      round,
      rot: r(b0 + 2) * TAU,
      ox: (r(b0 + 3) * 2 - 1) * (cpass.sg / 2 - er / 2),
      oy: (r(b0 + 4) * 2 - 1) * (cpass.sg / 2 - er / 2),
      mode: r(b0 + 5) < 0.5,
      tone: r(b0 + 6),
      dots: Array.from({ length: dotsPer }, (_, d) => {
        const db = b0 + 10 + d * 4;
        return {
          a: r(db) * TAU,
          rad: Math.sqrt(r(db + 1)),
          size: 1 + r(db + 2) * 3.5,
          alpha: r(db + 3) * 0.7,
          white: r(db + 3) < 0.5,
        };
      }),
    };
  });
  const c = { a, b, cpass: { ...cpass, cells } };
  if (bfCache.size > 8000) bfCache.clear();
  bfCache.set(key, c);
  return c;
}
const bfRawBuf = document.createElement('canvas');
bfRawBuf.width = CB;
bfRawBuf.height = CB;
const bfCellBuf = document.createElement('canvas');
bfCellBuf.width = CB;
bfCellBuf.height = CB;
function bfPaintCell(conf, t, m, blurPx, jitterGain) {
  const half = CB / 2,
    rg = bfRawBuf.getContext('2d');
  rg.setTransform(1, 0, 0, 1, 0, 0);
  rg.fillStyle = '#ffffff';
  rg.fillRect(0, 0, CB, CB);
  for (const c of conf.a.cells) {
    rg.fillStyle = bfCp[c.col];
    rg.beginPath();
    const R =
      (conf.a.sg / 2) *
      (1 +
        0.22 * Math.sin(t * 1.8 + c.x * 0.02 + c.y * 0.02) +
        0.16 * m.slow.bass +
        0.08 * m.impulse);
    rg.arc(half + c.x, half + c.y, R, 0, TAU);
    rg.fill();
  }
  const cg = bfCellBuf.getContext('2d');
  cg.setTransform(1, 0, 0, 1, 0, 0);
  cg.clearRect(0, 0, CB, CB);
  cg.save();
  cg.filter = `blur(${blurPx}px)`;
  cg.drawImage(bfRawBuf, 0, 0);
  cg.restore();
  cg.globalCompositeOperation = 'overlay';
  for (const c of conf.b.cells) {
    cg.fillStyle = bfCp[c.col];
    cg.beginPath();
    const R =
      (conf.b.sg / 2) *
      (1 +
        0.26 * Math.sin(t * 2.1 + c.x * 0.03 - c.y * 0.02 + 7) +
        0.16 * m.slow.mid +
        0.07 * m.fast.rms);
    cg.arc(half + c.x, half + c.y, R, 0, TAU);
    cg.fill();
  }
  for (const c of conf.cpass.cells) {
    const wob = conf.cpass.sg * 0.12 * (1 + 0.4 * m.fast.high);
    cg.save();
    cg.translate(
      half + c.x + c.ox + wob * Math.sin(t * 0.7 + c.x * 0.05),
      half + c.y + c.oy + wob * Math.cos(t * 0.6 + c.y * 0.05),
    );
    cg.rotate(c.rot + t * (1.1 + m.impulse * 1.4) + 0.4 * Math.sin(t * 1.3 + c.x));
    const tone = Math.round(c.tone * 255),
      er = c.er * (1 + 0.08 * m.fast.high);
    if (c.mode) {
      cg.strokeStyle = `rgb(${tone},${tone},${tone})`;
      cg.lineWidth = Math.max(0.6, er / 40);
      cg.beginPath();
      cg.roundRect(-er / 2, -er / 2, er, er, c.round ? er / 2 : 0);
      cg.stroke();
    } else {
      cg.fillStyle = `rgb(${tone},${tone},${tone})`;
      cg.beginPath();
      cg.roundRect(-er / 2, -er / 2, er, er, c.round ? er / 2 : 0);
      cg.fill();
    }
    cg.restore();
    for (const d of c.dots) {
      const ang = d.a + t * 0.6 * (d.white ? 1 : -1),
        rad = ((d.rad * conf.cpass.sg) / 2) * jitterGain * (1 + 0.15 * Math.sin(t * 1.4 + d.a * 3));
      const px = half + c.x + Math.cos(ang) * rad,
        py = half + c.y + Math.sin(ang) * rad;
      cg.globalAlpha = Math.min(
        1,
        d.alpha * (1 + 0.5 * m.fast.rms) * (0.7 + 0.3 * Math.sin(t * 2 + d.a * 5)),
      );
      cg.fillStyle = d.white ? '#ffffff' : '#000000';
      cg.beginPath();
      cg.arc(px, py, d.size, 0, TAU);
      cg.fill();
    }
  }
  cg.globalAlpha = 1;
  cg.globalCompositeOperation = 'source-over';
}

// ---- BZ's own populations (ink blots + noise clouds) ----
const bzS = 540,
  bzM = bzS / 3,
  bzPW = W + 2 * bzM,
  bzPH = H + 2 * bzM,
  N1 = 110,
  N2 = 110;
const BLD = 0.34,
  BB = 160,
  inkCache = new Map();
function buildInk(i, e) {
  const key = i * 512 + e + 64,
    hit = inkCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11622, key * 40 + k);
  const rr = bzS / 4 + (r(0) * bzS) / 4,
    tone = r(1) < 0.5 ? '#000000' : '#ffffff',
    seedY = Math.floor(r(2) * 1e6),
    rot = (Math.floor(r(3) * 4) * Math.PI) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = BB;
  canvas.height = BB;
  const g = canvas.getContext('2d');
  g.translate(BB / 2, BB / 2);
  g.rotate(rot);
  g.scale(BLD, BLD);
  g.fillStyle = tone;
  g.globalAlpha = 0.16;
  const lines = 30,
    cols = 14;
  for (let li = 0; li < lines; li++) {
    const cy = (li / (lines - 1)) * rr - rr / 2;
    g.beginPath();
    for (let ci = 0; ci <= cols; ci++) {
      const cx = (ci / cols) * rr - rr / 2,
        ady = vn(seedY, ci * 1.3 + li * 0.31) * rr * 0.42;
      const px = cx,
        py = cy + ady;
      ci === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.lineWidth = rr / 28;
    g.strokeStyle = tone;
    g.stroke();
  }
  g.globalAlpha = 1;
  if (inkCache.size > 4000) inkCache.clear();
  inkCache.set(key, { canvas, rr });
  return { canvas, rr };
}
const cloudCache = new Map();
function buildCloud(i, e) {
  const key = i * 512 + e + 64,
    hit = cloudCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11623, key * 260 + k);
  const mr = bzS / 2 + (r(0) * bzS) / 2,
    tone = r(1) < 0.5 ? '#000000' : '#ffffff',
    sign = r(2) < 0.5 ? -1 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = BB;
  canvas.height = BB;
  const g = canvas.getContext('2d');
  g.translate(BB / 2, BB / 2);
  g.scale(BLD, BLD);
  g.fillStyle = tone;
  for (let k = 0; k < 260; k++) {
    const b = 10 + k * 4;
    const a = r(b) * TAU,
      cr = sign + r(b + 1) * r(b + 2) * r(b + 3),
      radius = Math.abs((mr / 4) * cr),
      pr = (0.6 + r(b + 3) * 1.4) * (mr / 240);
    g.globalAlpha = r(b + 2);
    g.fillRect(Math.cos(a) * radius - pr / 2, Math.sin(a) * radius - pr / 2, pr, pr);
  }
  g.globalAlpha = 1;
  if (cloudCache.size > 4000) cloudCache.clear();
  cloudCache.set(key, { canvas, mr });
  return { canvas, mr };
}
const bzFr = (i, k) => randomAt(11624, i * 61 + k);
const inkField = Array.from({ length: N1 }, (_, i) => ({
  x: bzFr(i, 0) * bzPW,
  y: bzFr(i, 1) * bzPH,
  k: 0.5 + bzFr(i, 2) * 0.8,
  life: 5 + bzFr(i, 3) * 5,
  off: bzFr(i, 4),
  ph: bzFr(i, 5) * TAU,
}));
const cloudField = Array.from({ length: N2 }, (_, i) => ({
  x: bzFr(i + 9000, 0) * bzPW,
  y: bzFr(i + 9000, 1) * bzPH,
  k: 0.5 + bzFr(i + 9000, 2) * 0.8,
  life: 6 + bzFr(i + 9000, 3) * 5,
  off: bzFr(i + 9000, 4),
  ph: bzFr(i + 9000, 5) * TAU,
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#dcdcdc');
  const ox = -(t * 9 + 16 * Math.sin(t * 0.11) * (0.5 + 0.5 * s.motion)),
    oy = t * 6 + 12 * Math.sin(t * 0.09 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / bfG) - 1,
    c1 = Math.ceil((W - ox) / bfG),
    r0 = Math.floor(-oy / bfG) - 1,
    r1 = Math.ceil((H - oy) / bfG);
  const blurPx = Math.max(1, (bfG / 6) * (1 - 0.3 * (reactive ? controls.at(t) : quiet).fast.high));
  g.save();

  const pool = [];
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000;
      const e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * bfG + bfG / 2 + ox,
        y = row * bfG + bfG / 2 + oy;
      pool.push({ kind: 'cell', h, x, y, e, depth: (randomAt(11568, h * 4 + 900) - 0.5) * 240 });
    }
  for (let i = 0; i < N1; i++) {
    const f = inkField[i],
      e = introFor(600 + i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - bzM;
    const x = lap(f.x + 6 * f.k * t, bzPW) + 16 * Math.sin(t * 0.25 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, bzPH) + 16 * Math.cos(t * 0.21 + f.ph);
    if (x < -bzS / 2 || x > W + bzS / 2 || y < -bzS / 2 || y > H + bzS / 2) continue;
    pool.push({ kind: 'ink', i, f, e, x, y, depth: (bzFr(i, 900) - 0.5) * 240 });
  }
  for (let i = 0; i < N2; i++) {
    const f = cloudField[i],
      e = introFor(3600 + i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - bzM;
    const x = lap(f.x - 5 * f.k * t, bzPW) + 16 * Math.sin(t * 0.23 * (0.6 + f.k) + f.ph + 2),
      y = lap(f.y + 6 * f.k * t, bzPH) + 16 * Math.cos(t * 0.27 + f.ph + 2);
    if (x < -bzS || x > W + bzS || y < -bzS || y > H + bzS) continue;
    pool.push({ kind: 'cloud', i, f, e, x, y, depth: (bzFr(i + 9000, 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'cell') {
      const { h, x, y, e } = item;
      const P = 3 + randomAt(11568, h * 4 + 1) * 3.5,
        off = randomAt(11568, h * 4 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const jitterGain = 1 + 0.3 * m.fast.high;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-bfG / 2, -bfG / 2, bfG, bfG);
      }
      g.save();
      g.beginPath();
      g.rect(-bfG / 2, -bfG / 2, bfG, bfG);
      g.clip();
      bfPaintCell(bfConf(h, ep - 1), t, m, blurPx, jitterGain);
      g.globalAlpha = 1 - ease(fr / 0.16);
      g.drawImage(bfCellBuf, -CB / 2, -CB / 2);
      bfPaintCell(bfConf(h, ep), t, m, blurPx, jitterGain);
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(bfCellBuf, -CB / 2, -CB / 2);
      g.globalAlpha = 1;
      g.restore();
      g.restore();
    } else if (item.kind === 'ink') {
      const { i, f, e, x, y } = item,
        u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const { canvas, rr } = buildInk(i, ep),
        full = rr / BLD;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(
        e.scale * (1 + 0.05 * Math.sin(t * 0.6 + f.ph) + 0.05 * m.slow.bass),
        e.scale * (1 + 0.05 * Math.sin(t * 0.6 + f.ph) + 0.05 * m.slow.bass),
      );
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(canvas, -full / 2, -full / 2, full, full);
      g.globalAlpha = 1;
      g.restore();
    } else {
      const { i, f, e, x, y } = item,
        u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const { canvas, mr } = buildCloud(i, ep),
        full = mr / BLD;
      g.save();
      g.globalCompositeOperation = 'overlay';
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale * (1 + 0.06 * m.fast.high), e.scale * (1 + 0.06 * m.fast.high));
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(canvas, -full / 2, -full / 2, full, full);
      g.globalAlpha = 1;
      g.restore();
    }
  }
  g.restore();
  return s;
}
