import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 280,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 34;
const cp = ['#0B0A0C', '#2E63E0', '#D42A38', '#F2B82E', '#E4E4E0'];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const cache = new Map();
// One cluster's recipe for one "epoch": a pure function of (cluster, epoch), so any frame's
// picture is reproducible from time alone. A cluster is ten filled cubic-bezier splinters (fully
// independent random control points, closed straight back to the start for fill) in one colour,
// overlapping into a single jagged splash silhouette, plus four thin straight streaks in a second
// colour crossing through it -- both colours and every point are the source's own relationship,
// kept exactly; only the point-level wobble below is an addition beyond the source's static frame.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11640, key * 90 + k);
  const mr = S / 4 + r(0) * (S / 2 - S / 4),
    splashCol = Math.floor(r(1) * cp.length),
    lineCol = Math.floor(r(2) * cp.length);
  const pt = (b, range) => [
    (r(b) * 2 - 1) * range,
    (r(b + 1) * 2 - 1) * range,
    0.3 + r(b + 2) * 0.5,
    r(b + 3) * TAU,
  ];
  const splashes = Array.from({ length: 10 }, (_, j) => {
    const b = 10 + j * 20;
    return [pt(b, mr / 2), pt(b + 4, mr / 2), pt(b + 8, mr / 2), pt(b + 12, mr / 2)];
  });
  const lines = Array.from({ length: 4 }, (_, j) => {
    const b = 220 + j * 10;
    return [pt(b, mr), pt(b + 4, mr)];
  });
  const c = { mr, splashCol, lineCol, splashes, lines };
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
function wob(g2, t, wg) {
  const [x, y, rate, ph] = g2;
  return [x + wg * Math.sin(t * rate + ph), y + wg * Math.cos(t * rate * 1.1 + ph + 1.7)];
}
function cluster(g, c, t, k, lw, wg) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.fillStyle = cp[c.splashCol];
  for (const s of c.splashes) {
    const [p1, p2, p3, p4] = s.map((pp) => wob(pp, t, wg));
    g.beginPath();
    g.moveTo(p1[0], p1[1]);
    g.bezierCurveTo(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = cp[c.lineCol];
  g.lineWidth = lw;
  for (const ln of c.lines) {
    const [p1, p2] = ln.map((pp) => wob(pp, t, wg));
    g.beginPath();
    g.moveTo(p1[0], p1[1]);
    g.lineTo(p2[0], p2[1]);
    g.stroke();
  }
  g.globalAlpha = 1;
}
const ease = (q) => {
  q = Math.max(0, Math.min(1, q));
  return q * q * (3 - 2 * q);
};
const Fr = (i, k) => randomAt(11641, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 8 + Fr(i, 3) * 7,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.03 + Fr(i, 8) * 0.05),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 4 * f.k * t, PW) + 13 * Math.sin(t * 0.16 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 3 * f.k * t, PH) + 13 * Math.cos(t * 0.13 + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.5 * m.fast.high) * (1 + s.motion * 0.2);
    const scale = e.scale * (1 + 0.05 * Math.sin(t * 0.4 + f.ph) + 0.06 * m.slow.bass);
    const lw = Math.max(0.6, (S / 450) * (1 + 0.8 * m.impulse * s.impulse));
    const wg = 3 + 7 * m.fast.centroid;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    cluster(g, conf(i, ep - 1), t, 1 - ease(fr / 0.16), lw, wg);
    cluster(g, conf(i, ep), t, ease(fr / 0.3), lw, wg);
    g.restore();
  }
  g.restore();
  return s;
}
