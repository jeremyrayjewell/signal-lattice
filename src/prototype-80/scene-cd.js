import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
  W = 960,
  H = 540,
  S = 540,
  G = S / 4;
const cp = ['#541388', '#D90368', '#F1E9DA', '#2E294E', '#FFD400'];
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
// One cell's recipe for one "epoch": a pure function of (cell, epoch). Each of v positions gets
// both a vertical and a horizontal colour bar, crossing into a Mondrian-like plaid; four black
// bezier scribbles cross the whole cell on top.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11625, key * 70 + k);
  const flipX = r(0) < 0.5 ? -1 : 1,
    flipY = r(1) < 0.5 ? -1 : 1,
    v = (1 + Math.floor(r(2) * 2)) * 4,
    sg = G / v,
    rot = (r(3) * 2 - 1) * 20 * DEG;
  const bars = [];
  for (let k = 0; k < v; k++) {
    const b = 10 + k * 8;
    bars.push({
      vScale: 0.5 + r(b) * 0.5,
      vRot: (r(b + 1) * 2 - 1) * 4 * DEG,
      vW: r(b + 2) < 0.5 ? sg / 4 : sg / 2,
      vCol: cp[Math.floor(r(b + 3) * 5)],
      hScale: 0.5 + r(b + 4) * 0.5,
      hRot: (r(b + 5) * 2 - 1) * 4 * DEG,
      hW: r(b + 6) < 0.5 ? sg / 4 : sg / 2,
      hCol: cp[Math.floor(r(b + 7) * 5)],
      ph: r(b + 4) * TAU,
    });
  }
  const scribbles = Array.from({ length: 4 }, (_, k) => {
    const b = 200 + k * 10;
    return {
      x0: (r(b) * 2 - 1) * G,
      y0: (r(b + 1) * 2 - 1) * G,
      x1: (r(b + 2) * 2 - 1) * G,
      y1: (r(b + 3) * 2 - 1) * G,
      x2: (r(b + 4) * 2 - 1) * G,
      y2: (r(b + 5) * 2 - 1) * G,
      x3: (r(b + 6) * 2 - 1) * G,
      y3: (r(b + 7) * 2 - 1) * G,
      w: 1 + r(b + 8) * (sg / 8 - 1),
    };
  });
  const c = { flipX, flipY, v, sg, rot, bars, scribbles };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.save();
  g.scale(c.flipX, c.flipY);
  g.save();
  g.rotate(c.rot);
  g.shadowOffsetX = c.sg / 10;
  g.shadowOffsetY = c.sg / 10;
  g.shadowBlur = (c.sg / 2) * (1 + 0.3 * m.impulse);
  g.shadowColor = 'rgba(0,0,0,.55)';
  for (let bi = 0; bi < c.v; bi++) {
    const b = c.bars[bi],
      s = -G / 2 + c.sg / 2 + bi * c.sg,
      wob = 1 + 0.03 * Math.sin(t * 0.8 + b.ph) * (1 + 0.4 * m.fast.high);
    g.save();
    g.translate(s, 0);
    g.scale(b.vScale * wob, b.vScale * wob);
    g.rotate(b.vRot);
    g.fillStyle = b.vCol;
    g.fillRect(-b.vW / 2, -G / 2, b.vW, G);
    g.restore();
    g.save();
    g.translate(0, s);
    g.scale(b.hScale * wob, b.hScale * wob);
    g.rotate(b.hRot);
    g.fillStyle = b.hCol;
    g.fillRect(-G / 2, -b.hW / 2, G, b.hW);
    g.restore();
  }
  g.shadowBlur = 0;
  g.restore();
  g.strokeStyle = '#000000';
  for (const s2 of c.scribbles) {
    g.lineWidth = Math.max(0.4, s2.w * (1 + 0.3 * m.fast.centroid));
    g.beginPath();
    g.moveTo(s2.x0, s2.y0);
    g.bezierCurveTo(s2.x1, s2.y1, s2.x2, s2.y2, s2.x3, s2.y3);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.3 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
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
      const P = 4 + randomAt(11626, h * 4 + 1) * 4,
        off = randomAt(11626, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
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
      paintCell(g, conf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      paintCell(g, conf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
