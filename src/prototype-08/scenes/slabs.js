import { COLORS as C, begin } from '../shared.js';

export function draw(p, { t, at, params }) {
  begin(p);
  // Seven large architectural piers; the skyline, voids and ledges carry the composition.
  for (let i = 0; i < 7; i++) {
    const m = at((6 - i) * 0.07);
    const x = 43 + i * 127;
    const width = 68 + (i % 3) * 10 + 13 * Math.sin(t * 0.45 + i);
    const height =
      (130 +
        170 * (0.5 + 0.5 * Math.sin(i * 0.85 + t * 0.44)) +
        m.slow.bass * 65 +
        m.slow.rms * 10) *
      params.spread;
    const base = 423 + 44 * params.motion * Math.sin(t * 0.32 + i * 0.6);
    const lean =
      24 * params.deformation * Math.sin(t * 0.51 + i) +
      m.slow.mid * 20 * Math.sin(i * 1.2) +
      m.impulse * 12 * Math.cos(i);
    p.push();
    p.translate(x, base);
    p.noStroke();
    p.fill(i === 2 || i === 5 ? C.coral : i % 2 ? C.teal : C.paper);
    p.beginShape();
    p.vertex(0, 0);
    p.vertex(width, 0);
    p.vertex(width + lean, -height + 37);
    p.vertex(width * 0.65 + lean, -height + 37);
    p.vertex(width * 0.65 + lean, -height);
    p.vertex(lean, -height);
    p.endShape(p.CLOSE);
    p.fill(C.ink);
    p.rect(17 + lean * 0.4, -height * 0.75, width * 0.35, height * 0.57);
    for (let tier = 0; tier < 3 + (i % 3); tier++) {
      const yy = (-height * (tier + 1)) / (4 + (i % 3));
      const slide = 12 * Math.sin(t * 0.8 + i + tier) + m.impulse * 8 * Math.cos(tier);
      p.fill(tier % 2 ? C.teal : C.paper);
      p.rect(slide - 7, yy, width + 14, 7 + (tier % 2) * 5);
      p.fill(C.ink);
      p.rect(width * 0.62, yy - 12, 8, 12);
    }
    p.noFill();
    p.stroke(C.coral);
    p.strokeWeight(2);
    p.rect(-5 + lean, -height - 32 - 15 * Math.sin(t * 0.7 + i), width * 0.65, 18);
    p.stroke(C.ink);
    p.strokeWeight(4);
    const shelf = -height * (0.32 + 0.1 * Math.sin(t * 0.37 + i));
    p.line(0, shelf, width, shelf + m.fast.mid * 12);
    p.stroke(C.paper);
    p.strokeWeight(2 + m.slow.centroid);
    p.line(
      width + 8,
      -height * 0.2,
      width + 8,
      -height * 0.2 - 20 - 25 * m.residue * params.detail,
    );
    p.pop();
  }
  p.stroke(C.teal);
  p.strokeWeight(2);
  p.line(36, 506, 924, 506);
}
