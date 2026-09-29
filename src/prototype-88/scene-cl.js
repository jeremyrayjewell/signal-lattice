import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(122888, i * 241 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const nodes = Array.from({ length: 82 }, (_, id) => ({
  id,
  x: R(id, 0) * 1140 - 90,
  y: R(id, 1) * 720 - 90,
  size: 65 + R(id, 2) * 82,
  phase: R(id, 3) * TAU,
  angle: R(id, 4) > 0.5 ? Math.PI / 4 : 0,
}));
const patches = [];
for (let y = 0; y < 540; y += 27)
  for (let x = 0; x < 960; x += 27) {
    const id = patches.length,
      v = [1, 2, 4][Math.floor(R(y * 960 + x, 180) * 3)],
      size = 27 / v;
    for (let sy = 0; sy < v; sy++)
      for (let sx = 0; sx < v; sx++) {
        const k = patches.length;
        patches.push({
          x: x + sx * size,
          y: y + sy * size,
          size,
          round: R(k, 181) > 0.5,
          alpha: 0.15 + R(k, 182) * 0.55,
          phase: R(k, 183) * TAU,
        });
      }
  }
let layer;
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    out = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  if (!layer) {
    layer = document.createElement('canvas');
    layer.width = 960;
    layer.height = 540;
  }
  const g = layer.getContext('2d', { willReadFrequently: true });
  g.clearRect(0, 0, 960, 540);
  g.lineCap = 'butt';
  g.lineJoin = 'miter';
  for (const n of nodes) {
    const e = introFor(n.id, intro, 380);
    if (!e.active) continue;
    const local = reactive ? controls.at(t - 0.02 - (n.x / 960) * 0.17) : quiet;
    const size = n.size * (1 + 0.075 * Math.sin(t * 0.71 + n.phase) + local.slow.bass * 0.07),
      half = size / 2;
    g.save();
    g.translate(
      n.x + e.dx + 24 * Math.sin(t * 0.43 + n.phase),
      n.y + e.dy + 22 * Math.cos(t * 0.47 + n.phase),
    );
    g.scale(e.scale, e.scale);
    g.rotate(n.angle + 0.06 * Math.sin(t * 0.51 + n.phase) * (1 + s.motion * 0.4));
    g.strokeStyle = 'rgba(255,255,255,.83)';
    g.lineWidth = 0.65 + local.fast.centroid * 0.25;
    const inner = size * (0.83 + 0.035 * Math.sin(t * 0.83 + n.phase));
    g.strokeRect(-inner / 2, -inner / 2, inner, inner);
    for (let corner = 0; corner < 4; corner++) {
      const sx = corner % 2 ? 1 : -1,
        sy = corner < 2 ? -1 : 1,
        phase = n.phase + corner * 1.4;
      const reach =
        size * (0.84 + 0.13 * Math.sin(t * 0.79 + phase) + local.impulse * s.impulse * 0.07);
      const inset = half * (0.2 + 0.6 * R(n.id, corner + 20));
      g.beginPath();
      g.moveTo(sx * (half - inset), sy * half);
      g.lineTo(sx * reach, sy * half);
      g.moveTo(sx * half, sy * (half - inset));
      g.lineTo(sx * half, sy * reach);
      g.stroke();
      const radius = size * 0.035 * (1 + local.fast.rms * 0.16);
      g.fillStyle = '#ffffff';
      for (const [x, y, r] of [
        [sx * half, sy * half, radius],
        [sx * (half - radius * 1.8), sy * (half - radius * 1.8), radius * 0.66],
        [sx * reach, sy * half, radius * 0.6],
        [sx * half, sy * reach, radius * 0.6],
      ]) {
        g.beginPath();
        g.arc(x, y, r, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  }
  if (intro >= 1) p.background('#000000');
  out.save();
  out.drawImage(layer, 0, 0);
  // A single snapshot supplies multiscale sample patches; it never samples the outgoing scene.
  const pixels = g.getImageData(0, 0, 960, 540).data;
  function value(x, y) {
    const i =
      (Math.max(0, Math.min(539, Math.round(y))) * 960 +
        Math.max(0, Math.min(959, Math.round(x)))) *
      4;
    return (pixels[i] * pixels[i + 3]) / 255;
  }
  for (let id = 0; id < patches.length; id++) {
    const q = patches[id],
      e = introFor(id + 300, intro, 350);
    if (!e.active) continue;
    const x = q.x + q.size / 2,
      y = q.y + q.size / 2;
    const tone = Math.round(
      (value(x, y) * 2 + value(x - 1, y) + value(x + 1, y) + value(x, y - 1) + value(x, y + 1)) / 6,
    );
    out.fillStyle = `rgb(${tone},${tone},${tone})`;
    out.globalAlpha = q.alpha * (0.8 + 0.2 * Math.sin(t * 0.93 + q.phase)) + m.fast.high * 0.07;
    const size = q.size * e.scale;
    out.beginPath();
    out.roundRect(x - size / 2 + e.dx, y - size / 2 + e.dy, size, size, q.round ? size / 2 : 0);
    out.fill();
  }
  out.restore();
  return s;
}
