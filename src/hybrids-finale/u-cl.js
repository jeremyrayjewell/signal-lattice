// Finale hybrid of Scene U ("Rune Glyphs", segment 1) and Scene CL ("Signal Junctions", Codex,
// segment 7). U's 60 spinning rune-glyph grid cells and CL's 82 square-corner-arm nodes are merged
// into one array, tagged and depth-sorted together every frame, drawn in a single shared loop. CL's
// own brightness-sampled patch population still samples from CL's own private node-layer buffer,
// exactly as in the source -- that internal pipeline is kept intact and drawn as its own pass.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateU } from '../prototype-19/states.js';
import { stateAt as stateCL } from '../prototype-88/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};

// ---- Scene U's own population ----
const ur = (id, k = 0) => randomAt(60203, id * 163 + k);
const U_COLS = 10,
  U_ROWS = 6,
  U_CELL = 96;
const uRowOffsets = Array.from(
  { length: U_ROWS },
  (_, row) => (randomAt(71117, row) - 0.5) * U_CELL,
);
const uCells = Array.from({ length: U_COLS * U_ROWS }, (_, id) => {
  const col = id % U_COLS,
    row = Math.floor(id / U_COLS);
  const baseRot = (Math.floor(ur(id, 1) * 4) * Math.PI) / 2;
  const flipX = ur(id, 2) < 0.5 ? -1 : 1,
    flipY = ur(id, 3) < 0.5 ? -1 : 1;
  const smallScale = ur(id, 4) < 0.5;
  const extraRot = ur(id, 5) * TAU;
  const hasOuterArc1 = ur(id, 6) < 0.5,
    hasOuterArc2 = ur(id, 7) < 0.5,
    hasRing2 = ur(id, 8) < 0.5;
  return {
    id,
    col,
    row,
    baseRot,
    flipX,
    flipY,
    smallScale,
    extraRot,
    hasOuterArc1,
    hasOuterArc2,
    hasRing2,
  };
});
function drawUGlyph(g, mr, lr, hasOuterArc1, hasOuterArc2, hasRing2) {
  g.lineWidth = lr;
  g.beginPath();
  g.arc(0, 0, mr, -0.31, 1.6);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, mr, 2.58, 4.15);
  g.stroke();
  g.beginPath();
  g.arc(mr * 0.55, -mr * 0.55, mr * 0.33, 0, TAU);
  g.stroke();
  if (hasRing2) {
    g.beginPath();
    g.arc(mr * 0.55, -mr * 0.55, mr * 0.16, 0, TAU);
    g.stroke();
  }
  g.lineWidth = lr * 0.55;
  g.beginPath();
  g.moveTo(-lr * 2.5, -lr * 0.6);
  g.lineTo(-lr * 0.4, mr * 0.85);
  g.lineTo(-mr * 0.85, mr * 0.85);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.moveTo(-mr * 0.9, -mr * 0.85);
  g.bezierCurveTo(-mr * 0.5, -mr * 0.55, -mr * 0.05, -mr * 0.05, mr * 0.02, mr * 0.05);
  g.bezierCurveTo(mr * 0.06, mr * 0.18, mr * 0.08, mr * 0.25, mr * 0.1, mr * 0.35);
  g.stroke();
  g.beginPath();
  g.moveTo(-lr * 1.2, -mr * 0.9);
  g.lineTo(mr * 0.08, mr * 0.3);
  g.stroke();
  g.beginPath();
  g.moveTo(mr * 0.15, 0);
  g.lineTo(mr * 0.45, mr * 0.85);
  g.stroke();
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(lr * 4, 0);
  g.stroke();
  g.lineWidth = lr;
  if (hasOuterArc1) {
    g.beginPath();
    g.arc(0, 0, mr + lr * 2.5, -0.31, 0.96);
    g.stroke();
  }
  if (hasOuterArc2) {
    g.beginPath();
    g.arc(0, 0, mr + lr * 2.5, 2.58, 4.5);
    g.stroke();
  }
}
function drawUCell(g, c, t, s, at, entry) {
  const ripple = (c.col + c.row) * 0.016;
  const m = at(0.05 + ripple);
  const phase = ur(c.id, 20) * TAU;
  const selected = (0.5 + 0.5 * Math.sin(c.id * 1.3 - t * 0.6 + phase)) ** 6;
  const flash = m.impulse * s.impulse;
  const cx = c.col * U_CELL + U_CELL / 2 + uRowOffsets[c.row] + entry.dx,
    cy = c.row * U_CELL + U_CELL / 2 + entry.dy;
  const spinSpeed = (ur(c.id, 21) - 0.5) * 0.7 * s.motion * (1 + 0.8 * m.slow.mid + 0.6 * flash);
  const spin = t * spinSpeed + phase * 0.2;
  const innerSpinSpeed = (ur(c.id, 22) - 0.5) * 1.1 * s.motion * (1 + 0.6 * m.fast.high);
  const mr = U_CELL * 0.4 * (1 + 0.05 * m.slow.bass) * entry.scale;
  const lr = (mr / 9) * (1 + 0.35 * flash + 0.15 * selected);
  g.save();
  g.translate(cx, cy);
  g.rotate(c.baseRot + spin);
  g.scale(c.flipX, c.flipY);
  if (c.smallScale) {
    g.scale(0.75, 0.75);
    g.rotate(c.extraRot + t * innerSpinSpeed);
  }
  g.strokeStyle = `rgba(10,9,8,${0.82 + 0.12 * m.fast.rms + 0.1 * selected + 0.15 * flash})`;
  drawUGlyph(g, mr, lr, c.hasOuterArc1, c.hasOuterArc2, c.hasRing2);
  g.restore();
}

