import { COLORS as C, begin } from '../shared.js';

export function draw(p, { t, at, params }) {
  begin(p);
  // Two off-screen origins, opposed directional fans, no concentric ring structure.
  for (let group = 0; group < 2; group++) {
    const m = at(group * 0.21);
    const ox = group ? 990 : -60,
      oy = group ? 60 : 500;
    const center = group ? Math.PI * 0.81 : -0.44;
    for (let ray = 0; ray < 9; ray++) {
      const phase = ray * 0.6 + group * 2;
      const spread = 0.085 + params.spread * 0.021;
      const launch = m.impulse * 0.06 * Math.sin(phase - t * 0.6);
      const a =
        center + (ray - 4) * spread + 0.12 * params.motion * Math.sin(t * 0.13 + group) + launch;
      const len =
        (group ? 620 : 900) +
        45 * params.deformation * Math.sin(t * 0.25 + phase) +
        m.slow.bass * 70 +
        m.slow.rms * 16;
      const width = 0.018 + params.detail * 0.009 + m.fast.mid * 0.008;
      p.noStroke();
      p.fill(ray === 4 ? C.coral : (ray + group) % 3 === 0 ? C.paper : C.teal);
      p.triangle(
        ox,
        oy,
        ox + Math.cos(a - width) * len,
        oy + Math.sin(a - width) * len,
        ox + Math.cos(a + width) * len,
        oy + Math.sin(a + width) * len,
      );
      if (ray % 2 === 0) {
        p.stroke(C.paper);
        p.strokeWeight(1 + m.slow.centroid * 0.8);
        const inner = len * (0.7 + 0.08 * Math.sin(t * 0.8 + phase));
        const outer = inner + 20 + m.residue * 24;
        p.line(
          ox + Math.cos(a) * inner,
          oy + Math.sin(a) * inner,
          ox + Math.cos(a) * outer,
          oy + Math.sin(a) * outer,
        );
      }
    }
  }
}
