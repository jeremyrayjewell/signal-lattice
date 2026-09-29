// Finale hybrid of Scene AO ("Contour Bands", segment 2) and Scene BR ("Wireframe Tangle",
// segment 4). AO's 18 fixed contour-band panels, BR's 140 wrapped-field wireframe spheres, and
// BR's own difference-blended square-grid population are merged into one array, tagged and
// depth-sorted together every frame, drawn in a single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateAO } from '../prototype-39/states.js';
import { stateAt as stateBR } from '../prototype-68/states.js';

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

// ---- Scene AO's own population ----
const aor = (id, k) => randomAt(60639, id * 313 + k);
const aoTiles = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: aor(id, 0) * TAU,
  size: 145 + aor(id, 1) * 10,
  vertical: aor(id, 2) > 0.5,
  invert: aor(id, 3) > 0.5,
}));
function aoContour(a, phase, t, detail = 0) {
  return (
    1 +
    0.13 * Math.sin(a * 3 + phase + t * 0.67) +
    0.09 * Math.cos(a * 5 - phase * 0.7 - t * 0.91) +
    0.055 * Math.sin(a * 9 + phase + t * 1.13) +
    detail * (0.035 * Math.sin(a * 31 + phase) + 0.022 * Math.cos(a * 47 - t * 0.8))
  );
}
function aoForm(g, c, t, m, layer) {
  const ph = c.phase + layer * 2.3;
  const radius = c.size * (layer ? 0.34 : 0.48) * (1 + 0.07 * m.slow.bass);
  const x = Math.sin(t * 0.43 + ph) * c.size * 0.13,
    y = Math.cos(t * 0.51 + ph) * c.size * 0.12;
  g.save();
  g.translate(x, y);
  g.rotate(t * (layer ? -0.16 : 0.12) + ph);
  for (let band = 18; band > 0; band--) {
    const fraction = band / 18;
    const tone = Math.round(22 + 209 * (c.invert ? fraction : 1 - fraction));
    g.fillStyle = `rgb(${tone},${tone},${tone})`;
    g.beginPath();
    for (let j = 0; j <= 96; j++) {
      const a = (j / 96) * TAU;
      const rr = radius * fraction * aoContour(a, ph + fraction * 0.65, t, 0);
      const xx = rr * Math.cos(a),
        yy = rr * Math.sin(a) * (1 + 0.15 * Math.sin(ph + t * 0.37));
      if (j === 0) g.moveTo(xx, yy);
      else g.lineTo(xx, yy);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}
function drawAOTile(g, c, t, s, m, entry) {
  const half = c.size / 2;
  g.save();
  g.translate(c.x + entry.dx, c.y + entry.dy);
  g.scale(entry.scale, entry.scale);
  g.save();
  g.beginPath();
  g.rect(-half, -half, c.size, c.size);
  g.clip();
  const gradient = g.createRadialGradient(
    half * 0.3 * Math.sin(t * 0.4 + c.phase),
    half * 0.3 * Math.cos(t * 0.3 + c.phase),
    2,
    0,
    0,
    c.size * 0.85,
  );
  gradient.addColorStop(0, c.invert ? '#d9d9d9' : '#292929');
  gradient.addColorStop(1, c.invert ? '#151515' : '#b2b2b2');
  g.fillStyle = gradient;
  g.fillRect(-half, -half, c.size, c.size);
  aoForm(g, c, t, m, 0);
  g.save();
  g.globalCompositeOperation = 'difference';
  g.translate(12 * Math.sin(t * 0.72 + c.phase), 12 * Math.cos(t * 0.63 + c.phase));
  g.rotate(0.12 * Math.sin(t * 0.57 + c.phase) + m.slow.mid * 0.15);
  aoForm(g, c, t + 3, m, 1);
  g.restore();
  for (let k = 0; k < 4; k++) {
    const phase = c.phase + k * 1.7;
    const radius = c.size * (0.17 + k * 0.073) * (1 + 0.035 * m.impulse * s.impulse);
    const px = 12 * Math.sin(t * 0.61 + phase),
      py = 12 * Math.cos(t * 0.57 + phase);
    g.strokeStyle = k % 2 ? 'rgba(0,0,0,.9)' : 'rgba(255,255,255,.8)';
    g.lineWidth = k === 0 ? 1.5 : 0.65;
    g.beginPath();
    for (let j = 0; j <= 160; j++) {
      const a = (j / 160) * TAU,
        rr = radius * aoContour(a, phase, t + 0.3 * k, 1);
      const x = px + rr * Math.cos(a),
        y = py + rr * Math.sin(a);
      if (j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = k % 2 ? '#050505' : '#eeeeee';
    for (let j = 0; j < 95; j++) {
      const a = (j / 95) * TAU + t * (0.15 + k * 0.04),
        rad = radius * aoContour(a, phase, t + 0.3 * k, 1);
      const spread = (aor(c.id, j + k * 100 + 20) - 0.5) * 9 * (1 + 0.35 * m.residue);
      const dot = 0.3 + aor(c.id, j + k * 100 + 120) * 1.6;
      g.beginPath();
      g.arc(px + (rad + spread) * Math.cos(a), py + (rad + spread) * Math.sin(a), dot, 0, TAU);
      g.fill();
    }
  }
  g.restore();
  g.strokeStyle = 'rgba(220,220,220,.35)';
  g.lineWidth = 1;
  g.strokeRect(
    -half + 5 * Math.sin(t * 0.5 + c.phase),
    -half + 5 * Math.cos(t * 0.44 + c.phase),
    c.size,
    c.size,
  );
  if (c.vertical) g.rotate(Math.PI / 2);
  for (let k = 0; k < 24; k++) {
    const phase = aor(c.id, k + 700) * TAU;
    const y =
      (aor(c.id, k + 750) - 0.5) * 166 +
      5 * Math.sin(t * (0.8 + aor(c.id, k + 800)) + phase) +
      m.impulse * s.impulse * 6 * Math.sin(phase);
    const red = k % 7 === 0;
    g.strokeStyle = red
      ? `rgba(239,24,31,${0.65 + 0.2 * m.fast.high})`
      : k % 3
        ? 'rgba(245,245,245,.42)'
        : 'rgba(0,0,0,.7)';
    g.lineWidth = red ? 0.7 + 0.35 * m.fast.rms : 0.5 + 0.25 * m.fast.centroid;
    g.beginPath();
    g.moveTo(-78, y);
    g.lineTo(78, y);
    g.stroke();
  }
  g.restore();
}

// ---- Scene BR's own populations ----
const brCp = ['#316C9C', '#CBC743', '#DB5745', '#46134F', '#371B22'];
const brS = 540,
  brM = brS / 3,
  brPW = W + 2 * brM,
  brPH = H + 2 * brM,
  brG = brS / 5;
const brCache = new Map();
function brConf(i, e) {
  const key = i * 512 + e + 64,
    hit = brCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11607, key * 70 + k);
  const v = [8, 12, 24][Math.floor(r(0) * 3)],
    col = brCp[Math.floor(r(1) * 5)];
  const rings = Array.from({ length: v }, (_, k) => {
    const b = 10 + k * 3;
    return { ecc: 0.15 + r(b) * 0.85, rot: r(b + 1) * TAU, ph: r(b + 2) * TAU };
  });
  const c = { v, col, rings, R: (brS / 3) * (0.55 + r(2) * 0.55) };
  if (brCache.size > 8000) brCache.clear();
  brCache.set(key, c);
  return c;
}
function brSphere(g, c, k, t, m, ph) {
  if (k <= 0.004) return;
  g.globalAlpha = 0.55 * k + 0.15 * m.fast.rms;
  g.strokeStyle = c.col;
  g.lineWidth = Math.max(0.4, (c.R / 80) * (1 + 0.3 * m.fast.centroid));
  const R = c.R * k * (1 + 0.05 * Math.sin(t * 0.6 + ph) + 0.06 * m.slow.bass);
  for (const rg of c.rings) {
    g.save();
    g.rotate(rg.rot + t * 0.02 * (1 + 0.3 * m.slow.mid) + ph * 0.1);
    g.beginPath();
    g.ellipse(0, 0, R, R * rg.ecc, 0, 0, TAU);
    g.stroke();
    g.restore();
  }
  g.globalAlpha = 1;
}
const brFr = (i, k) => randomAt(11608, i * 61 + k);
const brField = Array.from({ length: 140 }, (_, i) => ({
  x: brFr(i, 0) * brPW,
  y: brFr(i, 1) * brPH,
  k: 0.5 + brFr(i, 2) * 0.8,
  life: 6 + brFr(i, 3) * 5,
  off: brFr(i, 4),
  ph: brFr(i, 5) * TAU,
}));
const brSqCache = new Map();
function brSqConf(h, e) {
  const key = h * 512 + e + 64,
    hit = brSqCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11609, key * 20 + k);
  const v = [1, 2, 4][Math.floor(r(0) * 3)],
    sg = brG / v,
    cells = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 5 + (i * v + j) * 2;
      if (r(b) < 0.5) cells.push({ x: -brG / 2 + sg / 2 + i * sg, y: -brG / 2 + sg / 2 + j * sg });
    }
  const c = { sg, cells };
  if (brSqCache.size > 8000) brSqCache.clear();
  brSqCache.set(key, c);
  return c;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sAO = stateAO(elapsed),
    sBR = stateBR(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.lineCap = 'butt';

  const pool = [];
  aoTiles.forEach((c) => {
    const entry = introFor(c.id, intro, 350);
    if (!entry.active) return;
    pool.push({ kind: 'tile', c, entry, depth: (aor(c.id, 900) - 0.5) * 240 });
  });
  brField.forEach((f, i) => {
    const entry = introFor(i + 9000, intro, 420);
    if (!entry.active) return;
    const lap = (v, P) => (((v % P) + P) % P) - brM;
    const x = lap(f.x + 7 * f.k * t, brPW) + 16 * Math.sin(t * 0.27 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 5 * f.k * t, brPH) + 16 * Math.cos(t * 0.23 + f.ph);
    if (x < -brS / 2 || x > W + brS / 2 || y < -brS / 2 || y > H + brS / 2) return;
    pool.push({ kind: 'sphere', i, f, entry, x, y, depth: (brFr(i, 900) - 0.5) * 240 });
  });
  const cols = Math.ceil(W / brG) + 1,
    rows = Math.ceil(H / brG) + 1;
  for (let col = 0; col < cols; col++)
    for (let row = 0; row < rows; row++) {
      const h = col * 8192 + row,
        entry = introFor(10000 + (((col % 12) + 12) % 12) * 8 + (((row % 7) + 7) % 7), intro, 360);
      if (!entry.active) continue;
      pool.push({
        kind: 'square',
        col,
        row,
        h,
        entry,
        depth: (randomAt(11610, h * 4 + 900) - 0.5) * 240,
      });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'tile') {
      const m = reactive ? controls.at(t - 0.025 - (item.c.x / 960) * 0.19) : quiet;
      drawAOTile(g, item.c, t, sAO, m, item.entry);
    } else if (item.kind === 'sphere') {
      const m = reactive ? controls.at(t - 0.03 - (item.x / W) * 0.16) : quiet;
      const P = item.f.life,
        off = item.f.off * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      g.save();
      g.translate(item.x + item.entry.dx, item.y + item.entry.dy);
      g.scale(item.entry.scale, item.entry.scale);
      brSphere(g, brConf(item.i, ep - 1), 1 - ease(fr / 0.16), t, m, item.f.ph);
      brSphere(g, brConf(item.i, ep), ease(fr / 0.3), t, m, item.f.ph);
      g.restore();
    } else {
      const x = item.col * brG + brG / 2,
        y = item.row * brG + brG / 2;
      const P = 5 + randomAt(11610, item.h * 4 + 1) * 4,
        off = randomAt(11610, item.h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const cf = brSqConf(item.h, ep);
      g.save();
      g.globalCompositeOperation = 'difference';
      g.fillStyle = '#ffffff';
      g.translate(x + item.entry.dx, y + item.entry.dy);
      g.scale(item.entry.scale, item.entry.scale);
      g.globalAlpha = ease(fr / 0.3);
      for (const c2 of cf.cells) g.fillRect(c2.x - cf.sg / 2, c2.y - cf.sg / 2, cf.sg, cf.sg);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.restore();
    }
  }
  g.restore();
  return sBR;
}
