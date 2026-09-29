// Hybrid of Scene BB ("Bloom Field") and Scene BV ("Diamond Kaleidoscope")
// for segment 6, both mine. BB's wheel-and-outline wrapped-field population
// and BV's rotated grid cells are merged into one array, tagged and depth-
// sorted together every frame, drawn in a single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-52/states.js';

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

// ---- BB's own population ----
const S = 540,
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
const bbItems = Array.from({ length: N }, (_, i) => {
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
const bbCache = new Map();
function bbConf(i, e) {
  const key = i * 512 + e + 64,
    hit = bbCache.get(key);
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
  if (bbCache.size > 8000) bbCache.clear();
  bbCache.set(key, c);
  return c;
}
function bbWheel(g, c, cx, cy, k, t, m, ph, kick) {
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

// ---- BV's own population ----
const G = 54;
const cp2 = ['#0AD2FF', '#2962FF', '#9500FF', '#FF0059', '#FF8C00', '#B4E600', '#0FFFDB'];
const bvCache = new Map();
function bvConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bvCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11617, key * 70 + k);
  const bgOn = r(0) < 0.5,
    bgCol = cp2[Math.floor(r(1) * 7)],
    bgRot = r(2) < 0.5 ? r(3) * TAU : 0;
  const rot = r(4) < 0.5 ? (Math.floor(r(5) * 4) * Math.PI) / 2 : r(6) * TAU;
  const sw = Math.floor(r(7) * 3);
  let c = { bgOn, bgCol, bgRot, rot, sw };
  if (sw === 0) {
    const v = (r(10) < 0.5 ? 1 : 3) * 4,
      sg = G / v,
      tris = [];
    for (let k = 0; k < v; k++) {
      const b = 20 + k * 3;
      tris.push({ flip: r(b) < 0.5 ? -1 : 1, col: cp2[Math.floor(r(b + 1) * 7)] });
    }
    c = { ...c, v, sg, tris };
  } else if (sw === 1) {
    c = {
      ...c,
      ringCol: cp2[Math.floor(r(20) * 7)],
      innerCol: cp2[Math.floor(r(21) * 7)],
      er: G / 8 + r(22) * (G - G / 8),
      ly0: ((r(23) * 2 - 1) * G) / 2,
      ly1: ((r(24) * 2 - 1) * G) / 2,
      lineCol: cp2[Math.floor(r(25) * 7)],
    };
  } else {
    c = {
      ...c,
      quadCol: cp2[Math.floor(r(30) * 7)],
      qa: ((r(31) * 2 - 1) * G) / 2,
      qb: ((r(32) * 2 - 1) * G) / 2,
      qc: ((r(33) * 2 - 1) * G) / 2,
      qd: ((r(34) * 2 - 1) * G) / 2,
      arcLCol: cp2[Math.floor(r(35) * 7)],
      arcLEnd: r(36) < 0.5 ? TAU : Math.PI / 2,
      arcRCol: cp2[Math.floor(r(37) * 7)],
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
    g.fillRect(-G / 2, -G / 2, G, G);
    g.restore();
  }
  g.globalAlpha = k;
  g.save();
  g.rotate(c.rot + 0.06 * Math.sin(t * 0.6 + ph) * (1 + 0.5 * m.fast.high));
  if (c.sw === 0) {
    for (let ti = 0; ti < c.v; ti++) {
      const tx = -G / 2 + c.sg / 2 + ti * c.sg,
        tri = c.tris[ti];
      g.save();
      g.translate(tx, 0);
      g.scale(1, tri.flip);
      g.fillStyle = tri.col;
      g.beginPath();
      g.moveTo(-c.sg / 2, 0);
      g.lineTo(c.sg / 2, 0);
      g.lineTo(c.sg / 2, -G / 2);
      g.closePath();
      g.fill();
      g.restore();
    }
  } else if (c.sw === 1) {
    const lra = G / 10;
    g.strokeStyle = c.ringCol;
    g.lineWidth = lra * (1 + 0.2 * m.fast.centroid);
    g.beginPath();
    g.arc(0, 0, G / 1.5 / 2, 0, TAU);
    g.stroke();
    const er = c.er * (1 + 0.05 * Math.sin(t * 0.8 + ph) + 0.06 * m.slow.bass);
    g.fillStyle = c.innerCol;
    g.beginPath();
    g.arc(0, 0, er / 2, 0, TAU);
    g.fill();
    g.strokeStyle = c.lineCol;
    g.lineWidth = lra / 3;
    g.beginPath();
    g.moveTo(-G / 2 + lra / 2, c.ly0);
    g.lineTo(G / 2 - lra / 2, c.ly1);
    g.stroke();
  } else {
    const lrb = G / 20;
    g.strokeStyle = c.quadCol;
    g.lineWidth = lrb / 2;
    g.beginPath();
    g.moveTo(c.qa, -G / 2 + lrb);
    g.lineTo(-G / 2 + lrb, c.qb);
    g.lineTo(c.qc, G / 2 - lrb);
    g.lineTo(G / 2 - lrb, c.qd);
    g.closePath();
    g.stroke();
    g.lineWidth = lrb * 2;
    g.strokeStyle = c.arcLCol;
    g.beginPath();
    g.arc(-G / 2, 0, (G - lrb * 2) / 2, Math.PI * 1.5, Math.PI * 1.5 + c.arcLEnd);
    g.stroke();
    g.strokeStyle = c.arcRCol;
    g.beginPath();
    g.arc(G / 2, 0, (G - lrb * 2) / 2, Math.PI * 0.5, Math.PI * 0.5 + c.arcREnd);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  const bands = Array.from({ length: 12 }, (_, k) =>
    reactive ? controls.at(t - 0.03 - (k / 11) * 0.16) : quiet,
  );
  const at = (x) => bands[Math.max(0, Math.min(11, Math.floor((x / W) * 11 + 0.5)))];
  const wob = 10 + 16 * s.motion,
    pace = intro * intro;
  g.save();

  const pool = [];
  for (let i = 0; i < N; i++) {
    const f = bbItems[i],
      e = introFor(i, pace, 420),
      lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + 18 * f.k * t, PW) + wob * Math.sin(t * 0.37 * (0.6 + f.k) + f.ph),
      y = lap(f.y - 11 * f.k * t, PH) + wob * Math.cos(t * 0.31 + f.ph);
    if (e.active && x > -130 && x < W + 130 && y > -130 && y < H + 130)
      pool.push({ kind: 'wheel', f, i, e, x, y, depth: (Fr(i, 900) - 0.5) * 240 });
    if (f.ol) {
      const eo = introFor(i + N, pace, 420);
      const ox = lap(f.oX + 18 * f.ok * t, PW) + 14 * Math.sin(t * 0.3 * f.ok + f.oph),
        oy = lap(f.oY - 11 * f.ok * t, PH) + 14 * Math.cos(t * 0.27 + f.oph);
      if (
        eo.active &&
        ox > -f.rr / 2 - 20 &&
        ox < W + f.rr / 2 + 20 &&
        oy > -f.rr / 2 - 20 &&
        oy < H + f.rr / 2 + 20
      )
        pool.push({ kind: 'outline', f, eo, ox, oy, depth: (Fr(i, 901) - 0.5) * 240 });
    }
  }
  const theta = Math.PI / 4 + t * 0.012 * (1 + 0.4 * (reactive ? controls.at(t) : quiet).slow.mid);
  const cA = Math.abs(Math.cos(theta)),
    sA = Math.abs(Math.sin(theta));
  const Lx = (W / 2) * cA + (H / 2) * sA,
    Ly = (W / 2) * sA + (H / 2) * cA;
  const gc0 = Math.floor(-Lx / G) - 1,
    gc1 = Math.ceil(Lx / G) + 1,
    gr0 = Math.floor(-Ly / G) - 1,
    gr1 = Math.ceil(Ly / G) + 1;
  for (let col = gc0; col <= gc1; col++)
    for (let row = gr0; row <= gr1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor(4000 + (((col % 14) + 14) % 14) * 8 + (((row % 8) + 8) % 8), intro, 360);
      if (!e.active) continue;
      pool.push({
        kind: 'diamond',
        h,
        col,
        row,
        e,
        depth: (randomAt(11618, h * 4 + 900) - 0.5) * 240,
      });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'wheel') {
      const { f, i, e, x, y } = item;
      const u = (t + f.off * f.life) / f.life,
        ep = Math.floor(u),
        fr = u - ep,
        m = at(x);
      const kick = 0.25 * m.impulse * s.impulse * Math.sin(t * 6 + f.ph);
      bbWheel(
        g,
        bbConf(i, ep - 1),
        x + e.dx,
        y + e.dy,
        (1 - ease(fr / 0.16)) * e.scale,
        t,
        m,
        f.ph,
        kick,
      );
      bbWheel(g, bbConf(i, ep), x + e.dx, y + e.dy, ease(fr / 0.3) * e.scale, t, m, f.ph, kick);
    } else if (item.kind === 'outline') {
      const { f, eo, ox, oy } = item,
        m = at(ox),
        rr = f.rr * (1 + 0.05 * Math.sin(t * 0.5 + f.oph) + 0.06 * m.slow.bass) * eo.scale;
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
    } else {
      const { h, col, row, e } = item,
        x = col * G + G / 2,
        y = row * G + G / 2;
      const P = 4 + randomAt(11618, h * 4 + 1) * 4,
        off = randomAt(11618, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const wx = x * Math.cos(theta) - y * Math.sin(theta) + W / 2,
        wy = x * Math.sin(theta) + y * Math.cos(theta) + H / 2;
      const m = reactive ? controls.at(t - 0.03 - (wx / W) * 0.16) : quiet;
      g.save();
      g.translate(W / 2, H / 2);
      g.rotate(theta);
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      bvPaintCell(g, bvConf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      bvPaintCell(g, bvConf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  }
  g.restore();
  return s;
}
