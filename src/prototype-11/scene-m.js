import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const random = (id, k = 0) => randomAt(60713, id * 71 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
// Original asymmetric placements: x, y, scale, aspect, white/black.
const forms = [
  [-25, 185, 153, 0.95, 0],
  [165, 160, 145, 0.87, 1],
  [352, 40, 153, 1.12, 0],
  [550, 100, 175, 0.84, 1],
  [806, 55, 157, 0.91, 0],
  [956, 210, 156, 1.15, 1],
  [68, 453, 158, 0.85, 0],
  [304, 415, 166, 0.9, 1],
  [485, 323, 148, 1.08, 0],
  [740, 368, 171, 0.95, 1],
  [920, 514, 146, 0.9, 0],
  [80, 28, 91, 0.8, 1],
];
const layers = new WeakMap();
function drawMesh(g, id, form, t, s, m, soft = false) {
  const [baseX, baseY, size, aspect, white] = form;
  const phase = random(id) * TAU;
  const x = baseX + 25 * s.motion * Math.sin(t * 0.27 + phase),
    y = baseY + 22 * s.motion * Math.cos(t * 0.33 + phase);
  const turn = 0.32 * Math.sin(t * 0.31 + phase);
  const inner = 0.44 + 0.09 * Math.sin(t * 0.41 + phase) + m.slow.bass * 0.065;
  const skew = 0.23 * Math.sin(t * 0.52 + phase) + m.slow.mid * 0.2;
  const amp = 0.13 + 0.08 * s.articulation + m.slow.bass * 0.09;
  function point(a, rail) {
    const q = a + turn;
    const deform =
      1 + amp * Math.sin(q * 3 + phase + t * 0.39) + 0.11 * Math.sin(q * 5 - phase - t * 0.28);
    const radius = size * (rail ? 1 : inner) * deform;
    const impulse = m.impulse * s.impulse * size * 0.075 * Math.sin(q * 2 + phase);
    return [
      Math.cos(q) * (radius + impulse) + size * 0.12 * Math.sin(q * 2 + t * 0.37 + phase),
      Math.sin(q) * (radius + impulse) * aspect + size * 0.08 * Math.cos(q * 3 - t * 0.3),
    ];
  }
  g.save();
  g.translate(x, y);
  const count = soft ? 64 : 112 + Math.floor(random(id, 2) * 40);
  g.strokeStyle = white ? '#ffffff' : '#050505';
  g.globalAlpha = soft ? 0.82 : Math.min(0.9, 0.52 + 0.16 * m.fast.rms + 0.08 * m.fast.centroid);
  g.lineWidth = soft ? 1.5 : 0.65 + 0.17 * s.detail + 0.14 * m.residue;
  for (let n = 0; n < count; n++) {
    const a = (n / count) * TAU + t * (0.075 + random(id, 3) * 0.07);
    const spread = 0.18 + 0.1 * Math.sin(a * 2 + t * 0.48 + phase);
    const points = [
      point(a - spread, 0),
      point(a + spread + skew, 0),
      point(a + 0.32 + skew, 1),
      point(a - 0.25, 1),
    ];
    g.beginPath();
    points.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.closePath();
    g.stroke();
  }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  // The blurred backdrop is an opaque full-canvas layer, so it's skipped
  // entirely while this scene is still being introduced (intro<1) — only the
  // foreground mesh forms (each with its own fly-in entry, below) should
  // appear over the still-live outgoing scene.
  if (intro >= 1) {
    let back = layers.get(p);
    if (!back) {
      back = document.createElement('canvas');
      back.width = 480;
      back.height = 270;
      layers.set(p, back);
    }
    const b = back.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalAlpha = 1;
    b.fillStyle = '#b4b4b4';
    b.fillRect(0, 0, 480, 270);
    b.save();
    b.scale(0.5, 0.5);
    for (let i = 0; i < 8; i++) {
      const f = forms[(i * 5) % forms.length];
      drawMesh(
        b,
        i + 31,
        [960 - f[0], 540 - f[1], f[2] * 1.28, f[3], 1 - f[4]],
        t * 0.83,
        s,
        at(i * 0.075),
        true,
      );
    }
    b.restore();
    p.background('#dedede');
    g.save();
    g.filter = 'blur(9px)';
    g.drawImage(back, -14, -14, 988, 568);
    g.restore();
  }
  g.save();
  g.lineJoin = 'miter';
  g.lineCap = 'butt';
  forms.forEach((form, i) => {
    const entry = introFor(i, intro, 460);
    if (!entry.active) return;
    drawMesh(
      g,
      i,
      [form[0] + entry.dx, form[1] + entry.dy, form[2] * entry.scale, form[3], form[4]],
      t,
      s,
      at((i % 4) * 0.085 + random(i, 4) * 0.12),
    );
  });
  g.restore();
  return s;
}
