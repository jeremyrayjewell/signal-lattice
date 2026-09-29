import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(52709, id * 181 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const CELL = 65,
  CX = 480,
  CY = 270,
  CLIP_R = 272;
// Only cells whose center falls within the circular clip are kept — the
// source's macro silhouette is a disc built from a square grid, not a full
// rectangular frame, unlike every earlier grid scene in this set.
const colStart = Math.floor((CX - CLIP_R) / CELL) - 1,
  colEnd = Math.ceil((CX + CLIP_R) / CELL) + 1;
const rowStart = Math.floor((CY - CLIP_R) / CELL) - 1,
  rowEnd = Math.ceil((CY + CLIP_R) / CELL) + 1;
const cells = [];
{
  let uid = 0;
  for (let row = rowStart; row <= rowEnd; row++)
    for (let col = colStart; col <= colEnd; col++) {
      const ccx = col * CELL + CELL / 2,
        ccy = row * CELL + CELL / 2;
      if (Math.hypot(ccx - CX, ccy - CY) > CLIP_R) continue;
      const id = uid++;
      const baseRot = (Math.floor(r(id, 1) * 4) * Math.PI) / 2;
      const flipX = r(id, 2) < 0.5 ? -1 : 1,
        flipY = r(id, 3) < 0.5 ? -1 : 1;
      const sheared = r(id, 4) < 0.35;
      const shearAngle = (r(id, 5) - 0.5) * 0.7;
      const bgIdx = r(id, 6) < 0.5 ? 0 : 1;
      const layers = r(id, 7) < 0.5 ? 4 : 8;
      const sw = r(id, 8) < 0.5 ? 0 : 1;
      cells.push({
        id,
        col,
        row,
        ccx,
        ccy,
        baseRot,
        flipX,
        flipY,
        sheared,
        shearAngle,
        bgIdx,
        layers,
        sw,
      });
    }
}

// A wedge (pie-slice) helper shared by both nested arcs.
function wedge(g, cx, cy, rad, a0, a1) {
  g.beginPath();
  g.moveTo(cx, cy);
  g.arc(cx, cy, rad, a0, a1);
  g.closePath();
  g.fill();
}

// A nested "onion" motif: concentric shrinking layers, each an arc-wedge
// anchored at one corner, a small oval near center, a second arc-wedge
// anchored at the opposite edge, and a nested square — alternating black and
// white fill layer by layer. Independent geometry, not the source's exact
// arc/ellipse/rect calls.
function drawMotif(g, R, layers, sw) {
  for (let i = 0; i < layers; i++) {
    const ar = R * 2 * (1 - i / layers);
    g.fillStyle = (sw + i) % 2 === 0 ? '#070605' : '#f8f5ee';
    wedge(g, -R, -R, ar / 2, 0, Math.PI / 2);
    g.beginPath();
    g.ellipse(0, 0, ar / 2.3, ar / 4, 0, 0, TAU);
    g.fill();
    wedge(g, R, 0, ar / 2, Math.PI * (120 / 180), Math.PI * (270 / 180));
    const sq = ar / 2.15;
    g.fillRect(-R / 2 - sq / 2, R / 2 - sq / 2, sq, sq);
  }
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#faf8f2');
  g.lineJoin = 'round';
  g.lineCap = 'round';

  cells.forEach(
    ({ id, col, row, ccx, ccy, baseRot, flipX, flipY, sheared, shearAngle, bgIdx, layers, sw }) => {
      const entry = introFor(id, intro, 380);
      if (!entry.active) return;
      const ripple = (col + row) * 0.015;
      const m = at(0.05 + ripple);
      const phase = r(id, 20) * TAU;
      const selected = (0.5 + 0.5 * Math.sin(id * 1.3 - t * 0.6 + phase)) ** 6;
      const flash = m.impulse * s.impulse;
      const cx = ccx + entry.dx,
        cy = ccy + entry.dy;
      // Genuine continuous spin per cell (not a subtle wobble), independent
      // speed and direction, faster with the piece's energy and with mids.
      const spinSpeed = (r(id, 21) - 0.5) * 0.55 * s.motion * (1 + 0.8 * m.slow.mid + 0.6 * flash);
      const spin = t * spinSpeed + phase * 0.2;
      const R = (CELL / 2) * entry.scale * (1 + 0.04 * m.slow.bass);
      g.save();
      g.translate(cx, cy);
      g.rotate(baseRot + spin);
      g.scale(flipX, flipY);
      if (sheared)
        g.transform(
          1,
          Math.tan(shearAngle + 0.1 * m.fast.high * Math.sin(t * 0.6 + phase)),
          0,
          1,
          0,
          0,
        );

      g.fillStyle = bgIdx === 0 ? '#070605' : '#f8f5ee';
      g.fillRect(-R, -R, CELL, CELL);
      g.save();
      const bright = selected * 0.12 + flash * 0.2;
      if (bright) g.filter = `brightness(${1 + bright})`;
      drawMotif(g, R, layers, sw);
      g.filter = 'none';
      g.restore();
      g.restore();
    },
  );

  return s;
}
