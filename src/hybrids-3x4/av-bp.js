// Hybrid of Scene AV (prototype-46, Codex) and Scene BP (prototype-66,
// "Chevron Weave") for segment 6. AV's 48 wrapped-field panels, BP's grid
// cells (a staggered brick, each column with its own drifting offset), and
// BP's 70 overlay thread loops are merged into one array, tagged and depth-
// sorted together every frame, drawn in a single shared loop. AV's own
// cached tiled wallpaper (a CanvasPattern, no per-element structure) is used
// as the shared background in place of BP's plain black fill.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-46/states.js';

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
const smooth = (q) => q * q * (3 - 2 * q);
function vn(seed, x) {
  const i = Math.floor(x),
    f = x - i,
    a = randomAt(seed, i) * 2 - 1,
    b = randomAt(seed, i + 1) * 2 - 1;
  return mix(a, b, smooth(f));
}

// ---- AV's own population ----
const AV_R = (id, k) => randomAt(50446, id * 701 + k);
const colors = [
  '#059aa5',
  '#087585',
  '#ecae23',
  '#b76237',
  '#083f50',
  '#10151c',
  '#bb501f',
  '#739d62',
  '#60291c',
  '#aaa34c',
];
let wallpaper;
function retroBackground(g) {
  if (!wallpaper) {
    const tile = document.createElement('canvas');
    tile.width = 64;
    tile.height = 64;
    const ctx = tile.getContext('2d');
    ctx.fillStyle = '#bdcdbb';
    ctx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 2)
      for (let x = 0; x < 64; x += 2) {
        const n = AV_R(y * 32 + x / 2, 2700);
        ctx.fillStyle = n < 0.34 ? '#91afa4' : n < 0.67 ? '#eee6c9' : '#b0c3ac';
        ctx.fillRect(x, y, 1, 1);
      }
    for (let y = 0; y < 64; y += 16)
      for (let x = 0; x < 64; x += 16) {
        if ((x + y) % 32 === 0) {
          ctx.fillStyle = '#5d887f';
          ctx.fillRect(x + 7, y + 4, 2, 8);
          ctx.fillRect(x + 4, y + 7, 8, 2);
          ctx.fillStyle = '#fff1d4';
          ctx.fillRect(x + 9, y + 6, 1, 8);
          ctx.fillRect(x + 6, y + 9, 8, 1);
        } else {
          ctx.fillStyle = '#a18b56';
          ctx.fillRect(x + 5, y + 5, 3, 3);
          ctx.fillRect(x + 8, y + 8, 3, 3);
        }
      }
    const enlarged = document.createElement('canvas');
    enlarged.width = 128;
    enlarged.height = 128;
    const scaled = enlarged.getContext('2d');
    scaled.imageSmoothingEnabled = false;
    scaled.drawImage(tile, 0, 0, 128, 128);
    wallpaper = g.createPattern(enlarged, 'repeat');
  }
  g.save();
  g.fillStyle = wallpaper;
  g.fillRect(0, 0, 960, 540);
  g.restore();
}
const avPanels = Array.from({ length: 48 }, (_, id) => {
  const n = [5, 8, 13, 21][Math.floor(AV_R(id, 0) * 4)],
    size = 100 + AV_R(id, 1) * 140;
  const marks = [];
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      const k = row * n + col;
      marks.push({
        x: (col + 0.5) / n - 0.5,
        y: (row + 0.5) / n - 0.5,
        phase: AV_R(id, k + 30) * TAU,
        color:
          AV_R(id, k + 500) > 0.68
            ? Math.floor(AV_R(id, k + 1000) * colors.length)
            : Math.floor(AV_R(id, 4) * colors.length),
        width: 0.06 + AV_R(id, k + 1500) * 0.2,
        dashed: AV_R(id, k + 2000) > 0.48,
      });
    }
  return {
    id,
    n,
    size,
    marks,
    x: AV_R(id, 2) * 1100 - 70,
    y: AV_R(id, 3) * 680 - 70,
    phase: AV_R(id, 5) * TAU,
    paper: AV_R(id, 6) > 0.38,
    shadow: AV_R(id, 7) > 0.35,
  };
});
function avPanel(g, c, t, m, s) {
  const h = c.size / 2,
    pitch = c.size / c.n;
  if (c.paper) {
    g.save();
    if (c.shadow) {
      g.shadowColor = 'rgba(0,0,0,.52)';
      g.shadowBlur = 9;
      g.shadowOffsetX = 3;
      g.shadowOffsetY = 4;
    }
    g.fillStyle = '#ffffff';
    g.fillRect(-h - 3, -h - 3, c.size + 6, c.size + 6);
    g.restore();
  }
  for (const mark of c.marks) {
    const phase = mark.phase;
    const dx = pitch * 0.26 * Math.sin(t * 1.17 + phase + mark.y * 3) * (1 + 0.3 * m.slow.mid);
    const dy = pitch * 0.26 * Math.cos(t * 0.93 + phase + mark.x * 4);
    const xx = mark.x * c.size,
      yy = mark.y * c.size;
    const length = pitch * (0.72 + 0.22 * Math.sin(t * 0.72 + phase) + 0.08 * m.residue);
    g.strokeStyle = colors[mark.color];
    g.lineWidth = Math.max(0.4, pitch * mark.width) * (1 + 0.1 * m.fast.rms);
    g.setLineDash(
      mark.dashed ? [Math.max(0.6, g.lineWidth * 0.65), Math.max(1, g.lineWidth * 1.8)] : [],
    );
    g.lineDashOffset = -t * (3 + pitch * 0.2) - m.fast.high * 1.4;
    g.beginPath();
    g.moveTo(xx + dx, yy - length / 2);
    g.lineTo(xx + dx, yy + length / 2);
    g.stroke();
    g.lineWidth = Math.max(0.4, pitch * (0.28 - mark.width * 0.6)) * (1 + 0.12 * m.fast.centroid);
    g.beginPath();
    g.moveTo(xx - length / 2, yy + dy);
    g.lineTo(xx + length / 2, yy + dy);
    g.stroke();
  }
}

