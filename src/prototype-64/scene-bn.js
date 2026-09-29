import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
  W = 960,
  H = 540,
  S = 540,
  M = S / 4,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 200;
const AG = 3.6,
  TURNS = 22,
  STEPS = TURNS * 100;
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
// A spiral instance is deterministic once seeded -- a slowly shrinking ring of tiny squares
// spiralling inward over many turns, exactly reproducing the source's shape logic -- so each one
// is rendered once per epoch into a private cached canvas rather than every frame.
const BUILD = 0.32,
  CB = 148,
  HC = CB / 2,
  cache = new Map();
function buildSpiral(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11596, key * 20 + k);
  const mr = S / 4 + (r(0) * S) / 4,
    mxr = 1 + r(1) * (mr / 30 - 1),
    strokeMode = r(2) < 0.5,
    tone = Math.round(r(3) * 220);
  const rSeed = Math.floor(r(4) * 1e6),
    aSeed = Math.floor(r(5) * 1e6),
    rn0 = r(6) * 40,
    an0 = r(7) * 40;
  const canvas = document.createElement('canvas');
  canvas.width = CB;
  canvas.height = CB;
  const g = canvas.getContext('2d');
  g.fillStyle = `rgb(${tone},${tone},${tone})`;
  g.strokeStyle = `rgb(${tone},${tone},${tone})`;
  g.translate(HC, HC);
  g.scale(BUILD, BUILD);
  for (let k = 0; k <= STEPS; k++) {
    const q = k / STEPS,
      a = k * AG * DEG,
      wr = mix(mr, 0, q),
      rr = mix(mxr, 0, q);
    const sr = (vn(rSeed, rn0 + k * 0.1) * mr) / 4,
      ada = vn(aSeed, an0 + k * 0.1) * AG * 2 * DEG;
    const rad = wr / 2 + sr,
      x = Math.cos(a + ada) * rad,
      y = Math.sin(a + ada) * rad;
    if (strokeMode) {
      g.lineWidth = Math.max(0.3, rr / 10 / BUILD);
      g.strokeRect(x - rr / 2, y - rr / 2, rr, rr);
    } else g.fillRect(x - rr / 2, y - rr / 2, rr, rr);
  }
  if (cache.size > 4000) cache.clear();
  cache.set(key, canvas);
  return canvas;
}
const Fr = (i, k) => randomAt(11597, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 5,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
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
    const x = lap(f.x + 9 * f.k * t, PW) + 16 * Math.sin(t * 0.28 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 7 * f.k * t, PH) + 16 * Math.cos(t * 0.24 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const rot = t * 0.03 * (1 + 0.3 * m.slow.mid) * (i % 2 ? 1 : -1),
      pulse = 1 + 0.06 * Math.sin(t * 0.6 + f.ph) + 0.08 * m.slow.bass;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(rot);
    g.scale((e.scale * pulse) / BUILD, (e.scale * pulse) / BUILD);
    const alpha = 0.65 + 0.3 * m.fast.high;
    const drawE = (ep2, k) => {
      if (k <= 0.004) return;
      g.globalAlpha = alpha * k;
      g.drawImage(buildSpiral(i, ep2), -HC, -HC);
    };
    drawE(ep - 1, 1 - ease(fr / 0.16));
    drawE(ep, ease(fr / 0.3));
    g.globalAlpha = 1;
    g.restore();
  }
  g.restore();
  return s;
}
