// Hybrid of Scene AT (prototype-44, Codex) and Scene BN (prototype-64,
// "Spiral Dust") for segment 6. Both sources are already a single homogeneous
// population of individually-cached items (AT's 192 grid tiles, BN's 200
// wrapped-field spiral sprites), so this pair simply merges both populations
// into one array, tagged and depth-sorted together every frame, drawn in a
// single shared loop -- no separate batch/background layer needed from
// either side.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-44/states.js';

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
const mix = (a, b, q) => a + (b - a) * q;
const smooth = (q) => q * q * (3 - 2 * q);

// ---- AT's own population ----
const AT_R = (id, k) => randomAt(62944, id * 137 + k);
const colors = [
  '#050505',
  '#192940',
  '#f2a51a',
  '#bf182a',
  '#719bb4',
  '#84a954',
  '#e4e5e3',
  '#ffffff',
];
const atTiles = [];
for (let col = 0; col < 12; col++)
  for (let row = -2; row < 10; row++) {
    const id = col * 16 + row + 2;
    atTiles.push({
      id,
      col,
      row,
      phase: AT_R(id, 0) * TAU,
      angle: (Math.floor(AT_R(id, 1) * 4) * Math.PI) / 2,
      inset: AT_R(id, 2) < 0.42 ? 9 : 2,
      gray: Math.round(45 + AT_R(id, 3) * 180),
      style: Math.floor(AT_R(id, 4) * 3),
    });
  }
function polygon(g, points, color) {
  g.fillStyle = color;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function panelTurn(id, t) {
  const period = 10 + AT_R(id, 150) * 9,
    clock = t + AT_R(id, 151) * period;
  const cycle = Math.floor(clock / period),
    local = clock - cycle * period;
  const u = Math.min(1, local / (1.2 + AT_R(id, 152) * 0.6));
  const ease = u * u * u * (u * (u * 6 - 15) + 10);
  return (((cycle + ease) * Math.PI) / 2) * (AT_R(id, 153) > 0.5 ? 1 : -1);
}
function atPanel(g, c, t, m, s) {
  if (c.inset > 2) {
    for (let k = 0; k < 32; k++) {
      if (AT_R(c.id, k + 10) < 0.25) continue;
      g.strokeStyle = colors[Math.floor(AT_R(c.id, k + 50) * colors.length)];
      g.lineWidth = 0.65 + AT_R(c.id, k + 90) * 0.7;
      const px = -39 + k * 2.5,
        shift = 5 * Math.sin(t * 2.1 + k * 0.5 + c.phase) * (1 + 0.65 * m.fast.high);
      g.beginPath();
      g.moveTo(px, -39 + shift);
      g.lineTo(px, 39 + shift);
      g.stroke();
    }
  }
  g.rotate(c.angle + (c.id % 3 === 0 ? panelTurn(c.id, t) : 0));
  const h = 40 - c.inset - 3 * Math.sin(t * 1.09 + c.phase) * (1 + 0.35 * m.residue);
  g.fillStyle = `rgb(${c.gray},${c.gray},${c.gray})`;
  g.fillRect(-h, -h, h * 2, h * 2);
  const px =
    h * (-0.12 + 0.62 * Math.sin(t * 1.23 + c.phase)) + 0.12 * h * m.slow.mid * Math.cos(c.phase);
  const py = h * 0.53 * Math.cos(t * 1.37 + c.phase) + m.impulse * s.impulse * 4 * Math.sin(c.id);
  const hub = [px, py],
    corners = [
      [-h, -h],
      [h, -h],
      [h, h],
      [-h, h],
    ];
  for (let k = 0; k < 4; k++) {
    if (k === c.style && AT_R(c.id, 120) > 0.35) continue;
    const start = corners[k],
      end = corners[(k + 1) % 4];
    const color = colors[Math.floor(AT_R(c.id, k + 121) * colors.length)];
    if ((k + c.id) % 3 === 0) {
      const mixv = 0.08 + 0.72 * Math.sin(t * 0.93 + c.phase + k);
      const edge = [
        start[0] + (end[0] - start[0]) * (0.5 + mixv * 0.5),
        start[1] + (end[1] - start[1]) * (0.5 + mixv * 0.5),
      ];
      polygon(g, [hub, start, edge], color);
    } else polygon(g, [hub, start, end], color);
  }
  g.lineWidth = 0.55 + 0.16 * m.fast.centroid;
  for (let k = 0; k < 3; k++) {
    const corner = corners[(k + c.style) % 4];
    g.strokeStyle = colors[Math.floor(AT_R(c.id, k + 130) * colors.length)];
    g.beginPath();
    g.moveTo(...hub);
    g.lineTo(...corner);
    g.stroke();
  }
}

// ---- BN's own population ----
const S = 540,
  M = S / 4,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 200,
  AG = 3.6,
  TURNS = 22,
  STEPS = TURNS * 100;
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}
const BUILD = 0.32,
  CB = 148,
  HC = CB / 2,
  spiralCache = new Map();
