import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 260,
  PW = W + 2 * M,
  PH = H + 2 * M,
  PASS = 190;
const cp = ['#FDE197', '#3DC0CD', '#FC002D', '#F2BC08', '#021738', '#E5BB95', '#E70216'];
const rgb = cp.map((h) => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
});
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
const cache = new Map();
// A stateless per-item recipe generator shared by both passes; `pass` keeps the two draws independent,
// echoing the source calling drawPat() twice with entirely fresh randomness each time.
function conf(pass, i, e) {
  const key = (pass * 4000 + i) * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11561, key * 40 + k);
  const mr = S / 8 + r(0) * (S / 6 - S / 8),
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
  if (cache.size > 10000) cache.clear();
  cache.set(key, c);
  return c;
}
const Fr = (pass, i, k) => randomAt(11562, (pass * 4000 + i) * 31 + k);
function field(pass) {
  return Array.from({ length: PASS }, (_, i) => ({
    x: Fr(pass, i, 0) * PW,
    y: Fr(pass, i, 1) * PH,
    k: 0.55 + Fr(pass, i, 2) * 0.7,
    life: 5 + Fr(pass, i, 3) * 5,
    off: Fr(pass, i, 4),
    ph: Fr(pass, i, 5) * TAU,
  }));
}
const fields = [field(0), field(1)];
function drawItem(g, c, f, t, m, ph, k, jitterGain) {
  if (k <= 0.004) return;
  g.save();
  g.translate(f.x, f.y);
  const bw = c.bw * k,
    bh = c.bh * k;
  g.globalAlpha = (0.2 + 0.75 * c.balpha) * k;
  g.fillStyle = cp[c.bcol];
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
    if (!c.perLine) g.strokeStyle = cp[c.lineCol];
    for (let j = 0; j < 14; j++) {
      // Each of the fourteen copies jitters its two endpoints independently, on its own axis and
      // rate, so the side reads as a hand-scribbled tangle rather than a single wobbling outline.
      const jt = c.sides[side][j],
        za = jt.za * jitterGain,
        zb = jt.zb * jitterGain,
        a = edges[side][0],
        b = edges[side][1];
      const wa = za * Math.sin(t * jt.ra + ph + side * 1.7 + jt.pa),
        wb = zb * Math.sin(t * jt.ra * 1.15 + ph + side * 2.1 + jt.pb);
      const perp = side < 2 ? [0, 1] : [1, 0];
      if (c.perLine) g.strokeStyle = cp[jt.col];
      g.beginPath();
      g.moveTo(a[0] + perp[0] * wa, a[1] + perp[1] * wa);
      g.lineTo(b[0] + perp[0] * wb, b[1] + perp[1] * wb);
      g.stroke();
    }
  }
  g.restore();
}
// Renders this scene's full, settled composite (both passes, blurred underlay + crisp overlay,
// then posterized) into a private offscreen buffer, from time alone.
const buf = document.createElement('canvas');
buf.width = W;
buf.height = H;
const under = document.createElement('canvas');
under.width = W;
under.height = H;
function paintComposite(t, m, blurPx, levels, jitterGain) {
  const ug = under.getContext('2d');
  ug.setTransform(1, 0, 0, 1, 0, 0);
  ug.clearRect(0, 0, W, H);
  for (let i = 0; i < PASS; i++) {
    const f = fields[0][i],
      lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 7 * f.k * t, PW) + 10 * Math.sin(t * 0.3 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 9 * f.k * t, PH) + 10 * Math.cos(t * 0.26 + f.ph);
    const u = (t + f.off * f.life) / f.life,
      ep = Math.floor(u),
      fr = u - ep;
    drawItem(ug, conf(0, i, ep - 1), { x, y }, t, m, f.ph, 1 - ease(fr / 0.16), jitterGain);
    drawItem(ug, conf(0, i, ep), { x, y }, t, m, f.ph, ease(fr / 0.3), jitterGain);
  }
  const bg = buf.getContext('2d');
  bg.setTransform(1, 0, 0, 1, 0, 0);
  bg.clearRect(0, 0, W, H);
  bg.fillStyle = '#ffffff';
  bg.fillRect(0, 0, W, H);
  bg.save();
  bg.filter = `blur(${blurPx}px)`;
  bg.drawImage(under, 0, 0);
  bg.restore();
  for (let i = 0; i < PASS; i++) {
    const f = fields[1][i],
      lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x - 8 * f.k * t, PW) + 10 * Math.sin(t * 0.33 * (0.6 + f.k) + f.ph + 2),
      y = lap(f.y + 10 * f.k * t, PH) + 10 * Math.cos(t * 0.29 + f.ph + 2);
    const u = (t + f.off * f.life) / f.life,
      ep = Math.floor(u),
      fr = u - ep;
    drawItem(bg, conf(1, i, ep - 1), { x, y }, t, m, f.ph, 1 - ease(fr / 0.16), jitterGain);
    drawItem(bg, conf(1, i, ep), { x, y }, t, m, f.ph, ease(fr / 0.3), jitterGain);
  }
  // Whole-frame colour quantization (the source's closing POSTERIZE filter): reduce each
  // channel to `levels` evenly spaced steps.
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
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  const blurPx = Math.max(2, (S / 60) * (1 - 0.3 * m.fast.high)),
    levels = Math.max(3, Math.round(5 + m.impulse * s.impulse * 3)),
    jitterGain = 1 + 0.5 * m.fast.high;
  paintComposite(t, m, blurPx, levels, jitterGain);
  if (intro >= 1) {
    p.background('#ffffff');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(buf, 0, 0);
    g.restore();
    return s;
  }
  // Block and frame are each their own flying stamp: a tight patch of the finished composite
  // (both passes, already blurred and posterized) is cut around just that shape and carried in
  // from an offset, undersized start — a small footprint per element, so the reveal stays gradual
  // even though a block's frame can sit well away from it (as in the source).
  // A busy scene fills its clip footprints fast, so introduction progress is squared before the
  // per-element stagger, keeping the outgoing scene visible longer while still landing exactly
  // on the finished picture at completion.
  const pace = intro * intro;
  g.save();
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < PASS; i++) {
      const f = fields[pass][i],
        lap = (v, P) => (((v % P) + P) % P) - M;
      const dx = pass ? -8 * f.k * t : 7 * f.k * t,
        dy = pass ? 10 * f.k * t : -9 * f.k * t;
      const x = lap(f.x + dx, PW) + 10 * Math.sin(t * 0.3 * (0.6 + f.k) + f.ph + pass * 2),
        y = lap(f.y + dy, PH) + 10 * Math.cos(t * 0.27 + f.ph + pass * 2);
      const u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        cur = conf(pass, i, ep);
      const stamp = (cx, cy, r, id) => {
        if (cx < -r - 20 || cx > W + r + 20 || cy < -r - 20 || cy > H + r + 20) return;
        const e = introFor(id, pace, 420);
        if (!e.active) return;
        g.save();
        g.translate(cx + e.dx, cy + e.dy);
        g.scale(e.scale, e.scale);
        g.translate(-cx, -cy);
        g.beginPath();
        g.rect(cx - r, cy - r, r * 2, r * 2);
        g.clip();
        g.drawImage(buf, 0, 0);
        g.restore();
      };
      stamp(x, y, Math.max(cur.bw, cur.bh) / 2 + 12, pass * 4000 + i);
      stamp(x + cur.ox, y + cur.oy, cur.mr / 2 + 18, pass * 4000 + i + PASS);
    }
  g.restore();
  return s;
}
