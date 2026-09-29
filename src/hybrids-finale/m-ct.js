// Finale hybrid of Scene M ("Mesh Forms", segment 1) and Scene CT ("Checker Drift", Codex,
// segment 7). M's 12 mesh-outline forms and CT's 45 scattered checker-board tiles (each a cached
// board texture sliding column by column) are merged into one array, tagged and depth-sorted
// together every frame, drawn in a single shared loop. M's own blurred backdrop (a private,
// blurred copy of its own forms) is kept as its own background pass, matching how the source uses
// it -- a soft echo behind the crisp foreground.
import { randomAt, introFor } from '../timing.js';
import { stateAt as stateM } from '../prototype-11/states.js';
import { stateAt as stateCT } from '../prototype-96/states.js';

const TAU = Math.PI * 2,
  W = 960,
  H = 540;
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};

// ---- Scene M's own population ----
const mRandom = (id, k = 0) => randomAt(60713, id * 71 + k);
const mForms = [
  [-25, 185, 153, 0.95, 0],
  [165, 160, 145, 0.87, 1],
  [352, 40, 153, 1.12, 0],
  [550, 100, 175, 0.84, 1],
  [806, 55, 157, 0.91, 0],
  [956, 210, 156, 1.15, 1],
  [68, 453, 158, 0.85, 0],
  [304, 415, 166, 0.9, 1],
  [485, 323, 148, 1.08, 0],
  [740, 368, 171, 0.95, 1],
  [920, 514, 146, 0.9, 0],
  [80, 28, 91, 0.8, 1],
];
function drawMesh(g, id, form, t, s, m, soft = false) {
  const [baseX, baseY, size, aspect, white] = form;
  const phase = mRandom(id) * TAU;
  const x = baseX + 25 * s.motion * Math.sin(t * 0.27 + phase),
    y = baseY + 22 * s.motion * Math.cos(t * 0.33 + phase);
  const turn = 0.32 * Math.sin(t * 0.31 + phase);
  const inner = 0.44 + 0.09 * Math.sin(t * 0.41 + phase) + m.slow.bass * 0.065;
  const skew = 0.23 * Math.sin(t * 0.52 + phase) + m.slow.mid * 0.2;
  const amp = 0.13 + 0.08 * s.articulation + m.slow.bass * 0.09;
  function point(a, rail) {
    const q = a + turn;
    const deform =
      1 + amp * Math.sin(q * 3 + phase + t * 0.39) + 0.11 * Math.sin(q * 5 - phase - t * 0.28);
    const radius = size * (rail ? 1 : inner) * deform;
    const impulse = m.impulse * s.impulse * size * 0.075 * Math.sin(q * 2 + phase);
    return [
      Math.cos(q) * (radius + impulse) + size * 0.12 * Math.sin(q * 2 + t * 0.37 + phase),
      Math.sin(q) * (radius + impulse) * aspect + size * 0.08 * Math.cos(q * 3 - t * 0.3),
    ];
  }
  g.save();
  g.translate(x, y);
  const count = soft ? 64 : 112 + Math.floor(mRandom(id, 2) * 40);
  g.strokeStyle = white ? '#ffffff' : '#050505';
  g.globalAlpha = soft ? 0.82 : Math.min(0.9, 0.52 + 0.16 * m.fast.rms + 0.08 * m.fast.centroid);
  g.lineWidth = soft ? 1.5 : 0.65 + 0.17 * s.detail + 0.14 * m.residue;
  for (let n = 0; n < count; n++) {
    const a = (n / count) * TAU + t * (0.075 + mRandom(id, 3) * 0.07);
    const spread = 0.18 + 0.1 * Math.sin(a * 2 + t * 0.48 + phase);
    const points = [
      point(a - spread, 0),
      point(a + spread + skew, 0),
      point(a + 0.32 + skew, 1),
      point(a - 0.25, 1),
    ];
    g.beginPath();
    points.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.closePath();
    g.stroke();
  }
  g.restore();
}
const mLayers = new WeakMap();
function paintMBackdrop(p, g, t, s, at) {
  let back = mLayers.get(p);
  if (!back) {
    back = document.createElement('canvas');
    back.width = 480;
    back.height = 270;
    mLayers.set(p, back);
  }
  const b = back.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalAlpha = 1;
  b.fillStyle = '#b4b4b4';
  b.fillRect(0, 0, 480, 270);
  b.save();
  b.scale(0.5, 0.5);
  for (let i = 0; i < 8; i++) {
    const f = mForms[(i * 5) % mForms.length];
    drawMesh(
      b,
      i + 31,
      [960 - f[0], 540 - f[1], f[2] * 1.28, f[3], 1 - f[4]],
      t * 0.83,
      s,
      at(i * 0.075),
      true,
    );
  }
  b.restore();
  p.background('#dedede');
  g.save();
  g.filter = 'blur(9px)';
  g.drawImage(back, -14, -14, 988, 568);
  g.restore();
}

