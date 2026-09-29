import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(62944, id * 137 + k);
const colors = [
  '#050505',
  '#192940',
  '#f2a51a',
  '#bf182a',
  '#719bb4',
  '#84a954',
  '#e4e5e3',
  '#ffffff',
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const tiles = [];
for (let col = 0; col < 12; col++)
  for (let row = -2; row < 10; row++) {
    const id = col * 16 + row + 2;
    tiles.push({
      id,
      col,
      row,
      phase: R(id, 0) * TAU,
      angle: (Math.floor(R(id, 1) * 4) * Math.PI) / 2,
      inset: R(id, 2) < 0.42 ? 9 : 2,
      gray: Math.round(45 + R(id, 3) * 180),
      style: Math.floor(R(id, 4) * 3),
    });
  }
function polygon(g, points, color) {
  g.fillStyle = color;
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function panelTurn(id, t) {
  const period = 10 + R(id, 150) * 9,
    clock = t + R(id, 151) * period;
  const cycle = Math.floor(clock / period),
    local = clock - cycle * period;
  const u = Math.min(1, local / (1.2 + R(id, 152) * 0.6));
  const ease = u * u * u * (u * (u * 6 - 15) + 10);
  return (((cycle + ease) * Math.PI) / 2) * (R(id, 153) > 0.5 ? 1 : -1);
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.lineCap = 'butt';
  for (const c of tiles) {
    const entry = introFor(c.id, intro, 320);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - c.col * 0.019) : quiet;
    const columnPhase = R(c.col, 70) * TAU;
    // Oscillating column transport remains seekable and needs no wrapping state.
    const slide =
      66 * Math.sin(t * 0.69 + columnPhase) + 24 * Math.sin(t * 1.13 + columnPhase * 0.7);
    const y = c.row * 80 + slide + R(c.col, 71) * 60 + m.slow.bass * 17 * Math.sin(columnPhase);
    const x =
      40 +
      c.col * 80 +
      5 * Math.sin(t * 0.81 + columnPhase) +
      m.impulse * s.impulse * 3 * Math.cos(c.phase);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale, entry.scale);
    if (c.inset > 2) {
      // Thin multicolor edge teeth sit behind the inset panel.
      for (let k = 0; k < 32; k++) {
        if (R(c.id, k + 10) < 0.25) continue;
        g.strokeStyle = colors[Math.floor(R(c.id, k + 50) * colors.length)];
        g.lineWidth = 0.65 + R(c.id, k + 90) * 0.7;
        const px = -39 + k * 2.5,
          shift = 5 * Math.sin(t * 2.1 + k * 0.5 + c.phase) * (1 + 0.65 * m.fast.high);
        g.beginPath();
        g.moveTo(px, -39 + shift);
        g.lineTo(px, 39 + shift);
        g.stroke();
      }
    }
    g.rotate(c.angle + (c.id % 3 === 0 ? panelTurn(c.id, t) : 0));
    const h = 40 - c.inset - 3 * Math.sin(t * 1.09 + c.phase) * (1 + 0.35 * m.residue);
    g.fillStyle = `rgb(${c.gray},${c.gray},${c.gray})`;
    g.fillRect(-h, -h, h * 2, h * 2);
    const px =
      h * (-0.12 + 0.62 * Math.sin(t * 1.23 + c.phase)) + 0.12 * h * m.slow.mid * Math.cos(c.phase);
    const py = h * 0.53 * Math.cos(t * 1.37 + c.phase) + m.impulse * s.impulse * 4 * Math.sin(c.id);
    const hub = [px, py],
      corners = [
        [-h, -h],
        [h, -h],
        [h, h],
        [-h, h],
      ];
    // Independent triangular sectors, with occasional neutral sectors left exposed.
    for (let k = 0; k < 4; k++) {
      if (k === c.style && R(c.id, 120) > 0.35) continue;
      const start = corners[k],
        end = corners[(k + 1) % 4];
      const color = colors[Math.floor(R(c.id, k + 121) * colors.length)];
      if ((k + c.id) % 3 === 0) {
        const mix = 0.08 + 0.72 * Math.sin(t * 0.93 + c.phase + k);
        const edge = [
          start[0] + (end[0] - start[0]) * (0.5 + mix * 0.5),
          start[1] + (end[1] - start[1]) * (0.5 + mix * 0.5),
        ];
        polygon(g, [hub, start, edge], color);
      } else polygon(g, [hub, start, end], color);
    }
    g.lineWidth = 0.55 + 0.16 * m.fast.centroid;
    for (let k = 0; k < 3; k++) {
      const corner = corners[(k + c.style) % 4];
      g.strokeStyle = colors[Math.floor(R(c.id, k + 130) * colors.length)];
      g.beginPath();
      g.moveTo(...hub);
      g.lineTo(...corner);
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
