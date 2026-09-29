// Hybrid of Scene BH ("Mosaic + Blend Clouds", mine, prototype-58) and
// Scene CB ("Spiky-Star Bursts", mine, prototype-78) for segment 6. BH's
// mosaic grid, its three blend-mode cloud layers, its flowing scribble,
// and CB's 36 wrapped-field bursts are merged into one array, tagged and
// depth-sorted together every frame, drawn in a single shared loop; every
// item that uses a non-default blend mode sets and restores it itself so
// mixing with the rest of the pool stays correct regardless of draw order.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-58/states.js';

const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
  HALF = Math.PI / 2,
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
const smooth = (q) => q * q * (3 - 2 * q);
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}
const fbm = (seed, x) => 0.6 * vn(seed, x) + 0.4 * vn(seed + 1, x * 2.13 + 5.7);

// ---- BH's own population (mosaic grid + 3 cloud layers + scribble) ----
const bhS = 540,
  bhG = 48,
  CB2 = 560,
  HC = CB2 / 2,
  BLOBS = 70;
const bhCp = [
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
const cols = Math.ceil(W / bhG) + 1,
  rows = Math.ceil(H / bhG) + 1;
const bhCells = Array.from({ length: cols * rows }, (_, i) => ({
  col: i % cols,
  row: Math.floor(i / cols),
  ph: randomAt(11571, i * 7) * TAU,
}));
const bhCloudCache = new Map();
function bhBuildCloud(pass, e) {
  const key = pass * 4000 + e,
    hit = bhCloudCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = CB2;
  canvas.height = CB2;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, CB2, CB2);
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
    g.fillStyle = bhCp[Math.floor(r(7) * 10)];
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
    const blurred = document.createElement('canvas');
    blurred.width = CB2;
    blurred.height = CB2;
    const bg2 = blurred.getContext('2d');
    bg2.filter = `blur(${bhG / 1.6}px)`;
    bg2.drawImage(canvas, 0, 0);
    bhCloudCache.set(key, blurred);
    if (bhCloudCache.size > 200) bhCloudCache.clear();
    return blurred;
  }
  bhCloudCache.set(key, canvas);
  if (bhCloudCache.size > 200) bhCloudCache.clear();
  return canvas;
}
function bhCloudLayer(g, pass, t, m, e) {
  const cx = W / 2,
    cy = H / 2;
  const P = 7 + randomAt(11574, pass * 11 + 1) * 4,
    ep = Math.floor(t / P),
    cloud = bhBuildCloud(pass, ep);
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
    g.shadowOffsetX = bhG / 10;
    g.shadowOffsetY = bhG / 10;
    g.shadowBlur = bhG * (1 + 0.4 * m.impulse);
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
  g.globalCompositeOperation = 'source-over';
}
function bhScribble(g, t, m, e) {
  const cx = W / 2,
    cy = H / 2;
  g.save();
  g.translate(cx + e.dx, cy + e.dy);
  g.rotate(t * 0.04);
  g.scale(e.scale, e.scale);
  g.strokeStyle = 'rgba(255,255,255,.85)';
  g.lineWidth = Math.max(1, (bhG / 30) * (1 + 0.5 * m.fast.centroid));
  g.beginPath();
  for (let j = 0; j < 420; j++) {
    const u = (j / 419) * 7 + t * 0.12;
    const px = vn(9001, u) * bhS * 0.46,
      py = vn(9002, u + 50) * bhS * 0.46;
    j === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
  g.restore();
}

// ---- CB's own population (36 spiky-star bursts) ----
const cbM = 270,
  cbPW = W + 2 * cbM,
  cbPH = H + 2 * cbM,
  N = 36,
  RINGS = 40,
  cbS = 540;
const cbCache = new Map();
function cbConf(i, e) {
  const key = i * 512 + e + 64,
    hit = cbCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11627, key * 90 + k);
  const mr = cbS / 6 + r(0) * (cbS / 2 - cbS / 6),
    tone = Math.round(r(1) * 120);
  let acc = 0;
  const cum = new Float32Array(RINGS + 1);
  for (let k = 0; k < RINGS; k++) {
    acc += r(10 + k) * TAU;
    cum[k] = acc;
  }
  const c = { mr, tone, cum };
  if (cbCache.size > 8000) cbCache.clear();
  cbCache.set(key, c);
  return c;
}
function cbWedge(g, r2) {
  g.beginPath();
  for (let k = 0; k <= 4; k++) {
    const a = k * 22.5 * DEG,
      nr = (k % 2 === 0 ? r2 * 0.5 : r2) / 2;
    const x = nr * Math.cos(a),
      y = nr * Math.sin(a);
    k === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
}
function cbBurst(g, c, t, m, ph, k, spin) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (let ri = 0; ri < RINGS; ri++) {
    const rad =
      c.mr *
      (1 - ri / RINGS) *
      (1 + 0.04 * Math.sin(t * 0.8 + ph + ri * 0.2) * (1 + 0.4 * m.fast.high));
    if (rad <= 0.5) continue;
    g.fillStyle = ri % 2 === 0 ? `rgb(${c.tone},${c.tone},${c.tone})` : '#ffffff';
    g.save();
    g.rotate(c.cum[ri] + t * spin * (ri % 2 ? 1 : -1) * (1 + 0.3 * m.slow.mid));
    cbWedge(g, rad);
    g.restore();
  }
  g.globalAlpha = 1;
}
const cbFr = (i, k) => randomAt(11628, i * 61 + k);
const cbField = Array.from({ length: N }, (_, i) => ({
  x: cbFr(i, 0) * cbPW,
  y: cbFr(i, 1) * cbPH,
  k: 0.5 + cbFr(i, 2) * 0.8,
  life: 6 + cbFr(i, 3) * 6,
  off: cbFr(i, 4),
  ph: cbFr(i, 5) * TAU,
  spin: (cbFr(i, 6) < 0.5 ? -1 : 1) * (0.03 + cbFr(i, 7) * 0.05),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  g.save();

  const pool = [];
  for (const c of bhCells) {
    const id = (((c.col % 14) + 14) % 14) * 10 + (((c.row % 8) + 8) % 8),
      e = introFor(id, intro, 340);
    if (!e.active) continue;
    const clock = Math.floor((t + c.ph) * 0.8);
    if (randomAt(11573, c.col * 97 + c.row * 13 + clock) > 0.5) continue;
    pool.push({
      kind: 'tile',
      c,
      clock,
      e,
      depth: (randomAt(11571, (c.row * cols + c.col) * 7 + 900) - 0.5) * 240,
    });
  }
  for (let pass = 0; pass < 3; pass++) {
    const e = introFor(700 + pass, intro, 420);
    if (!e.active) continue;
    pool.push({ kind: 'cloud', pass, e, depth: (randomAt(11574, pass * 11 + 900) - 0.5) * 240 });
  }
  {
    const e = introFor(710, intro, 420);
    if (e.active) pool.push({ kind: 'scribble', e, depth: (randomAt(11574, 9910) - 0.5) * 240 });
  }
  for (let i = 0; i < N; i++) {
    const f = cbField[i],
      e = introFor(2000 + i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - cbM;
    const x = lap(f.x + 6 * f.k * t, cbPW) + 18 * Math.sin(t * 0.24 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 4 * f.k * t, cbPH) + 18 * Math.cos(t * 0.2 + f.ph);
    if (x < -270 || x > W + 270 || y < -270 || y > H + 270) continue;
    pool.push({ kind: 'burst', i, f, e, x, y, depth: (cbFr(i, 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'tile') {
      const { c, clock, e } = item,
        x = c.col * bhG + bhG / 2,
        y = c.row * bhG + bhG / 2;
      g.save();
      g.globalAlpha = e.scale;
      g.fillStyle = bhCp[Math.floor(randomAt(11573, c.col * 97 + c.row * 13 + clock + 3) * 10)];
      g.fillRect(x - bhG / 2 + e.dx, y - bhG / 2 + e.dy, bhG + 1, bhG + 1);
      g.globalAlpha = 1;
      g.restore();
    } else if (item.kind === 'cloud') {
      bhCloudLayer(g, item.pass, t, mBase, item.e);
    } else if (item.kind === 'scribble') {
      bhScribble(g, t, mBase, item.e);
    } else {
      const { i, f, e, x, y } = item,
        u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.globalCompositeOperation = 'difference';
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      cbBurst(g, cbConf(i, ep - 1), t, m, f.ph, 1 - ease(fr / 0.16), f.spin);
      cbBurst(g, cbConf(i, ep), t, m, f.ph, ease(fr / 0.3), f.spin);
      g.restore();
    }
  }
  g.restore();
  return s;
}
