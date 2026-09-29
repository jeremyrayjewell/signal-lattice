import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 30,
  N = 150,
  K = 9;
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
const CX = W / 2,
  CY = H / 2,
  VR = Math.hypot(CX, CY);
// The vignette (white centre fading to black at the corners) is sampled directly rather than via
// pixel reads, both for the background wash and for the dot grid's own tone -- the source samples
// the rendered canvas pixel-by-pixel with get(); this is the same continuous function evaluated
// analytically.
const vignette = (x, y) => {
  const d = Math.min(1, Math.hypot(x - CX, y - CY) / VR);
  return Math.round(mix(255, 0, d));
};
const cache = new Map();
// A ripple drop's recipe for one "epoch": a pure function of (drop, epoch) -- position, reach,
// tone and the noise seed its rings wobble by, so any frame's picture is reproducible from time
// alone even though the rings themselves are genuinely animated (see ring() below).
// Drops cluster loosely around a handful of hotspots, plus a scattered remainder, so the ripples
// pool into an overlapping mass in a few places rather than spreading evenly thin across the frame.
const HOTSPOTS = Array.from({ length: 5 }, (_, k) => ({
  x: randomAt(11613, k * 2) * W,
  y: randomAt(11613, k * 2 + 1) * H,
}));
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11611, key * 20 + k);
  const clustered = r(6) < 0.62,
    hs = HOTSPOTS[Math.floor(r(7) * HOTSPOTS.length)];
  const x = clustered ? Math.max(0, Math.min(W, hs.x + (r(0) * 2 - 1) * S * 0.32)) : r(0) * W;
  const y = clustered ? Math.max(0, Math.min(H, hs.y + (r(1) * 2 - 1) * S * 0.32)) : r(1) * H;
  const c = {
    x,
    y,
    R: S / 5 + (r(2) * S) / 4,
    white: r(3) < 0.5,
    seed: Math.floor(r(4) * 1e6),
    period: 2 + r(5) * 1.6,
  };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
// Rings genuinely expand from the drop point and fade as they travel outward, like real ripples
// on water, rather than a static snapshot of concentric circles.
function ring(g, c, t, m, k) {
  if (k <= 0.004) return;
  g.strokeStyle = c.white ? '#ffffff' : '#000000';
  const reach = c.R * (1 + 0.08 * m.slow.bass);
  for (let ri = 0; ri < K; ri++) {
    const phase = (((t / c.period + ri / K) % 1) + 1) % 1,
      radius = phase * reach * k;
    if (radius < 1) continue;
    const alpha = (1 - phase * 0.85) * (1 - phase * 0.85) * k;
    if (alpha <= 0.015) continue;
    g.globalAlpha = Math.min(1, alpha * 1.15);
    g.lineWidth = Math.max(0.6, 2.6 * (1 - phase * 0.55) * (1 + 0.35 * m.fast.centroid));
    g.beginPath();
    for (let a2 = 0; a2 <= 64; a2++) {
      const ang = (a2 / 64) * TAU,
        wob = 1 + 0.02 * vn(c.seed, ang * 3 + phase * 5) * (1 + 0.6 * m.fast.high);
      const px = c.x + Math.cos(ang) * radius * wob,
        py = c.y + Math.sin(ang) * radius * wob;
      a2 === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) {
    p.background('#ffffff');
    const grad = g.createRadialGradient(CX, CY, 0, CX, CY, VR);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#000000');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);
  }
  g.save();
  const cols = Math.round(W / G),
    rows = Math.round(H / G);
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 4096 + row,
        e = introFor((((col % 20) + 20) % 20) * 14 + (((row % 12) + 12) % 12), intro, 340);
      if (!e.active) continue;
      const x = col * G + G / 2,
        y = row * G + G / 2,
        tone = vignette(x, y);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.shadowOffsetX = 0;
      g.shadowOffsetY = 0;
      g.shadowBlur = G / 4;
      g.shadowColor = '#000000';
      g.fillStyle = `rgb(${tone},${tone},${tone})`;
      g.beginPath();
      g.arc(0, 0, G / 1.15 / 2, 0, TAU);
      g.fill();
      g.restore();
    }
  g.shadowBlur = 0;
  g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < N; i++) {
    const e = introFor(3000 + i, intro, 420);
    if (!e.active) continue;
    const P = 8 + randomAt(11612, i * 7 + 1) * 6,
      off = randomAt(11612, i * 7 + 2) * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const c0 = conf(i, ep - 1),
      c1 = conf(i, ep),
      m = reactive ? controls.at(t - 0.03 - (c1.x / W) * 0.16) : quiet;
    ring(g, { ...c0, x: c0.x + e.dx, y: c0.y + e.dy }, t, m, 1 - ease(fr / 0.16));
    ring(g, { ...c1, x: c1.x + e.dx, y: c1.y + e.dy }, t, m, ease(fr / 0.3));
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
