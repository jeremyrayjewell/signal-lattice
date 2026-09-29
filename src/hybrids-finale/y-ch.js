// Finale hybrid of Scene Y ("Chromatic Wedges", segment 2) and Scene CH ("Arc Assemblies", Codex,
// segment 7). Y's whole convergent-perspective field (96 wedges + 280 dots, plus its own blur and
// chromatic-fringe compositing) is kept intact as a single background pass -- it is itself a
// private-buffer, whole-frame construction in the source, the same kind of monolithic content this
// project always keeps as its own pass rather than exploding into individually-orderable draws.
// CH's 45 rotating tile-sector cells are drawn as the foreground population on top, each with its
// own staggered entry.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateY } from '../prototype-23/states.js';
import { stateAt as stateCH } from '../prototype-84/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  CX0 = 576,
  CY0 = 272;
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};

// ---- Scene Y's own population (kept as one background pass) ----
const yr = (id, k = 0) => randomAt(48213, id * 151 + k);
const Y_HUES = [215, 185, 140, 355, 22, 320, 262];
const Y_GRID_COLS = 12,
  Y_GRID_ROWS = 8;
function yGridBase(id) {
  const cell = Math.floor(yr(id, 19) * Y_GRID_COLS * Y_GRID_ROWS);
  const gx = cell % Y_GRID_COLS,
    gy = Math.floor(cell / Y_GRID_COLS);
  const cellW = W / Y_GRID_COLS,
    cellH = H / Y_GRID_ROWS;
  const px = (gx + 0.5) * cellW + (yr(id, 20) - 0.5) * cellW * 0.88;
  const py = (gy + 0.5) * cellH + (yr(id, 21) - 0.5) * cellH * 0.88;
  const dist0 = Math.max(1, Math.hypot(px - CX0, py - CY0));
  const angle0 = Math.atan2(py - CY0, px - CX0);
  return { dist0, angle0 };
}
const Y_WEDGE_COUNT = 96;
const yWedges = Array.from({ length: Y_WEDGE_COUNT }, (_, k) => {
  const id = 2000 + k;
  const angle0 = yr(id, 27) * TAU;
  const dist0 = 90 + yr(id, 28) * 470;
  const angleJitter = (yr(id, 24) - 0.5) * 1.1;
  const capBig = yr(id, 51) < 0.3;
  const tipRadius = 18 + yr(id, 25) * 75;
  const baseRadius = dist0 * (0.85 + 0.3 * yr(id, 26));
  const thickness1 = 26 + yr(id, 9) * 54;
  const thickness0 = 4 + yr(id, 10) * 6;
  const capRadius = capBig ? 26 + yr(id, 52) * 46 : thickness1 * (0.5 + 0.3 * yr(id, 52));
  const hue = Y_HUES[Math.floor(yr(id, 3) * Y_HUES.length)];
  const dark = yr(id, 50) < 0.3;
  const phase = yr(id, 5) * TAU;
  const spinRate = (yr(id, 6) - 0.5) * 0.7;
  return {
    id,
    angle0,
    angleJitter,
    tipRadius,
    baseRadius: capBig ? tipRadius + (baseRadius - tipRadius) * 0.3 : baseRadius,
    thickness0,
    thickness1,
    capRadius,
    hue,
    dark,
    phase,
    spinRate,
  };
});
const Y_DOT_COUNT = 280;
const yDots = Array.from({ length: Y_DOT_COUNT }, (_, k) => {
  const id = k;
  const { dist0, angle0 } = yGridBase(id);
  const anchorDist = dist0 * Math.pow(yr(id, 70), 2.1);
  const freeform = yr(id, 61) < 0.4;
  const angleJitter = freeform ? (yr(id, 11) - 0.5) * TAU : (yr(id, 11) - 0.5) * 2.2;
  const lengthHalf = 4 + Math.pow(yr(id, 3), 2) * 32;
  const thickness = 3 + yr(id, 4) * 6.5;
  const capRadius = thickness * (0.7 + 0.5 * yr(id, 12));
  const hue = Y_HUES[Math.floor(yr(id, 5) * Y_HUES.length)];
  const phase = yr(id, 6) * TAU;
  const spinRate = (yr(id, 7) - 0.5) * 1.6;
  return {
    id,
    angle0,
    angleJitter,
    anchorDist,
    lengthHalf,
    thickness,
    capRadius,
    hue,
    phase,
    spinRate,
  };
});
function drawYField(g, t, s, at, intro) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const globalSpin = t * 0.1 * (1 + 0.5 * s.motion) + 0.15 * Math.sin(t * 0.05);
  yWedges.forEach((wd) => {
    const entry = introFor(wd.id, intro, 420);
    if (!entry.active) return;
    const m = at(0.2),
      flash = m.impulse * s.impulse;
    const ang = wd.angle0 + globalSpin + wd.angleJitter + wd.spinRate * t * 0.1 * s.motion;
    const dirx = Math.cos(ang),
      diry = Math.sin(ang);
    const nx = -diry,
      ny = dirx;
    const stretch = 1 + 0.22 * m.slow.bass + 0.28 * flash;
    const innerR = wd.tipRadius,
      outerR = wd.baseRadius * stretch;
    const ix = CX0 + dirx * innerR + entry.dx,
      iy = CY0 + diry * innerR + entry.dy;
    const ox = CX0 + dirx * outerR + entry.dx,
      oy = CY0 + diry * outerR + entry.dy;
    const hw0 = wd.thickness0 * 0.5 * entry.scale,
      hw1 = wd.thickness1 * 0.5 * entry.scale * stretch;
    g.beginPath();
    g.moveTo(ix + nx * hw0, iy + ny * hw0);
    g.lineTo(ox + nx * hw1, oy + ny * hw1);
    g.lineTo(ox - nx * hw1, oy - ny * hw1);
    g.lineTo(ix - nx * hw0, iy - ny * hw0);
    g.closePath();
    const sat = wd.dark ? 34 + 8 * m.fast.rms : 30 + 8 * m.fast.rms;
    const light = (wd.dark ? 15 : 24) + 4 * m.fast.centroid + 8 * flash;
    const alpha = Math.min(1, 0.8 + 0.1 * m.fast.high + 0.1 * flash);
    const lg = g.createLinearGradient(ix, iy, ox, oy);
    lg.addColorStop(
      0,
      `hsla(${wd.hue} ${Math.max(10, sat - 14)}% ${Math.min(78, light + 34)}% / ${alpha * 0.75})`,
    );
    lg.addColorStop(0.4, `hsla(${wd.hue} ${sat}% ${light}% / ${alpha})`);
    lg.addColorStop(1, `hsla(${wd.hue} ${sat + 6}% ${Math.max(4, light - 6)}% / ${alpha})`);
    g.fillStyle = lg;
    g.fill();
    const capR = Math.max(1, wd.capRadius * (1 + 0.16 * m.slow.bass + 0.24 * flash) * entry.scale);
    g.beginPath();
    g.arc(ox, oy, capR, 0, TAU);
    g.fillStyle = `hsla(${wd.hue} 74% 42% / .95)`;
    g.fill();
    g.beginPath();
    g.arc(ox - capR * 0.32, oy - capR * 0.36, capR * 0.24, 0, TAU);
    g.fillStyle = `hsla(${wd.hue} 40% 68% / .5)`;
    g.fill();
  });
  yDots.forEach((dot) => {
    const entry = introFor(dot.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.08),
      flash = m.impulse * s.impulse;
    const selected = (0.5 + 0.5 * Math.sin(dot.id * 1.7 - t * 0.6 + dot.phase)) ** 6;
    const orbitAng = dot.angle0 + globalSpin * 1.25;
    const ax = CX0 + Math.cos(orbitAng) * dot.anchorDist,
      ay = CY0 + Math.sin(orbitAng) * dot.anchorDist;
    const ang = orbitAng + dot.angleJitter + dot.spinRate * t * 0.15 * s.motion;
    const dirx = Math.cos(ang),
      diry = Math.sin(ang);
    const nx = -diry,
      ny = dirx;
    const stretch = 1 + 0.3 * m.slow.bass + 0.3 * flash;
    const half = dot.lengthHalf * stretch * entry.scale;
    const ix = ax - dirx * half + entry.dx,
      iy = ay - diry * half + entry.dy;
    const ox = ax + dirx * half + entry.dx,
      oy = ay + diry * half + entry.dy;
    const hw = dot.thickness * 0.5 * entry.scale;
    g.beginPath();
    g.moveTo(ix + nx * hw, iy + ny * hw);
    g.lineTo(ox + nx * hw, oy + ny * hw);
    g.lineTo(ox - nx * hw, oy - ny * hw);
    g.lineTo(ix - nx * hw, iy - ny * hw);
    g.closePath();
    const sat = 68 + 14 * m.fast.rms,
      light = 34 + 9 * m.fast.centroid + 12 * flash + 6 * selected;
    g.fillStyle = `hsla(${dot.hue} ${sat}% ${light}% / ${0.86 + 0.12 * flash})`;
    g.fill();
    const capR = Math.max(0.5, dot.capRadius * (1 + 0.14 * flash) * entry.scale);
    g.beginPath();
    g.arc(ox, oy, capR, 0, TAU);
    g.fill();
  });
}
const yLayers = new WeakMap();
function yGetBuffers(p) {
  let entry = yLayers.get(p);
  if (!entry) {
    const src = document.createElement('canvas');
    src.width = 480;
    src.height = 270;
    const tmp = document.createElement('canvas');
    tmp.width = 480;
    tmp.height = 270;
    entry = { src, tmp };
    yLayers.set(p, entry);
  }
  return entry;
}
const Y_FRINGES = [
  { color: 'rgba(255,40,40,.06)', dx: -2.2, dy: 1 },
  { color: 'rgba(40,140,255,.06)', dx: 2.4, dy: -0.7 },
];
function paintYBackground(p, g, t, s, at, intro) {
  p.background('#c4c8d0');
  const { src, tmp } = yGetBuffers(p);
  const b = src.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  drawYField(b, t, s, at, intro);
  b.restore();
  g.save();
  g.filter = 'blur(9px)';
  g.globalAlpha = 0.55;
  g.drawImage(src, -14, -14, W + 28, H + 28);
  g.restore();
  g.drawImage(src, 0, 0, W, H);
  const tc = tmp.getContext('2d');
  g.save();
  g.globalCompositeOperation = 'lighter';
  Y_FRINGES.forEach(({ color, dx, dy }) => {
    tc.setTransform(1, 0, 0, 1, 0, 0);
    tc.clearRect(0, 0, 480, 270);
    tc.drawImage(src, 0, 0);
    tc.globalCompositeOperation = 'source-atop';
    tc.fillStyle = color;
    tc.fillRect(0, 0, 480, 270);
    tc.globalCompositeOperation = 'source-over';
    g.drawImage(tmp, dx, dy, W, H);
  });
  g.restore();
}

