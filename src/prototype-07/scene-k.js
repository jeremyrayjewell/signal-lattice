import { randomAt } from '../timing.js';
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
export function draw(p, trackTime, elapsed, controls, reactive = true) {
  const state = stateAt(elapsed),
    ctx = p.drawingContext,
    t = trackTime;
  p.background('#ffffff');
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 21; i++) {
    const col = i % 7,
      row = Math.floor(i / 7),
      phase = r(i, 2) * TAU;
    const m = reactive ? controls.at(t - col * 0.035 - row * 0.07) : zero;
    const cx = 72 + col * 136 + (r(i, 3) - 0.5) * 13,
      cy = 94 + row * 176 + (r(i, 4) - 0.5) * 13;
    const radius = 27 + 27 * r(i, 5),
      count = 15 + Math.floor(r(i, 6) * 12);
    const ringColor = ink(i, 7, r(i, 8) > 0.42, m),
      strokeColor = r(i, 9) > 0.43;
    ctx.save();
    ctx.translate(cx, cy);
    const ringX = (r(i, 10) - 0.5) * 16,
      ringY = (r(i, 11) - 0.5) * 17;
    const rotation = phase + 0.055 * t + state.drift * 0.15 * Math.sin(t * 0.23 + phase);
    // Explicit rectangular ticks follow a gently deforming contour.
    for (let j = 0; j < count; j++) {
      const a = (j / count) * TAU + rotation;
      const warp = Math.sin(a * 2 + phase + t * 0.17) * (1 + state.bend * 2 + m.slow.bass * 4);
      const kick = m.impulse * state.disturbance * 5 * Math.sin(j * 0.7 + phase);
      const rr = radius + warp + kick;
      ctx.save();
      ctx.translate(ringX + Math.cos(a) * rr, ringY + Math.sin(a) * rr);
      ctx.rotate(a);
      ctx.fillStyle = ringColor;
      const width = 4 + 5 * r(i, 13) + m.residue * state.detail * 1.8;
      const len =
        ((radius * TAU) / count) * (0.46 + 0.07 * Math.sin(a * 3 - t * 0.6) * m.fast.high);
      ctx.fillRect(-width / 2, -len / 2, width, len);
      ctx.restore();
    }
    // Open polar gestures, independent of ring segmentation and of each other.
    for (let k = 0; k < 3 + (i % 3 === 0 ? 1 : 0); k++) {
      const seed = 20 + k * 19,
        angle = r(i, seed) * TAU;
      const span = 1.3 + 2.2 * r(i, seed + 1),
        reach = 37 + 19 * r(i, seed + 2);
      ctx.strokeStyle = ink(i, seed + 3, strokeColor, m);
      ctx.lineWidth = (2 + 5 * r(i, seed + 4)) * (1 + 0.12 * m.fast.rms);
      ctx.beginPath();
      for (let n = 0; n <= 48; n++) {
        const u = n / 48,
          z = u * 2 - 1;
        const curl = Math.sin(u * Math.PI + phase + k + t * (0.12 + 0.025 * k));
        const theta = angle + span * z + curl * (0.22 + state.bend * 0.2 + m.slow.mid * 0.24);
        const rad =
          reach * (0.16 + 0.85 * Math.pow(Math.abs(z), 0.85)) +
          (5 + state.bend * 3) * Math.sin(u * 4 + phase + t * 0.14);
        const x = Math.cos(theta) * rad + z * 12 + Math.sin(t * 0.21 + phase + k) * state.drift * 3;
        const y =
          Math.sin(theta) * rad +
          m.impulse * state.disturbance * 7 * Math.sin(u * Math.PI) * Math.cos(phase + k);
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  return state;
}
