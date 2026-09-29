import { COLORS as C, begin } from '../shared.js';

export function draw(p, { t, at, params }) {
  begin(p);
  // Five substantial, independently articulated streams; fine cross-rungs are secondary.
  for (let band = 0; band < 5; band++) {
    const m = at(band * 0.085);
    const center = (x) =>
      66 +
      band * 100 +
      (40 + 28 * m.slow.bass) * params.deformation * Math.sin(x * 0.005 - t * 0.6 + band * 0.92) +
      28 * params.motion * Math.sin(x * 0.01 + t * 0.53 + band) +
      (x - 480) * 0.1 * Math.sin(t * 0.17 + band) +
      m.impulse * 8 * Math.sin(x * 0.007 + band * 1.4);
    const half = (x) =>
      (10 +
        band * 2 +
        16 * Math.sin(x * 0.004 + band + t * 0.5) ** 2 +
        m.fast.mid * 8 +
        m.slow.rms * 2) *
      params.spread;
    p.noStroke();
    p.fill(band === 2 ? C.coral : band % 2 ? C.teal : C.paper);
    p.beginShape();
    for (let x = -20; x <= 980; x += 10) p.vertex(x, center(x) - half(x));
    for (let x = 980; x >= -20; x -= 10) p.vertex(x, center(x) + half(x));
    p.endShape(p.CLOSE);
    p.noFill();
    p.stroke(C.ink);
    p.strokeWeight(1.7 + m.slow.centroid * 0.7);
    p.beginShape();
    for (let x = -20; x <= 980; x += 10) p.vertex(x, center(x));
    p.endShape();
    // Unequal internal lanes open and close along each stream.
    for (let lane = 0; lane < 2; lane++) {
      p.stroke(lane ? C.paper : C.ink);
      p.strokeWeight(lane ? 1.2 : 4);
      p.beginShape();
      for (let x = -20; x <= 980; x += 10)
        p.vertex(x, center(x) + half(x) * 0.55 * Math.sin(x * 0.009 - t * 0.8 + band + lane));
      p.endShape();
    }
    for (let segment = 0; segment < 9; segment++) {
      const x = 15 + segment * 118 + 40 * Math.sin(t * 1.05 + band + segment * 0.45);
      const y = center(x),
        h = half(x);
      p.stroke(C.ink);
      p.strokeWeight(2 + m.residue * 2);
      p.line(x - 5, y - h * 0.8, x + 5 + m.fast.high * 9 * params.detail, y + h * 0.8);
      if (segment % 3 === band % 3) {
        p.noStroke();
        p.fill(C.ink);
        p.ellipse(x, y, 16 + band * 3, h * 0.8);
      }
    }
  }
}
