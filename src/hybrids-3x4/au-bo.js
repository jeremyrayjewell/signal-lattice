// Hybrid of Scene AU (prototype-45, Codex) and Scene BO (prototype-65,
// "Gradient Portholes") for segment 6. AU's 12 vertical light-bands and BO's
// grid cells are merged into one array, tagged and depth-sorted together
// every frame, drawn in a single shared loop -- a small gradient-circle cell
// can render on top of a wide light band at one moment and sit behind it the
// next. AU's own cached multiscale dot texture stays exactly as AU applies
// it: a per-band overlay clip, since it has no separate identity as an
// "element" outside that context.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-45/states.js';

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

// ---- AU's own population ----
const AU_R = (id, k) => randomAt(51345, id * 193 + k);
const bands = Array.from({ length: 12 }, (_, id) => ({
  id,
  phase: AU_R(id, 0) * TAU,
  hue: AU_R(id, 1) * 360,
}));
let mosaic;
function texture() {
  if (mosaic) return mosaic;
  mosaic = document.createElement('canvas');
  mosaic.width = 960;
  mosaic.height = 540;
  const g = mosaic.getContext('2d');
  for (let i = 0; i < 14000; i++) {
    const size = [2, 3, 5, 9, 15][Math.floor(AU_R(i, 70) * 5)];
    g.fillStyle =
      AU_R(i, 71) > 0.5
        ? `rgba(255,255,255,${0.08 + AU_R(i, 72) * 0.5})`
        : `rgba(0,0,0,${0.1 + AU_R(i, 72) * 0.6})`;
    g.fillRect(
      Math.floor((AU_R(i, 73) * 960) / size) * size,
      Math.floor((AU_R(i, 74) * 540) / size) * size,
      size,
      size,
    );
  }
  return mosaic;
}
function auBand(g, c, t, m, s, entry) {
  g.save();
  g.translate(c.id * 80 + entry.dx, entry.dy);
  g.scale(entry.scale, entry.scale);
  g.beginPath();
  g.rect(0, 0, 80, 540);
  g.clip();
  g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 14; k++) {
    const seed = c.id * 19 + k,
      phase = AU_R(seed, 2) * TAU;
    const y =
      AU_R(seed, 3) * 680 -
      70 +
      45 * Math.sin(t * (0.36 + AU_R(seed, 4) * 0.3) + phase) +
      m.slow.bass * 17 * Math.cos(phase);
    const height = 23 + AU_R(seed, 5) * 60;
    const slope = 0.32 * Math.sin(t * 0.69 + phase) + 0.16 * m.slow.mid * Math.sin(phase);
    const hue = (c.hue + k * 53 + 18 * Math.sin(t * 0.23 + phase)) % 360;
    g.save();
    g.translate(40, y);
    g.transform(1, slope, 0, 1, 0, 0);
    const intensity = 0.46 + 0.15 * m.fast.rms;
    const grad = g.createLinearGradient(0, -height, 0, height);
    grad.addColorStop(0, `hsla(${hue},100%,55%,0)`);
    grad.addColorStop(0.35, `hsla(${hue},100%,58%,${intensity * 0.55})`);
    grad.addColorStop(0.5, `hsla(${hue},100%,76%,${intensity})`);
    grad.addColorStop(0.65, `hsla(${hue},100%,58%,${intensity * 0.55})`);
    grad.addColorStop(1, `hsla(${hue},100%,55%,0)`);
    g.fillStyle = grad;
    g.fillRect(-40, -height, 80, height * 2);
    for (let layer = 0; layer < 5; layer++) {
      const h = height * (0.15 + layer * 0.13);
      g.fillStyle = `hsla(${hue + layer * 5},100%,65%,${0.035 + 0.025 * m.residue})`;
      g.save();
      g.transform(1, 0.15 * Math.sin(phase + layer + t * 0.82), 0, 1, 0, 0);
      g.fillRect(-40, -h, 80, h * 2);
      g.restore();
    }
    g.restore();
  }
  for (let k = 0; k < 9; k++) {
    const phase = c.phase + k * 1.9,
      seed = c.id * 13 + k;
    g.strokeStyle = `hsla(${(c.hue + k * 41) % 360},90%,${k % 3 === 0 ? 88 : 69}%,${0.48 + 0.2 * AU_R(seed, 7)})`;
    g.lineWidth = 0.8 + AU_R(seed, 8) * 1.5 + 0.5 * m.fast.high;
    g.beginPath();
    for (let j = 0; j <= 110; j++) {
      const u = j / 110;
      const x =
        40 +
        30 * Math.sin(u * TAU * (0.8 + AU_R(seed, 9)) + t * 0.51 + phase) +
        10 * Math.sin(u * 11 - t * 0.91 + phase);
      const curl = k % 3 === 0 ? 112 : 45 + AU_R(seed, 10) * 40;
      const y =
        -80 +
        u * 700 +
        curl * Math.sin(u * TAU * 1.5 + t * 0.39 + phase) +
        m.impulse * s.impulse * 9 * Math.sin(u * 8 + phase);
      if (j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.82;
  const dy = 3 * Math.sin(t * 0.8 + c.phase) * (1 + 0.3 * m.fast.high);
  g.drawImage(texture(), -c.id * 80, dy);
  g.drawImage(texture(), -c.id * 80, dy - 540);
  g.restore();
}

// ---- BO's own population ----
const S = 540,
  G = S / 5;
const cp = ['#2A4FA9', '#F8CA61', '#6BB26C', '#AD0C16', '#697B7A'];
const boCache = new Map();
function boConf(h, e) {
  const key = h * 512 + e + 64,
    hit = boCache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11598, key * 160 + k);
  let ca = Math.floor(r(0) * 5),
    cb = Math.floor(r(1) * 5);
  if (cb === ca) cb = (cb + 1) % 5;
  const circScale = 0.7 + r(2) * 0.3,
    v = (1 + Math.floor(r(3) * 5)) * 4,
    sg = G / v,
    sqs = [];
  for (let i = 0; i < v; i++)
    for (let j = 0; j < v; j++) {
      const b = 10 + (i * v + j) * 4;
      if (r(b) < 0.5) continue;
      sqs.push({
        x: -G / 2 + sg / 2 + i * sg,
        y: -G / 2 + sg / 2 + j * sg,
        size: r(b + 1) < 0.5 ? sg / 2 : sg,
        col: r(b + 2) < 0.5 ? '#000000' : cp[Math.floor(r(b + 3) * 5)],
        ph: r(b + 3) * TAU,
      });
    }
  const beziers = Array.from({ length: 8 }, (_, k) => {
    const b = 400 + k * 10;
    return {
      rot: (Math.floor(r(b) * 4) * Math.PI) / 2,
      col: r(b + 1) < 0.5 ? '#ffffff' : cp[Math.floor(r(b + 2) * 5)],
      y0: ((r(b + 3) * 2 - 1) * G) / 2,
      y1: ((r(b + 4) * 2 - 1) * G) / 2,
      y2: ((r(b + 5) * 2 - 1) * G) / 2,
      y3: ((r(b + 6) * 2 - 1) * G) / 2,
      ph: r(b + 7) * TAU,
    };
  });
  const c = { ca, cb, circScale, sqs, beziers };
  if (boCache.size > 8000) boCache.clear();
  boCache.set(key, c);
  return c;
}
function boPaintCell(g, c, t, m, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  const R = (G * c.circScale * (1 + 0.08 * Math.sin(t * 0.7) + 0.08 * m.slow.bass)) / 2;
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, R);
  grad.addColorStop(0, cp[c.ca]);
  grad.addColorStop(1, cp[c.cb]);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, R, 0, TAU);
  g.fill();
  for (const sq of c.sqs) {
    const s = sq.size * (1 + 0.06 * Math.sin(t * 0.9 + sq.ph) + 0.05 * m.fast.high);
    g.fillStyle = sq.col;
    g.fillRect(sq.x - s / 2, sq.y - s / 2, s, s);
  }
  g.lineWidth = Math.max(0.4, (G / 80) * (1 + 0.3 * m.fast.centroid));
  for (const b of c.beziers) {
    g.save();
    g.rotate(b.rot);
    g.strokeStyle = b.col;
    const wob = 3 * Math.sin(t * 0.8 + b.ph) * (1 + 0.4 * m.fast.high);
    g.beginPath();
    g.moveTo(-G / 2, b.y0 + wob);
    g.bezierCurveTo(-G / 4, b.y1 - wob, G / 4, b.y2 + wob, G / 2, b.y3 - wob);
    g.stroke();
    g.restore();
  }
  g.globalAlpha = 1;
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#000000');
  g.save();
  g.lineCap = 'butt';

  const pool = [];
  for (const c of bands) {
    const entry = introFor(c.id, intro, 320);
    if (!entry.active) continue;
    pool.push({
      kind: 'band',
      c,
      entry,
      depth: (AU_R(c.id, 900) - 0.5) * 240 + 18 * Math.sin(t * 0.24 + c.phase),
    });
  }
  const ox = -(t * 10 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = t * 6.5 + 13 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion);
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor(1500 + (((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      pool.push({ kind: 'cell', h, e, x, y, depth: (randomAt(11599, h * 4 + 900) - 0.5) * 240 });
    }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'band') {
      const { c, entry } = item,
        m = reactive ? controls.at(t - 0.025 - c.id * 0.021) : quiet;
      auBand(g, c, t, m, s, entry);
    } else {
      const { h, e, x, y } = item;
      const P = 4 + randomAt(11599, h * 4 + 1) * 4,
        off = randomAt(11599, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#000000';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      boPaintCell(g, boConf(h, ep - 1), t, m, 1 - ease(fr / 0.16));
      boPaintCell(g, boConf(h, ep), t, m, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  }
  g.restore();
  return s;
}
