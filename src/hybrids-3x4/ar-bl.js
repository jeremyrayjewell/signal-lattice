// Hybrid of Scene AR (prototype-42, Codex) and Scene BL (prototype-62,
// "Ribbon Weave") for segment 6. AR's 150 discrete rectangles and 24 line-
// bundle patches (each its own seed formula reused exactly) are merged with
// BL's three ribbon-cloud blobs into ONE array, tagged and depth-sorted
// together every frame, then drawn in a single shared loop -- so a rectangle
// or line-bundle can render in front of a cloud at one moment and behind it
// the next, continuously. AR's solid dark background and BL's checker
// texture (BL's own opaque, gap-requiring-gradual-reveal tiling, kept as its
// own small-patches layer exactly as BL renders it standalone) both stay as
// background layers beneath the interleaved population, since neither is a
// population of individually-placed items.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-42/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540;
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const mix = (a, b, q) => a + (b - a) * q;
const smooth = (q) => q * q * (3 - 2 * q);

// ---- AR's own population (its exact seed formula reused) ----
const AR_R = (id, k) => randomAt(30142, id * 239 + k);
const palette = [
  '#79483f',
  '#d1a363',
  '#af5873',
  '#241d23',
  '#668578',
  '#d66080',
  '#812d40',
  '#2d526f',
  '#e5c345',
  '#30524d',
  '#565143',
  '#34344a',
  '#4ba0ae',
  '#b84648',
  '#d29a49',
];
const arPatches = Array.from({ length: 24 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 166 + (AR_R(id, 0) - 0.5) * 35,
  y: 30 + Math.floor(id / 6) * 167 + (AR_R(id, 1) - 0.5) * 35,
  size: 167 + AR_R(id, 2) * 62,
  phase: AR_R(id, 3) * TAU,
  angle: AR_R(id, 4) * TAU,
  base: Math.floor(AR_R(id, 5) * palette.length),
}));
function arBundle(g, c, t, m, s, axis) {
  g.save();
  g.rotate((axis * Math.PI) / 2 + 0.08 * Math.sin(t * 0.43 + c.phase + axis));
  const count = axis ? (AR_R(c.id, 12) > 0.5 ? 30 : 19) : AR_R(c.id, 13) > 0.5 ? 34 : 21;
  const spacing = c.size / count;
  for (let line = 0; line < count; line++) {
    const key = line + axis * 70;
    if (AR_R(c.id, key + 150) < 0.19) continue;
    const offset = (line - (count - 1) / 2) * spacing;
    const dashed = AR_R(c.id, key + 230) > 0.48;
    const width = (axis ? 0.85 : 1.05) + AR_R(c.id, key + 320) * 1.5;
    const color =
      (AR_R(c.id, key + 400) > 0.62
        ? Math.floor(AR_R(c.id, key + 460) * palette.length)
        : c.base + axis * 3) % palette.length;
    g.strokeStyle = palette[color];
    g.lineWidth = width * (1 + 0.13 * m.fast.centroid);
    g.setLineDash(dashed ? [width * 0.8, width * 2.2] : []);
    g.lineDashOffset = -t * (9 + AR_R(c.id, key + 510) * 13) - m.residue * 5;
    g.beginPath();
    for (let j = 0; j <= 64; j++) {
      const u = j / 64,
        x = (u - 0.5) * c.size * 1.25;
      const phase = c.phase + axis * 1.4;
      const longWave = Math.sin(u * 8 + t * 0.85 + phase + offset * 0.006);
      const fold = Math.sin(u * 19 - t * 0.67 + phase + offset * 0.012);
      const small = Math.sin(u * 33 + t * 1.13 + phase + offset * 0.018);
      const amplitude = (15 + AR_R(c.id, 14) * 14) * (1 + 0.3 * m.slow.bass);
      const y =
        offset +
        amplitude * (0.75 * longWave + 0.32 * fold + 0.12 * small) +
        m.impulse *
          s.impulse *
          8 *
          Math.sin(u * 10 - t * 1.6 + phase) *
          Math.exp(-Math.pow((u - 0.5) * 2, 2));
      const xx = x + 5 * Math.sin(offset * 0.03 + t * 0.6 + u * 5) * (1 + m.slow.mid * 0.5);
      if (j === 0) g.moveTo(xx, y);
      else g.lineTo(xx, y);
    }
    g.stroke();
  }
  g.restore();
}

