// Timestamp interpolation only. All musical memory is already in the analysis.
export function createControls(data) {
  function interpolate(values, time) {
    const times = data.times;
    if (time <= times[0]) return values[0];
    if (time >= times.at(-1)) return values.at(-1);
    let lo = 0,
      hi = times.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= time) lo = mid;
      else hi = mid;
    }
    const fraction = (time - times[lo]) / (times[hi] - times[lo]);
    return values[lo] + fraction * (values[hi] - values[lo]);
  }
  return {
    at(time) {
      const fast = {},
        slow = {};
      for (const key of ['rms', 'bass', 'mid', 'high', 'onset', 'centroid']) {
        fast[key] = interpolate(data.immediate[key], time);
        slow[key] = interpolate(data.slow[key], time);
      }
      return {
        fast,
        slow,
        residue: interpolate(data.high_residue, time),
        impulse: interpolate(data.transient, time),
      };
    },
    events(time) {
      return data.events.filter((event) => event.time <= time && event.time > time - 3.5);
    },
  };
}
