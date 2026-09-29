// Hybrid of Scene BD ("Posterized Frames", mine) and Scene BX ("Blossom
// Static", mine) for segment 6. Both sources deliver their whole visual as
// a single pre-built, whole-frame buffer that is then revealed through
// discrete clipped patches -- BD stamps a block+frame pair per field item,
// BX tiles a fixed 12x7 grid over its mesh-warped composite. Those two
// patch populations (BD's 760 stamps, BX's 84 tiles) are merged into one
// array, tagged and depth-sorted together every frame, drawn in a single
// shared loop, each cut from its own source's buffer.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-54/states.js';

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

// ---- BD's own population (field items -> block+frame stamp pairs) ----
const bS = 540,
  bM = 260,
  bPW = W + 2 * bM,
  bPH = H + 2 * bM,
  PASS = 190;
const bdCp = ['#FDE197', '#3DC0CD', '#FC002D', '#F2BC08', '#021738', '#E5BB95', '#E70216'];
const bdCache = new Map();
function bdConf(pass, i, e) {
  const key = (pass * 4000 + i) * 512 + e + 64,
    hit = bdCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11561, key * 40 + k);
  const mr = bS / 8 + r(0) * (bS / 6 - bS / 8),
    bw = mr / (1 + Math.floor(r(1) * 2)),
    bh = mr / (1 + Math.floor(r(2) * 2));
  const perLine = r(3) < 0.5,
    lineCol = Math.floor(r(4) * 7);
  const c = {
    mr,
    bw,
    bh,
    bcol: Math.floor(r(5) * 7),
    balpha: r(6),
    ox: (r(7) * 2 - 1) * mr * 2,
    oy: (r(8) * 2 - 1) * mr * 2,
    perLine,
    lineCol,
    sides: Array.from({ length: 4 }, (_, side) =>
      Array.from({ length: 14 }, (_, j) => ({
        za: r(20 + side * 40 + j * 4) * (mr / 3.2),
        zb: r(21 + side * 40 + j * 4) * (mr / 3.2),
        pa: r(22 + side * 40 + j * 4) * TAU,
        pb: r(23 + side * 40 + j * 4) * TAU,
        ra: 0.6 + r(24 + side * 40 + j * 4) * 1.8,
        col: Math.floor(r(25 + side * 40 + j * 4) * 7),
      })),
    ),
  };
  if (bdCache.size > 10000) bdCache.clear();
  bdCache.set(key, c);
  return c;
}
const bdFr = (pass, i, k) => randomAt(11562, (pass * 4000 + i) * 31 + k);
function bdField(pass) {
  return Array.from({ length: PASS }, (_, i) => ({
    x: bdFr(pass, i, 0) * bPW,
    y: bdFr(pass, i, 1) * bPH,
    k: 0.55 + bdFr(pass, i, 2) * 0.7,
    life: 5 + bdFr(pass, i, 3) * 5,
    off: bdFr(pass, i, 4),
    ph: bdFr(pass, i, 5) * TAU,
  }));
}
const bdFields = [bdField(0), bdField(1)];
function bdDrawItem(g, c, x, y, t, m, ph, k, jitterGain) {
  if (k <= 0.004) return;
  g.save();
  g.translate(x, y);
  const bw = c.bw * k,
    bh = c.bh * k;
  g.globalAlpha = (0.2 + 0.75 * c.balpha) * k;
  g.fillStyle = bdCp[c.bcol];
  g.fillRect(-bw / 2, -bh / 2, bw, bh);
  g.globalAlpha = 1;
  const fx = c.ox * k,
    fy = c.oy * k,
    mr = c.mr * k,
    hw = mr / 2;
  g.translate(fx, fy);
  g.lineWidth = Math.max(0.7, mr / 70) * (1 + 0.4 * m.fast.centroid);
  const edges = [
    [
      [-hw, -hw],
      [hw, -hw],
    ],
    [
      [-hw, hw],
      [hw, hw],
    ],
    [
      [-hw, -hw],
      [-hw, hw],
    ],
    [
      [hw, -hw],
      [hw, hw],
    ],
  ];
  for (let side = 0; side < 4; side++) {
    if (!c.perLine) g.strokeStyle = bdCp[c.lineCol];
    for (let j = 0; j < 14; j++) {
      const jt = c.sides[side][j],
        za = jt.za * jitterGain,
        zb = jt.zb * jitterGain,
        a = edges[side][0],
        b = edges[side][1];
      const wa = za * Math.sin(t * jt.ra + ph + side * 1.7 + jt.pa),
        wb = zb * Math.sin(t * jt.ra * 1.15 + ph + side * 2.1 + jt.pb);
      const perp = side < 2 ? [0, 1] : [1, 0];
      if (c.perLine) g.strokeStyle = bdCp[jt.col];
      g.beginPath();
      g.moveTo(a[0] + perp[0] * wa, a[1] + perp[1] * wa);
      g.lineTo(b[0] + perp[0] * wb, b[1] + perp[1] * wb);
      g.stroke();
    }
  }
  g.restore();
}
const bdBuf = document.createElement('canvas');
bdBuf.width = W;
bdBuf.height = H;
const bdUnder = document.createElement('canvas');
bdUnder.width = W;
bdUnder.height = H;
function bdPaintComposite(t, m, blurPx, levels, jitterGain) {
  const ug = bdUnder.getContext('2d');
  ug.setTransform(1, 0, 0, 1, 0, 0);
  ug.clearRect(0, 0, W, H);
  for (let i = 0; i < PASS; i++) {
    const f = bdFields[0][i],
      lap = (v, P) => (((v % P) + P) % P) - bM;
    const x = lap(f.x + 7 * f.k * t, bPW) + 10 * Math.sin(t * 0.3 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 9 * f.k * t, bPH) + 10 * Math.cos(t * 0.26 + f.ph);
    const u = (t + f.off * f.life) / f.life,
      ep = Math.floor(u),
      fr = u - ep;
    bdDrawItem(ug, bdConf(0, i, ep - 1), x, y, t, m, f.ph, 1 - ease(fr / 0.16), jitterGain);
    bdDrawItem(ug, bdConf(0, i, ep), x, y, t, m, f.ph, ease(fr / 0.3), jitterGain);
  }
  const bg = bdBuf.getContext('2d');
  bg.setTransform(1, 0, 0, 1, 0, 0);
  bg.clearRect(0, 0, W, H);
  bg.fillStyle = '#ffffff';
  bg.fillRect(0, 0, W, H);
  bg.save();
  bg.filter = `blur(${blurPx}px)`;
  bg.drawImage(bdUnder, 0, 0);
  bg.restore();
  for (let i = 0; i < PASS; i++) {
    const f = bdFields[1][i],
      lap = (v, P) => (((v % P) + P) % P) - bM;
    const x = lap(f.x - 8 * f.k * t, bPW) + 10 * Math.sin(t * 0.33 * (0.6 + f.k) + f.ph + 2),
      y = lap(f.y + 10 * f.k * t, bPH) + 10 * Math.cos(t * 0.29 + f.ph + 2);
    const u = (t + f.off * f.life) / f.life,
      ep = Math.floor(u),
      fr = u - ep;
    bdDrawItem(bg, bdConf(1, i, ep - 1), x, y, t, m, f.ph, 1 - ease(fr / 0.16), jitterGain);
    bdDrawItem(bg, bdConf(1, i, ep), x, y, t, m, f.ph, ease(fr / 0.3), jitterGain);
  }
  const id = bg.getImageData(0, 0, W, H),
    d = id.data,
    step = 255 / (levels - 1);
  for (let p = 0; p < d.length; p += 4) {
    d[p] = Math.round(Math.round(d[p] / step) * step);
    d[p + 1] = Math.round(Math.round(d[p + 1] / step) * step);
    d[p + 2] = Math.round(Math.round(d[p + 2] / step) * step);
  }
  bg.putImageData(id, 0, 0);
}

