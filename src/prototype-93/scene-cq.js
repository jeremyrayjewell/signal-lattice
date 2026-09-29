import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 380,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 32,
  PTS = 200;
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
// One cluster's recipe for one "epoch": a pure function of (cluster, epoch), so any frame's
// picture is reproducible from time alone. A cluster is a coiled-spring curve -- a sine wave of
// four periods across a fixed radius, traced by many thin stroked rings whose diameter grows
// linearly from nothing to a tenth of that radius -- in one colour or, in the source's own other
// mode, each ring independently grey; plus one solid red-or-black accent rectangle.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11642, key * 420 + k);
  const rad = S / 3 + r(0) * (S / 1.5 - S / 3),
    rotK = Math.floor(r(1) * 4),
    flipX = r(2) < 0.5 ? -1 : 1,
    flipY = r(3) < 0.5 ? -1 : 1;
  const uniform = r(4) < 0.5,
    soloCol = r(5) < 0.5 ? '#000000' : '#ffffff';
  const rings = uniform
    ? null
    : Array.from({ length: PTS + 1 }, (_, j) => Math.round(r(10 + j) * 255));
  const rectRed = r(300) < 0.5,
    rectX = (r(301) * 2 - 1) * rad,
    rectY = (r(302) * 2 - 1) * rad,
    vx = r(303) < 0.5 ? 1 : 2,
    vy = r(304) < 0.5 ? 1 : 2;
  const c = { rad, rotK, flipX, flipY, uniform, soloCol, rings, rectRed, rectX, rectY, vx, vy };
  if (cache.size > 4000) cache.clear();
  cache.set(key, c);
  return c;
}
function coil(g, c, t, k, flow, punch) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.lineWidth = Math.max(0.4, (c.rad / 260) * (1 + 0.5 * punch));
  for (let j = 0; j <= PTS; j++) {
    const u = j / PTS,
      cx = (u - 0.5) * c.rad,
      a = u * 4 * TAU + t * flow,
      cy = (c.rad / 8) * Math.sin(a),
      er = u * (c.rad / 10) * (1 + 0.4 * punch);
    if (er <= 0.2) continue;
    g.strokeStyle = c.uniform ? c.soloCol : `rgb(${c.rings[j]},${c.rings[j]},${c.rings[j]})`;
    g.beginPath();
    g.arc(cx, cy, er / 2, 0, TAU);
    g.stroke();
  }
  g.globalAlpha = 1;
}
function accent(g, c, k, t, pulse) {
  if (k <= 0.004) return;
  g.globalAlpha = k * 0.75;
  g.fillStyle = c.rectRed ? '#e0102a' : '#000000';
  const w2 = (c.rad / 3 / c.vx) * pulse,
    h2 = (c.rad / 3 / c.vy) * pulse;
  g.fillRect(c.rectX - w2 / 2, c.rectY - h2 / 2, w2, h2);
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11643, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 8 + Fr(i, 3) * 7,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.02 + Fr(i, 8) * 0.04),
  flowRate: (Fr(i, 10) < 0.5 ? -1 : 1) * (0.4 + Fr(i, 11) * 0.6),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 4 * f.k * t, PW) + 14 * Math.sin(t * 0.15 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 3 * f.k * t, PH) + 14 * Math.cos(t * 0.12 + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.4 * m.fast.high) * (1 + s.motion * 0.2);
    const scale = e.scale * (1 + 0.05 * Math.sin(t * 0.35 + f.ph) + 0.08 * m.slow.bass);
    const flow = f.flowRate * (1 + 0.6 * m.fast.high);
    const punch = m.impulse * s.impulse;
    const pulse = 1 + 0.1 * Math.sin(t * 0.5 + f.ph) + 0.08 * m.slow.bass;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    const c0 = conf(i, ep - 1),
      c1 = conf(i, ep);
    g.save();
    g.rotate((c0.rotK * Math.PI) / 2);
    g.scale(c0.flipX, c0.flipY);
    coil(g, c0, t, 1 - ease(fr / 0.16), flow, punch);
    accent(g, c0, 1 - ease(fr / 0.16), t, pulse);
    g.restore();
    g.save();
    g.rotate((c1.rotK * Math.PI) / 2);
    g.scale(c1.flipX, c1.flipY);
    coil(g, c1, t, ease(fr / 0.3), flow, punch);
    accent(g, c1, ease(fr / 0.3), t, pulse);
    g.restore();
    g.restore();
  }
  g.restore();
  return s;
}
