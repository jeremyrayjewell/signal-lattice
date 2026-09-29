import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  G = S / 4;
const cp = ['#D6CEC5', '#DF2364', '#F1A349', '#89317C', '#DA5D72', '#8FA8AE', '#27223C'];
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
const cache = new Map();
// One cell's full recipe for one "epoch": a pure function of (cell, epoch), so any frame can be
// drawn alone. Radial lines, scribbles and the X-mark grid are all seeded here, drawn live below.
function conf(h, e) {
  const key = h * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11569, key * 260 + k);
  let ca = Math.floor(r(0) * 7),
    cb = Math.floor(r(1) * 7);
  if (cb === ca) cb = (cb + 1) % 7;
  const v = [40, 80, 120][Math.floor(r(2) * 3)],
    agR = TAU / v,
    lineCount = Math.floor(Math.PI / agR) + 1;
  const lines = Array.from({ length: lineCount }, (_, k) => {
    const b = 10 + k * 4;
    return {
      a: k * agR,
      aa: (r(b) * 2 - 1) * agR * 2,
      ab: (r(b + 1) * 2 - 1) * agR * 2,
      nr: G / 2 + (r(b + 2) * G) / 2,
      ph: r(b + 3) * TAU,
    };
  });
  const bc = r(400) < 0.5;
  const scribbles = Array.from({ length: 15 }, (_, k) => {
    const b = 410 + k * 10;
    return {
      pts: [
        [r(b) * G - G / 2, r(b + 1) * G - G / 2],
        [r(b + 2) * G - G / 2, r(b + 3) * G - G / 2],
        [r(b + 4) * G - G / 2, r(b + 5) * G - G / 2],
        [r(b + 6) * G - G / 2, r(b + 7) * G - G / 2],
      ],
      useCa: r(b + 8) < 0.5,
      w: 1 + r(b + 9) * (G / 20 - 1),
      dash: r(b + 8) < 0.4,
      ph: r(b + 9) * TAU,
    };
  });
  const sv = [2, 4][Math.floor(r(560) * 2)],
    sg = G / sv,
    cells = [];
  for (let i = 0; i < sv; i++)
    for (let j = 0; j < sv; j++) {
      const b = 570 + (i * sv + j) * 3;
      if (r(b) < 0.5)
        cells.push({
          x: -G / 2 + sg / 2 + i * sg,
          y: -G / 2 + sg / 2 + j * sg,
          white: r(b + 1) < 0.5,
          ph: r(b + 2) * TAU,
        });
    }
  const c = {
    ca,
    cb,
    rot: r(700) * TAU,
    spin: (r(701) < 0.5 ? -1 : 1) * (0.06 + r(702) * 0.16),
    lines,
    bc,
    scribbles,
    sv,
    sg,
    cells,
  };
  if (cache.size > 8000) cache.clear();
  cache.set(key, c);
  return c;
}
function paintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.fillStyle = cp[c.ca];
  g.fillRect(-G / 2, -G / 2, G, G);
  g.save();
  g.rotate(c.rot + c.spin * t);
  g.strokeStyle = cp[c.cb];
  for (const ln of c.lines) {
    const wob = 0.15 * Math.sin(t * 0.7 + ln.ph) * (1 + 0.6 * m.fast.high),
      a1 = ln.a + ln.aa * (1 + wob),
      a2 = -ln.a + ln.ab * (1 + wob);
    const nr = (ln.nr * (1 + 0.08 * m.slow.bass)) / 2;
    g.lineWidth = Math.max(0.3, (ln.a / Math.PI) * (G / 10) * (1 + 0.3 * m.impulse));
    g.beginPath();
    g.moveTo(Math.cos(a1) * nr, Math.sin(a1) * nr);
    g.lineTo(Math.cos(a2) * nr, Math.sin(a2) * nr);
    g.stroke();
  }
  const tone = c.bc ? '#ffffff' : '#000000';
  for (const s of c.scribbles) {
    g.strokeStyle = s.useCa ? cp[c.ca] : tone;
    g.lineWidth = s.w;
    g.setLineDash(s.dash ? [1, s.w * 3] : []);
    const wx = 6 * Math.sin(t * 0.9 + s.ph) * (1 + 0.4 * m.fast.rms),
      wy = 6 * Math.cos(t * 0.8 + s.ph * 1.3);
    const p = s.pts;
    g.beginPath();
    g.moveTo(p[0][0] + wx, p[0][1] + wy);
    g.bezierCurveTo(
      p[1][0] - wx,
      p[1][1] + wy,
      p[2][0] + wy,
      p[2][1] - wx,
      p[3][0] - wy,
      p[3][1] + wx,
    );
    g.stroke();
  }
  g.setLineDash([]);
  g.lineWidth = Math.max(0.3, c.sg / 60);
  for (const cell of c.cells) {
    g.strokeStyle = cell.white ? '#ffffff' : '#000000';
    const j = 1.5 * Math.sin(t * 1.6 + cell.ph) * (1 + 0.5 * m.fast.high),
      hs = c.sg / 2;
    g.beginPath();
    g.moveTo(cell.x - hs + j, cell.y - hs);
    g.lineTo(cell.x + hs - j, cell.y + hs);
    g.moveTo(cell.x - hs, cell.y + hs - j);
    g.lineTo(cell.x + hs, cell.y - hs + j);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 10 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = -(t * 6.5 + 12 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G),
    r0 = Math.floor(-oy / G) - 1,
    r1 = Math.ceil((H - oy) / G);
  g.save();
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000;
      const e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      const P = 3.5 + randomAt(11570, h * 4 + 1) * 3.5,
        off = randomAt(11570, h * 4 + 2) * P;
      const u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep,
        m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      if (intro < 1) {
        g.fillStyle = '#ffffff';
        g.fillRect(-G / 2, -G / 2, G, G);
      }
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      paintCell(g, conf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      paintCell(g, conf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    }
  g.restore();
  return s;
}
