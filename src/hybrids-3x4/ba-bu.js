// Hybrid of Scene BA ("Ribbon Windows", mine) and Scene BU ("Interference
// Etching", Codex, prototype-71) for segment 6. BA's grid cells, BU's 112
// etched-line clusters, and BU's 12 difference-blended rings are merged into
// one array, tagged and depth-sorted together every frame, drawn in a single
// shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-51/states.js';

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

// ---- BA's own population ----
const G = 135,
  TS = 112,
  IR = G / 1.2,
  NS = 1500,
  COPIES = 30;
const vn = (seed, x) => {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return a + (b - a) * f * f * f * (f * (f * 6 - 15) + 10);
};
const nz = (seed, x) =>
  0.5 +
  0.5 *
    (0.55 * vn(seed, x) +
      0.28 * vn(seed + 1, x * 2.03 + 11.7) +
      0.14 * vn(seed + 2, x * 4.07 + 3.1));
const baCache = new Map(),
  cv = Object.assign(document.createElement('canvas'), { width: TS, height: TS });
function baConf(h, e) {
  const key = h * 512 + e + 64,
    hit = baCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11555, key * 400 + k),
    sd = (k) => Math.floor(r(k) * 1e9);
  const c = {
    dark: r(0) < 0.5,
    rot: r(1) * TAU,
    spin: (r(2) < 0.5 ? -1 : 1) * (0.05 + r(3) * 0.11),
    mxr: G / (r(4) < 0.5 ? 10 : 20),
    sx: sd(5),
    sy: sd(6),
    sr: sd(7),
    xn: r(8) * 40 + 5,
    yn: r(9) * 40 + 5,
    rn: r(10) * 40 + 5,
    vx: 0.06 + r(11) * 0.06,
    vy: -(0.05 + r(12) * 0.05),
    vr: 0.3 + r(13) * 0.25,
    scx: 0.7 + r(14) * 0.3,
    scy: 0.7 + r(15) * 0.3,
    zf: r(16),
    copies: Array.from({ length: COPIES }, (_, k) => ({
      a: (20 + 40 * r(20 + k * 5)) / 255,
      x: r(21 + k * 5) * 2 - 1,
      y: r(22 + k * 5) * 2 - 1,
      fw: 0.5 + r(23 + k * 5) * 1.4,
      ph: r(24 + k * 5) * TAU,
    })),
    dots: Array.from({ length: 30 }, (_, k) => ({
      x: r(180 + k * 4) * 2 - 1,
      y: r(181 + k * 4) * 2 - 1,
      vx: (r(182 + k * 4) * 2 - 1) * 0.04,
      vy: (r(183 + k * 4) * 2 - 1) * 0.04,
      ph: r(183 + k * 4) * TAU,
    })),
  };
  if (baCache.size > 6000) baCache.clear();
  baCache.set(key, c);
  return c;
}
function baTexture(c, t, m) {
  const g = cv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = c.dark ? '#000000' : '#ffffff';
  g.fillRect(0, 0, TS, TS);
  g.translate(TS / 2, TS / 2);
  g.rotate(c.rot + c.spin * t);
  g.scale(1 / 1.2, 1 / 1.2);
  g.fillStyle = c.dark ? '#ffffff' : '#000000';
  g.beginPath();
  const grow = 1 + 0.3 * m.slow.bass,
    x0 = c.xn + t * c.vx,
    y0 = c.yn + t * c.vy,
    r0 = c.rn + t * c.vr;
  for (let j = 0; j < NS; j++) {
    const x = (nz(c.sx, x0 + j * 0.0082) - 0.5) * 4 * G,
      y = (nz(c.sy, y0 + j * 0.0082) - 0.5) * 4 * G,
      d = (c.mxr * (0.1 + 0.9 * nz(c.sr, r0 + j * 0.082)) * grow) / 2;
    g.moveTo(x + d, y);
    g.arc(x, y, d, 0, TAU);
  }
  for (const q of c.dots) {
    const x = (((((q.x + t * q.vx + 1) % 2) + 2) % 2) - 1) * G * 0.8,
      y = (((((q.y + t * q.vy + 1) % 2) + 2) % 2) - 1) * G * 0.8,
      d = (c.mxr * (0.1 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.7 + q.ph)))) / 2;
    g.moveTo(x + d, y);
    g.arc(x, y, d, 0, TAU);
  }
  g.fill();
  return cv;
}
function baStack(g, c, k, t, m, ph) {
  if (k <= 0.003) return;
  const tex = baTexture(c, t, m),
    z = mix(IR / 100, IR / 10, c.zf) * (1 + 0.6 * m.fast.high),
    br = 1 + 0.03 * Math.sin(t * 0.4 + ph) + 0.04 * m.slow.mid;
  g.save();
  g.scale(c.scx * k * br, c.scy * k * br);
  for (const q of c.copies) {
    g.globalAlpha = Math.min(1, q.a * (1 + 0.35 * m.fast.rms));
    g.drawImage(
      tex,
      -IR / 2 + z * (q.x * 0.75 + 0.35 * Math.sin(t * q.fw + q.ph)),
      -IR / 2 + z * (q.y * 0.75 + 0.35 * Math.cos(t * q.fw * 0.8 + q.ph)),
      IR,
      IR,
    );
  }
  g.restore();
  g.globalAlpha = 1;
}

