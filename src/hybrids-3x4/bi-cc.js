// Hybrid of Scene BI ("Pip Grid", mine, prototype-59) and Scene CC (Codex,
// prototype-79, circle-veil clusters + filaments) for segment 6. BI's
// drifting grid cells, CC's 190 stamped clusters, and CC's 118 filament
// curves are merged into one array, tagged and depth-sorted together every
// frame, drawn in a single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-59/states.js';

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

// ---- BI's own population (drifting pip-grid cells) ----
const biS = 540,
  biG = biS / 8;
const biCache = new Map();
function biPattern(mode, sg, er) {
  const c = sg / 2 - er;
  if (mode === 0)
    return [
      [-c, -c],
      [-c, c],
      [c, -c],
      [c, c],
    ];
  if (mode === 1)
    return [
      [0, -c],
      [0, c],
      [-c, 0],
      [c, 0],
    ];
  return [
    [0, 0],
    [0, -c],
    [-c, c],
    [c, c],
  ];
}
function biConf(h, e) {
  const key = h * 512 + e + 64,
    hit = biCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11575, key * 140 + k);
  const v = r(0) < 0.55 ? 1 : 2,
    sg = biG / v;
  const subs = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 10 + (i * v + j) * 20;
      subs.push({
        x: -biG / 2 + sg / 2 + i * sg,
        y: -biG / 2 + sg / 2 + j * sg,
        rotQ: Math.floor(r(b) * 4),
        mode: Math.floor(r(b + 1) * 3),
        tones: [r(b + 2) < 0.5, r(b + 3) < 0.5, r(b + 4) < 0.5, r(b + 5) < 0.5],
        sides: [r(b + 6) < 0.5, r(b + 7) < 0.5, r(b + 8) < 0.5, r(b + 9) < 0.5],
        ph: r(b + 10) * TAU,
      });
    }
  const c = { v, sg, subs };
  if (biCache.size > 8000) biCache.clear();
  biCache.set(key, c);
  return c;
}
function biPaintCell(g, c, t, m, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  const er = c.sg / 6;
  for (const sub of c.subs) {
    g.save();
    g.translate(sub.x, sub.y);
    g.rotate(
      (sub.rotQ * Math.PI) / 2 + 0.12 * Math.sin(t * 0.6 + sub.ph) * (1 + 0.5 * m.fast.high),
    );
    const pts = biPattern(sub.mode, c.sg, er),
      r = er * (1 + 0.1 * Math.sin(t * 0.9 + sub.ph) + 0.1 * m.slow.bass);
    g.save();
    g.shadowOffsetX = er / 8;
    g.shadowOffsetY = er / 8;
    g.shadowBlur = er * (0.6 + 0.5 * m.impulse);
    g.shadowColor = '#000000';
    for (let i = 0; i < 4; i++) {
      g.fillStyle = sub.tones[i] ? '#ffffff' : '#000000';
      g.beginPath();
      g.arc(pts[i][0], pts[i][1], r, 0, TAU);
      g.fill();
    }
    g.restore();
    const rr = c.sg / 1.08,
      hr = rr / 2;
    g.strokeStyle = '#000000';
    g.lineWidth = Math.max(0.5, (c.sg / 30) * (1 + 0.4 * m.fast.centroid));
    const edges = [
      [
        [-hr, -hr],
        [-hr, hr],
      ],
      [
        [hr, -hr],
        [hr, hr],
      ],
      [
        [-hr, -hr],
        [hr, -hr],
      ],
      [
        [-hr, hr],
        [hr, hr],
      ],
    ];
    for (let i = 0; i < 4; i++) {
      if (!sub.sides[i]) continue;
      const a = edges[i][0],
        b = edges[i][1],
        flex = 1.5 * Math.sin(t * 1.1 + sub.ph + i) * (1 + 0.5 * m.fast.high);
      g.beginPath();
      g.moveTo(a[0] + (i < 2 ? flex : 0), a[1] + (i >= 2 ? flex : 0));
      g.lineTo(b[0] + (i < 2 ? -flex : 0), b[1] + (i >= 2 ? -flex : 0));
      g.stroke();
    }
    g.restore();
  }
  g.globalAlpha = 1;
}