// ---- Scene CL's own population ----
const clR = (i, k) => randomAt(122888, i * 241 + k);
const clNodes = Array.from({ length: 82 }, (_, id) => ({
  id,
  x: clR(id, 0) * 1140 - 90,
  y: clR(id, 1) * 720 - 90,
  size: 65 + clR(id, 2) * 82,
  phase: clR(id, 3) * TAU,
  angle: clR(id, 4) > 0.5 ? Math.PI / 4 : 0,
}));
const clPatches = [];
for (let y = 0; y < 540; y += 27)
  for (let x = 0; x < 960; x += 27) {
    const id = clPatches.length,
      v = [1, 2, 4][Math.floor(clR(y * 960 + x, 180) * 3)],
      size = 27 / v;
    for (let sy = 0; sy < v; sy++)
      for (let sx = 0; sx < v; sx++) {
        const k = clPatches.length;
        clPatches.push({
          x: x + sx * size,
          y: y + sy * size,
          size,
          round: clR(k, 181) > 0.5,
          alpha: 0.15 + clR(k, 182) * 0.55,
          phase: clR(k, 183) * TAU,
        });
      }
  }
let clLayer;
function drawCLNode(g, n, t, s, entry) {
  const local = reactiveGlobal ? reactiveGlobal.at(t - 0.02 - (n.x / 960) * 0.17) : zero;
  const size = n.size * (1 + 0.075 * Math.sin(t * 0.71 + n.phase) + local.slow.bass * 0.07),
    half = size / 2;
  g.save();
  g.translate(
    n.x + entry.dx + 24 * Math.sin(t * 0.43 + n.phase),
    n.y + entry.dy + 22 * Math.cos(t * 0.47 + n.phase),
  );
  g.scale(entry.scale, entry.scale);
  g.rotate(n.angle + 0.06 * Math.sin(t * 0.51 + n.phase) * (1 + s.motion * 0.4));
  g.strokeStyle = 'rgba(255,255,255,.83)';
  g.lineWidth = 0.65 + local.fast.centroid * 0.25;
  const inner = size * (0.83 + 0.035 * Math.sin(t * 0.83 + n.phase));
  g.strokeRect(-inner / 2, -inner / 2, inner, inner);
  for (let corner = 0; corner < 4; corner++) {
    const sx = corner % 2 ? 1 : -1,
      sy = corner < 2 ? -1 : 1,
      phase = n.phase + corner * 1.4;
    const reach =
      size * (0.84 + 0.13 * Math.sin(t * 0.79 + phase) + local.impulse * s.impulse * 0.07);
    const inset = half * (0.2 + 0.6 * clR(n.id, corner + 20));
    g.beginPath();
    g.moveTo(sx * (half - inset), sy * half);
    g.lineTo(sx * reach, sy * half);
    g.moveTo(sx * half, sy * (half - inset));
    g.lineTo(sx * half, sy * reach);
    g.stroke();
    const radius = size * 0.035 * (1 + local.fast.rms * 0.16);
    g.fillStyle = '#ffffff';
    for (const [x, y, r] of [
      [sx * half, sy * half, radius],
      [sx * (half - radius * 1.8), sy * (half - radius * 1.8), radius * 0.66],
      [sx * reach, sy * half, radius * 0.6],
      [sx * half, sy * reach, radius * 0.6],
    ]) {
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
    }
  }
  g.restore();
}
let reactiveGlobal = null;

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sU = stateU(elapsed),
    sCL = stateCL(elapsed),
    out = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  reactiveGlobal = reactive ? controls : null;
  const mBase = reactive ? controls.at(t) : zero;

  // CL's own private node-layer render, kept intact so its patches can sample it -- rendered every
  // frame regardless of intro, matching the source's own always-fresh snapshot.
  if (!clLayer) {
    clLayer = document.createElement('canvas');
    clLayer.width = 960;
    clLayer.height = 540;
  }
  const lg = clLayer.getContext('2d', { willReadFrequently: true });
  lg.clearRect(0, 0, 960, 540);
  lg.lineCap = 'butt';
  lg.lineJoin = 'miter';
  for (const n of clNodes) {
    const e = introFor(n.id, intro, 380);
    if (!e.active) continue;
    drawCLNode(lg, n, t, sCL, e);
  }

  if (intro >= 1) p.background('#000000');
  out.save();
  out.lineJoin = 'miter';
  out.lineCap = 'square';

  const pool = [];
  uCells.forEach((c) => {
    const entry = introFor(c.id, intro, 400);
    if (!entry.active) return;
    pool.push({ kind: 'glyph', c, entry, depth: (ur(c.id, 900) - 0.5) * 240 });
  });
  clNodes.forEach((n) => {
    const entry = introFor(n.id + 4000, intro, 380);
    if (!entry.active) return;
    pool.push({ kind: 'node', n, entry, depth: (clR(n.id, 900) - 0.5) * 240 });
  });
  pool.sort((a, b) => a.depth - b.depth);
  for (const item of pool) {
    if (item.kind === 'glyph') drawUCell(out, item.c, t, sU, at, item.entry);
    else drawCLNode(out, item.n, t, sCL, item.entry);
  }

  // CL's brightness-sampled patches, drawn from the private layer above.
  const pixels = lg.getImageData(0, 0, 960, 540).data;
  function value(x, y) {
    const i =
      (Math.max(0, Math.min(539, Math.round(y))) * 960 +
        Math.max(0, Math.min(959, Math.round(x)))) *
      4;
    return (pixels[i] * pixels[i + 3]) / 255;
  }
  for (let id = 0; id < clPatches.length; id++) {
    const q = clPatches[id],
      e = introFor(id + 5300, intro, 350);
    if (!e.active) continue;
    const x = q.x + q.size / 2,
      y = q.y + q.size / 2;
    const tone = Math.round(
      (value(x, y) * 2 + value(x - 1, y) + value(x + 1, y) + value(x, y - 1) + value(x, y + 1)) / 6,
    );
    out.fillStyle = `rgb(${tone},${tone},${tone})`;
    out.globalAlpha = q.alpha * (0.8 + 0.2 * Math.sin(t * 0.93 + q.phase)) + mBase.fast.high * 0.07;
    const size = q.size * e.scale;
    out.beginPath();
    out.roundRect(x - size / 2 + e.dx, y - size / 2 + e.dy, size, size, q.round ? size / 2 : 0);
    out.fill();
  }
  out.globalAlpha = 1;
  out.restore();
  return sCL;
}
