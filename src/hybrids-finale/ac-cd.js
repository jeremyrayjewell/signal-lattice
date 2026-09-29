// Finale hybrid of Scene AC ("Color Plaid Grid", segment 2) and Scene CD ("Mondrian Plaid Grid",
// Codex, segment 7). AC's whole fixed 45-cell field is a private half-size buffer rendered and
// composited as one unit in the source, so it is kept intact as a single background pass -- the
// same monolithic-content convention used throughout this project. CD's own drifting-grid cells
// are drawn as the foreground population on top, each with its own staggered entry.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateAC } from '../prototype-27/states.js';
import { stateAt as stateCD } from '../prototype-80/states.js';

const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
  W = 960,
  H = 540;
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};

// ---- Scene AC's own population (kept as one background pass) ----
const acr = (id, k = 0) => randomAt(28451, id * 197 + k);
const AC_PALETTE = [
  [178, 45, 32],
  [14, 62, 55],
  [42, 68, 52],
  [322, 38, 30],
  [150, 32, 78],
];
function acColor(idx, alpha = 1, lightBoost = 0, hueShift = 0) {
  const [h, s, l] = AC_PALETTE[idx];
  return `hsla(${h + hueShift} ${s}% ${Math.max(0, Math.min(100, l + lightBoost))}% / ${alpha})`;
}
const AC_COLS = 9,
  AC_ROWS = 5,
  AC_CELL = 108;
const AC_X_OFF = (W - AC_COLS * AC_CELL) / 2,
  AC_Y_OFF = (H - AC_ROWS * AC_CELL) / 2;
