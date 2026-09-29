import { randomAt, SETTINGS } from './timing.js';

const INK = '#15292e';
const PAPER = '#e8e2ce';
const CORAL = '#e18561';
const TEAL = '#6eaaa4';
const smooth = (a, b, x) => {
  const q = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return q * q * (3 - 2 * q);
};

export function drawSystem(p, { time: t, seed }) {
  p.background(INK);
  p.noFill();
  p.strokeCap(p.SQUARE);
  p.strokeJoin(p.MITER);
  const { width: w, height: h } = SETTINGS;

  // Quiet reference traces behind the changing cell field.
  p.stroke('#294044');
  p.strokeWeight(0.65);
  for (let lane = 0; lane < 17; lane++) {
    p.beginShape();
    for (let y = 38; y <= h - 38; y += 8) {
      const x = 26 + lane * 30 + 8 * Math.sin(y * 0.009 + lane * 0.23 + t * 0.12);
      p.vertex(x, y);
    }
    p.endShape();
  }

  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 9; col++) {
      const id = row * 9 + col;
      const r = randomAt(seed, id);
      const phase = r * Math.PI * 2;
      const y0 = 62 + row * 52;
      const x0 = 46 + col * 56;
      const channel =
        w * 0.51 + 67 * Math.sin(y0 * 0.0068 + t * 0.107) + 24 * Math.sin(t * 0.071 + y0 * 0.013);
      const gap = 23 + 14 * Math.sin(y0 * 0.009 - t * 0.19);
      const presence = smooth(gap, gap + 36, Math.abs(x0 - channel));
      const breathing = 0.82 + 0.16 * Math.sin(t * 0.31 + row * 0.31 + col * 0.42);
      const scale = presence * breathing;
      if (scale < 0.018) continue;

      const x = x0 + 11 * Math.sin(row * 0.31 + t * 0.23) + 5 * Math.cos(col * 0.7 + t * 0.43);
      const y = y0 + 9 * Math.sin(col * 0.45 + t * 0.17 + row * 0.23);
      const twist =
        0.24 * Math.sin(t * 0.51 + row * 0.4 - col * 0.34) + 0.1 * Math.sin(t * 0.83 + phase);
      const accent = r > 0.78 ? CORAL : r < 0.18 ? TEAL : PAPER;
      p.push();
      p.translate(x, y);
      p.rotate(twist);
      p.scale(scale);

      // Three open, nested brackets; offset hinges make a stepped local structure.
      for (let layer = 0; layer < 3; layer++) {
        const span = 22 - layer * 5;
        const hinge = Math.sin(t * 0.67 + phase + layer * 0.48);
        p.push();
        p.translate(layer * 1.2 * hinge, layer * 0.8 * Math.cos(t * 0.39 + phase));
        p.rotate(layer * 0.075 * Math.sin(t * 0.41 + phase));
        p.stroke(layer === 0 ? accent : TEAL);
        p.strokeWeight(layer === 0 ? 1.5 : 0.85);
        p.beginShape();
        p.vertex(span * 0.4, -span);
        p.vertex(-span, -span);
        p.vertex(-span, span);
        p.vertex(span, span);
        p.vertex(span, -span * 0.4 + hinge * 5);
        p.endShape();
        p.pop();
      }

      // Traveling short rungs, with no persistent trail or simulation state.
      p.stroke(accent);
      p.strokeWeight(1);
      for (let rung = 0; rung < 4; rung++) {
        const yy = -14 + rung * 8;
        const reach = 4 + 7 * (0.5 + 0.5 * Math.sin(t * 2.1 + phase + rung * 0.85 + row * 0.2));
        p.line(-20, yy, -20 + reach, yy);
      }
      p.noStroke();
      p.fill(accent);
      const cursor = Math.sin(t * 1.43 + phase);
      p.rect(3 + 6 * cursor, -3, 3, 6);
      p.noFill();
      p.pop();
    }
  }

  // Sparse moving stitches connect the two banks of the open channel.
  for (let i = 0; i < 11; i++) {
    const y = 90 + i * 75 + 9 * Math.sin(t * 0.29 + i);
    const x =
      w * 0.51 + 67 * Math.sin(y * 0.0068 + t * 0.107) + 24 * Math.sin(t * 0.071 + y * 0.013);
    p.stroke(i % 3 === 0 ? CORAL : TEAL);
    p.strokeWeight(1);
    const reach = 5 + 8 * (0.5 + 0.5 * Math.sin(t * 0.79 + i * 1.7));
    p.line(x - reach, y, x + reach, y);
    p.point(x + reach + 4, y);
  }
  p.stroke(PAPER);
  p.strokeWeight(1);
  for (const x of [18, w - 18]) {
    p.line(x, 18, x, 32);
    p.line(x, h - 32, x, h - 18);
  }
}
