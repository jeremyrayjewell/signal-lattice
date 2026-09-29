import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(52709, id * 241 + k);
const cell = (a, b, c) => randomAt(19207, a * 4111 + b * 131 + c * 7919);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;

// A genuine perspective-tunnel illusion with atmospheric depth fog and
// motion-streak trails — deliberately pushed further from a flat, evenly-lit
// tiled field (own analytic depth/placement/fog math, not the source's
// literal 3D WEBGL rotateX(45) camera or its flat vertex colors). Rings are
// placed by simulated depth (z): converging toward a horizon band near the
// top, growing and brightening toward the viewer, fading dim and
// desaturated into the fog as they recede. Each ring's own depth
// continuously cycles over time, streaking a fading comet-tail behind it,
// so the field reads as flying at speed through a glowing tunnel rather
// than sitting in a static arrangement.
const HORIZON_Y = H * 0.06,
  FLOOR_Y = H * 1.2;
const RING_COUNT = 340;
const rings = Array.from({ length: RING_COUNT }, (_, k) => {
  const id = k;
  const z0 = Math.pow(r(id, 1), 1.9);
  const xSeed = r(id, 2);
  const baseSizeSeed = r(id, 3);
  const hueIdx = Math.floor(r(id, 4) * 16);
  const holeFrac = 0.12 + r(id, 5) * 0.82;
  const squash = 0.55 + r(id, 6) * 0.45;
  const tiltPhase = r(id, 7) * TAU;
  const tiltSpeed = 0.4 + r(id, 8) * 1.3;
  const huePhase = r(id, 9) * TAU;
  const hueSpeed = (r(id, 10) - 0.5) * 20;
  const hasWisp = r(id, 11) < 0.42;
  const wispCount = 2 + Math.floor(r(id, 12) * 12);
  const driftSpeed = 0.018 + r(id, 13) * 0.05;
  const driftPhase = z0;
  const trailSpan = 0.028 + r(id, 15) * 0.045;
  return {
    id,
    xSeed,
    baseSizeSeed,
    hueIdx,
    holeFrac,
    squash,
    tiltPhase,
    tiltSpeed,
    huePhase,
    hueSpeed,
    hasWisp,
    wispCount,
    driftSpeed,
    driftPhase,
    trailSpan,
  };
});

function posAt(rg, z) {
  const y = HORIZON_Y + (FLOOR_Y - HORIZON_Y) * z;
  const xSpread = W * (0.62 + 0.7 * z);
  const x = W / 2 + (rg.xSeed - 0.5) * xSpread;
  const size = (9 + rg.baseSizeSeed * 11) * (0.4 + 1.05 * z);
  return { x, y, size };
}

// A dark, glitchy static backdrop behind the ring tunnel — reuses this
// project's established stepped-flicker glitch technique (own hash-per-cell
// clock, not a smooth tween, for a genuine TV-static/corruption cadence)
// kept low-contrast and muted so the bright ring tunnel stays the clear
// focal point.
const GLITCH_COLS = 48,
  GLITCH_ROWS = 27;