const AC_ROTATIONS = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
const acCells = [];
for (let row = 0; row < AC_ROWS; row++)
  for (let col = 0; col < AC_COLS; col++) {
    const id = row * AC_COLS + col;
    const rotIdx = Math.floor(acr(id, 1) * 4);
    const flip = acr(id, 2) < 0.5 ? -1 : 1;
    const blockIdx = Math.floor(acr(id, 3) * AC_PALETTE.length);
    const dotIdx = Math.floor(acr(id, 4) * AC_PALETTE.length);
    const arcIdx = Math.floor(acr(id, 5) * AC_PALETTE.length);
    const ringCount = 4 + Math.floor(acr(id, 6) * 6);
    const hasCurve = acr(id, 7) < 0.5;
    const curveWhite = acr(id, 8) < 0.5;
    const jitters = Array.from({ length: 8 }, (_, k) => acr(id, 9 + k) - 0.5);
    const phase = acr(id, 17) * TAU;
    const rippleSpeed = 0.16 + acr(id, 18) * 0.26;
    const rippleDir = acr(id, 20) < 0.5 ? 1 : -1;
    const wobblePhase2 = acr(id, 21) * TAU;
    const hueDriftPhase = acr(id, 22) * TAU;
    const selPhase = acr(id, 19) * TAU;
    const cx = AC_X_OFF + col * AC_CELL + AC_CELL / 2,
      cy = AC_Y_OFF + row * AC_CELL + AC_CELL / 2;
    acCells.push({
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
function drawACField(g, t, s, at, intro) {
  acCells.forEach((c) => {
    const entry = introFor(c.id, intro, 260);
    if (!entry.active) return;
    const m = at(0.05 + (c.cx / W) * 0.15),
      flash = m.impulse * s.impulse;
    const selected = (0.5 + 0.5 * Math.sin(c.id * 0.9 - t * 0.5 + c.selPhase)) ** 5;
    const G = AC_CELL;
    const wobble =
      (0.07 + 0.13 * s.motion + 0.14 * flash) * Math.sin(t * 0.3 + c.phase) +
      (0.03 + 0.05 * s.motion) * Math.sin(t * 0.78 + c.wobblePhase2);
    const breathe = 1 + 0.035 * Math.sin(t * 0.5 + c.phase * 1.4) + 0.05 * m.slow.bass;
    g.save();
    g.translate(c.cx + entry.dx, c.cy + entry.dy);
    g.rotate(AC_ROTATIONS[c.rotIdx] + wobble);
    g.scale(c.flip * entry.scale * 0.96 * breathe, entry.scale * 0.96 * breathe);
    const z = G / 9,
      jx = c.jitters;
    g.beginPath();
    g.moveTo(-G / 2 + jx[0] * z, -G / 4 + jx[1] * z);
    g.lineTo(-G / 2 + jx[2] * z, G / 4 - jx[3] * z);
    g.lineTo(G / 2 - jx[4] * z, G / 4 - jx[5] * z);
    g.lineTo(G / 2 - jx[6] * z, -G / 4 + jx[7] * z);
    g.closePath();
    g.fillStyle = acColor(c.blockIdx, 1, 6 * selected + 14 * flash);
    g.fill();
    const er = G / 5.2;
    const dotR = Math.max(0.5, (er / 2) * (1 + 0.18 * m.slow.bass + 0.3 * flash));
    g.beginPath();
    g.arc(G / 2 - er / 1.6, G / 2 - er / 1.6, dotR, 0, TAU);
    g.fillStyle = acColor(c.dotIdx, 1, 10 * flash);
    g.fill();
    const ag = G / c.ringCount;
    const ripplePhase =
      (((t * c.rippleSpeed * c.rippleDir * (0.4 + 0.5 * s.motion + 0.3 * m.fast.high) +
        c.phase / TAU) %
        1) +
        1) %
      1;
    const hueDrift = 10 * Math.sin(t * 0.1 + c.hueDriftPhase);
    g.strokeStyle = acColor(c.arcIdx, 0.92, 5 * m.fast.centroid + 10 * flash, hueDrift);
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
const acLayers = new WeakMap();
function acGetBuffer(p) {
  let c = acLayers.get(p);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 480;
    c.height = 270;
    acLayers.set(p, c);
  }
  return c;
}
function paintACBackground(p, g, t, s, at, intro) {
  p.background('#050505');
  const buf = acGetBuffer(p);
  const b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  drawACField(b, t, s, at, intro);
  b.restore();
  g.drawImage(buf, 0, 0, W, H);
}

// ---- Scene CD's own population (foreground) ----
const ease = (q) => {
  q = Math.max(0, Math.min(1, q));
  return q * q * (3 - 2 * q);
};
const cdCp = ['#541388', '#D90368', '#F1E9DA', '#2E294E', '#FFD400'];
const cdCache = new Map();
const cdG = 540 / 4;
function cdConf(h, e) {
  const key = h * 512 + e + 64,
    hit = cdCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11625, key * 70 + k);
  const flipX = r(0) < 0.5 ? -1 : 1,
    flipY = r(1) < 0.5 ? -1 : 1,
    v = (1 + Math.floor(r(2) * 2)) * 4,
    sg = cdG / v,
    rot = (r(3) * 2 - 1) * 20 * DEG;
  const bars = [];
  for (let k = 0; k < v; k++) {
    const b = 10 + k * 8;
    bars.push({
      vScale: 0.5 + r(b) * 0.5,
      vRot: (r(b + 1) * 2 - 1) * 4 * DEG,
      vW: r(b + 2) < 0.5 ? sg / 4 : sg / 2,
      vCol: cdCp[Math.floor(r(b + 3) * 5)],
      hScale: 0.5 + r(b + 4) * 0.5,
      hRot: (r(b + 5) * 2 - 1) * 4 * DEG,
      hW: r(b + 6) < 0.5 ? sg / 4 : sg / 2,
      hCol: cdCp[Math.floor(r(b + 7) * 5)],
      ph: r(b + 4) * TAU,
    });
  }
  const scribbles = Array.from({ length: 4 }, (_, k) => {
    const b = 200 + k * 10;
    return {
      x0: (r(b) * 2 - 1) * cdG,
      y0: (r(b + 1) * 2 - 1) * cdG,
      x1: (r(b + 2) * 2 - 1) * cdG,
      y1: (r(b + 3) * 2 - 1) * cdG,
      x2: (r(b + 4) * 2 - 1) * cdG,
      y2: (r(b + 5) * 2 - 1) * cdG,
      x3: (r(b + 6) * 2 - 1) * cdG,
      y3: (r(b + 7) * 2 - 1) * cdG,
      w: 1 + r(b + 8) * (sg / 8 - 1),
    };
  });
  const c = { flipX, flipY, v, sg, rot, bars, scribbles };
  if (cdCache.size > 8000) cdCache.clear();
  cdCache.set(key, c);
  return c;
}
function cdPaintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.save();
  g.scale(c.flipX, c.flipY);
  g.save();
  g.rotate(c.rot);
  g.shadowOffsetX = c.sg / 10;
  g.shadowOffsetY = c.sg / 10;
  g.shadowBlur = (c.sg / 2) * (1 + 0.3 * m.impulse);
  g.shadowColor = 'rgba(0,0,0,.55)';
  for (let bi = 0; bi < c.v; bi++) {
    const b = c.bars[bi],
      s = -cdG / 2 + c.sg / 2 + bi * c.sg,
      wob = 1 + 0.03 * Math.sin(t * 0.8 + b.ph) * (1 + 0.4 * m.fast.high);
    g.save();
    g.translate(s, 0);
    g.scale(b.vScale * wob, b.vScale * wob);
    g.rotate(b.vRot);
    g.fillStyle = b.vCol;
    g.fillRect(-b.vW / 2, -cdG / 2, b.vW, cdG);
    g.restore();
    g.save();
    g.translate(0, s);
    g.scale(b.hScale * wob, b.hScale * wob);
    g.rotate(b.hRot);
    g.fillStyle = b.hCol;
    g.fillRect(-cdG / 2, -b.hW / 2, cdG, b.hW);
    g.restore();
  }
  g.shadowBlur = 0;
  g.restore();
  g.strokeStyle = '#000000';
  for (const s2 of c.scribbles) {
    g.lineWidth = Math.max(0.4, s2.w * (1 + 0.3 * m.fast.centroid));
    g.beginPath();
    g.moveTo(s2.x0, s2.y0);
    g.bezierCurveTo(s2.x1, s2.y1, s2.x2, s2.y2, s2.x3, s2.y3);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sAC = stateAC(elapsed),
    sCD = stateCD(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) paintACBackground(p, g, t, sAC, at, intro);
  g.save();
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * sCD.motion)),
    oy = t * 6.3 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * sCD.motion);
  const c0 = Math.floor(-ox / cdG) - 1,
    c1 = Math.ceil((W - ox) / cdG),
    r0 = Math.floor(-oy / cdG) - 1,
    r1 = Math.ceil((H - oy) / cdG);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * cdG + cdG / 2 + ox,
        y = row * cdG + cdG / 2 + oy;
      const P = 4 + randomAt(11626, h * 4 + 1) * 4,
        off = randomAt(11626, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : zero;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-cdG / 2, -cdG / 2, cdG, cdG);
      }
      g.save();
      g.beginPath();
      g.rect(-cdG / 2, -cdG / 2, cdG, cdG);
      g.clip();
      cdPaintCell(g, cdConf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      cdPaintCell(g, cdConf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return sCD;
}
