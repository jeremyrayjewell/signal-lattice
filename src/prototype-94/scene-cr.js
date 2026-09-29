import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(30494, i * 397 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const bands = Array.from({ length: 132 }, (_, id) => ({
  id,
  x: R(id, 0) * 1240 - 140,
  y: R(id, 1) * 820 - 140,
  length: 205 + R(id, 2) * 110,
  width: 65 + R(id, 3) * 65,
  angle: R(id, 4) * TAU,
  phase: R(id, 5) * TAU,
  frequency: R(id, 6) > 0.5 ? 48 : 10,
  color: `hsl(${Math.floor(R(id, 7) * 360)},100%,50%)`,
  alpha: 0.29 + R(id, 8) * 0.23,
  lanes: Array.from({ length: 7 }, (_, j) => ({
    scale: 1 - j * 0.13,
    phase: R(id, j + 10) * 0.3,
    noise: Float32Array.from({ length: 256 }, (_, k) => 0.08 + R(id, j * 256 + k + 30) * 0.92),
  })),
}));
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'screen';
  g.lineCap = 'butt';
  g.lineJoin = 'bevel';
  for (const b of bands) {
    const e = introFor(b.id, intro, 390);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (b.x / 960) * 0.18) : quiet;
    g.save();
    g.translate(
      b.x + e.dx + 27 * Math.sin(t * 0.43 + b.phase),
      b.y + e.dy + 24 * Math.cos(t * 0.47 + b.phase),
    );
    g.scale(e.scale, e.scale);
    g.rotate(b.angle + 0.22 * Math.sin(t * 0.51 + b.phase) * (1 + s.motion * 0.35));
    g.strokeStyle = b.color;
    g.lineWidth = 0.65 + m.fast.centroid * 0.2;
    g.globalAlpha = Math.min(
      0.75,
      b.alpha * (0.82 + 0.18 * Math.sin(t * 0.83 + b.phase)) +
        m.fast.high * 0.13 +
        m.fast.rms * 0.09,
    );
    const width =
      b.width *
      (1 + 0.2 * Math.sin(t * 0.71 + b.phase) + m.slow.bass * 0.25 + m.impulse * s.impulse * 0.18);
    const length = b.length * (1 + 0.05 * Math.sin(t * 0.61 + b.phase));
    for (let lane = 0; lane < b.lanes.length; lane++) {
      const l = b.lanes[lane],
        travel = t * (5 + lane * 0.35),
        whole = Math.floor(travel),
        fraction = travel - whole;
      g.beginPath();
      for (let j = 0; j <= 250; j++) {
        const u = j / 250,
          index = (j + whole) % 256;
        const jitter = l.noise[index] * (1 - fraction) + l.noise[(index + 1) % 256] * fraction;
        const wave = TAU * b.frequency * u + t * 1.9 + b.phase + l.phase;
        const x = (u - 0.5) * length;
        const y =
          width * l.scale * 0.5 * jitter * Math.sin(wave) +
          4 * Math.sin(u * TAU + t * 0.59 + b.phase) * m.slow.mid;
        if (j === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
