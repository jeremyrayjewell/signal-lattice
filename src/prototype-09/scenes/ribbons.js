import { background, color, path } from '../paint.js';
export function draw(p, { t, at, params }) {
  const g = background(p, '#081527');
  for (let band = 0; band < 6; band++) {
    const m = at(band * 0.12),
      phase = band * 1.31;
    const center = (x) =>
      45 +
      band * 93 +
      (44 + 30 * m.slow.bass) * Math.sin(x * 0.006 - t * 0.61 + phase) +
      23 * params.motion * Math.sin(x * 0.013 + t * 0.53 + phase);
    const half = (x) => 12 + 20 * Math.sin(x * 0.004 + t * 0.47 + phase) ** 2 + 9 * m.slow.mid;
    for (let lane = 0; lane < 5; lane++) {
      const points = [],
        q = lane / 5;
      for (let x = -30; x <= 990; x += 12) points.push([x, center(x) + half(x) * (-1 + 2 * q)]);
      for (let x = 990; x >= -30; x -= 12)
        points.push([x, center(x) + half(x) * (-1 + 2 * (q + 0.21))]);
      path(g, points, color('B', band + lane), null);
    }
    // Traveling folded facets, apertures and fringe trails give unequal internal rhythms.
    for (let j = 0; j < 12; j++) {
      const x = j * 91 + 34 * Math.sin(t * 0.95 + phase + j * 0.6),
        y = center(x),
        h = half(x),
        w = 17 + (j % 3) * 7;
      if (j % 3 === band % 3) {
        path(
          g,
          [
            [x - w, y - h],
            [x + w, y],
            [x - w, y + h],
          ],
          color('B', band + j + 4),
          '#0a1730',
          1,
        );
      } else {
        path(
          g,
          [
            [x - 4, y - h * 0.8],
            [x + 6, y + h * 0.8],
          ],
          null,
          '#101933',
          2,
          false,
        );
      }
      if (j % 4 === 0) {
        g.beginPath();
        g.moveTo(x, y + h);
        g.bezierCurveTo(
          x + 30,
          y + h + 50,
          x - 30,
          y + h + 60 * Math.sin(t + j),
          x + 70,
          y + h + 30,
        );
        g.strokeStyle = color('B', band + 6);
        g.lineWidth = 2 + m.residue;
        g.stroke();
      }
    }
  }
}
