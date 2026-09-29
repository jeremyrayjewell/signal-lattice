import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
  W = 960,
  H = 540,
  S = 540,
  M = S / 2,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 36,
  RINGS = 40;
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
// One burst's recipe for one "epoch": a pure function of (burst, epoch). Each of forty nested
// rings has its own rotation offset, and those offsets accumulate ring to ring exactly as the
// source's un-reset `rotate()` calls do, giving the layered, twisting spiky-star look.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11627, key * 90 + k);
  const mr = S / 6 + r(0) * (S / 2 - S / 6),
    tone = Math.round(r(1) * 120);
  let acc = 0;
  const cum = new Float32Array(RINGS + 1);
  for (let k = 0; k < RINGS; k++) {
    acc += r(10 + k) * TAU;
    cum[k] = acc;
  }
  const c = { mr, tone, cum };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
// A single ring: an asymmetric six-vertex wedge over one quarter turn, closed across the chord --
// alternating between a short and a long radius per vertex is what gives each ring its jagged,
// spiky-star edge, not a smooth arc.
function wedge(g, r2) {
  g.beginPath();
  for (let k = 0; k <= 4; k++) {
    const a = k * 22.5 * DEG,
      nr = (k % 2 === 0 ? r2 * 0.5 : r2) / 2;
    const x = nr * Math.cos(a),
      y = nr * Math.sin(a);
    k === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
}
function burst(g, c, t, m, ph, k, spin) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (let ri = 0; ri < RINGS; ri++) {
    const rad =
      c.mr *
      (1 - ri / RINGS) *
      (1 + 0.04 * Math.sin(t * 0.8 + ph + ri * 0.2) * (1 + 0.4 * m.fast.high));
    if (rad <= 0.5) continue;
    g.fillStyle = ri % 2 === 0 ? `rgb(${c.tone},${c.tone},${c.tone})` : '#ffffff';
    g.save();
    g.rotate(c.cum[ri] + t * spin * (ri % 2 ? 1 : -1) * (1 + 0.3 * m.slow.mid));
    wedge(g, rad);
    g.restore();
  }
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11628, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin: (Fr(i, 6) < 0.5 ? -1 : 1) * (0.03 + Fr(i, 7) * 0.05),
}));
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.globalCompositeOperation = 'difference';
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 6 * f.k * t, PW) + 18 * Math.sin(t * 0.24 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, PH) + 18 * Math.cos(t * 0.2 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(e.scale, e.scale);
    burst(g, conf(i, ep - 1), t, m, f.ph, 1 - ease(fr / 0.16), f.spin);
    burst(g, conf(i, ep), t, m, f.ph, ease(fr / 0.3), f.spin);
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