// ---- BX's own population (12x7 = 84 mesh-warped composite tiles) ----
const xCp = ['#EAC435', '#345995', '#E40066', '#03CEA4', '#FB4D3D'];
function bxBlob(g, ts, col) {
  g.fillStyle = col;
  const petals = 4 + Math.floor(randomAt(11619, Math.round(ts * 97)) * 3);
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * TAU,
      r = ts * 0.28;
    g.beginPath();
    g.arc(Math.cos(a) * r, Math.sin(a) * r, ts * 0.32, 0, TAU);
    g.fill();
  }
  g.beginPath();
  g.arc(0, 0, ts * 0.24, 0, TAU);
  g.fill();
}
const bxBufCache = new Map();
function bxBuild(seed) {
  if (bxBufCache.has(seed)) return bxBufCache.get(seed);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000000';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'screen';
  for (let layer = 0; layer < 5; layer++) {
    const r = (k) => randomAt(11620, seed * 90 + layer * 13 + k);
    const mv = r(0) < 0.5 ? 4 : 6,
      gw = bS / mv,
      px = r(1) * W,
      py = r(2) * H,
      rot = r(3) * TAU;
    g.save();
    g.translate(px, py);
    g.rotate(rot);
    const span = Math.hypot(W, H);
    for (let x = -span; x <= span; x += gw)
      for (let y = -span; y <= span; y += gw) {
        const v = r(Math.round(x * 7 + y * 13 + 400)) < 0.5 ? 1 : 2,
          sg = gw / v;
        for (let sx = -gw / 2 + sg / 2; sx <= gw / 2; sx += sg)
          for (let sy = -gw / 2 + sg / 2; sy <= gw / 2; sy += sg) {
            const b = Math.round((x * 3 + y * 5 + sx * 11 + sy * 17) * 0.37);
            const ts = sg * (0.26 + r(b) * 0.28),
              ox = (r(b + 1) * 2 - 1) * (sg / 2 - ts / 2),
              oy = (r(b + 2) * 2 - 1) * (sg / 2 - ts / 2);
            g.save();
            g.translate(x + sx + ox, y + sy + oy);
            g.rotate(r(b + 3) * TAU);
            g.scale(1.2, 1);
            bxBlob(g, ts * 1.15, xCp[Math.floor(r(b + 4) * 5)]);
            g.restore();
            if (r(b + 5) < 0.5) {
              g.strokeStyle = 'rgba(255,255,255,.85)';
              g.lineWidth = Math.max(0.3, (r(b + 6) * sg) / 20);
              g.beginPath();
              for (let j = 0; j < 3; j++) {
                const bx = x + sx,
                  by = y + sy,
                  c2 = (k) => ((r(b + 7 + j * 4 + k) * 2 - 1) * sg) / 2;
                g.moveTo(bx - sg / 2, by + c2(0));
                g.bezierCurveTo(
                  bx - sg / 4,
                  by + c2(1),
                  bx + sg / 4,
                  by + c2(2),
                  bx + sg / 2,
                  by + c2(3),
                );
              }
              g.stroke();
            }
          }
      }
    g.restore();
    const tmp = document.createElement('canvas');
    tmp.width = W;
    tmp.height = H;
    const tg = tmp.getContext('2d');
    tg.filter = 'blur(1.5px)';
    tg.drawImage(canvas, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, W, H);
    g.drawImage(tmp, 0, 0);
    g.globalCompositeOperation = 'screen';
  }
  g.globalCompositeOperation = 'source-over';
  const id = g.getImageData(0, 0, W, H),
    d = id.data,
    levels = 6,
    step = 255 / (levels - 1);
  for (let p = 0; p < d.length; p += 4) {
    d[p] = Math.round(Math.round(d[p] / step) * step);
    d[p + 1] = Math.round(Math.round(d[p + 1] / step) * step);
    d[p + 2] = Math.round(Math.round(d[p + 2] / step) * step);
  }
  g.putImageData(id, 0, 0);
  bxBufCache.set(seed, canvas);
  if (bxBufCache.size > 40) bxBufCache.clear();
  return canvas;
}
const CGX = 12,
  CGY = 7,
  tPW = W / CGX,
  tPH = H / CGY;
