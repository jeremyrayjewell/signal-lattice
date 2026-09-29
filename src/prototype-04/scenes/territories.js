import { COLORS as C, begin } from '../shared.js';

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
      x + (18 + 40 * m.slow.bass) * params.deformation * Math.sin(t * 0.19 + i * 1.7),
      y + (15 + 32 * m.slow.mid) * params.motion * Math.cos(t * 0.16 + i * 2.1),
    ];
  });
}

// Convex half-plane clipping gives seven neighboring territories with shared boundaries.
export function polygons(seeds) {
  return seeds.map((s, i) => {
    let poly = [
      [14, 14],
      [946, 14],
      [946, 526],
      [14, 526],
    ];
    seeds.forEach((other, j) => {
      if (i === j || !poly.length) return;
      const nx = other[0] - s[0],
        ny = other[1] - s[1];
      const limit = (other[0] ** 2 + other[1] ** 2 - s[0] ** 2 - s[1] ** 2) / 2;
      const next = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k],
          b = poly[(k + 1) % poly.length];
        const da = a[0] * nx + a[1] * ny - limit,
          db = b[0] * nx + b[1] * ny - limit;
        if (da <= 0) next.push(a);
        if (da <= 0 !== db <= 0) {
          const f = da / (da - db);
          next.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])]);
        }
      }
      poly = next;
    });
    return poly;
  });
}

export function draw(p, ctx, { seeds = anchors(ctx), unfold = 1, clear = true } = {}) {
  if (clear) begin(p);
  const { at, params } = ctx;
  polygons(seeds).forEach((poly, i) => {
    if (!poly.length || unfold < 0.001) return;
    const m = at(i * 0.05),
      [x, y] = seeds[i];
    const shrink = 0.88 + 0.045 * Math.sin(ctx.t * 0.22 + i) + 0.02 * m.fast.rms;
    p.fill(i === 4 ? C.coral : i % 3 === 0 ? C.paper : C.teal);
    p.stroke(C.ink);
    p.strokeWeight(6);
    p.beginShape();
    for (const [px, py] of poly)
      p.vertex(x + (px - x) * shrink * unfold, y + (py - y) * shrink * unfold);
    p.endShape(p.CLOSE);
    p.noFill();
    p.stroke(C.ink);
    p.strokeWeight(1.5 + m.slow.centroid);
    const inner = (0.55 + params.detail * 0.15 + m.residue * 0.025) * unfold;
    p.beginShape();
    for (const [px, py] of poly) p.vertex(x + (px - x) * inner, y + (py - y) * inner);
    p.endShape(p.CLOSE);
    p.noStroke();
    p.fill(C.ink);
    p.circle(x, y, (7 + m.impulse * 5) * unfold);
  });
}
