import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(48117, id * 151 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540,
  MARGIN = 120;

// Layer A — soft anisotropic "fan sweeps": each instance stacks many thick,
// smoothly curved bands across its own local height, every band's rotation
// sweeping through roughly a quarter turn from one edge of the instance to
// the other. That per-row rotation sweep (not a single fixed orientation) is
// what gives the reference its curved, sheaf-like color boundaries instead
// of round soft blobs — the source rotates each row by an angle mapped from
// its position, and an earlier attempt here wrongly "fixed" that structure
// away as a spirograph artifact. Count is kept modest and spread wide so
// real black negative space remains, matching the reference's dark corners.
const FAN_COUNT = 44;
const fans = Array.from({ length: FAN_COUNT }, (_, id) => {
  const cx = -MARGIN + r(id, 1) * (W + MARGIN * 2),
    cy = -MARGIN + r(id, 2) * (H + MARGIN * 2);
  const mr = 160 + 260 * r(id, 3);
  const rotationBase = r(id, 4) * TAU;
  // Full-spectrum hue, not a fixed palette — the source rolls each color
  // channel independently, giving chaotic combinations a small palette can't.
  const hue = r(id, 5) * 360;
  const rows = 16 + Math.floor(r(id, 6) * 10);
  const freq1 = 1 + r(id, 7) * 1.6,
    freq2 = 2.2 + r(id, 8) * 2.6;
  const phase1 = r(id, 9) * TAU,
    phase2 = r(id, 10) * TAU;
  return { id, cx, cy, mr, rotationBase, hue, rows, freq1, freq2, phase1, phase2 };
});

// Layer B — a fine scratch/hash texture independent of the fan sweeps: a mix
// of single ticks and small bundles of 2-4 near-parallel lines at varied
// length (short to fairly long), matching the reference's uneven hash-mark
// clusters rather than uniform short X's.
const CLUSTER_COUNT = 340;
const clusters = Array.from({ length: CLUSTER_COUNT }, (_, k) => {
  const id = 2000 + k;
  const cx = -MARGIN + r(id, 1) * (W + MARGIN * 2),
    cy = -MARGIN + r(id, 2) * (H + MARGIN * 2);
  const baseAngle = r(id, 3) * TAU;
  const lineCount = r(id, 4) < 0.45 ? 1 : 1 + Math.floor(r(id, 4) * 4);
  const len = 14 + 56 * r(id, 5) * r(id, 5);
  const spread = r(id, 6) * 0.5;
  return { id, cx, cy, baseAngle, lineCount, len, spread };
});

function curvePath(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2,
      my = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const last = pts[pts.length - 1];
  g.lineTo(last[0], last[1]);
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#020203');
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';

  fans.forEach(({ id, cx, cy, mr, rotationBase, hue, rows, freq1, freq2, phase1, phase2 }) => {
    const entry = introFor(id, intro, 480);
    if (!entry.active) return;
    const m = at((id % 9) * 0.03);
    const phase = r(id, 20) * TAU;
    const drift = 10 + 8 * r(id, 21);
    const x = cx + drift * s.motion * Math.sin(t * 0.15 + phase) + entry.dx,
      y = cy + drift * s.motion * Math.cos(t * 0.19 + phase * 1.2) + entry.dy;
    const scale =
      (0.92 + 0.08 * Math.sin(t * 0.13 + phase)) * (1 + 0.2 * m.slow.bass) * entry.scale;
    const rot = rotationBase + t * (r(id, 22) - 0.5) * 0.04 * (1 + 0.5 * m.slow.mid);
    const twistSpeed = (0.04 + r(id, 23) * 0.06) * (1 + 0.6 * m.slow.mid);
    const selected = (0.5 + 0.5 * Math.sin(id * 1.6 - t * 0.8 + phase)) ** 8;
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(scale, scale);
    const steps = 14;
    for (let row = 0; row < rows; row++) {
      const localY = -mr / 2 + row * (mr / (rows - 1));
      const rowRot = (localY / mr + 0.5) * Math.PI * 0.5;
      g.save();
      g.rotate(rowRot);
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const cxp = -mr / 2 + i * (mr / steps);
        const adx = Math.sin(cxp * 0.02 * freq1 + phase1 + t * twistSpeed) * (mr * 0.05);
        const ady = Math.sin(cxp * 0.014 * freq2 + phase2 - t * twistSpeed * 1.2) * (mr * 0.16);
        pts.push([cxp + adx, localY + ady]);
      }
      curvePath(g, pts);
      const light = selected * m.residue * 12 + m.fast.centroid * 10;
      g.strokeStyle = `hsla(${hue + light} 88% ${62 + 8 * m.fast.rms}% / ${0.06 + 0.035 * m.fast.rms + selected * 0.04})`;
      g.lineWidth = mr * 0.032;
      g.stroke();
      g.restore();
    }
    g.restore();
  });

  const amb = at(0.3);
  clusters.forEach(({ id, cx, cy, baseAngle, lineCount, len, spread }) => {
    const entry = introFor(id, intro, 380);
    if (!entry.active) return;
    const phase = r(id, 30) * TAU;
    const drift = 5 + 4 * r(id, 31);
    const x = cx + drift * s.motion * Math.sin(t * 0.36 + phase) + entry.dx,
      y = cy + drift * s.motion * Math.cos(t * 0.3 + phase * 1.3) + entry.dy;
    const selected = (0.5 + 0.5 * Math.sin(id * 1.2 - t * 0.85 + phase)) ** 7;
    const alpha = 0.14 + 0.13 * amb.fast.high + selected * 0.16 + 0.14 * amb.impulse * s.impulse;
    g.strokeStyle = `hsla(0 0% 94% / ${alpha})`;
    g.lineWidth = 1.1 + selected * 0.6;
    for (let i = 0; i < lineCount; i++) {
      const ang = baseAngle + (i - (lineCount - 1) / 2) * spread * 0.5 + r(id, 40 + i) * 0.15;
      const off = (i - (lineCount - 1) / 2) * len * 0.28;
      const ox = x - Math.sin(ang) * off,
        oy = y + Math.cos(ang) * off;
      g.beginPath();
      g.moveTo(ox - (Math.cos(ang) * len) / 2, oy - (Math.sin(ang) * len) / 2);
      g.lineTo(ox + (Math.cos(ang) * len) / 2, oy + (Math.sin(ang) * len) / 2);
      g.stroke();
    }
  });

  g.restore();
  return s;
}
