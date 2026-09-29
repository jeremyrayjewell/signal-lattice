import { background, color, seed, path, ring, TAU } from '../paint.js';
export function draw(p, { t, at, params }) {
  const g = background(p, '#0b102b');
  // Fewer, larger constructed motifs; voids deform the banks rather than merely hiding cells.
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 9; col++) {
      const id = row * 9 + col,
        m = at(col * 0.055),
        ph = seed(id) * TAU;
      const wave = Math.sin(col * 0.65 - t * 0.48),
        gap = 24 + 20 * (1 - m.slow.rms);
      let x = 51 + col * 108 + 10 * Math.sin(t * 0.6 + row),
        y = 52 + row * 108;
      const c1 = 171 + 38 * params.deformation * wave,
        c2 = 375 + 43 * Math.sin(col * 0.59 + t * 0.39);
      const near = Math.min(Math.abs(y - c1), Math.abs(y - c2));
      const alpha = Math.max(0, Math.min(1, (near - gap) / 29));
      if (alpha < 0.01) continue;
      y += 13 * Math.sin(t * 0.63 + ph) + m.impulse * 9 * Math.cos(ph);
      g.save();
      g.translate(x, y);
      g.rotate(0.45 * Math.sin(t * 0.67 + ph) * params.motion);
      g.globalAlpha = alpha;
      const kind = id % 5,
        size = 36 + seed(id, 2) * 10;
      for (let layer = 0; layer < 3; layer++) {
        const s = size - layer * 10,
          c = color('A', col + row * 2 + layer),
          angle = t * (0.23 + layer * 0.13) + ph;
        if (kind === 0) {
          path(
            g,
            [
              [-s, -s],
              [s * 0.45, -s],
              [s, -s * 0.4],
              [s, s],
              [-s, s],
            ],
            layer === 0 ? c : null,
            layer ? c : '#080b20',
            layer ? 3 : 2,
          );
          g.fillStyle = '#0b102b';
          g.fillRect(-s * 0.55, -s * 0.55, s, s * 0.95);
        }
        if (kind === 1) {
          ring(g, 0, 0, s, angle, angle + 4.6, c, 6, 0.85);
          path(
            g,
            [
              [-s, 0],
              [0, s * 0.4],
              [s, 0],
            ],
            null,
            color('A', col + 4),
            2,
            false,
          );
        }
        if (kind === 2) {
          path(
            g,
            [
              [0, -s],
              [s, 0],
              [0, s],
              [-s, 0],
            ],
            layer === 0 ? c : null,
            layer ? c : '#0b102b',
            3,
          );
        }
        if (kind === 3) {
          g.fillStyle = c;
          g.fillRect(-s, -s, s * 0.38, s * 2);
          g.fillRect(-s, -s, s * 2, s * 0.28);
          g.fillRect(s * 0.65, -s, s * 0.3, s * 2);
        }
        if (kind === 4) {
          path(
            g,
            [
              [-s, -s * 0.8],
              [s, -s * 0.8],
              [s * 0.7, s],
              [-s * 0.6, s],
            ],
            null,
            c,
            5,
          );
          g.fillStyle = c;
          g.fillRect(-s * 0.35, -s * 0.6, s * 0.45, s * (0.8 + 0.3 * Math.sin(angle)));
        }
      }
      g.fillStyle = color('A', id + 5);
      g.fillRect(-30 + 24 * Math.sin(t * 1.3 + ph), -3, 13 + m.residue * 10, 6);
      g.restore();
    }
}
