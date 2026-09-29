import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(48213, id * 151 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const W = 960,
  H = 540,
  CX = 576,
  CY = 272;
// Rich, jewel-toned palette independent of the source's exact colors.
const HUES = [215, 185, 140, 355, 22, 320, 262];

// Element bases are scattered across an own grid spanning the whole canvas
// (echoing the source's 8x8 macro grid of cylinder clusters), not clustered
// near one locus. Each element's *orientation* points roughly along the
// radial direction from the canvas vanishing point through its own base
// position, with its own independent deviation from that direction — the
// same perspective effect the source gets from many near-parallel,
// camera-facing cylinders scattered across a grid (their projected
// directions converge toward a shared vanishing point even though their
// bases don't), without reusing its camera/rotation math.
const GRID_COLS = 12,
  GRID_ROWS = 8;
function gridBase(id) {
  // Hash the id down to a cell index rather than using id modulo directly —
  // sequential ids must not land in sequential (adjacent) cells, or elements
  // cluster in one region of the grid instead of scattering across it.
  const cell = Math.floor(r(id, 19) * GRID_COLS * GRID_ROWS);
  const gx = cell % GRID_COLS,
    gy = Math.floor(cell / GRID_COLS);
  const cellW = W / GRID_COLS,
    cellH = H / GRID_ROWS;
  const px = (gx + 0.5) * cellW + (r(id, 20) - 0.5) * cellW * 0.88;
  const py = (gy + 0.5) * cellH + (r(id, 21) - 0.5) * cellH * 0.88;
  const dist0 = Math.max(1, Math.hypot(px - CX, py - CY));
  const angle0 = Math.atan2(py - CY, px - CX);
  return { dist0, angle0 };
}

// Bases are scattered across an own grid spanning the whole canvas (echoing
// the source's 8x8 macro grid), but each element's *tip* end gathers within
// a modest radius of the shared vanishing point — real convergent
// perspective, confirmed against a direct capture of the live source: its
// cone tips visibly cluster toward one bright zone. A wide, but not fully
// freeform, per-element angular deviation keeps that convergence from
// reading as a perfectly clean pinwheel.
// A small population of large, bold wedges carries most of the visual
// weight (the source's few very long, large-radius cylinders); about a
// third instead render as a big end-cap on a short stub (a cylinder viewed
// close to end-on, showing mostly its circular cross-section).
// Wedge angle is fully random and independent of position (not stratified
// into even sectors — that read as an artificially regular, evenly-spaced
// pinwheel, reintroducing the "one locus" look through sheer geometric
// regularity even with scattered bases). Coverage around the vanishing
// point instead comes from a high enough count that a wide gap is
// statistically unlikely, matching the source's own organic irregularity.
const WEDGE_COUNT = 96;
const wedges = Array.from({ length: WEDGE_COUNT }, (_, k) => {
  const id = 2000 + k;
  const angle0 = r(id, 27) * TAU;
  const dist0 = 90 + r(id, 28) * 470;
  const angleJitter = (r(id, 24) - 0.5) * 1.1;
  const capBig = r(id, 51) < 0.3;
  const tipRadius = 18 + r(id, 25) * 75;
  const baseRadius = dist0 * (0.85 + 0.3 * r(id, 26));
  const thickness1 = 26 + r(id, 9) * 54;
  const thickness0 = 4 + r(id, 10) * 6;
  const capRadius = capBig ? 26 + r(id, 52) * 46 : thickness1 * (0.5 + 0.3 * r(id, 52));
  const hue = HUES[Math.floor(r(id, 3) * HUES.length)];
  const dark = r(id, 50) < 0.3;
  const phase = r(id, 5) * TAU;
  const spinRate = (r(id, 6) - 0.5) * 0.7;
  return {
    id,
    angle0,
    angleJitter,
    tipRadius,
    baseRadius: capBig ? tipRadius + (baseRadius - tipRadius) * 0.3 : baseRadius,
    thickness0,
    thickness1,
    capRadius,
    hue,
    dark,
    phase,
    spinRate,
  };
});

// A dense field of small, vivid dot/tiny-cylinder shapes. Short cylinders
// foreshorten negligibly, so each is drawn as a short local shape near its
// own anchor rather than stretched toward the vanishing point — but their
// anchors are weighted toward the canvas center (an own probabilistic
// compression of the whole-canvas grid), matching the real source capture's
// visibly denser small-dot cluster around its bright core.
const DOT_COUNT = 280;
const dots = Array.from({ length: DOT_COUNT }, (_, k) => {
  const id = k;
  const { dist0, angle0 } = gridBase(id);
  const anchorDist = dist0 * Math.pow(r(id, 70), 2.1);
  const freeform = r(id, 61) < 0.4;
  const angleJitter = freeform ? (r(id, 11) - 0.5) * TAU : (r(id, 11) - 0.5) * 2.2;
  const lengthHalf = 4 + Math.pow(r(id, 3), 2) * 32;
  const thickness = 3 + r(id, 4) * 6.5;
  const capRadius = thickness * (0.7 + 0.5 * r(id, 12));
  const hue = HUES[Math.floor(r(id, 5) * HUES.length)];
  const phase = r(id, 6) * TAU;
  const spinRate = (r(id, 7) - 0.5) * 1.6;
  return {
    id,
    angle0,
    angleJitter,
    anchorDist,
    lengthHalf,
    thickness,
    capRadius,
    hue,
    phase,
    spinRate,
  };
});

function drawField(g, t, s, at, intro) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const globalSpin = t * 0.1 * (1 + 0.5 * s.motion) + 0.15 * Math.sin(t * 0.05);

  wedges.forEach((wd) => {
    const entry = introFor(wd.id, intro, 420);
    if (!entry.active) return;
    const m = at(0.2),
      flash = m.impulse * s.impulse;
    const ang = wd.angle0 + globalSpin + wd.angleJitter + wd.spinRate * t * 0.1 * s.motion;
    const dirx = Math.cos(ang),
      diry = Math.sin(ang);
    const nx = -diry,
      ny = dirx;
    const stretch = 1 + 0.22 * m.slow.bass + 0.28 * flash;
    const innerR = wd.tipRadius,
      outerR = wd.baseRadius * stretch;
    const ix = CX + dirx * innerR + entry.dx,
      iy = CY + diry * innerR + entry.dy;
    const ox = CX + dirx * outerR + entry.dx,
      oy = CY + diry * outerR + entry.dy;
    const hw0 = wd.thickness0 * 0.5 * entry.scale,
      hw1 = wd.thickness1 * 0.5 * entry.scale * stretch;
    g.beginPath();
    g.moveTo(ix + nx * hw0, iy + ny * hw0);
    g.lineTo(ox + nx * hw1, oy + ny * hw1);
    g.lineTo(ox - nx * hw1, oy - ny * hw1);
    g.lineTo(ix - nx * hw0, iy - ny * hw0);
    g.closePath();
    // A gradient along the wedge's *length* — muted and pale near the tip
    // (blending into the bright, busy vanishing-point zone), fuller and more
    // saturated near the base — rather than a cross-width lit-cylinder
    // stripe: checked directly against the source, its cones read as fairly
    // flat across their width, fading mainly toward the convergence zone.
    const sat = wd.dark ? 34 + 8 * m.fast.rms : 30 + 8 * m.fast.rms;
    const light = (wd.dark ? 15 : 24) + 4 * m.fast.centroid + 8 * flash;
    const alpha = Math.min(1, 0.8 + 0.1 * m.fast.high + 0.1 * flash);
    const lg = g.createLinearGradient(ix, iy, ox, oy);
    lg.addColorStop(
      0,
      `hsla(${wd.hue} ${Math.max(10, sat - 14)}% ${Math.min(78, light + 34)}% / ${alpha * 0.75})`,
    );
    lg.addColorStop(0.4, `hsla(${wd.hue} ${sat}% ${light}% / ${alpha})`);
    lg.addColorStop(1, `hsla(${wd.hue} ${sat + 6}% ${Math.max(4, light - 6)}% / ${alpha})`);
    g.fillStyle = lg;
    g.fill();

    // Every wedge ends in a lit circular cap — its own cylinder's end viewed
    // toward the camera — rather than a separate, sparse, unrelated circle
    // population. Caps stay more saturated than the muted wedge body, but at
    // a medium value rather than a glowing near-white highlight.
    const capR = Math.max(1, wd.capRadius * (1 + 0.16 * m.slow.bass + 0.24 * flash) * entry.scale);
    g.beginPath();
    g.arc(ox, oy, capR, 0, TAU);
    g.fillStyle = `hsla(${wd.hue} 74% 42% / .95)`;
    g.fill();
    g.beginPath();
    g.arc(ox - capR * 0.32, oy - capR * 0.36, capR * 0.24, 0, TAU);
    g.fillStyle = `hsla(${wd.hue} 40% 68% / .5)`;
    g.fill();
  });

  dots.forEach((dot) => {
    const entry = introFor(dot.id, intro, 300);
    if (!entry.active) return;
    const m = at(0.08),
      flash = m.impulse * s.impulse;
    const selected = (0.5 + 0.5 * Math.sin(dot.id * 1.7 - t * 0.6 + dot.phase)) ** 6;
    const orbitAng = dot.angle0 + globalSpin * 1.25;
    const ax = CX + Math.cos(orbitAng) * dot.anchorDist,
      ay = CY + Math.sin(orbitAng) * dot.anchorDist;
    const ang = orbitAng + dot.angleJitter + dot.spinRate * t * 0.15 * s.motion;
    const dirx = Math.cos(ang),
      diry = Math.sin(ang);
    const nx = -diry,
      ny = dirx;
    const stretch = 1 + 0.3 * m.slow.bass + 0.3 * flash;
    const half = dot.lengthHalf * stretch * entry.scale;
    const ix = ax - dirx * half + entry.dx,
      iy = ay - diry * half + entry.dy;
    const ox = ax + dirx * half + entry.dx,
      oy = ay + diry * half + entry.dy;
    const hw = dot.thickness * 0.5 * entry.scale;
    g.beginPath();
    g.moveTo(ix + nx * hw, iy + ny * hw);
    g.lineTo(ox + nx * hw, oy + ny * hw);
    g.lineTo(ox - nx * hw, oy - ny * hw);
    g.lineTo(ix - nx * hw, iy - ny * hw);
    g.closePath();
    const sat = 68 + 14 * m.fast.rms,
      light = 34 + 9 * m.fast.centroid + 12 * flash + 6 * selected;
    g.fillStyle = `hsla(${dot.hue} ${sat}% ${light}% / ${0.86 + 0.12 * flash})`;
    g.fill();
    const capR = Math.max(0.5, dot.capRadius * (1 + 0.14 * flash) * entry.scale);
    g.beginPath();
    g.arc(ox, oy, capR, 0, TAU);
    g.fill();
  });
}

