// A genuine hybrid of Scene AQ (prototype-41, Codex, dailycoding source unknown
// to this file) and Scene BK (prototype-61, "Target Static", dailycoding
// 20251014) for segment 6's element-interweaving experiment -- NOT two whole
// scenes layered at runtime (that was the earlier, rejected attempt). Both
// sources' discrete, individually-positioned populations are generated using
// their own exact seed formulas (so this is genuinely AQ's beads/boxes and
// BK's confetti/bars, not lookalikes), tagged by origin, and merged into ONE
// array that is depth-sorted together every frame before a single shared
// draw loop runs through it -- so an AQ object can render behind one BK
// element and in front of another, continuously, rather than one source's
// elements uniformly sitting on top of the other's.
//
// AQ's smooth-shaded mesh objects (type<5: sphere/torus/shaft/box) only exist
// as a batch WebGL-accumulated layer in the source (many individual GL draw
// calls composited as one difference-blended canvas, exactly like BK's own
// cached concentric ring target) -- neither can be meaningfully interleaved
// at the single-element level without rebuilding the technique from scratch,
// so both stay as their own sequential batch layers, drawn once per frame,
// beneath the genuinely-interleaved population of individually placed items:
// AQ's bead-necklace and wireframe-box objects, and BK's confetti clusters
// and occlusion bars.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-61/states.js';
import { smoothSolids } from '../prototype-41/smooth-solids.js';

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
const ease = (q) => {
  q = Math.max(0, Math.min(1, q));
  return q * q * (3 - 2 * q);
};
const mix = (a, b, q) => a + (b - a) * q;

// ---- AQ's own geometry and population (its exact seed formula reused, so this is AQ's actual instance) ----
const AQ_R = (id, k) => randomAt(53141, id * 179 + k);
const palette = [
  [14, 155, 188],
  [155, 34, 156],
  [156, 36, 53],
  [48, 115, 86],
  [39, 34, 116],
  [177, 133, 167],
  [82, 130, 192],
];
function surface(n, m, point) {
  const vertices = [],
    faces = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) vertices.push(point(i / n, j / m));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j;
      faces.push([a, a + m + 1, a + m + 2, a + 1]);
    }
  return { vertices, faces };
}
const sphere = surface(56, 32, (u, v) => [
  Math.cos(u * TAU) * Math.sin(v * Math.PI),
  Math.cos(v * Math.PI),
  Math.sin(u * TAU) * Math.sin(v * Math.PI),
]);
const torus = surface(72, 24, (u, v) => [
  (0.8 + 0.23 * Math.cos(v * TAU)) * Math.cos(u * TAU),
  (0.8 + 0.23 * Math.cos(v * TAU)) * Math.sin(u * TAU),
  0.23 * Math.sin(v * TAU),
]);
function shaft(cone) {
  const vertices = [],
    faces = [],
    n = 48;
  for (let end = 0; end < 2; end++)
    for (let j = 0; j < n; j++) {
      const r = cone ? (end ? 0 : 0.62) : 0.24;
      vertices.push([
        r * Math.cos((j / n) * TAU),
        (end ? 1 : -1) * 1.3,
        r * Math.sin((j / n) * TAU),
      ]);
    }
  for (let j = 0; j < n; j++) faces.push([j, (j + 1) % n, ((j + 1) % n) + n, j + n]);
  faces.push(Array.from({ length: n }, (_, i) => n - 1 - i));
  faces.push(Array.from({ length: n }, (_, i) => n + i));
  return { vertices, faces };
}
const box = {
  vertices: [
    [-0.65, -0.65, -0.65],
    [0.65, -0.65, -0.65],
    [0.65, 0.65, -0.65],
    [-0.65, 0.65, -0.65],
    [-0.65, -0.65, 0.65],
    [0.65, -0.65, 0.65],
    [0.65, 0.65, 0.65],
    [-0.65, 0.65, 0.65],
  ],
  faces: [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [1, 2, 6, 5],
    [3, 0, 4, 7],
  ],
};
const meshes = [sphere, torus, shaft(false), shaft(true), box];
const aqObjects = Array.from({ length: 78 }, (_, id) => ({
  id,
  type: id % 7,
  phase: AQ_R(id, 0) * TAU,
  x: 120 + AQ_R(id, 1) * 720,
  y: 45 + AQ_R(id, 2) * 450,
  z: (AQ_R(id, 3) - 0.5) * 240,
  size: 34 + AQ_R(id, 4) * 55,
  color: palette[Math.floor(AQ_R(id, 5) * palette.length)],
}));
function rotate([x, y, z], a, b, c) {
  let yy = y * Math.cos(a) - z * Math.sin(a),
    zz = y * Math.sin(a) + z * Math.cos(a);
  let xx = x * Math.cos(b) + zz * Math.sin(b);
  zz = -x * Math.sin(b) + zz * Math.cos(b);
  return [xx * Math.cos(c) - yy * Math.sin(c), xx * Math.sin(c) + yy * Math.cos(c), zz];
}
function renderMesh(g, mesh, size, angles, color, wire = false) {
  const pts = mesh.vertices.map((v) => rotate(v, ...angles).map((x) => x * size));
  const faces = mesh.faces
    .map((ids) => ({ ids, z: ids.reduce((a, i) => a + pts[i][2], 0) / ids.length }))
    .sort((a, b) => a.z - b.z);
  for (const f of faces) {
    const [a, b, c] = f.ids.map((i) => pts[i]);
    const u = b.map((x, i) => x - a[i]),
      v = c.map((x, i) => x - a[i]);
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const len = Math.hypot(...normal) || 1;
    const light =
      0.25 + 0.75 * Math.max(0, (normal[0] * -0.35 + normal[1] * -0.55 + normal[2] * 0.76) / len);
    const rgb = color.map((c, i) => Math.round(c * light + [40, 15, 58][i] * (1 - light)));
    g.beginPath();
    f.ids.forEach((id, i) =>
      i ? g.lineTo(pts[id][0], pts[id][1]) : g.moveTo(pts[id][0], pts[id][1]),
    );
    g.closePath();
    g.strokeStyle = g.fillStyle = `rgb(${rgb.join(',')})`;
    if (!wire) {
      g.fill();
      g.lineWidth = 0.35;
      g.stroke();
    } else {
      g.lineWidth = 0.65;
      g.stroke();
    }
  }
}
function bead(g, x, y, r, color) {
  const gradient = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  gradient.addColorStop(0, `rgb(${color.map((c) => Math.min(255, c + 45)).join(',')})`);
  gradient.addColorStop(0.65, `rgb(${color.join(',')})`);
  gradient.addColorStop(1, '#39254c');
  g.fillStyle = gradient;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}
