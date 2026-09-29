// Hybrid of Scene BG ("Radial Cell Grid", mine, prototype-57) and Scene CA
// (Codex, prototype-77, split-cell lane bundles) for segment 6. BG's
// drifting grid cells and CA's fixed population of lane bundles are merged
// into one array, tagged and depth-sorted together every frame, drawn in a
// single shared loop.
import { randomAt, introFor } from '../timing.js';
import { stateAt } from '../prototype-57/states.js';

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

// ---- BG's own population (drifting radial-line cell grid) ----
const bgS = 540,
  bgG = bgS / 4;
const bgCp = ['#D6CEC5', '#DF2364', '#F1A349', '#89317C', '#DA5D72', '#8FA8AE', '#27223C'];
const bgCache = new Map();
function bgConf(h, e) {
  const key = h * 512 + e + 64,
    hit = bgCache.get(key);
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
      nr: bgG / 2 + (r(b + 2) * bgG) / 2,
      ph: r(b + 3) * TAU,
    };
  });
  const bc = r(400) < 0.5;
  const scribbles = Array.from({ length: 15 }, (_, k) => {
    const b = 410 + k * 10;
    return {
      pts: [
        [r(b) * bgG - bgG / 2, r(b + 1) * bgG - bgG / 2],
        [r(b + 2) * bgG - bgG / 2, r(b + 3) * bgG - bgG / 2],
        [r(b + 4) * bgG - bgG / 2, r(b + 5) * bgG - bgG / 2],
        [r(b + 6) * bgG - bgG / 2, r(b + 7) * bgG - bgG / 2],
      ],
      useCa: r(b + 8) < 0.5,
      w: 1 + r(b + 9) * (bgG / 20 - 1),
      dash: r(b + 8) < 0.4,
      ph: r(b + 9) * TAU,
    };
  });
  const sv = [2, 4][Math.floor(r(560) * 2)],
    sg = bgG / sv,
    cells = [];
  for (let i = 0; i < sv; i++)
    for (let j = 0; j < sv; j++) {
      const b = 570 + (i * sv + j) * 3;
      if (r(b) < 0.5)
        cells.push({
          x: -bgG / 2 + sg / 2 + i * sg,
          y: -bgG / 2 + sg / 2 + j * sg,
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
  if (bgCache.size > 8000) bgCache.clear();
  bgCache.set(key, c);
  return c;
}
function bgPaintCell(g, c, t, m, ph, k) {
  if (k <= 0.004) return;
  g.globalAlpha = k;
  g.fillStyle = bgCp[c.ca];
  g.fillRect(-bgG / 2, -bgG / 2, bgG, bgG);
  g.save();
  g.rotate(c.rot + c.spin * t);
  g.strokeStyle = bgCp[c.cb];
  for (const ln of c.lines) {
    const wob = 0.15 * Math.sin(t * 0.7 + ln.ph) * (1 + 0.6 * m.fast.high),
      a1 = ln.a + ln.aa * (1 + wob),
      a2 = -ln.a + ln.ab * (1 + wob);
    const nr = (ln.nr * (1 + 0.08 * m.slow.bass)) / 2;
    g.lineWidth = Math.max(0.3, (ln.a / Math.PI) * (bgG / 10) * (1 + 0.3 * m.impulse));
    g.beginPath();
    g.moveTo(Math.cos(a1) * nr, Math.sin(a1) * nr);
    g.lineTo(Math.cos(a2) * nr, Math.sin(a2) * nr);
    g.stroke();
  }
  const tone = c.bc ? '#ffffff' : '#000000';
  for (const scr of c.scribbles) {
    g.strokeStyle = scr.useCa ? bgCp[c.ca] : tone;
    g.lineWidth = scr.w;
    g.setLineDash(scr.dash ? [1, scr.w * 3] : []);
    const wx = 6 * Math.sin(t * 0.9 + scr.ph) * (1 + 0.4 * m.fast.rms),
      wy = 6 * Math.cos(t * 0.8 + scr.ph * 1.3);
    const p = scr.pts;
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

// ---- CA's own population (split-cell lane bundles) ----
const caR = (i, k) => randomAt(70577, i * 229 + k);
const caPalette = ['#20BF55', '#0B4F6C', '#01BAEF', '#FBFBFF', '#757575'];
const caBundles = [];
for (let row = 0; row < 7; row++)
  for (let col = 0; col < 12; col++) {
    const cell = row * 12 + col,
      split = caR(cell, 0) > 0.46 ? 2 : 1,
      size = 80 / split;
    for (let y = 0; y < split; y++)
      for (let x = 0; x < split; x++) {
        const id = caBundles.length;
        caBundles.push({
          id,
          x: col * 80 + (x + 0.5) * size,
          y: row * 80 + (y + 0.5) * size - 10,
          size,
          phase: caR(id, 2) * TAU,
          angle: (Math.floor(caR(id, 3) * 4) * Math.PI) / 2 + (caR(id, 4) - 0.5) * 0.65,
          guide: Array.from(
            { length: 5 },
            (_, k) =>
              (k / 4 - 0.5) * (caR(id, 10) - 0.5) * 0.5 +
              Math.sin((k / 4) * Math.PI) * (caR(id, 11) - 0.5) * 0.65 +
              Math.sin((k / 4) * TAU) * (caR(id, 12) - 0.5) * 0.22,
          ),
          lanes: Array.from({ length: 20 }, (_, k) => ({
            color: caPalette[Math.floor(caR(id, k + 20) * 5)],
            width: 0.035 + caR(id, k + 40) * 0.06,
            offset: (caR(id, k + 60) - 0.5) * 0.24,
            phase: caR(id, k + 80) * TAU,
            jitter: Array.from({ length: 5 }, (_, j) => (caR(id, k * 5 + j + 100) - 0.5) * 0.09),
          })),
        });
      }
  }
function caBundle(g, b, t, m, s, e) {
  const angle =
    b.angle +
    0.28 * Math.sin(t * 0.43 + b.phase) * (1 + s.motion * 0.35) +
    m.slow.mid * 0.16 * Math.sin(b.phase);
  const breathing = 1 + 0.055 * Math.sin(t * 0.61 + b.phase) + m.slow.bass * 0.06;
  g.save();
  g.translate(
    b.x + e.dx + 4 * Math.sin(t * 0.37 + b.phase),
    b.y + e.dy + 4 * Math.cos(t * 0.41 + b.phase),
  );
  g.rotate(angle);
  g.scale(b.size * e.scale * breathing, b.size * e.scale * breathing);
  const guide = b.guide.map(
    (v, k) =>
      v +
      0.085 * Math.sin(t * 0.71 + b.phase + k * 0.92) * (1 + s.motion * 0.4 + m.slow.bass * 0.45),
  );
  for (const lane of b.lanes) {
    const spread = 1 + 0.2 * Math.sin(t * 0.59 + lane.phase) + m.impulse * s.impulse * 0.4;
    g.strokeStyle = lane.color;
    g.lineWidth = lane.width * (1 + m.fast.rms * 0.13);
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const x = -0.44 + k * 0.22 + 0.02 * Math.sin(t * 0.67 + lane.phase + k);
      const y =
        guide[k] +
        lane.offset * spread +
        lane.jitter[k] +
        0.022 * Math.sin(t * 0.93 + lane.phase + k * 0.7);
      if (k === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) p.background('#ffffff');
  const ox = -(t * 10 + 16 * Math.sin(t * 0.1) * (0.5 + 0.5 * s.motion)),
    oy = -(t * 6.5 + 12 * Math.sin(t * 0.08 + 1) * (0.5 + 0.5 * s.motion));
  const c0 = Math.floor(-ox / bgG) - 1,
    c1 = Math.ceil((W - ox) / bgG),
    r0 = Math.floor(-oy / bgG) - 1,
    r1 = Math.ceil((H - oy) / bgG);
  g.save();
  g.lineCap = 'square';
  g.lineJoin = 'bevel';

  const pool = [];
  for (let col = c0; col <= c1; col++)
    for (let row = r0; row <= r1; row++) {
      const h = (col + 3000) * 8192 + row + 3000;
      const e = introFor((((col % 10) + 10) % 10) * 6 + (((row % 6) + 6) % 6), intro, 360);
      if (!e.active) continue;
      const x = col * bgG + bgG / 2 + ox,
        y = row * bgG + bgG / 2 + oy;
      pool.push({ kind: 'cell', h, x, y, e, depth: (randomAt(11570, h * 4 + 900) - 0.5) * 240 });
    }
  for (const b of caBundles) {
    const e = introFor(1000 + b.id, intro, 390);
    if (!e.active) continue;
    pool.push({ kind: 'bundle', b, e, depth: (caR(b.id, 900) - 0.5) * 240 });
  }
  pool.sort((a, b) => a.depth - b.depth);

  for (const item of pool) {
    if (item.kind === 'cell') {
      const { h, x, y, e } = item;
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
        g.fillRect(-bgG / 2, -bgG / 2, bgG, bgG);
      }
      g.save();
      g.beginPath();
      g.rect(-bgG / 2, -bgG / 2, bgG, bgG);
      g.clip();
      bgPaintCell(g, bgConf(h, ep - 1), t, m, off, 1 - ease(fr / 0.16));
      bgPaintCell(g, bgConf(h, ep), t, m, off, ease(fr / 0.3));
      g.restore();
      g.restore();
    } else {
      const { b, e } = item,
        m = reactive ? controls.at(t - 0.02 - (b.x / 960) * 0.16) : quiet;
      caBundle(g, b, t, m, s, e);
    }
  }
  g.restore();
  return s;
}
