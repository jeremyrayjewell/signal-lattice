import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540;
const CB = 680,
  HC = CB / 2,
  BLOBS = 8,
  PTS = 960;
const cp = [
  '#A63E30',
  '#D0A837',
  '#6C2025',
  '#B08876',
  '#5B4C4E',
  '#1A1D2E',
  '#928077',
  '#E0CEBF',
  '#AC7C36',
  '#626264',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
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
const fbm = (seed, x) =>
  0.55 * vn(seed, x) + 0.3 * vn(seed + 1, x * 2.11 + 4.3) + 0.15 * vn(seed + 2, x * 4.3 + 9.7);
// Fine two-tone checker background, built once at a fraction of frame resolution and scaled up
// with hard pixel edges -- far cheaper than the 30x30 literal grid the source draws.
const CW = 80,
  CH = 45,
  checker = document.createElement('canvas');
checker.width = CW;
checker.height = CH;
(function () {
  const g = checker.getContext('2d');
  for (let x = 0; x < CW; x++)
    for (let y = 0; y < CH; y++) {
      g.fillStyle = (x + y) % 2 === 0 ? '#c8c8c8' : '#ffffff';
      g.fillRect(x, y, 1, 1);
    }
})();
const cloudCache = new Map();
// A ribbon pass's recipe for one "epoch": a pure function of (pass, epoch). Each of the eight
// blobs walks a long, sprawling noise path across the whole canvas (unlike the tighter quarter-arc
// blobs in Scene BH), so together they read as big overlapping ribbons rather than flowers.
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
    const r = (k) => randomAt(11587, (pass * 90 + i) * 64 + e * 7 + k);
    const mxr = 1 + r(0) * (CB / 10),
      seedX = Math.floor(r(1) * 1e6),
      seedY = Math.floor(r(2) * 1e6),
      seedR = Math.floor(r(3) * 1e6);
    g.save();
    g.translate(HC, HC);
    g.rotate(r(4) * TAU);
    g.fillStyle = cp[Math.floor(r(5) * 10)];
    g.beginPath();
    for (let k = 0; k < PTS; k++) {
      const u = k * 0.0026;
      const ex = fbm(seedX, u) * CB * 0.5,
        ey = fbm(seedY, u + 30) * CB * 0.5,
        er = Math.max(0.6, (0.15 + 0.85 * Math.abs(fbm(seedR, u * 2.4 + 60))) * mxr);
      g.moveTo(ex + er, ey);
      g.arc(ex, ey, er, 0, TAU);
    }
    g.fill();
    g.restore();
  }
  if (pass === 0) {
    // pass 0 is blurred and posterized once, baked into the cache
    const post = document.createElement('canvas');
    post.width = CB;
    post.height = CB;
    const pg = post.getContext('2d');
    pg.filter = `blur(${CB / 80}px)`;
    pg.drawImage(canvas, 0, 0);
    const id = pg.getImageData(0, 0, CB, CB),
      d = id.data,
      levels = 5,
      step = 255 / (levels - 1);
    for (let p = 0; p < d.length; p += 4) {
      if (d[p + 3] < 3) continue;
      d[p] = Math.round(Math.round(d[p] / step) * step);
      d[p + 1] = Math.round(Math.round(d[p + 1] / step) * step);
      d[p + 2] = Math.round(Math.round(d[p + 2] / step) * step);
    }
    pg.putImageData(id, 0, 0);
    cloudCache.set(key, post);
    if (cloudCache.size > 200) cloudCache.clear();
    return post;
  }
  cloudCache.set(key, canvas);
  if (cloudCache.size > 200) cloudCache.clear();
  return canvas;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBg = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  const cx = W / 2,
    cy = H / 2;
  g.save();
  // The checker background is opaque and gap-free, so (unlike the ribbon clouds below, which
  // have transparent gaps of their own) it is introduced as many small tiled patches rather than
  // one single flying rectangle -- otherwise a single early-arriving element would instantly cover
  // the whole outgoing scene the moment it reached full size.
  const CGX = 10,
    CGY = 6,
    pw = W / CGX,
    ph = H / CGY;
  g.imageSmoothingEnabled = false;
  for (let cx2 = 0; cx2 < CGX; cx2++)
    for (let cy2 = 0; cy2 < CGY; cy2++) {
      const ec = introFor(800 + cy2 * CGX + cx2, intro, 380);
      if (!ec.active) continue;
      const x0 = cx2 * pw,
        y0 = cy2 * ph,
        mx = x0 + pw / 2,
        my = y0 + ph / 2;
      g.save();
      g.translate(mx + ec.dx, my + ec.dy);
      g.scale(ec.scale, ec.scale);
      g.translate(-mx, -my);
      g.drawImage(
        checker,
        (x0 / W) * CW,
        (y0 / H) * CH,
        (pw / W) * CW,
        (ph / H) * CH,
        x0,
        y0,
        pw,
        ph,
      );
      g.restore();
    }
  g.imageSmoothingEnabled = true;
  for (let pass = 0; pass < 3; pass++) {
    const e = introFor(900 + pass, intro, 420);
    if (!e.active) continue;
    const P = 8 + randomAt(11588, pass * 11 + 1) * 4,
      ep = Math.floor(t / P),
      cloud = buildCloud(pass, ep);
    const spin = (pass === 0 ? 0.04 : pass === 1 ? -0.055 : 0.07) * (1 + 0.3 * mBg.slow.mid),
      rot = pass === 2 ? 0.05 * Math.sin(t * 0.2) : t * spin + pass * 2;
    const pulse = 1 + 0.05 * Math.sin(t * 0.6 + pass) + 0.06 * mBg.slow.bass;
    g.save();
    g.translate(cx + e.dx, cy + e.dy);
    g.rotate(rot);
    g.scale(e.scale * pulse, e.scale * pulse);
    if (pass === 2) {
      g.globalCompositeOperation = 'source-over';
      g.save();
      g.shadowOffsetX = S / 60;
      g.shadowOffsetY = S / 60;
      g.shadowBlur = (S / 30) * (1 + 0.4 * mBg.impulse);
      g.shadowColor = '#000000';
      g.drawImage(cloud, -HC, -HC);
      g.restore();
    } else {
      g.globalCompositeOperation = 'difference';
      g.drawImage(cloud, -HC, -HC);
    }
    g.restore();
  }
  g.globalCompositeOperation = 'source-over';
  g.restore();
  return s;
}
