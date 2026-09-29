import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(50298, i * 233 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const palettes = [
  ['#ffff00', '#00ffff', '#ff00ff'],
  ['#00ffff', '#ff00ff', '#00ffff'],
  ['#ff00ff', '#ffff00', '#ffff00'],
];
const groups = [];
for (let row = 0; row < 5; row++)
  for (let col = -1; col < 10; col++) {
    const id = groups.length;
    groups.push({
      id,
      x: col * 108 + 54 + (R(row, 0) - 0.5) * 70,
      y: 54 + row * 108,
      phase: R(id, 1) * TAU,
      angle: R(id, 2) * TAU,
      colors: palettes[Math.floor(R(id, 3) * 3)],
      counts: Array.from({ length: 4 }, (_, k) => [6, 8, 10][Math.floor(R(id, k + 10) * 3)]),
    });
  }
let layer, mask, stripes;
function surface() {
  const c = document.createElement('canvas');
  c.width = 960;
  c.height = 540;
  return c;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    out = p.drawingContext;
  if (!layer) {
    layer = surface();
    mask = surface();
  }
  const g = layer.getContext('2d'),
    mg = mask.getContext('2d');
  g.clearRect(0, 0, 960, 540);
  if (intro >= 1) {
    g.fillStyle = '#080808';
    g.fillRect(0, 0, 960, 540);
  }
  for (const c of groups) {
    const e = introFor(c.id, intro, 380);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.15) : quiet;
    g.save();
    g.translate(
      c.x + e.dx + 5 * Math.sin(t * 0.43 + c.phase),
      c.y + e.dy + 4 * Math.cos(t * 0.47 + c.phase),
    );
    g.scale(e.scale, e.scale);
    g.rotate(c.angle + t * 0.09 + 0.23 * Math.sin(t * 0.61 + c.phase) * (1 + s.motion * 0.3));
    g.transform(
      1,
      0.12 * Math.sin(t * 0.71 + c.phase),
      0.14 * Math.cos(t * 0.67 + c.phase) + m.slow.mid * 0.05,
      1,
      0,
      0,
    );
    for (let bank = 0; bank < 4; bank++) {
      const phase = c.phase + bank * 1.7,
        count = c.counts[bank];
      const ox = 5 * Math.sin(t * 0.89 + phase) * (1 + m.impulse * s.impulse * 0.45),
        oy = 5 * Math.cos(t * 0.83 + phase);
      const radius = 48 * (1 + 0.045 * Math.sin(t * 0.73 + phase) + m.slow.bass * 0.045);
      g.strokeStyle = bank === 3 ? '#000000' : c.colors[bank];
      for (let j = 0; j < count; j++) {
        const fraction = (j + 0.3) / count,
          r = radius * (1 - fraction);
        g.lineWidth = Math.max(0.25, (96 / count) * 0.25 * fraction) * (1 + m.fast.rms * 0.1);
        g.beginPath();
        g.ellipse(ox, oy, r, r * (1 + 0.045 * Math.sin(t * 0.97 + phase + j * 0.3)), 0, 0, TAU);
        g.stroke();
      }
    }
    g.restore();
  }
  // Preserve incoming-element transparency before applying the full-frame RGB texture.
  mg.clearRect(0, 0, 960, 540);
  mg.drawImage(layer, 0, 0);
  if (!stripes) {
    const tile = document.createElement('canvas');
    tile.width = 6;
    tile.height = 1;
    const ctx = tile.getContext('2d');
    ['#ff0000', '#00ff00', '#0000ff'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * 2, 0, 2, 1);
    });
    stripes = g.createPattern(tile, 'repeat');
  }
  g.save();
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.85;
  g.fillStyle = stripes;
  g.fillRect(0, 0, 960, 540);
  g.globalCompositeOperation = 'destination-in';
  g.globalAlpha = 1;
  g.drawImage(mask, 0, 0);
  g.restore();
  out.drawImage(layer, 0, 0);
  return s;
}