function aqBackground(g, t, intro) {
  if (intro < 1) return;
  if (!aqBackground.canvas) {
    aqBackground.canvas = document.createElement('canvas');
    aqBackground.canvas.width = 240;
    aqBackground.canvas.height = 135;
  }
  const bg = aqBackground.canvas,
    b = bg.getContext('2d'),
    pixels = b.createImageData(240, 135),
    d = pixels.data;
  for (let y = 0; y < 135; y++)
    for (let x = 0; x < 240; x++) {
      const u = x / 240,
        v = y / 135;
      const bend = Math.sin(v * 8 + t * 0.31) + 0.5 * Math.sin(u * 9 - v * 5 - t * 0.22);
      const a = 0.5 + 0.5 * Math.sin(u * 17 + v * 7 + bend * 2.5 + t * 0.39);
      const bb = 0.5 + 0.5 * Math.sin(v * 16 - u * 5 + Math.sin(u * 11 + t * 0.28) * 2 - t * 0.27);
      const idx = (y * 240 + x) * 4;
      d[idx] = 28 + 134 * a;
      d[idx + 1] = 198 + 48 * bb;
      d[idx + 2] = 207 + 38 * bb;
      d[idx + 3] = 255;
    }
  b.putImageData(pixels, 0, 0);
  g.drawImage(bg, 0, 0, 960, 540);
}

// ---- BK's own populations (its exact seed formula reused) ----
const G = S / 8,
  RB = 620,
  HR = RB / 2,
  RINGS = 100,
  OCC = 34;