// ---- BU's own population ----
const BU_R = (i, k) => randomAt(92071, i * 431 + k);
const buClusters = Array.from({ length: 112 }, (_, id) => ({
  id,
  x: BU_R(id, 0) * 1120 - 80,
  y: BU_R(id, 1) * 700 - 80,
  size: 145 + BU_R(id, 2) * 180,
  phase: BU_R(id, 3) * TAU,
  angle: (Math.floor(BU_R(id, 4) * 4) * Math.PI) / 2,
  white: BU_R(id, 5) > 0.62,
}));
let buMeshes;
function buEtchings() {
  if (buMeshes) return buMeshes;
  buMeshes = buClusters.map((c) =>
    Array.from({ length: 4 }, (_, bank) => {
      const main = new Path2D(),
        contrast = new Path2D();
      for (let j = 0; j < 32; j++) {
        const key = bank * 40 + j;
        const angle = (BU_R(c.id, key + 20) - 0.5) * 0.28;
        const co = Math.cos(angle),
          si = Math.sin(angle);
        const point = (x, y) => [x * co - y * si, x * si + y * co];
        const x = BU_R(c.id, key + 160) - 0.5,
          y = BU_R(c.id, key + 210) - 0.5;
        const endX = -0.42 + BU_R(c.id, key + 260) * 0.92,
          endY = -0.42 + BU_R(c.id, key + 310) * 0.92;
        const path = BU_R(c.id, key + 360) < 0.12 ? contrast : main;
        path.moveTo(...point(x, -0.5));
        path.lineTo(...point(x, endY));
        path.moveTo(...point(-0.5, y));
        path.lineTo(...point(endX, y));
      }
      return { main, contrast };
    }),
  );
  return buMeshes;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  const paths = buEtchings();
  g.save();
  g.lineCap = 'butt';

  const pool = [];
  const ox = -(t * 13 + 22 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion)),
    oy = t * 9 + 16 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  for (let c = c0; c <= c1; c++)
    for (let row = r0; row <= r1; row++) {
      const h = (c + 3000) * 8192 + row + 3000,
        x = c * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
      if (!e.active) continue;
      pool.push({ kind: 'window', h, x, y, e, depth: (randomAt(11556, h * 4 + 900) - 0.5) * 240 });
    }
  for (const c of buClusters) {
    const e = introFor(c.id, intro, 370);
    if (!e.active) continue;
    pool.push({
      kind: 'cluster',
      c,
      e,
      depth: (BU_R(c.id, 900) - 0.5) * 240 + 18 * Math.sin(t * 0.24 + c.phase),
    });
  }
  for (let ring = 0; ring < 12; ring++) {
    const e = introFor(ring + 200, intro, 380);
    if (!e.active) continue;
    pool.push({ kind: 'ring', ring, e, depth: (randomAt(11557, ring * 3 + 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'window') {
      const { h, x, y, e } = item,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const P = 6 + randomAt(11556, h * 4 + 1) * 5,
        off = randomAt(11556, h * 4 + 2) * P,
        ph = randomAt(11556, h * 4 + 3) * TAU;
      const u = (t + off) / P,
        ep = Math.floor(u),
        f = u - ep,
        cur = baConf(h, ep),
        prev = baConf(h, ep - 1);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      baStack(g, prev, 1 - ease(f / 0.16), t, m, ph);
      baStack(g, cur, ease(f / 0.3), t, m, ph);
      g.restore();
    } else if (item.kind === 'cluster') {
      const { c, e } = item;
      const local = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.18) : quiet;
      const x = c.x + 24 * Math.sin(t * 0.31 + c.phase) * (1 + s.motion * 0.4),
        y = c.y + 21 * Math.cos(t * 0.37 + c.phase);
      const size = c.size * (1 + 0.07 * Math.sin(t * 0.49 + c.phase) + local.slow.bass * 0.07);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.rotate(c.angle + 0.12 * Math.sin(t * 0.27 + c.phase) * (1 + s.motion));
      g.scale(size * e.scale, size * e.scale);
      for (let bank = 0; bank < 4; bank++) {
        const phase = c.phase + bank * 1.7;
        g.save();
        g.rotate(0.035 * Math.sin(t * 0.73 + phase) * (1 + local.slow.mid));
        g.translate(0.025 * Math.sin(t * 0.61 + phase), 0.023 * Math.cos(t * 0.67 + phase));
        g.scale(1 + 0.04 * Math.sin(t * 0.81 + phase) + local.impulse * s.impulse * 0.025, 1);
        g.lineWidth = (0.62 + 0.5 * BU_R(c.id, bank + 9) + local.fast.rms * 0.18) / size;
        g.strokeStyle = c.white ? '#ffffff' : '#000000';
        g.stroke(paths[c.id][bank].main);
        g.strokeStyle = c.white ? '#000000' : '#ffffff';
        g.stroke(paths[c.id][bank].contrast);
        g.restore();
      }
      g.restore();
    } else {
      const { ring, e } = item;
      const cx = 480 + 13 * Math.sin(t * 0.23),
        cy = 270 + 11 * Math.cos(t * 0.29);
      const radius =
        18 + ring * 28 + 4 * Math.sin(t * 0.62 - ring * 0.68) + mBase.slow.bass * (2 + ring * 0.25);
      g.save();
      g.globalCompositeOperation = 'difference';
      g.strokeStyle = '#ffffff';
      g.lineWidth =
        (7 + randomAt(11557, ring * 3 + 420) * 15) *
        (1 + 0.18 * Math.sin(t * 0.77 - ring * 0.9) + mBase.impulse * s.impulse * 0.12);
      g.beginPath();
      g.arc(cx + e.dx, cy + e.dy, radius * e.scale, 0, TAU);
      g.stroke();
      g.globalCompositeOperation = 'source-over';
      g.restore();
    }
  }
  g.restore();
  return s;
}
