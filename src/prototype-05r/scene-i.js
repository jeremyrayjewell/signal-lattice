// Independent refinement of Chromatic Veils from the documented visual reference.
import { stateAt } from './states.js';
import { introFor } from '../timing.js';
const TAU = Math.PI * 2;
// [origin x, origin y, radius, facing, aperture, hue]. Four broad foundations, fourteen crossings.
const fields = [
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
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ZERO = {
  fast: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  slow: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  impulse: 0,
  residue: 0,
};
const color = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

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

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const params = stateAt(elapsed),
    t = trackTime,
    ctx = p.drawingContext;
  const sample = (delay) => (reactive ? controls.at(t - delay) : ZERO);
  if (intro >= 1) p.background('#f8f5e8');
  ctx.save();
  fields.forEach(([bx, by, base, facing, aperture, hue], i) => {
    const entry = introFor(i, intro, 520);
    if (!entry.active) return;
    const m = sample((i % 5) * 0.055),
      phase = i * 1.29;
    const foundation = i < 4;
    const x =
      bx +
      (8 + params.drift * 18) * Math.sin(t * 0.1 + phase) +
      m.slow.bass * 18 * params.curvature * Math.cos(phase) +
      entry.dx;
    const y =
      by +
      (7 + params.drift * 16) * Math.cos(t * 0.12 + phase) +
      m.impulse * 12 * params.impulse * Math.sin(phase) +
      entry.dy;
    const r =
      base *
      (params.scale + 0.045 * m.slow.bass + 0.025 * Math.sin(t * 0.16 + phase)) *
      entry.scale;
    const span = aperture * params.aperture + 0.1 * m.slow.mid * Math.sin(phase);
    const bend = params.curvature * (0.5 * Math.sin(t * 0.17 + phase) + 0.55 * m.slow.mid);
    const angle =
      facing +
      0.07 * Math.sin(t * 0.11 + phase) +
      m.fast.mid * 0.11 * params.curvature * Math.cos(phase);
    const h = hue + (m.slow.centroid - 0.4) * 13;
    const strength = clamp((foundation ? 0.32 : params.overlap) + m.slow.rms * 0.1, 0.2, 0.89);
    const smoky = [7, 12, 16].includes(i);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    fan(ctx, r, span, bend);
    ctx.clip();
    // Some fans are chord-cut: straight edges visibly interrupt the curved material.
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
    // Light is internal to selected fields, preserving luminous and smoky depth together.
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
  });
  // Three coherent chains, each with shared hue and a smooth spacing wave.
  for (let lane = 0; lane < 3; lane++) {
    const m = sample(lane * 0.09),
      count = 30;
    for (let j = 0; j < count; j++) {
      const entry = introFor(lane * 1000 + j, intro, 340);
      if (!entry.active) continue;
      const v = j / count + params.travel * 0.027 + lane * 0.21;
      const warped =
        v + (0.012 + 0.011 * m.fast.high * params.detail) * Math.sin(TAU * v + t * 0.23 + lane);
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
  }
  ctx.restore();
  return params;
}