const bkCache = new Map();
function bkCellConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bkCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11580, key * 30 + k);
  const ch = Math.floor(r(0) * 3),
    diag = r(1) < 0.5;
  const c = {
    ch,
    alpha: r(2),
    diag,
    la: r(3) < 0.5,
    lb: r(4) < 0.5,
    tone: r(5) < 0.5 ? '#000000' : '#ffffff',
  };
  if (bkCache.size > 8000) bkCache.clear();
  bkCache.set(key, c);
  return c;
}
function bkPaintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = Math.min(
    1,
    (c.alpha * 0.85 + 0.15) * (0.75 + 0.35 * Math.sin(t * 0.8 + ph)) * k + 0.1 * m.fast.rms,
  );
  g.fillStyle = ['#FF0000', '#00CC00', '#0033FF'][c.ch];
  g.fillRect(-G / 2, -G / 2, G, G);
  g.globalAlpha = k;
  g.strokeStyle = c.tone;
  g.lineWidth = Math.max(0.4, (G / 40) * (1 + 0.3 * m.fast.centroid));
  const sway = 1.2 * Math.sin(t * 1.2 + ph) * (1 + 0.5 * m.fast.high);
  if (c.diag) {
    if (c.la) {
      g.beginPath();
      g.moveTo(-G / 2, -G / 2 + sway);
      g.lineTo(G / 2, G / 2 - sway);
      g.stroke();
    }
    if (c.lb) {
      g.beginPath();
      g.moveTo(-G / 2, G / 2 - sway);
      g.lineTo(G / 2, -G / 2 + sway);
      g.stroke();
    }
  } else {
    if (c.la) {
      g.beginPath();
      g.moveTo(sway, -G / 2);
      g.lineTo(-sway, G / 2);
      g.stroke();
    }
    if (c.lb) {
      g.beginPath();
      g.moveTo(-G / 2, sway);
      g.lineTo(G / 2, -sway);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
}
const bkConfCache = new Map();
function bkConfConf(i, e) {
  const key = i * 512 + e + 64,
    hit = bkConfCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11581, key * 40 + k);
  const cr = r(0) * 720,
    a = r(1) * TAU,
    rr = cr / 10,
    v = (1 + Math.floor(r(2) * 5)) * 4,
    rg = rr / v;
  const bars = Array.from({ length: v }, (_, k) => {
    const b = 10 + k * 4;
    return {
      y: -rr / 2 + k * rg,
      ch: Math.floor(r(b) * 3),
      alpha: r(b + 1),
      w: rr / 3 + (r(b + 2) * rr * 2) / 3,
      x: ((r(b + 3) * 2 - 1) * rr) / 4,
    };
  });
  const c = { cr, a, rot: (Math.floor(r(3) * 4) * Math.PI) / 2, rg, bars };
  if (bkConfCache.size > 8000) bkConfCache.clear();
  bkConfCache.set(key, c);
  return c;
}
const bkRingCache = new Map();
function bkBuildRings(e) {
  if (bkRingCache.has(e)) return bkRingCache.get(e);
  const raw = document.createElement('canvas');
  raw.width = RB;
  raw.height = RB;
  const g = raw.getContext('2d'),
    step = RB / RINGS;
  for (let i = 0; i < RINGS; i++) {
    const er = RB - i * step,
      r = (k) => randomAt(11582, e * 4000 + i * 11 + k);
    if (r(0) < 0.5) continue;
    const ox = ((r(1) * 2 - 1) * er) / 20,
      oy = ((r(2) * 2 - 1) * er) / 20,
      tone = r(3) < 0.5 ? '#000000' : '#ffffff';
    g.beginPath();
    g.arc(HR + ox, HR + oy, er / 2, 0, TAU);
    if (r(4) < 0.5) {
      g.fillStyle = tone;
      g.fill();
    } else {
      g.strokeStyle = tone;
      g.lineWidth = Math.max(0.5, (er / RB) * 4);
      g.stroke();
    }
  }
  const out = document.createElement('canvas');
  out.width = RB;
  out.height = RB;
  const og = out.getContext('2d');
  og.filter = `blur(${step * 0.42}px)`;
  og.drawImage(raw, 0, 0);
  const id = og.getImageData(0, 0, RB, RB),
    d = id.data,
    levels = 5,
    step2 = 255 / (levels - 1);
  for (let p = 0; p < d.length; p += 4) {
    d[p] = Math.round(Math.round(d[p] / step2) * step2);
    d[p + 1] = Math.round(Math.round(d[p + 1] / step2) * step2);
    d[p + 2] = Math.round(Math.round(d[p + 2] / step2) * step2);
  }
  og.putImageData(id, 0, 0);
  if (bkRingCache.size > 60) bkRingCache.clear();
  bkRingCache.set(e, out);
  return out;
}
const bkOcc = Array.from({ length: OCC }, (_, i) => {
  const frr = (0.5 + randomAt(11583, i * 9 + 2) * 1.5) * G;
  return {
    x: randomAt(11583, i * 9) * W,
    y: randomAt(11583, i * 9 + 1) * H,
    w: frr * (randomAt(11583, i * 9 + 3) < 0.5 ? 1 : 2),
    h: frr * (randomAt(11583, i * 9 + 4) < 0.5 ? 0.25 : 0.5),
    ph: randomAt(11583, i * 9 + 5) * TAU,
    base: randomAt(11583, i * 9 + 6),
  };
});

