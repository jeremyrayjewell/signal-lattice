// Finale hybrid of Scene AK ("Bar-Comb Clusters", segment 2) and Scene BV ("Diamond
// Kaleidoscope", segment 4). AK's whole field of 88 bar-comb clusters is a private half-size
// buffer rendered and composited as one unit in the source, kept intact as a single background
// pass -- the same monolithic-content convention used throughout this project. BV's own rotating
// grid cells are drawn as the foreground population on top, each with its own staggered entry.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateAK } from '../prototype-35/states.js';
import { stateAt as stateBV } from '../prototype-72/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};

// ---- Scene AK's own population (kept as one background pass) ----
const akr = (id, k = 0) => randomAt(37009, id * 251 + k);
const AK_HUES = [178, 42, 40, 20, 350],
  AK_SATS = [55, 22, 68, 72, 62],
  AK_LIGHTS = [42, 86, 54, 50, 42];
function akPaletteColor(idx, alpha = 1) {
  return `hsla(${AK_HUES[idx]} ${AK_SATS[idx]}% ${AK_LIGHTS[idx]}% / ${alpha})`;
}
const AK_COMB_COUNT = 88;
const akCombs = Array.from({ length: AK_COMB_COUNT }, (_, k) => {
  const id = k;
  const x = -W * 0.12 + akr(id, 1) * (W * 1.24),
    y = -H * 0.12 + akr(id, 2) * (H * 1.24);
  const rot0 = akr(id, 3) * TAU;
  const flip = akr(id, 4) < 0.5 ? -1 : 1;
  const rad = 70 + akr(id, 5) * 160;
  const sr = rad / 6;
  const barCount = Math.max(3, Math.round(rad / sr));
  const hueIdx = Math.floor(akr(id, 6) * AK_HUES.length);
  const shearAngle = ((8 + akr(id, 7) * 12) * Math.PI) / 180;
  const spinSpeed = (akr(id, 8) - 0.5) * 0.22;
  const phase = akr(id, 9) * TAU;
  const isBullseye = akr(id, 10) < 0.5;
  const secX = (akr(id, 11) - 0.5) * rad * 1.5,
    secY = (akr(id, 12) - 0.5) * rad * 1.5;
  const secRot = akr(id, 13) * TAU;
  const secScale = 0.55 + akr(id, 14) * 0.5;
  const ringCount = 5 + Math.floor(akr(id, 15) * 3);
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
function akDrawComb(g, c, t, s, m, flash, entry) {
  g.save();
  g.translate(c.x + entry.dx, c.y + entry.dy);
  g.rotate(c.rot0 + t * c.spinSpeed * (1 + 0.6 * s.motion));
  g.scale(c.flip * entry.scale, entry.scale);
  const light = AK_LIGHTS[c.hueIdx] + 6 * Math.sin(t * 0.12 + c.phase) + 10 * flash;
  g.fillStyle = `hsla(${AK_HUES[c.hueIdx]} ${AK_SATS[c.hueIdx]}% ${Math.max(10, Math.min(90, light))}% / .96)`;
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
function akDrawBullseye(g, c, t, s, m, flash, entry) {
  const bx = c.x + c.secX + entry.dx,
    by = c.y + c.secY + entry.dy;
  for (let ring = 0; ring < c.ringCount; ring++) {
    const baseR = c.rad * 0.5 * (1 - ring / c.ringCount);
    const pulse =
      1 + 0.1 * Math.sin(t * 0.55 + ring * 0.8 + c.phase) + 0.12 * m.slow.bass + 0.18 * flash;
    const er = Math.max(1, baseR * pulse * c.secScale * entry.scale);
    const hueIdx = Math.floor(akr(c.id, 60 + ring) * AK_HUES.length);
    g.beginPath();
    g.arc(bx, by, er, 0, TAU);
    g.fillStyle = akPaletteColor(hueIdx, 0.96);
    g.fill();
  }
}
function akDrawCross(g, c, t, s, m, flash, entry) {
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
    const hueIdx = Math.floor(akr(c.id, 70 + idx) * AK_HUES.length);
    if (akr(c.id, 80 + idx) < 0.5) {
      g.fillStyle = akPaletteColor(hueIdx, 0.96);
      g.fillRect(-armW / 2, -armW / 2, armW, armW);
    } else {
      g.strokeStyle = akPaletteColor(hueIdx, 0.96);
      g.lineWidth = Math.max(0.6, armW * 0.14);
      g.strokeRect(-armW / 2, -armW / 2, armW, armW);
    }
    g.restore();
  });
  g.restore();
}
function akDrawField(g, t, s, at, intro) {
  g.save();
  g.shadowOffsetX = 0;
  g.shadowOffsetY = 2;
  g.shadowBlur = 6;
  g.shadowColor = 'rgba(20,14,8,.4)';
  akCombs.forEach((c) => {
    const entry = introFor(c.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.05 + (c.x / W) * 0.12),
      flash = m.impulse * s.impulse;
    akDrawComb(g, c, t, s, m, flash, entry);
    if (c.isBullseye) akDrawBullseye(g, c, t, s, m, flash, entry);
    else akDrawCross(g, c, t, s, m, flash, entry);
  });
  g.restore();
}
const akLayers = new WeakMap();
function akGetBuffer(p) {
  let c = akLayers.get(p);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 480;
    c.height = 270;
    akLayers.set(p, c);
  }
  return c;
}
function paintAKBackground(p, g, t, s, at, intro) {
  p.background('#f7f3ea');
  const buf = akGetBuffer(p);
  const b = buf.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  akDrawField(b, t, s, at, intro);
  b.restore();
  g.drawImage(buf, 0, 0, W, H);
}

