import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 200,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 32;
const cp = ['#7FA3DC', '#D65BC9', '#D67BAC', '#786090', '#7454A3'];
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
const pick = (r, b) =>
  r(b) < 0.5 ? (r(b + 1) < 0.5 ? '#000000' : '#ffffff') : cp[Math.floor(r(b + 2) * cp.length)];

// One cluster's recipe for one "epoch": a pure function of (cluster, epoch), so any frame's
// picture is reproducible from time alone. Four layers, each the source's own relationship kept
// exactly: nested drop-shadowed squares (some centred, some jittered, in black/white/palette);
// a small dot-grid of filled or outlined circles in one colour; five bezier streaks in independent
// colours; and a fifty-fifty chance of one very long thin bar crossing the whole frame.
const cache = new Map();
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11651, key * 1300 + k);
  const rad = S / 8 + r(0) * (S / 3 - S / 8),
    v = (1 + Math.floor(r(1) * 10)) * 10,
    rg = rad / v;
  const squares = [];
  for (let rr = rad, n = 0; rr >= 0; rr -= rg, n++) {
    const b = 20 + n * 6,
      centered = r(b) < 0.5;
    const jx = centered ? 0 : (r(b + 1) * 2 - 1) * (rad / 2 - rr / 2),
      jy = centered ? 0 : (r(b + 2) * 2 - 1) * (rad / 2 - rr / 2);
    squares.push({ rr, jx, jy, col: pick(r, b + 3) });
  }
  const eg = rad / 10,
    gx = (r(1000) * 2 - 1) * rad,
    gy = (r(1001) * 2 - 1) * rad,
    ec = pick(r, 1002);
  const dots = [];
  for (let ex = -rad / 2, ci = 0; ex <= rad / 2; ex += eg, ci++)
    for (let ey = -rad / 2, cj = 0; ey <= rad / 2; ey += eg, cj++) {
      const b = 1100 + (ci * 40 + cj) * 6;
      if (r(b) >= 0.5) continue;
      dots.push({ ex, ey, er: r(b + 1) < 0.5 ? eg / 2 : eg, filled: r(b + 2) < 0.5 });
    }
  const streakRot = r(2000) * TAU;
  const streaks = Array.from({ length: 5 }, (_, k) => {
    const b = 2010 + k * 20;
    return {
      x1: (r(b) * 2 - 1) * rad * 2,
      x2: (r(b + 1) * 2 - 1) * rad * 2,
      x3: (r(b + 2) * 2 - 1) * rad * 2,
      x4: (r(b + 3) * 2 - 1) * rad * 2,
      col: pick(r, b + 4),
      w: r(b + 7) * (rad / 40),
    };
  });
  const hasBar = r(3000) < 0.4,
    barRot = ((r(3001) * 2 - 1) * 45 * Math.PI) / 180,
    barVert = r(3002) < 0.5,
    barSr = 1 + r(3003) * (rad / 8 - 1),
    barCol = r(3004) < 0.5 ? '#000000' : '#ffffff';
  const c = {
    rad,
    squares,
    eg,
    gx,
    gy,
    ec,
    dots,
    streakRot,
    streaks,
    hasBar,
    barRot,
    barVert,
    barSr,
    barCol,
  };
  if (cache.size > 2500) cache.clear();
  cache.set(key, c);
  return c;
}
function drawSquares(g, c, k, punch) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  for (const sq of c.squares) {
    if (sq.rr <= 0.3) continue;
    g.save();
    g.shadowOffsetX = sq.rr / 24;
    g.shadowOffsetY = sq.rr / 24;
    g.shadowBlur = (sq.rr / 6) * (1 + 0.5 * punch);
    g.shadowColor = 'rgba(0,0,0,.55)';
    g.fillStyle = sq.col;
    g.fillRect(sq.jx - sq.rr / 2, sq.jy - sq.rr / 2, sq.rr, sq.rr);
    g.restore();
  }
  g.globalAlpha = 1;
}
function drawDots(g, c, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.save();
  g.translate(c.gx, c.gy);
  for (const d of c.dots) {
    if (d.filled) {
      g.fillStyle = c.ec;
      g.beginPath();
      g.arc(d.ex, d.ey, d.er / 2, 0, TAU);
      g.fill();
    } else {
      g.strokeStyle = c.ec;
      g.lineWidth = Math.max(0.4, d.er / 10);
      g.beginPath();
      g.arc(d.ex, d.ey, d.er / 2, 0, TAU);
      g.stroke();
    }
  }
  g.restore();
  g.globalAlpha = 1;
}
function drawStreaks(g, c, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.save();
  g.rotate(c.streakRot);
  for (const s of c.streaks) {
    g.strokeStyle = s.col;
    g.lineWidth = Math.max(0.3, s.w);
    g.beginPath();
    g.moveTo(s.x1, -c.rad / 2);
    g.bezierCurveTo(s.x2, -c.rad / 4, s.x3, c.rad / 4, s.x4, c.rad / 2);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}
function drawBar(g, c, k) {
  if (k <= 0.004 || !c.hasBar) return;
  g.globalAlpha = k;
  g.save();
  g.rotate(c.barRot);
  g.fillStyle = c.barCol;
  if (c.barVert) g.fillRect(-c.barSr / 2, -1200, c.barSr, 2400);
  else g.fillRect(-1200, -c.barSr / 2, 2400, c.barSr);
  g.restore();
  g.globalAlpha = 1;
}
const Fr = (i, k) => randomAt(11650, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  k: 0.5 + Fr(i, 2) * 0.8,
  life: 9 + Fr(i, 3) * 7,
  off: Fr(i, 4),
  ph: Fr(i, 5) * TAU,
  spin0: Fr(i, 6) * TAU,
  spinRate: (Fr(i, 7) < 0.5 ? -1 : 1) * (0.015 + Fr(i, 8) * 0.025),
}));

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  g.save();
  for (let i = 0; i < N; i++) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 4 * f.k * t, PW) + 11 * Math.sin(t * 0.16 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 3 * f.k * t, PH) + 11 * Math.cos(t * 0.13 + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const spin = f.spin0 + t * f.spinRate * (1 + 0.4 * m.fast.high) * (1 + s.motion * 0.2);
    const scale = e.scale * (1 + 0.05 * Math.sin(t * 0.35 + f.ph) + 0.06 * m.slow.bass);
    const punch = m.impulse * s.impulse;
    g.save();
    g.translate(x + e.dx, y + e.dy);
    g.rotate(spin);
    g.scale(scale, scale);
    const c0 = conf(i, ep - 1),
      c1 = conf(i, ep);
    const k0 = 1 - ease(fr / 0.16),
      k1 = ease(fr / 0.3);
    drawBar(g, c0, k0);
    drawSquares(g, c0, k0, punch);
    drawDots(g, c0, k0);
    drawStreaks(g, c0, k0);
    drawBar(g, c1, k1);
    drawSquares(g, c1, k1, punch);
    drawDots(g, c1, k1);
    drawStreaks(g, c1, k1);
    g.restore();
  }
  g.restore();
  return s;
}
