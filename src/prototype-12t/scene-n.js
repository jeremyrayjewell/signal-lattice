import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  r = (i, k = 0) => randomAt(691027, i * 101 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const hues = [176, 187, 202, 265, 294, 322, 48, 58, 76, 145];
// Original seeded landscape composition: dense mixed-scale clusters and a wandering dark rift.
const lenses = Array.from({ length: 76 }, (_, i) => {
  const x = -80 + r(i, 1) * 1120,
    y = -65 + r(i, 2) * 670;
  const radius = i < 27 ? 91 + r(i, 3) * 47 : 38 + r(i, 3) * 47;
  return {
    x,
    y,
    radius,
    vertical: r(i, 4) > 0.5,
    hue: hues[Math.floor(r(i, 5) * hues.length)],
    phase: r(i, 6) * TAU,
    count: 10 + Math.floor(r(i, 7) * 8),
  };
});
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  for (let i = 0; i < lenses.length; i++) {
    const entry = introFor(i, intro, 460);
    if (!entry.active) continue;
    const f = lenses[i],
      m = reactive ? controls.at(t - (f.x / 1120) * 0.2 - (i % 4) * 0.035) : zero;
    const drift = 18 + 20 * s.motion;
    let x = f.x + drift * Math.sin(t * (0.31 + r(i, 9) * 0.18) + f.phase) + entry.dx;
    const y = f.y + (15 + 16 * s.motion) * Math.cos(t * 0.39 + f.phase) + entry.dy;
    // Soft spatial displacement concentrates overlaps without a uniform grid or hard visibility changes.
    const channel = 385 + 65 * Math.sin(y * 0.008 + t * 0.24);
    x += 42 * Math.tanh((x - channel) / 100);
    const radius =
      f.radius * (1 + 0.055 * Math.sin(t * 0.53 + f.phase) + m.slow.bass * 0.06) * entry.scale;
    g.save();
    g.translate(x, y);
    if (f.vertical) g.rotate(Math.PI / 2);
    // Each contour is a circular wire lying in its own tilted plane, projected orthographically.
    // This preserves elliptical silhouettes and shared endpoints without the reference's height-stepping loop.
    for (let j = 0; j < f.count; j++) {
      if (j > 0 && r(i, 30 + j) < 0.08) continue;
      const q = j / (f.count - 1);
      const tilt =
        0.035 +
        q * 1.47 +
        0.085 *
          Math.sin(t * (0.66 + 0.07 * (i % 3)) + f.phase + q * 2.3) *
          Math.sin(Math.PI * q) *
          s.articulation;
      const compression = 1 - 0.14 * m.slow.mid * Math.sin(f.phase + q * 2);
      const rr = radius * (1 + 0.018 * m.impulse * s.impulse * Math.sin(j * 0.5 + f.phase));
      g.strokeStyle = `hsl(${f.hue + 2 * m.fast.centroid} 100% 56%)`;
      const accent = (0.5 + 0.5 * Math.sin(t * 1.2 - j * 0.67 + f.phase)) ** 10;
      g.globalAlpha = Math.min(1, 0.8 + 0.1 * m.fast.rms + accent * 0.1 * m.residue);
      g.lineWidth = 1.05 + accent * (0.12 * s.detail + 0.17 * m.fast.high);
      g.beginPath();
      const cosTilt = Math.cos(tilt);
      for (let k = 0; k <= 88; k++) {
        const a = (k / 88) * TAU;
        const px = rr * Math.cos(a),
          py = rr * Math.sin(a) * cosTilt * compression;
        if (k === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
