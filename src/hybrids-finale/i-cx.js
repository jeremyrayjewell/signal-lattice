// Finale hybrid of Scene I ("Chromatic Veils", segment 1's very first scene) and Scene CX
// ("Gossamer Folds", Codex, segment 7's very last scene) -- the whole project's opening and
// closing scenes, bookending the reprise. I's 18 gradient fan "fields" and 90 traveling lane
// squares, and CX's ~96 folded-mesh patches, are merged into one array, tagged and depth-sorted
// together every frame, drawn in a single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateI } from '../prototype-05r/states.js';
import { stateAt as stateCX } from '../prototype-100/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
const ZERO_I = {
  fast: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  slow: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  impulse: 0,
  residue: 0,
};
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const color = (h, sat, l, a = 1) => `hsla(${h},${sat}%,${l}%,${a})`;

// ---- Scene I's own populations ----
const iFields = [
  [-25, -20, 700, 0.6, 2.05, 190],
  [985, 565, 750, 3.77, 2.1, 215],
  [985, -15, 690, 2.52, 2.0, 42],
  [-30, 565, 700, -0.72, 2.05, 147],
  [320, 40, 365, 1.5, 1.85, 326],
  [620, 30, 350, 2.4, 1.7, 269],
  [935, 225, 405, 3.5, 2.0, 196],
  [285, 295, 330, -0.55, 1.75, 216],
  [515, 505, 430, 4.15, 1.8, 28],
  [755, 435, 350, 4.65, 1.65, 335],
  [110, 155, 340, 0.65, 1.8, 40],
  [480, 220, 335, 1.1, 1.9, 183],
  [780, 45, 350, 1.5, 1.7, 224],
  [65, 415, 350, -0.35, 1.8, 148],
  [945, 490, 360, 3.6, 1.8, 24],
  [350, 545, 310, 4.8, 1.65, 274],
  [585, 340, 340, 3.1, 1.7, 278],
  [560, -45, 310, 1.0, 1.9, 191],
];
function fan(ctx, r, span, bend, fraction = 1, close = true) {
  ctx.beginPath();
  if (close) ctx.moveTo(0, 0);
  for (let step = 0; step <= 32; step++) {
    const theta = -span / 2 + (span * step) / 32;
    const radius = r * fraction * (1 + bend * 0.07 * Math.sin(theta * 2.3 + 0.4));
    const x = Math.cos(theta) * radius,
      y = Math.sin(theta) * radius * 0.86;
    if (!close && step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  if (close) ctx.closePath();
}
function drawIField(ctx, i, f, t, params, m, entry, ph) {
  const [bx, by, base, facing, aperture, hue] = f;
  const foundation = i < 4;
  const x =
    bx +
    (8 + params.drift * 18) * Math.sin(t * 0.1 + ph) +
    m.slow.bass * 18 * params.curvature * Math.cos(ph) +
    entry.dx;
  const y =
    by +
    (7 + params.drift * 16) * Math.cos(t * 0.12 + ph) +
    m.impulse * 12 * params.impulse * Math.sin(ph) +
    entry.dy;
  const r =
    base * (params.scale + 0.045 * m.slow.bass + 0.025 * Math.sin(t * 0.16 + ph)) * entry.scale;
  const span = aperture * params.aperture + 0.1 * m.slow.mid * Math.sin(ph);
  const bend = params.curvature * (0.5 * Math.sin(t * 0.17 + ph) + 0.55 * m.slow.mid);
  const angle =
    facing + 0.07 * Math.sin(t * 0.11 + ph) + m.fast.mid * 0.11 * params.curvature * Math.cos(ph);
  const h = hue + (m.slow.centroid - 0.4) * 13;
  const strength = clamp((foundation ? 0.32 : params.overlap) + m.slow.rms * 0.1, 0.2, 0.89);
  const smoky = [7, 12, 16].includes(i);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  fan(ctx, r, span, bend);
  ctx.clip();
  if (i % 4 === 2) {
    ctx.beginPath();
    ctx.rect(-r * 0.2, -r, r * 1.02, r * 2);
    ctx.clip();
  }
  ctx.globalCompositeOperation = smoky ? 'multiply' : 'source-over';
  const gradient = ctx.createRadialGradient(r * 0.12, -r * 0.05, 5, r * 0.08, 0, r * 1.1);
  const dark = smoky ? 26 - params.depth * 17 : 39;
  gradient.addColorStop(0, color(h, 72 * params.saturation, dark, strength));
  gradient.addColorStop(
    0.35,
    color(h, 84 * params.saturation, smoky ? dark + 7 : 47, strength * 0.95),
  );
  gradient.addColorStop(
    0.72,
    color(h + 7, 74 * params.saturation, smoky ? 31 : 60, strength * 0.72),
  );
  gradient.addColorStop(1, color(h + 10, 60, 80, strength * 0.16));
  ctx.fillStyle = gradient;
  ctx.fillRect(-r * 0.1, -r * 1.2, r * 1.4, r * 2.4);
  if (i % 4 === 1) {
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(r * 0.67, -r * 0.15, 0, r * 0.67, -r * 0.15, r * 0.42);
    glow.addColorStop(0, color(h - 20, 35, 94, 0.25 + params.depth * 0.16));
    glow.addColorStop(1, color(h, 30, 85, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, -r, r * 1.2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (let rib = 1; rib <= 7; rib++) {
    ctx.strokeStyle = color(h + 12, 54, 91, 0.065 + params.detail * 0.025);
    ctx.lineWidth = 2.5 + params.detail * 2;
    fan(ctx, r, span, bend, rib / 8, false);
    ctx.stroke();
  }
  ctx.restore();
}
function trajectory(u, lane, t, params, impulse) {
  const x = -100 + 1160 * u;
  const phase = lane * 1.7 + t * 0.055;
  const y =
    105 +
    lane * 165 +
    (82 + params.curvature * 16) * Math.sin(u * TAU * (0.8 + lane * 0.11) + phase) +
    22 * Math.sin(u * TAU * 1.8 - phase * 0.7);
  const local = Math.exp(-((u - (0.2 + 0.3 * lane)) ** 2) / 0.013);
  return [x, y + impulse * params.impulse * 20 * local * Math.sin(lane + 1)];
}
function drawILane(ctx, lane, j, t, params, m, entry, v, warpAmt) {
  const count = 30;
  const warped = v + warpAmt * Math.sin(TAU * v + t * 0.23 + lane);
  const u = ((warped % 1) + 1) % 1;
  const [tx, ty] = trajectory(u, lane, t, params, m.impulse);
  const x = tx + entry.dx,
    y = ty + entry.dy;
  const envelope = clamp(Math.min(u, 1 - u) * 18);
  const wave = 0.5 + 0.5 * Math.sin(TAU * u * 1.4 + lane + t * 0.31);
  const size = (8 + params.detail * 6 + wave * (4 + m.fast.high * 6)) * envelope * entry.scale;
  const [nx, ny] = trajectory(u + 0.001, lane, t, params, m.impulse);
  const turn =
    Math.atan2(ny - y, nx - x) * 0.42 +
    m.impulse * 0.14 * params.impulse * Math.sin(j * 0.3 + lane);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle =
    j % 10 === 0
      ? '#fffef6'
      : j % 10 === 5
        ? '#172333'
        : color([337, 190, 44][lane] + m.slow.centroid * 9, 92, 51);
  ctx.fillRect(-size / 2, -size / 2, size, size);
  if (j % 6 === 0) {
    ctx.globalAlpha = m.residue * 0.2 * params.detail;
    ctx.fillRect(-size / 2 - 8, -size / 2 + 5, size, size);
  }
  ctx.restore();
}

// ---- Scene CX's own population ----
const R = (i, k) => randomAt(128100, i * 197 + k);
const cxPatches = [];
for (let row = -1; row < 7; row++)
  for (let col = -1; col < 11; col++) {
    const id = cxPatches.length;
    cxPatches.push({
      id,
      x: col * 108 + (R(row + 1, 0) - 0.5) * 80,
      y: row * 108,
      phase: R(id, 1) * TAU,
      angle: R(id, 2) * TAU,
      wire: R(id, 3) > 0.48,
      size: 140 + R(id, 4) * 38,
    });
  }
const cxStamps = new Map();
function cxFold(c) {
  if (cxStamps.has(c.id)) return cxStamps.get(c.id);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 240;
  const g = canvas.getContext('2d');
  g.translate(120, 120);
  g.fillStyle = 'rgba(255,255,255,.035)';
  g.strokeStyle = 'rgba(255,255,255,.09)';
  g.lineWidth = 0.55;
  for (let row = 0; row < 160; row++) {
    const v = row / 159,
      y = (v - 0.5) * 152;
    const points = Array.from({ length: 10 }, (_, k) => {
      const u = k / 9;
      return [
        (u - 0.5) * 156 + 5 * Math.sin(v * 3.5 + c.phase + k * 0.8),
        y + 22 * Math.sin(u * 8 + c.phase + v * 3.3) + 13 * Math.sin(u * 17 - c.phase + v * 5.4),
      ];
    });
    if (c.wire) {
      g.beginPath();
      g.moveTo(...points[0]);
      for (let k = 1; k < points.length; k++) {
        g.lineTo(...points[k]);
        if (k > 1) {
          g.lineTo(...points[k - 2]);
          g.lineTo(...points[k]);
        }
      }
      g.stroke();
    } else {
      for (let k = 0; k < points.length - 2; k++) {
        g.beginPath();
        g.moveTo(...points[k]);
        g.lineTo(...points[k + 1]);
        g.lineTo(...points[k + 2]);
        g.closePath();
        g.fill();
      }
    }
  }
  cxStamps.set(c.id, canvas);
  return canvas;
}
function drawCXPatch(g, c, t, s, m, entry) {
  const size = c.size * (1 + 0.07 * Math.sin(t * 0.67 + c.phase) + m.slow.bass * 0.07);
  g.save();
  g.translate(
    c.x + entry.dx + 19 * Math.sin(t * 0.39 + c.phase),
    c.y + entry.dy + 18 * Math.cos(t * 0.43 + c.phase),
  );
  g.scale(entry.scale, entry.scale);
  g.rotate(c.angle + 0.22 * Math.sin(t * 0.49 + c.phase) * (1 + s.motion * 0.3));
  g.transform(
    1 + 0.08 * Math.sin(t * 0.73 + c.phase),
    0.18 * Math.sin(t * 0.61 + c.phase),
    0.16 * Math.cos(t * 0.57 + c.phase) + m.slow.mid * 0.07,
    1,
    0,
    0,
  );
  g.globalAlpha =
    0.68 + 0.22 * Math.sin(t * 0.53 + c.phase) + m.fast.rms * 0.1 + m.impulse * s.impulse * 0.06;
  g.drawImage(cxFold(c), -size * 0.75, -size * 0.75, size * 1.5, size * 1.5);
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    params = stateI(elapsed),
    s = stateCX(elapsed),
    ctx = p.drawingContext;
  const sampleI = (delay) => (reactive ? controls.at(t - delay) : ZERO_I);
  if (intro >= 1) p.background('#f8f5e8');
  ctx.save();

  const pool = [];
  iFields.forEach((f, i) => {
    const entry = introFor(i, intro, 520);
    if (!entry.active) return;
    pool.push({ kind: 'field', i, f, entry, depth: (R(i, 900) - 0.5) * 240 });
  });
  for (let lane = 0; lane < 3; lane++) {
    const count = 30;
    for (let j = 0; j < count; j++) {
      const entry = introFor(lane * 1000 + j, intro, 340);
      if (!entry.active) continue;
      const v = j / count + params.travel * 0.027 + lane * 0.21;
      pool.push({ kind: 'lane', lane, j, v, entry, depth: (R(lane * 1000 + j, 901) - 0.5) * 240 });
    }
  }
  cxPatches.forEach((c) => {
    const entry = introFor(c.id + 5000, intro, 390);
    if (!entry.active) return;
    pool.push({ kind: 'patch', c, entry, depth: (R(c.id, 902) - 0.5) * 240 });
  });
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'field') {
      const ph = item.i * 1.29,
        m = sampleI((item.i % 5) * 0.055);
      drawIField(ctx, item.i, item.f, t, params, m, item.entry, ph);
    } else if (item.kind === 'lane') {
      const m = sampleI(item.lane * 0.09);
      const warpAmt = 0.012 + 0.011 * m.fast.high * params.detail;
      drawILane(ctx, item.lane, item.j, t, params, m, item.entry, item.v, warpAmt);
    } else {
      const m = reactive ? controls.at(t - 0.025 - (item.c.x / 960) * 0.17) : quiet;
      drawCXPatch(ctx, item.c, t, s, m, item.entry);
    }
  }
  ctx.restore();
  return s;
}
