import { background, color, path } from '../paint.js';
export function draw(p, { t, at, params }) {
  const g = background(p, '#f8e9cf');
  // Architectural stacks with distinct silhouettes, cantilevers, windows and interlocking bridges.
  for (let i = 0; i < 8; i++) {
    const m = at(i * 0.09),
      x = 24 + i * 119,
      base = 459 + 30 * Math.sin(t * 0.33 + i),
      height = 170 + 130 * (0.5 + 0.5 * Math.sin(t * 0.46 + i)) + m.slow.bass * 45;
    const count = 3 + (i % 4),
      w = 63 + (i % 3) * 12;
    for (let k = 0; k < count; k++) {
      const h = height / count,
        y = base - k * h,
        slide = (10 + params.deformation * 9) * Math.sin(t * 0.7 + i + k * 0.75) + m.impulse * 9;
      const dx = x + slide;
      path(
        g,
        [
          [dx, y],
          [dx + w, y],
          [dx + w, y - h + 7],
          [dx + w * 0.6, y - h + 7],
          [dx + w * 0.6, y - h],
          [dx, y - h],
        ],
        color('D', i + k),
        null,
      );
      path(
        g,
        [
          [dx + w, y],
          [dx + w + 15, y - 12],
          [dx + w + 15, y - h - 7],
          [dx + w, y - h + 7],
        ],
        color('D', i + k + 2),
        null,
      );
      g.fillStyle = k % 2 ? '#f8e9cf' : '#132f65';
      if ((i + k) % 3 === 0) {
        for (let q = 0; q < 3; q++) g.fillRect(dx + 8 + q * 17, y - h + 15, 9, h * 0.4);
      } else g.fillRect(dx + 9, y - h + 13, w * 0.55, h * 0.42);
      g.fillStyle = color('D', i + k + 4);
      g.fillRect(dx - 8, y - 8, w + 23, 5 + m.residue * 3);
    }
    if (i < 7 && i % 2 === 0) {
      const yy = base - height * 0.5;
      path(
        g,
        [
          [x + 50, yy],
          [x + 130, yy + 18 * Math.sin(t * 0.8 + i)],
        ],
        null,
        color('D', i + 5),
        8,
        false,
      );
    }
  }
}
