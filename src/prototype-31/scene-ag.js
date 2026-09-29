import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
import { drawPaperBackground } from './paper-background.js';
const TAU = Math.PI * 2,
  rand = (id, k) => randomAt(82131, id * 211 + k);
const ink = ['#ff006e', '#04df12', '#00cfed', '#2824ff', '#ff6500', '#d900ff', '#e4d000'];
const silent = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const pages = Array.from({ length: 28 }, (_, id) => ({
  id,
  x: id < 20 ? rand(id, 1) * 1080 - 60 : 105 + ((id - 20) % 4) * 250 + (rand(id, 1) - 0.5) * 55,
  y:
    id < 20
      ? rand(id, 2) * 650 - 55
      : 125 + Math.floor((id - 20) / 4) * 285 + (rand(id, 2) - 0.5) * 60,
  size: id < 20 ? 85 + rand(id, 3) * 95 : 175 + rand(id, 3) * 85,
  phase: rand(id, 4) * TAU,
  flip: rand(id, 5) < 0.5 ? -1 : 1,
  grid: rand(id, 6) > 0.52,
  color: ink[Math.floor(rand(id, 7) * ink.length)],
  strokes: 5 + Math.floor(rand(id, 8) * 5),
}));
function paper(g, h) {
  g.beginPath();
  g.rect(-h, -h, h * 2, h * 2);
}
function noteSpin(id, t) {
  const period = 18 + rand(id, 80) * 14,
    phase = t + rand(id, 81) * period;
  const cycle = Math.floor(phase / period),
    local = phase - cycle * period;
  if (rand(id, 82 + cycle) > 0.48) return 0;
  const duration = 1.7 + rand(id, 83) * 0.8;
  if (local >= duration) return 0;
  const u = local / duration,
    ease = u * u * u * (u * (u * 6 - 15) + 10);
  return (rand(id, 84) < 0.5 ? -1 : 1) * TAU * ease;
}
function gesture(g, c, k, t, m, s) {
  const seed = c.id * 13 + k,
    phase = rand(seed, 30) * TAU,
    speed = 0.22 + rand(seed, 31) * 0.33;
  const drift = t * speed + phase,
    extent = c.size * (0.22 + rand(seed, 32) * 0.2),
    turns = 1.3 + rand(seed, 33) * 3.8,
    bend = 0.15 * m.slow.mid * s.motion;
  const points = [];
  for (let j = 0; j <= 220; j++) {
    const u = j / 220,
      a = u * TAU * turns;
    const x =
      extent *
      (0.62 * Math.sin(a + drift) +
        0.26 * Math.sin(a * 2.31 - drift * 0.8) +
        0.12 * Math.cos(a * 5.1 + phase));
    const y =
      extent *
      (0.65 * Math.sin(a * 1.37 + phase + drift * 0.71) +
        (0.22 + bend) * Math.cos(a * 3.13 - drift));
    const pulse = m.impulse * s.impulse * Math.sin(u * 7 - drift) * c.size * 0.024;
    points.push([x, y + pulse]);
  }
  const pencils = ['#ac466d', '#4d8150', '#4496a0', '#655aa1', '#b37a48', '#925c9e', '#98904b'];
  g.save();
  g.strokeStyle = k % 3 !== 1 ? '#44413f' : pencils[Math.floor(rand(seed, 34) * pencils.length)];
  for (let pass = 0; pass < 2; pass++)
    for (let start = 0; start < 220; start += 20) {
      const pressure = 0.5 + 0.5 * Math.sin(start * 0.049 + phase + pass * 0.8 + t * 0.17);
      g.globalAlpha = (pass === 0 ? 0.42 : 0.22) + pressure * 0.2;
      g.lineWidth = (0.4 + pressure * 0.55) * (c.size / 210) * (1 + 0.12 * m.fast.rms);
      g.beginPath();
      for (let j = start; j <= start + 20; j++) {
        const [x, y] = points[j],
          grain = (rand(seed, j + 100) - 0.5) * 0.5;
        const px = x + grain + pass * 0.65 * Math.sin(j * 0.13 + phase),
          py = y + grain + pass * 0.65 * Math.cos(j * 0.17 + phase);
        if (j === start) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const s = stateAt(elapsed),
    t = trackTime,
    g = p.drawingContext;
  if (intro >= 1) drawPaperBackground(g, t);
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';
  for (const c of pages) {
    const entry = introFor(c.id, intro, 400);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.2) : silent,
      h = c.size / 2,
      step = c.size / 13;
    const x = c.x + 15 * Math.sin(t * 0.26 + c.phase) + m.slow.bass * 7 * Math.sin(c.phase);
    const y = c.y + 18 * Math.cos(t * 0.31 + c.phase) + m.impulse * s.impulse * 4 * Math.sin(c.id);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale * c.flip, entry.scale);
    g.rotate(0.018 * Math.sin(t * 0.38 + c.phase) * (1 + s.motion) + noteSpin(c.id, t));
    g.save();
    g.shadowColor = 'rgba(0,0,0,.85)';
    g.shadowBlur = 8;
    g.shadowOffsetY = 3;
    paper(g, h);
    g.fillStyle = '#ffffff';
    g.fill();
    g.restore();
    g.save();
    paper(g, h);
    g.clip();
    g.strokeStyle = c.color;
    g.lineWidth = 0.75 + 0.25 * m.fast.centroid;
    g.beginPath();
    const ruledOffset = Math.sin(t * 0.4 + c.phase) * 1.6;
    for (let q = -h + step; q < h - step / 2; q += step) {
      g.moveTo(-h + 6, q + ruledOffset);
      g.lineTo(h - step, q + ruledOffset);
      if (c.grid) {
        g.moveTo(q, -h + 4);
        g.lineTo(q, h - 4);
      }
    }
    g.stroke();
    for (let k = 0; k < c.strokes; k++) gesture(g, c, k, t, m, s);
    for (let k = 0; k < 14; k++) {
      const seed = c.id * 19 + k,
        ph = rand(seed, 51) * TAU;
      const px = (rand(seed, 52) - 0.5) * c.size * 0.83 + 5 * Math.sin(t * 0.7 + ph),
        py = (rand(seed, 53) - 0.5) * c.size * 0.83 + 6 * Math.cos(t * 0.57 + ph);
      const radius =
        c.size * (0.008 + rand(seed, 54) * 0.031) * (1 + 0.24 * m.residue + 0.12 * m.fast.high);
      g.beginPath();
      for (let j = 0; j <= 24; j++) {
        const a = (j / 24) * TAU,
          rr = radius * (1 + 0.15 * Math.sin(a * 3 + ph + t * 0.8)),
          xx = px + rr * Math.cos(a),
          yy = py + rr * Math.sin(a);
        if (!j) g.moveTo(xx, yy);
        else g.lineTo(xx, yy);
      }
      g.closePath();
      g.fillStyle = g.strokeStyle = ink[Math.floor(rand(seed, 55) * ink.length)];
      g.lineWidth = 1.2 + rand(seed, 56) * 1.6;
      if (k % 2) g.stroke();
      else g.fill();
    }
    g.restore();
    g.restore();
  }
  g.restore();
  return s;
}
