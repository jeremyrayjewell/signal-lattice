import * as A from './scenes/lattice.js';
import * as B from './scenes/ribbons.js';
import * as C from './scenes/orbits.js';
import * as D from './scenes/slabs.js';
import * as E from './scenes/filaments.js';
import * as F from './scenes/territories.js';
import * as G from './scenes/fans.js';
import * as H from './scenes/fracture.js';
import { stateAt } from '../prototype-03/scene-manager.js';
import { parameters } from './states.js';
import { makeContext, smooth, begin } from './shared.js';
export const SCENES = { A, B, C, D, E, F, G, H };

export function createManager(p, timeline, controls) {
  const buffers = [
    p.createGraphics(timeline.width, timeline.height),
    p.createGraphics(timeline.width, timeline.height),
  ];
  buffers.forEach((b) => b.pixelDensity(1));
  function context(index, state, reactive) {
    const clip = timeline.clips[index],
      end = timeline.clips[index + 1]?.startFrame ?? timeline.frames;
    return makeContext(
      state.trackTime,
      controls,
      parameters(clip, state.frame, end),
      clip.variant,
      reactive,
    );
  }
  function renderLayer(buffer, index, state, reactive) {
    const clip = timeline.clips[index],
      ctx = context(index, state, reactive);
    buffer.resetMatrix();
    if (
      clip.scene === 'F' &&
      clip.transition?.type === 'structural' &&
      timeline.clips[index - 1]?.scene === 'E'
    ) {
      const inherited = E.anchors(context(index - 1, state, reactive)),
        native = F.anchors(ctx);
      const settle = smooth((state.frame - clip.startFrame - clip.transition.frames) / 120);
      const seeds = inherited.map((a, i) => a.map((v, k) => v + (native[i][k] - v) * settle));
      F.draw(buffer, ctx, { seeds });
    } else SCENES[clip.scene].draw(buffer, ctx);
  }
  return {
    render(frame, reactive = true) {
      const state = stateAt(timeline, frame);
      state.parameters = context(state.index, state, reactive).params;
      const clip = timeline.clips[state.index];
      p.noTint();
      if (state.previous && state.transition === 'structural') {
        if (state.previous !== 'E' || state.scene !== 'F')
          throw new Error(
            'Structural adapter currently supports E → F only; use crossfade for other pairs.',
          );
        const buffer = buffers[1],
          oldCtx = context(state.index - 1, state, reactive),
          newCtx = context(state.index, state, reactive);
        buffer.resetMatrix();
        begin(buffer);
        // Actual geometry retracts into shared knots; territories then grow from those knots.
        // No alpha blend or screen mask is used here.
        const collapse = smooth(state.mix / 0.58),
          unfold = smooth((state.mix - 0.38) / 0.62);
        E.draw(buffer, oldCtx, { collapse, clear: false });
        F.draw(buffer, newCtx, { seeds: E.anchors(oldCtx), unfold, clear: false });
        p.image(buffer, 0, 0);
      } else {
        renderLayer(buffers[1], state.index, state, reactive);
        if (!state.previous) p.image(buffers[1], 0, 0);
        else {
          renderLayer(buffers[0], state.index - 1, state, reactive);
          p.image(buffers[0], 0, 0);
          if (state.transition === 'sweep') {
            const ctx = p.drawingContext;
            for (let x = 0; x < timeline.width; x += 8) {
              ctx.globalAlpha = smooth(state.mix * 2 - x / timeline.width);
              ctx.drawImage(buffers[1].canvas, x, 0, 8, timeline.height, x, 0, 8, timeline.height);
            }
            ctx.globalAlpha = 1;
          } else {
            p.tint(255, state.mix * 255);
            p.image(buffers[1], 0, 0);
            p.noTint();
          }
        }
      }
      return state;
    },
    renderFamily(scene, frame, preset, reactive = true) {
      const clip = { stateFrom: preset, stateTo: preset, startFrame: 0 };
      const ctx = makeContext(
        timeline.selection.start + frame / 30,
        controls,
        parameters(clip, frame, timeline.frames),
        0,
        reactive,
      );
      SCENES[scene].draw(buffers[1], ctx);
      p.noTint();
      p.image(buffers[1], 0, 0);
    },
  };
}
