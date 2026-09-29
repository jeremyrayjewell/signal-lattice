import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
import { smoothSolids } from './smooth-solids.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(53141, id * 179 + k);
const palette = [
  [14, 155, 188],
  [155, 34, 156],
  [156, 36, 53],
  [48, 115, 86],
  [39, 34, 116],
  [177, 133, 167],
  [82, 130, 192],
];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Original compact mesh construction and painter projection: no external 3D dependency.
function surface(n, m, point) {
  const vertices = [],
    faces = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) vertices.push(point(i / n, j / m));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j;
      faces.push([a, a + m + 1, a + m + 2, a + 1]);
    }
  return { vertices, faces };
}
const sphere = surface(56, 32, (u, v) => [
  Math.cos(u * TAU) * Math.sin(v * Math.PI),
  Math.cos(v * Math.PI),
  Math.sin(u * TAU) * Math.sin(v * Math.PI),
]);
const torus = surface(72, 24, (u, v) => [
  (0.8 + 0.23 * Math.cos(v * TAU)) * Math.cos(u * TAU),
  (0.8 + 0.23 * Math.cos(v * TAU)) * Math.sin(u * TAU),
  0.23 * Math.sin(v * TAU),
]);
function shaft(cone) {
  const vertices = [],
    faces = [],
    n = 48;
  for (let end = 0; end < 2; end++)
    for (let j = 0; j < n; j++) {
      const r = cone ? (end ? 0 : 0.62) : 0.24;
      vertices.push([
        r * Math.cos((j / n) * TAU),
        (end ? 1 : -1) * 1.3,
        r * Math.sin((j / n) * TAU),
      ]);
    }
  for (let j = 0; j < n; j++) faces.push([j, (j + 1) % n, ((j + 1) % n) + n, j + n]);
  faces.push(Array.from({ length: n }, (_, i) => n - 1 - i));
  faces.push(Array.from({ length: n }, (_, i) => n + i));
  return { vertices, faces };
}
const box = {
  vertices: [
    [-0.65, -0.65, -0.65],
    [0.65, -0.65, -0.65],
    [0.65, 0.65, -0.65],
    [-0.65, 0.65, -0.65],
    [-0.65, -0.65, 0.65],
    [0.65, -0.65, 0.65],
    [0.65, 0.65, 0.65],
    [-0.65, 0.65, 0.65],
  ],
  faces: [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [1, 2, 6, 5],
    [3, 0, 4, 7],
  ],
};
const meshes = [sphere, torus, shaft(false), shaft(true), box];
const objects = Array.from({ length: 78 }, (_, id) => ({
  id,
  type: id % 7,
  phase: R(id, 0) * TAU,
  x: 120 + R(id, 1) * 720,
  y: 45 + R(id, 2) * 450,
  z: (R(id, 3) - 0.5) * 240,
  size: 34 + R(id, 4) * 55,
  color: palette[Math.floor(R(id, 5) * palette.length)],
}));
let bg;
function background(g, t, intro) {
  if (intro < 1) return;
  if (!bg) {
    bg = document.createElement('canvas');
    bg.width = 240;
    bg.height = 135;
  }
  const b = bg.getContext('2d'),
    pixels = b.createImageData(240, 135),
    d = pixels.data;
  for (let y = 0; y < 135; y++)
    for (let x = 0; x < 240; x++) {
      const u = x / 240,
        v = y / 135;
      const bend = Math.sin(v * 8 + t * 0.31) + 0.5 * Math.sin(u * 9 - v * 5 - t * 0.22);
      const a = 0.5 + 0.5 * Math.sin(u * 17 + v * 7 + bend * 2.5 + t * 0.39);
      const b = 0.5 + 0.5 * Math.sin(v * 16 - u * 5 + Math.sin(u * 11 + t * 0.28) * 2 - t * 0.27);
      const idx = (y * 240 + x) * 4;
      d[idx] = 28 + 134 * a;
      d[idx + 1] = 198 + 48 * b;
      d[idx + 2] = 207 + 38 * b;
      d[idx + 3] = 255;
    }
  b.putImageData(pixels, 0, 0);
  g.drawImage(bg, 0, 0, 960, 540);
}
function rotate([x, y, z], a, b, c) {
  let yy = y * Math.cos(a) - z * Math.sin(a),
    zz = y * Math.sin(a) + z * Math.cos(a);
  let xx = x * Math.cos(b) + zz * Math.sin(b);
  zz = -x * Math.sin(b) + zz * Math.cos(b);
  return [xx * Math.cos(c) - yy * Math.sin(c), xx * Math.sin(c) + yy * Math.cos(c), zz];
}
function renderMesh(g, mesh, size, angles, color, wire = false) {
  const pts = mesh.vertices.map((v) => rotate(v, ...angles).map((x) => x * size));
  const faces = mesh.faces
    .map((ids) => ({ ids, z: ids.reduce((a, i) => a + pts[i][2], 0) / ids.length }))
    .sort((a, b) => a.z - b.z);
  for (const f of faces) {
    const [a, b, c] = f.ids.map((i) => pts[i]);
    const u = b.map((x, i) => x - a[i]),
      v = c.map((x, i) => x - a[i]);
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const len = Math.hypot(...normal) || 1;
    const light =
      0.25 + 0.75 * Math.max(0, (normal[0] * -0.35 + normal[1] * -0.55 + normal[2] * 0.76) / len);
    const rgb = color.map((c, i) => Math.round(c * light + [40, 15, 58][i] * (1 - light)));
    g.beginPath();
    f.ids.forEach((id, i) =>
      i ? g.lineTo(pts[id][0], pts[id][1]) : g.moveTo(pts[id][0], pts[id][1]),
    );
    g.closePath();
    g.strokeStyle = g.fillStyle = `rgb(${rgb.join(',')})`;
    if (!wire) {
      g.fill();
      g.lineWidth = 0.35;
      g.stroke();
    } else {
      g.lineWidth = 0.65;
      g.stroke();
    }
  }
}
function bead(g, x, y, r, color) {
  const gradient = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  gradient.addColorStop(0, `rgb(${color.map((c) => Math.min(255, c + 45)).join(',')})`);
  gradient.addColorStop(0.65, `rgb(${color.join(',')})`);
  gradient.addColorStop(1, '#39254c');
  g.fillStyle = gradient;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  g.save();
  background(g, t, intro);
  const solids = smoothSolids();
  solids.begin(t);
  const order = objects
    .map((o) => ({ ...o, depth: o.z + 45 * Math.sin(t * 0.29 + o.phase) }))
    .sort((a, b) => a.depth - b.depth);
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) {
      g.save();
      g.globalCompositeOperation = 'difference';
      g.drawImage(solids.canvas, 0, 0);
      g.restore();
    }
    for (const o of order) {
      if ((pass === 0) !== o.type < 5) continue;
      const entry = introFor(o.id, intro, 430);
      if (!entry.active) continue;
      const m = reactive ? controls.at(t - 0.02 - (o.x / 960) * 0.18) : quiet;
      const perspective = 750 / (750 - o.depth),
        scale = entry.scale * perspective;
      const x =
        480 +
        (o.x - 480) * perspective +
        23 * Math.sin(t * 0.41 + o.phase) +
        m.slow.bass * 13 * Math.cos(o.phase);
      const y = 270 + (o.y - 270) * perspective + 20 * Math.cos(t * 0.47 + o.phase);
      const angles = [
        o.phase + t * 0.22 + 0.18 * m.slow.mid,
        o.phase * 0.7 - t * 0.29,
        o.phase * 0.4 + t * 0.13 + 0.12 * m.impulse * s.impulse,
      ];
      g.save();
      g.translate(x + entry.dx, y + entry.dy);
      g.scale(scale, scale);
      if (o.type < 5) {
        const matrix = [
          ...rotate([1, 0, 0], ...angles),
          ...rotate([0, 1, 0], ...angles),
          ...rotate([0, 0, 1], ...angles),
        ];
        solids.draw(
          meshes[o.type],
          o.type,
          o.size * (1 + 0.035 * m.fast.rms),
          matrix,
          o.color,
          g.getTransform(),
          o.depth,
        );
      } else if (o.type === 5) {
        const vertices = [];
        for (let j = 0; j < 32; j++) {
          const ph = j * 0.53 + o.phase;
          const v = rotate(
            [((j % 6) - 2.5) * 13, (Math.floor(j / 6) - 2.5) * 13, 22 * Math.sin(ph + t * 0.8)],
            ...angles,
          );
          vertices.push(v);
        }
        vertices.sort((a, b) => a[2] - b[2]);
        for (let j = 0; j < vertices.length; j++) {
          const v = vertices[j];
          bead(
            g,
            v[0],
            v[1],
            2.2 + (j % 4) * 0.8 + m.residue,
            palette[(o.id + j) % palette.length],
          );
        }
      } else {
        renderMesh(g, box, o.size * 0.7, angles, o.color, true);
        g.rotate(angles[2]);
        for (let j = 0; j < 5; j++) {
          g.strokeStyle = `rgb(${palette[(o.id + j) % palette.length].join(',')})`;
          g.lineWidth = 0.5 + 0.25 * m.fast.centroid;
          const offset = 8 * Math.sin(t * (0.8 + j * 0.1) + o.phase + j) * (1 + m.fast.high * 0.5);
          g.beginPath();
          g.moveTo(-o.size * 1.8, j * 4 + offset);
          g.lineTo(o.size * 1.8, j * 4 - offset);
          g.stroke();
        }
      }
      g.restore();
    }
  }
  g.restore();
  return s;
}
