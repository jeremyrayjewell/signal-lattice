import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  MR = S / 8,
  M = 110,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 3000,
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
const Fr = (i, k) => randomAt(11559, i * 61 + k);
// Domes live on a wrapped field slightly larger than the frame, each with its own drift factor (parallax).
const items = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.6 + Fr(i, 2) * 0.8,
  life: 6 + Fr(i, 3) * 6,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
// 18 x 10 cells of inversion blobs, one per grid cell (the source's tenth-of-frame grid, extended to the wide frame).
const G = S / 10,
  blobs = Array.from({ length: 18 * 10 }, (_, i) => ({
    cx: ((i % 18) + 0.5) * G,
    cy: (Math.floor(i / 18) + 0.5) * G,
    cr: G / 3 + (Fr(i, 20) * G * 2) / 3,
    ph: Fr(i, 21) * TAU,
    ox: Fr(i, 22) * 2 - 1,
    oy: Fr(i, 23) * 2 - 1,
  }));
const cache = new Map();
// One dome's look for one "epoch": a pure function of (dome, epoch), so any frame can be drawn alone.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11560, key * 16 + k);
  const c = {
    rot: ((r(0) * 40 - 20) * Math.PI) / 180,
    flip: r(1) < 0.5 ? -1 : 1,
    sw: r(2) < 0.5 ? 0 : 1,
    rate: (r(3) < 0.5 ? -1 : 1) * (0.5 + r(4) * 1.6),
    phase: r(5) * 20,
  };
  if (cache.size > 12000) cache.clear();
  cache.set(key, c);
  return c;
}
// A dome is twenty-one nested circles, biggest first, alternating black and white; each smaller circle sits
// higher, so the stack pinches to an apex. Sliding the ring positions by a fraction of a ring (and flipping the
// alternation every whole ring) streams the stripes along the dome without any visible seam.
function dome(g, c, x, y, k, t, m, ph, kick) {
  if (k <= 0.004) return;
  const mr = MR * k * (1 + 0.08 * m.slow.bass),
    rg = mr / RINGS,
    phi = c.rate * t + c.phase + 1.6 * m.slow.mid,
    F = Math.floor(phi),
    fr = phi - F;
  g.save();
  g.translate(x, y);
  g.rotate(c.rot + 0.1 * Math.sin(t * 0.4 + ph) + 0.04 * m.fast.high * Math.sin(t * 7 + ph) + kick);
  g.scale(1, c.flip);
  for (let j = 0; j <= RINGS; j++) {
    const d = Math.min(mr, mr - (j - fr) * rg);
    if (d <= 0) continue;
    g.fillStyle = (j + F + c.sw) & 1 ? '#ffffff' : '#000000';
    g.beginPath();
    g.arc(0, d - mr, d / 2, 0, TAU);
    g.fill();
  }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const bands = Array.from({ length: 12 }, (_, k) =>
    reactive ? controls.at(t - 0.03 - (k / 11) * 0.16) : quiet,
  );
  const at = (x) => bands[Math.max(0, Math.min(11, Math.floor((x / W) * 11 + 0.5)))];
  const wob = 8 + 14 * s.motion,
    pace = intro ** 4,
    lap = (v, P) => (((v % P) + P) % P) - M;
  g.save();
  for (let i = 0; i < N; i++) {
    const f = items[i],
      e = introFor(i, pace, 420);
    const x = lap(f.x - 10 * f.k * t, PW) + wob * Math.sin(t * 0.37 * (0.6 + f.k) + f.ph),
      y = lap(f.y + 15 * f.k * t, PH) + wob * Math.cos(t * 0.31 + f.ph);
    if (!e.active || x < -110 || x > W + 110 || y < -110 || y > H + 110) continue;
    const u = (t + f.off * f.life) / f.life,
      ep = Math.floor(u),
      fr = u - ep,
      m = at(x),
      kick = 0.2 * m.impulse * s.impulse * Math.sin(t * 6 + f.ph);
    // Old dome shrinks away while the new one grows in.
    dome(g, conf(i, ep - 1), x + e.dx, y + e.dy, (1 - ease(fr / 0.16)) * e.scale, t, m, f.ph, kick);
    dome(g, conf(i, ep), x + e.dx, y + e.dy, ease(fr / 0.3) * e.scale, t, m, f.ph, kick);
  }
  // Difference blend with white inverts whatever lies beneath, so blobs flip the stripes inside them.
  g.globalCompositeOperation = 'difference';
  g.fillStyle = '#ffffff';
  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i],
      e = introFor(i + N, pace, 420);
    if (!e.active) continue;
    const m = at(b.cx),
      r = (b.cr * (1 + 0.22 * Math.sin(t * 0.8 + b.ph) + 0.12 * m.slow.bass) * e.scale) / 2;
    const x = b.cx + G * 0.3 * b.ox * Math.sin(t * 0.35 + b.ph) + e.dx,
      y = b.cy + G * 0.3 * b.oy * Math.cos(t * 0.29 + b.ph) + e.dy;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
