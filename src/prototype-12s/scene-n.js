import { randomAt } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  r = (id, k = 0) => randomAt(91027, id * 83 + k);
const zero = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const hues = [178, 211, 269, 319, 348, 32, 54, 85, 137, 160];
const big = [
  [-15, 45, 108],
  [195, 20, 120],
  [413, 45, 99],
  [649, 12, 115],
  [898, 45, 113],
  [55, 213, 103],
  [302, 180, 111],
  [518, 226, 104],
  [805, 211, 121],
  [1010, 246, 114],
  [-20, 476, 112],
  [243, 450, 113],
  [463, 456, 116],
  [697, 462, 98],
  [920, 472, 111],
];
const forms = [
  ...big,
  ...Array.from({ length: 19 }, (_, k) => [
    25 + r(k, 31) * 910,
    20 + r(k, 32) * 500,
    35 + r(k, 33) * 37,
  ]),
];
function center(bx, by, id, t, s, m) {
  const phase = r(id) * TAU;
  return [
    bx + (48 + 40 * s.motion) * Math.sin(t * 0.67 + phase) + 24 * Math.sin(t * 1.07 + id),
    by +
      (35 + 32 * s.motion) * Math.cos(t * 0.73 + phase) +
      m.impulse * s.impulse * 20 * Math.cos(id),
  ];
}
export function draw(p, trackTime, elapsed, controls, reactive = true) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  // Moving shared filaments couple selected volumes into larger structures across the frame.
  // These have their own depth/color, and continuously changing branch separation.
  const positions = forms.map(([bx, by], id) =>
    center(
      bx,
      by,
      id,
      t,
      s,
      reactive ? controls.at(t - (bx / 960) * 0.24 - (id % 4) * 0.055) : zero,
    ),
  );
  for (let link = 0; link < 9; link++) {
    const a = positions[(link * 3 + 1) % 15],
      b = positions[(link * 3 + 8) % 15];
    const m = reactive ? controls.at(t - link * 0.06) : zero;
    const bend = (55 + 55 * s.articulation + 35 * m.slow.bass) * Math.sin(t * 0.81 + link);
    for (let strand = 0; strand < 7; strand++) {
      const off = (strand - 3) * (5 + 6 * Math.sin(t * 0.6 + link) ** 2);
      g.strokeStyle = `hsl(${hues[(link + strand) % hues.length]} 100% 58%)`;
      g.globalAlpha = 0.28 + 0.16 * m.residue;
      g.lineWidth = 0.75;
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.bezierCurveTo(
        a[0] + (b[0] - a[0]) * 0.3,
        a[1] + bend + off,
        b[0] - (b[0] - a[0]) * 0.3,
        b[1] - bend - off,
        b[0],
        b[1],
      );
      g.stroke();
    }
  }
  forms.forEach(([bx, by, rad], id) => {
    const m = reactive ? controls.at(t - (bx / 960) * 0.24 - (id % 4) * 0.055) : zero,
      phase = r(id) * TAU;
    const [x, y] = positions[id];
    const yaw = t * (0.72 + r(id, 2) * 0.53) + phase + m.slow.mid * 0.8;
    const pitch =
      1.05 * Math.sin(t * 0.91 + phase) + 0.3 + m.impulse * s.impulse * 0.35 * Math.cos(phase);
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      cp = Math.cos(pitch),
      sp = Math.sin(pitch);
    const stretch = 0.87 + 0.37 * Math.sin(t * 0.83 + phase) + m.slow.bass * 0.22;
    const count = 24 + Math.floor(r(id, 4) * 13),
      hue = hues[Math.floor(r(id, 5) * hues.length)];
    g.save();
    g.translate(x, y);
    g.rotate(r(id, 1) * TAU + 0.57 * s.motion * Math.sin(t * 0.71 + phase));
    function projected(u, v, kind) {
      let xx, yy, zz;
      const flex =
        1 +
        (0.12 + 0.11 * s.articulation) * Math.sin(u * 3 + phase + t * 1.07) +
        m.impulse * s.impulse * 0.095 * Math.sin(u * 2 + v);
      if (kind === 0) {
        // meridians with independent rail shear: less identical pole convergence
        xx = Math.cos(u) * rad * stretch * flex;
        yy = Math.sin(u) * Math.cos(v) * rad * flex;
        zz = Math.sin(u) * Math.sin(v) * rad;
        yy += rad * 0.11 * Math.sin(v * 2 + t * 0.7) * Math.cos(u * 2);
      } else if (kind === 1) {
        // moving cross-sectional hoops, a distinct latitude grammar
        const latitude = v * 0.76;
        xx = Math.cos(latitude) * Math.cos(u) * rad * stretch * flex;
        yy = Math.sin(latitude) * rad;
        zz = Math.cos(latitude) * Math.sin(u) * rad * flex;
      } else if (kind === 2) {
        // closed braided contour with a breathing central opening
        const tube = rad * (0.22 + 0.045 * Math.sin(t * 0.83 + phase));
        const ring = rad * 0.62 + tube * Math.cos(u * 3 + v + t * 0.48);
        xx = ring * Math.cos(u) * stretch;
        yy = ring * Math.sin(u);
        zz = tube * Math.sin(u * 3 + v + t * 0.48) * (1 + m.slow.mid * 0.4);
      } else if (kind === 3) {
        // two crossing lobes, opening and folding around an offset spine
        const split = 0.7 + 0.3 * Math.sin(t * 0.8 + phase);
        xx = rad * Math.sin(u) * stretch;
        yy = rad * (0.58 * Math.sin(2 * u) + 0.2 * Math.sin(v)) * split;
        zz = rad * 0.38 * Math.cos(u + v + t * 0.45);
      } else {
        // corrugated saddle loops, distinct from closed spherical volumes
        xx = rad * Math.cos(u) * stretch * (0.75 + 0.2 * Math.cos(v));
        yy = rad * Math.sin(u) * (0.55 + 0.22 * Math.sin(v));
        zz = rad * 0.42 * Math.sin(u * 2 + v + t * 0.67);
      }
      const rx = xx * cy + zz * sy,
        rz = -xx * sy + zz * cy;
      const ry = yy * cp - rz * sp;
      // A propagating deformation varies across the volume instead of only rotating it.
      const wave =
        (8 + 12 * s.articulation + 9 * m.slow.bass) * Math.sin((x + rx) * 0.011 - t * 1.4 + phase);
      return [rx + 9 * s.motion * Math.sin(ry * 0.025 + t * 0.91), ry + wave];
    }
    function curve(kind, v, index, secondary = false) {
      const selected = (0.5 + 0.5 * Math.sin(index * 1.3 - t * 1.8 + phase)) ** 6;
      const tint = secondary ? hue + 46 : hue + (index % 4 === 0 ? 16 : 0);
      g.strokeStyle = `hsl(${tint + 5 * m.fast.centroid} 100% ${55 + 5 * m.fast.centroid}%)`;
      g.globalAlpha = secondary ? 0.42 + 0.12 * m.residue : 0.62 + 0.15 * m.fast.rms;
      g.lineWidth = secondary ? 0.75 : 0.92 + selected * (0.3 * s.detail + m.fast.high * 0.28);
      g.beginPath();
      for (let k = 0; k <= 88; k++) {
        const point = projected((k / 88) * TAU, v, kind);
        if (k === 0) g.moveTo(...point);
        else g.lineTo(...point);
      }
      g.closePath();
      g.stroke();
    }
    const kind = id % 5;
    for (let j = 0; j < count; j++) {
      const v =
        kind === 1
          ? -Math.PI / 2 + (j / (count - 1)) * Math.PI
          : (j / count) * (kind >= 2 ? TAU : Math.PI) + 0.32 * Math.sin(t * 0.97 + phase);
      curve(kind, v, j);
    }
    // Selectively cross-brace large volumes; small forms remain legible supporting accents.
    if (id < 15) {
      g.save();
      g.translate(rad * 0.15 * Math.sin(t * 0.9 + phase), rad * 0.15 * Math.cos(t * 0.83 + phase));
      g.rotate(0.45 * Math.sin(t * 0.65 + phase));
      g.scale(0.64, 0.64);
      for (let j = 0; j < 9; j++) curve(kind === 2 ? 4 : 2, (j / 9) * TAU, j, true);
      g.restore();
    }
    // Brief moving highlights are actual curve segments, not uniform whole-object flashes.
    if (id % 3 === 0) {
      const v = Math.sin(t * 0.8 + phase),
        start = t * 0.9 + phase;
      g.strokeStyle = `hsl(${hue + 25} 100% 76%)`;
      g.globalAlpha = 0.4 + 0.4 * m.residue;
      g.lineWidth = 1.7;
      g.beginPath();
      for (let k = 0; k <= 18; k++) {
        const q = projected(start + k * 0.025, v, kind);
        if (k === 0) g.moveTo(...q);
        else g.lineTo(...q);
      }
      g.stroke();
    }
    g.restore();
  });
  g.restore();
  return s;
}
