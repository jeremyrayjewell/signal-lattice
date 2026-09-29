import { background, color, path, ring, TAU } from '../paint.js';
export function draw(p, { t, at, params }) {
  const g = background(p, '#f2edf8');
  const centers = [
    [280, 275, 145],
    [685, 150, 100],
    [760, 422, 76],
    [100, 85, 43],
  ];
  centers.forEach(([cx, cy, base], i) => {
    const m = at(i * 0.14),
      x = cx + 25 * Math.sin(t * 0.35 + i),
      y = cy + 24 * Math.cos(t * 0.41 + i);
    g.save();
    g.translate(x, y);
    for (let layer = 0; layer < 5; layer++) {
      const r =
          base * (0.42 + layer * 0.17) * (0.88 + params.detail * 0.18) + m.slow.bass * layer * 4,
        a = t * (0.3 + layer * 0.15) * (layer % 2 ? 1 : -1) + i;
      g.save();
      g.rotate(0.45 * params.motion * Math.sin(t * 0.29 + layer + i));
      const flat = 0.6 + 0.3 * Math.sin(t * 0.32 + layer) ** 2;
      ring(
        g,
        0,
        0,
        r,
        a,
        a + 2.4 + Math.sin(t * 0.5 + layer),
        color('C', i * 2 + layer),
        layer === 1 ? 12 : 3 + layer,
        flat,
      );
      for (let k = 0; k < 7 + layer; k++) {
        const theta = a + k * 0.47,
          xx = Math.cos(theta) * r,
          yy = Math.sin(theta) * r * flat;
        g.fillStyle = color('C', i + layer + (k % 3));
        if (k % 3 === 0) {
          g.save();
          g.translate(xx, yy);
          g.rotate(theta);
          g.fillRect(-4, -9, 8, 18 + m.residue * 8);
          g.restore();
        } else {
          g.beginPath();
          g.arc(xx, yy, 2 + layer * 0.8, 0, TAU);
          g.fill();
        }
      }
      g.restore();
    }
    // A different central mechanism per constellation: sectors, crossing ellipses, or nested diamonds.
    if (i % 2 === 0) {
      for (let wedge = 0; wedge < 5; wedge++) {
        const a = t * 0.4 + (wedge * TAU) / 5;
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, base * 0.33, a, a + 0.8);
        g.closePath();
        g.fillStyle = color('C', wedge + i);
        g.fill();
      }
    } else
      for (let k = 0; k < 3; k++) {
        g.save();
        g.rotate(t * 0.4 + k);
        ring(g, 0, 0, base * (0.2 + k * 0.06), 0, TAU, color('C', k + i), 4, 0.45);
        g.restore();
      }
    g.restore();
  });
}
