import { smooth } from '../prototype-03/shared.js';

export const PRESETS = {
  CALM: {
    motion: 0.35,
    deformation: 0.3,
    spread: 0.82,
    detail: 0.25,
    impulse: 0.25,
    response: 0.5,
  },
  ACTIVE: { motion: 0.8, deformation: 0.8, spread: 1, detail: 0.7, impulse: 1, response: 1 },
  EXTREME: {
    motion: 1.35,
    deformation: 1.45,
    spread: 1.15,
    detail: 1,
    impulse: 1.9,
    response: 1.35,
  },
};

export function parameters(clip, frame, endFrame) {
  const a = PRESETS[clip.stateFrom],
    b = PRESETS[clip.stateTo];
  if (!a || !b) throw new Error('Unknown scene state');
  const q = smooth((frame - clip.startFrame) / Math.max(1, endFrame - clip.startFrame));
  return Object.fromEntries(Object.keys(a).map((key) => [key, a[key] + (b[key] - a[key]) * q]));
}
