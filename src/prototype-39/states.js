const regimes = [
  { motion: 0.45, articulation: 0.45, impulse: 0.4, detail: 0.45 },
  { motion: 0.8, articulation: 0.8, impulse: 0.9, detail: 0.75 },
  { motion: 1.15, articulation: 1.2, impulse: 1.4, detail: 1 },
];
export function stateAt(t) {
  const a = t < 11 ? 0 : 1,
    b = a + 1,
    q = Math.max(0, Math.min(1, t < 11 ? (t - 5) / 6 : (t - 11) / 9)),
    s = q * q * (3 - 2 * q);
  return {
    ...Object.fromEntries(
      Object.keys(regimes[a]).map((k) => [k, regimes[a][k] + (regimes[b][k] - regimes[a][k]) * s]),
    ),
    from: ['CALM', 'ACTIVE'][a],
    to: ['ACTIVE', 'EXTREME'][a],
  };
}