// ---- CC's own populations (circle-veil clusters + filaments) ----
const ccR = (i, k) => randomAt(71079, i * 263 + k);
const ccColors = ['#2A4D14', '#317B22', '#67E0A3', '#7CF0BD', '#AFF9C9'];
const ccClusters = Array.from({ length: 190 }, (_, id) => ({
  id,
  x: ccR(id, 0) * 1160 - 100,
  y: ccR(id, 1) * 740 - 100,
  size: 175 + ccR(id, 2) * 105,
  phase: ccR(id, 3) * TAU,
  color: ccColors[Math.floor(ccR(id, 4) * 5)],
  light: ccR(id, 5) > 0.48,
}));
const ccStamps = new Map();
function ccLoopLayer(c, bank) {
  const key = c.id * 2 + bank;
  if (ccStamps.has(key)) return ccStamps.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.translate(120, 120);
  for (let j = 0; j < 22; j++) {
    const k = bank * 40 + j,
      radius = 12 + ccR(c.id, k + 10) * 78;
    const x = (ccR(c.id, k + 60) - 0.5) * (100 - radius * 0.7),
      y = (ccR(c.id, k + 110) - 0.5) * (100 - radius * 0.7);
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      radius,
      radius * (0.58 + ccR(c.id, k + 160) * 0.6),
      ccR(c.id, k + 210) * TAU,
      0,
      TAU,
    );
    ctx.globalAlpha = 0.025 + ccR(c.id, k + 250) * 0.022;
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.globalAlpha = c.light ? 0.65 : 0.48;
    ctx.strokeStyle = c.light ? '#ffffff' : '#172416';
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ccStamps.set(key, canvas);
  return canvas;
}
function ccCluster(g, c, t, m, s, e) {
  g.save();
  g.translate(
    c.x + e.dx + 48 * Math.sin(t * 0.49 + c.phase),
    c.y + e.dy + 43 * Math.cos(t * 0.53 + c.phase),
  );
  g.scale(e.scale, e.scale);
  for (let bank = 0; bank < 2; bank++) {
    const phase = c.phase + bank * 2.3;
    const size = c.size * (1 + 0.17 * Math.sin(t * 0.83 + phase) + m.slow.bass * 0.14);
    g.save();
    g.rotate((bank ? 1 : -1) * t * 0.11 + 0.48 * Math.sin(t * 0.63 + phase) * (1 + s.motion * 0.4));
    g.transform(
      1 + 0.15 * Math.sin(t * 0.77 + phase),
      0.36 * Math.sin(t * 0.71 + phase) + m.slow.mid * 0.16,
      0.34 * Math.cos(t * 0.67 + phase),
      1 + 0.13 * Math.cos(t * 0.81 + phase),
      0,
      0,
    );
    g.globalAlpha = 0.88 + 0.1 * Math.sin(t * 0.61 + phase) + m.fast.rms * 0.02;
    g.drawImage(
      ccLoopLayer(c, bank),
      -size / 2 + 18 * Math.sin(t * 1.03 + phase),
      -size / 2 + 18 * Math.cos(t * 0.97 + phase),
      size,
      size,
    );
    g.restore();
  }
  g.restore();
}
function ccFilament(g, id, t, m, s, e) {
  const phase = ccR(id, 320) * TAU,
    radius = 18 + ccR(id, 321) * 47;
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.translate(
    ccR(id, 322) * 1080 - 60 + 35 * Math.sin(t * 0.61 + phase) + e.dx,
    ccR(id, 323) * 660 - 60 + 35 * Math.cos(t * 0.57 + phase) + e.dy,
  );
  g.rotate(
    phase +
      t * (ccR(id, 419) - 0.5) * 0.4 +
      0.7 * Math.sin(t * 0.73 + phase) * (1 + s.motion * 0.4),
  );
  g.scale(e.scale, e.scale);
  g.strokeStyle = ccColors[Math.floor(ccR(id, 324) * 5)];
  g.lineWidth = 0.65;
  g.shadowColor = 'rgba(0,0,0,.28)';
  g.shadowBlur = 2;
  g.shadowOffsetX = 1;
  g.shadowOffsetY = 1;
  g.beginPath();
  for (let j = 0; j < 35; j++) {
    const a = -1.45 + (j / 34) * 2.9;
    const profile = j % 2 ? 0.12 + ccR(id, j + 330) * 0.48 : 0.3 + ccR(id, j + 370) * 0.85;
    const r =
      radius *
      profile *
      (1 + 0.3 * Math.sin(t * 1.27 + phase + j * 0.31) + m.impulse * s.impulse * 0.48);
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    if (j === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 11 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 7 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / biG) - 1,
    c1 = Math.ceil((W - ox) / biG),
    r0 = Math.floor(-oy / biG) - 1,
    r1 = Math.ceil((H - oy) / biG);
  g.save();

  const pool = [];
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000;
      const e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * biG + biG / 2 + ox,
        y = row * biG + biG / 2 + oy;
      pool.push({ kind: 'cell', h, x, y, e, depth: (randomAt(11576, h * 4 + 900) - 0.5) * 240 });
    }
  for (const c of ccClusters) {
    const e = introFor(c.id, intro, 380);
    if (!e.active) continue;
    pool.push({ kind: 'cluster', c, e, depth: (ccR(c.id, 900) - 0.5) * 240 });
  }
  for (let id = 0; id < 118; id++) {
    const e = introFor(id + 300, intro, 390);
    if (!e.active) continue;
    pool.push({ kind: 'filament', id, e, depth: (ccR(id, 901) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'cell') {
      const { h, x, y, e } = item;
      const P = 4 + randomAt(11576, h * 4 + 1) * 4,
        off = randomAt(11576, h * 4 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-biG / 2, -biG / 2, biG, biG);
      }
      g.save();
      g.beginPath();
      g.rect(-biG / 2, -biG / 2, biG, biG);
      g.clip();
      biPaintCell(g, biConf(h, ep - 1), t, m, 1 - ease(fr / 0.16));
      biPaintCell(g, biConf(h, ep), t, m, ease(fr / 0.3));
      g.restore();
      g.restore();
    } else if (item.kind === 'cluster') {
      const { c, e } = item,
        m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.18) : quiet;
      ccCluster(g, c, t, m, s, e);
    } else {
      const { id, e } = item,
        m = reactive ? controls.at(t - 0.02) : quiet;
      ccFilament(g, id, t, m, s, e);
    }
  }
  g.restore();
  return s;
}
