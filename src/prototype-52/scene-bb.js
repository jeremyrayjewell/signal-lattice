import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 170,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 1300;
const cp = [
  '#3A4851',
  '#606684',
  '#BC4335',
  '#E1CEC5',
  '#523047',
  '#CA8196',
  '#42ABB0',
  '#A06F53',
  '#E88345',
  '#CC7775',
];
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
// Soft black halo stamped under each wheel in place of a per-petal blurred shadow.
const halo = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'),
    gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.92)');
  gr.addColorStop(0.6, 'rgba(0,0,0,.86)');
  gr.addColorStop(0.8, 'rgba(0,0,0,.4)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
})();
const Fr = (i, k) => randomAt(11557, i * 97 + k);
// Wheels and outlines live on a wrapped field slightly larger than the frame, each with its own drift speed (parallax).
const items = Array.from({ length: N }, (_, i) => {
  const mo = S / 12 + Fr(i, 10) * (S / 4 - S / 12);
  return {
    x: Fr(i, 0) * PW,
    y: Fr(i, 1) * PH,
    k: 0.75 + Fr(i, 2) * 0.5,
    life: 5 + Fr(i, 3) * 6,
    off: Fr(i, 4),
    ph: Fr(i, 5) * TAU,
    ol: Fr(i, 6) < 0.5,
    oX: Fr(i, 8) * PW,
    oY: Fr(i, 9) * PH,
    ok: 0.75 + Fr(i, 14) * 0.5,
    mo,
    rr: mo * (Fr(i, 11) < 0.5 ? 1 : 2),
    white: Fr(i, 12) < 0.5,
    rf: Fr(i, 13),
    oph: Fr(i, 15) * TAU,
  };
});
const cache = new Map();
// One wheel's look for one "epoch": a pure function of (wheel, epoch), so any frame can be drawn alone.
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11558, key * 80 + k),
    v = (1 + Math.floor(r(0) * 3)) * 6,
    multi = r(1) < 0.5;
  const c = {
    v,
    multi,
    mr: S / 12 + r(2) * (S / 4 - S / 12),
    rot: r(3) * TAU,
    spin: (r(4) < 0.5 ? -1 : 1) * (0.07 + r(5) * 0.2),
    fx: r(6) < 0.5 ? -1 : 1,
    fy: r(7) < 0.5 ? -1 : 1,
    col: multi
      ? Array.from({ length: v }, (_, j) => cp[Math.floor(r(10 + j) * 10)])
      : cp[Math.floor(r(9) * 10)],
  };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
// Each petal is a blade pinched at the centre: one curved flank, one straight flank, a scalloped outer edge.
function wheel(g, c, cx, cy, k, t, m, ph, kick) {
  if (k <= 0.004) return;
  const R = (c.mr / 2) * k * (1 + 0.14 * m.slow.bass),
    ag = TAU / c.v,
    ch = Math.cos(ag / 2),
    sh = Math.sin(ag / 2);
  g.globalAlpha = 1;
  g.drawImage(halo, cx - R * 1.5, cy - R * 1.5, R * 3, R * 3);
  g.save();
  g.translate(cx, cy);
  g.rotate(c.rot + c.spin * t + kick);
  g.scale(c.fx, c.fy);
  g.fillStyle = '#000000';
  g.beginPath();
  g.arc(0, 0, R / 2, 0, TAU);
  g.fill();
  if (!c.multi) {
    g.fillStyle = c.col;
    g.beginPath();
  }
  for (let j = 0; j < c.v; j++) {
    const a = j * ag + 0.03 * m.fast.high * Math.sin(t * 9 + j),
      ca = Math.cos(a),
      sa = Math.sin(a);
    const rj = R * (1 + 0.09 * Math.sin(t * 1.3 + j * 1.7 + ph) * (0.6 + 0.8 * m.slow.mid));
    if (c.multi) {
      g.fillStyle = c.col[j];
      g.beginPath();
    }
    g.moveTo(0, 0);
    g.bezierCurveTo(0, 0, rj * ca, rj * sa, rj * (ch * ca + sh * sa), rj * (ch * sa - sh * ca));
    g.bezierCurveTo(
      rj * (ch * ca + sh * sa),
      rj * (ch * sa - sh * ca),
      0,
      0,
      rj * (ch * ca - sh * sa),
      rj * (ch * sa + sh * ca),
    );
    g.closePath();
    if (c.multi) g.fill();
  }
  if (!c.multi) g.fill();
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  // Twelve delayed reads stand in for per-wheel lateral delay (each column band responds a little later).
  const bands = Array.from({ length: 12 }, (_, k) =>
    reactive ? controls.at(t - 0.03 - (k / 11) * 0.16) : quiet,
  );
  const at = (x) => bands[Math.max(0, Math.min(11, Math.floor((x / W) * 11 + 0.5)))];
  const wob = 10 + 16 * s.motion,
    pace = intro * intro; // dense scene: slower population keeps the outgoing scene visible longer
  g.save();
  for (let i = 0; i < N; i++) {
    const f = items[i],
      e = introFor(i, pace, 420),
      lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 18 * f.k * t, PW) + wob * Math.sin(t * 0.37 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 11 * f.k * t, PH) + wob * Math.cos(t * 0.31 + f.ph);
    if (e.active && x > -130 && x < W + 130 && y > -130 && y < H + 130) {
      const u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = at(x);
      const kick = 0.25 * m.impulse * s.impulse * Math.sin(t * 6 + f.ph);
      // Old wheel withers while the new one blooms.
      wheel(
        g,
        conf(i, ep - 1),
        x + e.dx,
        y + e.dy,
        (1 - ease(fr / 0.16)) * e.scale,
        t,
        m,
        f.ph,
        kick,
      );
      wheel(g, conf(i, ep), x + e.dx, y + e.dy, ease(fr / 0.3) * e.scale, t, m, f.ph, kick);
    }
    if (f.ol) {
      const eo = introFor(i + N, pace, 420);
      const ox = lap(f.oX + 18 * f.ok * t, PW) + 14 * Math.sin(t * 0.3 * f.ok + f.oph),
        oy = lap(f.oY - 11 * f.ok * t, PH) + 14 * Math.cos(t * 0.27 + f.oph);
      const m = at(ox),
        rr = f.rr * (1 + 0.05 * Math.sin(t * 0.5 + f.oph) + 0.06 * m.slow.bass) * eo.scale;
      if (
        eo.active &&
        ox > -rr / 2 - 20 &&
        ox < W + rr / 2 + 20 &&
        oy > -rr / 2 - 20 &&
        oy < H + rr / 2 + 20
      ) {
        // Corners glide between square and circle.
        const rad = (rr / 2) * (0.5 + 0.5 * Math.sin(t * (0.25 + f.rf * 0.2) + f.oph));
        g.save();
        g.translate(ox + eo.dx, oy + eo.dy);
        g.rotate(0.07 * Math.sin(t * 0.4 + f.oph));
        g.strokeStyle = f.white ? '#ffffff' : '#000000';
        g.lineWidth = Math.max(0.9, f.mo / 80) * (1 + 0.5 * m.fast.centroid);
        g.beginPath();
        g.roundRect(-rr / 2, -rr / 2, rr, rr, rad);
        g.stroke();
        g.restore();
      }
    }
  }
  g.restore();
  return s;
}
