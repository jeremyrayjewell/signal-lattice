import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = S / 3,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N1 = 110,
  N2 = 110;
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

// Ink blots: many overlapping wavy scanlines with large, noise-driven vertical jitter, low alpha,
// accumulate into a blotchy, Rorschach-like fill rather than a clean rectangle. Built at a third
// of final size and scaled up (as in Scene BN), since each sprite needs many overlapping strokes.
const BLD = 0.34,
  BB = 160,
  inkCache = new Map();
function buildInk(i, e) {
  const key = i * 512 + e + 64,
    hit = inkCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11622, key * 40 + k);
  const rr = S / 4 + (r(0) * S) / 4,
    tone = r(1) < 0.5 ? '#000000' : '#ffffff',
    seedY = Math.floor(r(2) * 1e6),
    rot = (Math.floor(r(3) * 4) * Math.PI) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = BB;
  canvas.height = BB;
  const g = canvas.getContext('2d');
  g.translate(BB / 2, BB / 2);
  g.rotate(rot);
  g.scale(BLD, BLD);
  g.fillStyle = tone;
  g.globalAlpha = 0.16;
  const lines = 30,
    cols = 14;
  for (let li = 0; li < lines; li++) {
    const cy = (li / (lines - 1)) * rr - rr / 2;
    g.beginPath();
    for (let ci = 0; ci <= cols; ci++) {
      const cx = (ci / cols) * rr - rr / 2,
        ady = vn(seedY, ci * 1.3 + li * 0.31) * rr * 0.42;
      const px = cx,
        py = cy + ady;
      ci === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.lineWidth = rr / 28;
    g.strokeStyle = tone;
    g.stroke();
  }
  g.globalAlpha = 1;
  if (inkCache.size > 4000) inkCache.clear();
  inkCache.set(key, { canvas, rr });
  return { canvas, rr };
}
// Noise clouds: a dense scatter of tiny squares clustered in a soft ring/blob around the centre,
// single tone, per-square alpha -- also cached at reduced resolution per epoch.
const cloudCache = new Map();
function buildCloud(i, e) {
  const key = i * 512 + e + 64,
    hit = cloudCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11623, key * 260 + k);
  const mr = S / 2 + (r(0) * S) / 2,
    tone = r(1) < 0.5 ? '#000000' : '#ffffff',
    sign = r(2) < 0.5 ? -1 : 1;
  const canvas = document.createElement('canvas');
  canvas.width = BB;
  canvas.height = BB;
  const g = canvas.getContext('2d');
  g.translate(BB / 2, BB / 2);
  g.scale(BLD, BLD);
  g.fillStyle = tone;
  for (let k = 0; k < 260; k++) {
    const b = 10 + k * 4;
    const a = r(b) * TAU,
      cr = sign + r(b + 1) * r(b + 2) * r(b + 3),
      radius = Math.abs((mr / 4) * cr),
      pr = (0.6 + r(b + 3) * 1.4) * (mr / 240);
    g.globalAlpha = r(b + 2);
    g.fillRect(Math.cos(a) * radius - pr / 2, Math.sin(a) * radius - pr / 2, pr, pr);
  }
  g.globalAlpha = 1;
  if (cloudCache.size > 4000) cloudCache.clear();
  cloudCache.set(key, { canvas, mr });
  return { canvas, mr };
}
const Fr = (i, k) => randomAt(11624, i * 61 + k);
const inkField = Array.from({ length: N1 }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 5 + Fr(i, 3) * 5,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
}));
const cloudField = Array.from({ length: N2 }, (_, i) => ({
  x: Fr(i + 9000, 0) * PW,
  y: Fr(i + 9000, 1) * PH,
  k: 0.5 + Fr(i + 9000, 2) * 0.8,
  life: 6 + Fr(i + 9000, 3) * 5,
  off: Fr(i + 9000, 4),
  ph: Fr(i + 9000, 5) * TAU,
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#dcdcdc');
  g.save();
  for (let i = 0; i < N1; i++) {
    const f = inkField[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 6 * f.k * t, PW) + 16 * Math.sin(t * 0.25 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, PH) + 16 * Math.cos(t * 0.21 + f.ph);
    if (x < -S / 2 || x > W + S / 2 || y < -S / 2 || y > H + S / 2) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const { canvas, rr } = buildInk(i, ep),
      full = rr / BLD;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(
      e.scale * (1 + 0.05 * Math.sin(t * 0.6 + f.ph) + 0.05 * m.slow.bass),
      e.scale * (1 + 0.05 * Math.sin(t * 0.6 + f.ph) + 0.05 * m.slow.bass),
    );
    g.globalAlpha = ease(fr / 0.3);
    g.drawImage(canvas, -full / 2, -full / 2, full, full);
    g.globalAlpha = 1;
    g.restore();
  }
  g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < N2; i++) {
    const f = cloudField[i],
      e = introFor(3000 + i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x - 5 * f.k * t, PW) + 16 * Math.sin(t * 0.23 * (0.6 + f.k) + f.ph + 2),
      y = lap(f.y + 6 * f.k * t, PH) + 16 * Math.cos(t * 0.27 + f.ph + 2);
    if (x < -S || x > W + S || y < -S || y > H + S) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const { canvas, mr } = buildCloud(i, ep),
      full = mr / BLD;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.scale(e.scale * (1 + 0.06 * m.fast.high), e.scale * (1 + 0.06 * m.fast.high));
    g.globalAlpha = ease(fr / 0.3);
    g.drawImage(canvas, -full / 2, -full / 2, full, full);
    g.globalAlpha = 1;
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
