// Segment 5, corrected: each clip is a PAIR of scenes drawn together, permanently
// overlapping, for the whole slot -- not a cut between two whole scenes, and not
// a transitional overlap that settles into just one of them. Slot k pairs the
// k-th scene of segment 1 (I, J, K...) with the k-th scene of segment 2 (W, X,
// Y..., which are literally prototype-21 through prototype-40, so "the 1st of
// segment 2" is prototype-21, "the 2nd" is prototype-22, and so on).
//
// The trick: every scene already gates its own background()/full-clear behind
// `if (intro >= 1)`, exactly at 1. The PRIMARY scene of a pair is drawn with
// ordinary intro semantics (1 when settled, the transition mix while flying in)
// so it establishes the background as usual. The SECONDARY scene is always
// drawn with intro capped just under 1 (0.999) -- introFor's easing is already
// visually complete by then (every element reaches ~99.8%+ of its settled
// state, regardless of its per-element delay), but the strict >=1 gate never
// fires, so its background call never erases the primary scene beneath it.
// That same cap works during a live transition into a new pair (min(mix, .999))
// and forever after (once mix reaches 1, it is still capped at .999) -- one
// formula covers both "flying in" and "permanently settled".
import { SCENES } from '../scene-reel/manager.js';

export const TRANSITION_TYPES = ['cut', 'introduce'];
const smooth = (v) => {
  const q = Math.max(0, Math.min(1, v));
  return q * q * (3 - 2 * q);
};
const statePosition = { CALM: 5, ACTIVE: 11, EXTREME: 20 };

function drawPair(buffer, clip, trackTime, frame, end, controls, reactive, intro) {
  buffer.push();
  const q = smooth((frame - clip.startFrame) / Math.max(1, end - clip.startFrame));
  const elapsed =
    statePosition[clip.stateFrom] +
    (statePosition[clip.stateTo] - statePosition[clip.stateFrom]) * q;
  SCENES[clip.primary].draw(buffer, trackTime, elapsed, controls, reactive, intro);
  SCENES[clip.secondary].draw(
    buffer,
    trackTime,
    elapsed,
    controls,
    reactive,
    Math.min(intro, 0.999),
  );
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
      pair: `${clip.primary}+${clip.secondary}`,
      previous: overlap ? `${clips[index - 1].primary}+${clips[index - 1].secondary}` : null,
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
        drawPair(buffer, clip, state.trackTime, state.frame, end, controls, reactive, 1);
      } else if (state.transitionType === 'cut') {
        const prevClip = timeline.clips[state.index - 1];
        const prevEnd = clip.startFrame;
        if (state.mix < 1)
          drawPair(buffer, prevClip, state.trackTime, state.frame, prevEnd, controls, reactive, 1);
        else drawPair(buffer, clip, state.trackTime, state.frame, end, controls, reactive, 1);
      } else {
        const prevClip = timeline.clips[state.index - 1];
        const prevEnd = clip.startFrame;
        // Outgoing pair draws fully and normally first (it keeps playing);
        // the incoming pair then draws its own elements on the same canvas
        // at their staggered entry positions, without clearing what's there.
        drawPair(buffer, prevClip, state.trackTime, state.frame, prevEnd, controls, reactive, 1);
        drawPair(buffer, clip, state.trackTime, state.frame, end, controls, reactive, state.mix);
      }
      p.noTint();
      p.image(buffer, 0, 0);
      return state;
    },
  };
}
