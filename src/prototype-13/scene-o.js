import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2;
const r = (id, k = 0) => randomAt(48233, id * 97 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const hues = [184, 326, 48, 92, 266, 18, 212, 140];
const W = 960,
  H = 540,
  COUNT = 54;
// One continuous field, not separate clusters: positions come from a difference
// of two seeded uniforms (a triangular distribution), which peaks at the frame
// center and thins toward the edges/corners, matching the source's density.
const fieldShards = Array.from({ length: COUNT }, (_, id) => {
  const cx = W / 2 + (r(id, 20) - r(id, 21)) * W * 0.62;
  const cy = H / 2 + (r(id, 22) - r(id, 23)) * H * 0.62;
  const size = 60 + 270 * Math.pow(r(id, 24), 1.35);
  const stroked = r(id, 25) < 0.32;
  const aspect = 0.6 + 0.55 * r(id, 26);
  return { id, kind: 'field', cx, cy, size, stroked, aspect };
});
// A second population that travels a straight line across (and beyond) the
// frame and wraps, so structures continuously enter and exit rather than only
// drifting in place. IDs start at 500 to keep seeded draws independent of the
// field shards and the trail lines below.
const TRAVEL_COUNT = 20,
  MARGIN = 240;
const travelShards = Array.from({ length: TRAVEL_COUNT }, (_, k) => {
  const id = 500 + k;
  const horizontal = r(id, 1) < 0.5;
  const dir = r(id, 2) < 0.5 ? 1 : -1;
  const lane = 60 + r(id, 3) * ((horizontal ? H : W) - 120);
  const span = (horizontal ? W : H) + MARGIN * 2;
  const speed = 65 + r(id, 4) * 135;
  const size = 70 + 230 * Math.pow(r(id, 5), 1.3);
  const stroked = r(id, 6) < 0.4;
  const aspect = 0.6 + 0.5 * r(id, 7);
  const offsetPhase = r(id, 8) * span;
  return {
    id,
    kind: 'travel',
    horizontal,
    dir,
    lane,
    span,
    speed,
    size,
    stroked,
    aspect,
    offsetPhase,
  };
});
const shards = [...fieldShards, ...travelShards];
const TRAILS = 38;

export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  const at = (delay) => (reactive ? controls.at(t - delay) : zero);
  if (intro >= 1) p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  g.lineCap = 'round';

  shards.forEach((sh) => {
    const { id, kind, size, stroked, aspect } = sh;
    const entry = introFor(id, intro, 440);
    if (!entry.active) return;
    const m = at((id % 9) * 0.025);
    const phase = r(id, 40) * TAU,
      orientation = r(id, 41) * TAU;
    let x, y, yaw;
    if (kind === 'field') {
      const drift = 10 + 8 * r(id, 42);
      x = sh.cx + drift * s.motion * Math.sin(t * 0.21 + phase);
      y = sh.cy + drift * s.motion * Math.cos(t * 0.26 + phase * 1.3);
      yaw = orientation + t * (0.04 + r(id, 43) * 0.07) + m.slow.mid * 0.4;
    } else {
      const progress = (((t * sh.speed + sh.offsetPhase) % sh.span) + sh.span) % sh.span;
      const pos = progress - MARGIN;
      if (sh.horizontal) {
        x = sh.dir > 0 ? pos : W - pos;
        y = sh.lane + 16 * Math.sin(t * 0.3 + phase);
      } else {
        y = sh.dir > 0 ? pos : H - pos;
        x = sh.lane + 16 * Math.sin(t * 0.3 + phase);
      }
      // Faster tumbling while in flight reads as motion, distinct from the field's slow drift-spin.
      yaw = orientation + t * (0.35 + r(id, 43) * 0.5) + m.slow.mid * 0.4;
    }
    const scale =
      (0.82 + 0.18 * Math.sin(t * 0.17 + phase)) * (1 + 0.2 * m.slow.bass) * entry.scale;
    const rad = size * scale;
    const hue = hues[Math.floor(r(id, 44) * hues.length)];
    // A slowly traveling subset reads brighter, echoing the source's shifting bright crossings.
    const selected = (0.5 + 0.5 * Math.sin(id * 1.7 - t * 0.9 + phase)) ** 8;
    const jitter = m.impulse * s.impulse * rad * 0.1 * Math.sin(t * 0.55 + phase);
    const a0 = -Math.PI / 2,
      a1 = a0 + 2 + 0.18 * r(id, 45),
      a2 = a0 - 2.3 - 0.16 * r(id, 46);
    const pt = (a) => [Math.cos(a) * rad, Math.sin(a) * rad * aspect];
    const A = pt(a0),
      B = pt(a1),
      C = pt(a2);
    g.save();
    g.translate(x + jitter + entry.dx, y - jitter * 0.6 + entry.dy);
    g.rotate(yaw);
    const light = selected * m.residue * 8 + m.fast.centroid * 5;
    // A fan of triangles sharing vertex A, shrinking toward it rather than toward
    // a common center, builds up density on A's side of the shape and fades
    // toward edge BC — an asymmetric gradient rather than a centered glow.
    const layers = 10 + Math.floor(r(id, 47) * 10);
    for (let i = 0; i < layers; i++) {
      const k = 1 - i / layers;
      const bx = A[0] + (B[0] - A[0]) * k,
        by = A[1] + (B[1] - A[1]) * k;
      const cx2 = A[0] + (C[0] - A[0]) * k,
        cy2 = A[1] + (C[1] - A[1]) * k;
      g.beginPath();
      g.moveTo(A[0], A[1]);
      g.lineTo(bx, by);
      g.lineTo(cx2, cy2);
      g.closePath();
      if (stroked) {
        g.strokeStyle = `hsl(${hue + light} 95% ${58 + 6 * m.fast.rms}%)`;
        g.lineWidth = 0.7 + selected * 0.5;
        g.globalAlpha = 0.09 + 0.05 * m.fast.rms + selected * 0.05;
        g.stroke();
      } else {
        g.fillStyle = `hsl(${hue + light} 85% ${44 + 6 * m.fast.rms}%)`;
        g.globalAlpha = 0.05 + 0.025 * m.fast.rms + selected * 0.02;
        g.fill();
      }
    }
    g.restore();
  });

  // A dense mesh of thin wandering trail lines, independent of the shard field.
  // Each is a Lissajous-like sweep (sums of incommensurate sine frequencies, not
  // noise()) with a small, much higher-frequency wobble layered on top, so the
  // path reads as genuinely squiggly rather than a few smooth loops.
  const amb = at(0.4);
  const WINDOW = 6.5;
  for (let i = 0; i < TRAILS; i++) {
    const id = 1000 + i,
      phaseA = r(id) * TAU,
      phaseB = r(id, 1) * TAU,
      phaseC = r(id, 8) * TAU;
    const entry = introFor(id, intro, 380);
    if (!entry.active) continue;
    const fa = TAU * (0.16 + r(id, 2) * 0.22),
      fb = TAU * (0.11 + r(id, 3) * 0.18),
      fc = TAU * (0.07 + r(id, 4) * 0.13);
    const wobbleFreq = TAU * (1.3 + r(id, 10) * 2.1),
      wobbleAmp = 14 + r(id, 11) * 18;
    const cx0 = 100 + r(id, 6) * 760 + entry.dx,
      cy0 = 60 + r(id, 7) * 420 + entry.dy;
    const selected = (0.5 + 0.5 * Math.sin(id * 0.9 - t * 0.5 + phaseA)) ** 6;
    g.beginPath();
    const steps = 220;
    for (let step = 0; step <= steps; step++) {
      const u = t - WINDOW + (step / steps) * WINDOW;
      const x =
        cx0 +
        210 * Math.sin(u * fa + phaseA) +
        110 * Math.sin(u * fc * 1.3 + phaseB) +
        wobbleAmp * Math.sin(u * wobbleFreq + phaseC);
      const y =
        cy0 +
        140 * Math.cos(u * fb + phaseB) +
        80 * Math.sin(u * fc + phaseA) +
        wobbleAmp * Math.cos(u * wobbleFreq * 1.15 + phaseC);
      if (step === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokeStyle = `hsla(${40 + r(id, 5) * 280} 20% 90% / ${0.09 + 0.08 * amb.fast.high + selected * 0.14})`;
    g.lineWidth = 0.55 + selected * 0.35;
    g.stroke();
  }

  g.restore();
  return s;
}
