// Hybrid of Scene BJ ("Bundle Streaks + Dither", mine, prototype-60) and
// Scene CD (Codex, prototype-80, Mondrian plaid grid) for segment 6. BJ's
// tile-pattern layer, its 100 crossfading streak bundles, its dither
// overlay, and CD's drifting plaid grid cells are merged into one array,
// tagged and depth-sorted together every frame, drawn in a single shared
// loop; the tile and dither layers set and restore their own blend/AA
// state so mixing with the rest of the pool stays correct.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-60/states.js';

const TAU = Math.PI * 2,
  DEG = Math.PI / 180,
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

// ---- BJ's own population (tile pattern + streak bundles + dither) ----
const bjS = 540,
  MR = bjS / 2,
  SR = MR / 10,
  BUNDLES = 100,
  LINES = 27;
const bjCp = ['#2BC081', '#F3D655', '#F0A057', '#F35E68', '#0498D1'];
const bjCache = new Map();
function bjConf(i, e) {
  const key = i * 512 + e + 64,
    hit = bjCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11577, key * 90 + k);
  const gray = r(0) < 0.5,
    mc = Math.floor(r(1) * 5),
    z = 1 + r(2) * (SR * 2 - 1);
  const lines = Array.from({ length: LINES }, (_, k) => {
    const b = 10 + k * 4;
    return {
      col: gray ? (r(b) < 0.5 ? 120 : 255) : r(b) < 0.6 ? mc : Math.floor(r(b + 1) * 5),
      jx: (r(b + 2) * 2 - 1) * z,
      jy: (r(b + 3) * 2 - 1) * z,
      ph: r(b + 2) * TAU,
    };
  });
  const c = {
    rot: r(500) * TAU,
    x: ((r(501) * 2 - 1) * MR) / 2,
    y: ((r(502) * 2 - 1) * MR) / 2,
    gray,
    lw: z / 20,
    lines,
  };
  if (bjCache.size > 8000) bjCache.clear();
  bjCache.set(key, c);
  return c;
}
function bjBundle(g, c, x, y, t, m, k) {
  if (k <= 0.004) return;
  g.save();
  g.translate(x, y);
  g.rotate(c.rot + t * 0.05 * (1 + 0.4 * m.fast.high));
  g.lineWidth = Math.max(0.3, c.lw * (1 + 0.3 * m.fast.centroid));
  g.globalAlpha = k;
  const reach = MR * (1 + 0.06 * m.slow.bass);
  for (let li = 0; li < LINES; li++) {
    const ln = c.lines[li],
      lx = li - (LINES - 1) / 2,
      wob = 1.4 * Math.sin(t * 1.1 + ln.ph) * (1 + 0.5 * m.fast.high);
    g.strokeStyle = c.gray ? `rgb(${ln.col},${ln.col},${ln.col})` : bjCp[ln.col];
    g.beginPath();
    g.moveTo(lx + ln.jx + wob, -reach / 2);
    g.bezierCurveTo(
      lx + ln.jx - wob,
      -reach / 4,
      lx + ln.jy + wob,
      reach / 4,
      lx + ln.jy - wob,
      reach / 2,
    );
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
}
const TS = 36,
  bjTile = document.createElement('canvas');
bjTile.width = TS;
bjTile.height = TS;
(function () {
  const g = bjTile.getContext('2d');
  g.fillStyle = '#EDEFF5';
  g.fillRect(0, 0, TS, TS);
  const cx = TS / 2,
    cy = TS / 2,
    r = TS * 0.42;
  g.save();
  g.translate(cx, cy);
  g.rotate(Math.PI / 4);
  g.fillStyle = '#DADFEE';
  g.fillRect(-r / 2, -r / 2, r, r);
  g.strokeStyle = '#FFFFFF';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-r / 2, r / 2);
  g.lineTo(-r / 2, -r / 2);
  g.lineTo(r / 2, -r / 2);
  g.stroke();
  g.strokeStyle = '#B7BEDA';
  g.beginPath();
  g.moveTo(r / 2, -r / 2);
  g.lineTo(r / 2, r / 2);
  g.lineTo(-r / 2, r / 2);
  g.stroke();
  g.restore();
})();
const DW = 192,
  DH = 108,
  bjDither = document.createElement('canvas');
