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
    const x = cx + 17 * Math.sin(t * 0.11 + group * 2);
    const y = cy + 19 * Math.cos(t * 0.13 + group);
    const radius = base * params.spread;
    p.push();
    p.translate(x, y);
    for (let ring = 0; ring < 3; ring++) {
      const r = radius + ring * 20 + m.slow.bass * (ring + 1) * 4;
      const start = t * (0.1 + ring * 0.04) * (ring % 2 ? -1 : 1) + group * 1.7 + m.slow.mid * 0.4;
      p.noFill();
      p.stroke(ring === 1 ? C.teal : C.paper);
      p.strokeWeight(ring === 0 ? 9 + m.slow.rms * 2 : 4);
      p.arc(0, 0, r * 2, r * 2, start, start + Math.PI * (1.3 + 0.25 * Math.sin(t * 0.17 + ring)));
      for (let k = 0; k < 4; k++) {
        const a = start + (k * Math.PI) / 2 + m.fast.mid * 0.22 * Math.sin(k + group);
        p.noStroke();
        p.fill(k === 0 ? C.coral : C.teal);
        const orbit = r + (k === 0 ? m.impulse * 12 * params.activity : 0);
        p.circle(Math.cos(a) * orbit, Math.sin(a) * orbit, 9 + (k === 0 ? m.residue * 14 : 0));
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
