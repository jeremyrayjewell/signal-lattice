import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(50446, id * 701 + k);
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
const quiet = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
let wallpaper;
function retroBackground(g) {
  if (!wallpaper) {
    const tile = document.createElement('canvas');
    tile.width = 64;
    tile.height = 64;
    const ctx = tile.getContext('2d');
    ctx.fillStyle = '#bdcdbb';
    ctx.fillRect(0, 0, 64, 64);
    // Deliberately small, repeating pixels evoke a tiled GIF-era webpage background.
    for (let y = 0; y < 64; y += 2)
      for (let x = 0; x < 64; x += 2) {
        const n = R(y * 32 + x / 2, 2700);
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
const panels = Array.from({ length: 48 }, (_, id) => {
  const n = [5, 8, 13, 21][Math.floor(R(id, 0) * 4)],
    size = 100 + R(id, 1) * 140;
  const marks = [];
  for (let row = 0; row < n; row++)
    for (let col = 0; col < n; col++) {
      const k = row * n + col;
      marks.push({
        x: (col + 0.5) / n - 0.5,
        y: (row + 0.5) / n - 0.5,
        phase: R(id, k + 30) * TAU,
        color:
          R(id, k + 500) > 0.68
            ? Math.floor(R(id, k + 1000) * colors.length)
            : Math.floor(R(id, 4) * colors.length),
        width: 0.06 + R(id, k + 1500) * 0.2,
        dashed: R(id, k + 2000) > 0.48,
      });
    }
  return {
    id,
    n,
    size,
    marks,
    x: R(id, 2) * 1100 - 70,
    y: R(id, 3) * 680 - 70,
    phase: R(id, 5) * TAU,
    paper: R(id, 6) > 0.38,
    shadow: R(id, 7) > 0.35,
  };
});
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) retroBackground(g);
  g.save();
  g.lineCap = 'butt';
  for (const c of panels) {
    const entry = introFor(c.id, intro, 390);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.025 - (c.x / 960) * 0.18) : quiet;
    const x = c.x + 25 * Math.sin(t * 0.39 + c.phase) + m.slow.bass * 11 * Math.cos(c.phase);
    const y = c.y + 22 * Math.cos(t * 0.47 + c.phase) + m.impulse * s.impulse * 5 * Math.sin(c.id);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale, entry.scale);
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
    g.restore();
  }
  g.restore();
  return s;
}
