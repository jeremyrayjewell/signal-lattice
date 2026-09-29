import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(30338, id * 431 + k);
const palette = ['#edcda9', '#ffb900', '#3c3049', '#3e559b', '#ff431e', '#fff5e9', '#303139'];
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const patches = Array.from({ length: 115 }, (_, id) => {
  const n = R(id, 0) > 0.55 ? 17 : 12;
  const marks = [];
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      const k = row * n + col;
      if (R(id, k + 30) < 0.23 + R(id, 1) * 0.34) continue;
      marks.push({
        x: (col + 0.5) / n - 0.5,
        y: (row + 0.5) / n - 0.5,
        phase: R(id, k + 350) * TAU,
      });
    }
  return {
    id,
    n,
    marks,
    x: R(id, 2) * 1100 - 70,
    y: R(id, 3) * 660 - 60,
    size: 110 + R(id, 4) * 125,
    phase: R(id, 5) * TAU,
    angle: R(id, 6) > 0.5 ? Math.PI / 4 : 0,
    color: palette[Math.floor(R(id, 7) * palette.length)],
  };
});
function backdrop(g, t, intro) {
  if (intro >= 1) {
    g.fillStyle = '#050507';
    g.fillRect(0, 0, 960, 540);
  }
  for (let i = 0; i < 90; i++) {
    const entry = introFor(2000 + i, intro, 250);
    if (!entry.active) continue;
    const side = 40 + R(i, 810) * 92;
    g.fillStyle = `rgba(123,127,135,${0.08 + R(i, 811) * 0.23})`;
    g.fillRect(
      R(i, 812) * 1040 - 40 + 10 * Math.sin(t * 0.17 + i) + entry.dx,
      R(i, 813) * 620 - 40 + 8 * Math.cos(t * 0.21 + i) + entry.dy,
      side * entry.scale,
      side * entry.scale,
    );
  }
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  g.save();
  backdrop(g, t, intro);
  g.lineCap = 'butt';
  for (const c of patches) {
    const entry = introFor(c.id, intro, 380);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.18) : quiet;
    const wave = Math.sin(t * 0.86 - c.x * 0.006 + c.phase * 0.35);
    const x =
      c.x +
      48 * Math.sin(t * 0.53 + c.phase) +
      22 * wave +
      m.slow.bass * 27 * Math.sin(c.phase + t * 0.4);
    const y =
      c.y +
      38 * Math.cos(t * 0.61 + c.phase) +
      14 * Math.sin(t * 1.1 + c.id) +
      m.impulse * s.impulse * 19 * Math.cos(c.id);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale, entry.scale);
    g.rotate(
      c.angle +
        0.23 * Math.sin(t * 0.73 + c.phase) * (1 + s.motion) +
        m.slow.mid * 0.16 * Math.sin(c.phase + t * 0.8),
    );
    g.fillStyle = c.color;
    const pitch = c.size / c.n;
    // A moving elliptical quiet zone modulates fixed square marks; no source radial loop is reused.
    const cx = 0.25 * Math.sin(t * 1.03 + c.phase),
      cy = 0.23 * Math.cos(t * 0.87 + c.phase);
    for (const dot of c.marks) {
      const distance = Math.hypot((dot.x - cx) * 1.3, (dot.y - cy) * 0.85);
      const edge = Math.min(1, Math.max(0, (distance - 0.08) / 0.53));
      const ripple = 0.72 + 0.28 * Math.sin(dot.x * 8 + dot.y * 5 - t * 2.8 + c.phase);
      const activity = 1 + 0.35 * m.fast.high * Math.sin(dot.phase + t * 3.1) + 0.2 * m.residue;
      const size = pitch * (0.045 + 0.52 * edge * edge) * ripple * activity;
      const shear = 7 * Math.sin(dot.y * 7 - t * 1.35 + c.phase) * (1 + m.slow.mid);
      const lift =
        5 * Math.sin(dot.x * 8 + t * 1.2 + c.phase) + m.impulse * 7 * Math.sin(dot.phase);
      g.fillRect(dot.x * c.size + shear - size / 2, dot.y * c.size + lift - size / 2, size, size);
    }
    g.restore();
    // Arcs and opaque discs enter among the patches, allowing dots to cross later layers.
    if (c.id % 3 === 0) {
      const radius = 48 + R(c.id, 12) * 105;
      const cx = x + Math.sin(c.phase + t * 0.37) * 65,
        cy = y + Math.cos(c.phase + t * 0.43) * 65;
      const direction = c.id % 2 ? -1 : 1;
      const angle =
        c.phase +
        direction * t * (0.35 + R(c.id, 13) * 0.4) +
        m.slow.mid * 0.45 +
        0.22 * Math.sin(t * 1.1 + c.phase);
      g.save();
      g.translate(cx + entry.dx, cy + entry.dy);
      g.scale(entry.scale, entry.scale);
      g.strokeStyle = palette[Math.floor(R(c.id, 14) * 6)];
      for (let k = 0; k < 6; k++) {
        const rr =
          radius + k * 2.3 + 12 * Math.sin(t * 1.03 + c.phase + k * 0.45) + m.slow.bass * 13;
        g.lineWidth = 0.55 + 0.25 * m.fast.centroid;
        const start = angle + k * 0.026,
          end = start + 1.15 + R(c.id, k + 15) * 0.85 + 0.45 * Math.sin(t * 1.2 + c.phase);
        g.beginPath();
        g.arc(0, 0, rr, start, end);
        g.stroke();
      }
      g.restore();
    }
    if (c.id % 4 === 0) {
      const radius = 10 + R(c.id, 22) * 26;
      g.save();
      g.translate(
        x + entry.dx + Math.cos(c.phase + t * 0.59) * 78,
        y + entry.dy + Math.sin(c.phase + t * 0.59) * 58,
      );
      g.scale(entry.scale, entry.scale);
      g.fillStyle = palette[Math.floor(R(c.id, 23) * palette.length)];
      g.beginPath();
      g.arc(0, 0, radius * (1 + 0.07 * m.fast.rms + 0.03 * Math.sin(t * 0.7 + c.phase)), 0, TAU);
      g.fill();
      g.restore();
    }
  }
  g.restore();
  return s;
}
