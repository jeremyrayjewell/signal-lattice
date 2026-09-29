import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(121686, i * 173 + k);
const palette = [
  '#1B1A17',
  '#592B43',
  '#A8CBD5',
  '#28484F',
  '#2E745D',
  '#E91B22',
  '#F4E008',
  '#E33292',
  '#FBFBFB',
  '#195A9A',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const blocks = Array.from({ length: 60 }, (_, id) => ({
  id,
  x: 48 + (id % 10) * 96,
  y: 45 + Math.floor(id / 10) * 90,
  width: R(id, 0) > 0.5 ? 96 : 48,
  height: R(id, 1) > 0.5 ? 90 : 45,
  color: palette[Math.floor(R(id, 2) * 10)],
  phase: R(id, 3) * TAU,
}));
const rows = Array.from({ length: 6 }, (_, id) => ({
  id,
  phase: R(id, 10) * TAU,
  pitch: 27 + R(id, 11) * 13,
  rx: 18 + R(id, 12) * 10,
  ry: 29 + R(id, 13) * 8,
  direction: id % 2 ? 1 : -1,
  lanes: Array.from({ length: 4 }, (_, k) => ({
    color: palette[Math.floor(R(id, k + 20) * 10)],
    width: 0.85 + R(id, k + 30) * 1.8,
    offset: (R(id, k + 40) - 0.5) * 18,
    phase: R(id, k + 50) * 0.32,
  })),
}));
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (const b of blocks) {
    const e = introFor(b.id, intro, 380);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (b.x / 960) * 0.15) : quiet;
    const w = b.width * (0.97 + 0.025 * Math.sin(t * 0.67 + b.phase) + m.slow.bass * 0.03),
      h = b.height * (0.96 + 0.035 * Math.sin(t * 0.73 + b.phase) + m.impulse * s.impulse * 0.025);
    g.save();
    g.translate(b.x + e.dx, b.y + e.dy);
    g.scale(e.scale, e.scale);
    g.fillStyle = b.color;
    g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
  }
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (const row of rows) {
    const m = reactive ? controls.at(t - 0.03 - row.id * 0.035) : quiet;
    const pitch = row.pitch * (1 + 0.07 * Math.sin(t * 0.51 + row.phase));
    const rx =
      row.rx *
      (1 + 0.13 * Math.sin(t * 0.83 + row.phase) * (1 + s.motion * 0.3) + m.slow.mid * 0.15);
    const ry = row.ry * (1 + 0.08 * Math.sin(t * 0.71 + row.phase) + m.slow.bass * 0.1);
    const travel = (((t * row.direction * (22 + row.id * 2)) % pitch) + pitch) % pitch;
    for (let lane = 0; lane < 4; lane++) {
      const l = row.lanes[lane],
        e = introFor(100 + row.id * 4 + lane, intro, 360);
      if (!e.active) continue;
      g.save();
      g.translate(e.dx, 45 + row.id * 90 + e.dy + 2 * Math.sin(t * 0.63 + row.phase));
      g.scale(1, e.scale);
      g.strokeStyle = l.color;
      g.lineWidth = l.width * (1 + m.fast.rms * 0.16);
      g.beginPath();
      for (let j = 0; j <= 2200; j++) {
        const a = -TAU * 5 + (j / 2200) * TAU * 53,
          phase = a + l.phase + 0.08 * Math.sin(t * 0.91 + lane + row.phase);
        const envelope =
          1 +
          0.075 * Math.sin(2 * phase + t * 0.47 + row.phase) +
          0.035 * Math.sin(3 * phase - t * 0.59);
        const center =
          (a / TAU) * pitch + travel + l.offset + 4 * Math.sin(t * 0.77 + lane + row.phase);
        const x = center + rx * Math.cos(phase) * envelope;
        const y =
          ry * Math.sin(phase) * envelope +
          3 * Math.sin(center * 0.01 + t * 0.87 + row.phase) * m.impulse * s.impulse;
        if (j === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.restore();
    }
  }
  g.restore();
  return s;
}
