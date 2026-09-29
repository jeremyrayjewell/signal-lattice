import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(71801, id * 191 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
const STEPS = 110;

// Each ribbon has its own smoothly wandering "spine" path (a sum of two
// sine terms per axis, own frequencies/phases/amplitudes) with a genuine
// geometric spiral offset traveling around that spine (own loop-count,
// radius and phase) — an independent parametric construction, not the
// source's Perlin-noise position walk with a purely size-pulsing dab chain.
// Width and coil amount both taper linearly from the ribbon's start, same
// taper concept as the source's k = j / mxj, own formula.
const RIBBON_COUNT = 42;
const ribbons = Array.from({ length: RIBBON_COUNT }, (_, k) => {
  const id = k;
  const ox = 40 + r(id, 1) * (W - 80),
    oy = 40 + r(id, 2) * (H - 80);
  const wide = r(id, 3) < 0.55;
  const ampX1 = (wide ? 140 : 40) + r(id, 4) * (wide ? 260 : 90),
    ampX2 = (wide ? 60 : 15) + r(id, 5) * (wide ? 160 : 40);
  const ampY1 = (wide ? 110 : 35) + r(id, 6) * (wide ? 230 : 80),
    ampY2 = (wide ? 50 : 12) + r(id, 7) * (wide ? 140 : 35);
  const freq1 = 0.5 + r(id, 8) * 1.3,
    freq2 = 1.2 + r(id, 9) * 2.1;
  const phase1 = r(id, 10) * TAU,
    phase2 = r(id, 11) * TAU;
  const driftSpeed1 = (r(id, 12) - 0.5) * 0.24,
    driftSpeed2 = (r(id, 13) - 0.5) * 0.32;
  const bold = r(id, 14) < 0.4;
  const loopCount = bold ? 2 + Math.floor(r(id, 15) * 4) : 4 + Math.floor(r(id, 15) * 13);
  const coilRadius = bold ? 30 + r(id, 16) * 70 : 2 + r(id, 16) * 22;
  const brushWidth = bold ? 10 + r(id, 17) * 22 : 1.5 + r(id, 17) * 6;
  const coilPhase = r(id, 18) * TAU,
    coilSpeed = (r(id, 19) - 0.5) * 0.75;
  const hueStart = r(id, 20) * 360,
    hueSpan = (r(id, 21) - 0.5) * 130;
  const selPhase = r(id, 22) * TAU;
  return {
    id,
    ox,
    oy,
    ampX1,
    ampX2,
    ampY1,
    ampY2,
    freq1,
    freq2,
    phase1,
    phase2,
    driftSpeed1,
    driftSpeed2,
    loopCount,
    coilRadius,
    brushWidth,
    coilPhase,
    coilSpeed,
    hueStart,
    hueSpan,
    selPhase,
  };
});

const DOT_COUNT = 240;
const dots = Array.from({ length: DOT_COUNT }, (_, k) => {
  const id = 3000 + k;
  const x = r(id, 1) * W,
    y = r(id, 2) * H;
  const radius = 1.4 + Math.pow(r(id, 3), 1.6) * 6;
  const isWhite = r(id, 4) < 0.55;
  const phase = r(id, 5) * TAU;
  const twinkleSpeed = 0.9 + r(id, 6) * 2.4;
  return { id, x, y, radius, isWhite, phase, twinkleSpeed };
});

const RECT_COUNT = 16;
const rects = Array.from({ length: RECT_COUNT }, (_, k) => {
  const id = 4000 + k;
  const x = r(id, 1) * W,
    y = r(id, 2) * H;
  const size = 90 + r(id, 3) * 240;
  const hue = r(id, 4) * 360;
  const rot = r(id, 5) * TAU;
  const phase = r(id, 6) * TAU;
  return { id, x, y, size, hue, rot, phase };
});

function ribbonGeometry(rb, tTime, coilScale) {
  const pts = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const a1 = t * rb.freq1 * TAU + rb.phase1 + tTime * rb.driftSpeed1;
    const a2 = t * rb.freq2 * TAU + rb.phase2 + tTime * rb.driftSpeed2;
    const sx = rb.ox + rb.ampX1 * Math.sin(a1) + rb.ampX2 * Math.sin(a2 * 1.4);
    const sy = rb.oy + rb.ampY1 * Math.cos(a1 * 1.15) + rb.ampY2 * Math.cos(a2 * 0.85);
    const coilA = t * rb.loopCount * TAU + rb.coilPhase + tTime * rb.coilSpeed;
    const cr = rb.coilRadius * t * coilScale;
    pts.push({ x: sx + Math.cos(coilA) * cr, y: sy + Math.sin(coilA) * cr, t });
  }
  return pts;
}

