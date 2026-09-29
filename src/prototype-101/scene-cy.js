import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  W = 960,
  H = 540,
  S = 540,
  M = 140,
  PW = W + 2 * M,
  PH = H + 2 * M,
  N = 22;
const cp = [
  '#33A8C7',
  '#52E3E1',
  '#A0E426',
  '#FDF148',
  '#FFAB00',
  '#F77976',
  '#F050AE',
  '#D883FF',
  '#9336FD',
  '#DCDCDC',
];
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
const mix = (a, b, q) => a + (b - a) * q;

// A genuine 3D origami crane, the same faces and proportions as the source's own `drawTsuru`
// (body, front/back ridge crease, belly flap, small connector tris, tail, head-base, head-tip, and
// two wings folded up out of the body plane with a centre crease line) reimplemented in p5's own
// WEBGL immediate mode, matching the source's own technique rather than a flattened 2D fake. The
// one addition: `wing1Angle` is animated continuously (a real flap, oscillating within the
// source's own established 45-90 degree fold range) instead of the source's one-shot random angle;
// wing 2 stays the source's own mirror of wing 1 (180 degrees minus wing 1's angle).
function drawSwan(pg, r, rgbCol, alpha, wing1Angle) {
  const [cr, cg, cb] = rgbCol;
  pg.fill(cr, cg, cb, alpha);
  pg.stroke(255, 255, 255, alpha);
  pg.strokeWeight(r / 100);
  const CLOSE = pg.CLOSE;
  pg.beginShape();
  pg.vertex(-r / 2, 0);
  pg.vertex(r / 2, 0);
  pg.vertex(r / 3, -r / 2.5);
  pg.vertex(-r / 3, -r / 2.5);
  pg.endShape(CLOSE);
  for (const z of [1, -1]) {
    pg.push();
    pg.translate(0, 0, z);
    pg.beginShape();
    pg.vertex(-r / 2, 0);
    pg.vertex(0, -r / 2.5);
    pg.vertex(r / 2, 0);
    pg.endShape(CLOSE);
    pg.pop();
  }
  pg.beginShape();
  pg.vertex(-r / 2, 0);
  pg.vertex(-r / 2.4, r / 3);
  pg.vertex(0, r / 4);
  pg.vertex(r / 2.4, r / 3);
  pg.vertex(r / 2, 0);
  pg.endShape(CLOSE);
  for (const z of [1, -1]) {
    pg.push();
    pg.translate(0, 0, z);
    pg.beginShape();
    pg.vertex(0, r / 8);
    pg.vertex(-r / 2, 0);
    pg.vertex(-r / 3.5, 0);
    pg.endShape(CLOSE);
    pg.beginShape();
    pg.vertex(0, r / 8);
    pg.vertex(r / 2, 0);
    pg.vertex(r / 3.5, 0);
    pg.endShape(CLOSE);
    pg.pop();
  }
  pg.push();
  pg.translate(0, 0, -1);
  pg.beginShape();
  pg.vertex(-r / 2, 0);
  pg.vertex(-r / 1.5, -r * 1.5);
  pg.vertex(-r / 3, -r / 2.5);
  pg.endShape(CLOSE);
  pg.beginShape();
  pg.vertex(r / 2, 0);
  pg.vertex(r / 1.3, -r);
  pg.vertex(r / 1.5, -r);
  pg.vertex(r / 3, -r / 2.5);
  pg.endShape(CLOSE);
  pg.pop();
  pg.push();
  pg.translate(0, 0, -2);
  pg.beginShape();
  pg.vertex(r / 1.5, -r);
  pg.vertex(r, -r / 2);
  pg.vertex(r / 1.3, -r);
  pg.endShape(CLOSE);
  pg.pop();
  pg.push();
  pg.rotateX(wing1Angle);
  pg.beginShape();
  pg.vertex(-r / 2, 0);
  pg.vertex(-r / 1.7, -r / 3);
  pg.vertex(0, -r * 1.5);
  pg.vertex(r / 1.7, -r / 3);
  pg.vertex(r / 2, 0);
  pg.endShape(CLOSE);
  pg.push();
  pg.translate(0, 0, 1);
  pg.line(0, -r * 1.5, 0, 0, 0, 0);
  pg.pop();
  pg.push();
  pg.translate(0, 0, -1);
  pg.line(0, -r * 1.5, 0, 0, 0, 0);
  pg.pop();
  pg.pop();
  pg.push();
  pg.rotateX(Math.PI - wing1Angle);
  pg.beginShape();
  pg.vertex(-r / 2, 0);
  pg.vertex(-r / 1.7, r / 3);
  pg.vertex(0, r * 1.5);
  pg.vertex(r / 1.7, r / 3);
  pg.vertex(r / 2, 0);
  pg.endShape(CLOSE);
  pg.push();
  pg.translate(0, 0, 1);
  pg.line(0, r * 1.5, 0, 0, 0, 0);
  pg.pop();
  pg.push();
  pg.translate(0, 0, -1);
  pg.line(0, r * 1.5, 0, 0, 0, 0);
  pg.pop();
  pg.pop();
}