// ---- the genuinely shared, interleaved population: AQ beads/boxes + BK confetti/bars ----
const aqBeadBox = aqObjects.filter((o) => o.type >= 5);

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  g.save();
  // Shared background: BK's mosaic grid tiles the frame; AQ's own procedural sky sits beneath it
  // only where the mosaic leaves gaps, since BK's cells are opaque and near-total coverage.
  if (intro >= 1) {
    p.background('#000000');
    aqBackground(g, t, intro);
  }
  const cx = W / 2,
    cy = H / 2;
  const ox = -(t * 10 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.5 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 4 + randomAt(11584, h * 4 + 1) * 4,
        off = randomAt(11584, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      bkPaintCell(g, bkCellConf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      bkPaintCell(g, bkCellConf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }

  // AQ's smooth-shaded meshes (spheres/tori/shafts/boxes): a batch WebGL layer, exactly as in AQ.
  const solids = smoothSolids();
  solids.begin(t);
  const order = aqObjects.map((o) => ({ ...o, depth: o.z + 45 * Math.sin(t * 0.29 + o.phase) }));
  for (const o of order) {
    if (o.type >= 5) continue;
    const entry = introFor(o.id, intro, 430);
    if (!entry.active) continue;
    const perspective = 750 / (750 - o.depth),
      scale = entry.scale * perspective;
    const x = 480 + (o.x - 480) * perspective + 23 * Math.sin(t * 0.41 + o.phase),
      y = 270 + (o.y - 270) * perspective + 20 * Math.cos(t * 0.47 + o.phase);
    const m = reactive ? controls.at(t - 0.02 - (o.x / 960) * 0.18) : quiet;
    const angles = [
      o.phase + t * 0.22 + 0.18 * m.slow.mid,
      o.phase * 0.7 - t * 0.29,
      o.phase * 0.4 + t * 0.13 + 0.12 * m.impulse * s.impulse,
    ];
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(scale, scale);
    const matrix = [
      ...rotate([1, 0, 0], ...angles),
      ...rotate([0, 1, 0], ...angles),
      ...rotate([0, 0, 1], ...angles),
    ];
    solids.draw(
      meshes[o.type],
      o.type,
      o.size * (1 + 0.035 * m.fast.rms),
      matrix,
      o.color,
      g.getTransform(),
      o.depth,
    );
    g.restore();
  }
  g.save();
  g.globalCompositeOperation = 'difference';
  g.drawImage(solids.canvas, 0, 0);
  g.restore();

  // BK's concentric ring target: also a batch, cached layer, exactly as in BK.
  g.save();
  g.globalCompositeOperation = 'difference';
  const er = introFor(3000, intro, 420);
  if (er.active) {
    const P = 6 + randomAt(11586, 1) * 3,
      ep = Math.floor(t / P),
      rings = bkBuildRings(ep);
    const pulse = 1 + 0.05 * Math.sin(t * 0.5) + 0.08 * mBase.slow.bass;
    g.save();
    g.translate(cx + er.dx, cy + er.dy);
    g.rotate(t * 0.02);
    g.scale(er.scale * pulse, er.scale * pulse);
    g.drawImage(rings, -HR, -HR);
    g.restore();
  }
  g.restore();

  // The genuinely interwoven population: AQ's beads/boxes and BK's confetti/bars, tagged and
  // merged into one array, depth-sorted together every frame (the sort order itself drifts
  // continuously via each item's own wobble), then drawn in a single shared loop -- so which
  // source's element sits in front changes continuously rather than one uniformly topping the other.
  const pool = [];
  for (const o of aqBeadBox) {
    const entry = introFor(o.id, intro, 430);
    if (!entry.active) continue;
    pool.push({ kind: 'aq', o, entry, depth: o.z + 45 * Math.sin(t * 0.29 + o.phase) });
  }
  for (let i = 0; i < 340; i++) {
    const e = introFor(2000 + i, intro, 420);
    if (!e.active) continue;
    const P = 5 + randomAt(11585, i * 7 + 1) * 5,
      off = randomAt(11585, i * 7 + 2) * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const c = bkConfConf(i, ep);
    pool.push({
      kind: 'confetti',
      c,
      ep,
      fr,
      entry: e,
      depth: (c.cr / 720) * 240 - 120 + 18 * Math.sin(t * 0.4 + c.a),
    });
  }
  for (let i = 0; i < OCC; i++) {
    const e = introFor(4000 + i, intro, 400);
    if (!e.active) continue;
    const b = bkOcc[i];
    pool.push({
      kind: 'occ',
      b,
      entry: e,
      depth: (randomAt(11583, i * 9 + 7) - 0.5) * 240 + 16 * Math.sin(t * 0.33 + b.ph),
    });
  }
  pool.sort((a, b) => a.depth - b.depth);
  for (const item of pool) {
    if (item.kind === 'aq') {
      const { o, entry } = item;
      const perspective = 750 / (750 - item.depth),
        scale = entry.scale * perspective;
      const x =
        480 +
        (o.x - 480) * perspective +
        23 * Math.sin(t * 0.41 + o.phase) +
        mBase.slow.bass * 13 * Math.cos(o.phase);
      const y = 270 + (o.y - 270) * perspective + 20 * Math.cos(t * 0.47 + o.phase);
      const m = reactive ? controls.at(t - 0.02 - (o.x / 960) * 0.18) : quiet;
      const angles = [
        o.phase + t * 0.22 + 0.18 * m.slow.mid,
        o.phase * 0.7 - t * 0.29,
        o.phase * 0.4 + t * 0.13 + 0.12 * m.impulse * s.impulse,
      ];
      g.save();
      g.translate(x + entry.dx, y + entry.dy);
      g.scale(scale, scale);
      if (o.type === 5) {
        const vertices = [];
        for (let j = 0; j < 32; j++) {
          const ph = j * 0.53 + o.phase;
          vertices.push(
            rotate(
              [((j % 6) - 2.5) * 13, (Math.floor(j / 6) - 2.5) * 13, 22 * Math.sin(ph + t * 0.8)],
              ...angles,
            ),
          );
        }
        vertices.sort((a, b) => a[2] - b[2]);
        for (let j = 0; j < vertices.length; j++) {
          const v = vertices[j];
          bead(
            g,
            v[0],
            v[1],
            2.2 + (j % 4) * 0.8 + m.residue,
            palette[(o.id + j) % palette.length],
          );
        }
      } else {
        renderMesh(g, box, o.size * 0.7, angles, o.color, true);
        g.rotate(angles[2]);
        for (let j = 0; j < 5; j++) {
          g.strokeStyle = `rgb(${palette[(o.id + j) % palette.length].join(',')})`;
          g.lineWidth = 0.5 + 0.25 * m.fast.centroid;
          const offset = 8 * Math.sin(t * (0.8 + j * 0.1) + o.phase + j) * (1 + m.fast.high * 0.5);
          g.beginPath();
          g.moveTo(-o.size * 1.8, j * 4 + offset);
          g.lineTo(o.size * 1.8, j * 4 - offset);
          g.stroke();
        }
      }
      g.restore();
    } else if (item.kind === 'confetti') {
      const { c, ep, fr, entry: e } = item;
      const m = reactive ? controls.at(t - 0.03 - c.a) : quiet;
      const spin = t * 0.03 * (1 + 0.4 * m.slow.mid),
        x = cx + (Math.cos(c.a + spin) * c.cr) / 2,
        y = cy + (Math.sin(c.a + spin) * c.cr) / 2;
      if (x < -140 || x > W + 140 || y < -140 || y > H + 140) continue;
      const k = ease(fr / 0.3) * e.scale;
      if (k <= 0.004) continue;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.rotate(c.rot);
      g.globalAlpha = k;
      g.globalCompositeOperation = 'screen';
      for (const b of c.bars) {
        g.fillStyle =
          ['rgba(255,40,40,', 'rgba(40,255,100,', 'rgba(40,110,255,'][b.ch] +
          Math.min(1, (b.alpha * 0.7 + 0.3) * (1 + 0.4 * m.fast.rms)) +
          ')';
        g.fillRect(b.x - b.w / 2, b.y, b.w, c.rg);
      }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.restore();
    } else {
      const { b, entry: e } = item;
      g.globalAlpha = Math.min(1, b.base * 0.85 + 0.12 * Math.sin(t * 0.7 + b.ph)) * e.scale;
      g.fillStyle = '#000000';
      g.fillRect(b.x - b.w / 2 + e.dx, b.y - b.h / 2 + e.dy, b.w, b.h);
      g.globalAlpha = 1;
    }
  }
  g.restore();
  return s;
}
