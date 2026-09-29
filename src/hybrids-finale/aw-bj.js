// Finale hybrid of Scene AW ("Glow Stamp Groups", segment 2) and Scene BJ ("Bundle Streaks +
// Dither", segment 4). AW's 18 glow-stamp groups, AW's 11 spanning threads, and BJ's 100 streak
// bundles are merged into one array, tagged and depth-sorted together every frame, drawn in a
// single shared loop. AW's textured ground and BJ's tile-pattern layer are both kept as background
// passes; BJ's dither overlay is kept as a final whole-frame pass on top, matching how each source
// uses these whole-frame textures.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateAW } from '../prototype-47/states.js';
import { stateAt as stateBJ } from '../prototype-60/states.js';

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

// ---- Scene AW's own population ----
const awR = (id, k) => randomAt(50247, id * 173 + k);
const awGroups = Array.from({ length: 18 }, (_, id) => ({
  id,
  x: 80 + (id % 6) * 160,
  y: 90 + Math.floor(id / 6) * 180,
  phase: awR(id, 0) * TAU,
  angle: (Math.floor(awR(id, 1) * 8) * Math.PI) / 4,
  count: 4 + Math.floor(awR(id, 2) * 7),
}));
let awStamps, awGround, awGroundPattern;
function awTexturedGround(g, t, s, m) {
  if (!awGround) {
    awGround = document.createElement('canvas');
    awGround.width = 960;
    awGround.height = 540;
    const ctx = awGround.getContext('2d'),
      pixels = ctx.createImageData(960, 540);
    for (let y = 0; y < 540; y++)
      for (let x = 0; x < 960; x++) {
        const noise = awR(y * 960 + x, 900);
        const coarse = awR(Math.floor(y / 3) * 320 + Math.floor(x / 3), 904);
        const weave =
          (x % 6 === 0 ? 12 : x % 6 === 1 ? -7 : 0) + (y % 6 === 0 ? 9 : y % 6 === 1 ? -9 : 0);
        const tone = Math.max(0, Math.round(14 + noise * 24 + coarse * 20 + weave));
        const i = (y * 960 + x) * 4;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = tone;
        pixels.data[i + 3] = 255;
      }
    ctx.putImageData(pixels, 0, 0);
    for (let i = 0; i < 1800; i++) {
      const x = awR(i, 901) * 960,
        y = awR(i, 902) * 540;
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.38)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 4 + awR(i, 903) * 18, y + 1.2);
      ctx.stroke();
    }
  }
  if (!awGroundPattern) awGroundPattern = g.createPattern(awGround, 'repeat');
  const dx = t * 18 + 12 * Math.sin(t * 0.71) + m.slow.bass * 9;
  const dy = t * 11 + 9 * Math.sin(t * 0.53) + m.impulse * s.impulse * 3;
  const shearX = 0.025 * Math.sin(t * 0.43) * (1 + s.motion * 0.3);
  const shearY = 0.018 * Math.cos(t * 0.37) + m.slow.mid * 0.008;
  awGroundPattern.setTransform(new DOMMatrix([1, shearY, shearX, 1, dx, dy]));
  g.save();
  g.fillStyle = awGroundPattern;
  g.fillRect(0, 0, 960, 540);
  g.restore();
}
function awGlowStamps() {
  if (awStamps) return awStamps;
  awStamps = Array.from({ length: 6 }, (_, id) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 160;
    const g = canvas.getContext('2d'),
      width = 2 + id * 1.8;
    g.lineCap = 'round';
    g.strokeStyle = '#ffffff';
    g.lineWidth = width;
    g.shadowColor = 'rgba(255,255,255,.9)';
    g.shadowBlur = 3.5;
    g.beginPath();
    g.moveTo(20, 20);
    g.lineTo(20, 140);
    g.stroke();
    return canvas;
  });
  return awStamps;
}
function drawAWGroup(g, c, t, s, m, entry) {
  g.save();
  g.translate(
    c.x + entry.dx + 8 * Math.sin(t * 0.47 + c.phase),
    c.y + entry.dy + 7 * Math.cos(t * 0.53 + c.phase),
  );
  g.scale(entry.scale, entry.scale);
  g.save();
  g.rotate(
    c.angle +
      0.17 * Math.sin(t * 0.58 + c.phase) * (1 + s.motion) +
      m.slow.mid * 0.15 * Math.sin(c.phase),
  );
  const spread = 10 + awR(c.id, 3) * 6 + 3 * Math.sin(t * 0.67 + c.phase) + m.slow.bass * 3;
  for (let j = 0; j < c.count; j++) {
    const ph = c.phase + j * 0.7;
    const width = awR(c.id, j + 10),
      index = Math.floor(width * 6);
    const length = 77 + 22 * Math.sin(t * 0.79 + ph) + m.impulse * s.impulse * 8 * Math.sin(j);
    const x = (j - (c.count - 1) / 2) * spread,
      y = 5 * Math.sin(t * 0.91 + ph);
    g.globalAlpha =
      0.38 + 0.4 * awR(c.id, j + 30) + 0.14 * Math.sin(t * 1.07 + ph) + m.fast.rms * 0.08;
    g.drawImage(awGlowStamps()[index], x - 14, y - length * 0.66, 28, length * 1.32);
  }
  g.restore();
  g.save();
  g.rotate(0.075 * Math.sin(t * 0.63 + c.phase) + m.slow.mid * 0.04);
  for (let k = 0; k < 4; k++) {
    if (awR(c.id, k + 40) < 0.34) continue;
    const size = 62 + 6 * Math.sin(t * 0.57 + c.phase + k),
      ph = c.phase + k * 1.3;
    const x = (k % 2 ? 1 : -1) * 38 + 4 * Math.sin(t * 0.81 + ph),
      y = (k < 2 ? -1 : 1) * 39 + 4 * Math.cos(t * 0.73 + ph);
    const radius = awR(c.id, k + 50) > 0.5 ? size * (0.27 + 0.06 * Math.sin(t * 0.49 + ph)) : 0;
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1.25 + 0.2 * m.fast.centroid;
    g.beginPath();
    g.roundRect(x - size / 2, y - size / 2, size, size, radius);
    g.stroke();
  }
  g.restore();
  g.restore();
}
function drawAWThread(g, j, t, entry) {
  g.save();
  g.translate(entry.dx, entry.dy);
  g.globalAlpha = entry.scale * 0.85;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 1;
  const x1 = awR(j, 70) * 960 + 18 * Math.sin(t * 0.31 + j),
    y1 = awR(j, 71) * 540 + 16 * Math.cos(t * 0.37 + j);
  const x2 = awR(j, 72) * 960 + 22 * Math.sin(t * 0.29 + j * 2),
    y2 = awR(j, 73) * 540 + 17 * Math.cos(t * 0.41 + j);
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
  g.restore();
}

