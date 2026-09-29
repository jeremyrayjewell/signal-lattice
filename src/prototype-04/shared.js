export { COLORS, begin, smooth, clamp } from '../prototype-03/shared.js';
import { ZERO } from '../prototype-03/shared.js';

export function makeContext(trackTime, controls, params, variant = 0, reactive = true) {
  return {
    t: trackTime,
    params,
    variant,
    at(delay = 0) {
      if (!reactive) return ZERO;
      const raw = controls.at(trackTime - delay);
      return {
        fast: Object.fromEntries(
          Object.entries(raw.fast).map(([k, v]) => [k, v * params.response]),
        ),
        slow: Object.fromEntries(
          Object.entries(raw.slow).map(([k, v]) => [k, v * params.response]),
        ),
        impulse: raw.impulse * params.impulse,
        residue: raw.residue * params.detail,
      };
    },
  };
}
