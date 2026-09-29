import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(38217, id * 173 + k);
const cell = (a, b, c) => randomAt(59029, a * 4111 + b * 131 + c * 7919);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
// Own flat palette: six hues plus black/gray/white, echoing the source's
// mixed chromatic-and-achromatic swatch list without reusing its hex values.
const HUES = [195, 50, 28, 338, 89, 267];
function paletteColor(idx, alpha = 1) {
  if (idx < 6) return `hsla(${HUES[idx]} 90% 54% / ${alpha})`;
  if (idx === 6) return `rgba(8,8,10,${alpha})`;
  if (idx === 7) return `rgba(142,142,146,${alpha})`;
  return `rgba(248,248,250,${alpha})`;
}

// A flat grid of thick horizontal two-tone bands is the base layer (own
// row count/split logic, not the source's exact `g`/`v`/`sw` branching).
const ROWS = 16,
  ROW_H = H / ROWS;
const bands = Array.from({ length: ROWS }, (_, row) => {
  const id = row;
  const splitBase = r(id, 1) * W;
  const leftIdx = Math.floor(r(id, 2) * 9);
  let rightIdx = Math.floor(r(id, 3) * 9);
  if (rightIdx === leftIdx) rightIdx = (rightIdx + 1) % 9;
  const driftAmp = 20 + r(id, 4) * 90;
  const driftSpeed = (r(id, 5) - 0.5) * 0.5;
  const driftPhase = r(id, 6) * TAU;
  const mxx = 40 + r(id, 7) * 150;
  const v = 2 * (1 + Math.floor(r(id, 8) * 3));
  const barMode = r(id, 9) < 0.4;
  const sparse = r(id, 10) < 0.5;
  const noiseOffset = (r(id, 11) - 0.5) * 130;
  // The noise patch also wanders independently of the split point it's
  // anchored near, so the glitch activity doesn't just track the band split
  // but visibly relocates along the row on its own.
  const noiseDriftAmp = 90 + r(id, 12) * 220;
  const noiseDriftFreq = 0.025 + r(id, 13) * 0.05;
  const noiseDriftPhase = r(id, 14) * TAU;
  return {
    id,
    row,
    splitBase,
    leftIdx,
    rightIdx,
    driftAmp,
    driftSpeed,
    driftPhase,
    mxx,
    v,
    barMode,
    sparse,
    noiseOffset,
    noiseDriftAmp,
    noiseDriftFreq,
    noiseDriftPhase,
  };
});

// Soft glow blobs — an own single-radial-gradient construction standing in
// for the source's 16-40-ring concentric rounded-rect falloff.
const BLOB_COUNT = 11;
const blobs = Array.from({ length: BLOB_COUNT }, (_, k) => {
  const id = 1000 + k;
  const x = 30 + r(id, 1) * (W - 60),
    y = 30 + r(id, 2) * (H - 60);
  const cluster3 = r(id, 3) < 0.35;
  const cellSize = 34 + r(id, 4) * 82;
  const hueIdx = Math.floor(r(id, 5) * HUES.length);
  const phase = r(id, 6) * TAU;
  const pulseSpeed = 0.3 + r(id, 7) * 0.7;
  // Own slow wandering drift so the glow relocates across the canvas over
  // the clip rather than only breathing in place.
  const driftAmpX = 110 + r(id, 8) * 230,
    driftAmpY = 80 + r(id, 9) * 180;
  const driftFreqX = 0.02 + r(id, 10) * 0.045,
    driftFreqY = 0.018 + r(id, 11) * 0.04;
  const driftPhaseX = r(id, 12) * TAU,
    driftPhaseY = r(id, 13) * TAU;
  return {
    id,
    x,
    y,
    cluster3,
    cellSize,
    hueIdx,
    phase,
    pulseSpeed,
    driftAmpX,
    driftAmpY,
    driftFreqX,
    driftFreqY,
    driftPhaseX,
    driftPhaseY,
  };
});

// Dense vertical scratch-line bursts — batched into two stroked paths
// (black, white) per burst for performance, own placement/shimmer logic.
const SCRATCH_COUNT = 10;
const scratches = Array.from({ length: SCRATCH_COUNT }, (_, k) => {
  const id = 2000 + k;
  const lx = 30 + r(id, 1) * (W - 60);
  const minY = r(id, 2) * H * 0.55;
  const maxY = minY + H * 0.2 + r(id, 3) * H * 0.35;
  const lineCount = 90 + Math.floor(r(id, 4) * 5) * 55;
  const jitterX = 6 + r(id, 5) * 26;
  const phase = r(id, 6) * TAU;
  // Own slow wandering drift for the burst's whole column, so it relocates
  // across the frame rather than shimmering forever in one fixed spot.
  const driftAmpX = 90 + r(id, 7) * 250,
    driftAmpY = 30 + r(id, 8) * 90;
  const driftFreqX = 0.022 + r(id, 9) * 0.05,
    driftFreqY = 0.017 + r(id, 10) * 0.04;
  const driftPhaseX = r(id, 11) * TAU,
    driftPhaseY = r(id, 12) * TAU;
  return {
    id,
    lx,
    minY,
    maxY,
    lineCount,
    jitterX,
    phase,
    driftAmpX,
    driftAmpY,
    driftFreqX,
    driftFreqY,
    driftPhaseX,
    driftPhaseY,
  };
});

