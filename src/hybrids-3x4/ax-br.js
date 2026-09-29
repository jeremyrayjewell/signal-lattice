// Hybrid of Scene AX (prototype-48, "Chromatic Refractions", revised by
// Claude toward dailycoding 20260115) and Scene BR (prototype-68, "Wireframe
// Tangle") for segment 6. AX's 52 crystal-shard tiles and 46 outline echoes,
// and BR's 140 wireframe-sphere bundles and its difference-blended square
// grid, are merged into one array, tagged and depth-sorted together every
// frame, drawn in a single shared loop. AX's fine 60x34 pixel field -- too
// dense and texture-like to meaningfully interleave as individual elements
// -- is kept as its own background layer, drawn first exactly as AX renders it.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-48/states.js';

const TAU = Math.PI * 2,
  HALF = Math.PI / 2,
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

// ---- AX's own population ----
const AX_R = (id, k) => randomAt(11548, id * 211 + k);
const tiles = [
  '#FF2A2A',
  '#FFB000',
  '#FFE81A',
  '#5AF03C',
  '#20D8FF',
  '#3060FF',
  '#F030E8',
  '#A040F0',
  '#FFFFFF',
];
const palette = ['#E13646', '#88B13B', '#F4A02C', '#F7D323', '#149EC5', '#964797', '#FFFFFF'];
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const axPick = (v) => [1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 0][Math.floor(v * 11)];
const axGroups = Array.from({ length: 52 }, (_, id) => {
  const strat = id < 35,
    gx = id % 7,
    gy = Math.floor(id / 7);
  return {
    id,
    x: strat ? (gx + AX_R(id, 0) * 1.1 - 0.05) * (1040 / 7) - 40 : AX_R(id, 0) * 1040 - 40,
    y: strat ? (gy + AX_R(id, 1) * 1.1 - 0.05) * (620 / 5) - 40 : AX_R(id, 1) * 620 - 40,
    size: 100 + AX_R(id, 2) * 85,
    phase: AX_R(id, 3) * TAU,
    color: axPick(AX_R(id, 4)),
    color2: axPick(AX_R(id, 5)),
    white: AX_R(id, 6) < 0.26,
    jag: AX_R(id, 7) < 0.68,
    petal: AX_R(id, 8) < 0.24 ? 8 : Math.floor(AX_R(id, 9) * 8),
  };
});
const AXS = 256,
  AXC = AXS / 2,
  AXH = 92,
  AXK = 34,
  axBodies = new Map(),
  axPetals = new Map();
const squircle = (a) => {
  const c = Math.abs(Math.cos(a)),
    s = Math.abs(Math.sin(a));
  return 1 / Math.pow(Math.pow(c, 20) + Math.pow(s, 20), 1 / 20);
};
const fold = (a) => {
  const q = Math.floor(a / HALF),
    b = a - q * HALF;
  return q % 2 ? HALF - b : b;
};
function axNoise(c, v, b, k, jag) {
  const f1 = 5 + AX_R(c.id, 30 + v) * 9,
    f2 = (jag ? 46 : 8) + AX_R(c.id, 40 + v) * 30;
  return (
    Math.sin(b * f1 + k * 0.21 + c.phase + v * 2.3) * 0.45 +
    Math.sin(b * f2 + k * (jag ? 0.34 : 0.12) + v * 5.1) * 0.55
  );
}
function axBodyStamp(c) {
  if (axBodies.has(c.id)) return axBodies.get(c.id);
  const canvas = document.createElement('canvas');
  canvas.width = AXS;
  canvas.height = AXS;
  const g = canvas.getContext('2d');
  const edge = c.white ? '#FFFFFF' : tiles[c.color],
    core = tiles[c.color2];
  const grad = g.createRadialGradient(AXC, AXC, 0, AXC, AXC, AXH * 1.32);
  grad.addColorStop(0, rgba(core, c.white ? 0.34 : 0.1));
  grad.addColorStop(0.42, rgba(edge, c.white ? 0.5 : 0.3));
  grad.addColorStop(0.82, rgba(edge, c.white ? 0.9 : 0.78));
  grad.addColorStop(1, rgba(edge, c.white ? 0.95 : 0.86));
  g.fillStyle = grad;
  g.beginPath();
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * TAU,
      b = fold(a),
      r = AXH * squircle(a) * (1 + 0.022 * axNoise(c, 9, b, 0, false));
    i
      ? g.lineTo(AXC + Math.cos(a) * r, AXC + Math.sin(a) * r)
      : g.moveTo(AXC + Math.cos(a) * r, AXC + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  axBodies.set(c.id, canvas);
  return canvas;
}
function axPetalStamp(c, v) {
  const key = c.id * 2 + v;
  if (axPetals.has(key)) return axPetals.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = AXS;
  canvas.height = AXS;
  const g = canvas.getContext('2d');
  g.strokeStyle = c.white
    ? rgba(tiles[c.petal === 8 ? c.color2 : c.petal], 0.16)
    : rgba(tiles[c.petal], c.petal === 8 ? 0.1 : 0.14);
  g.lineWidth = 3.2;
  g.lineJoin = 'round';
  const jag = c.jag || (v === 1 && c.id % 3 === 0);
  for (let k = 0; k < AXK; k++) {
    const f = 0.22 + 0.82 * (k / (AXK - 1)),
      amp = jag ? 0.3 : 0.06;
    g.beginPath();
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * TAU,
        b = fold(a),
        r = f * AXH * squircle(a) * (1 + amp * axNoise(c, v, b, k, jag));
      i
        ? g.lineTo(AXC + Math.cos(a) * r, AXC + Math.sin(a) * r)
        : g.moveTo(AXC + Math.cos(a) * r, AXC + Math.sin(a) * r);
    }
    g.closePath();
    g.stroke();
  }
  axPetals.set(key, canvas);
  return canvas;
}
function axShard(g, c, t, m, e) {
  const size =
    ((c.size * 256) / (2 * 92)) * (1 + 0.1 * Math.sin(t * 0.68 + c.phase) + m.slow.bass * 0.1);
  const w =
      0.5 + 0.5 * Math.sin(t * (0.4 + AX_R(c.id, 12) * 0.4) + c.phase * 1.7) + m.fast.high * 0.25,
    wm = Math.min(1, w);
  g.save();
  g.scale(e.scale, e.scale);
  g.transform(
    1,
    0.025 * Math.sin(t * 0.51 + c.phase),
    0.035 * Math.cos(t * 0.47 + c.phase),
    1,
    0,
    0,
  );
  g.globalCompositeOperation = 'hard-light';
  g.globalAlpha = 0.78 + 0.16 * Math.sin(t * 0.57 + c.phase) + m.fast.rms * 0.1;
  g.drawImage(axBodyStamp(c), -size / 2, -size / 2, size, size);
  const gain = 1 + m.fast.rms * 0.5 + m.impulse * 0.25;
  g.globalAlpha = Math.min(1, (1 - wm) * gain);
  g.drawImage(axPetalStamp(c, 0), -size / 2, -size / 2, size, size);
  g.globalAlpha = Math.min(1, wm * gain);
  g.drawImage(axPetalStamp(c, 1), -size / 2, -size / 2, size, size);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.restore();
}

