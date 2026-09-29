import { randomAt, introFor } from '../timing.js';
import { stateAt } from './states.js';
const TAU = Math.PI * 2,
  R = (id, k) => randomAt(50440, id * 271 + k);
const colors = [
  '#272d32',
  '#454647',
  '#a56525',
  '#d7ce28',
  '#f1e752',
  '#939393',
  '#bbbbbb',
  '#e1e1e1',
  '#151515',
];
const silent = {
  fast: { rms: 0, high: 0, centroid: 0 },
  slow: { bass: 0, mid: 0 },
  impulse: 0,
  residue: 0,
};
const groups = Array.from({ length: 54 }, (_, id) => ({
  id,
  x: ((id % 9) - 0.2) * 125 + (R(id, 0) - 0.5) * 55,
  y: (Math.floor(id / 9) - 0.2) * 112 + (id % 2) * 24 + (R(id, 1) - 0.5) * 32,
  phase: R(id, 2) * TAU,
  angle: R(id, 3) * TAU,
  length: 145 + R(id, 4) * 90,
  color: R(id, 5) < 0.7 ? 0 : R(id, 6) < 0.5 ? 2 : 3,
  turns: 2 + Math.floor(R(id, 7) * 4),
  count: R(id, 8) < 0.18 ? 0 : R(id, 9) > 0.58 ? 1 : 4,
}));
function waveform(g, c, t, m, s, opacity = 1) {
  g.save();
  g.rotate(c.angle + 0.47 * Math.sin(t * 0.71 + c.phase) + m.slow.mid * 0.35 * Math.sin(c.phase));
  g.transform(
    1,
    0.13 * Math.sin(t * 0.9 + c.phase),
    m.impulse * s.impulse * 0.19 * Math.cos(c.phase),
    1,
    0,
    0,
  );
  const amplitude = (22 + R(c.id, 10) * 20) * (1 + 0.28 * m.slow.mid + 0.1 * s.motion);
  const phase = t * (1.7 + R(c.id, 11) * 1.1) + c.phase;
  const nodes = [];
  for (let j = 0; j <= 100; j++) {
    const u = j / 100,
      x = (u - 0.5) * c.length;
    const crest = Math.sin(u * TAU * c.turns - phase);
    const tooth = Math.asin(Math.sin(u * TAU * c.turns - phase)) / 1.570796;
    const grain = (R(c.id, j + 40) - 0.5) * 22;
    const knot = c.id % 3 === 0 ? Math.sin(u * TAU * 8 + phase) * 18 : 0;
    const y =
      amplitude * (0.35 * crest + 0.65 * tooth) +
      grain +
      8 * Math.sin(j * 1.7 + t * 1.13 + c.phase);
    nodes.push([x + (R(c.id, j + 120) - 0.5) * 15 + knot, y]);
  }
  g.strokeStyle = colors[c.color];
  g.lineWidth = 0.68 + 0.2 * m.fast.centroid;
  // Independently woven short pen paths, not the source's triangle-strip implementation.
  for (let pass = 0; pass < 5; pass++) {
    g.globalAlpha = opacity * (0.36 + pass * 0.035 + 0.1 * m.fast.rms);
    g.beginPath();
    for (let j = 0; j < nodes.length; j++) {
      const [x, y] = nodes[j],
        offset = (pass - 2) * (5 + R(c.id, j + 200) * 8);
      const yy = y + offset + Math.sin(j * 0.4 + phase) * m.impulse * s.impulse * 13;
      if (j === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
      const skip = 3 + pass * 2;
      if (j % 3 === 1 && j + skip < nodes.length) {
        g.lineTo(nodes[j + skip][0], nodes[j + skip][1] - offset);
        g.moveTo(x, yy);
      }
    }
    g.stroke();
  }
  // Looped filaments distinguish knot-like, serrated and braided scribble clusters.
  g.globalAlpha = opacity * 0.42;
  g.lineWidth = 0.48;
  if (c.id % 3 !== 1)
    for (let j = 0; j < 18; j++) {
      const point = nodes[j * 5],
        a = phase + j * 0.73;
      const radius = 5 + R(c.id, j + 240) * 12 + 3 * m.fast.high;
      g.beginPath();
      g.ellipse(point[0], point[1], radius, radius * 0.35, a, 0, TAU);
      g.stroke();
    }
  g.restore();
}
function ovalTexture(g, id, rx, ry, t, m, colorIndex) {
  g.save();
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, TAU);
  g.clip();
  const light = [0, 1, 8].includes(colorIndex);
  g.strokeStyle = g.fillStyle = light ? '#f1e6c9' : '#352e26';
  g.globalAlpha = light ? 0.34 : 0.25;
  g.lineWidth = 0.65;
  const style = id % 3,
    extent = Math.max(rx, ry) * 1.6;
  g.save();
  g.rotate(R(id, 400) * TAU + 0.12 * Math.sin(t * 0.61 + id));
  const spacing = 3.4 + R(id, 401) * 2.2,
    travel = 2 * Math.sin(t * 0.85 + id);
  if (style !== 2) {
    for (let y = -extent; y < extent; y += spacing) {
      g.beginPath();
      g.moveTo(-extent, y + travel);
      g.bezierCurveTo(-rx * 0.4, y - 2 - m.slow.mid * 3, rx * 0.4, y + 2, extent, y + travel);
      g.stroke();
    }
    if (style === 1) {
      g.globalAlpha = light ? 0.21 : 0.17;
      for (let x = -extent; x < extent; x += spacing * 1.6) {
        g.beginPath();
        g.moveTo(x, -extent);
        g.lineTo(x + ry * 0.55, extent);
        g.stroke();
      }
    }
  } else {
    for (let r = 3; r < extent * 1.4; r += spacing) {
      g.beginPath();
      g.ellipse(-rx * 0.5 + travel, ry * 0.28, r, r * 0.8, 0, 0, TAU);
      g.stroke();
    }
  }
  g.restore();
  // Fixed grain travels with the oval; only smooth contrast changes respond to highs.
  g.globalAlpha = (light ? 0.35 : 0.26) + m.fast.high * 0.09;
  const count = Math.floor(rx * ry * 0.19);
  for (let j = 0; j < count; j++) {
    const x = (R(id, j * 3 + 500) - 0.5) * rx * 2,
      y = (R(id, j * 3 + 501) - 0.5) * ry * 2;
    const size = 0.45 + R(id, j * 3 + 502) * 0.8;
    g.fillRect(x, y, size, size * 0.7);
  }
  g.restore();
}
function backgroundTexture(g, t, m) {
  // Faint full-canvas grain and long curved hatch strokes give the paper
  // ground the same graphite character as the oval surfaces, at a scale and
  // opacity that stays behind the scribble field. Fixed seed positions
  // travel with a gentle drift rather than reseeding, matching the oval
  // grain's no-per-frame-flicker approach.
  g.save();
  g.strokeStyle = '#352e26';
  g.lineWidth = 0.55;
  g.globalAlpha = 0.045 + m.fast.high * 0.02;
  for (let y = -40, row = 0; y < 580; y += 27, row++) {
    const drift = 7 * Math.sin(t * 0.16 + row * 0.7);
    g.beginPath();
    g.moveTo(-40, y + drift);
    g.bezierCurveTo(300, y - 16 - drift, 660, y + 16 + drift, 1000, y + drift);
    g.stroke();
  }
  g.fillStyle = '#352e26';
  g.globalAlpha = 0.065 + m.fast.high * 0.025;
  for (let j = 0; j < 3400; j++) {
    const x = R(j, 600) * 1000 - 20,
      y = R(j, 601) * 580 - 20,
      size = 0.4 + R(j, 602) * 0.75;
    g.fillRect(x, y, size, size * 0.7);
  }
  g.restore();
}
export function draw(p, trackTime, elapsed, controls, reactive = true, intro = 1) {
  const t = trackTime,
    s = stateAt(elapsed),
    g = p.drawingContext;
  if (intro >= 1) {
    p.background('#ffffff');
    backgroundTexture(g, t, reactive ? controls.at(t - 0.05) : silent);
  }
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const c of groups) {
    const entry = introFor(c.id, intro, 390);
    if (!entry.active) continue;
    const m = reactive ? controls.at(t - 0.03 - (c.x / 960) * 0.19) : silent;
    const x = c.x + 32 * Math.sin(t * 0.59 + c.phase) + m.slow.bass * 18 * Math.sin(c.phase);
    const y = c.y + 25 * Math.cos(t * 0.67 + c.phase);
    g.save();
    g.translate(x + entry.dx, y + entry.dy);
    g.scale(entry.scale, entry.scale);
    // Explicit-time echoes give motion trails without relying on previous rendered frames.
    if (c.id % 3 === 0)
      for (let echo = 2; echo >= 1; echo--) {
        g.save();
        g.translate(-echo * 7, echo * 4);
        waveform(g, c, t - echo * 0.18, m, s, 0.16 / echo);
        g.restore();
      }
    waveform(g, c, t, m, s);
    for (let k = 0; k < c.count; k++) {
      const id = c.id * 5 + k,
        phase = R(id, 310) * TAU;
      const large = c.count === 1;
      const radius = large ? 30 + R(id, 311) * 25 : 9 + R(id, 311) * 14;
      const orbit = large ? 35 : 29 + k * 9;
      const a = phase + t * (large ? 0.4 : 0.63);
      const px = Math.cos(a) * orbit,
        py = Math.sin(a) * orbit * 0.7;
      const squash = 0.63 + R(id, 312) * 0.35 + 0.08 * Math.sin(t * 0.77 + phase);
      g.save();
      g.translate(px, py);
      g.rotate(phase + t * (R(id, 313) - 0.5) * 0.65 + m.slow.mid * 0.12);
      const colorIndex = Math.floor(R(id, 315) * colors.length);
      g.globalAlpha = R(id, 314) > 0.5 ? 0.82 : 1;
      g.fillStyle = colors[colorIndex];
      const breathe = 1 + 0.09 * m.slow.bass + 0.07 * m.residue * Math.sin(phase);
      if (k === 0 && c.id % 2 === 0) {
        g.save();
        g.globalAlpha = 0.17 + 0.14 * m.residue;
        g.strokeStyle = colors[c.color];
        g.lineWidth = 0.8;
        for (let ring = 1; ring <= 3; ring++) {
          const spread = ring * 6 + 4 * Math.sin(t * 1.2 + phase);
          g.beginPath();
          g.ellipse(
            -ring * 3,
            ring * 2,
            radius * breathe + spread,
            radius * squash * breathe + spread,
            0,
            0,
            TAU,
          );
          g.stroke();
        }
        g.restore();
      }
      g.beginPath();
      g.ellipse(0, 0, radius * breathe, radius * squash * breathe, 0, 0, TAU);
      g.fill();
      ovalTexture(g, id, radius * breathe, radius * squash * breathe, t, m, colorIndex);
      g.restore();
    }
    g.restore();
  }
  g.restore();
  return s;
}
