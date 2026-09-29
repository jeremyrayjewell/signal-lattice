const regimes = [
  { bend: 0.3, drift: 0.3, disturbance: 0.35, detail: 0.35 },
  { bend: 0.65, drift: 0.6, disturbance: 0.8, detail: 0.65 },
  { bend: 1, drift: 1, disturbance: 1.3, detail: 1 },
];
export function stateAt(t) {
  const a = t < 11 ? 0 : 1,
    b = t < 11 ? 1 : 2;
  const q = Math.max(0, Math.min(1, t < 11 ? (t - 5) / 6 : (t - 11) / 9)),
    s = q * q * (3 - 2 * q);
  return {
    ...Object.fromEntries(
      Object.keys(regimes[a]).map((k) => [k, regimes[a][k] + s * (regimes[b][k] - regimes[a][k])]),
    ),
    from: ['CALM', 'ACTIVE'][a],
    to: ['ACTIVE', 'EXTREME'][a],
  };
}