let bxMixed, bxAnimated;
function bxSurface() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}
function bxFlowingComposite(t, s, m) {
  bxMixed ??= bxSurface();
  bxAnimated ??= bxSurface();
  const mg = bxMixed.getContext('2d'),
    ag = bxAnimated.getContext('2d');
  const period = 9 + randomAt(11621, 1) * 4,
    ep = Math.floor(t / period),
    phase = t / period - ep;
  const u = Math.max(0, Math.min(1, (phase - 0.65) / 0.35)),
    blend = u * u * (3 - 2 * u);
  mg.globalAlpha = 1;
  mg.drawImage(bxBuild(ep), 0, 0);
  if (blend > 0) {
    mg.globalAlpha = blend;
    mg.drawImage(bxBuild(ep + 1), 0, 0);
    mg.globalAlpha = 1;
  }
  ag.fillStyle = '#000000';
  ag.fillRect(0, 0, W, H);
  ag.save();
  ag.translate(W / 2, H / 2);
  ag.rotate(0.025 * Math.sin(t * 0.39));
  const zoom = 1.2 + 0.035 * Math.sin(t * 0.61) + m.slow.bass * 0.045;
  ag.scale(zoom, zoom);
  ag.translate(-W / 2, -H / 2);
  const amount = 1 + s.motion * 0.25 + m.impulse * s.impulse * 0.35;
  const point = (x, y) => [
    x + amount * (16 * Math.sin(y * 0.016 + t * 0.83) + 9 * Math.sin(x * 0.014 - t * 0.63)),
    y +
      amount * (14 * Math.sin(x * 0.015 + t * 0.71) + 8 * Math.cos(y * 0.018 - t * 0.89)) +
      m.slow.mid * 6 * Math.sin(x * 0.012),
  ];
  function triangle(v, a, b, c, d, e, f, x, y, w, h) {
    ag.save();
    const cx = (v[0][0] + v[1][0] + v[2][0]) / 3,
      cy = (v[0][1] + v[1][1] + v[2][1]) / 3;
    ag.beginPath();
    v.forEach((q, i) => {
      const px = cx + (q[0] - cx) * 1.012,
        py = cy + (q[1] - cy) * 1.012;
      i ? ag.lineTo(px, py) : ag.moveTo(px, py);
    });
    ag.closePath();
    ag.clip();
    ag.transform(a, b, c, d, e, f);
    ag.drawImage(bxMixed, -x, -y);
    ag.restore();
  }
  for (let y = 0; y < H; y += 60)
    for (let x = 0; x < W; x += 80) {
      const w = 80,
        h = 60,
        A = point(x, y),
        B = point(x + w, y),
        C = point(x, y + h),
        D = point(x + w, y + h);
      triangle(
        [A, B, C],
        (B[0] - A[0]) / w,
        (B[1] - A[1]) / w,
        (C[0] - A[0]) / h,
        (C[1] - A[1]) / h,
        A[0],
        A[1],
        x,
        y,
        w,
        h,
      );
      triangle(
        [B, D, C],
        (D[0] - C[0]) / w,
        (D[1] - C[1]) / w,
        (D[0] - B[0]) / h,
        (D[1] - B[1]) / h,
        B[0] + C[0] - D[0],
        B[1] + C[1] - D[1],
        x,
        y,
        w,
        h,
      );
    }
  ag.restore();
  return bxAnimated;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  const blurPx = Math.max(2, (bS / 60) * (1 - 0.3 * m.fast.high)),
    levels = Math.max(3, Math.round(5 + m.impulse * s.impulse * 3)),
    jitterGain = 1 + 0.5 * m.fast.high;
  bdPaintComposite(t, m, blurPx, levels, jitterGain);
  const bxBuf = bxFlowingComposite(t, s, m);
  if (intro >= 1) p.background('#ffffff');
  g.save();

  const pool = [];
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < PASS; i++) {
      const f = bdFields[pass][i],
        lap = (v, P) => (((v % P) + P) % P) - bM;
      const dx = pass ? -8 * f.k * t : 7 * f.k * t,
        dy = pass ? 10 * f.k * t : -9 * f.k * t;
      const x = lap(f.x + dx, bPW) + 10 * Math.sin(t * 0.3 * (0.6 + f.k) + f.ph + pass * 2),
        y = lap(f.y + dy, bPH) + 10 * Math.cos(t * 0.27 + f.ph + pass * 2);
      const u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        cur = bdConf(pass, i, ep);
      const id0 = pass * 4000 + i,
        id1 = pass * 4000 + i + PASS;
      const e0 = introFor(id0, intro, 420);
      if (e0.active && !(x < -1e3 || x > W + 1e3 || y < -1e3 || y > H + 1e3))
        pool.push({
          kind: 'bd',
          cx: x,
          cy: y,
          r: Math.max(cur.bw, cur.bh) / 2 + 12,
          e: e0,
          depth: (bdFr(pass, i, 900) - 0.5) * 240,
        });
      const fx = x + cur.ox,
        fy = y + cur.oy,
        e1 = introFor(id1, intro, 420);
      if (e1.active && !(fx < -1e3 || fx > W + 1e3 || fy < -1e3 || fy > H + 1e3))
        pool.push({
          kind: 'bd',
          cx: fx,
          cy: fy,
          r: cur.mr / 2 + 18,
          e: e1,
          depth: (bdFr(pass, i, 901) - 0.5) * 240,
        });
    }
  for (let cx2 = 0; cx2 < CGX; cx2++)
    for (let cy2 = 0; cy2 < CGY; cy2++) {
      const id = cy2 * CGX + cx2,
        e = introFor(id, intro, 380);
      if (!e.active) continue;
      pool.push({ kind: 'bx', cx2, cy2, e, depth: (randomAt(11621, id * 7 + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'bd') {
      const { cx, cy, r, e } = item;
      g.save();
      g.translate(cx + e.dx, cy + e.dy);
      g.scale(e.scale, e.scale);
      g.translate(-cx, -cy);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      g.beginPath();
      g.rect(cx - r, cy - r, r * 2, r * 2);
      g.clip();
      g.drawImage(bdBuf, 0, 0);
      g.restore();
    } else {
      const { cx2, cy2, e } = item,
        x0 = cx2 * tPW,
        y0 = cy2 * tPH,
        mx = x0 + tPW / 2,
        my = y0 + tPH / 2;
      g.save();
      g.translate(mx + e.dx, my + e.dy);
      g.scale(e.scale, e.scale);
      g.translate(-mx, -my);
      if (intro < 1) {
        g.fillStyle = '#000000';
        g.fillRect(x0, y0, tPW, tPH);
      }
      g.drawImage(bxBuf, x0, y0, tPW, tPH, x0, y0, tPW, tPH);
      g.restore();
    }
  }
  g.restore();
  return s;
}