function buildSpiral(i, e) {
  const key = i * 512 + e + 64,
    hit = spiralCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11596, key * 20 + k);
  const mr = S / 4 + (r(0) * S) / 4,
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
  for (let k = 0; k <= STEPS; k++) {
    const q = k / STEPS,
      a = k * AG * DEG,
      wr = mix(mr, 0, q),
      rr = mix(mxr, 0, q);
    const sr = (vn(rSeed, rn0 + k * 0.1) * mr) / 4,
      ada = vn(aSeed, an0 + k * 0.1) * AG * 2 * DEG;
    const rad = wr / 2 + sr,
      x = Math.cos(a + ada) * rad,
      y = Math.sin(a + ada) * rad;
    if (strokeMode) {
      g.lineWidth = Math.max(0.3, rr / 10 / BUILD);
      g.strokeRect(x - rr / 2, y - rr / 2, rr, rr);
    } else g.fillRect(x - rr / 2, y - rr / 2, rr, rr);
  }
  if (spiralCache.size > 4000) spiralCache.clear();
  spiralCache.set(key, canvas);
  return canvas;
}
const Fr = (i, k) => randomAt(11597, i * 61 + k);
const spiralField = Array.from({ length: N }, (_, i) => ({
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
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();

  const pool = [];
  for (const c of atTiles) {
    const entry = introFor(c.id, intro, 320);
    if (!entry.active) continue;
    const columnPhase = AT_R(c.col, 70) * TAU;
    const slide =
      66 * Math.sin(t * 0.69 + columnPhase) + 24 * Math.sin(t * 1.13 + columnPhase * 0.7);
    const m = reactive ? controls.at(t - 0.025 - c.col * 0.019) : quiet;
    const y = c.row * 80 + slide + AT_R(c.col, 71) * 60 + m.slow.bass * 17 * Math.sin(columnPhase);
    const x =
      40 +
      c.col * 80 +
      5 * Math.sin(t * 0.81 + columnPhase) +
      m.impulse * s.impulse * 3 * Math.cos(c.phase);
    pool.push({
      kind: 'tile',
      c,
      entry,
      x,
      y,
      depth: (AT_R(c.id, 900) - 0.5) * 240 + 16 * Math.sin(t * 0.27 + c.phase),
    });
  }
  for (let i = 0; i < N; i++) {
    const f = spiralField[i],
      e = introFor(300 + i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 9 * f.k * t, PW) + 16 * Math.sin(t * 0.28 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 7 * f.k * t, PH) + 16 * Math.cos(t * 0.24 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    pool.push({
      kind: 'spiral',
      f,
      i,
      e,
      x,
      y,
      depth: (Fr(i, 900) - 0.5) * 240 + 16 * Math.sin(t * 0.19 + f.ph),
    });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'tile') {
      const { c, entry: e, x, y } = item,
        m = reactive ? controls.at(t - 0.025 - c.col * 0.019) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      atPanel(g, c, t, m, s);
      g.restore();
    } else {
      const { f, i, e, x, y } = item;
      const P = f.life,
        off = f.off * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const rot = t * 0.03 * (1 + 0.3 * m.slow.mid) * (i % 2 ? 1 : -1),
        pulse = 1 + 0.06 * Math.sin(t * 0.6 + f.ph) + 0.08 * m.slow.bass;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.rotate(rot);
      g.scale((e.scale * pulse) / BUILD, (e.scale * pulse) / BUILD);
      const alpha = 0.65 + 0.3 * m.fast.high;
      const drawE = (ep2, k) => {
        if (k <= 0.004) return;
        g.globalAlpha = alpha * k;
        g.drawImage(buildSpiral(i, ep2), -HC, -HC);
      };
      const ease = (q) => {
        q = Math.max(0, Math.min(1, q));
        return q * q * (3 - 2 * q);
      };
      drawE(ep - 1, 1 - ease(fr / 0.16));
      drawE(ep, ease(fr / 0.3));
      g.globalAlpha = 1;
      g.restore();
    }
  }
  g.restore();
  return s;
}
