import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 5;
const cp = ['#2A4FA9', '#F8CA61', '#6BB26C', '#AD0C16', '#697B7A'];
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
// One cell's recipe for one "epoch": a pure function of (cell, epoch), so any frame can be drawn
// alone. The gradient circle uses two distinct palette colours, as the source explicitly requires.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11598, key * 160 + k);
  let ca = Math.floor(r(0) * 5),
    cb = Math.floor(r(1) * 5);
  if (cb === ca) cb = (cb + 1) % 5;
  const circScale = 0.7 + r(2) * 0.3,
    v = (1 + Math.floor(r(3) * 5)) * 4,
    sg = G / v,
    sqs = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 10 + (i * v + j) * 4;
      if (r(b) < 0.5) continue;
      sqs.push({
        x: -G / 2 + sg / 2 + i * sg,
        y: -G / 2 + sg / 2 + j * sg,
        size: r(b + 1) < 0.5 ? sg / 2 : sg,
        col: r(b + 2) < 0.5 ? '#000000' : cp[Math.floor(r(b + 3) * 5)],
        ph: r(b + 3) * TAU,
      });
    }
  const beziers = Array.from({ length: 8 }, (_, k) => {
    const b = 400 + k * 10;
    return {
      rot: (Math.floor(r(b) * 4) * Math.PI) / 2,
      col: r(b + 1) < 0.5 ? '#ffffff' : cp[Math.floor(r(b + 2) * 5)],
      y0: ((r(b + 3) * 2 - 1) * G) / 2,
      y1: ((r(b + 4) * 2 - 1) * G) / 2,
      y2: ((r(b + 5) * 2 - 1) * G) / 2,
      y3: ((r(b + 6) * 2 - 1) * G) / 2,
      ph: r(b + 7) * TAU,
    };
  });
  const c = { ca, cb, circScale, sqs, beziers };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  const R = (G * c.circScale * (1 + 0.08 * Math.sin(t * 0.7) + 0.08 * m.slow.bass)) / 2;
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, R);
  grad.addColorStop(0, cp[c.ca]);
  grad.addColorStop(1, cp[c.cb]);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.fill();
  for (const sq of c.sqs) {
    const s = sq.size * (1 + 0.06 * Math.sin(t * 0.9 + sq.ph) + 0.05 * m.fast.high);
    g.fillStyle = sq.col;
    g.fillRect(sq.x - s / 2, sq.y - s / 2, s, s);
  }
  g.lineWidth = Math.max(0.4, (G / 80) * (1 + 0.3 * m.fast.centroid));
  for (const b of c.beziers) {
    g.save();
    g.rotate(b.rot);
    g.strokeStyle = b.col;
    const wob = 3 * Math.sin(t * 0.8 + b.ph) * (1 + 0.4 * m.fast.high);
    g.beginPath();
    g.moveTo(-G / 2, b.y0 + wob);
    g.bezierCurveTo(-G / 4, b.y1 - wob, G / 4, b.y2 + wob, G / 2, b.y3 - wob);
    g.stroke();
    g.restore();
  }
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  const ox = -(t * 10 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.5 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
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
      const P = 4 + randomAt(11599, h * 4 + 1) * 4,
        off = randomAt(11599, h * 4 + 2) * P,
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
      paintCell(g, conf(h, ep - 1), t, m, 1 - ease(fr / 0.16));
      paintCell(g, conf(h, ep), t, m, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
