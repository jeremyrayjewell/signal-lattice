// Finale hybrid of Scene BA ("Ribbon Windows", segment 3) and Scene BF ("Circle Mosaic",
// segment 3). Both are drifting-grid, per-cell buffer/cache scenes that already draw each cell
// directly onto the main canvas, so they interleave naturally as two kinds of drifting-grid cells
// in one shared, depth-sorted pool.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateBA } from '../prototype-51/states.js';
import { stateAt as stateBF } from '../prototype-56/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const ease = (q) => {
  q = Math.max(0, Math.min(1, q));
  return q * q * (3 - 2 * q);
};
const mix = (a, b, q) => a + (b - a) * q;
const vn = (seed, x) => {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return a + (b - a) * f * f * f * (f * (f * 6 - 15) + 10);
};
const nz = (seed, x) =>
  0.5 +
  0.5 *
    (0.55 * vn(seed, x) +
      0.28 * vn(seed + 1, x * 2.03 + 11.7) +
      0.14 * vn(seed + 2, x * 4.07 + 3.1));

// ---- Scene BA's own population ----
const baG = 135,
  baTS = 112,
  baIR = baG / 1.2,
  baNS = 1500,
  baCOPIES = 30;
const baCache = new Map(),
  baCv = Object.assign(document.createElement('canvas'), { width: baTS, height: baTS });
function baConf(h, e) {
  const key = h * 512 + e + 64,
    hit = baCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11555, key * 400 + k),
    sd = (k) => Math.floor(r(k) * 1e9);
  const c = {
    dark: r(0) < 0.5,
    rot: r(1) * TAU,
    spin: (r(2) < 0.5 ? -1 : 1) * (0.05 + r(3) * 0.11),
    mxr: baG / (r(4) < 0.5 ? 10 : 20),
    sx: sd(5),
    sy: sd(6),
    sr: sd(7),
    xn: r(8) * 40 + 5,
    yn: r(9) * 40 + 5,
    rn: r(10) * 40 + 5,
    vx: 0.06 + r(11) * 0.06,
    vy: -(0.05 + r(12) * 0.05),
    vr: 0.3 + r(13) * 0.25,
    scx: 0.7 + r(14) * 0.3,
    scy: 0.7 + r(15) * 0.3,
    zf: r(16),
    copies: Array.from({ length: baCOPIES }, (_, k) => ({
      a: (20 + 40 * r(20 + k * 5)) / 255,
      x: r(21 + k * 5) * 2 - 1,
      y: r(22 + k * 5) * 2 - 1,
      fw: 0.5 + r(23 + k * 5) * 1.4,
      ph: r(24 + k * 5) * TAU,
    })),
    dots: Array.from({ length: 30 }, (_, k) => ({
      x: r(180 + k * 4) * 2 - 1,
      y: r(181 + k * 4) * 2 - 1,
      vx: (r(182 + k * 4) * 2 - 1) * 0.04,
      vy: (r(183 + k * 4) * 2 - 1) * 0.04,
      ph: r(183 + k * 4) * TAU,
    })),
  };
  if (baCache.size > 6000) baCache.clear();
  baCache.set(key, c);
  return c;
}
function baTexture(c, t, m) {
  const g = baCv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = c.dark ? '#000000' : '#ffffff';
  g.fillRect(0, 0, baTS, baTS);
  g.translate(baTS / 2, baTS / 2);
  g.rotate(c.rot + c.spin * t);
  g.scale(1 / 1.2, 1 / 1.2);
  g.fillStyle = c.dark ? '#ffffff' : '#000000';
  g.beginPath();
  const grow = 1 + 0.3 * m.slow.bass,
    x0 = c.xn + t * c.vx,
    y0 = c.yn + t * c.vy,
    r0 = c.rn + t * c.vr;
  for (let j = 0; j < baNS; j++) {
    const x = (nz(c.sx, x0 + j * 0.0082) - 0.5) * 4 * baG,
      y = (nz(c.sy, y0 + j * 0.0082) - 0.5) * 4 * baG,
      d = (c.mxr * (0.1 + 0.9 * nz(c.sr, r0 + j * 0.082)) * grow) / 2;
    g.moveTo(x + d, y);
    g.arc(x, y, d, 0, TAU);
  }
  for (const q of c.dots) {
    const x = (((((q.x + t * q.vx + 1) % 2) + 2) % 2) - 1) * baG * 0.8,
      y = (((((q.y + t * q.vy + 1) % 2) + 2) % 2) - 1) * baG * 0.8,
      d = (c.mxr * (0.1 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.7 + q.ph)))) / 2;
    g.moveTo(x + d, y);
    g.arc(x, y, d, 0, TAU);
  }
  g.fill();
  return baCv;
}
function baStack(g, c, k, t, m, ph) {
  if (k <= 0.003) return;
  const tex = baTexture(c, t, m),
    z = mix(baIR / 100, baIR / 10, c.zf) * (1 + 0.6 * m.fast.high),
    br = 1 + 0.03 * Math.sin(t * 0.4 + ph) + 0.04 * m.slow.mid;
  g.save();
  g.scale(c.scx * k * br, c.scy * k * br);
  for (const q of c.copies) {
    g.globalAlpha = Math.min(1, q.a * (1 + 0.35 * m.fast.rms));
    g.drawImage(
      tex,
      -baIR / 2 + z * (q.x * 0.75 + 0.35 * Math.sin(t * q.fw + q.ph)),
      -baIR / 2 + z * (q.y * 0.75 + 0.35 * Math.cos(t * q.fw * 0.8 + q.ph)),
      baIR,
      baIR,
    );
  }
  g.restore();
  g.globalAlpha = 1;
}

