import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  HALF = Math.PI / 2,
  R = (id, k) => randomAt(11548, id * 211 + k);
// Tiles are tuned for hard-light over black: channels sit near 0 or 1 so overlaps stay vivid.
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
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const pick = (v) => [1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 0][Math.floor(v * 11)];
const groups = Array.from({ length: 52 }, (_, id) => {
  // Stratified start (8 x 5) plus a scattered remainder keeps black gaps while covering the frame.
  const strat = id < 35,
    gx = id % 7,
    gy = Math.floor(id / 7);
  return {
    id,
    x: strat ? (gx + R(id, 0) * 1.1 - 0.05) * (1040 / 7) - 40 : R(id, 0) * 1040 - 40,
    y: strat ? (gy + R(id, 1) * 1.1 - 0.05) * (620 / 5) - 40 : R(id, 1) * 620 - 40,
    size: 100 + R(id, 2) * 85,
    phase: R(id, 3) * TAU,
    color: pick(R(id, 4)),
    color2: pick(R(id, 5)),
    white: R(id, 6) < 0.26,
    jag: R(id, 7) < 0.68,
    petal: R(id, 8) < 0.24 ? 8 : Math.floor(R(id, 9) * 8),
  };
});
const S = 256,
  C = S / 2,
  H = 92,
  K = 34,
  bodies = new Map(),
  petals = new Map();
