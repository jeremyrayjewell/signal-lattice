import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(90332, id * 193 + k);
const colors = [
  '#ff515a',
  '#ffac52',
  '#ffff45',
  '#afff50',
  '#5cff87',
  '#52ffc5',
  '#63f4f4',
  '#58abff',
  '#6353ff',
  '#aa62ff',
  '#ee62ff',
  '#ff62b4',
];
const silent = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const motifs = Array.from({ length: 88 }, (_, id) => ({
  id,
  x: R(id, 0) * 1080 - 60,
  y: R(id, 1) * 660 - 60,
  size: id < 64 ? 42 + R(id, 2) * 63 : 95 + R(id, 2) * 58,
  phase: R(id, 3) * TAU,
  angle: R(id, 4) * TAU,
  color: Math.floor(R(id, 5) * colors.length),
  white: R(id, 6) > 0.48,
  direction: R(id, 7) < 0.5 ? -1 : 1,
  pair: R(id, 8) > 0.38,
}));
function polygon(g, points, fill) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  g.stroke();
}
function arrow(g, size, color, white, depth, shape) {
  // Original arrow silhouette extruded by connecting its visible front/back edges.
  const neck = -size * 0.08,
    tail = -size * 0.49,
    tip = size * 0.48;
  const halfShaft = size * (0.17 + shape * 0.018),
    halfHead = size * 0.43;
  const front = [
    [tail, -halfShaft],
    [neck, -halfShaft],
    [neck, -halfHead],
    [tip, 0],
    [neck, halfHead],
    [neck, halfShaft],
    [tail, halfShaft],
  ];
  const dx = size * depth,
    dy = -size * depth * 0.83;
  g.strokeStyle = white ? '#ffffff' : '#101010';
  g.lineWidth = Math.max(1.4, size * 0.026);
  g.lineJoin = 'round';
  // Draw the rear silhouette first, then exposed side faces, then the front.
  polygon(
    g,
    front.map(([x, y]) => [x + dx, y + dy]),
    colors[(color + 2) % colors.length],
  );
  for (let i = 0; i < front.length; i++) {
    const a = front[i],
      b = front[(i + 1) % front.length];
    if ((b[0] - a[0]) * dy - (b[1] - a[1]) * dx > 0) {
      polygon(
        g,
        [a, [a[0] + dx, a[1] + dy], [b[0] + dx, b[1] + dy], b],
        colors[(color + 1 + (i % 2)) % colors.length],
      );
    }
  }
  polygon(g, front, colors[color]);
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (const c of motifs) {
    const entry = introFor(c.id, intro, 420);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.22) : silent;
    const heading =
      c.angle +
      c.direction * t * (0.055 + R(c.id, 9) * 0.11) * (1 + s.motion * 0.23) +
      0.2 * Math.sin(t * 0.63 + c.phase);
    const wave = Math.sin(t * 0.72 - c.x * 0.006 + c.phase);
    const x = c.x + 24 * Math.sin(t * 0.31 + c.phase) + wave * m.slow.bass * 13;
    const y =
      c.y + 22 * Math.cos(t * 0.39 + c.phase) + m.impulse * s.impulse * 8 * Math.sin(c.phase);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale, entry.scale);
    g.rotate(heading);
    const size = c.size * 1.4 * (1 + 0.025 * m.fast.rms);
    const depth = 0.13 + 0.045 * Math.sin(t * 0.57 + c.phase) + m.slow.bass * 0.045;
    arrow(g, size, c.color, c.white, depth, m.slow.mid);
    if (c.pair) {
      g.save();
      g.translate(size * (0.7 + 0.06 * Math.sin(t * 0.8 + c.phase)), size * 0.56);
      g.rotate(Math.PI + 0.18 * Math.sin(t * 0.53 + c.phase) + m.slow.mid * 0.15);
      arrow(g, size * 0.8, (c.color + 3) % colors.length, c.white, depth, m.slow.mid);
      g.restore();
    }
    // Dotted loops interleave with later arrows rather than forming a topmost overlay.
    const radius = size * (0.85 + 0.13 * Math.sin(t * 0.41 + c.phase) + 0.07 * m.residue);
    const count = 36 + Math.floor(R(c.id, 10) * 28),
      dot = size * (0.007 + R(c.id, 11) * 0.011);
    g.fillStyle = c.white ? '#ffffff' : '#111111';
    const offset = t * (0.24 + 0.12 * m.fast.high) + c.phase;
    for (let j = 0; j < count; j++) {
      const a = (j / count) * TAU + offset;
      const pulse = 1 + 0.15 * m.fast.high * Math.sin(a * 3 - t * 2);
      g.beginPath();
      g.arc(
        size * 0.28 + radius * Math.cos(a),
        -size * 0.17 + radius * Math.sin(a),
        dot * pulse,
        0,
        TAU,
      );
      g.fill();
    }
    g.restore();
  }
  g.restore();
  return s;
}
