import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(128100, i * 197 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const patches = [];
for (let row = -1; row < 7; row++)
  for (let col = -1; col < 11; col++) {
    const id = patches.length;
    patches.push({
      id,
      x: col * 108 + (R(row + 1, 0) - 0.5) * 80,
      y: row * 108,
      phase: R(id, 1) * TAU,
      angle: R(id, 2) * TAU,
      wire: R(id, 3) > 0.48,
      size: 140 + R(id, 4) * 38,
    });
  }
const stamps = new Map();
function fold(c) {
  if (stamps.has(c.id)) return stamps.get(c.id);
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
  stamps.set(c.id, canvas);
  return canvas;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  for (const c of patches) {
    const e = introFor(c.id, intro, 380);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.17) : quiet;
    const size = c.size * (1 + 0.07 * Math.sin(t * 0.67 + c.phase) + m.slow.bass * 0.07);
    g.save();
    g.translate(
      c.x + e.dx + 19 * Math.sin(t * 0.39 + c.phase),
      c.y + e.dy + 18 * Math.cos(t * 0.43 + c.phase),
    );
    g.scale(e.scale, e.scale);
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
    // Draw transparent folded mesh; overlapping patches create the gray masses naturally.
    g.drawImage(fold(c), -size * 0.75, -size * 0.75, size * 1.5, size * 1.5);
    g.restore();
  }
  g.restore();
  return s;
}
