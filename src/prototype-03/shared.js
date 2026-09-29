export const COLORS = {
  ink: '#15292e',
  paper: '#e8e2ce',
  teal: '#6eaaa4',
  coral: '#e18561',
  faint: '#294044',
};
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const smooth = (v) => {
  const q = clamp(v);
  return q * q * (3 - 2 * q);
};
export const ZERO = {
  fast: { rms: 0, bass: 0, mid: 0, high: 0, onset: 0, centroid: 0 },
  slow: { rms: 0, bass: 0, mid: 0, high: 0, onset: 0, centroid: 0 },
  residue: 0,
  impulse: 0,
};
export function begin(p) {
  p.background(COLORS.ink);
  p.noFill();
  p.strokeCap(p.SQUARE);
  p.strokeJoin(p.ROUND);
}
export function context(time, controls, reactive, params) {
  return { t: time, params, at: (delay = 0) => (reactive ? controls.at(time - delay) : ZERO) };
}
