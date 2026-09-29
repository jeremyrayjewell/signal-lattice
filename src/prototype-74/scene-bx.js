import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540;
const cp = ['#EAC435', '#345995', '#E40066', '#03CEA4', '#FB4D3D'];
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
// A "glyph" is reimplemented as a small rosette of overlapping circles rather than an actual text
// character: the source picks codepoints from ranges (Cyrillic-adjacent, Latin Extended-D) whose
// glyphs in most fonts are rounded blob/dingbat shapes, not legible letterforms, and rendering
// real font glyphs would be font- and platform-dependent besides.
function blob(g, ts, col) {
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
const BUFCACHE = new Map();
// The whole five-layer composite (rotated oversized grids of glyph rosettes, progressively
// blurred, then posterized once at the end) is expensive, so it is built once per epoch into a
// private buffer rather than every frame -- the same architecture as the ring target in Scene BK.
function build(seed) {
  if (BUFCACHE.has(seed)) return BUFCACHE.get(seed);
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
      gw = S / mv,
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
            blob(g, ts * 1.15, cp[Math.floor(r(b + 4) * 5)]);
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
  BUFCACHE.set(seed, canvas);
  if (BUFCACHE.size > 40) BUFCACHE.clear();
  return canvas;
}
const CGX = 12,
  CGY = 7,
  PW = W / CGX,
  PH = H / CGY;
let mixed, animated;
function surface() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}
function flowingComposite(t, s, m) {
  mixed ??= surface();
  animated ??= surface();
  const mg = mixed.getContext('2d'),
    ag = animated.getContext('2d');
  const period = 9 + randomAt(11621, 1) * 4,
    ep = Math.floor(t / period),
    phase = t / period - ep;
  const u = Math.max(0, Math.min(1, (phase - 0.65) / 0.35)),
    blend = u * u * (3 - 2 * u);
  mg.globalAlpha = 1;
  mg.drawImage(build(ep), 0, 0);
  if (blend > 0) {
    mg.globalAlpha = blend;
    mg.drawImage(build(ep + 1), 0, 0);
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
    ag.drawImage(mixed, -x, -y);
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
  return animated;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    m = reactive ? controls.at(t) : quiet;
  const buf = flowingComposite(t, s, m);
  if (intro >= 1) {
    g.drawImage(buf, 0, 0);
    return s;
  }
  g.save();
  for (let cx2 = 0; cx2 < CGX; cx2++)
    for (let cy2 = 0; cy2 < CGY; cy2++) {
      const ec = introFor(cy2 * CGX + cx2, intro, 380);
      if (!ec.active) continue;
      const x0 = cx2 * PW,
        y0 = cy2 * PH,
        mx = x0 + PW / 2,
        my = y0 + PH / 2;
      g.save();
      g.translate(mx + ec.dx, my + ec.dy);
      g.scale(ec.scale, ec.scale);
      g.translate(-mx, -my);
      g.drawImage(buf, x0, y0, PW, PH, x0, y0, PW, PH);
      g.restore();
    }
  g.restore();
  return s;
}
