// Independently authored from the supplied artwork screenshot's visible grammar.
// No reference code, artist seal, random sector stack, or dashed Bézier implementation.
import { stateAt } from './states.js';

const TAU = Math.PI * 2;
const sites = [
  [55, 55, 205, 185, 201, -0.5],
  [285, 60, 242, 210, 333, 0.15],
  [620, 75, 255, 220, 46, 2.7],
  [875, 70, 230, 225, 185, 1.5],
  [145, 290, 260, 240, 144, -0.1],
  [430, 225, 265, 230, 219, 3.0],
  [790, 280, 272, 244, 274, 1.4],
  [230, 490, 270, 234, 32, -1.55],
  [585, 500, 270, 245, 323, 3.4],
  [910, 480, 230, 245, 199, 3.1],
  [505, 80, 180, 190, 171, 0.7],
  [615, 340, 214, 208, 17, -1.1],
];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ZERO = {
  fast: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  slow: { rms: 0, bass: 0, mid: 0, high: 0, centroid: 0 },
  impulse: 0,
  residue: 0,
};

function color(h, s, l, a = 1) {
  return `hsla(${h},${s}%,${l}%,${a})`;
}
function pathFor(ctx, w, h, bend) {
  // An asymmetric curvilinear pane: two straight edges, one independently deforming bowed edge.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.bezierCurveTo(w * (1.08 + bend * 0.08), h * 0.37, w * 0.59, h * (1.12 + bend * 0.18), 0, h);
  ctx.closePath();
}
function trajectory(u, index, t, amount) {
  const x = -70 + u * 1100;
  const y =
    80 +
    index * 71 +
    Math.sin(u * TAU * 0.82 + index * 1.29 + t * 0.115) * (62 + amount * 35) +
    Math.sin(u * TAU * 1.6 - index * 0.8 - t * 0.09) * 29;
  return [x, y];
}

export function draw(p, trackTime, elapsed, controls, reactive = true) {
  const params = stateAt(elapsed),
    t = trackTime;
  const ctx = p.drawingContext;
  const sample = (delay) => (reactive ? controls.at(t - delay) : ZERO);
  p.background('#faf8ef');
  ctx.save();
  // Large overlapping panes on a pale ground; gradients carry luminosity and soft depth.
  for (let i = 0; i < sites.length; i++) {
    const [bx, by, bw, bh, hue, angle] = sites[i];
    const m = sample((i % 4) * 0.075),
      phase = i * 1.37;
    const x =
      bx +
      (15 + params.drift * 30) * Math.sin(t * 0.1 + phase) +
      m.slow.bass * 17 * params.curvature * Math.cos(phase);
    const y =
      by +
      (12 + params.drift * 23) * Math.cos(t * 0.13 + phase * 0.8) +
      m.impulse * 9 * params.impulse * Math.sin(phase);
    const w = bw * (params.scale + 0.035 * Math.sin(t * 0.16 + phase));
    const h = bh * (params.scale + 0.075 * m.slow.bass * params.curvature);
    const bend = params.curvature * (0.45 * Math.sin(t * 0.19 + phase) + m.slow.mid * 0.55);
    const spin =
      angle +
      0.1 * Math.sin(t * 0.14 + phase) +
      m.fast.mid * 0.11 * params.curvature * Math.sin(phase);
    const hueBias = (m.slow.centroid - 0.4) * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    pathFor(ctx, w, h, bend);
    ctx.clip();
    const gradient = ctx.createRadialGradient(
      w * 0.12,
      h * 0.09,
      8,
      w * 0.18,
      h * 0.2,
      Math.max(w, h) * 1.02,
    );
    const saturation = 77 * params.saturation;
    const strength = clamp(params.overlap + 0.16 * m.slow.rms, 0.15, 0.85);
    gradient.addColorStop(0, color(hue + hueBias, saturation, 38, strength));
    gradient.addColorStop(0.36, color(hue + hueBias, saturation, 49, strength * 0.92));
    gradient.addColorStop(0.78, color(hue + hueBias, saturation, 71, strength * 0.38));
    gradient.addColorStop(1, color(hue + hueBias, saturation, 87, 0.025));
    ctx.fillStyle = gradient;
    ctx.fillRect(-30, -30, w * 1.35, h * 1.4);
    // Broad, low-contrast internal ribs suggest layered material, not tiny texture.
    for (let rib = 1; rib <= 6; rib++) {
      const u = rib / 7;
      ctx.strokeStyle = color(hue + 8, saturation, 90, 0.1 + params.detail * 0.035);
      ctx.lineWidth = 3 + params.detail * 3;
      ctx.beginPath();
      ctx.moveTo(w * u, 0);
      ctx.quadraticCurveTo(w * u * (0.7 + bend * 0.12), h * u * 0.76, 0, h * u);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Opaque squares travel along analytic sine paths. No line-dash or Bézier trail is used.
  for (let lane = 0; lane < 6; lane++) {
    const m = sample(lane * 0.055);
    for (let j = 0; j < 13; j++) {
      const raw = j / 13 + params.travel * 0.014 + lane * 0.113;
      const u = ((raw % 1) + 1) % 1;
      const [x, y] = trajectory(u, lane, t, params.curvature);
      const edge = clamp(Math.min(u, 1 - u) * 16);
      const flicker = 0.5 + 0.5 * Math.sin(t * 0.9 + lane * 2 + j * 0.8);
      const size = (5 + params.detail * 6 + m.fast.high * 8 * flicker) * edge;
      const turn =
        0.2 * Math.sin(t * 0.24 + j * 0.65 + lane) + m.impulse * 0.2 * params.impulse * Math.sin(j);
      const hue = [349, 43, 188, 265, 145, 21][lane] + m.slow.centroid * 12;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(turn);
      ctx.fillStyle = j % 7 === 0 ? '#fffefa' : j % 5 === 0 ? '#202434' : color(hue, 88, 50);
      ctx.fillRect(-size / 2, -size / 2, size, size);
      // Brief high-frequency residue remains spatially local, rather than flashing the canvas.
      if (j % 4 === 0) {
        ctx.globalAlpha = m.residue * 0.22 * params.detail;
        ctx.fillRect(-size / 2 - 7, -size / 2 + 4, size, size);
      }
      ctx.restore();
    }
  }
  ctx.restore();
  return params;
}
