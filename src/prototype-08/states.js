import { smooth } from '../prototype-03/shared.js';

export const PRESETS = {
  CALM: {
    motion: 0.75,
    deformation: 0.65,
    spread: 0.86,
    detail: 0.5,
    impulse: 0.5,
    response: 0.75,
  },
  ACTIVE: { motion: 1.1, deformation: 1.1, spread: 1, detail: 0.8, impulse: 1.1, response: 1 },
  EXTREME: {
    motion: 1.55,
    deformation: 1.5,
    spread: 1.1,
    detail: 1,
    impulse: 1.65,
    response: 1.15,
  },
};

export function parameters(clip, frame, endFrame) {
  const a = PRESETS[clip.stateFrom],
    b = PRESETS[clip.stateTo];
  if (!a || !b) throw new Error('Unknown scene state');
  const q = smooth((frame - clip.startFrame) / Math.max(1, endFrame - clip.startFrame));
  return Object.fromEntries(Object.keys(a).map((key) => [key, a[key] + (b[key] - a[key]) * q]));
}
