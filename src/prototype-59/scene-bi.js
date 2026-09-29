import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 8;
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
// Three dot arrangements, matching the source's three pip layouts (corners, edge-midpoints, and
// a center-plus-triangle), each returned as offsets relative to a subcell of size sg.
function pattern(mode, sg, er) {
  const c = sg / 2 - er;
  if (mode === 0)
    return [
      [-c, -c],
      [-c, c],
      [c, -c],
      [c, c],
    ];
  if (mode === 1)
    return [
      [0, -c],
      [0, c],
      [-c, 0],
      [c, 0],
    ];
  return [
    [0, 0],
    [0, -c],
    [-c, c],
    [c, c],
  ];
}
// One outer cell's full recipe for one "epoch": a pure function of (cell, epoch), so any frame
// can be drawn alone. Subdivision, per-subcell arrangement, dot tones and border sides are seeded.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11575, key * 140 + k);
  const v = r(0) < 0.55 ? 1 : 2,
    sg = G / v;
  const subs = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 10 + (i * v + j) * 20;
      subs.push({
        x: -G / 2 + sg / 2 + i * sg,
        y: -G / 2 + sg / 2 + j * sg,
        rotQ: Math.floor(r(b) * 4),
        mode: Math.floor(r(b + 1) * 3),
        tones: [r(b + 2) < 0.5, r(b + 3) < 0.5, r(b + 4) < 0.5, r(b + 5) < 0.5],
        sides: [r(b + 6) < 0.5, r(b + 7) < 0.5, r(b + 8) < 0.5, r(b + 9) < 0.5],
        ph: r(b + 10) * TAU,
      });
    }
  const c = { v, sg, subs };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  const er = c.sg / 6;
  for (const s of c.subs) {
    g.save();
    g.translate(s.x, s.y);
    g.rotate((s.rotQ * Math.PI) / 2 + 0.12 * Math.sin(t * 0.6 + s.ph) * (1 + 0.5 * m.fast.high));
    const pts = pattern(s.mode, c.sg, er),
      r = er * (1 + 0.1 * Math.sin(t * 0.9 + s.ph) + 0.1 * m.slow.bass);
    g.save();
    g.shadowOffsetX = er / 8;
    g.shadowOffsetY = er / 8;
    g.shadowBlur = er * (0.6 + 0.5 * m.impulse);
    g.shadowColor = '#000000';
    for (let i = 0; i < 4; i++) {
      g.fillStyle = s.tones[i] ? '#ffffff' : '#000000';
      g.beginPath();
      g.arc(pts[i][0], pts[i][1], r, 0, TAU);
      g.fill();
    }
    g.restore();
    const rr = c.sg / 1.08,
      hr = rr / 2;
    g.strokeStyle = '#000000';
    g.lineWidth = Math.max(0.5, (c.sg / 30) * (1 + 0.4 * m.fast.centroid));
    const edges = [
      [
        [-hr, -hr],
        [-hr, hr],
      ],
      [
        [hr, -hr],
        [hr, hr],
      ],
      [
        [-hr, -hr],
        [hr, -hr],
      ],
      [
        [-hr, hr],
        [hr, hr],
      ],
    ];
    for (let i = 0; i < 4; i++) {
      if (!s.sides[i]) continue;
      const a = edges[i][0],
        b = edges[i][1],
        flex = 1.5 * Math.sin(t * 1.1 + s.ph + i) * (1 + 0.5 * m.fast.high);
      g.beginPath();
      g.moveTo(a[0] + (i < 2 ? flex : 0), a[1] + (i >= 2 ? flex : 0));
      g.lineTo(b[0] + (i < 2 ? -flex : 0), b[1] + (i >= 2 ? -flex : 0));
      g.stroke();
    }
    g.restore();
  }
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 11 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 7 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  g.save();
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000;
      const e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 4 + randomAt(11576, h * 4 + 1) * 4,
        off = randomAt(11576, h * 4 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
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
      paintCell(g, conf(h, ep - 1), t, m, 1 - ease(fr / 0.16));
      paintCell(g, conf(h, ep), t, m, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
