import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 170,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 70;
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
// One stack's recipe for one "epoch": a pure function of (stack, epoch), so any frame's picture is
// reproducible from time alone. A stack is `v` (2, 4 or 8) nested hexagon "cubes" shrinking evenly
// from `mxr` down to `mxr/v`; each ring gets its own small rotation jitter and its own flip-rate
// and flip-phase (used below to spin the ring continuously through face-on/edge-on/face-on rather
// than the source's one-shot random mirror).
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11635, key * 40 + k);
  const mxr = S / 8 + r(0) * (S / 3.5 - S / 8),
    v = [2, 4, 8][Math.floor(r(1) * 3)];
  const rings = Array.from({ length: v }, (_, k) => ({
    jitter: ((r(10 + k * 4) * 2 - 1) * 6 * Math.PI) / 180,
    flipRate: 0.3 + r(11 + k * 4) * 0.5,
    flipPhase: r(12 + k * 4) * TAU,
    rotJit: r(13 + k * 4) * TAU,
  }));
  const c = { mxr, v, rings };
  if (cache.size > 6000) cache.clear();
  cache.set(key, c);
  return c;
}
// One ring: a flat-topped hexagon (matching the source's own vertex loop) with three internal
// face-diagonals from alternating vertices to the centre, giving the isometric-cube illusion. The
// ring continuously flips through face-on/edge-on/face-on via a smooth cosine, and its fill/stroke
// swap exactly at the edge-on moment -- the source's static fifty-fifty mirror and fill choice,
// turned into a genuine animation rather than a one-shot snapshot.
function ring(g, ro, r, t, jitterGain) {
  const flip = Math.cos(t * ro.flipRate + ro.flipPhase),
    blackFill = flip >= 0;
  g.save();
  g.rotate(ro.jitter * jitterGain - Math.PI / 2);
  g.scale(1, Math.max(0.06, Math.abs(flip)) * Math.sign(flip || 1));
  g.beginPath();
  for (let k = 0; k <= 6; k++) {
    const a = (k * Math.PI) / 3,
      x = (r / 2) * Math.cos(a),
      y = (r / 2) * Math.sin(a);
    k === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = blackFill ? '#000000' : '#ffffff';
  g.fill();
  g.strokeStyle = blackFill ? '#ffffff' : '#000000';
  g.lineWidth = Math.max(0.4, r / 80);
  g.stroke();
  g.beginPath();
  for (const k of [1, 3, 5]) {
    const a = (k * Math.PI) / 3;
    g.moveTo((r / 2) * Math.cos(a), (r / 2) * Math.sin(a));
    g.lineTo(0, 0);
  }
  g.stroke();
  g.restore();
}
function stack(g, c, k, t, jitterGain) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (let n = 0; n < c.v; n++) {
    const rr = c.mxr - n * (c.mxr / c.v);
    ring(g, c.rings[n], rr, t, jitterGain);
  }
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11636, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 8 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.05 + Fr(i, 8) * 0.08),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) {
    const R = 0.9 * S * (1 + 0.04 * Math.sin(t * 0.15) + 0.03 * mBase.slow.bass);
    const grad = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#000000');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
    g.restore();
  }
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 5 * f.k * t, PW) + 15 * Math.sin(t * 0.21 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, PH) + 15 * Math.cos(t * 0.18 + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.5 * m.fast.high) * (1 + s.motion * 0.2);
    const scale = e.scale * (1 + 0.06 * Math.sin(t * 0.5 + f.ph) + 0.07 * m.slow.bass);
    const jitterGain = 1 + 0.4 * m.impulse * s.impulse;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    stack(g, conf(i, ep - 1), 1 - ease(fr / 0.16), t, jitterGain);
    stack(g, conf(i, ep), ease(fr / 0.3), t, jitterGain);
    g.restore();
  }
  g.restore();
  return s;
}
