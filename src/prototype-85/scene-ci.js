import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  MR = S / 5,
  M = MR,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 42;
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
// One tangle's recipe for one "epoch": a pure function of (tangle, epoch), so any frame's picture
// is reproducible from time alone. A tangle is a fixed-size (MR) square grid of horizontal and
// vertical lines, each independently kept or dropped, each wobbling through its own sample points
// -- with most lines kept, the survivors cross into a dense scribbled thread-ball; with few kept,
// a sparse wiry lattice. `v` (the grid's own line count, 4/8/12) sets how coarse or fine that grid
// is, matching the source's own `int(random(1,4))*4`.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11633, key * 400 + k);
  const v = (1 + Math.floor(r(0) * 3)) * 4,
    g = MR / v;
  const hLines = [];
  for (let y = -MR / 2 + g / 2, yi = 0; y <= MR / 2; y += g, yi++) {
    if (r(10 + yi) >= 0.5) continue;
    const pts = [];
    for (let x = -MR / 2 - g / 2, xi = 0; x <= MR / 2 + g; x += g, xi++)
      pts.push([x, y, ((r(200 + yi * 24 + xi) * 2 - 1) * g) / 2]);
    hLines.push(pts);
  }
  const vLines = [];
  for (let x = -MR / 2 + g / 2, xi = 0; x <= MR / 2; x += g, xi++) {
    if (r(700 + xi) >= 0.5) continue;
    const pts = [];
    for (let y = -MR / 2 - g / 2, yi = 0; y <= MR / 2 + g; y += g, yi++)
      pts.push([x, y, ((r(1200 + xi * 24 + yi) * 2 - 1) * g) / 2]);
    vLines.push(pts);
  }
  const c = { v, g, hLines, vLines };
  if (cache.size > 4000) cache.clear();
  cache.set(key, c);
  return c;
}
// A jittered polyline drawn as a smooth wobble (consecutive-midpoint quadratics, the same
// curveVertex approximation used elsewhere in this project, e.g. Scene BE's bundles) rather than
// straight segments.
function wobblyLine(g2, pts, axis, jit) {
  g2.beginPath();
  const at = (p) => (axis === 0 ? [p[0], p[1] + p[2] * jit] : [p[0] + p[2] * jit, p[1]]);
  let prev = at(pts[0]);
  g2.moveTo(prev[0], prev[1]);
  for (let j = 1; j < pts.length; j++) {
    const cur = at(pts[j]),
      mx = (prev[0] + cur[0]) / 2,
      my = (prev[1] + cur[1]) / 2;
    g2.quadraticCurveTo(prev[0], prev[1], mx, my);
    prev = cur;
  }
  g2.lineTo(prev[0], prev[1]);
  g2.stroke();
}
function tangle(g, c, k, jit, lw) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.lineWidth = lw;
  for (const pts of c.hLines) wobblyLine(g, pts, 0, jit);
  for (const pts of c.vLines) wobblyLine(g, pts, 1, jit);
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11634, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 7 + Fr(i, 3) * 7,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.04 + Fr(i, 8) * 0.07),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.strokeStyle = '#ffffff';
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 5 * f.k * t, PW) + 14 * Math.sin(t * 0.2 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, PH) + 14 * Math.cos(t * 0.17 + f.ph);
    if (x < -MR || x > W + MR || y < -MR || y > H + MR) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.6 * m.fast.high) * (1 + s.motion * 0.25);
    const scale = e.scale * (1 + 0.06 * Math.sin(t * 0.5 + f.ph) + 0.05 * m.slow.bass);
    const jit = 1 + 0.4 * m.fast.centroid;
    const lw = Math.max(0.6, (S / 450) * (1 + 0.7 * m.impulse * s.impulse));
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    tangle(g, conf(i, ep - 1), 1 - ease(fr / 0.16), jit, lw);
    tangle(g, conf(i, ep), ease(fr / 0.3), jit, lw);
    g.restore();
  }
  g.restore();
  return s;
}
