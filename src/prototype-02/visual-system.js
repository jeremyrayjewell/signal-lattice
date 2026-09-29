import { randomAt } from '../timing.js';

export const SETTINGS = Object.freeze({
  width: 960,
  height: 540,
  fps: 30,
  frames: 750,
  seed: 73129,
});
const INK = '#15292e',
  PAPER = '#e8e2ce',
  TEAL = '#6eaaa4',
  CORAL = '#e18561';
const smooth = (a, b, x) => {
  const q = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return q * q * (3 - 2 * q);
};

export function drawSystem(p, trackTime, controls, reactive = true) {
  const t = trackTime;
  const zero = {
    fast: { rms: 0, bass: 0, mid: 0, high: 0, onset: 0, centroid: 0 },
    slow: { rms: 0, bass: 0, mid: 0, high: 0, onset: 0, centroid: 0 },
    residue: 0,
    impulse: 0,
  };
  const sample = (time) => (reactive ? controls.at(time) : zero);
  const events = reactive ? controls.events(t) : [];
  const regions = Array.from({ length: 24 }, (_, i) => sample(t - (i / 23) * 0.42));
  const global = sample(t);
  p.background(INK);
  p.noFill();
  p.strokeCap(p.SQUARE);
  p.strokeJoin(p.MITER);

  // Two broad horizontal voids: asymmetric banks and interleaving long waves.
  function field(x) {
    const u = x / 960;
    const local = regions[Math.min(23, Math.max(0, Math.round(u * 23)))];
    const bass = local.slow.bass;
    const upper =
      165 +
      45 * Math.sin(u * 5.6 - t * 0.13) +
      (16 + bass * 38) * Math.sin(u * 8.1 + t * 0.19) +
      15 * (bass - 0.4) * (u - 0.3);
    const lower =
      359 +
      39 * Math.sin(u * 4.8 + t * 0.11 + 2.3) +
      (12 + bass * 26) * Math.sin(u * 6.9 - t * 0.17 + 0.9);
    const gap = 12 + 16 * (1 - local.slow.rms) + 8 * Math.sin(t * 0.09 + u * 4.2) + bass * 6;
    return { upper, lower, gap };
  }

  // Faint lateral traces make the field's large-scale current legible.
  p.stroke('#294044');
  p.strokeWeight(0.65);
  for (let lane = 0; lane < 12; lane++) {
    p.beginShape();
    for (let x = 18; x <= 942; x += 12) {
      p.vertex(x, 30 + lane * 43 + 7 * Math.sin(x * 0.009 - t * 0.16 + lane * 0.7));
    }
    p.endShape();
  }
  for (let col = 0; col < 24; col++) {
    const x0 = 23 + col * 39.7;
    const u = x0 / 960;
    const music = regions[col];
    const channel = field(x0);
    let shock = 0;
    // Onsets launch spatially localized waves, alternating direction deterministically.
    for (const event of events) {
      const age = t - event.time;
      const direction = Math.floor(event.time * 10) % 2 ? 1 : -1;
      const front = direction > 0 ? age * 560 : 960 - age * 560;
      shock +=
        event.strength * Math.exp(-age / 0.65) * Math.exp(-(((x0 - front) / 115) ** 2)) * direction;
    }
    shock = Math.max(-1, Math.min(1, shock));
    for (let row = 0; row < 12; row++) {
      const id = row * 24 + col;
      const r = randomAt(SETTINGS.seed, id),
        phase = r * Math.PI * 2;
      const y0 = 29 + row * 43.6;
      const distance = Math.min(Math.abs(y0 - channel.upper), Math.abs(y0 - channel.lower));
      const presence = smooth(channel.gap, channel.gap + 24, distance);
      if (presence < 0.02) continue;
      const bank = y0 < channel.upper ? -1 : y0 > channel.lower ? 1 : 0.5;
      const x = x0 + 4 * Math.sin(t * 0.23 + row * 0.41) + shock * 13 * Math.sin(row * 0.8 + phase);
      const y =
        y0 +
        5 * Math.sin(t * 0.17 + col * 0.27 + row * 0.23) +
        7 * music.slow.bass * Math.sin(u * 7 - t * 0.2 + bank) +
        shock * 10 * bank;
      const angle =
        0.17 * Math.sin(t * 0.39 + row * 0.38 - col * 0.24) +
        (0.12 + 0.48 * music.fast.mid) *
          Math.sin(t * 0.63 + Math.floor(col / 4) * 1.1 + row * 0.35) +
        shock * 0.24;
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.scale(presence * (0.87 + 0.06 * Math.sin(t * 0.21 + phase)));
      const accent = r > 0.81 ? CORAL : r < 0.23 ? TEAL : PAPER;
      for (let layer = 0; layer < 3; layer++) {
        const span = 17 - layer * 4;
        const hinge = Math.sin(t * 0.67 + phase + layer * 0.48);
        p.push();
        p.translate(
          layer * (1 + 2 * music.slow.mid) * hinge,
          layer * 0.6 * Math.cos(t * 0.39 + phase),
        );
        p.rotate(
          layer * 0.075 * Math.sin(t * 0.41 + phase) +
            layer * music.fast.mid * 0.08 * Math.sin(phase),
        );
        p.stroke(layer === 0 ? accent : TEAL);
        p.strokeWeight(layer === 0 ? 1.15 + 0.25 * music.slow.centroid : 0.7);
        p.beginShape();
        p.vertex(span * 0.4, -span);
        p.vertex(-span, -span);
        p.vertex(-span, span);
        p.vertex(span, span);
        p.vertex(span, -span * 0.4 + hinge * 4);
        p.endShape();
        p.pop();
      }
      p.stroke(accent);
      p.strokeWeight(0.8);
      for (let rung = 0; rung < 4; rung++) {
        const reach =
          2 +
          (4 + 8 * music.fast.high) *
            (0.5 + 0.5 * Math.sin(t * 2.1 + phase + rung * 0.85 + col * 0.17));
        p.line(-15, -11 + rung * 7, -15 + reach, -11 + rung * 7);
      }
      // Residue belongs to selected cells, rather than a frame-wide flash.
      if (r > 0.52) {
        p.stroke(TEAL);
        p.strokeWeight(0.5 + music.residue * 0.8);
        p.line(8, -13, 8 + 5 * music.residue, -13 - 7 * music.residue);
      }
      p.noStroke();
      p.fill(accent);
      p.rect(2 + (3 + 3 * music.fast.rms) * Math.sin(t * 1.43 + phase), -2, 2, 4);
      p.noFill();
      p.pop();
    }
  }
  // Sparse stitches travel independently through both voids, leaving them mostly dark.
  for (let i = 0; i < 17; i++) {
    const x = 28 + i * 55 + 7 * Math.sin(t * 0.27 + i);
    const f = field(x);
    const y = i % 3 ? f.upper : f.lower;
    p.stroke(i % 4 ? TEAL : CORAL);
    p.strokeWeight(0.8);
    const reach = 3 + 4 * Math.sin(t * 0.7 + i) ** 2 + 3 * global.fast.high;
    p.line(x - reach, y, x + reach, y);
  }
}
