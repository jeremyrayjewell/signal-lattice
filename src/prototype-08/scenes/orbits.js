import { COLORS as C, begin } from '../shared.js';

export function draw(p, { t, at, params }) {
  begin(p);
  const centers = [
    [325, 274, 154],
    [728, 181, 95],
    [770, 419, 58],
  ];
  p.stroke(C.faint);
  p.strokeWeight(3);
  p.line(325, 274, 728, 181);
  p.line(728, 181, 770, 419);
  centers.forEach(([cx, cy, base], group) => {
    const m = at(group * 0.16);
    const x = cx + 32 * params.deformation * Math.sin(t * 0.31 + group * 2);
    const y = cy + 30 * params.deformation * Math.cos(t * 0.37 + group);
    const radius = base * params.spread;
    p.push();
    p.translate(x, y);
    p.drawingContext.globalAlpha = group === 0 ? 1 : 0.25 + 0.75 * params.detail;
    for (let ring = 0; ring < 3; ring++) {
      const r = radius + ring * (10 + 17 * params.detail) + m.slow.bass * (ring + 1) * 4;
      const start = t * (0.35 + ring * 0.17) * (ring % 2 ? -1 : 1) + group * 1.7 + m.slow.mid * 0.6;
      p.noFill();
      p.stroke(ring === 1 ? C.teal : C.paper);
      p.strokeWeight(ring === 0 ? 8 + m.slow.rms * 2 + m.slow.centroid : 4);
      const flatten = 0.72 + 0.24 * Math.sin(t * 0.43 + ring + group);
      p.push();
      p.rotate(0.3 * Math.sin(t * 0.27 + ring));
      p.arc(
        0,
        0,
        r * 2,
        r * 2 * flatten,
        start,
        start + Math.PI * (1.1 + 0.45 * Math.sin(t * 0.47 + ring)),
      );
      for (let tick = 0; tick < 12; tick++) {
        const a = start + tick * 0.22;
        const rr = r + 12 + 8 * Math.sin(t * 0.7 + tick);
        p.stroke(tick % 4 ? C.teal : C.coral);
        p.strokeWeight(tick % 4 ? 2 : 5);
        p.line(
          Math.cos(a) * rr,
          Math.sin(a) * rr * flatten,
          Math.cos(a) * (rr + 7 + m.residue * 10),
          Math.sin(a) * (rr + 7 + m.residue * 10) * flatten,
        );
      }
      p.pop();
      for (let k = 0; k < 4; k++) {
        const a = start + (k * Math.PI) / 2 + m.fast.mid * 0.22 * Math.sin(k + group);
        p.noStroke();
        p.fill(k === 0 ? C.coral : C.teal);
        const orbit = r + (k === 0 ? m.impulse * 12 * params.detail : 0);
        if (k % 2) p.rect(Math.cos(a) * orbit, Math.sin(a) * orbit, 9 + ring * 3, 5 + group * 3);
        else p.circle(Math.cos(a) * orbit, Math.sin(a) * orbit, 9 + (k === 0 ? m.residue * 14 : 0));
      }
    }
    p.noStroke();
    p.fill(C.coral);
    const core = radius * 0.48;
    p.circle(0, 0, core * 2);
    p.fill(C.ink);
    p.circle(core * 0.22 * Math.sin(t * 0.41 + group), 0, core * 1.45);
    p.stroke(C.paper);
    p.strokeWeight(2);
    p.line(-core * 0.35, 0, core * 0.35, 0);
    p.pop();
  });
}