// ---- Scene CH's own population (foreground) ----
const chR = (i, k) => randomAt(92684, i * 191 + k);
const chPalette = [
  '#111111',
  '#F1E7D0',
  '#E83B30',
  '#F5C518',
  '#1757A6',
  '#D96C2C',
  '#7A3E32',
  '#5B5148',
  '#B7A58A',
  '#6E8B8A',
  '#C6D23A',
  '#8A4F9E',
  '#E4A0A8',
  '#263C4A',
];
const chTiles = Array.from({ length: 45 }, (_, id) => ({
  id,
  x: 48 + (id % 9) * 108,
  y: 54 + Math.floor(id / 9) * 108,
  phase: chR(id, 0) * TAU,
  scale: chR(id, 1) < 0.45 ? 0.72 : 1,
  orientation: Math.floor(chR(id, 2) * 4),
  colors: Array.from(
    { length: 7 },
    (_, k) => chPalette[Math.floor(chR(id, k + 10) * chPalette.length)],
  ),
}));
const chSectors = [
  [-0.5, 0, 0.5, -Math.PI / 2, Math.PI / 2],
  [0.5, -0.5, 0.63, Math.PI / 2, Math.PI],
  [0.5, 0.5, 0.39, Math.PI, Math.PI * 1.5],
  [-0.04, 0.5, 0.18, Math.PI, TAU],
];
const chDots = [
  [0.105, 0.16, 0.125],
  [0.37, -0.37, 0.1],
  [0.37, 0.37, 0.062],
];
function chAngle(t, c) {
  const q = (t + c.phase) / (10 + chR(c.id, 3) * 7),
    cycle = Math.floor(q),
    v = Math.max(0, Math.min(1, (q - cycle - 0.8) / 0.2));
  return ((c.orientation + cycle + v * v * (3 - 2 * v)) * Math.PI) / 2;
}
function drawCHTile(g, c, t, s, m, entry) {
  g.save();
  g.translate(c.x + entry.dx, c.y + entry.dy);
  g.scale(entry.scale, entry.scale);
  g.save();
  g.beginPath();
  g.rect(-54, -54, 108, 108);
  g.clip();
  g.rotate(chAngle(t, c));
  const scale = 108 * c.scale * (1 + 0.025 * Math.sin(t * 0.63 + c.phase) + m.slow.bass * 0.035);
  g.scale(scale, scale);
  for (let k = 0; k < chSectors.length; k++) {
    const [x, y, r, a, b] = chSectors[k],
      phase = c.phase + k * 1.7;
    const radius =
      r *
      (1 +
        0.06 * Math.sin(t * 0.81 + phase) * (1 + s.motion * 0.25) +
        m.impulse * s.impulse * 0.035);
    g.fillStyle = c.colors[k];
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, radius, a, b);
    g.closePath();
    g.fill();
  }
  for (let k = 0; k < chDots.length; k++) {
    const [x, y, r] = chDots[k],
      phase = c.phase + k * 2;
    g.fillStyle = c.colors[k + 4];
    g.beginPath();
    g.arc(
      x + 0.028 * Math.sin(t * 0.97 + phase),
      y + 0.028 * Math.cos(t * 0.89 + phase),
      r * (1 + 0.1 * Math.sin(t * 0.73 + phase) + m.fast.rms * 0.1),
      0,
      TAU,
    );
    g.fill();
  }
  g.strokeStyle = '#ffffff';
  g.lineWidth = 0.013;
  for (let j = 1; j <= 9; j++) {
    if (chR(c.id, j + 30) < 0.32) continue;
    const radius =
      j * 0.048 * (1 + 0.045 * Math.sin(t * 0.91 + c.phase - j * 0.4) + m.slow.mid * 0.04);
    g.beginPath();
    g.arc(-0.5, 0, radius, -Math.PI / 2, Math.PI / 2);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = '#111111';
  g.lineWidth = 1.05 + m.fast.centroid * 0.2;
  for (let j = 0; j < 2; j++) {
    const phase = c.phase + j * 2,
      vertical = chR(c.id, j + 50) > 0.5;
    const offsets = Array.from(
      { length: 4 },
      (_, k) =>
        (chR(c.id, 60 + j * 6 + k) - 0.5) * 100 +
        12 * Math.sin(t * 0.69 + phase + k * 0.9) * (1 + s.motion * 0.3 + m.slow.mid * 0.3),
    );
    g.save();
    if (vertical) g.rotate(Math.PI / 2);
    g.beginPath();
    g.moveTo(-54, offsets[0]);
    g.bezierCurveTo(-23, offsets[1], 23, offsets[2], 54, offsets[3]);
    g.stroke();
    g.restore();
  }
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sY = stateY(elapsed),
    sCH = stateCH(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) paintYBackground(p, g, t, sY, at, intro);
  g.save();
  g.lineCap = 'butt';
  for (const c of chTiles) {
    const e = introFor(c.id + 6000, intro, 380);
    if (!e.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.17) : zero;
    drawCHTile(g, c, t, sCH, m, e);
  }
  g.restore();
  return sCH;
}
