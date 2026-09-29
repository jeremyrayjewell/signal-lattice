import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(70943, id * 367 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const cells = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: R(id, 0) * TAU,
  spokes: R(id, 1) > 0.5 ? 52 : 29,
  filled: R(id, 2) > 0.5,
  radius: 65 + R(id, 3) * 8,
  sides: 6 + Math.floor(R(id, 4) * 4),
  direction: R(id, 5) > 0.5 ? 1 : -1,
}));
function line(g, x1, y1, x2, y2) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
function polar(r, a) {
  return [r * Math.cos(a), r * Math.sin(a)];
}
function cap(g, r, a, width) {
  const [x, y] = polar(r, a),
    dx = -Math.sin(a) * width,
    dy = Math.cos(a) * width;
  line(g, x - dx, y - dy, x + dx, y + dy);
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineCap = 'butt';
  g.lineJoin = 'miter';
  for (const c of cells) {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.2) : quiet;
    g.save();
    g.translate(
      c.x + entry.dx + 3 * Math.sin(t * 0.5 + c.phase),
      c.y + entry.dy + 3 * Math.cos(t * 0.6 + c.phase),
    );
    g.scale(entry.scale, entry.scale);
    g.rotate(
      c.phase +
        c.direction * t * (0.17 + R(c.id, 6) * 0.14) +
        0.12 * m.slow.mid * Math.sin(t * 0.7 + c.phase),
    );
    g.strokeStyle = '#060606';
    g.lineWidth = 1.25 + 0.3 * m.fast.centroid;
    for (let j = 0; j < c.spokes; j++) {
      const a = (j / c.spokes) * TAU;
      const traveling = Math.sin(a * 3 - t * 1.3 + c.phase);
      const inner =
        c.radius * (0.58 + 0.085 * Math.sin(a * 2 + t * 0.71 + c.phase) + 0.035 * m.slow.bass);
      const outer =
        c.radius * (0.89 + R(c.id, j + 30) * 0.13 + 0.06 * traveling + 0.04 * m.residue);
      const disturbance = m.impulse * s.impulse * 5 * Math.sin(a * 2 + c.phase);
      const tip = outer + disturbance,
        start = inner + 3 * m.fast.high * Math.sin(j * 1.7 + t * 2);
      const [x1, y1] = polar(start, a),
        [x2, y2] = polar(tip, a + 0.012 * Math.sin(t + a * 4));
      line(g, x1, y1, x2, y2);
      if (R(c.id, j + 100) > 0.46) cap(g, start, a, 2.1 + R(c.id, j + 170) * 2.2);
      if (R(c.id, j + 230) > 0.52) cap(g, tip, a, 2.2 + R(c.id, j + 290) * 2.1);
    }
    // A separately moving irregular core preserves the filled/empty contrast.
    g.save();
    g.rotate(-c.direction * t * 0.12 + 0.15 * Math.sin(t * 0.63 + c.phase));
    g.beginPath();
    for (let j = 0; j < c.sides; j++) {
      const a = (j / c.sides) * TAU;
      const radius =
        c.radius *
        (0.42 +
          R(c.id, j + 340) * 0.07 +
          0.035 * Math.sin(t * 0.82 + a * 2 + c.phase) +
          m.slow.bass * 0.025);
      const [x, y] = polar(radius, a);
      if (j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillStyle = c.filled ? '#050505' : '#ffffff';
    g.fill();
    g.lineWidth = 1.5;
    g.stroke();
    g.restore();
    // Independent crossing strokes include white cuts that erase parts of black forms.
    for (let j = 0; j < 9; j++) {
      const seed = c.id * 11 + j,
        ph = R(seed, 360) * TAU;
      const reach = c.radius * (0.65 + R(seed, 361) * 0.6);
      const a = ph + t * (R(seed, 362) - 0.5) * 0.45;
      const center =
        (R(seed, 363) - 0.5) * c.radius * 0.6 + 8 * Math.sin(t * 0.9 + ph) * (1 + 0.3 * m.slow.mid);
      const dx = Math.cos(a) * reach,
        dy = Math.sin(a) * reach;
      g.strokeStyle = j % 3 === 0 ? '#ffffff' : '#070707';
      g.lineWidth = j % 3 === 0 ? 1.9 : 1.25;
      line(g, -dx, center - dy, dx, center + dy);
    }
    g.restore();
  }
  g.restore();
  return s;
}