function drawGlitchBackground(g, t, s, m, flash) {
  g.fillStyle = '#07070a';
  g.fillRect(0, 0, W, H);
  const cw = W / GLITCH_COLS,
    ch = H / GLITCH_ROWS;
  const step = Math.floor(t * (2.5 + 7 * m.fast.high + 8 * flash));
  for (let row = 0; row < GLITCH_ROWS; row++) {
    const rowTorn = cell(9001, row, step) < 0.05 + 0.05 * flash;
    const rowShift = rowTorn ? (cell(9002, row, step) - 0.5) * 46 : 0;
    const rowBand = cell(9003, row, step) < 0.1;
    if (rowBand) {
      g.fillStyle = `rgba(${18 + cell(9004, row, step) * 30},${18 + cell(9004, row, step) * 30},${22 + cell(9004, row, step) * 34},${0.16 + 0.14 * flash})`;
      g.fillRect(0, row * ch, W, ch * (1 + Math.floor(cell(9005, row, step) * 2)));
    }
    for (let col = 0; col < GLITCH_COLS; col++) {
      const n = cell(9010, row * GLITCH_COLS + col, step);
      if (n < 0.86) continue;
      const bright = n > 0.988;
      const wide = 1 + Math.floor(cell(9020, row * GLITCH_COLS + col, step) * 3);
      if (bright) {
        g.fillStyle = `rgba(255,255,255,${0.22 + 0.35 * flash + 0.15 * m.fast.high})`;
      } else {
        const gray = 14 + cell(9030, row * GLITCH_COLS + col, step) * 46;
        g.fillStyle = `rgba(${gray},${gray},${gray + 6},${0.4 + 0.35 * n})`;
      }
      g.fillRect(col * cw + rowShift, row * ch, cw * wide, ch);
    }
  }
  // Fine static grain.
  const grainN = 260 + Math.floor(340 * m.fast.high);
  for (let i = 0; i < grainN; i++) {
    const gx = cell(9100, i, step) * W,
      gy = cell(9101, i, step) * H;
    const v = cell(9102, i, step);
    g.fillStyle =
      v < 0.5 ? `rgba(0,0,0,${0.3 + 0.3 * v})` : `rgba(255,255,255,${0.12 + 0.22 * (v - 0.5)})`;
    g.fillRect(gx, gy, 1.4, 1.4);
  }
}

