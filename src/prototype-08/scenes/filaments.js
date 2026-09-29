import { COLORS as C, begin } from '../shared.js';

// Filament knots are geometry, and also the seed interface for the territory handoff.
export function anchors({ t, at, params }) {
  const locations = [
    [140, 120],
    [420, 90],
    [770, 135],
    [220, 345],
    [510, 285],
    [805, 370],
    [490, 485],
  ];
  return locations.map(([x, y], i) => {
    const m = at(i * 0.06);
    return [
      x + (42 + 42 * m.slow.bass) * params.deformation * Math.sin(t * 0.43 + i * 1.8),
      y + 48 * params.motion * Math.sin(t * 0.37 + i) + m.impulse * 16 * Math.cos(i),
    ];
  });
}

export function draw(p, ctx, { collapse = 0, clear = true } = {}) {
  if (clear) begin(p);
  const { t, params, at } = ctx;
  const knots = anchors(ctx),
    remain = 1 - collapse;
  knots.forEach(([kx, ky], i) => {
    const m = at(i * 0.06);
    for (let strand = 0; strand < 4 + (i % 4); strand++) {
      const offset = (strand - 2) * (5 + params.detail * 5) * (1 + 0.4 * Math.sin(t * 0.6 + i));
      const a = (x, y) => [kx + (x - kx) * remain, ky + (y - ky) * remain];
      const sy = 55 + i * 73 + offset;
      const ey = 470 - i * 62 + offset;
      const bend =
        (65 * Math.sin(t * 0.4 + i) + m.slow.bass * 80 + m.slow.mid * 38 * Math.sin(t * 0.54 + i)) *
        params.deformation;
      p.noFill();
      p.stroke(i === 3 ? C.coral : i % 2 ? C.teal : C.paper);
      p.strokeWeight(
        (strand === 2 ? 2.5 + m.slow.rms * 0.5 : 0.8 + params.detail) + m.slow.centroid * 0.35,
      );
      p.beginShape();
      p.vertex(...a(-70, sy));
      p.bezierVertex(
        ...a(kx - 260, sy - bend),
        ...a(kx - 130, ky + offset + bend),
        ...a(kx, ky + offset),
      );
      p.bezierVertex(...a(kx + 130, ky + offset - bend), ...a(kx + 260, ey + bend), ...a(1030, ey));
      p.endShape();
      // A second independently bowed branch gives each bundle a changing fork.
      if (strand % 2 === 0) {
        p.strokeWeight(0.8 + params.detail);
        p.stroke(i % 2 ? C.paper : C.teal);
        p.bezier(
          ...a(kx, ky + offset),
          ...a(kx + 100, ky - 100 * Math.sin(t * 0.57 + i)),
          ...a(kx + 260, ey - bend * 1.7),
          ...a(1030, ey + 55 * Math.sin(t * 0.3 + i)),
        );
      }
    }
    p.noStroke();
    p.fill(i === 3 ? C.coral : C.teal);
    const travel = Math.sin(t * 0.9 + i) * 36 * remain;
    p.circle(kx + travel, ky, 5 + m.fast.high * 7 + collapse * 6);
  });
}
