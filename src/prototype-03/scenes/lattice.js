import { COLORS as C, begin, smooth } from '../shared.js';
import { randomAt } from '../../timing.js';

export function draw(p, { t, at, params }) {
  begin(p);
  // Seventy-two large cells, organized into banks around two generous horizontal voids.
  for (let col = 0; col < 12; col++) {
    const x0 = 45 + col * 79;
    const m = at(col * 0.034);
    const u = col / 11;
    const c1 = 170 + (35 + m.slow.bass * 35) * Math.sin(u * 5.2 - t * 0.18);
    const c2 = 365 + (28 + m.slow.bass * 28) * Math.sin(u * 4.6 + t * 0.13 + 1.3);
    const gap = (28 + 12 * (1 - m.slow.rms)) * params.spread;
    for (let row = 0; row < 6; row++) {
      const phase = randomAt(73129, row * 12 + col) * Math.PI * 2;
      const y0 = 46 + row * 90;
      const presence = smooth((Math.min(Math.abs(y0 - c1), Math.abs(y0 - c2)) - gap) / 35);
      if (presence < 0.03) continue;
      const x = x0 + 5 * Math.sin(t * 0.21 + row) + m.impulse * 5 * Math.cos(phase);
      const y = y0 + 7 * Math.sin(t * 0.19 + col * 0.35);
      p.push();
      p.translate(x, y);
      p.scale(0.7 + 0.3 * presence);
      p.rotate(
        0.16 * Math.sin(t * 0.37 + col * 0.3 + row) + m.fast.mid * 0.32 * Math.sin(phase + t * 0.4),
      );
      p.stroke(row % 3 === 0 && col % 4 === 0 ? C.coral : C.paper);
      p.strokeWeight(2.5);
      for (let layer = 0; layer < 2; layer++) {
        const s = 30 - layer * 10;
        p.beginShape();
        p.vertex(s * 0.35, -s);
        p.vertex(-s, -s);
        p.vertex(-s, s);
        p.vertex(s, s);
        p.vertex(s, -s * 0.3 + 6 * Math.sin(t * 0.7 + phase));
        p.endShape();
        p.stroke(C.teal);
        p.strokeWeight(1.7);
      }
      p.stroke(C.coral);
      p.strokeWeight(3);
      p.line(-23, 0, -14 + m.fast.high * 14 * params.activity, 0);
      p.pop();
    }
  }
}
