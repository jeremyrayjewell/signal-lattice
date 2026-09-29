import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 10;
const cp = ['#0AD2FF', '#2962FF', '#9500FF', '#FF0059', '#FF8C00', '#B4E600', '#0FFFDB'];
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
// alone. Three sub-motifs match the source's three modes: a flag-triangle fan, a ring-and-line,
// or a bracket-and-arc pair.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11617, key * 70 + k);
  const bgOn = r(0) < 0.5,
    bgCol = cp[Math.floor(r(1) * 7)],
    bgRot = r(2) < 0.5 ? r(3) * TAU : 0;
  const rot = r(4) < 0.5 ? (Math.floor(r(5) * 4) * Math.PI) / 2 : r(6) * TAU;
  const sw = Math.floor(r(7) * 3);
  let c = { bgOn, bgCol, bgRot, rot, sw };
  if (sw === 0) {
    const v = (r(10) < 0.5 ? 1 : 3) * 4,
      sg = G / v,
      tris = [];
    for (let k = 0; k < v; k++) {
      const b = 20 + k * 3;
      tris.push({ flip: r(b) < 0.5 ? -1 : 1, col: cp[Math.floor(r(b + 1) * 7)] });
    }
    c = { ...c, v, sg, tris };
  } else if (sw === 1) {
    c = {
      ...c,
      ringCol: cp[Math.floor(r(20) * 7)],
      innerCol: cp[Math.floor(r(21) * 7)],
      er: G / 8 + r(22) * (G - G / 8),
      ly0: ((r(23) * 2 - 1) * G) / 2,
      ly1: ((r(24) * 2 - 1) * G) / 2,
      lineCol: cp[Math.floor(r(25) * 7)],
    };
  } else {
    c = {
      ...c,
      quadCol: cp[Math.floor(r(30) * 7)],
      qa: ((r(31) * 2 - 1) * G) / 2,
      qb: ((r(32) * 2 - 1) * G) / 2,
      qc: ((r(33) * 2 - 1) * G) / 2,
      qd: ((r(34) * 2 - 1) * G) / 2,
      arcLCol: cp[Math.floor(r(35) * 7)],
      arcLEnd: r(36) < 0.5 ? TAU : Math.PI / 2,
      arcRCol: cp[Math.floor(r(37) * 7)],
      arcREnd: r(38) < 0.5 ? Math.PI : 1.5 * Math.PI,
    };
  }
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  if (c.bgOn) {
    g.save();
    g.rotate(c.bgRot);
    g.fillStyle = c.bgCol;
    g.globalAlpha = 0.7 * k;
    g.fillRect(-G / 2, -G / 2, G, G);
    g.restore();
  }
  g.globalAlpha = k;
  g.save();
  g.rotate(c.rot + 0.06 * Math.sin(t * 0.6 + ph) * (1 + 0.5 * m.fast.high));
  if (c.sw === 0) {
    for (let ti = 0; ti < c.v; ti++) {
      const tx = -G / 2 + c.sg / 2 + ti * c.sg,
        tri = c.tris[ti];
      g.save();
      g.translate(tx, 0);
      g.scale(1, tri.flip);
      g.fillStyle = tri.col;
      g.beginPath();
      g.moveTo(-c.sg / 2, 0);
      g.lineTo(c.sg / 2, 0);
      g.lineTo(c.sg / 2, -G / 2);
      g.closePath();
      g.fill();
      g.restore();
    }
  } else if (c.sw === 1) {
    const lra = G / 10;
    g.strokeStyle = c.ringCol;
    g.lineWidth = lra * (1 + 0.2 * m.fast.centroid);
    g.beginPath();
    g.arc(0, 0, G / 1.5 / 2, 0, TAU);
    g.stroke();
    const er = c.er * (1 + 0.05 * Math.sin(t * 0.8 + ph) + 0.06 * m.slow.bass);
    g.fillStyle = c.innerCol;
    g.beginPath();
    g.arc(0, 0, er / 2, 0, TAU);
    g.fill();
    g.strokeStyle = c.lineCol;
    g.lineWidth = lra / 3;
    g.beginPath();
    g.moveTo(-G / 2 + lra / 2, c.ly0);
    g.lineTo(G / 2 - lra / 2, c.ly1);
    g.stroke();
  } else {
    const lrb = G / 20;
    g.strokeStyle = c.quadCol;
    g.lineWidth = lrb / 2;
    g.beginPath();
    g.moveTo(c.qa, -G / 2 + lrb);
    g.lineTo(-G / 2 + lrb, c.qb);
    g.lineTo(c.qc, G / 2 - lrb);
    g.lineTo(G / 2 - lrb, c.qd);
    g.closePath();
    g.stroke();
    g.lineWidth = lrb * 2;
    g.strokeStyle = c.arcLCol;
    g.beginPath();
    g.arc(-G / 2, 0, (G - lrb * 2) / 2, Math.PI * 1.5, Math.PI * 1.5 + c.arcLEnd);
    g.stroke();
    g.strokeStyle = c.arcRCol;
    g.beginPath();
    g.arc(G / 2, 0, (G - lrb * 2) / 2, Math.PI * 0.5, Math.PI * 0.5 + c.arcREnd);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  const theta = Math.PI / 4 + t * 0.012 * (1 + 0.4 * mBase.slow.mid);
  const cA = Math.abs(Math.cos(theta)),
    sA = Math.abs(Math.sin(theta));
  const Lx = (W / 2) * cA + (H / 2) * sA,
    Ly = (W / 2) * sA + (H / 2) * cA;
  const c0 = Math.floor(-Lx / G) - 1,
    c1 = Math.ceil(Lx / G) + 1,
    r0 = Math.floor(-Ly / G) - 1,
    r1 = Math.ceil(Ly / G) + 1;
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(theta);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 14) + 14) % 14) * 8 + (((row % 8) + 8) % 8), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2,
        y = row * G + G / 2;
      const P = 4 + randomAt(11618, h * 4 + 1) * 4,
        off = randomAt(11618, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const wx = x * Math.cos(theta) - y * Math.sin(theta) + W / 2,
        wy = x * Math.sin(theta) + y * Math.cos(theta) + H / 2;
      const m = reactive ? controls.at(t - 0.03 - (wx / W) * 0.16) : quiet;
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
