import * as lattice from './scenes/lattice.js';
import * as ribbons from './scenes/ribbons.js';
import * as orbits from './scenes/orbits.js';
import * as slabs from './scenes/slabs.js';
import { clamp, smooth, context } from './shared.js';

export const SCENES = { A: lattice, B: ribbons, C: orbits, D: slabs };

export function stateAt(timeline, frame) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.frames)
    throw new Error('Invalid frame');
  const clips = timeline.clips;
  let index = 0;
  while (index + 1 < clips.length && frame >= clips[index + 1].startFrame) index++;
  const clip = clips[index];
  const age = frame - clip.startFrame;
  const overlap = index > 0 && age < clip.transition.frames;
  return {
    frame,
    trackTime: timeline.selection.start + frame / timeline.fps,
    index,
    scene: clip.scene,
    previous: overlap ? clips[index - 1].scene : null,
    mix: overlap ? smooth(age / clip.transition.frames) : 1,
    transition: overlap ? clip.transition.type : null,
  };
}

export function createManager(p, timeline, controls) {
  const buffers = [
    p.createGraphics(timeline.width, timeline.height),
    p.createGraphics(timeline.width, timeline.height),
  ];
  for (const buffer of buffers) buffer.pixelDensity(1);
  function renderLayer(buffer, index, state, reactive) {
    const clip = timeline.clips[index];
    const end = timeline.clips[index + 1]?.startFrame ?? timeline.frames;
    const q = smooth(clamp((state.frame - clip.startFrame) / Math.max(1, end - clip.startFrame)));
    const params = {};
    for (const key of Object.keys(clip.paramsFrom))
      params[key] = clip.paramsFrom[key] + q * (clip.paramsTo[key] - clip.paramsFrom[key]);
    buffer.resetMatrix();
    SCENES[clip.scene].draw(buffer, context(state.trackTime, controls, reactive, params));
  }
  return {
    render(frame, reactive = true) {
      const state = stateAt(timeline, frame);
      renderLayer(buffers[1], state.index, state, reactive);
      p.noTint();
      if (!state.previous) p.image(buffers[1], 0, 0);
      else {
        renderLayer(buffers[0], state.index - 1, state, reactive);
        p.image(buffers[0], 0, 0);
        if (state.transition === 'crossfade') {
          p.tint(255, state.mix * 255);
          p.image(buffers[1], 0, 0);
          p.noTint();
        } else {
          // Soft spatial overlap: a broad incoming front travels left to right.
          const ctx = p.drawingContext;
          for (let x = 0; x < timeline.width; x += 8) {
            ctx.globalAlpha = smooth(state.mix * 2 - x / timeline.width);
            ctx.drawImage(buffers[1].canvas, x, 0, 8, timeline.height, x, 0, 8, timeline.height);
          }
          ctx.globalAlpha = 1;
        }
      }
      return state;
    },
  };
}