// ---- Scene CT's own population ----
const ctR = (i, k) => randomAt(42196, i * 503 + k);
const ctPalette = ['#721817', '#FA9F42', '#2B4162', '#0B6E4F', '#E0E0E2'];
const ctPatches = Array.from({ length: 280 }, (_, id) => ({
  id,
  x: ctR(id, 0) * 1220 - 130,
  y: ctR(id, 1) * 800 - 130,
  size: 145 + ctR(id, 2) * 36,
  phase: ctR(id, 3) * TAU,
  angle: ctR(id, 4) * TAU,
  spin: (ctR(id, 5) - 0.5) * 0.065,
}));
const ctBoards = new Map();
function ctChecker(c) {
  if (ctBoards.has(c.id)) return ctBoards.get(c.id);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 160;
  const g = canvas.getContext('2d');
  g.fillStyle = '#000000';
  g.fillRect(0, 0, 160, 160);
  for (let row = 0; row < 20; row++)
    for (let col = 0; col < 20; col++) {
      if ((row + col) % 2 === 0) continue;
      g.fillStyle = ctPalette[Math.floor(ctR(c.id, 20 + row * 20 + col) * 5)];
      g.fillRect(col * 8, row * 8, 8, 8);
    }
  ctBoards.set(c.id, canvas);
  return canvas;
}
function drawCTTile(g, c, t, s, m) {
  const size = c.size * (1 + 0.045 * Math.sin(t * 0.71 + c.phase) + m.slow.bass * 0.045),
    cell = size / 20;
  g.save();
  g.translate(
    c.x + c.entryDx + 22 * Math.sin(t * 0.43 + c.phase),
    c.y + c.entryDy + 22 * Math.cos(t * 0.49 + c.phase),
  );
  g.scale(c.entryScale, c.entryScale);
  g.rotate(c.angle + t * c.spin + 0.16 * Math.sin(t * 0.53 + c.phase) * (1 + s.motion * 0.3));
  const board = ctChecker(c),
    bend = size * (0.1 + 0.025 * Math.sin(t * 0.67 + c.phase) + m.impulse * s.impulse * 0.05);
  for (let col = 0; col < 20; col++) {
    const phase = col * 0.2 + c.phase;
    const shift =
      bend * Math.sin(phase + t * 0.81) +
      size * 0.035 * Math.cos(col * 0.47 - t * 0.59 + c.phase) +
      m.slow.mid * size * 0.025 * Math.sin(col * 0.31 + t);
    g.drawImage(
      board,
      col * 8,
      0,
      8,
      160,
      -size / 2 + col * cell,
      -size / 2 + shift,
      cell + 0.18,
      size,
    );
  }
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    sM = stateM(elapsed),
    sCT = stateCT(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : quiet);
  if (intro >= 1) {
    paintMBackdrop(p, g, t, sM, at);
  }
  g.save();
  g.lineJoin = 'miter';
  g.lineCap = 'butt';

  const pool = [];
  mForms.forEach((form, i) => {
    const entry = introFor(i, intro, 460);
    if (!entry.active) return;
    pool.push({ kind: 'mesh', i, form, entry, depth: (mRandom(i, 900) - 0.5) * 240 });
  });
  ctPatches.forEach((c) => {
    const entry = introFor(c.id + 2000, intro, 380);
    if (!entry.active) return;
    pool.push({ kind: 'tile', c, entry, depth: (ctR(c.id, 900) - 0.5) * 240 });
  });
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'mesh') {
      const m = at((item.i % 4) * 0.085 + mRandom(item.i, 4) * 0.12);
      const form = [
        item.form[0] + item.entry.dx,
        item.form[1] + item.entry.dy,
        item.form[2] * item.entry.scale,
        item.form[3],
        item.form[4],
      ];
      drawMesh(g, item.i, form, t, sM, m);
    } else {
      const c = item.c,
        m = reactive ? controls.at(t - 0.02 - (c.x / 960) * 0.18) : quiet;
      drawCTTile(
        g,
        { ...c, entryDx: item.entry.dx, entryDy: item.entry.dy, entryScale: item.entry.scale },
        t,
        sCT,
        m,
      );
    }
  }
  g.restore();
  return sCT;
}
