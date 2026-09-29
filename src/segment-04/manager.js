// Segment 4 uses the established live-element introduction manager.
import * as BK from '../prototype-61/scene-bk.js';
import * as BL from '../prototype-62/scene-bl.js';
import * as BM from '../prototype-63/scene-bm.js';
import * as BN from '../prototype-64/scene-bn.js';
import * as BO from '../prototype-65/scene-bo.js';
import * as BP from '../prototype-66/scene-bp.js';
import * as BQ from '../prototype-67/scene-bq.js';
import * as BR from '../prototype-68/scene-br.js';
import * as BS from '../prototype-69/scene-bs.js';
import * as BT from '../prototype-70/scene-bt.js';
import * as BU from '../prototype-71/scene-bu.js';
import * as BV from '../prototype-72/scene-bv.js';
import * as BW from '../prototype-73/scene-bw.js';
import * as BX from '../prototype-74/scene-bx.js';
import * as BY from '../prototype-75/scene-by.js';
import * as BZ from '../prototype-76/scene-bz.js';
import * as CA from '../prototype-77/scene-ca.js';
import * as CB from '../prototype-78/scene-cb.js';
import * as CC from '../prototype-79/scene-cc.js';
import * as CD from '../prototype-80/scene-cd.js';
export const SCENES = {
  BK,
  BL,
  BM,
  BN,
  BO,
  BP,
  BQ,
  BR,
  BS,
  BT,
  BU,
  BV,
  BW,
  BX,
  BY,
  BZ,
  CA,
  CB,
  CC,
  CD,
};
export const TRANSITION_TYPES = ['cut', 'introduce'];
const smooth = (v) => {
  const q = Math.max(0, Math.min(1, v));
  return q * q * (3 - 2 * q);
};
const statePosition = { CALM: 5, ACTIVE: 11, EXTREME: 20 };

function drawScene(buffer, clip, trackTime, frame, end, controls, reactive, intro) {
  buffer.push();
  const q = smooth((frame - clip.startFrame) / Math.max(1, end - clip.startFrame));
  const elapsed =
    statePosition[clip.stateFrom] +
    (statePosition[clip.stateTo] - statePosition[clip.stateFrom]) * q;
  SCENES[clip.scene].draw(buffer, trackTime, elapsed, controls, reactive, intro);
  buffer.pop();
}

export function createManager(p, timeline, controls) {
  const buffer = p.createGraphics(timeline.width, timeline.height);
  buffer.pixelDensity(1);

  function stateAt(frame) {
    const clips = timeline.clips;
    let index = 0;
    while (index + 1 < clips.length && frame >= clips[index + 1].startFrame) index++;
    const clip = clips[index];
    const age = frame - clip.startFrame;
    const overlap = index > 0 && clip.transition && age < clip.transition.frames;
    return {
      frame,
      trackTime: timeline.selection.start + frame / timeline.fps,
      index,
      scene: clip.scene,
      previous: overlap ? clips[index - 1].scene : null,
      mix: overlap ? smooth(age / clip.transition.frames) : 1,
      transitionType: overlap ? clip.transition.type : null,
    };
  }

  return {
    render(frame, reactive = true) {
      const state = stateAt(frame);
      const clip = timeline.clips[state.index];
      const end = timeline.clips[state.index + 1]?.startFrame ?? timeline.frames;
      buffer.resetMatrix();
      if (!state.previous) {
        drawScene(buffer, clip, state.trackTime, state.frame, end, controls, reactive, 1);
      } else if (state.transitionType === 'cut') {
        const prevClip = timeline.clips[state.index - 1];
        const prevEnd = clip.startFrame;
        if (state.mix < 1)
          drawScene(buffer, prevClip, state.trackTime, state.frame, prevEnd, controls, reactive, 1);
        else drawScene(buffer, clip, state.trackTime, state.frame, end, controls, reactive, 1);
      } else {
        const prevClip = timeline.clips[state.index - 1];
        const prevEnd = clip.startFrame;
        // Outgoing scene draws fully and normally first (it keeps playing);
        // the incoming scene then draws its own elements on the same canvas
        // at their staggered entry positions, without clearing what's there.
        drawScene(buffer, prevClip, state.trackTime, state.frame, prevEnd, controls, reactive, 1);
        drawScene(buffer, clip, state.trackTime, state.frame, end, controls, reactive, state.mix);
      }
      p.noTint();
      p.image(buffer, 0, 0);
      return state;
    },
  };
}
