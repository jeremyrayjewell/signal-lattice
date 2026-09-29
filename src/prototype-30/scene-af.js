import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  r = (i, k = 0) => randomAt(82430, i * 127 + k);
const colors = ['#bd595b', '#c8bd46', '#e7c18a', '#574756', '#352642'];
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const tiles = [];
for (let col = 0; col < 7; col++)
  for (let row = -1; row < 5; row++) {
    const id = col * 8 + row + 1;
    tiles.push({
      id,
      x: 67 + col * 138,
      y: 58 + row * 150 + (r(col, 30) - 0.5) * 77,
      size: 102 + r(id, 1) * 12,
      angle: (Math.floor(r(id, 2) * 4) * Math.PI) / 2,
      phase: r(id, 3) * TAU,
      mode: Math.floor(r(id, 4) * 6),
      pitch: 7 + r(id, 5) * 9,
      color: colors[Math.floor(r(id, 6) * colors.length)],
      mirror: r(id, 7) < 0.5 ? -1 : 1,
    });
  }
function circle(g, x, y, radius) {
  g.beginPath();
  g.arc(x, y, radius, 0, TAU);
}
function stripeField(g, size, pitch, color, phase, alpha) {
  g.save();
  g.rotate(-Math.PI / 4);
  g.globalAlpha = alpha;
  g.fillStyle = color;
  const offset = ((phase % pitch) + pitch) % pitch;
  for (let x = -size * 2 + offset; x < size * 2; x += pitch)
    g.fillRect(x, -size * 2, pitch * 0.48, size * 4);
  g.restore();
}
function mark(g, kind, x, y, angle, scale) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.scale(scale, scale);
  for (const [color, width] of [
    ['#ffffff', 6.5],
    ['#111111', 2.5],
  ]) {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    if (kind === 0) {
      g.moveTo(11, -12);
      g.bezierCurveTo(5, -20, -13, -18, -14, 0);
      g.bezierCurveTo(-15, 18, 2, 21, 9, 8);
      g.bezierCurveTo(13, 0, 13, -9, 15, -16);
      g.moveTo(11, -12);
      g.bezierCurveTo(7, -3, 9, 18, 19, 16);
    } else {
      g.moveTo(-19, 17);
      g.lineTo(-7, 17);
      g.lineTo(-7, 11);
      g.bezierCurveTo(-23, -1, -18, -19, 0, -19);
      g.bezierCurveTo(18, -19, 23, -1, 7, 11);
      g.lineTo(7, 17);
      g.lineTo(19, 17);
    }
    g.stroke();
  }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const s = stateAt(elapsed),
    t = trackTime,
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  g.lineJoin = 'miter';
  g.lineCap = 'round';
  for (const c of tiles) {
    const entry = introFor(c.id, intro, 340);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.18) : zero;
    const hit = m.impulse * s.impulse,
      size = c.size,
      h = size / 2;
    const wobble =
      (0.04 + 0.07 * s.motion) * Math.sin(t * 0.67 + c.phase) + 0.035 * Math.sin(t * 1.11 + c.id);
    const y = c.y + 9 * Math.sin(t * 0.43 + c.phase) + hit * 3 * Math.sin(c.id);
    g.save();
    g.translate(c.x + entry.dx, y + entry.dy);
    g.rotate(wobble);
    g.scale(entry.scale * (1 + 0.025 * m.slow.bass), entry.scale * (1 + 0.025 * m.slow.bass));
    g.save();
    g.rotate(c.angle);
    g.scale(c.mirror, 1);
    const rr = size * 0.255,
      sep = size * (0.14 + 0.048 * Math.sin(t * 0.77 + c.phase) + m.slow.bass * 0.028);
    const dy = size * 0.035 * Math.sin(t * 0.83 + c.phase) + m.slow.mid * 3 * Math.cos(c.id);
    const centers = [
      [-sep, dy],
      [sep, -dy],
    ];
    const phase = t * (8 + r(c.id, 12) * 9) + Math.sin(t * 0.6 + c.phase) * 4,
      alpha = 0.87 + 0.08 * m.fast.rms;
    if (c.mode === 5) {
      g.save();
      g.beginPath();
      g.rect(-h - 10, -h - 10, size + 20, size + 20);
      g.clip();
      stripeField(g, size, c.pitch, c.color, phase, alpha);
      g.restore();
    }
    g.fillStyle = '#ffffff';
    g.fillRect(-h, -h, size, size);
    g.save();
    g.beginPath();
    g.rect(-h, -h, size, size);
    g.clip();
    if (c.mode === 0 || c.mode === 4) {
      stripeField(g, size, c.pitch, c.color, phase, alpha);
      for (const [x, y] of centers) {
        circle(g, x, y, rr);
        g.fillStyle = '#ffffff';
        g.fill();
      }
    }
    if (c.mode === 1 || c.mode === 2 || c.mode === 4) {
      g.save();
      circle(g, ...centers[0], rr);
      g.clip();
      if (c.mode !== 1) {
        circle(g, ...centers[1], rr);
        g.clip();
      }
      stripeField(g, size, c.pitch, c.color, phase, alpha);
      g.restore();
    }
    if (c.mode === 3)
      for (const [x, y] of centers) {
        g.save();
        circle(g, x, y, rr);
        g.clip();
        stripeField(g, size, c.pitch, c.color, phase, alpha);
        g.restore();
      }
    g.restore();
    g.strokeStyle = '#111111';
    g.lineWidth = 1.6 + 0.3 * m.fast.centroid;
    g.strokeRect(-h, -h, size, size);
    for (const [x, y] of centers) {
      circle(g, x, y, rr);
      g.stroke();
    }
    g.restore();
    const side = r(c.id, 13) > 0.5 ? 1 : -1,
      cornerY = r(c.id, 14) > 0.5 ? 1 : -1,
      tilt = 0.12 * Math.sin(t * 0.9 + c.phase) + m.residue * 0.08;
    mark(g, 0, side * h * 0.77, cornerY * h * 0.79, tilt, 1 + 0.08 * m.fast.high);
    mark(g, 1, -side * h * 0.77, -cornerY * h * 0.79, -tilt, 1 + 0.07 * hit);
    g.restore();
  }
  g.restore();
  return s;
}
