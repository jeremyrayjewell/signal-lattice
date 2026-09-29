import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 5;
const cp = [
  '#CEBCA7',
  '#859087',
  '#2F4788',
  '#2D4368',
  '#B43716',
  '#C09833',
  '#DFAD28',
  '#55748E',
  '#BD9990',
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
const mix = (a, b, q) => a + (b - a) * q;
const cache = new Map();
// One cell's recipe for one "epoch": a pure function of (cell, epoch). Wave amplitude tapers to
// zero at the cell's left/right edges and peaks at its centre, so rows pinch together at cell
// boundaries and bulge in the middle -- the source's distinctive "woven" look.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11605, key * 80 + k);
  const rects = Array.from({ length: 10 }, (_, k) => {
    const b = 10 + k * 4;
    const rr = G / 3 + r(b) * (G / 1.2 - G / 3);
    return {
      x: (r(b + 1) * 2 - 1) * (G / 2 - rr / 2),
      y: (r(b + 2) * 2 - 1) * (G / 2 - rr / 2),
      rr,
      tone:
        r(b + 3) < 0.34
          ? '#000000'
          : r(b + 3) < 0.67
            ? '#ffffff'
            : cp[Math.floor(r(b + 3) * 9) % 9],
    };
  });
  const rot = (Math.floor(r(50) * 4) * Math.PI) / 2,
    mc = Math.floor(r(51) * 9),
    v = (1 + Math.floor(r(52) * 4)) * 4,
    sg = G / v;
  const rows = [];
  for (let ry = 0; ry < v; ry++) {
    const b = 60 + ry * 3;
    rows.push({ col: r(b) < 0.6 ? mc : Math.floor(r(b + 1) * 9), ph: r(b + 2) * TAU });
  }
  const c = { rects, rot, v, sg, rows };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (const rc of c.rects) {
    g.fillStyle = rc.tone;
    g.fillRect(rc.x - rc.rr / 2, rc.y - rc.rr / 2, rc.rr, rc.rr);
  }
  g.save();
  g.rotate(c.rot);
  g.lineWidth = Math.max(0.5, (c.sg / 4) * (1 + 0.25 * m.fast.centroid));
  g.lineJoin = 'bevel';
  g.lineCap = 'square';
  const cols = Math.round(G / c.sg) + 2,
    wave = 1 + 0.4 * m.fast.high;
  for (let ry = 0; ry < c.v; ry++) {
    const row = c.rows[ry],
      sy = -G / 2 + c.sg / 2 + ry * c.sg;
    g.strokeStyle = cp[row.col];
    g.beginPath();
    let prev = null;
    for (let cxi = -1; cxi <= cols; cxi++) {
      const sx = cxi * c.sg - c.sg / 2;
      const z =
        sx < 0
          ? mix(0, c.sg / 1.5, Math.max(0, Math.min(1, (sx + G / 2 + c.sg) / (G / 2 + c.sg))))
          : mix(c.sg / 1.5, 0, Math.max(0, Math.min(1, sx / (G / 2 + c.sg))));
      const py = sy + z * Math.sin(t * 0.9 + sx * 0.05 + row.ph) * wave;
      if (prev) {
        g.quadraticCurveTo(prev[0], prev[1], (prev[0] + sx) / 2, (prev[1] + py) / 2);
      } else g.moveTo(sx, py);
      prev = [sx, py];
    }
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.2 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  g.save();
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 4 + randomAt(11606, h * 4 + 1) * 4,
        off = randomAt(11606, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#000000';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      paintCell(g, conf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      paintCell(g, conf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