// Squarish superellipse radius: hard straight tile edges with slightly cut corners.
const squircle = (a) => {
  const c = Math.abs(Math.cos(a)),
    s = Math.abs(Math.sin(a));
  return 1 / Math.pow(Math.pow(c, 20) + Math.pow(s, 20), 1 / 20);
};
// Angles fold into one quadrant so every shape is a four-way mirror of itself.
const fold = (a) => {
  const q = Math.floor(a / HALF),
    b = a - q * HALF;
  return q % 2 ? HALF - b : b;
};
function noise(c, v, b, k, jag) {
  const f1 = 5 + R(c.id, 30 + v) * 9,
    f2 = (jag ? 46 : 8) + R(c.id, 40 + v) * 30;
  return (
    Math.sin(b * f1 + k * 0.21 + c.phase + v * 2.3) * 0.45 +
    Math.sin(b * f2 + k * (jag ? 0.34 : 0.12) + v * 5.1) * 0.55
  );
}
function bodyStamp(c) {
  if (bodies.has(c.id)) return bodies.get(c.id);
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext('2d');
  const edge = c.white ? '#FFFFFF' : tiles[c.color],
    core = tiles[c.color2];
  const grad = g.createRadialGradient(C, C, 0, C, C, H * 1.32);
  grad.addColorStop(0, rgba(core, c.white ? 0.34 : 0.1));
  grad.addColorStop(0.42, rgba(edge, c.white ? 0.5 : 0.3));
  grad.addColorStop(0.82, rgba(edge, c.white ? 0.9 : 0.78));
  grad.addColorStop(1, rgba(edge, c.white ? 0.95 : 0.86));
  g.fillStyle = grad;
  g.beginPath();
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * TAU,
      b = fold(a),
      r = H * squircle(a) * (1 + 0.022 * noise(c, 9, b, 0, false));
    i
      ? g.lineTo(C + Math.cos(a) * r, C + Math.sin(a) * r)
      : g.moveTo(C + Math.cos(a) * r, C + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  bodies.set(c.id, canvas);
  return canvas;
}
// Petals are a stack of low-alpha concentric squircles whose outlines are jagged; the
// accumulated overlap reads as soft rays that thin toward the tile edge.
function petalStamp(c, v) {
  const key = c.id * 2 + v;
  if (petals.has(key)) return petals.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const g = canvas.getContext('2d');
  g.strokeStyle = c.white
    ? rgba(tiles[c.petal === 8 ? c.color2 : c.petal], 0.16)
    : rgba(tiles[c.petal], c.petal === 8 ? 0.1 : 0.14);
  g.lineWidth = 3.2;
  g.lineJoin = 'round';
  const jag = c.jag || (v === 1 && c.id % 3 === 0);
  for (let k = 0; k < K; k++) {
    const f = 0.22 + 0.82 * (k / (K - 1)),
      amp = jag ? 0.3 : 0.06;
    g.beginPath();
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * TAU,
        b = fold(a),
        r = f * H * squircle(a) * (1 + amp * noise(c, v, b, k, jag));
      i
        ? g.lineTo(C + Math.cos(a) * r, C + Math.sin(a) * r)
        : g.moveTo(C + Math.cos(a) * r, C + Math.sin(a) * r);
    }
    g.closePath();
    g.stroke();
  }
  petals.set(key, canvas);
  return canvas;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  g.save();
  // Fine pixel field: 60 x 34 cells, half of them lit at full or half cell size, row-colored.
  for (let row = 0; row < 34; row++) {
    g.fillStyle = palette[Math.floor(R(row, 160) * 7)];
    const offset = 6 * Math.sin(t * 0.42 + row * 0.23) * (1 + s.motion * 0.4);
    for (let col = 0; col < 60; col++) {
      const id = row * 60 + col;
      if (R(id, 161) > 0.5) continue;
      const e = introFor(id + 400, intro, 320);
      if (!e.active) continue;
      const size = R(id, 162) > 0.5 ? 16 : 8;
      g.globalAlpha = Math.min(
        1,
        (0.18 + 0.82 * R(id, 163)) * (0.6 + 0.4 * Math.sin(t * 0.9 + col * 0.17 - row * 0.24)) +
          0.14 * m.fast.high,
      );
      g.fillRect(
        col * 16 + offset + e.dx,
        row * 16 + 3 * Math.sin(t * 0.38 + col * 0.08) + e.dy,
        size,
        size,
      );
    }
  }
  g.globalCompositeOperation = 'hard-light';
  for (const c of groups) {
    const e = introFor(c.id, intro, 350);
    if (!e.active) continue;
    const local = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.16) : quiet;
    const x = c.x + 25 * Math.sin(t * 0.41 + c.phase) * (1 + s.motion * 0.45),
      y = c.y + 22 * Math.cos(t * 0.37 + c.phase);
    const size =
      ((c.size * S) / (2 * H)) * (1 + 0.1 * Math.sin(t * 0.68 + c.phase) + local.slow.bass * 0.1);
    const w =
        0.5 +
        0.5 * Math.sin(t * (0.4 + R(c.id, 12) * 0.4) + c.phase * 1.7) +
        local.fast.high * 0.25,
      wm = Math.min(1, w);
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(e.scale, e.scale);
    g.transform(
      1,
      0.025 * Math.sin(t * 0.51 + c.phase),
      0.035 * Math.cos(t * 0.47 + c.phase),
      1,
      0,
      0,
    );
    g.globalAlpha = 0.78 + 0.16 * Math.sin(t * 0.57 + c.phase) + local.fast.rms * 0.1;
    g.drawImage(bodyStamp(c), -size / 2, -size / 2, size, size);
    // The two petal stamps trade weight over time so the rays shimmer instead of sliding rigidly.
    const gain = 1 + local.fast.rms * 0.5 + local.impulse * 0.25;
    g.globalAlpha = Math.min(1, (1 - wm) * gain);
    g.drawImage(petalStamp(c, 0), -size / 2, -size / 2, size, size);
    g.globalAlpha = Math.min(1, wm * gain);
    g.drawImage(petalStamp(c, 1), -size / 2, -size / 2, size, size);
    g.restore();
  }
  // Ten jittered hairline copies per frame, alternating square and near-circular corners.
  g.globalCompositeOperation = 'source-over';
  for (let id = 0; id < 46; id++) {
    const e = introFor(id + 200, intro, 380);
    if (!e.active) continue;
    const phase = R(id, 100) * TAU,
      size = 90 + R(id, 101) * 220;
    const x = R(id, 102) * 1080 - 60 + 23 * Math.sin(t * 0.33 + phase),
      y = R(id, 103) * 660 - 60 + 22 * Math.cos(t * 0.39 + phase);
    const round = R(id, 104) > 0.5;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(e.scale, e.scale);
    g.strokeStyle = palette[Math.floor(R(id, 105) * 7)];
    g.lineWidth = 0.85 + m.fast.centroid * 0.3;
    for (let echo = 0; echo < 10; echo++) {
      const ph = phase + echo * 0.71;
      const ox =
        (2 + echo * 0.9) *
        Math.sin(t * (0.51 + echo * 0.013) + ph) *
        (1 + m.impulse * s.impulse * 0.35);
      const oy = (2 + echo * 0.9) * Math.cos(t * 0.59 + ph);
      const width = size * (1 + 0.035 * Math.sin(t * 0.83 + ph) + m.slow.bass * 0.035);
      g.globalAlpha = 0.16 + R(id, echo + 110) * 0.45;
      g.beginPath();
      g.roundRect(-width / 2 + ox, -width / 2 + oy, width, width, round ? width / 2 : 0);
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
