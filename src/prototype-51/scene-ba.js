import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  G = 135,
  TS = 112,
  IR = G / 1.2,
  NS = 1500,
  COPIES = 30;
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
// Smooth 1D value noise; three octaves are summed so values cluster near the middle, keeping ribbons inside the window.
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
const cache = new Map(),
  cv = Object.assign(document.createElement('canvas'), { width: TS, height: TS });
// One cell's texture recipe for one "epoch": a pure function of (cell, epoch), so any frame can be drawn alone.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
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
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
// Ribbon texture (one shared canvas, consumed immediately by stack): filled circles strung along a noise path; radius has its own faster noise. The noise
// windows slide at different rates per axis, so the ribbons keep reshaping rather than merely sliding along themselves.
function texture(c, t, m) {
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
// Thirty jittered, translucent copies of the texture; their overlap gives the soft, echoing ribbon edges.
function stack(g, c, k, t, m, ph) {
  if (k <= 0.003) return;
  const tex = texture(c, t, m),
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
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  // The wall drifts as one sheet, left and down.
  const ox = -(t * 13 + 22 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion)),
    oy = t * 9 + 16 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  g.save();
  for (let c = c0; c <= c1; c++)
    for (let row = r0; row <= r1; row++) {
      const h = (c + 3000) * 8192 + row + 3000,
        x = c * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
      if (!e.active) continue;
      const P = 6 + randomAt(11556, h * 4 + 1) * 5,
        off = randomAt(11556, h * 4 + 2) * P,
        ph = randomAt(11556, h * 4 + 3) * TAU;
      const u = (t + off) / P,
        ep = Math.floor(u),
        f = u - ep,
        cur = conf(h, ep),
        prev = conf(h, ep - 1);
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      // Old window shrinks away while the new one opens.
      stack(g, prev, 1 - ease(f / 0.16), t, m, ph);
      stack(g, cur, ease(f / 0.3), t, m, ph);
      g.restore();
    }
  g.restore();
  return s;
}
