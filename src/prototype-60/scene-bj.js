import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  MR = S / 2,
  SR = MR / 10,
  BUNDLES = 100,
  LINES = 27;
const cp = ['#2BC081', '#F3D655', '#F0A057', '#F35E68', '#0498D1'];
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
// One bundle's recipe for one "epoch": a pure function of (bundle, epoch), so any frame's picture
// is reproducible from time alone. Each of the twenty-seven near-parallel streaks keeps its own
// jitter and colour so the crossfade below blends cleanly line by line.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
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
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function bundle(g, c, x, y, t, m, k) {
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
    g.strokeStyle = c.gray ? `rgb(${ln.col},${ln.col},${ln.col})` : cp[ln.col];
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
// The fine dither overlay is built at a fraction of frame resolution and scaled up with hard
// pixel edges, matching the source's very fine random-alpha grid far more cheaply than drawing
// thousands of individual cells; it flickers on a stepped, time-quantized cadence.
// Early-web "tile.gif" background: a small embossed diamond-weave tile, repeated as a pattern —
// the pale bevelled backdrop common on late-90s homepages, sitting behind everything else.
const TS = 36,
  tile = document.createElement('canvas');
tile.width = TS;
tile.height = TS;
(function () {
  const g = tile.getContext('2d');
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
  dither = document.createElement('canvas');
dither.width = DW;
dither.height = DH;
function paintDither(clock) {
  const g = dither.getContext('2d'),
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
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBg = reactive ? controls.at(t) : quiet;
  if (intro >= 1) p.background('#ffffff');
  const cx = W / 2,
    cy = H / 2;
  g.save();
  const eb = introFor(BUNDLES + 1, intro, 420);
  if (eb.active) {
    g.save();
    g.translate(eb.dx, eb.dy);
    g.scale(eb.scale, eb.scale);
    g.imageSmoothingEnabled = false;
    const rate = 1 + 0.8 * mBg.slow.mid,
      pat = g.createPattern(tile, 'repeat'),
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
  for (let i = 0; i < BUNDLES; i++) {
    const e = introFor(i, intro, 420);
    if (!e.active) continue;
    const P = 4 + randomAt(11579, i * 7 + 1) * 4,
      off = randomAt(11579, i * 7 + 2) * P;
    const u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const c0 = conf(i, ep - 1),
      c1 = conf(i, ep),
      m = reactive ? controls.at(t - 0.03 - (c1.x / MR) * 0.16) : quiet;
    const x = cx + mix(c0.x, c1.x, ease(fr / 0.3)) + e.dx,
      y = cy + mix(c0.y, c1.y, ease(fr / 0.3)) + e.dy;
    bundle(g, c0, x, y, t, m, (1 - ease(fr / 0.16)) * e.scale);
    bundle(g, c1, x, y, t, m, ease(fr / 0.3) * e.scale);
  }
  const ed = introFor(BUNDLES, intro, 420);
  if (ed.active) {
    const clock = Math.floor(t * 6),
      mBase = reactive ? controls.at(t) : quiet;
    paintDither(clock);
    g.save();
    g.translate(cx + ed.dx, cy + ed.dy);
    g.scale(ed.scale, ed.scale);
    g.translate(-cx, -cy);
    g.imageSmoothingEnabled = false;
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 1 - 0.25 * mBase.fast.high;
    g.drawImage(dither, 0, 0, W, H);
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true;
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }
  g.restore();
  return s;
}