function drawField(g, t, s, at, intro) {
  rects.forEach((rc) => {
    const entry = introFor(rc.id, intro, 260);
    if (!entry.active) return;
    const m = at(0.3),
      flash = m.impulse * s.impulse;
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.4 + rc.phase);
    g.save();
    g.translate(rc.x + entry.dx, rc.y + entry.dy);
    g.rotate(rc.rot);
    g.scale(entry.scale, entry.scale);
    g.fillStyle = `hsla(${rc.hue} 70% ${22 + 8 * pulse}% / ${0.12 + 0.1 * m.slow.bass + 0.15 * flash})`;
    g.fillRect(-rc.size / 2, -rc.size / 2, rc.size, rc.size);
    g.restore();
  });

  ribbons.forEach((rb) => {
    const entry = introFor(rb.id, intro, 340);
    if (!entry.active) return;
    const m = at(0.15 + r(rb.id, 30) * 0.2);
    const flash = m.impulse * s.impulse;
    const selected = (0.5 + 0.5 * Math.sin(rb.id * 1.6 - t * 0.55 + rb.selPhase)) ** 5;
    const widthScale = (1 + 0.28 * m.slow.bass * s.articulation + 0.35 * flash) * entry.scale;
    const coilScale = (1 + 0.14 * m.slow.mid) * entry.scale;
    const pts = ribbonGeometry(rb, t, coilScale);
    const left = [],
      right = [];
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[Math.max(0, i - 1)],
        p1 = pts[Math.min(pts.length - 1, i + 1)];
      const dx = p1.x - p0.x,
        dy = p1.y - p0.y,
        len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len,
        ny = dx / len;
      const hw = rb.brushWidth * 0.5 * pts[i].t * widthScale;
      left.push({ x: pts[i].x + nx * hw + entry.dx, y: pts[i].y + ny * hw + entry.dy });
      right.push({ x: pts[i].x - nx * hw + entry.dx, y: pts[i].y - ny * hw + entry.dy });
    }
    g.beginPath();
    g.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) g.lineTo(left[i].x, left[i].y);
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i].x, right[i].y);
    g.closePath();
    const p0 = pts[0],
      p1 = pts[pts.length - 1];
    const grad = g.createLinearGradient(
      p0.x + entry.dx,
      p0.y + entry.dy,
      p1.x + entry.dx,
      p1.y + entry.dy,
    );
    const light = 48 + 10 * selected + 14 * flash + 6 * m.fast.centroid;
    const alpha = Math.min(1, 0.55 + 0.35 * m.fast.high + 0.25 * flash);
    grad.addColorStop(0, `hsla(${rb.hueStart} 88% ${light}% / ${alpha * 0.25})`);
    grad.addColorStop(0.5, `hsla(${rb.hueStart + rb.hueSpan * 0.5} 92% ${light}% / ${alpha})`);
    grad.addColorStop(1, `hsla(${rb.hueStart + rb.hueSpan} 95% ${light + 4}% / ${alpha})`);
    g.fillStyle = grad;
    g.fill();
  });

  dots.forEach((dot) => {
    const entry = introFor(dot.id, intro, 220);
    if (!entry.active) return;
    const m = at(0.05),
      flash = m.impulse * s.impulse;
    const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * dot.twinkleSpeed + dot.phase)) ** 2;
    const radius = Math.max(0.4, dot.radius * (1 + 0.3 * flash) * entry.scale);
    g.beginPath();
    g.arc(dot.x + entry.dx, dot.y + entry.dy, radius, 0, TAU);
    g.fillStyle = dot.isWhite
      ? `rgba(255,255,255,${Math.min(1, 0.5 + 0.4 * twinkle + 0.3 * flash)})`
      : `rgba(4,4,8,${0.55 + 0.35 * twinkle})`;
    g.fill();
  });
}

const layers = new WeakMap();
function getBuffer(p) {
  let c = layers.get(p);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 480;
    c.height = 270;
    layers.set(p, c);
  }
  return c;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#050507');

  const buf = getBuffer(p);
  const b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  drawField(b, t, s, at, intro);
  b.restore();

  if (intro >= 1) {
    g.save();
    g.filter = 'blur(6px)';
    g.globalAlpha = 0.5;
    g.drawImage(buf, -6, -6, W + 12, H + 12);
    g.restore();
  }
  g.drawImage(buf, 0, 0, W, H);

  return s;
}
