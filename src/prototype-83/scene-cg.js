import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 5,
  ROWG = G / 4;
const cp = [
  '#C08A28',
  '#E8C24A',
  '#7A5A1E',
  '#8B2635',
  '#B5442E',
  '#1B6B63',
  '#2E9188',
  '#E9DDBE',
  '#F4ECD0',
  '#242220',
  '#0E8C8C',
  '#FF6B3D',
];
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
const cache = new Map();
// One cell's recipe for one "epoch": a pure function of (cell, epoch). A cell is a strip of v
// small squares (v one of 4/8/12/16/20, each independently coloured) laid along a fixed axis
// picked from the four 45-degree-apart orientations, plus a fifty-fifty chance of a thin black
// square outline whose four corners are each independently full-radius (quarter-circle) or sharp.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11631, key * 90 + k);
  const v = (1 + Math.floor(r(0) * 5)) * 4,
    sg = G / v;
  const angle = ((Math.floor(r(1) * 4) * 90 + (r(2) < 0.5 ? 0 : 45)) * Math.PI) / 180;
  const colIdx = Array.from({ length: 20 }, (_, i) => Math.floor(r(10 + i) * cp.length));
  const hasRing = r(40) < 0.5;
  const ring = [
    r(41) < 0.5 ? 0 : G / 2,
    r(42) < 0.5 ? 0 : G / 2,
    r(43) < 0.5 ? 0 : G / 2,
    r(44) < 0.5 ? 0 : G / 2,
  ];
  const c = { v, sg, angle, colIdx, hasRing, ring };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k, punch) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.save();
  g.rotate(c.angle + 0.06 * Math.sin(t * 0.5 + ph) * (1 + 0.4 * m.fast.high));
  const pulse = 1 + 0.07 * Math.sin(t * 0.8 + ph) + 0.06 * m.slow.bass;
  for (let i = 0; i < c.v; i++) {
    const sx = -G / 2 + c.sg / 2 + i * c.sg,
      sw = c.sg * pulse * (1 + 0.05 * m.fast.centroid * Math.sin(t * 2 + ph + i));
    g.save();
    g.translate(sx, 0);
    g.fillStyle = cp[c.colIdx[i]];
    g.fillRect(-sw / 2, -sw / 2, sw, sw);
    g.restore();
  }
  g.restore();
  if (c.hasRing) {
    g.strokeStyle = '#000000';
    g.lineWidth = Math.max(0.6, (G / 90) * (1 + 0.6 * punch));
    g.beginPath();
    g.roundRect(-G / 2, -G / 2, G, G, c.ring);
    g.stroke();
  }
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 8 + 14 * Math.sin(t * 0.09) * (0.5 + 0.5 * s.motion)),
    oy = -(t * 5 + 11 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / ROWG) - 1,
    r1 = Math.ceil((H - oy) / ROWG);
  g.save();
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + (row + 3000);
      const e = introFor((((col % 9) + 9) % 9) * 7 + (((row % 7) + 7) % 7), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * ROWG + ROWG / 2 + oy;
      const P = 4 + randomAt(11632, h * 4 + 1) * 4,
        off = randomAt(11632, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet,
        punch = m.impulse * s.impulse;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      paintCell(g, conf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16), punch);
      paintCell(g, conf(h, ep), t, m, off, ease(fr / 0.3), punch);
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
