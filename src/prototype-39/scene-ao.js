import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(60639, id * 313 + k);
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const tiles = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: R(id, 0) * TAU,
  size: 145 + R(id, 1) * 10,
  vertical: R(id, 2) > 0.5,
  invert: R(id, 3) > 0.5,
}));
function contour(a, phase, t, detail = 0) {
  return (
    1 +
    0.13 * Math.sin(a * 3 + phase + t * 0.67) +
    0.09 * Math.cos(a * 5 - phase * 0.7 - t * 0.91) +
    0.055 * Math.sin(a * 9 + phase + t * 1.13) +
    detail * (0.035 * Math.sin(a * 31 + phase) + 0.022 * Math.cos(a * 47 - t * 0.8))
  );
}
function form(g, c, t, m, layer) {
  const ph = c.phase + layer * 2.3;
  const radius = c.size * (layer ? 0.34 : 0.48) * (1 + 0.07 * m.slow.bass);
  const x = Math.sin(t * 0.43 + ph) * c.size * 0.13,
    y = Math.cos(t * 0.51 + ph) * c.size * 0.12;
  g.save();
  g.translate(x, y);
  g.rotate(t * (layer ? -0.16 : 0.12) + ph);
  for (let band = 18; band > 0; band--) {
    const fraction = band / 18;
    const tone = Math.round(22 + 209 * (c.invert ? fraction : 1 - fraction));
    g.fillStyle = `rgb(${tone},${tone},${tone})`;
    g.beginPath();
    for (let j = 0; j <= 96; j++) {
      const a = (j / 96) * TAU;
      const rr = radius * fraction * contour(a, ph + fraction * 0.65, t, 0);
      const xx = rr * Math.cos(a),
        yy = rr * Math.sin(a) * (1 + 0.15 * Math.sin(ph + t * 0.37));
      if (j === 0) g.moveTo(xx, yy);
      else g.lineTo(xx, yy);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.lineCap = 'butt';
  for (const c of tiles) {
    const entry = introFor(c.id, intro, 350);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.19) : quiet;
    const half = c.size / 2;
    g.save();
    g.translate(c.x + entry.dx, c.y + entry.dy);
    g.scale(entry.scale, entry.scale);
    g.save();
    g.beginPath();
    g.rect(-half, -half, c.size, c.size);
    g.clip();
    const gradient = g.createRadialGradient(
      half * 0.3 * Math.sin(t * 0.4 + c.phase),
      half * 0.3 * Math.cos(t * 0.3 + c.phase),
      2,
      0,
      0,
      c.size * 0.85,
    );
    gradient.addColorStop(0, c.invert ? '#d9d9d9' : '#292929');
    gradient.addColorStop(1, c.invert ? '#151515' : '#b2b2b2');
    g.fillStyle = gradient;
    g.fillRect(-half, -half, c.size, c.size);
    form(g, c, t, m, 0);
    g.save();
    g.globalCompositeOperation = 'difference';
    g.translate(12 * Math.sin(t * 0.72 + c.phase), 12 * Math.cos(t * 0.63 + c.phase));
    g.rotate(0.12 * Math.sin(t * 0.57 + c.phase) + m.slow.mid * 0.15);
    form(g, c, t + 3, m, 1);
    g.restore();
    // Fine broken boundaries and grain trails sit above the broad contour bands.
    for (let k = 0; k < 4; k++) {
      const phase = c.phase + k * 1.7;
      const radius = c.size * (0.17 + k * 0.073) * (1 + 0.035 * m.impulse * s.impulse);
      const px = 12 * Math.sin(t * 0.61 + phase),
        py = 12 * Math.cos(t * 0.57 + phase);
      g.strokeStyle = k % 2 ? 'rgba(0,0,0,.9)' : 'rgba(255,255,255,.8)';
      g.lineWidth = k === 0 ? 1.5 : 0.65;
      g.beginPath();
      for (let j = 0; j <= 160; j++) {
        const a = (j / 160) * TAU,
          rr = radius * contour(a, phase, t + 0.3 * k, 1);
        const x = px + rr * Math.cos(a),
          y = py + rr * Math.sin(a);
        if (j === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      g.fillStyle = k % 2 ? '#050505' : '#eeeeee';
      for (let j = 0; j < 95; j++) {
        const a = (j / 95) * TAU + t * (0.15 + k * 0.04),
          rad = radius * contour(a, phase, t + 0.3 * k, 1);
        const spread = (R(c.id, j + k * 100 + 20) - 0.5) * 9 * (1 + 0.35 * m.residue);
        const dot = 0.3 + R(c.id, j + k * 100 + 120) * 1.6;
        g.beginPath();
        g.arc(px + (rad + spread) * Math.cos(a), py + (rad + spread) * Math.sin(a), dot, 0, TAU);
        g.fill();
      }
    }
    g.restore();
    // Slightly offset frames and sparse red scan lines retain the reference's panel grammar.
    g.strokeStyle = 'rgba(220,220,220,.35)';
    g.lineWidth = 1;
    g.strokeRect(
      -half + 5 * Math.sin(t * 0.5 + c.phase),
      -half + 5 * Math.cos(t * 0.44 + c.phase),
      c.size,
      c.size,
    );
    if (c.vertical) g.rotate(Math.PI / 2);
    for (let k = 0; k < 24; k++) {
      const phase = R(c.id, k + 700) * TAU;
      const y =
        (R(c.id, k + 750) - 0.5) * 166 +
        5 * Math.sin(t * (0.8 + R(c.id, k + 800)) + phase) +
        m.impulse * s.impulse * 6 * Math.sin(phase);
      const red = k % 7 === 0;
      g.strokeStyle = red
        ? `rgba(239,24,31,${0.65 + 0.2 * m.fast.high})`
        : k % 3
          ? 'rgba(245,245,245,.42)'
          : 'rgba(0,0,0,.7)';
      g.lineWidth = red ? 0.7 + 0.35 * m.fast.rms : 0.5 + 0.25 * m.fast.centroid;
      g.beginPath();
      g.moveTo(-78, y);
      g.lineTo(78, y);
      g.stroke();
    }
    g.restore();
  }
  g.restore();
  return s;
}
