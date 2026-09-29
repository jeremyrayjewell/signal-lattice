import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(37009, id * 251 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540;
// Own five-color warm palette (teal, cream, gold, burnt orange, crimson),
// independent of the source's exact hex values.
const HUES = [178, 42, 40, 20, 350];
const SATS = [55, 22, 68, 72, 62];
const LIGHTS = [42, 86, 54, 50, 42];
function paletteColor(idx, alpha = 1) {
  return `hsla(${HUES[idx]} ${SATS[idx]}% ${LIGHTS[idx]}% / ${alpha})`;
}

// A scattered field of bar-comb clusters (own alternating-bar-rotation
// construction, not the source's exact shearX/shearY sequence), each paired
// with either a bullseye (own concentric-ring construction) or a small
// cross accent (own square-plus construction) at its own nearby offset.
const COMB_COUNT = 88;
const combs = Array.from({ length: COMB_COUNT }, (_, k) => {
  const id = k;
  const x = -W * 0.12 + r(id, 1) * (W * 1.24),
    y = -H * 0.12 + r(id, 2) * (H * 1.24);
  const rot0 = r(id, 3) * TAU;
  const flip = r(id, 4) < 0.5 ? -1 : 1;
  const rad = 70 + r(id, 5) * 160;
  const sr = rad / 6;
  const barCount = Math.max(3, Math.round(rad / sr));
  const hueIdx = Math.floor(r(id, 6) * HUES.length);
  const shearAngle = ((8 + r(id, 7) * 12) * Math.PI) / 180;
  const spinSpeed = (r(id, 8) - 0.5) * 0.22;
  const phase = r(id, 9) * TAU;
  const isBullseye = r(id, 10) < 0.5;
  const secX = (r(id, 11) - 0.5) * rad * 1.5,
    secY = (r(id, 12) - 0.5) * rad * 1.5;
  const secRot = r(id, 13) * TAU;
  const secScale = 0.55 + r(id, 14) * 0.5;
  const ringCount = 5 + Math.floor(r(id, 15) * 3);
  return {
    id,
    x,
    y,
    rot0,
    flip,
    rad,
    sr,
    barCount,
    hueIdx,
    shearAngle,
    spinSpeed,
    phase,
    isBullseye,
    secX,
    secY,
    secRot,
    secScale,
    ringCount,
  };
});

function drawComb(g, c, t, s, m, flash, entry) {
  g.save();
  g.translate(c.x + entry.dx, c.y + entry.dy);
  g.rotate(c.rot0 + t * c.spinSpeed * (1 + 0.6 * s.motion));
  g.scale(c.flip * entry.scale, entry.scale);
  const light = LIGHTS[c.hueIdx] + 6 * Math.sin(t * 0.12 + c.phase) + 10 * flash;
  g.fillStyle = `hsla(${HUES[c.hueIdx]} ${SATS[c.hueIdx]}% ${Math.max(10, Math.min(90, light))}% / .96)`;
  const barLen = c.rad * (1 + 0.08 * m.slow.bass + 0.12 * flash);
  for (let i = 0; i < c.barCount; i++) {
    const ry = -c.rad / 2 + i * c.sr;
    g.save();
    g.translate(0, ry);
    g.rotate(i % 2 === 0 ? c.shearAngle : -c.shearAngle);
    g.fillRect(-barLen / 2, -c.sr * 0.44, barLen, c.sr * 0.82);
    g.restore();
  }
  g.restore();
}

function drawBullseye(g, c, t, s, m, flash, entry) {
  const bx = c.x + c.secX + entry.dx,
    by = c.y + c.secY + entry.dy;
  for (let ring = 0; ring < c.ringCount; ring++) {
    const baseR = c.rad * 0.5 * (1 - ring / c.ringCount);
    const pulse =
      1 + 0.1 * Math.sin(t * 0.55 + ring * 0.8 + c.phase) + 0.12 * m.slow.bass + 0.18 * flash;
    const er = Math.max(1, baseR * pulse * c.secScale * entry.scale);
    const hueIdx = Math.floor(r(c.id, 60 + ring) * HUES.length);
    g.beginPath();
    g.arc(bx, by, er, 0, TAU);
    g.fillStyle = paletteColor(hueIdx, 0.96);
    g.fill();
  }
}

function drawCross(g, c, t, s, m, flash, entry) {
  const bx = c.x + c.secX + entry.dx,
    by = c.y + c.secY + entry.dy;
  const rot = c.secRot + t * 0.18 * (1 + 0.4 * s.motion);
  const armLen = Math.max(1, c.rad * 0.46 * c.secScale * entry.scale * (1 + 0.15 * flash));
  const armW = Math.max(1, c.sr * 0.9 * c.secScale * entry.scale);
  g.save();
  g.translate(bx, by);
  g.rotate(rot);
  [0, 90, 180, 270].forEach((deg, idx) => {
    g.save();
    g.rotate((deg * Math.PI) / 180);
    g.translate(0, -(armLen / 2 + armW / 2));
    const hueIdx = Math.floor(r(c.id, 70 + idx) * HUES.length);
    if (r(c.id, 80 + idx) < 0.5) {
      g.fillStyle = paletteColor(hueIdx, 0.96);
      g.fillRect(-armW / 2, -armW / 2, armW, armW);
    } else {
      g.strokeStyle = paletteColor(hueIdx, 0.96);
      g.lineWidth = Math.max(0.6, armW * 0.14);
      g.strokeRect(-armW / 2, -armW / 2, armW, armW);
    }
    g.restore();
  });
  g.restore();
}

function drawField(g, t, s, at, intro) {
  g.save();
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 2;
  g.shadowBlur = 6;
  g.shadowColor = 'rgba(20,14,8,.4)';
  combs.forEach((c) => {
    const entry = introFor(c.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.05 + (c.x / W) * 0.12),
      flash = m.impulse * s.impulse;
    drawComb(g, c, t, s, m, flash, entry);
    if (c.isBullseye) drawBullseye(g, c, t, s, m, flash, entry);
    else drawCross(g, c, t, s, m, flash, entry);
  });
  g.restore();
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
  if (intro >= 1) p.background('#f7f3ea');

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
