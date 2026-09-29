import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(10190, i * 277 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const hues = [0, 28, 55, 86, 126, 164, 190, 224, 266, 298, 327, 348];
const cells = [];
for (let row = 0; row < 7; row++)
  for (let col = 0; col < 12; col++) {
    const id = row * 12 + col,
      v = [1, 2, 4][Math.floor(R(id, 0) * 3)],
      size = 80 / v;
    for (let y = 0; y < v; y++)
      for (let x = 0; x < v; x++) {
        const k = cells.length;
        cells.push({
          id: k,
          x: col * 80 + (x + 0.5) * size,
          y: row * 80 + (y + 0.5) * size - 10,
          size,
          phase: R(k, 2) * TAU,
          facets: Array.from({ length: 1 + Math.floor(R(k, 3) * 6) }, (_, j) => ({
            angle: (Math.floor(R(k, j + 10) * 4) * Math.PI) / 2,
            hue: hues[Math.floor(R(k, j + 20) * 12)],
            alpha: 0.045 + R(k, j + 30) * 0.16,
          })),
        });
      }
  }
const bands = Array.from({ length: 10 }, (_, id) => ({
  id,
  phase: R(id, 60) * TAU,
  hue: [55, 0, 126, 298, 190, 28, 86, 327, 164, 348][id],
  speed: (id % 2 ? 1 : -1) * (0.1 + R(id, 61) * 0.11),
}));
const sprites = new Map();
function stamp(hue) {
  if (sprites.has(hue)) return sprites.get(hue);
  const c = document.createElement('canvas');
  c.width = c.height = 80;
  const g = c.getContext('2d');
  const gradient = g.createRadialGradient(40, 40, 0, 40, 40, 39);
  gradient.addColorStop(0, `hsla(${hue},100%,50%,1)`);
  gradient.addColorStop(0.88, `hsla(${hue},100%,50%,.95)`);
  gradient.addColorStop(1, `hsla(${hue},100%,50%,0)`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, 80, 80);
  sprites.set(hue, c);
  return c;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'screen';
  for (const c of cells) {
    const e = introFor(c.id + 400, intro, 360);
    if (!e.active) continue;
    g.save();
    g.translate(c.x + e.dx, c.y + e.dy);
    g.scale(e.scale, e.scale);
    for (const f of c.facets) {
      g.save();
      g.rotate(f.angle);
      g.fillStyle = `hsl(${f.hue},100%,50%)`;
      g.globalAlpha = f.alpha * (0.48 + 0.2 * Math.sin(t * 0.63 + c.phase)) + m.fast.high * 0.02;
      const h = c.size / 2;
      g.beginPath();
      g.moveTo(-h, -h);
      g.lineTo(-h, h);
      g.lineTo(h, h);
      g.closePath();
      g.fill();
      g.restore();
    }
    g.restore();
  }
  const cx = 480 + 9 * Math.sin(t * 0.31),
    cy = 270 + 7 * Math.cos(t * 0.37);
  for (const b of bands) {
    const e = introFor(b.id, intro, 370);
    if (!e.active) continue;
    const local = reactive ? controls.at(t - 0.025 - b.id * 0.018) : quiet;
    g.save();
    g.translate(cx + e.dx, cy + e.dy);
    g.scale(e.scale, e.scale);
    for (let j = 0; j < 170; j++) {
      const a = (j / 170) * TAU + t * b.speed;
      const shape =
        15 * Math.sin(a * 3 + b.phase + t * 0.37) +
        10 * Math.cos(a * 5 - b.phase + t * 0.29) +
        7 * Math.sin(a * 11 + b.phase - t * 0.41);
      const radius = 212 + shape + 12 * Math.sin(t * 0.71 + b.phase) + local.slow.bass * 12;
      const size =
        49 +
        29 * (0.5 + 0.5 * Math.sin(a * 4 + b.phase - t * 0.83)) +
        local.impulse * s.impulse * 10;
      const x = 1.5 * radius * Math.cos(a),
        y = radius * Math.sin(a);
      g.globalAlpha = 0.1 + 0.035 * Math.sin(a * 2 + b.phase + t * 0.61) + local.fast.rms * 0.018;
      g.drawImage(stamp(b.hue), x - size / 2, y - size / 2, size, size);
    }
    g.restore();
  }
  // A second, restrained triangle pass keeps the mosaic present over the luminous ring.
  g.globalAlpha = 0.04;
  for (let i = 0; i < cells.length; i += 3) {
    const c = cells[i],
      e = introFor(c.id + 400, intro, 360);
    if (!e.active) continue;
    g.fillStyle = `hsl(${c.facets[0].hue},100%,50%)`;
    const h = c.size * 0.5 * e.scale,
      x = c.x + e.dx,
      y = c.y + e.dy;
    g.beginPath();
    g.moveTo(x - h, y - h);
    g.lineTo(x + h, y - h);
    g.lineTo(x + h, y + h);
    g.closePath();
    g.fill();
  }
  g.restore();
  return s;
}
