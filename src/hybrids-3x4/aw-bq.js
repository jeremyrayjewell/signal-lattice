// Hybrid of Scene AW (prototype-47, Codex) and Scene BQ (prototype-67,
// "Woven Waves") for segment 6. AW's 18 glow-stamp groups, its 11 spanning
// threads, and BQ's grid cells are merged into one array, tagged and depth-
// sorted together every frame, drawn in a single shared loop. AW's own
// cached, scrolling textured-ground pattern -- a private ImageData texture
// with no individual-element structure -- is used as the shared background.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-47/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
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

// ---- AW's own population ----
const AW_R = (id, k) => randomAt(50247, id * 173 + k);
const awGroups = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: AW_R(id, 0) * TAU,
  angle: (Math.floor(AW_R(id, 1) * 8) * Math.PI) / 4,
  count: 4 + Math.floor(AW_R(id, 2) * 7),
}));
let stamps, ground, groundPattern;
function texturedGround(g, t, s, m) {
  if (!ground) {
    ground = document.createElement('canvas');
    ground.width = 960;
    ground.height = 540;
    const ctx = ground.getContext('2d'),
      pixels = ctx.createImageData(960, 540);
    for (let y = 0; y < 540; y++)
      for (let x = 0; x < 960; x++) {
        const noise = AW_R(y * 960 + x, 900);
        const coarse = AW_R(Math.floor(y / 3) * 320 + Math.floor(x / 3), 904);
        const weave =
          (x % 6 === 0 ? 12 : x % 6 === 1 ? -7 : 0) + (y % 6 === 0 ? 9 : y % 6 === 1 ? -9 : 0);
        const tone = Math.max(0, Math.round(14 + noise * 24 + coarse * 20 + weave));
        const i = (y * 960 + x) * 4;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = tone;
        pixels.data[i + 3] = 255;
      }
    ctx.putImageData(pixels, 0, 0);
    for (let i = 0; i < 1800; i++) {
      const x = AW_R(i, 901) * 960,
        y = AW_R(i, 902) * 540;
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.38)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4 + AW_R(i, 903) * 18, y + 1.2);
      ctx.stroke();
    }
  }
  if (!groundPattern) groundPattern = g.createPattern(ground, 'repeat');
  const dx = t * 18 + 12 * Math.sin(t * 0.71) + m.slow.bass * 9;
  const dy = t * 11 + 9 * Math.sin(t * 0.53) + m.impulse * s.impulse * 3;
  const shearX = 0.025 * Math.sin(t * 0.43) * (1 + s.motion * 0.3),
    shearY = 0.018 * Math.cos(t * 0.37) + m.slow.mid * 0.008;
  groundPattern.setTransform(new DOMMatrix([1, shearY, shearX, 1, dx, dy]));
  g.save();
  g.fillStyle = groundPattern;
  g.fillRect(0, 0, 960, 540);
  g.restore();
}
function glowStamps() {
  if (stamps) return stamps;
  stamps = Array.from({ length: 6 }, (_, id) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 160;
    const g = canvas.getContext('2d'),
      width = 2 + id * 1.8;
    g.lineCap = 'round';
    g.strokeStyle = '#ffffff';
    g.lineWidth = width;
    g.shadowColor = 'rgba(255,255,255,.9)';
    g.shadowBlur = 3.5;
    g.beginPath();
    g.moveTo(20, 20);
    g.lineTo(20, 140);
    g.stroke();
    return canvas;
  });
  return stamps;
}
function awGroup(g, c, t, m, s) {
  g.save();
  g.rotate(
    c.angle +
      0.17 * Math.sin(t * 0.58 + c.phase) * (1 + s.motion) +
      m.slow.mid * 0.15 * Math.sin(c.phase),
  );
  const spread = 10 + AW_R(c.id, 3) * 6 + 3 * Math.sin(t * 0.67 + c.phase) + m.slow.bass * 3;
  for (let j = 0; j < c.count; j++) {
    const ph = c.phase + j * 0.7;
    const width = AW_R(c.id, j + 10),
      index = Math.floor(width * 6);
    const length = 77 + 22 * Math.sin(t * 0.79 + ph) + m.impulse * s.impulse * 8 * Math.sin(j);
    const x = (j - (c.count - 1) / 2) * spread,
      y = 5 * Math.sin(t * 0.91 + ph);
    g.globalAlpha =
      0.38 + 0.4 * AW_R(c.id, j + 30) + 0.14 * Math.sin(t * 1.07 + ph) + m.fast.rms * 0.08;
    g.drawImage(glowStamps()[index], x - 14, y - length * 0.66, 28, length * 1.32);
  }
  g.restore();
  g.save();
  g.rotate(0.075 * Math.sin(t * 0.63 + c.phase) + m.slow.mid * 0.04);
  for (let k = 0; k < 4; k++) {
    if (AW_R(c.id, k + 40) < 0.34) continue;
    const size = 62 + 6 * Math.sin(t * 0.57 + c.phase + k),
      ph = c.phase + k * 1.3;
    const x = (k % 2 ? 1 : -1) * 38 + 4 * Math.sin(t * 0.81 + ph),
      y = (k < 2 ? -1 : 1) * 39 + 4 * Math.cos(t * 0.73 + ph);
    const radius = AW_R(c.id, k + 50) > 0.5 ? size * (0.27 + 0.06 * Math.sin(t * 0.49 + ph)) : 0;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1.25 + 0.2 * m.fast.centroid;
    g.beginPath();
    g.roundRect(x - size / 2, y - size / 2, size, size, radius);
    g.stroke();
  }
  g.restore();
}

