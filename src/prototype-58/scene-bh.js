import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  HALF = Math.PI / 2,
  W = 960,
  H = 540,
  S = 540,
  G = 48;
const CB = 560,
  HC = CB / 2,
  BLOBS = 70;
const cp = [
  '#592818',
  '#C9551A',
  '#1A2A43',
  '#B08F31',
  '#CFD69C',
  '#5A6478',
  '#406F4E',
  '#4B3C3B',
  '#1B111A',
  '#B4B6AB',
];
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
const fbm = (seed, x) => 0.6 * vn(seed, x) + 0.4 * vn(seed + 1, x * 2.13 + 5.7);
const cols = Math.ceil(W / G) + 1,
  rows = Math.ceil(H / G) + 1,
  cells = Array.from({ length: cols * rows }, (_, i) => ({
    col: i % cols,
    row: Math.floor(i / cols),
    ph: randomAt(11571, i * 7) * TAU,
  }));
// A cloud pass's blob recipe for one "epoch": a pure function of (pass, epoch), so any frame's
// cloud is reproducible from time alone. Building it (many overlapping noise-path ellipses) is
// the expensive part, so the finished result is cached per (pass, epoch) rather than redrawn.
const cloudCache = new Map();
function buildCloud(pass, e) {
  const key = pass * 4000 + e,
    hit = cloudCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = CB;
  canvas.height = CB;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, CB, CB);
  for (let i = 0; i < BLOBS; i++) {
    const r = (k) => randomAt(11572, (pass * 9000 + i) * 64 + e * 7 + k);
    const mr = 420 + r(0) * 460,
      seedA = Math.floor(r(1) * 1e6),
      seedB = Math.floor(r(2) * 1e6),
      zn = r(3) * 40;
    g.save();
    g.translate(HC, HC);
    g.rotate(r(4) * TAU);
    g.scale(r(5) < 0.5 ? -1 : 1, r(6) < 0.5 ? -1 : 1);
    g.fillStyle = cp[Math.floor(r(7) * 10)];
    for (let a = 0; a <= HALF; a += 0.028) {
      const vr = mr * (0.75 + 0.25 * fbm(seedA, a * 2.4 + zn)),
        er = Math.max(1, (mr / 10) * (0.15 + 0.85 * Math.abs(fbm(seedB, a * 6 + zn * 0.3))));
      const zx = fbm(seedA + 2, a * 9 + zn),
        zy = fbm(seedB + 2, a * 9 - zn);
      g.beginPath();
      g.arc(
        (vr / 2) * Math.cos(a) + zx * mr * 0.02,
        (vr / 2) * Math.sin(a) + zy * mr * 0.02,
        er,
        0,
        TAU,
      );
      g.fill();
    }
    g.restore();
  }
  if (pass === 2) {
    // pass C is blurred once, baked into the cache, before it is ever composited
    const blurred = document.createElement('canvas');
    blurred.width = CB;
    blurred.height = CB;
    const bg2 = blurred.getContext('2d');
    bg2.filter = `blur(${G / 1.6}px)`;
    bg2.drawImage(canvas, 0, 0);
    cloudCache.set(key, blurred);
    if (cloudCache.size > 200) cloudCache.clear();
    return blurred;
  }
  cloudCache.set(key, canvas);
  if (cloudCache.size > 200) cloudCache.clear();
  return canvas;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  g.save();
  // Fine mosaic grid: a scattered half-occupancy field of solid palette tiles under everything.
  for (const c of cells) {
    const id = (((c.col % 14) + 14) % 14) * 10 + (((c.row % 8) + 8) % 8),
      e = introFor(id, intro, 340);
    if (!e.active) continue;
    const clock = Math.floor((t + c.ph) * 0.8);
    if (randomAt(11573, c.col * 97 + c.row * 13 + clock) > 0.5) continue;
    const x = c.col * G + G / 2,
      y = c.row * G + G / 2;
    g.globalAlpha = e.scale;
    g.fillStyle = cp[Math.floor(randomAt(11573, c.col * 97 + c.row * 13 + clock + 3) * 10)];
    g.fillRect(x - G / 2 + e.dx, y - G / 2 + e.dy, G + 1, G + 1);
  }
  g.globalAlpha = 1;
  const cx = W / 2,
    cy = H / 2,
    names = ['A', 'B', 'C'];
  for (let pass = 0; pass < 3; pass++) {
    const e = introFor(700 + pass, intro, 420);
    if (!e.active) continue;
    const P = 7 + randomAt(11574, pass * 11 + 1) * 4,
      ep = Math.floor(t / P),
      cloud = buildCloud(pass, ep);
    // Pass C keeps its literal orientation (no rotation): the source draws it at a smaller, static
    // size against the two full-size passes beneath, and that mismatch is what produces the square
    // frame edge visible in the reference. Passes A/B only sway gently, so that edge stays legible.
    const rot = pass === 2 ? 0 : 0.09 * Math.sin(t * (0.12 + pass * 0.05) + pass * 2);
    const scaleBase = pass === 2 ? 0.833 : 1,
      pulse = 1 + 0.05 * Math.sin(t * 0.6 + pass) + 0.06 * m.slow.bass;
    g.save();
    g.translate(cx + e.dx, cy + e.dy);
    g.rotate(rot);
    g.scale(e.scale * scaleBase * pulse, e.scale * scaleBase * pulse);
    if (pass === 0) {
      g.globalCompositeOperation = 'overlay';
      g.save();
      g.shadowOffsetX = G / 10;
      g.shadowOffsetY = G / 10;
      g.shadowBlur = G * (1 + 0.4 * m.impulse);
      g.shadowColor = '#000000';
      g.drawImage(cloud, -HC, -HC);
      g.restore();
    } else if (pass === 1) {
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 0.55 + 0.15 * m.fast.rms;
      g.drawImage(cloud, -HC, -HC);
      g.globalAlpha = 1;
    } else {
      g.globalCompositeOperation = 'difference';
      g.drawImage(cloud, -HC, -HC);
    }
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  // A single large flowing scribble, reflowing continuously via a sliding noise window (cheap: no
  // caching needed, unlike the clouds above).
  const et = introFor(710, intro, 420);
  if (et.active) {
    g.save();
    g.translate(cx + et.dx, cy + et.dy);
    g.rotate(t * 0.04);
    g.scale(et.scale, et.scale);
    g.strokeStyle = 'rgba(255,255,255,.85)';
    g.lineWidth = Math.max(1, (G / 30) * (1 + 0.5 * m.fast.centroid));
    g.beginPath();
    for (let j = 0; j < 420; j++) {
      const u = (j / 419) * 7 + t * 0.12;
      const px = vn(9001, u) * S * 0.46,
        py = vn(9002, u + 50) * S * 0.46;
      j === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.stroke();
    g.restore();
  }
  g.restore();
  return s;
}
