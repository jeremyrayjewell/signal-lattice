import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(111433, id * 197 + k);
const palette = [
  '#ff003b',
  '#ff6800',
  '#ffc800',
  '#deff00',
  '#74ff00',
  '#00ed54',
  '#00ffb6',
  '#00efff',
  '#009dff',
  '#1834ff',
  '#6800ff',
  '#c400ff',
  '#ff00da',
  '#ff0082',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const cells = [];
for (let half = 0; half < 2; half++)
  for (let row = 0; row < 11; row++)
    for (let col = -18; col < 35; col++) {
      const id = half * 1000 + row * 53 + col + 18;
      cells.push({
        id,
        half,
        row,
        col,
        phase: R(id, 0) * TAU,
        color: palette[Math.floor(R(id, 1) * palette.length)],
        hole: 0.25 + R(id, 2) * 0.59,
      });
    }
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  const global = reactive ? controls.at(t) : quiet;
  const seam = 270 + 9 * Math.sin(t * 0.23) + global.slow.bass * 5 * Math.sin(t * 0.37);
  g.save();
  g.lineCap = 'round';
  for (let half = 0; half < 2; half++) {
    g.save();
    g.beginPath();
    g.rect(0, half ? seam : 0, 960, half ? 540 - seam : seam);
    g.clip();
    for (const c of cells) {
      if (c.half !== half) continue;
      const entry = introFor(c.id, intro, 350);
      if (!entry.active) continue;
      const m = reactive ? controls.at(t - 0.02 - Math.max(0, c.col) * 0.009) : quiet;
      // Independent analytic perspective fields converge at the outer edges.
      const depth = (c.row + 0.5) / 11,
        near = depth * depth;
      const scale = 0.37 + near * 0.89;
      const bandY = near * (half ? 540 - seam : seam);
      const y = half ? 540 - bandY : bandY;
      const spacing = 57 * scale;
      const x =
        480 +
        (c.col - 8) * spacing +
        14 * Math.sin(t * 0.39 + c.row * 0.63 + half * 2) +
        (R(c.id, 12) - 0.5) * 24 * scale;
      if (intro >= 1 && (x < -90 || x > 1050)) continue;
      const bend =
        7 * Math.sin(t * 0.71 + c.col * 0.54 + c.row * 0.33) +
        m.slow.bass * 9 * Math.sin(c.phase + t * 0.42);
      const rx = (28 + R(c.id, 3) * 13) * scale;
      const ry = rx * (0.48 + 0.14 * Math.sin(t * 0.47 + c.phase) + 0.1 * m.slow.mid);
      const tilt =
        0.62 * Math.sin(t * 0.32 + c.phase) + m.impulse * s.impulse * 0.09 * Math.sin(c.id);
      g.save();
      g.translate(x + entry.dx, y + bend * scale + entry.dy);
      g.scale(entry.scale, entry.scale);
      g.rotate(tilt);
      // Opaque black apertures preserve the layered-disc appearance of the sample.
      g.fillStyle = c.color;
      g.beginPath();
      g.ellipse(0, 0, rx, ry, 0, 0, TAU);
      g.fill();
      const hole = Math.max(
        0.17,
        Math.min(0.92, c.hole + 0.065 * Math.sin(t * 0.8 + c.phase) + m.slow.bass * 0.045),
      );
      g.fillStyle = '#000000';
      g.beginPath();
      g.ellipse(rx * 0.045 * Math.sin(t * 0.63 + c.phase), 0, rx * hole, ry * hole, 0, 0, TAU);
      g.fill();
      g.restore();
      if (R(c.id, 4) < 0.56) {
        g.save();
        g.translate(x + entry.dx, y + bend * scale + entry.dy);
        g.scale(entry.scale, entry.scale);
        const length = (36 + R(c.id, 5) * 100) * scale * (1 + 0.2 * m.residue);
        for (let k = 0; k < 3; k++) {
          const ph = c.phase + k * 1.7,
            sway = 12 * Math.sin(t * (0.7 + k * 0.13) + ph) * (1 + 0.35 * m.fast.high);
          g.strokeStyle =
            k === 1 ? 'rgba(0,0,0,.85)' : `rgba(255,255,255,${0.42 + 0.2 * m.fast.centroid})`;
          g.lineWidth = 0.45 + R(c.id, k + 6) * 0.3;
          g.beginPath();
          g.moveTo(-18 * scale + Math.sin(ph) * 12, -length);
          g.bezierCurveTo(
            sway,
            -length * 0.36,
            -sway,
            length * 0.4,
            Math.cos(ph) * 24 * scale,
            length,
          );
          g.stroke();
        }
        g.restore();
      }
    }
    g.restore();
  }
  g.restore();
  return s;
}
