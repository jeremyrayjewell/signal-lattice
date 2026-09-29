import { background, color, path } from '../paint.js';
export function draw(p, { t, at, params }) {
  const g = background(p, '#f6e7d5');
  for (let group = 0; group < 2; group++) {
    const m = at(group * 0.21),
      ox = (group ? 1010 : -50) + 35 * Math.sin(t * 0.32 + group),
      oy = (group ? 80 : 460) + 65 * Math.sin(t * 0.43 + group * 2);
    const base = group ? 2.8 : -0.43;
    for (let ray = 0; ray < 11; ray++) {
      const a =
        base +
        (ray - 5) * (0.073 + 0.025 * params.spread) +
        0.2 * Math.sin(t * 0.53 + group) +
        m.impulse * 0.075 * Math.cos(ray);
      const length = 660 + 130 * Math.sin(t * 0.61 + ray * 0.6 + group) + m.slow.bass * 70,
        w = 0.019 + 0.007 * (ray % 3);
      // Each ray is a chain of differently colored, unequal trapezoid facets.
      for (let segment = 0; segment < 5; segment++) {
        const inner = length * (segment * 0.19),
          outer = length * (segment * 0.19 + 0.17);
        const skew = 0.012 * Math.sin(t * 0.85 + segment + ray);
        const point = (r, angle) => [ox + Math.cos(angle) * r, oy + Math.sin(angle) * r];
        path(
          g,
          [
            point(inner, a - w),
            point(outer, a - w + skew),
            point(outer, a + w + skew),
            point(inner, a + w),
          ],
          color('G', ray + segment + group * 3),
          null,
        );
        if (ray % 3 === 0)
          path(
            g,
            [point(outer, a), point(outer + 38 + m.residue * 20, a + 0.04)],
            null,
            color('G', segment + 5),
            3,
            false,
          );
      }
      if (ray % 2 === 0) {
        const tip = length * 0.98;
        path(
          g,
          [
            [ox + Math.cos(a - w) * tip, oy + Math.sin(a - w) * tip],
            [ox + Math.cos(a) * (tip + 30), oy + Math.sin(a) * (tip + 30)],
            [ox + Math.cos(a + w) * tip, oy + Math.sin(a + w) * tip],
          ],
          null,
          '#2e2251',
          2,
        );
      }
    }
  }
}
