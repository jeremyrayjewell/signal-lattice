import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const palette = [
  '#13bba7',
  '#24a6df',
  '#7542d8',
  '#ec1855',
  '#f78339',
  '#ffd32b',
  '#a1ce41',
  '#759439',
  '#edb4c9',
  '#9792df',
  '#fbe0c5',
  '#fff8e5',
  '#173a56',
  '#111218',
  '#39d569',
  '#ffe762',
];
const rand = (id, k = 0) => randomAt(85219, id * 41 + k);
const col = (id, k = 0) => palette[Math.floor(rand(id, k) * palette.length)];
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const TAU = Math.PI * 2;
function poly(g, pts, c) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = c;
  g.fill();
}
// A fixed irregular partition tree: no randomized redraws or frame-dependent topology.
function build(id, w, h, depth = 0) {
  if (depth >= 9 || Math.min(w, h) < 25 || (depth > 2 && w * h < 24000 && rand(id, 1) < 0.29))
    return { id, leaf: true };
  const vertical = w / h > 1.5 ? true : w / h < 0.7 ? false : rand(id, 2) > 0.5;
  const ratio = 0.32 + 0.36 * rand(id, 3);
  return {
    id,
    vertical,
    ratio,
    a: build(id * 2, w * (vertical ? ratio : 1), h * (vertical ? 1 : ratio), depth + 1),
    b: build(id * 2 + 1, w * (vertical ? 1 - ratio : 1), h * (vertical ? 1 : 1 - ratio), depth + 1),
  };
}
const tree = build(1, 940, 520);
function panel(g, id, x, y, w, h, t, state, m) {
  const phase = rand(id, 4) * TAU,
    kind = Math.floor(rand(id, 5) * 5),
    voidPanel = rand(id, 6) < 0.09;
  const a = [x, y],
    b = [x + w, y],
    c = [x + w, y + h],
    d = [x, y + h];
  const bend =
    (0.075 + 0.09 * state.articulation + 0.045 * m.slow.mid) *
    (1 + 0.15 * m.fast.rms) *
    Math.sin(t * (0.43 + rand(id, 7) * 0.3) + phase);
  const hit = m.impulse * state.impulse * 0.06 * Math.cos(phase);
  const u = 0.5 + bend + hit,
    v = 0.45 + 0.18 * Math.sin(t * 0.49 + phase + 2);
  const top = [x + w * u, y],
    bottom = [x + w * (1 - u), y + h],
    center = [x + w * u, y + h * v];
  g.fillStyle = voidPanel ? '#fff8e5' : col(id, 8);
  g.fillRect(x, y, w + 0.3, h + 0.3);
  if (!voidPanel) {
    if (kind === 0) {
      poly(g, [a, b, bottom], col(id, 9));
      poly(g, [a, bottom, d], col(id, 10));
    }
    if (kind === 1) {
      poly(g, [a, top, d], col(id, 9));
      poly(g, [top, b, c, bottom], col(id, 10));
      poly(g, [top, bottom, d], col(id, 11));
    }
    if (kind === 2) {
      poly(g, [a, b, center], col(id, 9));
      poly(g, [b, c, center], col(id, 10));
      poly(g, [c, d, center], col(id, 11));
    }
    if (kind === 3) {
      poly(g, [a, c, d], col(id, 9));
      poly(g, [top, b, c], col(id, 10));
    }
    if (kind === 4) {
      poly(g, [a, b, bottom], col(id, 9));
      poly(
        g,
        [
          [x, y + h * 0.68],
          [x + w, y + h * 0.68],
          [x + w, y + h * (0.76 + 0.09 * Math.sin(t * 0.7 + phase))],
        ],
        col(id, 12),
      );
    }
  }
  // Selected medium panels carry a small contrasting inset, not a universal detail grid.
  if (w > 65 && h > 55 && rand(id, 14) < 0.35) {
    const iw = w * 0.24,
      ih = h * 0.29,
      ix = x + w * (0.12 + 0.09 * Math.sin(t * 0.6 + phase)),
      iy = y + h * 0.63;
    poly(
      g,
      [
        [ix, iy],
        [ix + iw, iy],
        [ix + iw, iy + ih],
      ],
      col(id, 15),
    );
    poly(
      g,
      [
        [ix, iy],
        [ix + iw, iy + ih],
        [ix, iy + ih],
      ],
      col(id, 16),
    );
  }
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const state = stateAt(elapsed),
    g = p.drawingContext,
    t = trackTime;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#fffdf5');
  g.save();
  g.lineCap = 'butt';
  g.lineJoin = 'miter';
  function visit(node, x, y, w, h, depth = 0) {
    const m = at((x / 960) * 0.22 + depth * 0.018);
    if (node.leaf) {
      const entry = introFor(node.id, intro, 420);
      if (!entry.active) return;
      g.save();
      g.translate(entry.dx, entry.dy);
      panel(g, node.id, x, y, w, h, t, state, m);
      g.restore();
      return;
    }
    const amplitude = 0.025 + 0.035 * state.motion + 0.025 * m.slow.bass;
    const ratio =
      node.ratio +
      amplitude * Math.sin(t * (0.23 + depth * 0.055) + node.id * 1.7) +
      m.impulse * state.impulse * 0.009 * Math.sin(node.id);
    if (node.vertical) {
      visit(node.a, x, y, w * ratio, h, depth + 1);
      visit(node.b, x + w * ratio, y, w * (1 - ratio), h, depth + 1);
    } else {
      visit(node.a, x, y, w, h * ratio, depth + 1);
      visit(node.b, x, y + h * ratio, w, h * (1 - ratio), depth + 1);
    }
  }
  visit(tree, 10, 10, 940, 520);
  // Independent cross-panel rules, with seeded lengths and continuous dash travel.
  for (let i = 0; i < 110; i++) {
    const entry = introFor(1000 + i, intro, 380);
    if (!entry.active) continue;
    const m = at(rand(i, 20) * 0.4),
      vertical = rand(i, 21) > 0.5;
    const x = 12 + rand(i, 22) * 936 + 6 * Math.sin(t * 0.53 + i) + entry.dx,
      y = 12 + rand(i, 23) * 516 + 7 * Math.cos(t * 0.61 + i) + entry.dy;
    const length = 24 + rand(i, 24) * 105,
      weight = 0.7 + rand(i, 25) * 2.5 + m.residue * state.detail;
    g.save();
    g.beginPath();
    g.rect(10, 10, 940, 520);
    g.clip();
    g.translate(x, y);
    if (vertical) g.rotate(Math.PI / 2);
    g.strokeStyle = col(i, 26);
    g.lineWidth = weight;
    g.globalAlpha = 0.65 + 0.23 * m.fast.centroid;
    const dotted = rand(i, 27) > 0.43;
    if (dotted) {
      g.setLineDash([weight, weight * (2.5 + rand(i, 28) * 2)]);
      g.lineDashOffset = -t * (5 + 10 * rand(i, 29)) * (0.6 + state.detail * 0.5);
    }
    g.beginPath();
    g.moveTo(-length / 2, 0);
    g.lineTo(length / 2, 0);
    g.stroke();
    if (i % 11 === 0) {
      g.setLineDash([]);
      g.fillStyle = col(i, 30);
      g.fillRect(12 * Math.sin(t * 1.1 + i), -3, 4 + m.fast.high * 6, 6);
    }
    g.restore();
  }
  g.restore();
  return state;
}