// A single offscreen buffer holds the composed field once per frame; it is
// then composited back twice — a large, heavily blurred copy first (echoing
// the source's full-frame blur pass bleeding softly past the edges), then a
// crisp full copy on top — and finally a couple of small tinted offset
// echoes for a faint chromatic edge. Own layered-canvas construction, not
// the source's WEBGL tint+ADD-blend / INVERT / DIFFERENCE pipeline. (An
// earlier pass added a stroked inset border here; a direct capture of the
// live source showed no such border, so it was removed — that was a
// misread of a screenshot's own crop padding, not a real feature.)
const layers = new WeakMap();
function getBuffers(p) {
  let entry = layers.get(p);
  if (!entry) {
    const src = document.createElement('canvas');
    src.width = 480;
    src.height = 270;
    const tmp = document.createElement('canvas');
    tmp.width = 480;
    tmp.height = 270;
    entry = { src, tmp };
    layers.set(p, entry);
  }
  return entry;
}
const FRINGES = [
  { color: 'rgba(255,40,40,.06)', dx: -2.2, dy: 1 },
  { color: 'rgba(40,140,255,.06)', dx: 2.4, dy: -0.7 },
];

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#c4c8d0');

  const { src, tmp } = getBuffers(p);
  const b = src.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  drawField(b, t, s, at, intro);
  b.restore();

  if (intro >= 1) {
    g.save();
    g.filter = 'blur(9px)';
    g.globalAlpha = 0.55;
    g.drawImage(src, -14, -14, W + 28, H + 28);
    g.restore();
  }
  g.drawImage(src, 0, 0, W, H);

  const tc = tmp.getContext('2d');
  g.save();
  g.globalCompositeOperation = 'lighter';
  FRINGES.forEach(({ color, dx, dy }) => {
    tc.setTransform(1, 0, 0, 1, 0, 0);
    tc.clearRect(0, 0, 480, 270);
    tc.drawImage(src, 0, 0);
    tc.globalCompositeOperation = 'source-atop';
    tc.fillStyle = color;
    tc.fillRect(0, 0, 480, 270);
    tc.globalCompositeOperation = 'source-over';
    g.drawImage(tmp, dx, dy, W, H);
  });
  g.restore();

  return s;
}
