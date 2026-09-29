import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(50247, id * 173 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const groups = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: R(id, 0) * TAU,
  angle: (Math.floor(R(id, 1) * 8) * Math.PI) / 4,
  count: 4 + Math.floor(R(id, 2) * 7),
}));
let stamps;
let ground;
let groundPattern;
function texturedGround(g, t, s, m) {
  if (!ground) {
    ground = document.createElement('canvas');
    ground.width = 960;
    ground.height = 540;
    const ctx = ground.getContext('2d'),
      pixels = ctx.createImageData(960, 540);
    for (let y = 0; y < 540; y++)
      for (let x = 0; x < 960; x++) {
        const noise = R(y * 960 + x, 900);
        const coarse = R(Math.floor(y / 3) * 320 + Math.floor(x / 3), 904);
        const weave =
          (x % 6 === 0 ? 12 : x % 6 === 1 ? -7 : 0) + (y % 6 === 0 ? 9 : y % 6 === 1 ? -9 : 0);
        const tone = Math.max(0, Math.round(14 + noise * 24 + coarse * 20 + weave));
        const i = (y * 960 + x) * 4;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = tone;
        pixels.data[i + 3] = 255;
      }
    ctx.putImageData(pixels, 0, 0);
    for (let i = 0; i < 1800; i++) {
      const x = R(i, 901) * 960,
        y = R(i, 902) * 540;
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.38)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4 + R(i, 903) * 18, y + 1.2);
      ctx.stroke();
    }
  }
  if (!groundPattern) groundPattern = g.createPattern(ground, 'repeat');
  // Explicit-time scrolling and flexing keeps offline and seeked frames identical.
  const dx = t * 18 + 12 * Math.sin(t * 0.71) + m.slow.bass * 9;
  const dy = t * 11 + 9 * Math.sin(t * 0.53) + m.impulse * s.impulse * 3;
  const shearX = 0.025 * Math.sin(t * 0.43) * (1 + s.motion * 0.3);
  const shearY = 0.018 * Math.cos(t * 0.37) + m.slow.mid * 0.008;
  groundPattern.setTransform(new DOMMatrix([1, shearY, shearX, 1, dx, dy]));
  g.save();
  g.fillStyle = groundPattern;
  g.fillRect(0, 0, 960, 540);
  g.restore();
}
function glowStamps() {
  if (stamps) return stamps;
  stamps = Array.from({ length: 6 }, (_, id) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 160;
    const g = canvas.getContext('2d'),
      width = 2 + id * 1.8;
    g.lineCap = 'round';
    g.strokeStyle = '#ffffff';
    g.lineWidth = width;
    g.shadowColor = 'rgba(255,255,255,.9)';
    g.shadowBlur = 3.5;
    g.beginPath();
    g.moveTo(20, 20);
    g.lineTo(20, 140);
    g.stroke();
    return canvas;
  });
  return stamps;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) texturedGround(g, t, s, reactive ? controls.at(t) : quiet);
  g.save();
  g.lineCap = 'round';
  // Fine spanning threads connect the separated clusters at a larger scale.
  for (let j = 0; j < 11; j++) {
    const entry = introFor(j + 500, intro, 350);
    if (!entry.active) continue;
    g.save();
    g.translate(entry.dx, entry.dy);
    g.globalAlpha = entry.scale * 0.85;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1;
    const x1 = R(j, 70) * 960 + 18 * Math.sin(t * 0.31 + j),
      y1 = R(j, 71) * 540 + 16 * Math.cos(t * 0.37 + j);
    const x2 = R(j, 72) * 960 + 22 * Math.sin(t * 0.29 + j * 2),
      y2 = R(j, 73) * 540 + 17 * Math.cos(t * 0.41 + j);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.restore();
  }
  for (const c of groups) {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.2) : quiet;
    g.save();
    g.translate(
      c.x + entry.dx + 8 * Math.sin(t * 0.47 + c.phase),
      c.y + entry.dy + 7 * Math.cos(t * 0.53 + c.phase),
    );
    g.scale(entry.scale, entry.scale);
    g.save();
    g.rotate(
      c.angle +
        0.17 * Math.sin(t * 0.58 + c.phase) * (1 + s.motion) +
        m.slow.mid * 0.15 * Math.sin(c.phase),
    );
    const spread = 10 + R(c.id, 3) * 6 + 3 * Math.sin(t * 0.67 + c.phase) + m.slow.bass * 3;
    for (let j = 0; j < c.count; j++) {
      const ph = c.phase + j * 0.7;
      const width = R(c.id, j + 10),
        index = Math.floor(width * 6);
      const length = 77 + 22 * Math.sin(t * 0.79 + ph) + m.impulse * s.impulse * 8 * Math.sin(j);
      const x = (j - (c.count - 1) / 2) * spread,
        y = 5 * Math.sin(t * 0.91 + ph);
      g.globalAlpha =
        0.38 + 0.4 * R(c.id, j + 30) + 0.14 * Math.sin(t * 1.07 + ph) + m.fast.rms * 0.08;
      g.drawImage(glowStamps()[index], x - 14, y - length * 0.66, 28, length * 1.32);
    }
    g.restore();
    g.save();
    g.rotate(0.075 * Math.sin(t * 0.63 + c.phase) + m.slow.mid * 0.04);
    for (let k = 0; k < 4; k++) {
      if (R(c.id, k + 40) < 0.34) continue;
      const size = 62 + 6 * Math.sin(t * 0.57 + c.phase + k),
        ph = c.phase + k * 1.3;
      const x = (k % 2 ? 1 : -1) * 38 + 4 * Math.sin(t * 0.81 + ph),
        y = (k < 2 ? -1 : 1) * 39 + 4 * Math.cos(t * 0.73 + ph);
      const radius = R(c.id, k + 50) > 0.5 ? size * (0.27 + 0.06 * Math.sin(t * 0.49 + ph)) : 0;
      g.strokeStyle = '#ffffff';
      g.lineWidth = 1.25 + 0.2 * m.fast.centroid;
      g.beginPath();
      g.roundRect(x - size / 2, y - size / 2, size, size, radius);
      g.stroke();
    }
    g.restore();
    g.restore();
  }
  g.restore();
  return s;
}
