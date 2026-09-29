import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(28451, id * 197 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
// Own five-color palette (deep teal / warm coral / ochre / plum / pale
// mint), independent of the source's muted terracotta/sage/cream/slate set
// per the user's explicit "just change the colors" instruction.
const PALETTE = [
  [178, 45, 32],
  [14, 62, 55],
  [42, 68, 52],
  [322, 38, 30],
  [150, 32, 78],
];
function paletteColor(idx, alpha = 1, lightBoost = 0, hueShift = 0) {
  const [h, s, l] = PALETTE[idx];
  return `hsla(${h + hueShift} ${s}% ${Math.max(0, Math.min(100, l + lightBoost))}% / ${alpha})`;
}

// A grid of cells, each independently rotated (0/90/-90/180°) and sometimes
// mirrored, containing the same four-part recipe: a jittered-corner color
// block, a corner dot, a set of nested quarter-circle arc rings, and
// sometimes a curved accent line — own construction throughout, echoing the
// source's structural recipe per the user's request to keep the approach
// and just recolor it.
const COLS = 9,
  ROWS = 5,
  CELL = 108;
const X_OFF = (W - COLS * CELL) / 2,
  Y_OFF = (H - ROWS * CELL) / 2;
const ROTATIONS = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
const cells = [];
for (let row = 0; row < ROWS; row++)
  for (let col = 0; col < COLS; col++) {
    const id = row * COLS + col;
    const rotIdx = Math.floor(r(id, 1) * 4);
    const flip = r(id, 2) < 0.5 ? -1 : 1;
    const blockIdx = Math.floor(r(id, 3) * PALETTE.length);
    const dotIdx = Math.floor(r(id, 4) * PALETTE.length);
    const arcIdx = Math.floor(r(id, 5) * PALETTE.length);
    const ringCount = 4 + Math.floor(r(id, 6) * 6);
    const hasCurve = r(id, 7) < 0.5;
    const curveWhite = r(id, 8) < 0.5;
    const jitters = Array.from({ length: 8 }, (_, k) => r(id, 9 + k) - 0.5);
    const phase = r(id, 17) * TAU;
    const rippleSpeed = 0.16 + r(id, 18) * 0.26;
    const rippleDir = r(id, 20) < 0.5 ? 1 : -1;
    const wobblePhase2 = r(id, 21) * TAU;
    const hueDriftPhase = r(id, 22) * TAU;
    const selPhase = r(id, 19) * TAU;
    const cx = X_OFF + col * CELL + CELL / 2,
      cy = Y_OFF + row * CELL + CELL / 2;
    cells.push({
      id,
      cx,
      cy,
      rotIdx,
      flip,
      blockIdx,
      dotIdx,
      arcIdx,
      ringCount,
      hasCurve,
      curveWhite,
      jitters,
      phase,
      rippleSpeed,
      rippleDir,
      wobblePhase2,
      hueDriftPhase,
      selPhase,
    });
  }

function drawField(g, t, s, at, intro) {
  cells.forEach((c) => {
    const entry = introFor(c.id, intro, 260);
    if (!entry.active) return;
    const m = at(0.05 + (c.cx / W) * 0.15),
      flash = m.impulse * s.impulse;
    const selected = (0.5 + 0.5 * Math.sin(c.id * 0.9 - t * 0.5 + c.selPhase)) ** 5;
    const G = CELL;
    const wobble =
      (0.07 + 0.13 * s.motion + 0.14 * flash) * Math.sin(t * 0.3 + c.phase) +
      (0.03 + 0.05 * s.motion) * Math.sin(t * 0.78 + c.wobblePhase2);
    const breathe = 1 + 0.035 * Math.sin(t * 0.5 + c.phase * 1.4) + 0.05 * m.slow.bass;
    g.save();
    g.translate(c.cx + entry.dx, c.cy + entry.dy);
    g.rotate(ROTATIONS[c.rotIdx] + wobble);
    g.scale(c.flip * entry.scale * 0.96 * breathe, entry.scale * 0.96 * breathe);

    const z = G / 9,
      jx = c.jitters;
    g.beginPath();
    g.moveTo(-G / 2 + jx[0] * z, -G / 4 + jx[1] * z);
    g.lineTo(-G / 2 + jx[2] * z, G / 4 - jx[3] * z);
    g.lineTo(G / 2 - jx[4] * z, G / 4 - jx[5] * z);
    g.lineTo(G / 2 - jx[6] * z, -G / 4 + jx[7] * z);
    g.closePath();
    g.fillStyle = paletteColor(c.blockIdx, 1, 6 * selected + 14 * flash);
    g.fill();

    const er = G / 5.2;
    const dotR = Math.max(0.5, (er / 2) * (1 + 0.18 * m.slow.bass + 0.3 * flash));
    g.beginPath();
    g.arc(G / 2 - er / 1.6, G / 2 - er / 1.6, dotR, 0, TAU);
    g.fillStyle = paletteColor(c.dotIdx, 1, 10 * flash);
    g.fill();

    const ag = G / c.ringCount;
    const ripplePhase =
      (((t * c.rippleSpeed * c.rippleDir * (0.4 + 0.5 * s.motion + 0.3 * m.fast.high) +
        c.phase / TAU) %
        1) +
        1) %
      1;
    const hueDrift = 10 * Math.sin(t * 0.1 + c.hueDriftPhase);
    g.strokeStyle = paletteColor(c.arcIdx, 0.92, 5 * m.fast.centroid + 10 * flash, hueDrift);
    g.lineWidth = Math.max(0.6, ag / 3.2);
    for (let j = 0; j <= c.ringCount + 1; j++) {
      const ar = (j - ripplePhase) * ag;
      if (ar <= 0 || ar > G) continue;
      g.beginPath();
      g.ellipse(-G / 2 + z / 2, 0, ar * 0.9, ar * 0.5, 0, -Math.PI / 2, 0);
      g.stroke();
    }

    if (c.hasCurve) {
      g.strokeStyle = c.curveWhite
        ? `rgba(250,250,250,${0.7 + 0.3 * m.fast.high})`
        : `rgba(6,6,6,${0.7 + 0.3 * m.fast.high})`;
      g.lineWidth = Math.max(0.5, G / 70);
      g.beginPath();
      g.moveTo(-G / 2 + z, -G / 2 + z);
      g.bezierCurveTo(-G / 2 + z, -G / 2 + z, G / 2, -G / 4, G / 2 - er / 1.6, G / 2 - er / 1.6);
      g.stroke();
    }
    g.restore();
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
  if (intro >= 1) p.background('#050505');

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