function drawField(g, t, s, at, intro) {
  bands.forEach((bd) => {
    const entry = introFor(bd.id, intro, 320);
    if (!entry.active) return;
    const m = at(0.1),
      flash = m.impulse * s.impulse;
    const y = bd.row * ROW_H;
    const splitX =
      Math.max(
        0,
        Math.min(
          W,
          bd.splitBase +
            Math.sin(t * bd.driftSpeed + bd.driftPhase) *
              bd.driftAmp *
              (0.4 + 0.7 * s.motion + 0.3 * m.slow.bass),
        ),
      ) + entry.dx;
    g.fillStyle = paletteColor(bd.leftIdx);
    g.fillRect(0, y, splitX, ROW_H);
    g.fillStyle = paletteColor(bd.rightIdx);
    g.fillRect(splitX, y, W - splitX, ROW_H);

    // Stepped (not smoothly interpolated) flicker — genuine glitch/static
    // cadence rather than a tween — sped up by treble energy.
    const flickerStep = Math.floor(t * (5 + 14 * m.fast.high + 8 * flash));
    const cx =
      splitX +
      bd.noiseOffset +
      Math.sin(t * bd.noiseDriftFreq + bd.noiseDriftPhase) * bd.noiseDriftAmp;
    const sg = ROW_H / bd.v;
    for (let sx = -bd.mxx; sx <= bd.mxx; sx += sg) {
      const cellX = cx + sx;
      if (cellX < -sg || cellX > W + sg) continue;
      const colIdx = Math.round((sx + 2000) / sg);
      if (bd.barMode) {
        if (bd.sparse && cell(bd.id, colIdx, flickerStep) < 0.45) continue;
        const idx = Math.floor(cell(bd.id, colIdx * 3 + 1, flickerStep) * 9);
        g.fillStyle = paletteColor(idx, 0.82 + 0.15 * flash);
        g.fillRect(cellX - sg / 2, y, sg + 0.6, ROW_H);
      } else {
        for (let sy = 0; sy < bd.v; sy++) {
          if (bd.sparse && cell(bd.id, colIdx * 13 + sy, flickerStep) < 0.45) continue;
          const idx = Math.floor(cell(bd.id, colIdx * 13 + sy + 1, flickerStep) * 9);
          g.fillStyle = paletteColor(idx, 0.82 + 0.15 * flash);
          g.fillRect(cellX - sg / 2, y + sy * sg, sg + 0.6, sg + 0.6);
        }
      }
    }
  });

  blobs.forEach((bl) => {
    const entry = introFor(bl.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.25),
      flash = m.impulse * s.impulse;
    const pulse = 0.75 + 0.25 * Math.sin(t * bl.pulseSpeed + bl.phase);
    const size = Math.max(
      2,
      bl.cellSize * pulse * (1 + 0.16 * m.slow.bass + 0.22 * flash) * entry.scale,
    );
    const hue = HUES[bl.hueIdx];
    const peakAlpha = 0.32 + 0.22 * m.fast.high + 0.28 * flash;
    const originX = bl.x + Math.sin(t * bl.driftFreqX + bl.driftPhaseX) * bl.driftAmpX;
    const originY = bl.y + Math.sin(t * bl.driftFreqY + bl.driftPhaseY) * bl.driftAmpY;
    const cells = bl.cluster3
      ? [-1, 0, 1].flatMap((cx) => [-1, 0, 1].map((cy) => [cx, cy]))
      : [[0, 0]];
    cells.forEach(([cxk, cyk]) => {
      const cx = originX + cxk * size * 0.9 + entry.dx,
        cy = originY + cyk * size * 0.9 + entry.dy;
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
      grad.addColorStop(0, `hsla(${hue} 88% 62% / ${peakAlpha})`);
      grad.addColorStop(0.6, `hsla(${hue} 90% 55% / ${peakAlpha * 0.5})`);
      grad.addColorStop(1, `hsla(${hue} 90% 50% / 0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, size / 2, 0, TAU);
      g.fill();
    });
  });

  scratches.forEach((sc) => {
    const entry = introFor(sc.id, intro, 280);
    if (!entry.active) return;
    const m = at(0.06),
      flash = m.impulse * s.impulse;
    const density = Math.round(
      sc.lineCount * (0.5 + 0.5 * s.detail + 0.4 * m.fast.high) * entry.scale,
    );
    const shimmerStep = Math.floor(t * (3 + 6 * m.fast.high));
    const originX = sc.lx + Math.sin(t * sc.driftFreqX + sc.driftPhaseX) * sc.driftAmpX;
    const originY = Math.sin(t * sc.driftFreqY + sc.driftPhaseY) * sc.driftAmpY;
    g.save();
    g.lineWidth = Math.max(0.5, ROW_H * 0.05 * entry.scale);
    [0, 1].forEach((white) => {
      g.beginPath();
      for (let i = 0; i < density; i++) {
        if (cell(sc.id, i, 9999) >= 0.5 !== !!white) continue;
        const jx = (cell(sc.id, i * 3 + 1, shimmerStep) - 0.5) * 2 * sc.jitterX;
        const ly = originY + sc.minY + cell(sc.id, i * 3 + 2, shimmerStep) * (sc.maxY - sc.minY);
        const ll = ROW_H * (0.3 + cell(sc.id, i * 3 + 3, shimmerStep) * 2.2);
        const lx = originX + jx + entry.dx;
        g.moveTo(lx, ly - ll / 2 + entry.dy);
        g.lineTo(lx, ly + ll / 2 + entry.dy);
      }
      g.strokeStyle = white
        ? `rgba(250,250,252,${0.35 + 0.35 * m.fast.high + 0.3 * flash})`
        : `rgba(6,6,8,${0.4 + 0.3 * m.fast.high + 0.3 * flash})`;
      g.stroke();
    });
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
  if (intro >= 1) p.background('#fafafa');

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
