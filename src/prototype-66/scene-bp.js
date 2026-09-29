import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 8;
const cp = ['#385533', '#BDAE6F', '#5C8899', '#BD8718', '#6C2424'];
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
const smooth = (q) => q * q * (3 - 2 * q);
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}
const cache = new Map();
// One cell's recipe for one "epoch": a pure function of (cell, epoch). Two modes match the
// source: a four-triangle pinwheel, or a white chevron (a wide triangle, apex at centre) with a
// smaller inset colour triangle showing through as a bordered "V", over a soft radial glow.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11600, key * 60 + k);
  const bg = r(0) < 0.5 ? '#000000' : '#ffffff',
    rot = (Math.floor(r(1) * 4) * Math.PI) / 2,
    scale = r(2) < 0.5 ? 0.8 : 1,
    pinwheel = r(3) < 0.5;
  const mc = Math.floor(r(4) * 5);
  if (pinwheel) {
    const pick = (k) => (r(k) < 0.6 ? mc : Math.floor(r(k + 1) * 5));
    const c = {
      bg,
      rot,
      scale,
      pinwheel: true,
      cols: [pick(10), pick(12), pick(14), pick(16)],
      vj: r(18) < 0.5 ? 1 : 0,
      vk: r(19) < 0.5 ? 1 : 0,
    };
    if (cache.size > 8000) cache.clear();
    cache.set(key, c);
    return c;
  }
  let ca = Math.floor(r(20) * 5),
    cb = Math.floor(r(21) * 5);
  if (cb === ca) cb = (cb + 1) % 5;
  const innerCol = r(22) < 0.5 ? ca : cb;
  const c = { bg, rot, scale, pinwheel: false, ca, cb, innerCol };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.fillStyle = c.bg;
  g.fillRect(-G / 2, -G / 2, G, G);
  g.save();
  g.rotate(c.rot);
  const sc = c.scale * (1 + 0.04 * Math.sin(t * 0.7 + ph));
  g.scale(sc, sc);
  if (c.pinwheel) {
    const tris = [
      [
        [-G / 2, -G / 2],
        [-G / 2, G / 2],
        [-G / 3, -G / 2],
      ],
      [
        [-G / 3, -G / 2],
        [G / 2, G / 2],
        [0, -G / 2],
      ],
      [
        [0, -G / 2],
        [G / 2, c.vj ? G / 3 : 0],
        [G / 2, -G / 2],
      ],
      [
        [-G / 2, G / 2],
        [c.vk ? -G / 3 : 0, 0],
        [G / 2, G / 2],
      ],
    ];
    for (let i = 0; i < 4; i++) {
      g.fillStyle = cp[c.cols[i]];
      const p = tris[i];
      g.beginPath();
      g.moveTo(p[0][0], p[0][1]);
      g.lineTo(p[1][0], p[1][1]);
      g.lineTo(p[2][0], p[2][1]);
      g.closePath();
      g.fill();
    }
  } else {
    g.fillStyle = cp[c.ca];
    g.fillRect(-G / 2, -G / 2, G, G);
    const R = (G / 2) * (1 + 0.06 * Math.sin(t * 0.8 + ph) + 0.1 * m.slow.bass);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, R);
    const n = parseInt(cp[c.cb].slice(1), 16);
    grad.addColorStop(0, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},.36)`);
    grad.addColorStop(1, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, R, 0, TAU);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(-G / 2, G / 2);
    g.lineTo(0, 0);
    g.lineTo(G / 2, G / 2);
    g.closePath();
    g.fill();
    const z = G / 10;
    g.fillStyle = cp[c.innerCol];
    g.beginPath();
    g.moveTo(-G / 2 + z, G / 2);
    g.lineTo(0, z);
    g.lineTo(G / 2 - z, G / 2);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.globalAlpha = 1;
}
// Column stagger: each column keeps its own vertical offset, as in the source, drifting slowly
// over time so the brick-like stagger itself stays in motion.
const colOff = new Map();
function columnOffset(col, t) {
  const key = col;
  let base = colOff.get(key);
  if (base === undefined) {
    base = (randomAt(11601, ((col % 4000) + 4000) % 4000) * 2 - 1) * G;
    colOff.set(key, base);
    if (colOff.size > 4000) colOff.clear();
  }
  return base + G * 0.25 * Math.sin(t * 0.08 + col * 0.7);
}
// Thin overlay threads flowing continuously from the centre, echoing the source's `num` loose
// bezier curves.
function loop(g, seedBase, i, t, m) {
  g.strokeStyle = randomAt(11602, i * 3) < 0.5 ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.7)';
  g.lineWidth = 0.6 + randomAt(11602, i * 3 + 1) * (G / 20) + m.fast.centroid * 0.4;
  g.beginPath();
  for (let j = 0; j < 48; j++) {
    const u = (j / 47) * 3 + t * 0.1 + i * 7;
    const px = vn(seedBase + i * 2, u) * W * 0.75,
      py = vn(seedBase + i * 2 + 1, u + 40) * H * 0.85;
    j === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G);
  g.save();
  for (let col = c0; col <= c1; col++) {
    const coff = columnOffset(col, t),
      oy = coff - ((t * 5.5) % G);
    const r0 = Math.floor(-oy / G) - 1,
      r1 = Math.ceil((H - oy) / G);
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 4 + randomAt(11603, h * 4 + 1) * 4,
        off = randomAt(11603, h * 4 + 2) * P,
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
  }
  g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 70; i++) {
    const e = introFor(600 + i, intro, 420);
    if (!e.active) continue;
    g.save();
    g.translate(W / 2 + e.dx, H / 2 + e.dy);
    g.scale(e.scale, e.scale);
    g.translate(-W / 2, -H / 2);
    loop(g, 11604, i, t, mBase);
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