const cache = new Map();
function conf(i, e) {
  const key = i * 512 + e + 64,
    hit = cache.get(key);
  if (hit) return hit;
  const r = (k) => randomAt(11653, key * 10 + k);
  const c = { col: rgb[Math.floor(r(0) * rgb.length)], rad: S / 7 + r(1) * (S / 4.2 - S / 7) };
  if (cache.size > 4000) cache.clear();
  cache.set(key, c);
  return c;
}

// A cached, periodically-regenerated fine noise-grain texture, overlay-blended across the whole
// frame -- the source's own closing `blendMode(OVERLAY)` random-brightness grid, kept as a single
// cheap cached image rather than redrawing tens of thousands of little rects every frame.
const GW = 240,
  GH = 135,
  grainCanvas = document.createElement('canvas');
grainCanvas.width = GW;
grainCanvas.height = GH;
let grainEpoch = -1;
function buildGrain(ep) {
  const gg = grainCanvas.getContext('2d'),
    id = gg.createImageData(GW, GH),
    d = id.data;
  for (let p = 0; p < GW * GH; p++) {
    const v = Math.floor(randomAt(11654, ep * (GW * GH) + p) * 255);
    d[p * 4] = v;
    d[p * 4 + 1] = v;
    d[p * 4 + 2] = v;
    d[p * 4 + 3] = 255;
  }
  gg.putImageData(id, 0, 0);
}
function paintGrain(g, t) {
  const ep = Math.floor(t * 0.6);
  if (ep !== grainEpoch) {
    buildGrain(ep);
    grainEpoch = ep;
  }
  g.save();
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.5;
  g.imageSmoothingEnabled = false;
  g.drawImage(grainCanvas, 0, 0, W, H);
  g.restore();
}

const Fr = (i, k) => randomAt(11652, i * 61 + k);
const field = Array.from({ length: N }, (_, i) => ({
  x: Fr(i, 0) * PW,
  y: Fr(i, 1) * PH,
  z: (Fr(i, 16) * 2 - 1) * 140,
  vx: 0.22 + Fr(i, 2) * 0.5,
  ph: Fr(i, 3) * TAU,
  bobAmp: 8 + Fr(i, 4) * 18,
  bobRate: 0.28 + Fr(i, 5) * 0.42,
  flapRate: 1.8 + Fr(i, 6) * 2.2,
  flapPh: Fr(i, 7) * TAU,
  life: 9 + Fr(i, 8) * 8,
  off: Fr(i, 9),
  yaw0: Fr(i, 11) * TAU,
  yawRate: (Fr(i, 12) < 0.5 ? -1 : 1) * (0.12 + Fr(i, 13) * 0.18),
  pitchPh: Fr(i, 14) * TAU,
  rollPh: Fr(i, 15) * TAU,
}));

let pg = null;
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  pg ??= p.createGraphics(W, H, p.WEBGL);
  pg.clear();
  const sorted = [...field.keys()].sort((a, b) => field[b].z - field[a].z);
  for (const i of sorted) {
    const f = field[i],
      e = introFor(i, intro, 420);
    if (!e.active) continue;
    const lap = (v, P) => (((v % P) + P) % P) - M;
    const x = lap(f.x + f.vx * 30 * t, PW),
      yBase = lap(f.y, PH),
      y = yBase + f.bobAmp * Math.sin(t * f.bobRate + f.ph);
    if (x < -M || x > W + M || y < -M || y > H + M) continue;
    const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
    const P = f.life,
      off = f.off * P,
      u = (t + off) / P,
      ep = Math.floor(u),
      fr = u - ep;
    const c0 = conf(i, ep - 1),
      c1 = conf(i, ep);
    const col = [0, 1, 2].map((k) => Math.round(mix(c0.col[k], c1.col[k], fr))),
      rad = mix(c0.rad, c1.rad, fr) * e.scale;
    const flapRate = f.flapRate * (1 + 0.6 * m.fast.high),
      flapPhase = (1 + Math.sin(t * flapRate + f.flapPh)) / 2;
    const wing1 = Math.PI / 4 + flapPhase * (Math.PI / 4) * (1 + 0.15 * m.impulse * s.impulse);
    const yaw = f.yaw0 + t * f.yawRate * (1 + s.motion * 0.15);
    const pitch = (Math.PI / 9) * Math.sin(t * f.bobRate + f.pitchPh),
      roll = (Math.PI / 7.5) * Math.sin(t * 0.31 + f.rollPh) * (1 + s.motion * 0.3);
    pg.push();
    pg.translate(x - W / 2 + e.dx, y - H / 2 + e.dy, f.z);
    pg.rotateY(yaw);
    pg.rotateX(pitch);
    pg.rotateZ(roll);
    drawSwan(pg, rad, col, 255, wing1);
    pg.pop();
  }
  g.save();
  g.filter = 'blur(1px)';
  g.drawImage(pg.canvas, 0, 0, W, H);
  g.restore();
  paintGrain(g, t);
  return s;
}
