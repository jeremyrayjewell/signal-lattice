// Hybrid of Scene BC ("Onion Ripples", mine) and Scene BW ("Prismatic
// Shatter", Codex, prototype-73) for segment 6. BC's dome-stack population,
// its inversion-blob grid, and BW's 172 folded-plate clusters are merged
// into one array, tagged and depth-sorted together every frame, drawn in a
// single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-53/states.js';

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

// ---- BC's own populations ----
const S = 540,
  MR = S / 8,
  M = 110,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 3000,
  RINGS = 20;
const bcFr = (i, k) => randomAt(11559, i * 61 + k);
const bcItems = Array.from({ length: N }, (_, i) => ({
  x: bcFr(i, 0) * PW,
  y: bcFr(i, 1) * PH,
  k: 0.6 + bcFr(i, 2) * 0.8,
  life: 6 + bcFr(i, 3) * 6,
  off: bcFr(i, 4),
  ph: bcFr(i, 5) * TAU,
}));
const G2 = S / 10,
  bcBlobs = Array.from({ length: 18 * 10 }, (_, i) => ({
    cx: ((i % 18) + 0.5) * G2,
    cy: (Math.floor(i / 18) + 0.5) * G2,
    cr: G2 / 3 + (bcFr(i, 20) * G2 * 2) / 3,
    ph: bcFr(i, 21) * TAU,
    ox: bcFr(i, 22) * 2 - 1,
    oy: bcFr(i, 23) * 2 - 1,
  }));
const bcCache = new Map();
function bcConf(i, e) {
  const key = i * 512 + e + 64,
    hit = bcCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11560, key * 16 + k);
  const c = {
    rot: ((r(0) * 40 - 20) * Math.PI) / 180,
    flip: r(1) < 0.5 ? -1 : 1,
    sw: r(2) < 0.5 ? 0 : 1,
    rate: (r(3) < 0.5 ? -1 : 1) * (0.5 + r(4) * 1.6),
    phase: r(5) * 20,
  };
  if (bcCache.size > 12000) bcCache.clear();
  bcCache.set(key, c);
  return c;
}
function bcDome(g, c, x, y, k, t, m, ph, kick) {
  if (k <= 0.004) return;
  const mr = MR * k * (1 + 0.08 * m.slow.bass),
    rg = mr / RINGS,
    phi = c.rate * t + c.phase + 1.6 * m.slow.mid,
    F = Math.floor(phi),
    fr = phi - F;
  g.save();
  g.translate(x, y);
  g.rotate(c.rot + 0.1 * Math.sin(t * 0.4 + ph) + 0.04 * m.fast.high * Math.sin(t * 7 + ph) + kick);
  g.scale(1, c.flip);
  for (let j = 0; j <= RINGS; j++) {
    const d = Math.min(mr, mr - (j - fr) * rg);
    if (d <= 0) continue;
    g.fillStyle = (j + F + c.sw) & 1 ? '#ffffff' : '#000000';
    g.beginPath();
    g.arc(0, d - mr, d / 2, 0, TAU);
    g.fill();
  }
  g.restore();
}

