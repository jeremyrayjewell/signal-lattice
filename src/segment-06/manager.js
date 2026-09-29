// Segment 6, corrected: each clip is now ONE hybrid scene, not a pair of
// whole scenes drawn on top of each other. Slot k's hybrid genuinely
// interweaves elements from the k-th scene of segment 3 (AQ, AR, AS...)
// with elements from the k-th scene of segment 4 (BK, BL, BM...): every
// discrete, individually-positioned population from both sources is tagged,
// given a pseudo-depth, merged into one array, and depth-sorted every
// frame, so the two sources' elements are drawn from a single shared
// population rather than one whole layer permanently on top of the other.
// Monolithic/batch content that can't be split into individually-orderable
// draws (private blur/posterize buffers, cached WebGL solids, procedural
// backgrounds) stays as its own background/overlay pass within the hybrid.
// See src/hybrids-3x4/*.js for the 20 hybrid scenes and docs/segment-06.md
// for the full writeup.
import * as aqbk from '../hybrids-3x4/aq-bk.js';
import * as arbl from '../hybrids-3x4/ar-bl.js';
import * as asbm from '../hybrids-3x4/as-bm.js';
import * as atbn from '../hybrids-3x4/at-bn.js';
import * as aubo from '../hybrids-3x4/au-bo.js';
import * as avbp from '../hybrids-3x4/av-bp.js';
import * as awbq from '../hybrids-3x4/aw-bq.js';
import * as axbr from '../hybrids-3x4/ax-br.js';
import * as aybs from '../hybrids-3x4/ay-bs.js';
import * as azbt from '../hybrids-3x4/az-bt.js';
import * as babu from '../hybrids-3x4/ba-bu.js';
import * as bbbv from '../hybrids-3x4/bb-bv.js';
import * as bcbw from '../hybrids-3x4/bc-bw.js';
import * as bdbx from '../hybrids-3x4/bd-bx.js';
import * as beby from '../hybrids-3x4/be-by.js';
import * as bfbz from '../hybrids-3x4/bf-bz.js';
import * as bgca from '../hybrids-3x4/bg-ca.js';
import * as bhcb from '../hybrids-3x4/bh-cb.js';
import * as bicc from '../hybrids-3x4/bi-cc.js';
import * as bjcd from '../hybrids-3x4/bj-cd.js';

export const HYBRIDS = {
  'AQ+BK': aqbk,
  'AR+BL': arbl,
  'AS+BM': asbm,
  'AT+BN': atbn,
  'AU+BO': aubo,
  'AV+BP': avbp,
  'AW+BQ': awbq,
  'AX+BR': axbr,
  'AY+BS': aybs,
  'AZ+BT': azbt,
  'BA+BU': babu,
  'BB+BV': bbbv,
  'BC+BW': bcbw,
  'BD+BX': bdbx,
  'BE+BY': beby,
  'BF+BZ': bfbz,
  'BG+CA': bgca,
  'BH+CB': bhcb,
  'BI+CC': bicc,
  'BJ+CD': bjcd,
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
        // Outgoing hybrid draws fully and normally first (it keeps playing);
        // the incoming hybrid then draws its own elements on the same canvas
        // at their staggered entry positions, without clearing what's there.
        drawHybrid(buffer, prevClip, state.trackTime, state.frame, prevEnd, controls, reactive, 1);
        drawHybrid(buffer, clip, state.trackTime, state.frame, end, controls, reactive, state.mix);
      }
      p.noTint();
      p.image(buffer, 0, 0);
      return state;
    },
  };
}
