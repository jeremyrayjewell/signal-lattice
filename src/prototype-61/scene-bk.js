import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 8;
const RB = 620,
  HR = RB / 2,
  RINGS = 100;
const OCC = 34;
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
// One mosaic cell's recipe for one "epoch": a pure function of (cell, epoch).
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11580, key * 30 + k);
  const ch = Math.floor(r(0) * 3),
    diag = r(1) < 0.5;
  const c = {
    ch,
    alpha: r(2),
    diag,
    la: r(3) < 0.5,
    lb: r(4) < 0.5,
    tone: r(5) < 0.5 ? '#000000' : '#ffffff',
  };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = Math.min(
    1,
    (c.alpha * 0.85 + 0.15) * (0.75 + 0.35 * Math.sin(t * 0.8 + ph)) * k + 0.1 * m.fast.rms,
  );
  g.fillStyle = ['#FF0000', '#00CC00', '#0033FF'][c.ch];
  g.fillRect(-G / 2, -G / 2, G, G);
  g.globalAlpha = k;
  g.strokeStyle = c.tone;
  g.lineWidth = Math.max(0.4, (G / 40) * (1 + 0.3 * m.fast.centroid));
  const sway = 1.2 * Math.sin(t * 1.2 + ph) * (1 + 0.5 * m.fast.high);
  if (c.diag) {
    if (c.la) {
      g.beginPath();
      g.moveTo(-G / 2, -G / 2 + sway);
      g.lineTo(G / 2, G / 2 - sway);
      g.stroke();
    }
    if (c.lb) {
      g.beginPath();
      g.moveTo(-G / 2, G / 2 - sway);
      g.lineTo(G / 2, -G / 2 + sway);
      g.stroke();
    }
  } else {
    if (c.la) {
      g.beginPath();
      g.moveTo(sway, -G / 2);
      g.lineTo(-sway, G / 2);
      g.stroke();
    }
    if (c.lb) {
      g.beginPath();
      g.moveTo(-G / 2, sway);
      g.lineTo(G / 2, -sway);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
}
// Confetti bar clusters: distance from centre sets both position and size, matching the source.
const confCache = new Map();
function confConf(i, e) {
  const key = i * 512 + e + 64,
    hit = confCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11581, key * 40 + k);
  const cr = r(0) * 720,
    a = r(1) * TAU,
    rr = cr / 10,
    v = (1 + Math.floor(r(2) * 5)) * 4,
    rg = rr / v;
  const bars = Array.from({ length: v }, (_, k) => {
    const b = 10 + k * 4;
    return {
      y: -rr / 2 + k * rg,
      ch: Math.floor(r(b) * 3),
      alpha: r(b + 1),
      w: rr / 3 + (r(b + 2) * rr * 2) / 3,
      x: ((r(b + 3) * 2 - 1) * rr) / 4,
    };
  });
  const c = { cr, a, rot: (Math.floor(r(3) * 4) * Math.PI) / 2, rg, bars };
  if (confCache.size > 8000) confCache.clear();
  confCache.set(key, c);
  return c;
}
// The concentric ring target is expensive (many rings), so it is cached once per epoch, blurred
// and posterized in the cache too, and only drawn (not rebuilt) most frames.
const ringCache = new Map();
function buildRings(e) {
  if (ringCache.has(e)) return ringCache.get(e);
  const raw = document.createElement('canvas');
  raw.width = RB;
  raw.height = RB;
  const g = raw.getContext('2d'),
    step = RB / RINGS;
  for (let i = 0; i < RINGS; i++) {
    const er = RB - i * step,
      r = (k) => randomAt(11582, e * 4000 + i * 11 + k);
    if (r(0) < 0.5) continue;
    const ox = ((r(1) * 2 - 1) * er) / 20,
      oy = ((r(2) * 2 - 1) * er) / 20,
      tone = r(3) < 0.5 ? '#000000' : '#ffffff';
    g.beginPath();
    g.arc(HR + ox, HR + oy, er / 2, 0, TAU);
    if (r(4) < 0.5) {
      g.fillStyle = tone;
      g.fill();
    } else {
      g.strokeStyle = tone;
      g.lineWidth = Math.max(0.5, (er / RB) * 4);
      g.stroke();
    }
  }
  const out = document.createElement('canvas');
  out.width = RB;
  out.height = RB;
  const og = out.getContext('2d');
  og.filter = `blur(${step * 0.42}px)`;
  og.drawImage(raw, 0, 0);
  const id = og.getImageData(0, 0, RB, RB),
    d = id.data,
    levels = 5,
    step2 = 255 / (levels - 1);
  for (let p = 0; p < d.length; p += 4) {
    d[p] = Math.round(Math.round(d[p] / step2) * step2);
    d[p + 1] = Math.round(Math.round(d[p + 1] / step2) * step2);
    d[p + 2] = Math.round(Math.round(d[p + 2] / step2) * step2);
  }
  og.putImageData(id, 0, 0);
  if (ringCache.size > 60) ringCache.clear();
  ringCache.set(e, out);
  return out;
}
const occ = Array.from({ length: OCC }, (_, i) => {
  const frr = (0.5 + randomAt(11583, i * 9 + 2) * 1.5) * G;
  return {
    x: randomAt(11583, i * 9) * W,
    y: randomAt(11583, i * 9 + 1) * H,
    w: frr * (randomAt(11583, i * 9 + 3) < 0.5 ? 1 : 2),
    h: frr * (randomAt(11583, i * 9 + 4) < 0.5 ? 0.25 : 0.5),
    ph: randomAt(11583, i * 9 + 5) * TAU,
    base: randomAt(11583, i * 9 + 6),
  };
});
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  const cx = W / 2,
    cy = H / 2;
  g.save();
  // Mosaic grid, primary-colour cells with diagonal or cross lines.
  const ox = -(t * 10 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.5 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 4 + randomAt(11584, h * 4 + 1) * 4,
        off = randomAt(11584, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      paintCell(g, conf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      paintCell(g, conf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  // Confetti bar clusters, screen blend, size and reach tied to distance from centre.
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 340; i++) {
    const e = introFor(2000 + i, intro, 420);
    if (!e.active) continue;
    const P = 5 + randomAt(11585, i * 7 + 1) * 5,
      off = randomAt(11585, i * 7 + 2) * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const c = confConf(i, ep),
      m = reactive ? controls.at(t - 0.03 - c.a) : quiet;
    const spin = t * 0.03 * (1 + 0.4 * m.slow.mid),
      x = cx + (Math.cos(c.a + spin) * c.cr) / 2,
      y = cy + (Math.sin(c.a + spin) * c.cr) / 2;
    if (x < -140 || x > W + 140 || y < -140 || y > H + 140) continue;
    const k = ease(fr / 0.3) * e.scale;
    if (k <= 0.004) continue;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(c.rot);
    g.globalAlpha = k;
    for (const b of c.bars) {
      g.fillStyle =
        ['rgba(255,40,40,', 'rgba(40,255,100,', 'rgba(40,110,255,'][b.ch] +
        Math.min(1, (b.alpha * 0.7 + 0.3) * (1 + 0.4 * m.fast.rms)) +
        ')';
      g.fillRect(b.x - b.w / 2, b.y, b.w, c.rg);
    }
    g.restore();
  }
  // Concentric ring target, difference blend, cached and blurred/posterized once per epoch.
  g.globalCompositeOperation = 'difference';
  const er = introFor(3000, intro, 420);
  if (er.active) {
    const P = 6 + randomAt(11586, 1) * 3,
      ep = Math.floor(t / P),
      rings = buildRings(ep);
    const pulse = 1 + 0.05 * Math.sin(t * 0.5) + 0.08 * mBase.slow.bass;
    g.save();
    g.translate(cx + er.dx, cy + er.dy);
    g.rotate(t * 0.02);
    g.scale(er.scale * pulse, er.scale * pulse);
    g.drawImage(rings, -HR, -HR);
    g.restore();
  }
  // Dark occlusion bars, normal blend.
  g.globalCompositeOperation = 'source-over';
  for (let i = 0; i < OCC; i++) {
    const e = introFor(4000 + i, intro, 400);
    if (!e.active) continue;
    const b = occ[i];
    g.globalAlpha = Math.min(1, b.base * 0.85 + 0.12 * Math.sin(t * 0.7 + b.ph)) * e.scale;
    g.fillStyle = '#000000';
    g.fillRect(b.x - b.w / 2 + e.dx, b.y - b.h / 2 + e.dy, b.w, b.h);
  }
  g.globalAlpha = 1;
  g.restore();
  return s;
}
