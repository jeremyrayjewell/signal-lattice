import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(24107, id * 127 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Saturated, warm-leaning palette independent of the source's exact hex values.
const palette = [
  [355, 72, 45],
  [86, 62, 52],
  [46, 88, 52],
  [335, 78, 58],
  [228, 48, 40],
  [312, 32, 38],
  [345, 55, 20],
  [22, 68, 38],
];
const lerpColor = (idxA, idxB, frac, lExtra = 0, sExtra = 0, alpha = 1) => {
  const [ha, sa, la] = palette[idxA],
    [hb, sb, lb] = palette[idxB];
  const h = ha + (hb - ha) * frac,
    s0 = sa + (sb - sa) * frac,
    l = la + (lb - la) * frac;
  return `hsla(${h} ${Math.max(0, Math.min(100, s0 + sExtra))}% ${Math.max(0, Math.min(100, l + lExtra))}% / ${alpha})`;
};
const MACRO_COLS = 9,
  MACRO_ROWS = 5,
  CELL = 108;
// Each macro cell independently splits into one large cluster or four smaller
// ones (seeded), each cluster a shrinking sequence of circles blending between
// two colors — the source's binary single/quadrant choice, adapted to 16:9.
const clusters = [];
{
  let uid = 0;
  for (let mc = 0; mc < MACRO_COLS * MACRO_ROWS; mc++) {
    const col = mc % MACRO_COLS,
      row = Math.floor(mc / MACRO_COLS);
    const split = r(mc, 1) < 0.55 ? 1 : 2;
    const sg = CELL / split;
    for (let sx = 0; sx < split; sx++)
      for (let sy = 0; sy < split; sy++) {
        const id = uid++;
        const cx = col * CELL + (sx + 0.5) * sg,
          cy = row * CELL + (sy + 0.5) * sg;
        let ca = Math.floor(r(id, 10) * palette.length),
          cb = Math.floor(r(id, 11) * palette.length);
        if (cb === ca) cb = (cb + 1) % palette.length;
        const ringCount = 16 + Math.floor(r(id, 12) * 10);
        const rotationBase = r(id, 13) * TAU;
        clusters.push({ id, cx, cy, sg, ca, cb, ringCount, rotationBase });
      }
  }
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#f7f2ea');
  g.lineJoin = 'round';
  g.lineCap = 'round';

  clusters.forEach(({ id, cx, cy, sg, ca, cb, ringCount, rotationBase }) => {
    const entry = introFor(id, intro, 420);
    if (!entry.active) return;
    const m = at((id % 9) * 0.025);
    const phase = r(id, 20) * TAU;
    const drift = 11 + 9 * r(id, 21);
    const x = cx + drift * s.motion * Math.sin(t * 0.32 + phase) + entry.dx,
      y = cy + drift * s.motion * Math.cos(t * 0.38 + phase * 1.2) + entry.dy;
    const scale =
      (0.88 + 0.14 * Math.sin(t * 0.27 + phase)) *
      (1 + 0.32 * m.slow.bass + 0.18 * m.impulse * s.impulse) *
      entry.scale;
    const rot = rotationBase + t * (r(id, 22) - 0.5) * 0.11 * (1 + 0.9 * m.slow.mid);
    const selected = (0.5 + 0.5 * Math.sin(id * 1.6 - t * 0.7 + phase)) ** 8;
    const colorPhase = 0.5 + 0.5 * Math.sin(t * (0.11 + r(id, 23) * 0.12) + phase);
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(scale, scale);

    for (let i = 0; i < ringCount; i++) {
      const er = sg * (1 - i / ringCount);
      const base = 100 + i * 6;
      const offsetChoice = r(id, base) < 0.5;
      const ox = offsetChoice ? (r(id, base + 1) - 0.5) * (sg - er) : 0;
      const oy = offsetChoice ? (r(id, base + 2) - 0.5) * (sg - er) : 0;
      const strokeRoll = r(id, base + 3);
      const frac = Math.min(1, er / (sg * 2)) * 0.7 + colorPhase * 0.3;
      g.fillStyle = lerpColor(ca, cb, frac, 8 * selected + 6 * m.fast.centroid, 4 * m.fast.rms);
      // The outermost rings carry a strong glow halo — this is where the
      // source's blur reads most strongly. Limiting it to a subset (rather than
      // every ring) keeps the heavy canvas shadow-blur operation affordable
      // across 750 frames while still reading as a dominant, luminous glow.
      const glowRings = 6;
      g.shadowBlur =
        i < glowRings
          ? er *
            0.55 *
            (1 - (i / glowRings) * 0.4) *
            (1 + 0.6 * m.fast.high + 1.1 * m.impulse * s.impulse)
          : 0;
      g.shadowColor = i < glowRings ? lerpColor(cb, ca, frac, 14) : 'transparent';
      g.beginPath();
      g.arc(ox, oy, Math.max(0.5, er / 2), 0, TAU);
      g.fill();
      if (strokeRoll < 0.3) {
        g.strokeStyle = '#050505';
        g.lineWidth = sg * 0.01;
        g.stroke();
      } else if (strokeRoll < 0.55) {
        g.strokeStyle = '#fbf8f2';
        g.lineWidth = sg * 0.01;
        g.stroke();
      }
    }
    g.shadowBlur = 0;
    g.restore();
  });

  return s;
}
