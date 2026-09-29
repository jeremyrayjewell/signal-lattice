import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(71079, i * 263 + k);
const colors = ['#2A4D14', '#317B22', '#67E0A3', '#7CF0BD', '#AFF9C9'];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const clusters = Array.from({ length: 190 }, (_, id) => ({
  id,
  x: R(id, 0) * 1160 - 100,
  y: R(id, 1) * 740 - 100,
  size: 175 + R(id, 2) * 105,
  phase: R(id, 3) * TAU,
  color: colors[Math.floor(R(id, 4) * 5)],
  light: R(id, 5) > 0.48,
}));
const stamps = new Map();
function loopLayer(c, bank) {
  const key = c.id * 2 + bank;
  if (stamps.has(key)) return stamps.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.translate(120, 120);
  for (let j = 0; j < 22; j++) {
    const k = bank * 40 + j,
      radius = 12 + R(c.id, k + 10) * 78;
    const x = (R(c.id, k + 60) - 0.5) * (100 - radius * 0.7),
      y = (R(c.id, k + 110) - 0.5) * (100 - radius * 0.7);
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      radius,
      radius * (0.58 + R(c.id, k + 160) * 0.6),
      R(c.id, k + 210) * TAU,
      0,
      TAU,
    );
    ctx.globalAlpha = 0.025 + R(c.id, k + 250) * 0.022;
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.globalAlpha = c.light ? 0.65 : 0.48;
    ctx.strokeStyle = c.light ? '#ffffff' : '#172416';
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  stamps.set(key, canvas);
  return canvas;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (const c of clusters) {
    const e = introFor(c.id, intro, 380);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.18) : quiet;
    g.save();
    g.translate(
      c.x + e.dx + 48 * Math.sin(t * 0.49 + c.phase),
      c.y + e.dy + 43 * Math.cos(t * 0.53 + c.phase),
    );
    g.scale(e.scale, e.scale);
    for (let bank = 0; bank < 2; bank++) {
      const phase = c.phase + bank * 2.3;
      const size = c.size * (1 + 0.17 * Math.sin(t * 0.83 + phase) + m.slow.bass * 0.14);
      g.save();
      g.rotate(
        (bank ? 1 : -1) * t * 0.11 + 0.48 * Math.sin(t * 0.63 + phase) * (1 + s.motion * 0.4),
      );
      g.transform(
        1 + 0.15 * Math.sin(t * 0.77 + phase),
        0.36 * Math.sin(t * 0.71 + phase) + m.slow.mid * 0.16,
        0.34 * Math.cos(t * 0.67 + phase),
        1 + 0.13 * Math.cos(t * 0.81 + phase),
        0,
        0,
      );
      g.globalAlpha = 0.88 + 0.1 * Math.sin(t * 0.61 + phase) + m.fast.rms * 0.02;
      g.drawImage(
        loopLayer(c, bank),
        -size / 2 + 18 * Math.sin(t * 1.03 + phase),
        -size / 2 + 18 * Math.cos(t * 0.97 + phase),
        size,
        size,
      );
      g.restore();
    }
    g.restore();
  }
  // Fine alternating-radius filaments provide sharp accents against the circular veil.
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (let id = 0; id < 118; id++) {
    const e = introFor(id + 300, intro, 390);
    if (!e.active) continue;
    const phase = R(id, 320) * TAU,
      m = reactive ? controls.at(t - 0.02) : quiet;
    const radius = 18 + R(id, 321) * 47;
    g.save();
    g.translate(
      R(id, 322) * 1080 - 60 + 35 * Math.sin(t * 0.61 + phase) + e.dx,
      R(id, 323) * 660 - 60 + 35 * Math.cos(t * 0.57 + phase) + e.dy,
    );
    g.rotate(
      phase +
        t * (R(id, 419) - 0.5) * 0.4 +
        0.7 * Math.sin(t * 0.73 + phase) * (1 + s.motion * 0.4),
    );
    g.scale(e.scale, e.scale);
    g.strokeStyle = colors[Math.floor(R(id, 324) * 5)];
    g.lineWidth = 0.65;
    g.shadowColor = 'rgba(0,0,0,.28)';
    g.shadowBlur = 2;
    g.shadowOffsetX = 1;
    g.shadowOffsetY = 1;
    g.beginPath();
    for (let j = 0; j < 35; j++) {
      const a = -1.45 + (j / 34) * 2.9;
      const profile = j % 2 ? 0.12 + R(id, j + 330) * 0.48 : 0.3 + R(id, j + 370) * 0.85;
      const r =
        radius *
        profile *
        (1 + 0.3 * Math.sin(t * 1.27 + phase + j * 0.31) + m.impulse * s.impulse * 0.48);
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
  }
  g.restore();
  return s;
}