// ---- BW's own population ----
const BW_R = (i, k) => randomAt(71173, i * 197 + k);
const colors = [
  [173, 255, 0],
  [225, 245, 0],
  [80, 230, 0],
  [0, 255, 209],
  [255, 148, 0],
  [245, 24, 209],
  [149, 32, 225],
];
const bwClusters = Array.from({ length: 172 }, (_, id) => {
  const gray = BW_R(id, 4) < 0.36;
  const value = BW_R(id, 5) < 0.22 ? 28 : 180 + BW_R(id, 6) * 75;
  const color = gray ? [value, value, value] : colors[Math.floor(BW_R(id, 7) * colors.length)];
  return {
    id,
    x: BW_R(id, 0) * 1100 - 70,
    y: BW_R(id, 1) * 680 - 70,
    size: 100 + BW_R(id, 2) * 115,
    phase: BW_R(id, 3) * TAU,
    color,
    plates: Array.from({ length: 18 }, (_, j) => ({
      y: (j - 8.5) * 0.035,
      width: 0.25 + BW_R(id, j + 20) * 0.8,
      depth: 0.22 + BW_R(id, j + 40) * 0.82,
      tilt: BW_R(id, j + 60) > 0.55 ? (BW_R(id, j + 80) - 0.5) * 2.4 : 0,
      angle: (BW_R(id, j + 100) - 0.5) * 1.8,
      alpha: 0.22 + BW_R(id, j + 120) * 0.53,
    })),
  };
});
function bwRotate(v, ax, ay, az) {
  let [x, y, z] = v,
    c = Math.cos(ax),
    s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ay);
  s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(az);
  s = Math.sin(az);
  return [x * c - y * s, x * s + y * c, z];
}
const bwFaces = [
  [0, 1, 2, 3],
  [4, 7, 6, 5],
  [0, 4, 5, 1],
  [3, 2, 6, 7],
  [0, 3, 7, 4],
  [1, 5, 6, 2],
];
function bwCluster(g, c, t, m, s, e) {
  const angle = c.phase + t * (BW_R(c.id, 150) - 0.5) * 0.14 + 0.17 * Math.sin(t * 0.37 + c.phase);
  const scale = c.size * (1 + 0.065 * Math.sin(t * 0.53 + c.phase) + m.slow.bass * 0.07);
  const spread =
    1 + 0.16 * Math.sin(t * 0.67 + c.phase) * (1 + s.motion * 0.3) + m.impulse * s.impulse * 0.12;
  const polygons = [];
  for (let j = 0; j < c.plates.length; j++) {
    const plate = c.plates[j],
      ph = c.phase + j * 0.31;
    const w = plate.width * 0.5,
      d = plate.depth * 0.5,
      h = 0.003 + (18 - j) * 0.00065;
    const ax = plate.tilt + 0.25 * Math.sin(t * 0.59 + ph) * (1 + s.motion * 0.4);
    const ay = plate.angle + j * 0.065 + 0.25 * Math.sin(t * 0.47 + ph) + m.slow.mid * 0.22;
    const points = [
      [-w, -h, -d],
      [w, -h, -d],
      [w, -h, d],
      [-w, -h, d],
      [-w, h, -d],
      [w, h, -d],
      [w, h, d],
      [-w, h, d],
    ].map((v) => {
      const q = bwRotate(v, ax, ay, 0);
      q[1] += plate.y * spread;
      return bwRotate(q, -0.58 + 0.15 * Math.sin(t * 0.31 + c.phase), 0.72, angle);
    });
    for (const ids of bwFaces) {
      const v = ids.map((i) => points[i]);
      const a = v[1].map((x, i) => x - v[0][i]),
        b = v[2].map((x, i) => x - v[0][i]);
      const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
        len = Math.hypot(...n);
      if (n[2] <= 0) continue;
      const light = 0.65 + 0.35 * Math.abs((n[0] * 0.3 - n[1] * 0.45 + n[2] * 0.84) / len);
      polygons.push({ v, z: v.reduce((sum, q) => sum + q[2], 0) / 4, light, alpha: plate.alpha });
    }
  }
  polygons.sort((a, b) => a.z - b.z);
  g.save();
  g.translate(
    c.x + e.dx + 23 * Math.sin(t * 0.33 + c.phase),
    c.y + e.dy + 21 * Math.cos(t * 0.39 + c.phase),
  );
  g.scale(scale * e.scale, scale * e.scale);
  for (const face of polygons) {
    const rgb = c.color.map((v) => Math.round(Math.min(255, v * face.light)));
    g.fillStyle = `rgba(${rgb.join(',')},${face.alpha})`;
    g.beginPath();
    face.v.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])));
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(15,20,18,.13)';
    g.lineWidth = 0.38 / scale;
    g.stroke();
  }
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const bands = Array.from({ length: 12 }, (_, k) =>
    reactive ? controls.at(t - 0.03 - (k / 11) * 0.16) : quiet,
  );
  const at = (x) => bands[Math.max(0, Math.min(11, Math.floor((x / W) * 11 + 0.5)))];
  const wob = 8 + 14 * s.motion,
    pace = intro ** 4,
    lap = (v, P) => (((v % P) + P) % P) - M;
  g.save();

  const pool = [];
  for (let i = 0; i < N; i++) {
    const f = bcItems[i],
      e = introFor(i, pace, 420);
    const x = lap(f.x - 10 * f.k * t, PW) + wob * Math.sin(t * 0.37 * (0.6 + f.k) + f.ph),
      y = lap(f.y + 15 * f.k * t, PH) + wob * Math.cos(t * 0.31 + f.ph);
    if (!e.active || x < -110 || x > W + 110 || y < -110 || y > H + 110) continue;
    pool.push({ kind: 'dome', f, i, e, x, y, depth: (bcFr(i, 900) - 0.5) * 240 });
  }
  for (let i = 0; i < bcBlobs.length; i++) {
    const b = bcBlobs[i],
      e = introFor(i + N, pace, 420);
    if (!e.active) continue;
    pool.push({ kind: 'blob', b, i, e, depth: (randomAt(11559, i * 61 + 900) - 0.5) * 240 });
  }
  for (const c of bwClusters) {
    const e = introFor(c.id, intro, 390);
    if (!e.active) continue;
    pool.push({
      kind: 'cluster',
      c,
      e,
      depth: (BW_R(c.id, 900) - 0.5) * 240 + 18 * Math.sin(t * 0.24 + c.phase),
    });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'dome') {
      const { f, i, e, x, y } = item;
      const u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = at(x),
        kick = 0.2 * m.impulse * s.impulse * Math.sin(t * 6 + f.ph);
      bcDome(
        g,
        bcConf(i, ep - 1),
        x + e.dx,
        y + e.dy,
        (1 - ease(fr / 0.16)) * e.scale,
        t,
        m,
        f.ph,
        kick,
      );
      bcDome(g, bcConf(i, ep), x + e.dx, y + e.dy, ease(fr / 0.3) * e.scale, t, m, f.ph, kick);
    } else if (item.kind === 'blob') {
      const { b, e } = item,
        m = at(b.cx),
        r = (b.cr * (1 + 0.22 * Math.sin(t * 0.8 + b.ph) + 0.12 * m.slow.bass) * e.scale) / 2;
      const x = b.cx + G2 * 0.3 * b.ox * Math.sin(t * 0.35 + b.ph) + e.dx,
        y = b.cy + G2 * 0.3 * b.oy * Math.cos(t * 0.29 + b.ph) + e.dy;
      g.save();
      g.globalCompositeOperation = 'difference';
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
      g.globalCompositeOperation = 'source-over';
      g.restore();
    } else {
      const { c, e } = item,
        m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.17) : quiet;
      bwCluster(g, c, t, m, s, e);
    }
  }
  g.restore();
  return s;
}