// ---- Scene BJ's own population ----
const bjCp = ['#2BC081', '#F3D655', '#F0A057', '#F35E68', '#0498D1'];
const bjMR = 540 / 2,
  bjSR = bjMR / 10;
const bjCache = new Map();
function bjConf(i, e) {
  const key = i * 512 + e + 64,
    hit = bjCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11577, key * 90 + k);
  const gray = r(0) < 0.5,
    mc = Math.floor(r(1) * 5),
    z = 1 + r(2) * (bjSR * 2 - 1);
  const lines = Array.from({ length: 27 }, (_, k) => {
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
    x: ((r(501) * 2 - 1) * bjMR) / 2,
    y: ((r(502) * 2 - 1) * bjMR) / 2,
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
  const reach = bjMR * (1 + 0.06 * m.slow.bass);
  for (let li = 0; li < 27; li++) {
    const ln = c.lines[li],
      lx = li - 13,
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
const bjTS = 36,
  bjTile = document.createElement('canvas');
bjTile.width = bjTS;
bjTile.height = bjTS;
(function () {
  const g = bjTile.getContext('2d');
  g.fillStyle = '#EDEFF5';
  g.fillRect(0, 0, bjTS, bjTS);
  const cx = bjTS / 2,
    cy = bjTS / 2,
    r = bjTS * 0.42;
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
const bjDW = 192,
  bjDH = 108,
  bjDither = document.createElement('canvas');
bjDither.width = bjDW;
bjDither.height = bjDH;
function bjPaintDither(clock) {
  const g = bjDither.getContext('2d'),
    img = g.createImageData(bjDW, bjDH),
    d = img.data;
  for (let i = 0; i < bjDW * bjDH; i++) {
    const tone = randomAt(11578, i * 3 + clock * 777) < 0.5 ? 0 : 255,
      a = randomAt(11578, i * 3 + clock * 777 + 1) * 255;
    d[i * 4] = tone;
    d[i * 4 + 1] = tone;
    d[i * 4 + 2] = tone;
    d[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sAW = stateAW(elapsed),
    sBJ = stateBJ(elapsed),
    g = p.drawingContext;
  const mBg = reactive ? controls.at(t) : quiet;
  const cx = W / 2,
    cy = H / 2;
  if (intro >= 1) awTexturedGround(g, t, sAW, mBg);
  g.save();
  g.lineCap = 'round';

  const eb = introFor(101, intro, 420);
  if (eb.active) {
    g.save();
    g.translate(eb.dx, eb.dy);
    g.scale(eb.scale, eb.scale);
    g.imageSmoothingEnabled = false;
    const rate = 1 + 0.8 * mBg.slow.mid,
      pat = g.createPattern(bjTile, 'repeat'),
      ox = (t * 4 * rate + 8 * Math.sin(t * 0.1)) % bjTS,
      oy = (t * 2.6 * rate) % bjTS;
    g.save();
    g.translate(ox, oy);
    g.fillStyle = pat;
    g.fillRect(-ox, -oy, W + bjTS, H + bjTS);
    g.restore();
    g.imageSmoothingEnabled = true;
    g.restore();
  }

  const pool = [];
  for (let j = 0; j < 11; j++) {
    const entry = introFor(j + 500, intro, 350);
    if (!entry.active) continue;
    pool.push({ kind: 'thread', j, entry, depth: (awR(j, 900) - 0.5) * 240 });
  }
  awGroups.forEach((c) => {
    const entry = introFor(c.id, intro, 360);
    if (!entry.active) return;
    pool.push({ kind: 'group', c, entry, depth: (awR(c.id, 901) - 0.5) * 240 });
  });
  for (let i = 0; i < 100; i++) {
    const e = introFor(i + 2000, intro, 420);
    if (!e.active) continue;
    pool.push({ kind: 'bundle', i, e, depth: (randomAt(11577, i * 512 + 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'thread') drawAWThread(g, item.j, t, item.entry);
    else if (item.kind === 'group') {
      const m = reactive ? controls.at(t - 0.025 - (item.c.x / 960) * 0.2) : quiet;
      drawAWGroup(g, item.c, t, sAW, m, item.entry);
    } else {
      const P = 4 + randomAt(11579, item.i * 7 + 1) * 4,
        off = randomAt(11579, item.i * 7 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const c0 = bjConf(item.i, ep - 1),
        c1 = bjConf(item.i, ep),
        m = reactive ? controls.at(t - 0.03 - (c1.x / bjMR) * 0.16) : quiet;
      const x = cx + mix(c0.x, c1.x, ease(fr / 0.3)) + item.e.dx,
        y = cy + mix(c0.y, c1.y, ease(fr / 0.3)) + item.e.dy;
      bjBundle(g, c0, x, y, t, m, (1 - ease(fr / 0.16)) * item.e.scale);
      bjBundle(g, c1, x, y, t, m, ease(fr / 0.3) * item.e.scale);
    }
  }

  const ed = introFor(2100, intro, 420);
  if (ed.active) {
    const clock = Math.floor(t * 6);
    bjPaintDither(clock);
    g.save();
    g.translate(cx + ed.dx, cy + ed.dy);
    g.scale(ed.scale, ed.scale);
    g.translate(-cx, -cy);
    g.imageSmoothingEnabled = false;
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 1 - 0.25 * mBg.fast.high;
    g.drawImage(bjDither, 0, 0, W, H);
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }
  g.restore();
  return sBJ;
}
