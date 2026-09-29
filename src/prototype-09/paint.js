import { randomAt } from '../timing.js';
export const TAU = Math.PI * 2;
export const seed = (i, k = 0) => randomAt(81773, i * 97 + k);
export const palettes = {
  A: ['#fc466b', '#ffb344', '#ffe894', '#18dcc4', '#2497f5', '#8061ff', '#dc70ff', '#f4f2ff'],
  B: ['#283be0', '#578cff', '#19d4db', '#54f2ba', '#ffc43a', '#ff7752', '#f4489b', '#a073ef'],
  C: ['#372079', '#7935db', '#ce3293', '#ff583d', '#ee9a12', '#19a995', '#2674da', '#222337'],
  D: ['#153ead', '#386cf9', '#36bbc1', '#209778', '#ffbe32', '#ef6b35', '#ef4197', '#7c45bd'],
  E: ['#d655ff', '#8b71ff', '#4aabff', '#22e8d7', '#a1f966', '#ffe855', '#ff9853', '#ff5489'],
  F: ['#6948d6', '#ad59d0', '#e55da4', '#fc8d71', '#efbd61', '#96d596', '#48c1c5', '#477edb'],
  G: ['#f03b6d', '#ff7629', '#efb91c', '#86b643', '#00b9a6', '#1c88d8', '#6545d3', '#be42d2'],
  H: ['#fb3969', '#ff8538', '#e8ce49', '#44ddd2', '#358bf1', '#7950df', '#d762c6', '#fff0d9'],
};
export const color = (family, i) => palettes[family][((Math.floor(i) % 8) + 8) % 8];
export function background(p, c) {
  p.background(c);
  const g = p.drawingContext;
  g.lineCap = 'butt';
  g.lineJoin = 'round';
  return g;
}
export function path(g, points, fill, stroke, width = 1, closed = true) {
  g.beginPath();
  points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (closed) g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke();
  }
}
export function ring(g, x, y, r, a, b, c, w = 2, aspect = 1) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, r), Math.max(0.1, r * aspect), 0, a, b);
  g.strokeStyle = c;
  g.lineWidth = w;
  g.stroke();
}
