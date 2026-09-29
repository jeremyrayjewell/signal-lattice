import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(51345, id * 193 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const bands = Array.from({ length: 12 }, (_, id) => ({
  id,
  phase: R(id, 0) * TAU,
  hue: R(id, 1) * 360,
}));
let mosaic;
function texture() {
  if (mosaic) return mosaic;
  mosaic = document.createElement('canvas');
  mosaic.width = 960;
  mosaic.height = 540;
  const g = mosaic.getContext('2d');
  // A fixed multiscale patch texture, rather than the source's subdivision loop.
  for (let i = 0; i < 14000; i++) {
    const size = [2, 3, 5, 9, 15][Math.floor(R(i, 70) * 5)];
    g.fillStyle =
      R(i, 71) > 0.5
        ? `rgba(255,255,255,${0.08 + R(i, 72) * 0.5})`
        : `rgba(0,0,0,${0.1 + R(i, 72) * 0.6})`;
    g.fillRect(
      Math.floor((R(i, 73) * 960) / size) * size,
      Math.floor((R(i, 74) * 540) / size) * size,
      size,
      size,
    );
  }
  return mosaic;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.lineCap = 'butt';
  for (const c of bands) {
    const entry = introFor(c.id, intro, 320);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - c.id * 0.021) : quiet;
    g.save();
    g.translate(c.id * 80 + entry.dx, entry.dy);
    g.scale(entry.scale, entry.scale);
    g.beginPath();
    g.rect(0, 0, 80, 540);
    g.clip();
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 14; k++) {
      const seed = c.id * 19 + k,
        phase = R(seed, 2) * TAU;
      const y =
        R(seed, 3) * 680 -
        70 +
        45 * Math.sin(t * (0.36 + R(seed, 4) * 0.3) + phase) +
        m.slow.bass * 17 * Math.cos(phase);
      const height = 23 + R(seed, 5) * 60;
      const slope = 0.32 * Math.sin(t * 0.69 + phase) + 0.16 * m.slow.mid * Math.sin(phase);
      const hue = (c.hue + k * 53 + 18 * Math.sin(t * 0.23 + phase)) % 360;
      g.save();
      g.translate(40, y);
      g.transform(1, slope, 0, 1, 0, 0);
      const intensity = 0.46 + 0.15 * m.fast.rms;
      const grad = g.createLinearGradient(0, -height, 0, height);
      grad.addColorStop(0, `hsla(${hue},100%,55%,0)`);
      grad.addColorStop(0.35, `hsla(${hue},100%,58%,${intensity * 0.55})`);
      grad.addColorStop(0.5, `hsla(${hue},100%,76%,${intensity})`);
      grad.addColorStop(0.65, `hsla(${hue},100%,58%,${intensity * 0.55})`);
      grad.addColorStop(1, `hsla(${hue},100%,55%,0)`);
      g.fillStyle = grad;
      g.fillRect(-40, -height, 80, height * 2);
      for (let layer = 0; layer < 5; layer++) {
        const h = height * (0.15 + layer * 0.13);
        g.fillStyle = `hsla(${hue + layer * 5},100%,65%,${0.035 + 0.025 * m.residue})`;
        g.save();
        g.transform(1, 0.15 * Math.sin(phase + layer + t * 0.82), 0, 1, 0, 0);
        g.fillRect(-40, -h, 80, h * 2);
        g.restore();
      }
      g.restore();
    }
    // Long independent cursive filaments run through and between the light packets.
    for (let k = 0; k < 9; k++) {
      const phase = c.phase + k * 1.9,
        seed = c.id * 13 + k;
      g.strokeStyle = `hsla(${(c.hue + k * 41) % 360},90%,${k % 3 === 0 ? 88 : 69}%,${0.48 + 0.2 * R(seed, 7)})`;
      g.lineWidth = 0.8 + R(seed, 8) * 1.5 + 0.5 * m.fast.high;
      g.beginPath();
      for (let j = 0; j <= 110; j++) {
        const u = j / 110;
        const x =
          40 +
          30 * Math.sin(u * TAU * (0.8 + R(seed, 9)) + t * 0.51 + phase) +
          10 * Math.sin(u * 11 - t * 0.91 + phase);
        const curl = k % 3 === 0 ? 112 : 45 + R(seed, 10) * 40;
        const y =
          -80 +
          u * 700 +
          curl * Math.sin(u * TAU * 1.5 + t * 0.39 + phase) +
          m.impulse * s.impulse * 9 * Math.sin(u * 8 + phase);
        if (j === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 0.82;
    // Stable seeded texture follows a slow band-local displacement, never random flicker.
    const dy = 3 * Math.sin(t * 0.8 + c.phase) * (1 + 0.3 * m.fast.high);
    g.drawImage(texture(), -c.id * 80, dy);
    g.drawImage(texture(), -c.id * 80, dy - 540);
    g.restore();
  }
  g.restore();
  return s;
}
