import { background, color, path, TAU } from '../paint.js';
export { polygons } from '../../prototype-08/scenes/territories.js';
import { polygons } from '../../prototype-08/scenes/territories.js';
export function anchors({ t, at, params }) {
  return [
    [150, 100],
    [450, 95],
    [800, 120],
    [170, 355],
    [470, 290],
    [795, 355],
    [460, 505],
  ].map(([x, y], i) => {
    const m = at(i * 0.05);
    return [
      x + (36 + 40 * m.slow.bass) * params.deformation * Math.sin(t * 0.47 + i * 1.7),
      y + (30 + 30 * m.slow.mid) * Math.cos(t * 0.43 + i * 2.1),
    ];
  });
}
export function draw(p, ctx, { seeds = anchors(ctx), unfold = 1, clear = true } = {}) {
  const g = clear ? background(p, '#160e30') : p.drawingContext,
    { t, at, params } = ctx;
  polygons(seeds).forEach((poly, i) => {
    if (!poly.length || unfold < 0.001) return;
    const m = at(i * 0.08),
      [x, y] = seeds[i],
      shrink = 0.9 + 0.025 * Math.sin(t * 0.5 + i);
    const outer = poly.map(([px, py]) => [
      x + (px - x) * shrink * unfold,
      y + (py - y) * shrink * unfold,
    ]);
    path(g, outer, color('F', i), null);
    g.save();
    path(g, outer, null, null);
    g.clip();
    const ox = x + 30 * Math.sin(t * 0.55 + i) * unfold,
      oy = y + 22 * Math.cos(t * 0.63 + i) * unfold;
    // Unequal fan-shaped subdivisions inside the moving shared territorial boundaries.
    outer.forEach((a, k) => {
      const b = outer[(k + 1) % outer.length];
      path(g, [[ox, oy], a, b], color('F', i + k + (i % 2 ? 2 : 0)), null);
      for (let depth = 0; depth < 3; depth++) {
        const q = 0.28 + depth * 0.22;
        path(
          g,
          [
            [ox + (a[0] - ox) * q, oy + (a[1] - oy) * q],
            [ox + (b[0] - ox) * q, oy + (b[1] - oy) * q],
          ],
          null,
          depth === 1 ? '#f9dba2' : '#291b5b',
          2 + m.residue,
          false,
        );
      }
    });
    if (i % 3 === 0) {
      for (let stripe = 0; stripe < 5; stripe++) {
        const yy = y + (stripe - 2) * 18 + 12 * Math.sin(t * 0.8 + i);
        path(
          g,
          [
            [x - 130, yy],
            [x + 130, yy + 55],
          ],
          null,
          '#291b5b',
          4,
          false,
        );
      }
    } else if (i % 3 === 1) {
      g.beginPath();
      g.ellipse(ox, oy, Math.max(0.1, 36 * unfold), Math.max(0.1, 60 * unfold), t * 0.3, 0, TAU);
      g.strokeStyle = '#fff0bf';
      g.lineWidth = 5;
      g.stroke();
    }
    g.restore();
    path(g, outer, null, '#160e30', 5);
  });
}