// ---- Scene BF's own population ----
const bfS = 540,
  bfG = bfS / 5,
  bfCB = Math.ceil(bfG + 32);
const bfCp = ['#F75137', '#22BA8A', '#F2D15D', '#DA8648', '#560554', '#103E7C', '#E5C7A5'];
const bfCache = new Map();
function bfSubPass(r, base) {
  const v = [1, 2, 4][Math.floor(r(base) * 3)],
    sg = bfG / v;
  return {
    v,
    sg,
    cells: Array.from({ length: v * v }, (_, k) => {
      const i = k % v,
        j = Math.floor(k / v),
        x = (i - (v - 1) / 2) * sg,
        y = (j - (v - 1) / 2) * sg,
        b = base + 2 + k * 3;
      return { x, y, col: Math.floor(r(b) * 7) };
    }),
  };
}
function bfConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bfCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11567, key * 300 + k);
  const a = bfSubPass(r, 0),
    b = bfSubPass(r, 60),
    cpass = bfSubPass(r, 120);
  const dotsPer = Math.max(6, Math.round(60 / (cpass.v * cpass.v)));
  const cells = cpass.cells.map((c, k) => {
    const b0 = 180 + k * 40,
      er = cpass.sg * (0.5 + r(b0) * 0.5),
      round = r(b0 + 1) < 0.5;
    return {
      ...c,
      er,
      round,
      rot: r(b0 + 2) * TAU,
      ox: (r(b0 + 3) * 2 - 1) * (cpass.sg / 2 - er / 2),
      oy: (r(b0 + 4) * 2 - 1) * (cpass.sg / 2 - er / 2),
      mode: r(b0 + 5) < 0.5,
      tone: r(b0 + 6),
      dots: Array.from({ length: dotsPer }, (_, d) => {
        const db = b0 + 10 + d * 4;
        return {
          a: r(db) * TAU,
          rad: Math.sqrt(r(db + 1)),
          size: 1 + r(db + 2) * 3.5,
          alpha: r(db + 3) * 0.7,
          white: r(db + 3) < 0.5,
        };
      }),
    };
  });
  const c = { a, b, cpass: { ...cpass, cells } };
  if (bfCache.size > 8000) bfCache.clear();
  bfCache.set(key, c);
  return c;
}
const bfRawBuf = document.createElement('canvas');
bfRawBuf.width = bfCB;
bfRawBuf.height = bfCB;
const bfCellBuf = document.createElement('canvas');
bfCellBuf.width = bfCB;
bfCellBuf.height = bfCB;
function bfPaintCell(conf, t, m, blurPx, jitterGain) {
  const half = bfCB / 2,
    rg = bfRawBuf.getContext('2d');
  rg.setTransform(1, 0, 0, 1, 0, 0);
  rg.fillStyle = '#ffffff';
  rg.fillRect(0, 0, bfCB, bfCB);
  for (const c of conf.a.cells) {
    rg.fillStyle = bfCp[c.col];
    rg.beginPath();
    const R =
      (conf.a.sg / 2) *
      (1 +
        0.22 * Math.sin(t * 1.8 + c.x * 0.02 + c.y * 0.02) +
        0.16 * m.slow.bass +
        0.08 * m.impulse);
    rg.arc(half + c.x, half + c.y, R, 0, TAU);
    rg.fill();
  }
  const cg = bfCellBuf.getContext('2d');
  cg.setTransform(1, 0, 0, 1, 0, 0);
  cg.clearRect(0, 0, bfCB, bfCB);
  cg.save();
  cg.filter = `blur(${blurPx}px)`;
  cg.drawImage(bfRawBuf, 0, 0);
  cg.restore();
  cg.globalCompositeOperation = 'overlay';
  for (const c of conf.b.cells) {
    cg.fillStyle = bfCp[c.col];
    cg.beginPath();
    const R =
      (conf.b.sg / 2) *
      (1 +
        0.26 * Math.sin(t * 2.1 + c.x * 0.03 - c.y * 0.02 + 7) +
        0.16 * m.slow.mid +
        0.07 * m.fast.rms);
    cg.arc(half + c.x, half + c.y, R, 0, TAU);
    cg.fill();
  }
  for (const c of conf.cpass.cells) {
    const wob = conf.cpass.sg * 0.12 * (1 + 0.4 * m.fast.high);
    cg.save();
    cg.translate(
      half + c.x + c.ox + wob * Math.sin(t * 0.7 + c.x * 0.05),
      half + c.y + c.oy + wob * Math.cos(t * 0.6 + c.y * 0.05),
    );
    cg.rotate(c.rot + t * (1.1 + m.impulse * 1.4) + 0.4 * Math.sin(t * 1.3 + c.x));
    const tone = Math.round(c.tone * 255),
      er = c.er * (1 + 0.08 * m.fast.high);
    if (c.mode) {
      cg.strokeStyle = `rgb(${tone},${tone},${tone})`;
      cg.lineWidth = Math.max(0.6, er / 40);
      cg.beginPath();
      cg.roundRect(-er / 2, -er / 2, er, er, c.round ? er / 2 : 0);
      cg.stroke();
    } else {
      cg.fillStyle = `rgb(${tone},${tone},${tone})`;
      cg.beginPath();
      cg.roundRect(-er / 2, -er / 2, er, er, c.round ? er / 2 : 0);
      cg.fill();
    }
    cg.restore();
    for (const d of c.dots) {
      const ang = d.a + t * 0.6 * (d.white ? 1 : -1),
        rad = ((d.rad * conf.cpass.sg) / 2) * jitterGain * (1 + 0.15 * Math.sin(t * 1.4 + d.a * 3));
      const px = half + c.x + Math.cos(ang) * rad,
        py = half + c.y + Math.sin(ang) * rad;
      cg.globalAlpha = Math.min(
        1,
        d.alpha * (1 + 0.5 * m.fast.rms) * (0.7 + 0.3 * Math.sin(t * 2 + d.a * 5)),
      );
      cg.fillStyle = d.white ? '#ffffff' : '#000000';
      cg.beginPath();
      cg.arc(px, py, d.size, 0, TAU);
      cg.fill();
    }
  }
  cg.globalAlpha = 1;
  cg.globalCompositeOperation = 'source-over';
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sBA = stateBA(elapsed),
    sBF = stateBF(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();

  const pool = [];
  {
    const ox = -(t * 13 + 22 * Math.sin(t * 0.09) * (0.5 + 0.5 * sBA.motion)),
      oy = t * 9 + 16 * Math.sin(t * 0.07 + 1) * (0.5 + 0.5 * sBA.motion);
    const c0 = Math.floor(-ox / baG) - 1,
      c1 = Math.ceil((W - ox) / baG),
      r0 = Math.floor(-oy / baG) - 1,
      r1 = Math.ceil((H - oy) / baG);
    for (let c = c0; c <= c1; c++)
      for (let row = r0; row <= r1; row++) {
        const h = (c + 3000) * 8192 + row + 3000,
          x = c * baG + baG / 2 + ox,
          y = row * baG + baG / 2 + oy;
        const e = introFor((((c % 12) + 12) % 12) * 8 + (((row % 8) + 8) % 8), intro, 380);
        if (!e.active) continue;
        pool.push({
          kind: 'window',
          h,
          x,
          y,
          e,
          depth: (randomAt(11556, h * 4 + 900) - 0.5) * 240,
        });
      }
  }
  {
    const bfBlurPx = Math.max(
      1,
      (bfG / 6) * (1 - 0.3 * (reactive ? controls.at(t) : quiet).fast.high),
    );
    const ox = -(t * 9 + 16 * Math.sin(t * 0.11) * (0.5 + 0.5 * sBF.motion)),
      oy = t * 6 + 12 * Math.sin(t * 0.09 + 1) * (0.5 + 0.5 * sBF.motion);
    const c0 = Math.floor(-ox / bfG) - 1,
      c1 = Math.ceil((W - ox) / bfG),
      r0 = Math.floor(-oy / bfG) - 1,
      r1 = Math.ceil((H - oy) / bfG);
    for (let col = c0; col <= c1; col++)
      for (let row = r0; row <= r1; row++) {
        const h = (col + 3000) * 8192 + row + 3000;
        const e = introFor(1000 + (((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
        if (!e.active) continue;
        const x = col * bfG + bfG / 2 + ox,
          y = row * bfG + bfG / 2 + oy;
        pool.push({
          kind: 'mosaic',
          h,
          x,
          y,
          e,
          blurPx: bfBlurPx,
          depth: (randomAt(11568, h * 4 + 900) - 0.5) * 240,
        });
      }
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'window') {
      const { h, x, y, e } = item,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const P = 6 + randomAt(11556, h * 4 + 1) * 5,
        off = randomAt(11556, h * 4 + 2) * P,
        ph = randomAt(11556, h * 4 + 3) * TAU;
      const u = (t + off) / P,
        ep = Math.floor(u),
        f = u - ep,
        cur = baConf(h, ep),
        prev = baConf(h, ep - 1);
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-baG / 2, -baG / 2, baG, baG);
      }
      baStack(g, prev, 1 - ease(f / 0.16), t, m, ph);
      baStack(g, cur, ease(f / 0.3), t, m, ph);
      g.restore();
    } else {
      const { h, x, y, e, blurPx } = item,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      const P = 3 + randomAt(11568, h * 4 + 1) * 3.5,
        off = randomAt(11568, h * 4 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep,
        jitterGain = 1 + 0.3 * m.fast.high;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-bfG / 2, -bfG / 2, bfG, bfG);
      }
      g.save();
      g.beginPath();
      g.rect(-bfG / 2, -bfG / 2, bfG, bfG);
      g.clip();
      bfPaintCell(bfConf(h, ep - 1), t, m, blurPx, jitterGain);
      g.globalAlpha = 1 - ease(fr / 0.16);
      g.drawImage(bfCellBuf, -bfCB / 2, -bfCB / 2);
      bfPaintCell(bfConf(h, ep), t, m, blurPx, jitterGain);
      g.globalAlpha = ease(fr / 0.3);
      g.drawImage(bfCellBuf, -bfCB / 2, -bfCB / 2);
      g.globalAlpha = 1;
      g.restore();
      g.restore();
    }
  }
  g.restore();
  return sBF;
}