// ---- BL's own population (its exact build logic reused) ----
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
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}
const fbm = (seed, x) =>
  0.55 * vn(seed, x) + 0.3 * vn(seed + 1, x * 2.11 + 4.3) + 0.15 * vn(seed + 2, x * 4.3 + 9.7);
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
function blBuildCloud(pass, e) {
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
  g.save();
  g.lineCap = 'square';
  g.lineJoin = 'round';
  // Shared background: AR's solid dark fill, then BL's checker texture on top as its own
  // small-patches layer (BL is opaque and gap-free, so it needs gradual per-patch reveal).
  if (intro >= 1) {
    g.fillStyle = '#030405';
    g.fillRect(0, 0, W, H);
    const CGX = 10,
      CGY = 6,
      pw = W / CGX,
      ph = H / CGY;
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 0.5;
    for (let cx2 = 0; cx2 < CGX; cx2++)
      for (let cy2 = 0; cy2 < CGY; cy2++)
        g.drawImage(
          checker,
          ((cx2 * pw) / W) * CW,
          ((cy2 * ph) / H) * CH,
          (pw / W) * CW,
          (ph / H) * CH,
          cx2 * pw,
          cy2 * ph,
          pw,
          ph,
        );
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true;
  }

  // The genuinely interwoven population: AR's rectangles and line-bundle patches, plus BL's
  // ribbon clouds, tagged and merged into one array, depth-sorted together every frame.
  const pool = [];
  for (let id = 0; id < 150; id++) {
    const entry = introFor(id + 1000, intro, 320);
    if (!entry.active) continue;
    pool.push({
      kind: 'rect',
      id,
      entry,
      depth: (AR_R(id, 106) - 0.5) * 240 + 20 * Math.sin(t * 0.23 + id),
    });
  }
  for (const c of arPatches) {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) continue;
    pool.push({
      kind: 'patch',
      c,
      entry,
      depth: (AR_R(c.id, 15) - 0.5) * 240 + 20 * Math.sin(t * 0.31 + c.phase),
    });
  }
  for (let pass = 0; pass < 3; pass++) {
    const entry = introFor(900 + pass, intro, 420);
    if (!entry.active) continue;
    pool.push({
      kind: 'cloud',
      pass,
      entry,
      depth: (pass - 1) * 70 + 30 * Math.sin(t * 0.17 + pass),
    });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'rect') {
      const { id, entry: e } = item,
        size = 35 + AR_R(id, 100) * 107,
        choice = AR_R(id, 101);
      g.fillStyle =
        choice < 0.33
          ? '#050606'
          : choice < 0.64
            ? '#777874'
            : palette[Math.floor(AR_R(id, 102) * palette.length)];
      const x = AR_R(id, 103) * 1050 - 45 + 8 * Math.sin(t * 0.23 + id),
        y = AR_R(id, 104) * 630 - 45 + 7 * Math.cos(t * 0.19 + id);
      g.fillRect(x + e.dx, y + e.dy, size * e.scale, size * e.scale);
    } else if (item.kind === 'patch') {
      const { c, entry: e } = item;
      const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.23) : quiet;
      const x = c.x + 16 * Math.sin(t * 0.38 + c.phase) + m.slow.bass * 8 * Math.cos(c.phase);
      const y = c.y + 14 * Math.cos(t * 0.49 + c.phase);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.rotate(
        c.angle +
          0.16 * Math.sin(t * 0.42 + c.phase) * (1 + s.motion) +
          m.slow.mid * 0.09 * Math.cos(c.phase),
      );
      arBundle(g, c, t, m, s, 0);
      arBundle(g, c, t + 1.7, m, s, 1);
      g.restore();
    } else {
      const { pass, entry: e } = item;
      const P = 8 + randomAt(11588, pass * 11 + 1) * 4,
        ep = Math.floor(t / P),
        cloud = blBuildCloud(pass, ep);
      const spin = (pass === 0 ? 0.04 : pass === 1 ? -0.055 : 0.07) * (1 + 0.3 * mBg.slow.mid),
        rot = pass === 2 ? 0.05 * Math.sin(t * 0.2) : t * spin + pass * 2;
      const pulse = 1 + 0.05 * Math.sin(t * 0.6 + pass) + 0.06 * mBg.slow.bass;
      g.save();
      g.translate(W / 2 + e.dx, H / 2 + e.dy);
      g.rotate(rot);
      g.scale(e.scale * pulse, e.scale * pulse);
      if (pass === 2) {
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
        g.globalCompositeOperation = 'source-over';
      }
      g.restore();
    }
  }
  g.restore();
  return s;
}
