import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(37721, id * 173 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Flat, muted palette independent of the source's exact hex values.
const palette = [
  [184, 32, 58],
  [196, 52, 38],
  [160, 14, 26],
  [14, 52, 66],
  [68, 42, 58],
  [300, 16, 50],
  [110, 14, 78],
  [212, 46, 42],
  [112, 32, 48],
  [22, 24, 42],
];
const hsl = (idx, l = 0, sExtra = 0, alpha = 1) => {
  const [h, s0, li] = palette[idx];
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, li + l))}% / ${alpha})`;
};
const W = 960,
  H = 540,
  MARGIN = 200;
// Chaotic scatter of tapering bar clusters: each is a single flat color, a
// run of parallel bars whose thickness tapers linearly across the run, each
// bar a different random sub-length (not the cluster's full extent), about
// half dashed. Own taper/length logic, not the source's loop.
const CLUSTER_COUNT = 85;
const clusters = Array.from({ length: CLUSTER_COUNT }, (_, id) => {
  const cx = -MARGIN + r(id, 1) * (W + MARGIN * 2),
    cy = -MARGIN + r(id, 2) * (H + MARGIN * 2);
  const mr = 130 + 290 * r(id, 3);
  const orientation = (Math.floor(r(id, 4) * 4) * Math.PI) / 2;
  const colorIdx = Math.floor(r(id, 5) * palette.length);
  const barCount = 9 + Math.floor(r(id, 6) * 5);
  return { id, cx, cy, mr, orientation, colorIdx, barCount };
});
// A sparser layer of thin, softly contrast-blended curved lines independent
// of the bar clusters.
const CURVE_COUNT = 150;
const curves = Array.from({ length: CURVE_COUNT }, (_, k) => {
  const id = 2000 + k;
  const x0 = -MARGIN + r(id, 1) * (W + MARGIN * 2),
    y0 = -MARGIN + r(id, 2) * (H + MARGIN * 2);
  const x1 = -MARGIN + r(id, 3) * (W + MARGIN * 2),
    y1 = -MARGIN + r(id, 4) * (H + MARGIN * 2);
  const cx = -MARGIN + r(id, 5) * (W + MARGIN * 2),
    cy = -MARGIN + r(id, 6) * (H + MARGIN * 2);
  const gray = r(id, 7) * 100;
  return { id, x0, y0, x1, y1, cx, cy, gray };
});

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#f9f7f2');
  g.lineJoin = 'round';
  g.lineCap = 'square';

  clusters.forEach(({ id, cx, cy, mr, orientation, colorIdx, barCount }) => {
    const entry = introFor(id, intro, 420);
    if (!entry.active) return;
    const m = at((id % 9) * 0.025);
    const phase = r(id, 20) * TAU;
    const drift = 8 + 6 * r(id, 21);
    const x = cx + drift * s.motion * Math.sin(t * 0.2 + phase) + entry.dx,
      y = cy + drift * s.motion * Math.cos(t * 0.24 + phase * 1.2) + entry.dy;
    // A small rotational jitter (not a full spin, which would break the
    // axis-aligned barcode identity) plus a scale breathe for visible motion.
    const jitter = 0.05 * s.motion * Math.sin(t * 0.17 + phase) * (1 + 0.5 * m.slow.mid);
    const scale =
      (0.95 + 0.05 * Math.sin(t * 0.13 + phase)) * (1 + 0.12 * m.slow.bass) * entry.scale;
    const selected = (0.5 + 0.5 * Math.sin(id * 1.5 - t * 0.7 + phase)) ** 7;
    g.save();
    g.translate(x, y);
    g.rotate(orientation + jitter);
    g.scale(scale, scale);
    const gmax = mr / 10;
    for (let j = 0; j < barCount; j++) {
      const lx = -mr / 2 + j * (mr / barCount);
      const lr = Math.max(0.6, gmax * (1 - (lx + mr / 2) / mr));
      const base = 100 + j * 8;
      const breathe = Math.sin(t * (0.15 + r(id, base + 4) * 0.15) + phase + j) * 0.15 * s.motion;
      const y0 = (r(id, base) - 0.5 + breathe) * mr,
        y1 = (r(id, base + 1) - 0.5 - breathe) * mr;
      const jx = (r(id, base + 2) - 0.5) * (gmax / 1.5);
      const dashed = r(id, base + 3) < 0.5;
      g.beginPath();
      g.moveTo(lx + jx, y0);
      g.lineTo(lx + jx, y1);
      g.strokeStyle = hsl(
        colorIdx,
        4 * selected + 3 * m.fast.centroid,
        4 * m.fast.rms,
        0.88 + 0.1 * selected,
      );
      if (dashed) {
        g.setLineDash([1, lr * 2]);
        g.lineWidth = lr;
      } else {
        g.setLineDash([]);
        g.lineWidth = lr / 2;
      }
      g.stroke();
    }
    g.setLineDash([]);
    g.restore();
  });

  const amb = at(0.3);
  g.save();
  g.globalCompositeOperation = 'overlay';
  curves.forEach(({ id, x0, y0, x1, y1, cx, cy, gray }) => {
    const entry = introFor(id, intro, 380);
    if (!entry.active) return;
    const phase = r(id, 10) * TAU;
    const selected = (0.5 + 0.5 * Math.sin(id * 1.1 - t * 0.9 + phase)) ** 7;
    const sway = 18 * s.motion * Math.sin(t * 0.25 + phase);
    g.beginPath();
    g.moveTo(x0 + entry.dx, y0 + entry.dy);
    g.quadraticCurveTo(cx + sway + entry.dx, cy - sway + entry.dy, x1 + entry.dx, y1 + entry.dy);
    g.strokeStyle = `hsla(0 0% ${gray}% / ${0.1 + 0.08 * amb.fast.high + selected * 0.1})`;
    g.lineWidth = 1 + selected * 0.8;
    g.stroke();
  });
  g.restore();

  return s;
}
