import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  GAP = S / 100,
  M = 280,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 32,
  BUBBLES = 50,
  RINGS = 5;
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

// ---- background: fine vertical stripes, width set by a 1D noise walk across the columns, as in
// the source; the noise input also drifts slowly with time so the stripe pattern stays alive.
const stripeCols = Math.ceil(W / GAP) + 2;
function paintStripes(g, t, pulse) {
  g.strokeStyle = '#000000';
  for (let c = 0; c < stripeCols; c++) {
    const x = c * GAP + GAP / 2,
      lw = mix(GAP / 8, GAP, 0.5 + 0.5 * vn(11647, c * 0.14 + t * 0.03)) * pulse;
    g.lineWidth = Math.max(0.4, lw);
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
}

// ---- foreground: a curveVertex scribble loop, a scatter of soft translucent-white "snowball"
// bubbles (each a handful of concentric circles building up opacity toward its centre, standing in
// for the source's own twenty-one), and a stack of four semi-transparent random-primary rectangles
// sharing one rotation, whose slight position jitter shows as coloured edge-fringes where they don't
// fully overlap -- all three the source's own relationships, kept exactly.
const cache = new Map();
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11648, key * 700 + k);
  const rad = S / 4 + r(0) * (S / 2 - S / 4);
  const scribble = Array.from({ length: 20 }, (_, k) => {
    const b = 10 + k * 4;
    return [((r(b) * 2 - 1) * rad) / 2, ((r(b + 1) * 2 - 1) * rad) / 2];
  });
  const scribbleW = 1 + r(200) * (rad / 20 - 1);
  const bubbles = Array.from({ length: BUBBLES }, (_, k) => {
    const b = 210 + k * 6;
    const a = r(b) * TAU,
      sq = Math.sqrt(r(b + 1)),
      er = 1 + r(b + 2) * (rad / 10 - 1);
    return { x: ((sq * rad) / 2) * Math.cos(a), y: ((sq * rad) / 2) * Math.sin(a), er };
  });
  const rectRot = ((r(600) * 2 - 1) * 20 * Math.PI) / 180,
    yrr = rad / 8 + r(601) * (rad / 4 - rad / 8);
  const rects = Array.from({ length: 4 }, (_, k) => {
    const b = 610 + k * 10;
    const cr = r(b) < 0.5 ? 0 : 255,
      cg = r(b + 1) < 0.5 ? 0 : 255,
      cb = r(b + 2) < 0.5 ? 0 : 255;
    const ox = ((r(b + 3) * 2 - 1) * rad) / 30,
      oy = ((r(b + 4) * 2 - 1) * rad) / 30;
    return { cr, cg, cb, ox, oy };
  });
  const c = { rad, scribble, scribbleW, bubbles, rectRot, yrr, rects };
  if (cache.size > 4000) cache.clear();
  cache.set(key, c);
  return c;
}
function drawScribble(g, c, k, punch) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.strokeStyle = '#000000';
  g.lineWidth = c.scribbleW * (1 + 0.4 * punch);
  const pts = c.scribble;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let j = 1; j < pts.length; j++) {
    const p0 = pts[j - 1],
      p1 = pts[j],
      mx = (p0[0] + p1[0]) / 2,
      my = (p0[1] + p1[1]) / 2;
    g.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  g.stroke();
  g.globalAlpha = 1;
}
function drawBubbles(g, c, k, pulse) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (const b of c.bubbles) {
    const er = b.er * pulse;
    for (let ri = 0; ri < RINGS; ri++) {
      const rr = er * (1 - ri / RINGS);
      if (rr <= 0.15) continue;
      g.fillStyle = `rgba(255,255,255,${(0.05 + ri * 0.055).toFixed(3)})`;
      g.beginPath();
      g.arc(b.x, b.y, rr / 2, 0, TAU);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}
function drawRects(g, c, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.save();
  g.rotate(c.rectRot);
  for (const rc of c.rects) {
    g.fillStyle = `rgba(${rc.cr},${rc.cg},${rc.cb},.78)`;
    g.fillRect(rc.ox - c.rad / 4, rc.oy - c.yrr / 2, c.rad / 2, c.yrr);
  }
  g.restore();
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11649, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 8 + Fr(i, 3) * 7,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.02 + Fr(i, 8) * 0.03),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) {
    p.background('#ffffff');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    paintStripes(g, t, 1 + 0.15 * mBase.fast.high);
    g.restore();
  }
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 4 * f.k * t, PW) + 13 * Math.sin(t * 0.18 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 3 * f.k * t, PH) + 13 * Math.cos(t * 0.15 + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.4 * m.fast.high) * (1 + s.motion * 0.2);
    const scale = e.scale * (1 + 0.05 * Math.sin(t * 0.4 + f.ph) + 0.06 * m.slow.bass);
    const punch = m.impulse * s.impulse,
      pulse = 1 + 0.15 * Math.sin(t * 0.6 + f.ph) + 0.1 * m.slow.bass;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    const c0 = conf(i, ep - 1),
      c1 = conf(i, ep);
    drawBubbles(g, c0, 1 - ease(fr / 0.16), pulse);
    drawScribble(g, c0, 1 - ease(fr / 0.16), punch);
    drawRects(g, c0, 1 - ease(fr / 0.16));
    drawBubbles(g, c1, ease(fr / 0.3), pulse);
    drawScribble(g, c1, ease(fr / 0.3), punch);
    drawRects(g, c1, ease(fr / 0.3));
    g.restore();
  }
  g.restore();
  return s;
}
