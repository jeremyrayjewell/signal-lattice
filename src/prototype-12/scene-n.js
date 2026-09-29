import { randomAt } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(91027, id * 83 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const hues = [178, 211, 269, 319, 348, 32, 54, 85, 137, 160];
const big = [
  [-15, 45, 108],
  [195, 20, 120],
  [413, 45, 99],
  [649, 12, 115],
  [898, 45, 113],
  [55, 213, 103],
  [302, 180, 111],
  [518, 226, 104],
  [805, 211, 121],
  [1010, 246, 114],
  [-20, 476, 112],
  [243, 450, 113],
  [463, 456, 116],
  [697, 462, 98],
  [920, 472, 111],
];
const forms = [
  ...big,
  ...Array.from({ length: 19 }, (_, k) => [
    25 + r(k, 31) * 910,
    20 + r(k, 32) * 500,
    35 + r(k, 33) * 37,
  ]),
];
export function draw(p, trackTime, elapsed, controls, reactive = true) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  forms.forEach(([bx, by, rad], id) => {
    const m = reactive ? controls.at(t - (bx / 960) * 0.17 - (id % 4) * 0.04) : zero;
    const phase = r(id) * TAU,
      orientation = r(id, 1) * TAU;
    const x = bx + 16 * s.motion * Math.sin(t * 0.31 + phase),
      y = by + 19 * s.motion * Math.cos(t * 0.37 + phase);
    const yaw = t * (0.21 + r(id, 2) * 0.2) + phase + m.slow.mid * 0.36;
    const pitch =
      0.32 * Math.sin(t * 0.43 + phase) + 0.3 + m.impulse * s.impulse * 0.12 * Math.cos(phase);
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      cp = Math.cos(pitch),
      sp = Math.sin(pitch);
    const stretch = 0.7 + 0.3 * r(id, 3) + 0.13 * Math.sin(t * 0.35 + phase) + m.slow.bass * 0.12;
    const count = 9 + Math.floor(r(id, 4) * 6),
      hue = hues[Math.floor(r(id, 5) * hues.length)];
    g.save();
    g.translate(x, y);
    g.rotate(orientation + 0.14 * s.motion * Math.sin(t * 0.27 + phase));
    for (let j = 0; j < count; j++) {
      // Seeded omissions make sparse lenses coexist with densely articulated volumes.
      if (j > 0 && r(id, j + 40) < 0.11) continue;
      const longitude = (j / count) * Math.PI + 0.12 * Math.sin(t * 0.41 + phase);
      const selected = (0.5 + 0.5 * Math.sin(j * 1.3 - t * 1.1 + phase)) ** 8;
      g.strokeStyle = `hsl(${hue + 4 * m.fast.centroid} 100% ${52 + 6 * m.fast.centroid}%)`;
      g.globalAlpha = 0.66 + 0.12 * m.fast.rms + selected * m.residue * 0.14;
      g.lineWidth = 0.9 + selected * (0.25 * s.detail + m.fast.high * 0.25);
      g.beginPath();
      for (let step = 0; step <= 80; step++) {
        const u = (step / 80) * TAU;
        const flex =
          1 +
          0.045 * s.articulation * Math.sin(u * 3 + phase + t * 0.47) +
          m.impulse * s.impulse * 0.03 * Math.sin(u * 2 + longitude);
        const xx = Math.cos(u) * rad * stretch * flex,
          yy = Math.sin(u) * Math.cos(longitude) * rad * flex,
          zz = Math.sin(u) * Math.sin(longitude) * rad;
        // Analytic orthographic projection of independently rotating meridian circles.
        const rx = xx * cy + zz * sy,
          rz = -xx * sy + zz * cy,
          ry = yy * cp - rz * sp;
        if (step === 0) g.moveTo(rx, ry);
        else g.lineTo(rx, ry);
      }
      g.closePath();
      g.stroke();
    }
    g.restore();
  });
  g.restore();
  return s;
}
