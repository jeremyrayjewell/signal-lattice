// Finale hybrid of Scene AG ("Notebook Pages", segment 2) and Scene BZ ("Ink Wash Noise",
// segment 4). AG's 28 sketchbook pages and BZ's 110 ink blots + 110 noise clouds are merged into
// one array, tagged and depth-sorted together every frame, drawn in a single shared loop. AG's own
// paper-texture background is kept as its own background pass.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateAG } from '../prototype-31/states.js';
import { stateAt as stateBZ } from '../prototype-76/states.js';
import { drawPaperBackground } from '../prototype-31/paper-background.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  bzS = 540,
  bzM = bzS / 3,
  bzPW = W + 2 * bzM,
  bzPH = H + 2 * bzM;
const silent = {
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

// ---- Scene AG's own population ----
const agRand = (id, k) => randomAt(82131, id * 211 + k);
const agInk = ['#ff006e', '#04df12', '#00cfed', '#2824ff', '#ff6500', '#d900ff', '#e4d000'];
const agPages = Array.from({ length: 28 }, (_, id) => ({
  id,
  x: id < 20 ? agRand(id, 1) * 1080 - 60 : 105 + ((id - 20) % 4) * 250 + (agRand(id, 1) - 0.5) * 55,
  y:
    id < 20
      ? agRand(id, 2) * 650 - 55
      : 125 + Math.floor((id - 20) / 4) * 285 + (agRand(id, 2) - 0.5) * 60,
  size: id < 20 ? 85 + agRand(id, 3) * 95 : 175 + agRand(id, 3) * 85,
  phase: agRand(id, 4) * TAU,
  flip: agRand(id, 5) < 0.5 ? -1 : 1,
  grid: agRand(id, 6) > 0.52,
  color: agInk[Math.floor(agRand(id, 7) * agInk.length)],
  strokes: 5 + Math.floor(agRand(id, 8) * 5),
}));
function agPaper(g, h) {
  g.beginPath();
  g.rect(-h, -h, h * 2, h * 2);
}
function agNoteSpin(id, t) {
  const period = 18 + agRand(id, 80) * 14,
    phase = t + agRand(id, 81) * period;
  const cycle = Math.floor(phase / period),
    local = phase - cycle * period;
  if (agRand(id, 82 + cycle) > 0.48) return 0;
  const duration = 1.7 + agRand(id, 83) * 0.8;
  if (local >= duration) return 0;
  const u = local / duration,
    ease2 = u * u * u * (u * (u * 6 - 15) + 10);
  return (agRand(id, 84) < 0.5 ? -1 : 1) * TAU * ease2;
}
function agGesture(g, c, k, t, m, s) {
  const seed = c.id * 13 + k,
    phase = agRand(seed, 30) * TAU,
    speed = 0.22 + agRand(seed, 31) * 0.33;
  const drift = t * speed + phase,
    extent = c.size * (0.22 + agRand(seed, 32) * 0.2),
    turns = 1.3 + agRand(seed, 33) * 3.8,
    bend = 0.15 * m.slow.mid * s.motion;
  const points = [];
  for (let j = 0; j <= 220; j++) {
    const u = j / 220,
      a = u * TAU * turns;
    const x =
      extent *
      (0.62 * Math.sin(a + drift) +
        0.26 * Math.sin(a * 2.31 - drift * 0.8) +
        0.12 * Math.cos(a * 5.1 + phase));
    const y =
      extent *
      (0.65 * Math.sin(a * 1.37 + phase + drift * 0.71) +
        (0.22 + bend) * Math.cos(a * 3.13 - drift));
    const pulse = m.impulse * s.impulse * Math.sin(u * 7 - drift) * c.size * 0.024;
    points.push([x, y + pulse]);
  }
  const pencils = ['#ac466d', '#4d8150', '#4496a0', '#655aa1', '#b37a48', '#925c9e', '#98904b'];
  g.save();
  g.strokeStyle = k % 3 !== 1 ? '#44413f' : pencils[Math.floor(agRand(seed, 34) * pencils.length)];
  for (let pass = 0; pass < 2; pass++)
    for (let start = 0; start < 220; start += 20) {
      const pressure = 0.5 + 0.5 * Math.sin(start * 0.049 + phase + pass * 0.8 + t * 0.17);
      g.globalAlpha = (pass === 0 ? 0.42 : 0.22) + pressure * 0.2;
      g.lineWidth = (0.4 + pressure * 0.55) * (c.size / 210) * (1 + 0.12 * m.fast.rms);
      g.beginPath();
      for (let j = start; j <= start + 20; j++) {
        const [x, y] = points[j],
          grain = (agRand(seed, j + 100) - 0.5) * 0.5;
        const px = x + grain + pass * 0.65 * Math.sin(j * 0.13 + phase),
          py = y + grain + pass * 0.65 * Math.cos(j * 0.17 + phase);
        if (j === start) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
  g.restore();
}
function drawAGPage(g, c, t, s, m, entry) {
  const h = c.size / 2,
    step = c.size / 13;
  const x = c.x + 15 * Math.sin(t * 0.26 + c.phase) + m.slow.bass * 7 * Math.sin(c.phase);
  const y = c.y + 18 * Math.cos(t * 0.31 + c.phase) + m.impulse * s.impulse * 4 * Math.sin(c.id);
  g.save();
  g.translate(x + entry.dx, y + entry.dy);
  g.scale(entry.scale * c.flip, entry.scale);
  g.rotate(0.018 * Math.sin(t * 0.38 + c.phase) * (1 + s.motion) + agNoteSpin(c.id, t));
  g.save();
  g.shadowColor = 'rgba(0,0,0,.85)';
  g.shadowBlur = 8;
  g.shadowOffsetY = 3;
  agPaper(g, h);
  g.fillStyle = '#ffffff';
  g.fill();
  g.restore();
  g.save();
  agPaper(g, h);
  g.clip();
  g.strokeStyle = c.color;
  g.lineWidth = 0.75 + 0.25 * m.fast.centroid;
  g.beginPath();
  const ruledOffset = Math.sin(t * 0.4 + c.phase) * 1.6;
  for (let q = -h + step; q < h - step / 2; q += step) {
    g.moveTo(-h + 6, q + ruledOffset);
    g.lineTo(h - step, q + ruledOffset);
    if (c.grid) {
      g.moveTo(q, -h + 4);
      g.lineTo(q, h - 4);
    }
  }
  g.stroke();
  for (let k = 0; k < c.strokes; k++) agGesture(g, c, k, t, m, s);
  for (let k = 0; k < 14; k++) {
    const seed = c.id * 19 + k,
      ph = agRand(seed, 51) * TAU;
    const px = (agRand(seed, 52) - 0.5) * c.size * 0.83 + 5 * Math.sin(t * 0.7 + ph),
      py = (agRand(seed, 53) - 0.5) * c.size * 0.83 + 6 * Math.cos(t * 0.57 + ph);
    const radius =
      c.size * (0.008 + agRand(seed, 54) * 0.031) * (1 + 0.24 * m.residue + 0.12 * m.fast.high);
    g.beginPath();
    for (let j = 0; j <= 24; j++) {
      const a = (j / 24) * TAU,
        rr = radius * (1 + 0.15 * Math.sin(a * 3 + ph + t * 0.8)),
        xx = px + rr * Math.cos(a),
        yy = py + rr * Math.sin(a);
      if (!j) g.moveTo(xx, yy);
      else g.lineTo(xx, yy);
    }
    g.closePath();
    g.fillStyle = g.strokeStyle = agInk[Math.floor(agRand(seed, 55) * agInk.length)];
    g.lineWidth = 1.2 + agRand(seed, 56) * 1.6;
    if (k % 2) g.stroke();
    else g.fill();
  }
  g.restore();
  g.restore();
}

// ---- Scene BZ's own populations ----
const BLD = 0.34,
  BB = 160,
  bzInkCache = new Map();
function bzBuildInk(i, e) {
  const key = i * 512 + e + 64,
    hit = bzInkCache.get(key);
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
      ci === 0 ? g.moveTo(cx, cy + ady) : g.lineTo(cx, cy + ady);
    }
    g.lineWidth = rr / 28;
    g.strokeStyle = tone;
    g.stroke();
  }
  g.globalAlpha = 1;
  if (bzInkCache.size > 4000) bzInkCache.clear();
  bzInkCache.set(key, { canvas, rr });
  return { canvas, rr };
}
const bzCloudCache = new Map();
function bzBuildCloud(i, e) {
  const key = i * 512 + e + 64,
    hit = bzCloudCache.get(key);
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
  if (bzCloudCache.size > 4000) bzCloudCache.clear();
  bzCloudCache.set(key, { canvas, mr });
  return { canvas, mr };
}
const bzFr = (i, k) => randomAt(11624, i * 61 + k);
const bzInkField = Array.from({ length: 110 }, (_, i) => ({
  x: bzFr(i, 0) * bzPW,
  y: bzFr(i, 1) * bzPH,
  k: 0.5 + bzFr(i, 2) * 0.8,
  life: 5 + bzFr(i, 3) * 5,
  off: bzFr(i, 4),
  ph: bzFr(i, 5) * TAU,
}));
const bzCloudField = Array.from({ length: 110 }, (_, i) => ({
  x: bzFr(i + 9000, 0) * bzPW,
  y: bzFr(i + 9000, 1) * bzPH,
  k: 0.5 + bzFr(i + 9000, 2) * 0.8,
  life: 6 + bzFr(i + 9000, 3) * 5,
  off: bzFr(i + 9000, 4),
  ph: bzFr(i + 9000, 5) * TAU,
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sAG = stateAG(elapsed),
    sBZ = stateBZ(elapsed),
    g = p.drawingContext;
  if (intro >= 1) drawPaperBackground(g, t);
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';

  const pool = [];
  agPages.forEach((c) => {
    const entry = introFor(c.id, intro, 400);
    if (!entry.active) return;
    pool.push({ kind: 'page', c, entry, depth: (agRand(c.id, 900) - 0.5) * 240 });
  });
  bzInkField.forEach((f, i) => {
    const entry = introFor(i + 7000, intro, 420);
    if (!entry.active) return;
    const lap = (v, P) => (((v % P) + P) % P) - bzM;
    const x = lap(f.x + 6 * f.k * t, bzPW) + 16 * Math.sin(t * 0.25 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, bzPH) + 16 * Math.cos(t * 0.21 + f.ph);
    if (x < -bzS / 2 || x > W + bzS / 2 || y < -bzS / 2 || y > H + bzS / 2) return;
    pool.push({ kind: 'ink', i, f, entry, x, y, depth: (bzFr(i, 900) - 0.5) * 240 });
  });
  bzCloudField.forEach((f, i) => {
    const entry = introFor(i + 8000, intro, 420);
    if (!entry.active) return;
    const lap = (v, P) => (((v % P) + P) % P) - bzM;
    const x = lap(f.x - 5 * f.k * t, bzPW) + 16 * Math.sin(t * 0.23 * (0.6 + f.k) + f.ph + 2),
      y = lap(f.y + 6 * f.k * t, bzPH) + 16 * Math.cos(t * 0.27 + f.ph + 2);
    if (x < -bzS || x > W + bzS || y < -bzS || y > H + bzS) return;
    pool.push({ kind: 'cloud', i, f, entry, x, y, depth: (bzFr(i + 9000, 900) - 0.5) * 240 });
  });
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'page') {
      const c = item.c,
        m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.2) : silent;
      drawAGPage(g, c, t, sAG, m, item.entry);
    } else if (item.kind === 'ink') {
      const m = reactive ? controls.at(t - 0.03 - (item.x / W) * 0.16) : silent;
      const P = item.f.life,
        off = item.f.off * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const { canvas, rr } = bzBuildInk(item.i, ep),
        full = rr / BLD;
      g.save();
      g.translate(item.x + item.entry.dx, item.y + item.entry.dy);
      const sc = item.entry.scale * (1 + 0.05 * Math.sin(t * 0.6 + item.f.ph) + 0.05 * m.slow.bass);
      g.scale(sc, sc);
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(canvas, -full / 2, -full / 2, full, full);
      g.globalAlpha = 1;
      g.restore();
    } else {
      const m = reactive ? controls.at(t - 0.03 - (item.x / W) * 0.16) : silent;
      const P = item.f.life,
        off = item.f.off * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const { canvas, mr } = bzBuildCloud(item.i, ep),
        full = mr / BLD;
      g.save();
      g.globalCompositeOperation = 'overlay';
      g.translate(item.x + item.entry.dx, item.y + item.entry.dy);
      const sc = item.entry.scale * (1 + 0.06 * m.fast.high);
      g.scale(sc, sc);
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(canvas, -full / 2, -full / 2, full, full);
      g.globalAlpha = 1;
      g.restore();
    }
  }
  g.restore();
  return sBZ;
}
