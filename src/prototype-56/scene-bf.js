import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 5,
  CB = Math.ceil(G + 32);
const cp = ['#F75137', '#22BA8A', '#F2D15D', '#DA8648', '#560554', '#103E7C', '#E5C7A5'];
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
// One subdivided circle-mosaic pass: independent of the other two, mirroring the source calling
// its circle-grid routine three separate times with entirely fresh randomness each call.
function subPass(r, base) {
  const v = [1, 2, 4][Math.floor(r(base) * 3)],
    sg = G / v;
  return {
    v,
    sg,
    cells: Array.from({ length: v * v }, (_, k) => {
      const i = k % v,
        j = Math.floor(k / v),
        x = (i - (v - 1) / 2) * sg,
        y = (j - (v - 1) / 2) * sg,
        b = base + 2 + k * 3;
      return { x, y, col: Math.floor(r(b) * 7) };
    }),
  };
}
// A cell's full three-pass recipe for one "epoch": a pure function of (cell, epoch), so any
// frame can be drawn alone. Squares-and-glitter (pass C) shares the third pass's subdivision.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11567, key * 300 + k);
  const a = subPass(r, 0),
    b = subPass(r, 60),
    cpass = subPass(r, 120);
  const dotsPer = Math.max(6, Math.round(60 / (cpass.v * cpass.v)));
  const cells = cpass.cells.map((c, k) => {
    const b0 = 180 + k * 40,
      er = cpass.sg * (0.5 + r(b0) * 0.5),
      round = r(b0 + 1) < 0.5;
    return {
      ...c,
      er,
      round,
      rot: r(b0 + 2) * TAU,
      ox: (r(b0 + 3) * 2 - 1) * (cpass.sg / 2 - er / 2),
      oy: (r(b0 + 4) * 2 - 1) * (cpass.sg / 2 - er / 2),
      mode: r(b0 + 5) < 0.5,
      tone: r(b0 + 6),
      dots: Array.from({ length: dotsPer }, (_, d) => {
        const db = b0 + 10 + d * 4;
        return {
          a: r(db) * TAU,
          rad: Math.sqrt(r(db + 1)),
          size: 1 + r(db + 2) * 3.5,
          alpha: r(db + 3) * 0.7,
          white: r(db + 3) < 0.5,
        };
      }),
    };
  });
  const c = { a, b, cpass: { ...cpass, cells } };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
const rawBuf = document.createElement('canvas');
rawBuf.width = CB;
rawBuf.height = CB;
const cellBuf = document.createElement('canvas');
cellBuf.width = CB;
cellBuf.height = CB;
// Builds one cell's finished, settled appearance (blurred base + two crisp overlay passes) into
// the shared `cellBuf`, consumed immediately by the caller — the same private-buffer pattern
// used for the blur/posterize composite in Scene BD.
function paintCell(conf, t, m, blurPx, jitterGain) {
  const half = CB / 2,
    rg = rawBuf.getContext('2d');
  rg.setTransform(1, 0, 0, 1, 0, 0);
  rg.fillStyle = '#ffffff';
  rg.fillRect(0, 0, CB, CB);
  for (const c of conf.a.cells) {
    rg.fillStyle = cp[c.col];
    rg.beginPath();
    const R =
      (conf.a.sg / 2) *
      (1 +
        0.22 * Math.sin(t * 1.8 + c.x * 0.02 + c.y * 0.02) +
        0.16 * m.slow.bass +
        0.08 * m.impulse);
    rg.arc(half + c.x, half + c.y, R, 0, TAU);
    rg.fill();
  }
  const cg = cellBuf.getContext('2d');
  cg.setTransform(1, 0, 0, 1, 0, 0);
  cg.clearRect(0, 0, CB, CB);
  cg.save();
  cg.filter = `blur(${blurPx}px)`;
  cg.drawImage(rawBuf, 0, 0);
  cg.restore();
  cg.globalCompositeOperation = 'overlay';
  for (const c of conf.b.cells) {
    cg.fillStyle = cp[c.col];
    cg.beginPath();
    const R =
      (conf.b.sg / 2) *
      (1 +
        0.26 * Math.sin(t * 2.1 + c.x * 0.03 - c.y * 0.02 + 7) +
        0.16 * m.slow.mid +
        0.07 * m.fast.rms);
    cg.arc(half + c.x, half + c.y, R, 0, TAU);
    cg.fill();
  }
  for (const c of conf.cpass.cells) {
    const wob = conf.cpass.sg * 0.12 * (1 + 0.4 * m.fast.high);
    cg.save();
    cg.translate(
      half + c.x + c.ox + wob * Math.sin(t * 0.7 + c.x * 0.05),
      half + c.y + c.oy + wob * Math.cos(t * 0.6 + c.y * 0.05),
    );
    cg.rotate(c.rot + t * (1.1 + m.impulse * 1.4) + 0.4 * Math.sin(t * 1.3 + c.x));
    const tone = Math.round(c.tone * 255),
      er = c.er * (1 + 0.08 * m.fast.high);
    if (c.mode) {
      cg.strokeStyle = `rgb(${tone},${tone},${tone})`;
      cg.lineWidth = Math.max(0.6, er / 40);
      cg.beginPath();
      cg.roundRect(-er / 2, -er / 2, er, er, c.round ? er / 2 : 0);
      cg.stroke();
    } else {
      cg.fillStyle = `rgb(${tone},${tone},${tone})`;
      cg.beginPath();
      cg.roundRect(-er / 2, -er / 2, er, er, c.round ? er / 2 : 0);
      cg.fill();
    }
    cg.restore();
    for (const d of c.dots) {
      const ang = d.a + t * 0.6 * (d.white ? 1 : -1),
        rad = ((d.rad * conf.cpass.sg) / 2) * jitterGain * (1 + 0.15 * Math.sin(t * 1.4 + d.a * 3));
      const px = half + c.x + Math.cos(ang) * rad,
        py = half + c.y + Math.sin(ang) * rad;
      cg.globalAlpha = Math.min(
        1,
        d.alpha * (1 + 0.5 * m.fast.rms) * (0.7 + 0.3 * Math.sin(t * 2 + d.a * 5)),
      );
      cg.fillStyle = d.white ? '#ffffff' : '#000000';
      cg.beginPath();
      cg.arc(px, py, d.size, 0, TAU);
      cg.fill();
    }
  }
  cg.globalAlpha = 1;
  cg.globalCompositeOperation = 'source-over';
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  // A slow continuous drift, as in the other lettered grid scenes, keeps the grid itself in motion.
  const ox = -(t * 9 + 16 * Math.sin(t * 0.11) * (0.5 + 0.5 * s.motion)),
    oy = t * 6 + 12 * Math.sin(t * 0.09 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  const blurPx = Math.max(1, (G / 6) * (1 - 0.3 * (reactive ? controls.at(t) : quiet).fast.high));
  g.save();
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000;
      const e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 3 + randomAt(11568, h * 4 + 1) * 3.5,
        off = randomAt(11568, h * 4 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const jitterGain = 1 + 0.3 * m.fast.high;
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
      paintCell(conf(h, ep - 1), t, m, blurPx, jitterGain);
      g.globalAlpha = 1 - ease(fr / 0.16);
      g.drawImage(cellBuf, -CB / 2, -CB / 2);
      paintCell(conf(h, ep), t, m, blurPx, jitterGain);
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(cellBuf, -CB / 2, -CB / 2);
      g.globalAlpha = 1;
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
