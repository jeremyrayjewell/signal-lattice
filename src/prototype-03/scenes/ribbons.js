import { COLORS as C, begin } from '../shared.js';

export function draw(p, { t, at, params }) {
  begin(p);
  // Five substantial, independently articulated streams; fine cross-rungs are secondary.
  for (let band = 0; band < 5; band++) {
    const m = at(band * 0.085);
    const center = (x) =>
      66 +
      band * 100 +
      (38 + 22 * m.slow.bass) * Math.sin(x * 0.005 - t * 0.22 + band * 0.62) +
      18 * Math.sin(x * 0.01 + t * 0.33 + band) +
      (x - 480) * 0.07 * Math.sin(t * 0.07) +
      m.impulse * 8 * Math.sin(x * 0.007 + band * 1.4);
    const half = (x) =>
      (13 + 7 * Math.sin(x * 0.004 + band + t * 0.2) ** 2 + m.fast.mid * 8) * params.spread;
    p.noStroke();
    p.fill(band === 2 ? C.coral : band % 2 ? C.teal : C.paper);
    p.beginShape();
    for (let x = -20; x <= 980; x += 10) p.vertex(x, center(x) - half(x));
    for (let x = 980; x >= -20; x -= 10) p.vertex(x, center(x) + half(x));
    p.endShape(p.CLOSE);
    p.noFill();
    p.stroke(C.ink);
    p.strokeWeight(2.2);
    p.beginShape();
    for (let x = -20; x <= 980; x += 10) p.vertex(x, center(x));
    p.endShape();
    for (let segment = 0; segment < 9; segment++) {
      const x = 15 + segment * 118 + 14 * Math.sin(t * 0.75 + band + segment * 0.45);
      const y = center(x),
        h = half(x);
      p.stroke(C.ink);
      p.strokeWeight(2 + m.residue * 2);
      p.line(x - 5, y - h * 0.8, x + 5 + m.fast.high * 9 * params.activity, y + h * 0.8);
    }
  }
}
