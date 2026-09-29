import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = S / 3,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 34,
  RINGS = 20;
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
// One target's recipe for one "epoch": a pure function of (target, epoch), so any frame's picture
// is reproducible from time alone. Only the outer radius is re-rolled per epoch; a target's spin
// rate and starting tilt are fixed for its whole lifetime (set once in `field` below), so the spin
// reads as continuous motion straight through an epoch's crossfade rather than snapping.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11629, key * 20 + k);
  const mr = S / 7 + r(0) * (S / 2.6 - S / 7);
  const c = { mr };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
// A single nested-square target: `RINGS` concentric axis-aligned squares shrinking from `mr` down
// to 0, stroke weight increasing toward the centre -- thin at the rim, thick at the core -- the
// source's own `map(rr, mr, 0, 0, rg/3)` relationship, kept exactly. A gentle per-ring radial
// wobble (centroid-driven) and an impulse-driven punch on the thickest core rings are the only
// additions; everything else about the sizing curve is unchanged.
function target(g, c, t, m, ph, k, spin, punch) {
  if (k <= 0.004) return;
  const mr = c.mr * k * (1 + 0.06 * m.slow.bass),
    rg = mr / RINGS;
  const wob = 1 + 0.05 * m.fast.centroid * Math.sin(t * 3 + ph);
  g.save();
  g.globalAlpha = k;
  g.rotate(spin);
  for (let rr = mr; rr >= 0; rr -= rg) {
    const lw = (1 - rr / mr) * (rg / 3) * (1 + punch * (1 - rr / mr));
    if (lw <= 0.05) continue;
    const rrw = rr * wob;
    g.lineWidth = lw;
    g.strokeRect(-rrw / 2, -rrw / 2, rrw, rrw);
  }
  g.restore();
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11630, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.08 + Fr(i, 8) * 0.14),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.strokeStyle = '#000000';
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 6 * f.k * t, PW) + 16 * Math.sin(t * 0.22 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 5 * f.k * t, PH) + 16 * Math.cos(t * 0.19 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.5 * m.fast.high) * (1 + s.motion * 0.2);
    const punch = m.impulse * s.impulse * 0.6;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(e.scale, e.scale);
    target(g, conf(i, ep - 1), t, m, f.ph, 1 - ease(fr / 0.16), spin, punch);
    target(g, conf(i, ep), t, m, f.ph, ease(fr / 0.3), spin, punch);
    g.restore();
  }
  g.restore();
  return s;
}