function drawField(g, t, s, at, intro, list) {
  if (intro >= 1) {
    const ambient = at(0.02);
    drawGlitchBackground(g, t, s, ambient, ambient.impulse * s.impulse);
  }
  list.forEach((rg) => {
    const entry = introFor(rg.id, intro, 240);
    if (!entry.active) return;
    const speedMul = 1 + 0.6 * s.motion;
    const z = (((rg.driftPhase + t * rg.driftSpeed * speedMul) % 1) + 1) % 1;
    const here = posAt(rg, z);
    const m = at(0.03 + z * 0.12),
      flash = m.impulse * s.impulse;
    const tilt =
      Math.sin(t * 0.3 + rg.tiltPhase) * 0.28 +
      Math.sin(t * 0.13 * rg.tiltSpeed + rg.tiltPhase * 1.7) * 0.14;
    const squashNow = Math.max(0.15, rg.squash + 0.1 * Math.sin(t * 0.2 + rg.tiltPhase));
    const outerR = Math.max(1, here.size * entry.scale * (1 + 0.08 * m.slow.bass + 0.14 * flash));
    const hueAngle =
      (rg.hueIdx / 16) * 360 +
      rg.huePhase * 20 +
      t * rg.hueSpeed * (1 + 0.6 * s.motion + 0.3 * m.fast.high);
    const px = here.x + entry.dx,
      py = here.y + entry.dy;

    // Atmospheric depth fog: distant rings desaturate, dim and fade toward
    // the horizon instead of staying uniformly bright/saturated regardless
    // of depth.
    const fogSat = 42 + 52 * z,
      fogLight = 22 + 34 * z,
      fogAlpha = Math.min(1, 0.3 + 0.75 * z);

    // A fading comet-tail streak from just behind the ring's current depth,
    // so its approach reads as a motion streak rather than a static dot.
    const trailZ = Math.max(0, z - rg.trailSpan * (0.6 + 0.8 * s.motion));
    if (trailZ < z) {
      const back = posAt(rg, trailZ);
      const bx = back.x + entry.dx,
        by = back.y + entry.dy;
      const dx = px - bx,
        dy = py - by,
        len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len,
        ny = dx / len;
      const backR = Math.max(0.3, back.size * entry.scale * 0.5);
      const frontR = outerR * 0.62;
      g.beginPath();
      g.moveTo(bx + nx * backR * 0.15, by + ny * backR * 0.15);
      g.lineTo(px + nx * frontR, py + ny * frontR);
      g.lineTo(px - nx * frontR, py - ny * frontR);
      g.lineTo(bx - nx * backR * 0.15, by - ny * backR * 0.15);
      g.closePath();
      const trailGrad = g.createLinearGradient(bx, by, px, py);
      trailGrad.addColorStop(0, `hsla(${hueAngle} ${fogSat}% ${fogLight}% / 0)`);
      trailGrad.addColorStop(
        1,
        `hsla(${hueAngle} ${fogSat}% ${Math.min(85, fogLight + 18)}% / ${fogAlpha * 0.55})`,
      );
      g.fillStyle = trailGrad;
      g.fill();
    }

    g.save();
    g.translate(px, py);
    g.rotate(tilt);
    g.scale(1, squashNow);
    const grad = g.createRadialGradient(
      -outerR * 0.32,
      -outerR * 0.36,
      outerR * 0.05,
      0,
      0,
      outerR,
    );
    grad.addColorStop(
      0,
      `hsla(${hueAngle} ${Math.min(95, fogSat + 10)}% ${Math.min(90, fogLight + 30)}% / ${fogAlpha})`,
    );
    grad.addColorStop(0.68, `hsla(${hueAngle} ${fogSat}% ${fogLight + 8}% / ${fogAlpha})`);
    grad.addColorStop(
      1,
      `hsla(${hueAngle} ${Math.max(15, fogSat - 6)}% ${Math.max(6, fogLight - 14)}% / ${fogAlpha})`,
    );
    g.beginPath();
    g.arc(0, 0, outerR, 0, TAU);
    g.fillStyle = grad;
    g.fill();
    const holeR = Math.max(0, outerR * rg.holeFrac * (1 - 0.16 * m.slow.bass - 0.22 * flash));
    if (holeR > 0.3) {
      g.beginPath();
      g.arc(0, 0, holeR, 0, TAU);
      g.fillStyle = '#030303';
      g.fill();
    }
    g.restore();

    if (rg.hasWisp) {
      const wispScale = 8 + 22 * z;
      const flickerStep = Math.floor(t * (1.1 + 2.2 * m.fast.high));
      g.save();
      g.translate(px, py);
      g.beginPath();
      for (let i = 0; i < rg.wispCount; i++) {
        const sx = (cell(rg.id, i, flickerStep) - 0.5) * wispScale * 1.6;
        const sy = -(wispScale * 1.1 + cell(rg.id, i * 3 + 1, flickerStep) * wispScale * 2.4);
        const ex = (cell(rg.id, i * 3 + 2, flickerStep) - 0.5) * wispScale * 1.6;
        const ey = wispScale * 1.1 + cell(rg.id, i * 3 + 3, flickerStep) * wispScale * 2.4;
        const c1x = (cell(rg.id, i * 3 + 4, flickerStep) - 0.5) * wispScale * 0.7,
          c1y = sy * 0.5;
        const c2x = (cell(rg.id, i * 3 + 5, flickerStep) - 0.5) * wispScale * 0.7,
          c2y = ey * 0.5;
        g.moveTo(sx, sy);
        g.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
      }
      g.strokeStyle = `rgba(255,255,255,${(0.1 + 0.14 * m.fast.high + 0.2 * flash) * fogAlpha})`;
      g.lineWidth = Math.max(0.4, 0.4 + 0.6 * z);
      g.stroke();
      g.restore();
    }
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
  if (intro >= 1) p.background('#050508');

  const buf = getBuffer(p);
  const b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  // Rings must draw far-to-near for correct depth overlap.
  const sorted = [...rings].sort((a, b2) => {
    const za = (((a.driftPhase + t * a.driftSpeed * (1 + 0.6 * s.motion)) % 1) + 1) % 1;
    const zb = (((b2.driftPhase + t * b2.driftSpeed * (1 + 0.6 * s.motion)) % 1) + 1) % 1;
    return za - zb;
  });
  drawField(b, t, s, at, intro, sorted);
  b.restore();
  g.drawImage(buf, 0, 0, W, H);

  return s;
}