// ---- Scene BV's own population (foreground) ----
const bvCp = ['#0AD2FF', '#2962FF', '#9500FF', '#FF0059', '#FF8C00', '#B4E600', '#0FFFDB'];
const bvCache = new Map();
const bvG = 540 / 10;
function bvConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bvCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11617, key * 70 + k);
  const bgOn = r(0) < 0.5,
    bgCol = bvCp[Math.floor(r(1) * 7)],
    bgRot = r(2) < 0.5 ? r(3) * TAU : 0;
  const rot = r(4) < 0.5 ? (Math.floor(r(5) * 4) * Math.PI) / 2 : r(6) * TAU;
  const sw = Math.floor(r(7) * 3);
  let c = { bgOn, bgCol, bgRot, rot, sw };
  if (sw === 0) {
    const v = (r(10) < 0.5 ? 1 : 3) * 4,
      sg = bvG / v,
      tris = [];
    for (let k = 0; k < v; k++) {
      const b = 20 + k * 3;
      tris.push({ flip: r(b) < 0.5 ? -1 : 1, col: bvCp[Math.floor(r(b + 1) * 7)] });
    }
    c = { ...c, v, sg, tris };
  } else if (sw === 1) {
    c = {
      ...c,
      ringCol: bvCp[Math.floor(r(20) * 7)],
      innerCol: bvCp[Math.floor(r(21) * 7)],
      er: bvG / 8 + r(22) * (bvG - bvG / 8),
      ly0: ((r(23) * 2 - 1) * bvG) / 2,
      ly1: ((r(24) * 2 - 1) * bvG) / 2,
      lineCol: bvCp[Math.floor(r(25) * 7)],
    };
  } else {
    c = {
      ...c,
      quadCol: bvCp[Math.floor(r(30) * 7)],
      qa: ((r(31) * 2 - 1) * bvG) / 2,
      qb: ((r(32) * 2 - 1) * bvG) / 2,
      qc: ((r(33) * 2 - 1) * bvG) / 2,
      qd: ((r(34) * 2 - 1) * bvG) / 2,
      arcLCol: bvCp[Math.floor(r(35) * 7)],
      arcLEnd: r(36) < 0.5 ? TAU : Math.PI / 2,
      arcRCol: bvCp[Math.floor(r(37) * 7)],
      arcREnd: r(38) < 0.5 ? Math.PI : 1.5 * Math.PI,
    };
  }
  if (bvCache.size > 8000) bvCache.clear();
  bvCache.set(key, c);
  return c;
}
function bvPaintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  if (c.bgOn) {
    g.save();
    g.rotate(c.bgRot);
    g.fillStyle = c.bgCol;
    g.globalAlpha = 0.7 * k;
    g.fillRect(-bvG / 2, -bvG / 2, bvG, bvG);
    g.restore();
  }
  g.globalAlpha = k;
  g.save();
  g.rotate(c.rot + 0.06 * Math.sin(t * 0.6 + ph) * (1 + 0.5 * m.fast.high));
  if (c.sw === 0) {
    for (let ti = 0; ti < c.v; ti++) {
      const tx = -bvG / 2 + c.sg / 2 + ti * c.sg,
        tri = c.tris[ti];
      g.save();
      g.translate(tx, 0);
      g.scale(1, tri.flip);
      g.fillStyle = tri.col;
      g.beginPath();
      g.moveTo(-c.sg / 2, 0);
      g.lineTo(c.sg / 2, 0);
      g.lineTo(c.sg / 2, -bvG / 2);
      g.closePath();
      g.fill();
      g.restore();
    }
  } else if (c.sw === 1) {
    const lra = bvG / 10;
    g.strokeStyle = c.ringCol;
    g.lineWidth = lra * (1 + 0.2 * m.fast.centroid);
    g.beginPath();
    g.arc(0, 0, bvG / 1.5 / 2, 0, TAU);
    g.stroke();
    const er = c.er * (1 + 0.05 * Math.sin(t * 0.8 + ph) + 0.06 * m.slow.bass);
    g.fillStyle = c.innerCol;
    g.beginPath();
    g.arc(0, 0, er / 2, 0, TAU);
    g.fill();
    g.strokeStyle = c.lineCol;
    g.lineWidth = lra / 3;
    g.beginPath();
    g.moveTo(-bvG / 2 + lra / 2, c.ly0);
    g.lineTo(bvG / 2 - lra / 2, c.ly1);
    g.stroke();
  } else {
    const lrb = bvG / 20;
    g.strokeStyle = c.quadCol;
    g.lineWidth = lrb / 2;
    g.beginPath();
    g.moveTo(c.qa, -bvG / 2 + lrb);
    g.lineTo(-bvG / 2 + lrb, c.qb);
    g.lineTo(c.qc, bvG / 2 - lrb);
    g.lineTo(bvG / 2 - lrb, c.qd);
    g.closePath();
    g.stroke();
    g.lineWidth = lrb * 2;
    g.strokeStyle = c.arcLCol;
    g.beginPath();
    g.arc(-bvG / 2, 0, (bvG - lrb * 2) / 2, Math.PI * 1.5, Math.PI * 1.5 + c.arcLEnd);
    g.stroke();
    g.strokeStyle = c.arcRCol;
    g.beginPath();
    g.arc(bvG / 2, 0, (bvG - lrb * 2) / 2, Math.PI * 0.5, Math.PI * 0.5 + c.arcREnd);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}
