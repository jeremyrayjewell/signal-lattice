// Independent source-grammar refinement: asynchronous fractured spans, not periodic ribbons.
import { stateAt } from './states.js';
import { randomAt, introFor } from '../timing.js';
const ZERO = {
  fast: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  slow: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  impulse: 0,
  residue: 0,
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
// Independent placements and spans; clustered brightness alternates with asymmetric voids.
// x, y, length, half-width, hue, overall slope
const spans = [
  [-130, 82, 1000, 24, 322, 0.045],
  [50, 152, 980, 26, 188, -0.055],
  [-110, 135, 710, 40, 307, 0.1],
  [330, 110, 740, 35, 331, -0.09],
  [170, 54, 670, 19, 44, 0.07],
  [-60, 235, 750, 15, 174, -0.1],
  [310, 203, 790, 19, 280, -0.11],
  [-100, 335, 1000, 28, 30, 0.015],
  [30, 300, 600, 37, 43, 0.12],
  [450, 352, 650, 37, 313, -0.09],
  [230, 376, 890, 26, 185, -0.04],
  [-60, 408, 480, 18, 336, -0.12],
  [-140, 510, 1100, 28, 184, -0.025],
  [60, 496, 750, 31, 319, 0.07],
  [390, 492, 770, 29, 34, -0.12],
  [-60, 65, 530, 13, 189, -0.14],
  [610, 17, 450, 17, 275, 0.14],
  [115, 222, 350, 11, 337, 0.19],
  [515, 266, 490, 14, 327, -0.15],
  [-150, 450, 490, 30, 24, 0.06],
  [715, 415, 380, 15, 174, -0.11],
  [25, 188, 540, 6, 43, 0.13],
  [375, 38, 490, 8, 288, 0.19],
  [175, 443, 680, 8, 325, -0.19],
  [40, 553, 970, 10, 41, -0.15],
  [660, 242, 500, 7, 182, 0.1],
];

function polygon(ctx, vertices) {
  ctx.beginPath();
  vertices.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
function build(id, t, params, sample, intro) {
  const entry = introFor(id, intro, 520);
  if (!entry.active) return null;
  const [start, base, length, weight, hue, slope] = spans[id];
  const points = [];
  for (let k = 0; k < 7; k++) {
    const r = randomAt(58139, id * 23 + k),
      r2 = randomAt(81379, id * 17 + k);
    const u = (k + (k === 0 || k === 6 ? 0 : (r - 0.5) * 0.55)) / 6;
    const m = sample((id % 5) * 0.06 + u * 0.15);
    const phase = id * 1.873 + k * 0.72;
    const fold = (r2 - 0.5) * (45 + params.fold * 44);
    const drift = (8 + params.drift * 9) * Math.sin(t * (0.11 + r * 0.09) + phase);
    const hit = m.impulse * params.impulse * 18 * Math.sin(phase - t * 0.23);
    const x = start + u * length + 7 * Math.sin(t * 0.13 + id) + entry.dx;
    const y =
      base +
      (u - 0.5) * length * slope +
      fold +
      drift +
      hit +
      m.slow.bass * 14 * Math.cos(id) +
      entry.dy;
    const taper = k === 0 || k === 6 ? 0.08 + 0.18 * r : 0.25 + 1.15 * r;
    const width = weight * taper * params.width * (0.84 + 0.25 * m.slow.mid) * entry.scale;
    points.push({ x, y, top: width * (0.5 + r2), bottom: width * (1.5 - r2), m, r });
  }
  return { points, hue, id };
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const params = stateAt(elapsed),
    t = trackTime,
    ctx = p.drawingContext;
  const sample = (delay) => (reactive ? controls.at(t - delay) : ZERO);
  if (intro >= 1) p.background('#030004');
  ctx.save();
  const streams = spans.map((_, id) => build(id, t, params, sample, intro)).filter(Boolean);
  // Fragments terminate, cross, taper and change color independently; no repeated wave lattice.
  ctx.globalCompositeOperation = 'lighter';
  streams.forEach(({ points, hue, id }) => {
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k],
        b = points[k + 1],
        m = a.m;
      const topA = [a.x, a.y - a.top],
        bottomA = [a.x, a.y + a.bottom];
      const topB = [b.x, b.y - b.top],
        bottomB = [b.x, b.y + b.bottom];
      const turn = randomAt(4441, id * 11 + k) > 0.5;
      const pieces = turn
        ? [
            [topA, topB, bottomA],
            [bottomA, topB, bottomB],
          ]
        : [
            [topA, topB, bottomB],
            [topA, bottomB, bottomA],
          ];
      pieces.forEach((poly, f) => {
        const change = a.r > 0.78 ? (id % 2 ? 44 : -31) : f ? 10 : -6;
        const h = hue + change + (m.slow.centroid - 0.4) * 12;
        const alpha = (0.63 + params.intensity * 0.22 + m.slow.rms * 0.1) * (f ? 0.74 : 1);
        ctx.fillStyle = `hsla(${h},100%,${f ? 45 : 53}%,${alpha})`;
        polygon(ctx, poly);
        ctx.fill();
      });
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  // Pixel-scale modulation lives predominantly on the material, with sparse
  // detached accents; skipped entirely while still introducing (intro<1) so
  // its sparse full-canvas accent dots don't scatter over the outgoing scene
  // before this scene's own ribbons have arrived.
  if (intro >= 1)
    for (let row = 0; row < 18; row++)
      for (let col = 0; col < 32; col++) {
        const id = row * 32 + col,
          r = randomAt(96317, id),
          q = randomAt(11737, id);
        const x = col * 30 + 15,
          y = row * 30 + 15;
        let coverage = 0;
        for (const { points } of streams) {
          if (x < points[0].x || x > points.at(-1).x) continue;
          let k = 0;
          while (k < 5 && x > points[k + 1].x) k++;
          const a = points[k],
            b = points[k + 1],
            u = (x - a.x) / (b.x - a.x);
          const cy = a.y + (b.y - a.y) * u;
          const half = y < cy ? a.top + (b.top - a.top) * u : a.bottom + (b.bottom - a.bottom) * u;
          coverage = Math.max(coverage, clamp((half - Math.abs(y - cy) + 4) / 8));
        }
        if (coverage < 0.01 && r < 0.945) continue;
        const m = sample((col % 8) * 0.027);
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.37 + id * 1.37);
        const size = r > 0.92 ? 24 + 7 * m.residue : r > 0.65 ? 14 : 6 + 5 * q;
        const alpha =
          coverage * (0.15 + params.mosaic * 0.5) * (0.65 + 0.35 * pulse) +
          (1 - coverage) * (r > 0.945 ? 0.8 : 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle =
          r < 0.42
            ? '#000007'
            : r > 0.78
              ? '#fff9ff'
              : `hsl(${[321, 184, 43, 274, 8][id % 5]},100%,53%)`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        if (coverage > 0.1 && q > 0.62) {
          ctx.globalAlpha = alpha * (0.4 + 0.4 * m.fast.high);
          ctx.fillStyle = r < 0.6 ? '#000006' : `hsl(${[330, 186, 45][id % 3]},100%,51%)`;
          const micro = 5 + params.mosaic * 3;
          ctx.fillRect(x + size * 0.48, y - size * 0.5, micro, micro);
        }
      }
  ctx.restore();
  return params;
}
