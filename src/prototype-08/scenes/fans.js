import { COLORS as C, begin } from '../shared.js';

export function draw(p, { t, at, params }) {
  begin(p);
  // Two off-screen origins, opposed directional fans, no concentric ring structure.
  for (let group = 0; group < 2; group++) {
    const m = at(group * 0.21);
    const ox = (group ? 990 : -60) + 45 * Math.sin(t * 0.29 + group),
      oy = (group ? 60 : 500) + 55 * Math.sin(t * 0.37 + group * 2);
    const center = group ? Math.PI * 0.81 : -0.44;
    for (let ray = 0; ray < 9; ray++) {
      const phase = ray * 0.6 + group * 2;
      const spread = 0.085 + params.spread * 0.021;
      const launch = m.impulse * 0.12 * Math.sin(phase - t * 0.6);
      const a =
        center + (ray - 4) * spread + 0.24 * params.motion * Math.sin(t * 0.53 + group) + launch;
      const len =
        (group ? 620 : 900) +
        95 * params.deformation * Math.sin(t * 0.65 + phase) +
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
      for (let segment = 0; segment < 3; segment++) {
        const d = len * (0.28 + segment * 0.21 + 0.065 * Math.sin(t * 0.9 + phase));
        p.stroke(C.ink);
        p.strokeWeight(7 + segment * 3);
        p.line(
          ox + Math.cos(a - width) * d,
          oy + Math.sin(a - width) * d,
          ox + Math.cos(a + width) * d,
          oy + Math.sin(a + width) * d,
        );
        if (ray % 3 === 0) {
          p.stroke(C.coral);
          p.strokeWeight(2);
          const fork = a + 0.06 * Math.sin(t * 0.7 + segment);
          p.line(
            ox + Math.cos(a) * d,
            oy + Math.sin(a) * d,
            ox + Math.cos(fork) * (d + 85),
            oy + Math.sin(fork) * (d + 85),
          );
        }
      }
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
