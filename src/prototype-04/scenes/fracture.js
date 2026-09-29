import { COLORS as C, begin } from '../shared.js';
// A single monumental diamond, cut into eight coherent triangular plates.
const rim = [
  [480, 55],
  [710, 115],
  [875, 270],
  [710, 440],
  [480, 490],
  [245, 425],
  [90, 270],
  [255, 115],
];

export function draw(p, { t, at, params }) {
  begin(p);
  for (let i = 0; i < 8; i++) {
    const m = at(i * 0.045),
      a = rim[i],
      b = rim[(i + 1) % 8];
    const cx = (480 + a[0] + b[0]) / 3,
      cy = (270 + a[1] + b[1]) / 3;
    const dx = cx - 480,
      dy = cy - 270,
      norm = Math.hypot(dx, dy);
    const opening =
      (8 + params.deformation * 14 + m.slow.rms * 5) * (1 + 0.35 * Math.sin(t * 0.2 + i * 0.9)) +
      m.impulse * 34;
    const x = (dx / norm) * opening,
      y = (dy / norm) * opening;
    const twist =
      0.028 * params.motion * Math.sin(t * 0.31 + i) + m.fast.mid * 0.035 * Math.sin(i * 2);
    p.push();
    p.translate(cx + x, cy + y);
    p.rotate(twist);
    const points = [
      [480 - cx, 270 - cy],
      [a[0] - cx, a[1] - cy],
      [b[0] - cx, b[1] - cy],
    ];
    // An offset registration contour belongs to each plate and settles with musical memory.
    p.noFill();
    p.stroke(C.coral);
    p.strokeWeight(2 + m.slow.centroid);
    p.beginShape();
    for (const [px, py] of points) p.vertex(px + 4 + m.residue * 12, py - 4 - m.residue * 7);
    p.endShape(p.CLOSE);
    p.fill(i % 3 === 0 ? C.coral : i % 2 ? C.paper : C.teal);
    p.stroke(C.ink);
    p.strokeWeight(4);
    p.beginShape();
    for (const [px, py] of points) p.vertex(px, py);
    p.endShape(p.CLOSE);
    p.stroke(C.ink);
    p.strokeWeight(4 + params.detail * 2);
    const yline = (a[1] - cy) * 0.2 + m.slow.bass * 9;
    p.line(points[0][0] * 0.25, yline, points[1][0] * 0.5, yline + 5 * Math.sin(t * 0.35 + i));
    p.pop();
  }
}
