import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(83417, id * 229 + k);
const cell = (a, b, c) => randomAt(29501, a * 4111 + b * 131 + c * 7919);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540,
  CX = W / 2,
  CY = H / 2;

// A ring of soft blob clusters around the canvas center — each built from
// several overlapping soft smudges (own radial-gradient construction, not
// the source's literal 30-40-concentric-circles-at-low-alpha stack) —
// composited with 'overlay' blending for the same rich, blended-color
// painterly look.
const BLOB_COUNT = 26,
  SMUDGES_PER_BLOB = 7;
const blobs = Array.from({ length: BLOB_COUNT }, (_, k) => {
  const id = k;
  const angle0 = (k / BLOB_COUNT) * TAU + (r(id, 1) - 0.5) * (TAU / BLOB_COUNT) * 0.6;
  const dist0 = 140 + r(id, 2) * 260;
  const hue = r(id, 3) * 360;
  const hueSpan = (r(id, 4) - 0.5) * 70;
  const orbitSpeed = (r(id, 5) - 0.5) * 0.045;
  const phase = r(id, 6) * TAU;
  const smudges = Array.from({ length: SMUDGES_PER_BLOB }, (_, si) => {
    const sid = id * 20 + si;
    const localX = (r(sid, 10) - 0.5) * 140,
      localY = (r(sid, 11) - 0.5) * 140;
    const radius = 55 + r(sid, 12) * 130;
    const driftAmp = 14 + r(sid, 13) * 30;
    const driftFreq = 0.08 + r(sid, 14) * 0.18;
    const driftPhase = r(sid, 15) * TAU;
    const huePick = hue + (r(sid, 16) - 0.5) * hueSpan;
    const alphaBase = 0.26 + r(sid, 17) * 0.3;
    return { localX, localY, radius, driftAmp, driftFreq, driftPhase, huePick, alphaBase };
  });
  return { id, angle0, dist0, orbitSpeed, phase, smudges };
});

// A scattered layer of scratch-line clusters, each a batch of thin vertical
// hatching lines with independently randomized endpoints — own
// placement/hatching logic, not the source's exact formulas — refreshed on
// a stepped clock for a genuine staticky shimmer rather than a smooth tween.
const SCRATCH_COUNT = 120;
const scratches = Array.from({ length: SCRATCH_COUNT }, (_, k) => {
  const id = 1000 + k;
  const x = r(id, 1) * W,
    y = r(id, 2) * H;
  const rot = r(id, 3) * TAU;
  const radius = 55 + r(id, 4) * 160;
  const white = r(id, 5) < 0.5;
  const hue = r(id, 6) * 360;
  const flickerRate = 2 + r(id, 7) * 4;
  return { id, x, y, rot, radius, white, hue, flickerRate };
});

function drawField(g, t, s, at, intro) {
  const globalSpin = t * 0.05 * (1 + 0.4 * s.motion);

  g.save();
  g.globalCompositeOperation = 'overlay';
  blobs.forEach((bl) => {
    const entry = introFor(bl.id, intro, 320);
    if (!entry.active) return;
    const m = at(0.12 + r(bl.id, 40) * 0.15),
      flash = m.impulse * s.impulse;
    const ang = bl.angle0 + globalSpin + bl.orbitSpeed * t;
    const dist = bl.dist0 * (1 + 0.08 * m.slow.bass + 0.12 * flash);
    const bx = CX + Math.cos(ang) * dist + entry.dx,
      by = CY + Math.sin(ang) * dist + entry.dy;
    bl.smudges.forEach((sm) => {
      const dx = sm.localX + Math.sin(t * sm.driftFreq + sm.driftPhase) * sm.driftAmp;
      const dy = sm.localY + Math.cos(t * sm.driftFreq * 1.3 + sm.driftPhase) * sm.driftAmp;
      const x = bx + dx,
        y = by + dy;
      const radius = Math.max(2, sm.radius * (1 + 0.1 * m.slow.bass + 0.18 * flash) * entry.scale);
      const alpha =
        (sm.alphaBase + 0.1 * m.fast.high + 0.14 * flash) * Math.min(1, entry.scale * 1.3);
      const grad = g.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `hsla(${sm.huePick} 88% 56% / ${alpha})`);
      grad.addColorStop(0.7, `hsla(${sm.huePick} 88% 56% / ${alpha * 0.6})`);
      grad.addColorStop(1, `hsla(${sm.huePick} 88% 56% / 0)`);
      g.fillStyle = grad;
      // Two passes build up richer, more saturated color where smudges
      // overlap, echoing the source's own dozens-of-stacked-low-alpha-circles
      // buildup technique (with far fewer, larger passes) rather than a
      // single translucent wash.
      g.beginPath();
      g.arc(x, y, radius, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(x, y, radius, 0, TAU);
      g.fill();
    });
  });
  g.restore();

  g.save();
  g.globalCompositeOperation = 'overlay';
  scratches.forEach((sc) => {
    const entry = introFor(sc.id, intro, 260);
    if (!entry.active) return;
    const m = at(0.04),
      flash = m.impulse * s.impulse;
    const flickerStep = Math.floor(t * sc.flickerRate * (1 + m.fast.high));
    const radius = sc.radius * entry.scale;
    g.save();
    g.translate(sc.x + entry.dx, sc.y + entry.dy);
    g.rotate(sc.rot);
    g.beginPath();
    for (let lx = -radius / 2; lx <= radius / 2; lx += 4) {
      const colIdx = Math.round((lx + 2000) / 4);
      const y1 = (cell(sc.id, colIdx, flickerStep) - 0.5) * 2 * (radius / 1.5);
      const y2 = (cell(sc.id, colIdx * 7 + 1, flickerStep) - 0.5) * 2 * (radius / 1.5);
      g.moveTo(lx, y1);
      g.lineTo(lx, y2);
    }
    g.strokeStyle = sc.white
      ? `hsla(0 0% 100% / ${0.18 + 0.18 * m.fast.high + 0.2 * flash})`
      : `hsla(${sc.hue} 80% 55% / ${0.3 + 0.25 * m.fast.high + 0.25 * flash})`;
    g.lineWidth = 1;
    g.stroke();
    g.restore();
  });
  g.restore();

  const coreEntry = introFor(9999, intro, 200);
  if (coreEntry.active) {
    const m = at(0.02),
      flash = m.impulse * s.impulse;
    const radius = Math.max(2, (108 + 6 * m.slow.bass + 16 * flash) * coreEntry.scale);
    g.fillStyle = '#050403';
    g.beginPath();
    g.arc(CX + coreEntry.dx, CY + coreEntry.dy, radius, 0, TAU);
    g.fill();
  }
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
  if (intro >= 1) p.background('#d98a2e');

  const buf = getBuffer(p);
  const b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  drawField(b, t, s, at, intro);
  b.restore();
  g.drawImage(buf, 0, 0, W, H);

  return s;
}
