// Original faceted-stream geometry based on the supplied visual reference, not its code.
import { stateAt } from './states.js';
import { randomAt } from '../timing.js';
const ZERO = {
  fast: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  slow: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  impulse: 0,
  residue: 0,
};
const hues = [322, 188, 43, 341, 174, 25, 281, 311];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
function stream(lane, t, params, sample) {
  const vertices = [];
  for (let k = 0; k < 11; k++) {
    const x = -110 + k * 118;
    const m = sample(lane * 0.045 + k * 0.019);
    const base = 45 + lane * 67;
    const fold =
      (31 + params.fold * 29 + m.slow.mid * 19) * Math.sin(k * 1.46 + lane * 0.91 + t * 0.19);
    const separation = m.slow.bass * 18 * Math.sin(lane * 1.7 + t * 0.12);
    const front = m.impulse * params.impulse * 28 * Math.sin(k * 0.84 - lane + t * 0.37);
    const y = base + fold + separation + front + 15 * params.drift * Math.sin(t * 0.13 + lane);
    const width =
      (10 + 20 * (0.5 + 0.5 * Math.cos(k * 1.15 - lane + t * 0.21))) * params.width +
      7 * m.fast.rms;
    vertices.push({ x, y, width, m });
  }
  return vertices;
}

export function draw(p, trackTime, elapsed, controls, reactive = true) {
  const params = stateAt(elapsed),
    t = trackTime,
    ctx = p.drawingContext;
  const sample = (delay) => (reactive ? controls.at(t - delay) : ZERO);
  p.background('#050008');
  ctx.save();
  const streams = Array.from({ length: 8 }, (_, i) => stream(i, t, params, sample));
  streams.forEach((points, lane) => {
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k],
        b = points[k + 1],
        m = a.m;
      const topA = [a.x, a.y - a.width],
        bottomA = [a.x, a.y + a.width];
      const topB = [b.x, b.y - b.width],
        bottomB = [b.x, b.y + b.width];
      const center = [
        a.x * 0.35 + b.x * 0.65,
        (a.y + b.y) * 0.5 + Math.sin(k + lane) * 9 * params.fold,
      ];
      const facets = [
        [topA, topB, center],
        [topA, center, bottomA],
        [bottomA, center, bottomB],
        [center, topB, bottomB],
      ];
      facets.forEach((facet, f) => {
        const hue = hues[lane] + (f === 2 ? 22 : f === 1 ? -12 : 0) + (m.slow.centroid - 0.4) * 14;
        const light = f === 0 ? 58 : f === 2 ? 43 : 50;
        ctx.fillStyle = `hsla(${hue},100%,${light}%,${(0.65 + params.intensity * 0.25 + m.slow.rms * 0.08) * (f === 2 ? 0.7 : 1)})`;
        polygon(ctx, facet);
        ctx.fill();
      });
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  // Sparse rectilinear interruptions sample the moving streams; no source subdivision routine.
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 15; col++) {
      const id = row * 15 + col,
        r = randomAt(96317, id);
      const x = 12 + col * 66 + (r - 0.5) * 18,
        y = 18 + row * 62;
      const segment = clamp(Math.floor((x + 110) / 118), 0, 9);
      const inBand = streams.some((points) => {
        const a = points[segment],
          b = points[segment + 1],
          q = (x - a.x) / (b.x - a.x);
        const cy = a.y + (b.y - a.y) * q,
          half = a.width + (b.width - a.width) * q;
        return Math.abs(y - cy) < half;
      });
      if (!inBand && r < 0.88) continue;
      const m = sample(col * 0.024);
      const activation = 0.5 + 0.5 * Math.sin(t * 0.43 + id * 1.31);
      const size = (r > 0.8 ? 25 : 11) + m.fast.high * 10 * params.mosaic;
      const alpha = inBand
        ? (0.14 + 0.48 * params.mosaic) * (0.55 + 0.45 * activation)
        : 0.45 + 0.5 * activation;
      ctx.globalAlpha = alpha;
      ctx.fillStyle =
        inBand && r < 0.4
          ? '#050008'
          : inBand && r > 0.7
            ? '#fffaff'
            : `hsl(${hues[id % 8]},100%,53%)`;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      if (inBand && r > 0.82) {
        ctx.globalAlpha = alpha * m.residue * 0.7;
        ctx.fillRect(x + size * 0.65, y - size * 0.4, size * 0.45, size * 0.45);
      }
    }
  ctx.restore();
  return params;
}
