import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  residue: 0,
  impulse: 0,
};
const hues = [190, 217, 271, 291, 346, 39, 57, 95];
const r = (i, k) => randomAt(91483, i * 137 + k);
function ink(i, k, color, m) {
  if (!color) return `hsl(0 0% ${8 + 75 * r(i, k)}%)`;
  return `hsl(${hues[Math.floor(r(i, k) * hues.length)]} ${90 + 8 * m.fast.centroid}% ${45 + 7 * r(i, k + 1)}%)`;
}
// Distinct open path grammars; each has independently moving control terms.
function gesture(type, u, phase, t, bend) {
  const z = u * 2 - 1,
    arc = Math.sin(Math.PI * u),
    a = t * 0.61 + phase;
  const sway = Math.sin(a + u * 3.1) * bend;
  switch (type) {
    case 0:
      return [z, 0.32 * Math.sin(z * 2.4 + a) + arc * sway * 0.4]; // sweeping slash
    case 1:
      return [z * 0.8 + 0.23 * Math.sin(a), 0.68 * z * z - 0.35 + arc * sway * 0.5]; // bowed arch
    case 2:
      return [0.55 * Math.sin(z * 2.7 + a * 0.7), z]; // upright serpentine
    case 3:
      return [z * 0.8, 0.53 * Math.tanh(z * 5 + Math.sin(a) * 1.6) + arc * sway * 0.3]; // bent elbow
    case 4: {
      const q = u * (3.9 + 0.3 * Math.sin(a));
      return [0.63 * Math.cos(q) + z * 0.3, 0.62 * Math.sin(q) + z * 0.35 + arc * sway * 0.2];
    } // open hook
    default:
      return [z, 0.36 * Math.sin(z * 5 + a) + 0.18 * Math.sin(z * 8 - a * 0.6)]; // articulated wave
  }
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const state = stateAt(elapsed),
    ctx = p.drawingContext,
    t = trackTime;
  if (intro >= 1) p.background('#ffffff');
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 21; i++) {
    const entry = introFor(i, intro, 420);
    if (!entry.active) continue;
    const col = i % 7,
      row = Math.floor(i / 7),
      phase = r(i, 2) * TAU;
    const m = reactive ? controls.at(t - col * 0.065 - row * 0.09) : zero;
    const cx = 72 + col * 136 + (r(i, 3) - 0.5) * 15 + entry.dx,
      cy = 94 + row * 176 + (r(i, 4) - 0.5) * 15 + entry.dy;
    const radius = (20 + 34 * r(i, 5)) * entry.scale,
      count = 9 + Math.floor(r(i, 6) * 22);
    ctx.save();
    ctx.translate(cx, cy);
    const ringX = 11 * Math.sin(t * 0.37 + phase),
      ringY = 12 * Math.cos(t * 0.29 + phase);
    const rotation = phase + (i % 2 ? -1 : 1) * t * (0.19 + 0.18 * r(i, 12));
    const oval = 0.73 + 0.24 * Math.sin(t * 0.31 + phase);
    const partial = i % 5 === 0 ? 0.68 : 1;
    for (let j = 0; j < count; j++) {
      const a = (j / count) * TAU * partial + rotation;
      const warp = Math.sin(a * 2 + phase + t * 0.73) * (2 + state.bend * 4 + m.slow.bass * 7);
      const kick = m.impulse * state.disturbance * 12 * Math.sin(j * 0.7 + phase);
      const rr = radius + warp + kick;
      ctx.save();
      ctx.translate(ringX + Math.cos(a) * rr, ringY + Math.sin(a) * rr * (i % 3 === 0 ? oval : 1));
      ctx.rotate(a + 0.2 * state.detail * Math.sin(t * 1.7 + j) * m.residue);
      ctx.fillStyle = ink(i, 7, r(i, 8) > 0.42, m);
      const width = 3 + 9 * r(i, 13) + m.residue * state.detail * 3;
      const len = ((radius * TAU) / count) * (0.35 + 0.2 * r(i, 14));
      ctx.fillRect(-width / 2, -len / 2, width, len);
      ctx.restore();
    }
    const strokes = 2 + Math.floor(r(i, 16) * 4);
    for (let k = 0; k < strokes; k++) {
      const seed = 20 + k * 19,
        type = (i * 3 + k + Math.floor(r(i, 17) * 5)) % 6;
      const phaseK = phase + k * 1.91;
      const angle =
        r(i, seed) * TAU +
        0.45 * Math.sin(t * (0.31 + 0.04 * k) + phaseK) +
        m.slow.mid * 0.35 * Math.sin(phaseK);
      const reach = 30 + 30 * r(i, seed + 2);
      const separation = (7 + state.drift * 8) * Math.sin(t * 0.47 + phaseK);
      ctx.save();
      ctx.translate(Math.cos(phaseK) * separation, Math.sin(phaseK) * separation);
      ctx.rotate(angle);
      ctx.strokeStyle = ink(i, seed + 3, r(i, 9) > 0.28 && i % 4 !== 0, m);
      ctx.lineWidth = (1.5 + 7 * r(i, seed + 4)) * (1 + 0.16 * m.fast.rms);
      ctx.beginPath();
      for (let n = 0; n <= 56; n++) {
        const u = n / 56,
          [gx, gy] = gesture(type, u, phaseK, t, 0.6 + state.bend * 0.6 + m.slow.mid * 0.5);
        const x = gx * reach;
        const y =
          gy * reach +
          Math.sin(u * Math.PI) * m.impulse * state.disturbance * 15 * Math.cos(phaseK);
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
  return state;
}
