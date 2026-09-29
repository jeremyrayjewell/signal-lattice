import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (i, k) => randomAt(71173, i * 197 + k);
const colors = [
  [173, 255, 0],
  [225, 245, 0],
  [80, 230, 0],
  [0, 255, 209],
  [255, 148, 0],
  [245, 24, 209],
  [149, 32, 225],
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const clusters = Array.from({ length: 172 }, (_, id) => {
  const gray = R(id, 4) < 0.36;
  const value = R(id, 5) < 0.22 ? 28 : 180 + R(id, 6) * 75;
  const color = gray ? [value, value, value] : colors[Math.floor(R(id, 7) * colors.length)];
  return {
    id,
    x: R(id, 0) * 1100 - 70,
    y: R(id, 1) * 680 - 70,
    size: 100 + R(id, 2) * 115,
    phase: R(id, 3) * TAU,
    color,
    plates: Array.from({ length: 18 }, (_, j) => ({
      y: (j - 8.5) * 0.035,
      width: 0.25 + R(id, j + 20) * 0.8,
      depth: 0.22 + R(id, j + 40) * 0.82,
      tilt: R(id, j + 60) > 0.55 ? (R(id, j + 80) - 0.5) * 2.4 : 0,
      angle: (R(id, j + 100) - 0.5) * 1.8,
      alpha: 0.22 + R(id, j + 120) * 0.53,
    })),
  };
});
function rotate(v, ax, ay, az) {
  let [x, y, z] = v,
    c = Math.cos(ax),
    s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ay);
  s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(az);
  s = Math.sin(az);
  return [x * c - y * s, x * s + y * c, z];
}
const faces = [
  [0, 1, 2, 3],
  [4, 7, 6, 5],
  [0, 4, 5, 1],
  [3, 2, 6, 7],
  [0, 3, 7, 4],
  [1, 5, 6, 2],
];
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  for (const c of clusters) {
    const e = introFor(c.id, intro, 390);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.17) : quiet;
    const angle = c.phase + t * (R(c.id, 150) - 0.5) * 0.14 + 0.17 * Math.sin(t * 0.37 + c.phase);
    const scale = c.size * (1 + 0.065 * Math.sin(t * 0.53 + c.phase) + m.slow.bass * 0.07);
    const spread =
      1 + 0.16 * Math.sin(t * 0.67 + c.phase) * (1 + s.motion * 0.3) + m.impulse * s.impulse * 0.12;
    const polygons = [];
    for (let j = 0; j < c.plates.length; j++) {
      const plate = c.plates[j],
        ph = c.phase + j * 0.31;
      const w = plate.width * 0.5,
        d = plate.depth * 0.5,
        h = 0.003 + (18 - j) * 0.00065;
      const ax = plate.tilt + 0.25 * Math.sin(t * 0.59 + ph) * (1 + s.motion * 0.4);
      const ay = plate.angle + j * 0.065 + 0.25 * Math.sin(t * 0.47 + ph) + m.slow.mid * 0.22;
      const points = [
        [-w, -h, -d],
        [w, -h, -d],
        [w, -h, d],
        [-w, -h, d],
        [-w, h, -d],
        [w, h, -d],
        [w, h, d],
        [-w, h, d],
      ].map((v) => {
        const q = rotate(v, ax, ay, 0);
        q[1] += plate.y * spread;
        return rotate(q, -0.58 + 0.15 * Math.sin(t * 0.31 + c.phase), 0.72, angle);
      });
      for (const ids of faces) {
        const v = ids.map((i) => points[i]);
        const a = v[1].map((x, i) => x - v[0][i]),
          b = v[2].map((x, i) => x - v[0][i]);
        const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
          len = Math.hypot(...n);
        // Back-face culling keeps each translucent thin solid legible without doubling opacity.
        if (n[2] <= 0) continue;
        const light = 0.65 + 0.35 * Math.abs((n[0] * 0.3 - n[1] * 0.45 + n[2] * 0.84) / len);
        polygons.push({ v, z: v.reduce((sum, q) => sum + q[2], 0) / 4, light, alpha: plate.alpha });
      }
    }
    polygons.sort((a, b) => a.z - b.z);
    g.save();
    g.translate(
      c.x + e.dx + 23 * Math.sin(t * 0.33 + c.phase),
      c.y + e.dy + 21 * Math.cos(t * 0.39 + c.phase),
    );
    g.scale(scale * e.scale, scale * e.scale);
    for (const face of polygons) {
      const rgb = c.color.map((v) => Math.round(Math.min(255, v * face.light)));
      g.fillStyle = `rgba(${rgb.join(',')},${face.alpha})`;
      g.beginPath();
      face.v.forEach((v, i) => (i ? g.lineTo(v[0], v[1]) : g.moveTo(v[0], v[1])));
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(15,20,18,.13)';
      g.lineWidth = 0.38 / scale;
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
