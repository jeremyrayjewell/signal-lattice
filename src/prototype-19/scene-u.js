import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(60203, id * 163 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const COLS = 10,
  ROWS = 6,
  CELL = 96;
// Each row gets its own fixed horizontal jitter (a brick-like offset, not a
// strict rectangular grid), and each cell fixes its own rotation, mirror,
// optional extra scale-down+rotation, and which optional extras it carries —
// all seeded once. Only stroke weight/opacity and small rotation wobble
// animate per frame.
const rowOffsets = Array.from({ length: ROWS }, (_, row) => (randomAt(71117, row) - 0.5) * CELL);
const cells = Array.from({ length: COLS * ROWS }, (_, id) => {
  const col = id % COLS,
    row = Math.floor(id / COLS);
  const baseRot = (Math.floor(r(id, 1) * 4) * Math.PI) / 2;
  const flipX = r(id, 2) < 0.5 ? -1 : 1,
    flipY = r(id, 3) < 0.5 ? -1 : 1;
  const smallScale = r(id, 4) < 0.5;
  const extraRot = r(id, 5) * TAU;
  const hasOuterArc1 = r(id, 6) < 0.5,
    hasOuterArc2 = r(id, 7) < 0.5,
    hasRing2 = r(id, 8) < 0.5;
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

// A bold stroke-only "rune" glyph: two broken-circle arcs, a ring/knob, a
// thin triangle, a curved swoosh and a few accent lines, with optional
// larger outer arcs and a second small ring. Own coordinates throughout, not
// the source's vertex/arc list.
function drawGlyph(g, mr, lr, hasOuterArc1, hasOuterArc2, hasRing2) {
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

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#f7f4ee');
  g.lineJoin = 'round';
  g.lineCap = 'square';

  cells.forEach(
    ({
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
    }) => {
      const entry = introFor(id, intro, 400);
      if (!entry.active) return;
      const ripple = (col + row) * 0.016;
      const m = at(0.05 + ripple);
      const phase = r(id, 20) * TAU;
      const selected = (0.5 + 0.5 * Math.sin(id * 1.3 - t * 0.6 + phase)) ** 6;
      const flash = m.impulse * s.impulse;
      const cx = col * CELL + CELL / 2 + rowOffsets[row] + entry.dx,
        cy = row * CELL + CELL / 2 + entry.dy;
      // Genuine continuous spin per glyph, not a subtle wobble: independent
      // speed and direction, faster with the piece's energy and with mids.
      const spinSpeed = (r(id, 21) - 0.5) * 0.7 * s.motion * (1 + 0.8 * m.slow.mid + 0.6 * flash);
      const spin = t * spinSpeed + phase * 0.2;
      const innerSpinSpeed = (r(id, 22) - 0.5) * 1.1 * s.motion * (1 + 0.6 * m.fast.high);
      const mr = CELL * 0.4 * (1 + 0.05 * m.slow.bass) * entry.scale;
      const lr = (mr / 9) * (1 + 0.35 * flash + 0.15 * selected);
      g.save();
      g.translate(cx, cy);
      g.rotate(baseRot + spin);
      g.scale(flipX, flipY);
      if (smallScale) {
        g.scale(0.75, 0.75);
        g.rotate(extraRot + t * innerSpinSpeed);
      }
      g.strokeStyle = `rgba(10,9,8,${0.82 + 0.12 * m.fast.rms + 0.1 * selected + 0.15 * flash})`;
      drawGlyph(g, mr, lr, hasOuterArc1, hasOuterArc2, hasRing2);
      g.restore();
    },
  );

  return s;
}