// ---- BP's own populations ----
const S = 540,
  G = S / 8;
const bpColOff = new Map();
function bpColumnOffset(col, t) {
  const key = col;
  let base = bpColOff.get(key);
  if (base === undefined) {
    base = (randomAt(11601, ((col % 4000) + 4000) % 4000) * 2 - 1) * G;
    bpColOff.set(key, base);
    if (bpColOff.size > 4000) bpColOff.clear();
  }
  return base + G * 0.25 * Math.sin(t * 0.08 + col * 0.7);
}
function bpConf(h, e) {
  const key = h * 512 + e + 64,
    r = (k) => randomAt(11600, key * 60 + k);
  const bg = r(0) < 0.5 ? '#000000' : '#ffffff',
    rot = (Math.floor(r(1) * 4) * Math.PI) / 2,
    scale = r(2) < 0.5 ? 0.8 : 1,
    pinwheel = r(3) < 0.5;
  const mc = Math.floor(r(4) * 5);
  const cp = ['#385533', '#BDAE6F', '#5C8899', '#BD8718', '#6C2424'];
  if (pinwheel) {
    const pick = (k) => (r(k) < 0.6 ? mc : Math.floor(r(k + 1) * 5));
    return {
      cp,
      bg,
      rot,
      scale,
      pinwheel: true,
      cols: [pick(10), pick(12), pick(14), pick(16)],
      vj: r(18) < 0.5 ? 1 : 0,
      vk: r(19) < 0.5 ? 1 : 0,
    };
  }
  let ca = Math.floor(r(20) * 5),
    cb = Math.floor(r(21) * 5);
  if (cb === ca) cb = (cb + 1) % 5;
  const innerCol = r(22) < 0.5 ? ca : cb;
  return { cp, bg, rot, scale, pinwheel: false, ca, cb, innerCol };
}
function bpPaintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k * 0.85;
  g.save();
  g.rotate(c.rot);
  const sc = c.scale * (1 + 0.04 * Math.sin(t * 0.7 + ph));
  g.scale(sc, sc);
  if (c.pinwheel) {
    const tris = [
      [
        [-G / 2, -G / 2],
        [-G / 2, G / 2],
        [-G / 3, -G / 2],
      ],
      [
        [-G / 3, -G / 2],
        [G / 2, G / 2],
        [0, -G / 2],
      ],
      [
        [0, -G / 2],
        [G / 2, c.vj ? G / 3 : 0],
        [G / 2, -G / 2],
      ],
      [
        [-G / 2, G / 2],
        [c.vk ? -G / 3 : 0, 0],
        [G / 2, G / 2],
      ],
    ];
    for (let i = 0; i < 4; i++) {
      g.fillStyle = c.cp[c.cols[i]];
      const p = tris[i];
      g.beginPath();
      g.moveTo(p[0][0], p[0][1]);
      g.lineTo(p[1][0], p[1][1]);
      g.lineTo(p[2][0], p[2][1]);
      g.closePath();
      g.fill();
    }
  } else {
    const R = (G / 2) * (1 + 0.06 * Math.sin(t * 0.8 + ph) + 0.1 * m.slow.bass);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, R);
    const n = parseInt(c.cp[c.cb].slice(1), 16);
    grad.addColorStop(0, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},.36)`);
    grad.addColorStop(1, `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)`);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, R, 0, TAU);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(-G / 2, G / 2);
    g.lineTo(0, 0);
    g.lineTo(G / 2, G / 2);
    g.closePath();
    g.fill();
    const z = G / 10;
    g.fillStyle = c.cp[c.innerCol];
    g.beginPath();
    g.moveTo(-G / 2 + z, G / 2);
    g.lineTo(0, z);
    g.lineTo(G / 2 - z, G / 2);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.globalAlpha = 1;
}
function bpLoop(g, seedBase, i, t, m) {
  g.strokeStyle = randomAt(11602, i * 3) < 0.5 ? 'rgba(0,0,0,.7)' : 'rgba(255,255,255,.7)';
  g.lineWidth = 0.6 + randomAt(11602, i * 3 + 1) * (G / 20) + m.fast.centroid * 0.4;
  g.beginPath();
  for (let j = 0; j < 48; j++) {
    const u = (j / 47) * 3 + t * 0.1 + i * 7;
    const px = vn(seedBase + i * 2, u) * W * 0.75,
      py = vn(seedBase + i * 2 + 1, u + 40) * H * 0.85;
    j === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.stroke();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext,
    mBase = reactive ? controls.at(t) : quiet;
  if (intro >= 1) retroBackground(g);
  g.save();
  g.lineCap = 'butt';

  const pool = [];
  for (const c of avPanels) {
    const entry = introFor(c.id, intro, 390);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.18) : quiet;
    const x = c.x + 25 * Math.sin(t * 0.39 + c.phase) + m.slow.bass * 11 * Math.cos(c.phase);
    const y = c.y + 22 * Math.cos(t * 0.47 + c.phase) + m.impulse * s.impulse * 5 * Math.sin(c.id);
    pool.push({
      kind: 'panel',
      c,
      entry,
      x,
      y,
      depth: (AV_R(c.id, 900) - 0.5) * 240 + 18 * Math.sin(t * 0.21 + c.phase),
    });
  }
  const ox = -(t * 9 + 15 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / G) - 1,
    c1 = Math.ceil((W - ox) / G);
  for (let col = c0; col <= c1; col++) {
    const coff = bpColumnOffset(col, t),
      oy = coff - ((t * 5.5) % G);
    const r0 = Math.floor(-oy / G) - 1,
      r1 = Math.ceil((H - oy) / G);
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000,
        e = introFor(1500 + (((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * G + G / 2 + ox,
        y = row * G + G / 2 + oy;
      pool.push({ kind: 'cell', h, e, x, y, depth: (randomAt(11603, h * 4 + 900) - 0.5) * 240 });
    }
  }
  for (let i = 0; i < 70; i++) {
    const e = introFor(2200 + i, intro, 420);
    if (!e.active) continue;
    pool.push({ kind: 'loop', i, e, depth: (randomAt(11602, i * 3 + 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'panel') {
      const { c, entry: e, x, y } = item,
        m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.18) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      avPanel(g, c, t, m, s);
      g.restore();
    } else if (item.kind === 'cell') {
      const { h, e, x, y } = item;
      const P = 4 + randomAt(11603, h * 4 + 1) * 4,
        off = randomAt(11603, h * 4 + 2) * P,
        u = (t + off) / P,
        ep = Math.floor(u),
        fr = u - ep;
      const m = reactive ? controls.at(t - 0.03 - (x / W) * 0.16) : quiet;
      g.save();
      g.translate(x + e.dx, y + e.dy);
      g.scale(e.scale, e.scale);
      g.save();
      g.beginPath();
      g.rect(-G / 2, -G / 2, G, G);
      g.clip();
      bpPaintCell(g, bpConf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      bpPaintCell(g, bpConf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    } else {
      const { i, e } = item;
      g.save();
      g.translate(W / 2 + e.dx, H / 2 + e.dy);
      g.scale(e.scale, e.scale);
      g.translate(-W / 2, -H / 2);
      g.globalCompositeOperation = 'overlay';
      bpLoop(g, 11604, i, t, mBase);
      g.globalCompositeOperation = 'source-over';
      g.restore();
    }
  }
  g.restore();
  return s;
}