const bvEase = (q) => {
  q = Math.max(0, Math.min(1, q));
  return q * q * (3 - 2 * q);
};

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sAK = stateAK(elapsed),
    sBV = stateBV(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  const mBase = reactive ? controls.at(t) : zero;
  if (intro >= 1) paintAKBackground(p, g, t, sAK, at, intro);
  const theta = Math.PI / 4 + t * 0.012 * (1 + 0.4 * mBase.slow.mid);
  const cA = Math.abs(Math.cos(theta)),
    sA = Math.abs(Math.sin(theta));
  const Lx = (W / 2) * cA + (H / 2) * sA,
    Ly = (W / 2) * sA + (H / 2) * cA;
  const c0 = Math.floor(-Lx / bvG) - 1,
    c1 = Math.ceil(Lx / bvG) + 1,
    r0 = Math.floor(-Ly / bvG) - 1,
    r1 = Math.ceil(Ly / bvG) + 1;
  g.save();
  g.translate(W / 2, H / 2);
  g.rotate(theta);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 14) + 14) % 14) * 8 + (((row % 8) + 8) % 8), intro, 360);
      if (!e.active) continue;
      const x = col * bvG + bvG / 2,
        y = row * bvG + bvG / 2;
      const P = 4 + randomAt(11618, h * 4 + 1) * 4,
        off = randomAt(11618, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const wx = x * Math.cos(theta) - y * Math.sin(theta) + W / 2,
        wy = x * Math.sin(theta) + y * Math.cos(theta) + H / 2;
      const m = reactive ? controls.at(t - 0.03 - (wx / W) * 0.16) : zero;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-bvG / 2, -bvG / 2, bvG, bvG);
      }
      g.save();
      g.beginPath();
      g.rect(-bvG / 2, -bvG / 2, bvG, bvG);
      g.clip();
      bvPaintCell(g, bvConf(h, ep - 1), t, m, off, 1 - bvEase(fr / 0.16));
      bvPaintCell(g, bvConf(h, ep), t, m, off, bvEase(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return sBV;
}
