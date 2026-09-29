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
export function draw(p, trackTime, elapsed, controls, reactive = true) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  p.background('#000000');
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineJoin = 'round';
  forms.forEach(([bx, by, rad], id) => {
    const m = reactive ? controls.at(t - (bx / 960) * 0.24 - (id % 4) * 0.055) : zero,
      phase = r(id) * TAU;
    const x = bx + (30 + 24 * s.motion) * Math.sin(t * 0.43 + phase) + 12 * Math.sin(t * 0.83 + id);
    const y =
      by +
      (24 + 22 * s.motion) * Math.cos(t * 0.51 + phase) +
      m.impulse * s.impulse * 10 * Math.cos(id);
    const yaw = t * (0.43 + r(id, 2) * 0.37) + phase + m.slow.mid * 0.57;
    const pitch =
      0.73 * Math.sin(t * 0.67 + phase) + 0.3 + m.impulse * s.impulse * 0.23 * Math.cos(phase);
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw),
      cp = Math.cos(pitch),
      sp = Math.sin(pitch);
    const stretch = 0.78 + 0.28 * Math.sin(t * 0.59 + phase) + m.slow.bass * 0.18;
    const count = 16 + Math.floor(r(id, 4) * 9),
      hue = hues[Math.floor(r(id, 5) * hues.length)];
    g.save();
    g.translate(x, y);
    g.rotate(r(id, 1) * TAU + 0.32 * s.motion * Math.sin(t * 0.49 + phase));
    function projected(u, v, kind) {
      let xx, yy, zz;
      const flex =
        1 +
        (0.08 + 0.075 * s.articulation) * Math.sin(u * 3 + phase + t * 0.79) +
        m.impulse * s.impulse * 0.065 * Math.sin(u * 2 + v);
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
      } else {
        // closed braided contour with a breathing central opening
        const tube = rad * (0.22 + 0.045 * Math.sin(t * 0.83 + phase));
        const ring = rad * 0.62 + tube * Math.cos(u * 3 + v + t * 0.48);
        xx = ring * Math.cos(u) * stretch;
        yy = ring * Math.sin(u);
        zz = tube * Math.sin(u * 3 + v + t * 0.48) * (1 + m.slow.mid * 0.4);
      }
      const rx = xx * cy + zz * sy,
        rz = -xx * sy + zz * cy;
      return [rx, yy * cp - rz * sp];
    }
    function curve(kind, v, index, secondary = false) {
      const selected = (0.5 + 0.5 * Math.sin(index * 1.3 - t * 1.8 + phase)) ** 6;
      const tint = secondary ? hue + 46 : hue + (index % 4 === 0 ? 16 : 0);
      g.strokeStyle = `hsl(${tint + 5 * m.fast.centroid} 100% ${55 + 5 * m.fast.centroid}%)`;
      g.globalAlpha = secondary ? 0.43 + 0.1 * m.residue : 0.72 + 0.13 * m.fast.rms;
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
    const kind = id % 5 === 2 ? 2 : id % 5 === 1 ? 1 : 0;
    for (let j = 0; j < count; j++) {
      const v =
        kind === 1
          ? -Math.PI / 2 + (j / (count - 1)) * Math.PI
          : (j / count) * (kind === 2 ? TAU : Math.PI) + 0.19 * Math.sin(t * 0.71 + phase);
      curve(kind, v, j);
    }
    // Selectively cross-brace large volumes; small forms remain legible supporting accents.
    if (id < 15 && kind !== 2)
      for (let j = 0; j < 5; j++)
        curve(kind === 0 ? 1 : 0, kind === 0 ? (j - 2) * 0.45 : (j / 5) * Math.PI, j, true);
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