bjDither.width = DW;
bjDither.height = DH;
function bjPaintDither(clock) {
  const g = bjDither.getContext('2d'),
    img = g.createImageData(DW, DH),
    d = img.data;
  for (let i = 0; i < DW * DH; i++) {
    const tone = randomAt(11578, i * 3 + clock * 777) < 0.5 ? 0 : 255,
      a = randomAt(11578, i * 3 + clock * 777 + 1) * 255;
    d[i * 4] = tone;
    d[i * 4 + 1] = tone;
    d[i * 4 + 2] = tone;
    d[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
}
function bjTileLayer(g, t, m, e) {
  g.save();
  g.translate(e.dx, e.dy);
  g.scale(e.scale, e.scale);
  g.imageSmoothingEnabled = false;
  const rate = 1 + 0.8 * m.slow.mid,
    pat = g.createPattern(bjTile, 'repeat'),
    ox = (t * 4 * rate + 8 * Math.sin(t * 0.1)) % TS,
    oy = (t * 2.6 * rate) % TS;
  g.save();
  g.translate(ox, oy);
  g.fillStyle = pat;
  g.fillRect(-ox, -oy, W + TS, H + TS);
  g.restore();
  g.imageSmoothingEnabled = true;
  g.restore();
}
function bjDitherLayer(g, t, m, e) {
  const cx = W / 2,
    cy = H / 2,
    clock = Math.floor(t * 6);
  bjPaintDither(clock);
  g.save();
  g.translate(cx + e.dx, cy + e.dy);
  g.scale(e.scale, e.scale);
  g.translate(-cx, -cy);
  g.imageSmoothingEnabled = false;
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 1 - 0.25 * m.fast.high;
  g.drawImage(bjDither, 0, 0, W, H);
  g.globalAlpha = 1;
  g.imageSmoothingEnabled = true;
  g.globalCompositeOperation = 'source-over';
  g.restore();
}

// ---- CD's own population (drifting Mondrian plaid grid) ----
const cdS = 540,
  cdG = cdS / 4;
const cdCp = ['#541388', '#D90368', '#F1E9DA', '#2E294E', '#FFD400'];
const cdCache = new Map();
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
function cdPaintCell(g, c, t, m, k) {
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
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBg = reactive ? controls.at(t) : quiet;
  const cx = W / 2,
    cy = H / 2;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.3 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / cdG) - 1,
    c1 = Math.ceil((W - ox) / cdG),
    r0 = Math.floor(-oy / cdG) - 1,
    r1 = Math.ceil((H - oy) / cdG);
  g.save();

  const pool = [];
  {
    const e = introFor(BUNDLES + 1, intro, 420);
    if (e.active) pool.push({ kind: 'tile', e, depth: (randomAt(11577, 9800) - 0.5) * 240 });
  }
  for (let i = 0; i < BUNDLES; i++) {
    const e = introFor(i, intro, 420);
    if (!e.active) continue;
    pool.push({ kind: 'bundle', i, e, depth: (randomAt(11577, i * 512 + 900) - 0.5) * 240 });
  }
  {
    const e = introFor(BUNDLES, intro, 420);
    if (e.active) pool.push({ kind: 'dither', e, depth: (randomAt(11578, 9801) - 0.5) * 240 });
  }
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * cdG + cdG / 2 + ox,
        y = row * cdG + cdG / 2 + oy;
      pool.push({ kind: 'cell', h, x, y, e, depth: (randomAt(11626, h * 4 + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'tile') {
      bjTileLayer(g, t, mBg, item.e);
    } else if (item.kind === 'bundle') {
      const { i, e } = item;
      const P = 4 + randomAt(11579, i * 7 + 1) * 4,
        off = randomAt(11579, i * 7 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const cb0 = bjConf(i, ep - 1),
        cb1 = bjConf(i, ep),
        m = reactive ? controls.at(t - 0.03 - (cb1.x / MR) * 0.16) : quiet;
      const x = cx + mix(cb0.x, cb1.x, ease(fr / 0.3)) + e.dx,
        y = cy + mix(cb0.y, cb1.y, ease(fr / 0.3)) + e.dy;
      bjBundle(g, cb0, x, y, t, m, (1 - ease(fr / 0.16)) * e.scale);
      bjBundle(g, cb1, x, y, t, m, ease(fr / 0.3) * e.scale);
    } else if (item.kind === 'dither') {
      bjDitherLayer(g, t, mBg, item.e);
    } else {
      const { h, x, y, e } = item;
      const P = 4 + randomAt(11626, h * 4 + 1) * 4,
        off = randomAt(11626, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
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
      cdPaintCell(g, cdConf(h, ep - 1), t, m, 1 - ease(fr / 0.16));
      cdPaintCell(g, cdConf(h, ep), t, m, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  }
  g.restore();
  return s;
}
