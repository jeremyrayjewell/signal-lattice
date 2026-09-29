import { background, color, TAU } from '../paint.js';
export function anchors({ t, at, params }) {
  return [
    [130, 100],
    [435, 95],
    [795, 135],
    [175, 340],
    [490, 285],
    [810, 380],
    [470, 475],
  ].map(([x, y], i) => {
    const m = at(i * 0.08);
    return [
      x + (35 + 35 * m.slow.bass) * params.deformation * Math.sin(t * 0.41 + i * 1.7),
      y + 40 * Math.sin(t * 0.37 + i) + m.impulse * 9,
    ];
  });
}
export function draw(p, ctx, { collapse = 0, clear = true } = {}) {
  const g = clear ? background(p, '#100d24') : p.drawingContext;
  const { t, at, params } = ctx,
    remain = 1 - collapse;
  anchors(ctx).forEach(([x, y], i) => {
    const m = at(i * 0.08);
    g.save();
    g.translate(x, y);
    g.scale(remain, remain);
    const bend = (70 + 50 * m.slow.bass) * Math.sin(t * 0.49 + i);
    for (let strand = 0; strand < 6 + (i % 3); strand++) {
      const off = (strand - 3) * (5 + 3 * Math.sin(t * 0.51 + i)),
        end = 75 * Math.sin(t * 0.36 + i * 1.9);
      g.beginPath();
      g.moveTo(-x - 35, 80 + i * 57 - y + off);
      g.bezierCurveTo(-260, -140 + bend + off, -130, 100 - bend + off, 0, off);
      g.bezierCurveTo(150, -150 + bend - off, 260, 120 + end, 1020 - x, 490 - i * 59 - y + off);
      g.strokeStyle = color('E', i + strand);
      g.lineWidth = strand === 2 ? 4.5 : 1.4 + params.detail;
      g.stroke();
      if (strand % 3 === 0) {
        // Looping offshoots with their own orientation, rather than identical end-to-end lines.
        g.beginPath();
        g.moveTo(0, off);
        g.bezierCurveTo(100, -180 + end, -170, -140 - bend, -90 + end, 25 + off);
        g.bezierCurveTo(-20, 90 + bend, 90, 50, 170 + end, -60);
        g.lineWidth = 1.3;
        g.stroke();
      }
    }
    for (let bead = 0; bead < 3; bead++) {
      const a = t * (0.7 + bead * 0.1) + i + bead * 2,
        r = 18 + bead * 12;
      g.fillStyle = color('E', i + bead + 4);
      g.beginPath();
      g.arc(Math.cos(a) * r, Math.sin(a) * r * 0.6, 3 + m.residue * 4, 0, TAU);
      g.fill();
    }
    g.restore();
  });
}
