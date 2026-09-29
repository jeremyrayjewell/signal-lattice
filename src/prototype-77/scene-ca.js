import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(70577, i * 229 + k);
const palette = ['#20BF55', '#0B4F6C', '#01BAEF', '#FBFBFF', '#757575'];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const bundles = [];
for (let row = 0; row < 7; row++)
  for (let col = 0; col < 12; col++) {
    const cell = row * 12 + col,
      split = R(cell, 0) > 0.46 ? 2 : 1,
      size = 80 / split;
    for (let y = 0; y < split; y++)
      for (let x = 0; x < split; x++) {
        const id = bundles.length;
        bundles.push({
          id,
          x: col * 80 + (x + 0.5) * size,
          y: row * 80 + (y + 0.5) * size - 10,
          size,
          phase: R(id, 2) * TAU,
          angle: (Math.floor(R(id, 3) * 4) * Math.PI) / 2 + (R(id, 4) - 0.5) * 0.65,
          guide: Array.from(
            { length: 5 },
            (_, k) =>
              (k / 4 - 0.5) * (R(id, 10) - 0.5) * 0.5 +
              Math.sin((k / 4) * Math.PI) * (R(id, 11) - 0.5) * 0.65 +
              Math.sin((k / 4) * TAU) * (R(id, 12) - 0.5) * 0.22,
          ),
          lanes: Array.from({ length: 20 }, (_, k) => ({
            color: palette[Math.floor(R(id, k + 20) * 5)],
            width: 0.035 + R(id, k + 40) * 0.06,
            offset: (R(id, k + 60) - 0.5) * 0.24,
            phase: R(id, k + 80) * TAU,
            jitter: Array.from({ length: 5 }, (_, j) => (R(id, k * 5 + j + 100) - 0.5) * 0.09),
          })),
        });
      }
  }
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineCap = 'square';
  g.lineJoin = 'bevel';
  for (const b of bundles) {
    const entry = introFor(b.id, intro, 390);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (b.x / 960) * 0.16) : quiet;
    const angle =
      b.angle +
      0.28 * Math.sin(t * 0.43 + b.phase) * (1 + s.motion * 0.35) +
      m.slow.mid * 0.16 * Math.sin(b.phase);
    const breathing = 1 + 0.055 * Math.sin(t * 0.61 + b.phase) + m.slow.bass * 0.06;
    g.save();
    g.translate(
      b.x + entry.dx + 4 * Math.sin(t * 0.37 + b.phase),
      b.y + entry.dy + 4 * Math.cos(t * 0.41 + b.phase),
    );
    g.rotate(angle);
    g.scale(b.size * entry.scale * breathing, b.size * entry.scale * breathing);
    const guide = b.guide.map(
      (v, k) =>
        v +
        0.085 * Math.sin(t * 0.71 + b.phase + k * 0.92) * (1 + s.motion * 0.4 + m.slow.bass * 0.45),
    );
    for (const lane of b.lanes) {
      const spread = 1 + 0.2 * Math.sin(t * 0.59 + lane.phase) + m.impulse * s.impulse * 0.4;
      g.strokeStyle = lane.color;
      g.lineWidth = lane.width * (1 + m.fast.rms * 0.13);
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const x = -0.44 + k * 0.22 + 0.02 * Math.sin(t * 0.67 + lane.phase + k);
        const y =
          guide[k] +
          lane.offset * spread +
          lane.jitter[k] +
          0.022 * Math.sin(t * 0.93 + lane.phase + k * 0.7);
        if (k === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
