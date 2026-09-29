import { randomAt } from '../timing.js';

const W = 960,
  H = 540,
  COLS = 20,
  ROWS = 12;
const random = (i, k) => randomAt(310821, i * 31 + k);
const vertices = Array.from({ length: (COLS + 1) * (ROWS + 1) }, (_, i) => {
  const col = i % (COLS + 1),
    row = Math.floor(i / (COLS + 1));
  return {
    x: (col * W) / COLS + (col > 0 && col < COLS ? (random(i, 0) - 0.5) * 32 : 0),
    y: (row * H) / ROWS + (row > 0 && row < ROWS ? (random(i, 1) - 0.5) * 28 : 0),
    phase: random(i, 2) * Math.PI * 2,
    rate: 2.8 + random(i, 3) * 2.6,
  };
});
let grain;
function paperGrain() {
  if (grain) return grain;
  grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const g = grain.getContext('2d');
  for (let i = 0; i < 14000; i++) {
    const x = random(i, 5) * W,
      y = random(i, 6) * H;
    g.strokeStyle = i % 2 ? 'rgba(94,79,57,.045)' : 'rgba(255,255,248,.17)';
    g.lineWidth = 0.45;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + random(i, 7) * 3.5, y + (random(i, 8) - 0.5) * 1.5);
    g.stroke();
  }
  return grain;
}
export function drawPaperBackground(g, t) {
  g.save();
  g.fillStyle = '#eee9df';
  g.fillRect(0, 0, W, H);
  // A fixed irregular mesh flexes in height: fast continuous creasing, no random frame flicker.
  const mesh = vertices.map((v) => ({
    ...v,
    z: 9 * Math.sin(t * v.rate + v.phase) + 4 * Math.sin(t * 1.7 + v.x * 0.017 - v.y * 0.012),
  }));
  function facet(a, b, c) {
    const ux = b.x - a.x,
      uy = b.y - a.y,
      uz = b.z - a.z;
    const vx = c.x - a.x,
      vy = c.y - a.y,
      vz = c.z - a.z;
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    nx /= len;
    ny /= len;
    nz /= len;
    const light = Math.max(-1, Math.min(1, -nx * 0.45 - ny * 0.55 + nz * 0.7));
    const tone = Math.round(207 + light * 42);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.lineTo(c.x, c.y);
    g.closePath();
    g.fillStyle = `rgb(${Math.min(253, tone + 5)},${Math.min(249, tone + 1)},${tone - 7})`;
    g.fill();
    // Narrow soft creases along the edges make the facets read as folded paper.
    const dx = b.x - a.x,
      dy = b.y - a.y,
      d = Math.hypot(dx, dy),
      width = 3.2;
    const grad = g.createLinearGradient(
      a.x - (dy / d) * width,
      a.y + (dx / d) * width,
      a.x + (dy / d) * width,
      a.y - (dx / d) * width,
    );
    const shade = 0.025 + Math.abs(a.z - b.z) * 0.0018;
    grad.addColorStop(0, 'rgba(90,76,55,0)');
    grad.addColorStop(0.45, `rgba(90,76,55,${shade})`);
    grad.addColorStop(0.6, 'rgba(255,255,250,.15)');
    grad.addColorStop(1, 'rgba(255,255,250,0)');
    g.strokeStyle = grad;
    g.lineWidth = width * 2;
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
  }
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const i = row * (COLS + 1) + col,
        a = mesh[i],
        b = mesh[i + 1],
        c = mesh[i + COLS + 1],
        d = mesh[i + COLS + 2];
      if ((row + col) % 2) {
        facet(a, b, c);
        facet(b, d, c);
      } else {
        facet(a, b, d);
        facet(a, d, c);
      }
    }
  g.drawImage(paperGrain(), 0, 0);
  g.restore();
}
