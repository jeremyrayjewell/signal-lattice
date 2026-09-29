import * as A from './scenes/lattice.js';
import * as B from './scenes/ribbons.js';
import * as C from './scenes/orbits.js';
import * as D from './scenes/slabs.js';
import * as E from './scenes/filaments.js';
import * as F from './scenes/territories.js';
import * as G from './scenes/fans.js';
import * as H from './scenes/fracture.js';
import * as I from '../prototype-05r/scene-i.js';
import * as J from '../prototype-06r/scene-j.js';
import * as K from '../prototype-07r/scene-k.js';
import { stateAt } from '../prototype-03/scene-manager.js';
import { parameters } from './states.js';
import { makeContext, smooth, begin } from './shared.js';
export const SCENES = { A, B, C, D, E, F, G, H, I, J, K };
const statePosition = { CALM: 5, ACTIVE: 11, EXTREME: 20 };
function drawScene(buffer, scene, ctx, clip, frame, end, controls, reactive) {
  buffer.push();
  if ('IJK'.includes(scene)) {
    const q = smooth((frame - clip.startFrame) / Math.max(1, end - clip.startFrame));
    const elapsed =
      statePosition[clip.stateFrom] +
      (statePosition[clip.stateTo] - statePosition[clip.stateFrom]) * q;
    SCENES[scene].draw(buffer, ctx.t, elapsed, controls, reactive);
  } else SCENES[scene].draw(buffer, ctx);
  buffer.pop();
}

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
    } else
      drawScene(
        buffer,
        clip.scene,
        ctx,
        clip,
        state.frame,
        timeline.clips[index + 1]?.startFrame ?? timeline.frames,
        controls,
        reactive,
      );
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
        buffer.background(p.lerpColor(p.color('#100d24'), p.color('#160e30'), state.mix));
        // Actual geometry retracts into shared knots; territories then grow from those knots.
        // No alpha blend or screen mask is used here.
        // Keep both geometries substantial at midpoint: no sparse dead zone between them.
        const collapse = smooth(state.mix),
          unfold = smooth(state.mix);
        E.draw(buffer, oldCtx, { collapse, clear: false });
        F.draw(buffer, newCtx, { seeds: E.anchors(oldCtx), unfold, clear: false });
        p.image(buffer, 0, 0);
      } else {
        renderLayer(buffers[1], state.index, state, reactive);
        if (!state.previous) p.image(buffers[1], 0, 0);
        else {
          renderLayer(buffers[0], state.index - 1, state, reactive);
          p.image(buffers[0], 0, 0);
          if (state.transition === 'weave') {
            // Soft, curved regions overlap while BOTH scenes continue moving at track time.
            const ctx = p.drawingContext;
            for (let y = 0; y < timeline.height; y += 12)
              for (let x = 0; x < timeline.width; x += 12) {
                const field =
                  0.5 +
                  0.26 * Math.sin(x * 0.005 + y * 0.004 + state.trackTime * 0.18) +
                  0.18 * Math.cos(y * 0.009 - x * 0.003);
                ctx.globalAlpha = smooth(state.mix * 1.8 - field * 0.8);
                ctx.drawImage(buffers[1].canvas, x, y, 12, 12, x, y, 12, 12);
              }
            ctx.globalAlpha = 1;
          } else if (state.transition === 'sweep') {
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
      buffers[1].resetMatrix();
      drawScene(buffers[1], scene, ctx, clip, frame, timeline.frames, controls, reactive);
      p.noTint();
      p.image(buffers[1], 0, 0);
    },
  };
}
