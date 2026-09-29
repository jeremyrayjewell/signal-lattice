import { background, color, path } from '../paint.js';
const rim = [
  [480, 30],
  [715, 105],
  [902, 270],
  [720, 450],
  [480, 515],
  [235, 445],
  [58, 270],
  [240, 90],
];
export function draw(p, { t, at, params }) {
  const g = background(p, '#201027');
  for (let i = 0; i < 8; i++) {
    const a = rim[i],
      b = rim[(i + 1) % 8],
      m = at(i * 0.06),
      ph = i * 0.9;
    const cx = (480 + a[0] + b[0]) / 3,
      cy = (270 + a[1] + b[1]) / 3;
    const opening =
      (18 + params.deformation * 18) * (1 + 0.5 * Math.sin(t * 0.68 + ph)) + m.impulse * 30;
    const norm = Math.hypot(cx - 480, cy - 270);
    g.save();
    g.translate(cx + ((cx - 480) / norm) * opening, cy + ((cy - 270) / norm) * opening);
    g.rotate(0.14 * Math.sin(t * 0.71 + i) + m.slow.mid * 0.08);
    // Each plate disassembles into a triangle and two unequal quadrilateral sections.
    const point = (v, q) => [480 + (v[0] - 480) * q - cx, 270 + (v[1] - 270) * q - cy];
    for (let section = 0; section < 3; section++) {
      const lo = section / 3,
        hi = (section + 1) / 3 - 0.025;
      const poly = [point(a, lo), point(a, hi), point(b, hi), point(b, lo)];
      const slide = (8 + params.motion * 8) * Math.sin(t * 0.87 + i + section) + m.impulse * 10;
      g.save();
      g.translate(slide * Math.cos(i), slide * Math.sin(i));
      path(g, poly, color('H', i + section * 2), '#201027', 2);
      const dx = 6 + m.residue * 12;
      path(
        g,
        poly.map(([x, y]) => [x + dx, y - 5]),
        null,
        color('H', i + section + 4),
        2,
      );
      g.save();
      path(g, poly, null, null);
      g.clip();
      if ((i + section) % 2 === 0) {
        for (let k = 0; k < 5; k++) {
          const yy = -100 + k * 31 + 13 * Math.sin(t * 0.8 + i);
          path(
            g,
            [
              [-300, yy],
              [300, yy + 130],
            ],
            null,
            color('H', i + section + 3),
            7,
            false,
          );
        }
      } else {
        for (let k = 0; k < 3; k++) {
          const scale = 0.4 + k * 0.2;
          path(
            g,
            poly.map(([x, y]) => [x * scale, y * scale]),
            null,
            '#201027',
            3,
          );
        }
      }
      g.restore();
      g.restore();
    }
    g.restore();
  }
}
