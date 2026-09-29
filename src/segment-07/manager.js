// Segment 7 uses the established live-element introduction manager.
import * as CE from '../prototype-81/scene-ce.js';
import * as CF from '../prototype-82/scene-cf.js';
import * as CG from '../prototype-83/scene-cg.js';
import * as CH from '../prototype-84/scene-ch.js';
import * as CI from '../prototype-85/scene-ci.js';
import * as CJ from '../prototype-86/scene-cj.js';
import * as CK from '../prototype-87/scene-ck.js';
import * as CL from '../prototype-88/scene-cl.js';
import * as CM from '../prototype-89/scene-cm.js';
import * as CN from '../prototype-90/scene-cn.js';
import * as CO from '../prototype-91/scene-co.js';
import * as CP from '../prototype-92/scene-cp.js';
import * as CQ from '../prototype-93/scene-cq.js';
import * as CR from '../prototype-94/scene-cr.js';
import * as CS from '../prototype-95/scene-cs.js';
import * as CT from '../prototype-96/scene-ct.js';
import * as CU from '../prototype-97/scene-cu.js';
import * as CV from '../prototype-98/scene-cv.js';
import * as CW from '../prototype-99/scene-cw.js';
import * as CX from '../prototype-100/scene-cx.js';
export const SCENES = {
  CE,
  CF,
  CG,
  CH,
  CI,
  CJ,
  CK,
  CL,
  CM,
  CN,
  CO,
  CP,
  CQ,
  CR,
  CS,
  CT,
  CU,
  CV,
  CW,
  CX,
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