// ---- BQ's own population ----
const S = 540,
  G = S / 5;
const cp = [
  '#CEBCA7',
  '#859087',
  '#2F4788',
  '#2D4368',
  '#B43716',
  '#C09833',
  '#DFAD28',
  '#55748E',
  '#BD9990',
];
const bqCache = new Map();
function bqConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bqCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11605, key * 80 + k);
  const rects = Array.from({ length: 10 }, (_, k) => {
    const b = 10 + k * 4;
    const rr = G / 3 + r(b) * (G / 1.2 - G / 3);
    return {
      x: (r(b + 1) * 2 - 1) * (G / 2 - rr / 2),
      y: (r(b + 2) * 2 - 1) * (G / 2 - rr / 2),
      rr,
      tone:
        r(b + 3) < 0.34
          ? '#000000'
          : r(b + 3) < 0.67
            ? '#ffffff'
            : cp[Math.floor(r(b + 3) * 9) % 9],
    };
  });
  const rot = (Math.floor(r(50) * 4) * Math.PI) / 2,
    mc = Math.floor(r(51) * 9),
    v = (1 + Math.floor(r(52) * 4)) * 4,
    sg = G / v;
  const rows = [];
  for (let ry = 0; ry < v; ry++) {
    const b = 60 + ry * 3;
    rows.push({ col: r(b) < 0.6 ? mc : Math.floor(r(b + 1) * 9), ph: r(b + 2) * TAU });
  }
  const c = { rects, rot, v, sg, rows };
  if (bqCache.size > 8000) bqCache.clear();
  bqCache.set(key, c);
  return c;
}
function bqPaintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (const rc of c.rects) {
    g.fillStyle = rc.tone;
    g.fillRect(rc.x - rc.rr / 2, rc.y - rc.rr / 2, rc.rr, rc.rr);
  }
  g.save();
  g.rotate(c.rot);
  g.lineWidth = Math.max(0.5, (c.sg / 4) * (1 + 0.25 * m.fast.centroid));
  g.lineJoin = 'bevel';
  g.lineCap = 'square';
  const cols = Math.round(G / c.sg) + 2,
    wave = 1 + 0.4 * m.fast.high;
  for (let ry = 0; ry < c.v; ry++) {
    const row = c.rows[ry],
      sy = -G / 2 + c.sg / 2 + ry * c.sg;
    g.strokeStyle = cp[row.col];
    g.beginPath();
    let prev = null;
    for (let cxi = -1; cxi <= cols; cxi++) {
      const sx = cxi * c.sg - c.sg / 2;
      const z =
        sx < 0
          ? mix(0, c.sg / 1.5, Math.max(0, Math.min(1, (sx + G / 2 + c.sg) / (G / 2 + c.sg))))
          : mix(c.sg / 1.5, 0, Math.max(0, Math.min(1, sx / (G / 2 + c.sg))));
      const py = sy + z * Math.sin(t * 0.9 + sx * 0.05 + row.ph) * wave;
      if (prev) {
        g.quadraticCurveTo(prev[0], prev[1], (prev[0] + sx) / 2, (prev[1] + py) / 2);
      } else g.moveTo(sx, py);
      prev = [sx, py];
    }
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) texturedGround(g, t, s, reactive ? controls.at(t) : quiet);
  g.save();
  g.lineCap = 'round';

  const pool = [];
  for (let j = 0; j < 11; j++) {
    const entry = introFor(j + 500, intro, 350);
    if (!entry.active) continue;
    pool.push({ kind: 'thread', j, entry, depth: (AW_R(j, 900) - 0.5) * 240 });
  }
  for (const c of awGroups) {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) continue;
    pool.push({
      kind: 'group',
      c,
      entry,
      depth: (AW_R(c.id, 901) - 0.5) * 240 + 18 * Math.sin(t * 0.24 + c.phase),
    });
  }
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.2 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor(1500 + (((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      pool.push({ kind: 'cell', h, e, x, y, depth: (randomAt(11606, h * 4 + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'thread') {
      const { j, entry: e } = item;
      g.save();
      g.translate(e.dx, e.dy);
      g.globalAlpha = e.scale * 0.85;
      g.strokeStyle = '#ffffff';
      g.lineWidth = 1;
      const x1 = AW_R(j, 70) * 960 + 18 * Math.sin(t * 0.31 + j),
        y1 = AW_R(j, 71) * 540 + 16 * Math.cos(t * 0.37 + j);
      const x2 = AW_R(j, 72) * 960 + 22 * Math.sin(t * 0.29 + j * 2),
        y2 = AW_R(j, 73) * 540 + 17 * Math.cos(t * 0.41 + j);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
      g.restore();
    } else if (item.kind === 'group') {
      const { c, entry: e } = item,
        m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.2) : quiet;
      g.save();
      g.translate(
        c.x + e.dx + 8 * Math.sin(t * 0.47 + c.phase),
        c.y + e.dy + 7 * Math.cos(t * 0.53 + c.phase),
      );
      g.scale(e.scale, e.scale);
      awGroup(g, c, t, m, s);
      g.restore();
    } else {
      const { h, e, x, y } = item;
      const P = 4 + randomAt(11606, h * 4 + 1) * 4,
        off = randomAt(11606, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#000000';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      bqPaintCell(g, bqConf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      bqPaintCell(g, bqConf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  }
  g.restore();
  return s;
}