// ---- BR's own population ----
const S = 540,
  M = S / 3,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 140,
  G = S / 5;
const cp = ['#316C9C', '#CBC743', '#DB5745', '#46134F', '#371B22'];
const sphereCache = new Map();
function brConf(i, e) {
  const key = i * 512 + e + 64,
    hit = sphereCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11607, key * 70 + k);
  const v = [8, 12, 24][Math.floor(r(0) * 3)],
    col = cp[Math.floor(r(1) * 5)];
  const rings = Array.from({ length: v }, (_, k) => {
    const b = 10 + k * 3;
    return { ecc: 0.15 + r(b) * 0.85, rot: r(b + 1) * TAU, ph: r(b + 2) * TAU };
  });
  const c = { v, col, rings, R: (S / 3) * (0.55 + r(2) * 0.55) };
  if (sphereCache.size > 8000) sphereCache.clear();
  sphereCache.set(key, c);
  return c;
}
function brSphere(g, c, k, t, m, ph) {
  if (k <= 0.004) return;
  g.globalAlpha = 0.55 * k + 0.15 * m.fast.rms;
  g.strokeStyle = c.col;
  g.lineWidth = Math.max(0.4, (c.R / 80) * (1 + 0.3 * m.fast.centroid));
  const R = c.R * k * (1 + 0.05 * Math.sin(t * 0.6 + ph) + 0.06 * m.slow.bass);
  for (const rg of c.rings) {
    g.save();
    g.rotate(rg.rot + t * 0.02 * (1 + 0.3 * m.slow.mid) + ph * 0.1);
    g.beginPath();
    g.ellipse(0, 0, R, R * rg.ecc, 0, 0, TAU);
    g.stroke();
    g.restore();
  }
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11608, i * 61 + k);
const sphereField = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 5,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
const sqCache = new Map();
function sqConf(h, e) {
  const key = h * 512 + e + 64,
    hit = sqCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11609, key * 20 + k);
  const v = [1, 2, 4][Math.floor(r(0) * 3)],
    sg = G / v,
    cells = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 5 + (i * v + j) * 2;
      if (r(b) < 0.5) cells.push({ x: -G / 2 + sg / 2 + i * sg, y: -G / 2 + sg / 2 + j * sg });
    }
  const c = { sg, cells };
  if (sqCache.size > 8000) sqCache.clear();
  sqCache.set(key, c);
  return c;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  g.save();
  // AX's fine pixel field: a texture-like background, kept as its own pass.
  for (let row = 0; row < 34; row++) {
    g.fillStyle = palette[Math.floor(AX_R(row, 160) * 7)];
    const offset = 6 * Math.sin(t * 0.42 + row * 0.23) * (1 + s.motion * 0.4);
    for (let col = 0; col < 60; col++) {
      const id = row * 60 + col;
      if (AX_R(id, 161) > 0.5) continue;
      const e = introFor(id + 400, intro, 320);
      if (!e.active) continue;
      const size = AX_R(id, 162) > 0.5 ? 16 : 8;
      g.globalAlpha = Math.min(
        1,
        (0.18 + 0.82 * AX_R(id, 163)) * (0.6 + 0.4 * Math.sin(t * 0.9 + col * 0.17 - row * 0.24)) +
          0.14 * mBase.fast.high,
      );
      g.fillRect(
        col * 16 + offset + e.dx,
        row * 16 + 3 * Math.sin(t * 0.38 + col * 0.08) + e.dy,
        size,
        size,
      );
    }
  }
  g.globalAlpha = 1;

  const pool = [];
  for (const c of axGroups) {
    const e = introFor(c.id, intro, 350);
    if (!e.active) continue;
    const local = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.16) : quiet;
    const x = c.x + 25 * Math.sin(t * 0.41 + c.phase) * (1 + s.motion * 0.45),
      y = c.y + 22 * Math.cos(t * 0.37 + c.phase);
    pool.push({
      kind: 'shard',
      c,
      e,
      x,
      y,
      local,
      depth: (AX_R(c.id, 900) - 0.5) * 240 + 18 * Math.sin(t * 0.21 + c.phase),
    });
  }
  for (let id = 0; id < 46; id++) {
    const e = introFor(id + 200, intro, 380);
    if (!e.active) continue;
    pool.push({ kind: 'echo', id, e, depth: (AX_R(id, 901) - 0.5) * 240 });
  }
  for (let i = 0; i < N; i++) {
    const f = sphereField[i],
      e = introFor(2000 + i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 7 * f.k * t, PW) + 16 * Math.sin(t * 0.27 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 5 * f.k * t, PH) + 16 * Math.cos(t * 0.23 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    pool.push({
      kind: 'sphere',
      f,
      i,
      e,
      x,
      y,
      depth: (Fr(i, 900) - 0.5) * 240 + 18 * Math.sin(t * 0.19 + f.ph),
    });
  }
  const cols = Math.ceil(W / G) + 1,
    rows = Math.ceil(H / G) + 1;
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 8192 + row,
        e = introFor(3000 + (((col % 12) + 12) % 12) * 8 + (((row % 7) + 7) % 7), intro, 360);
      if (!e.active) continue;
      pool.push({ kind: 'sq', h, e, depth: (randomAt(11610, h * 4 + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'shard') {
      const { c, e, x, y, local } = item;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      axShard(g, c, t, local, e);
      g.restore();
    } else if (item.kind === 'echo') {
      const { id, e } = item;
      const phase = AX_R(id, 100) * TAU,
        size = 90 + AX_R(id, 101) * 220;
      const x = AX_R(id, 102) * 1080 - 60 + 23 * Math.sin(t * 0.33 + phase),
        y = AX_R(id, 103) * 660 - 60 + 22 * Math.cos(t * 0.39 + phase);
      const round = AX_R(id, 104) > 0.5;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.strokeStyle = palette[Math.floor(AX_R(id, 105) * 7)];
      g.lineWidth = 0.85 + mBase.fast.centroid * 0.3;
      for (let echo = 0; echo < 10; echo++) {
        const ph = phase + echo * 0.71;
        const ox =
          (2 + echo * 0.9) *
          Math.sin(t * (0.51 + echo * 0.013) + ph) *
          (1 + mBase.impulse * s.impulse * 0.35);
        const oy = (2 + echo * 0.9) * Math.cos(t * 0.59 + ph);
        const width = size * (1 + 0.035 * Math.sin(t * 0.83 + ph) + mBase.slow.bass * 0.035);
        g.globalAlpha = 0.16 + AX_R(id, echo + 110) * 0.45;
        g.beginPath();
        g.roundRect(-width / 2 + ox, -width / 2 + oy, width, width, round ? width / 2 : 0);
        g.stroke();
      }
      g.restore();
    } else if (item.kind === 'sphere') {
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
      brSphere(g, brConf(i, ep - 1), 1 - ease(fr / 0.16), t, m, f.ph);
      brSphere(g, brConf(i, ep), ease(fr / 0.3), t, m, f.ph);
      g.restore();
    } else {
      const { h, e } = item,
        col = Math.floor(h / 8192),
        row = h % 8192;
      const x = col * G + G / 2,
        y = row * G + G / 2,
        P = 5 + randomAt(11610, h * 4 + 1) * 4,
        off = randomAt(11610, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const cf = sqConf(h, ep);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.globalCompositeOperation = 'difference';
      g.fillStyle = '#ffffff';
      g.globalAlpha = ease(fr / 0.3);
      for (const c2 of cf.cells) g.fillRect(c2.x - cf.sg / 2, c2.y - cf.sg / 2, cf.sg, cf.sg);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.restore();
    }
  }
  g.restore();
  return s;
}
