// Segment 8, the finale: a curated reprise mixing scenes from across the whole project (segments
// 1, 2, 3, 4 and 7) rather than new scenes, at the user's explicit request. Each clip is ONE
// hybrid scene from src/hybrids-finale, genuinely interweaving elements from its two source
// scenes -- every discrete, individually-positioned population from both sources is tagged, given
// a pseudo-depth, merged into one array, and depth-sorted every frame, exactly the technique
// established for Segment 6's segment-3 x segment-4 hybrids. Each pair bookends the project:
// I+CX bookends the very first and very last scenes; the rest sample steadily inward from there.
import * as ICX from '../hybrids-finale/i-cx.js';
import * as MCT from '../hybrids-finale/m-ct.js';
import * as QCP from '../hybrids-finale/q-cp.js';
import * as UCL from '../hybrids-finale/u-cl.js';
import * as YCH from '../hybrids-finale/y-ch.js';
import * as ACCD from '../hybrids-finale/ac-cd.js';
import * as AGBZ from '../hybrids-finale/ag-bz.js';
import * as AKBV from '../hybrids-finale/ak-bv.js';
import * as AOBR from '../hybrids-finale/ao-br.js';
import * as ASBN from '../hybrids-finale/as-bn.js';
import * as AWBJ from '../hybrids-finale/aw-bj.js';
import * as BABF from '../hybrids-finale/ba-bf.js';

export const HYBRIDS = {
  'I+CX': ICX,
  'M+CT': MCT,
  'Q+CP': QCP,
  'U+CL': UCL,
  'Y+CH': YCH,
  'AC+CD': ACCD,
  'AG+BZ': AGBZ,
  'AK+BV': AKBV,
  'AO+BR': AOBR,
  'AS+BN': ASBN,
  'AW+BJ': AWBJ,
  'BA+BF': BABF,
};

export const TRANSITION_TYPES = ['cut', 'introduce'];
const smooth = (v) => {
  const q = Math.max(0, Math.min(1, v));
  return q * q * (3 - 2 * q);
};
const statePosition = { CALM: 5, ACTIVE: 11, EXTREME: 20 };

function drawHybrid(buffer, clip, trackTime, frame, end, controls, reactive, intro) {
  buffer.push();
  const q = smooth((frame - clip.startFrame) / Math.max(1, end - clip.startFrame));
  const elapsed =
    statePosition[clip.stateFrom] +
    (statePosition[clip.stateTo] - statePosition[clip.stateFrom]) * q;
  HYBRIDS[clip.scene].draw(buffer, trackTime, elapsed, controls, reactive, intro);
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
      pair: clip.scene,
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
        drawHybrid(buffer, clip, state.trackTime, state.frame, end, controls, reactive, 1);
      } else if (state.transitionType === 'cut') {
        const prevClip = timeline.clips[state.index - 1];
        const prevEnd = clip.startFrame;
        if (state.mix < 1)
          drawHybrid(
            buffer,
            prevClip,
            state.trackTime,
            state.frame,
            prevEnd,
            controls,
            reactive,
            1,
          );
        else drawHybrid(buffer, clip, state.trackTime, state.frame, end, controls, reactive, 1);
      } else {
        const prevClip = timeline.clips[state.index - 1];
        const prevEnd = clip.startFrame;
        drawHybrid(buffer, prevClip, state.trackTime, state.frame, prevEnd, controls, reactive, 1);
        drawHybrid(buffer, clip, state.trackTime, state.frame, end, controls, reactive, state.mix);
      }
      p.noTint();
      p.image(buffer, 0, 0);
      return state;
    },
  };
}
