// A timeline manager for the lettered scene studies (I-BJ), mirroring the
// pattern already established in prototype-09/scene-manager.js for scenes
// I/J/K: each clip maps its own CALM/ACTIVE/EXTREME span onto the scene's
// local elapsed clock via the same named-anchor positions. This file is
// independent of prototype-09's manager so that project's existing renders
// stay untouched; it just imports the scene modules directly.
//
// Transitions are not post-hoc compositing of two finished pictures (no
// crossfade, no wipe/iris/sweep mask, no image-tile dissolve — all of those
// still read as "a transition" regardless of the mask shape, because nothing
// is actually introduced, a picture is just revealed). Instead the incoming
// scene is drawn on the SAME canvas, live, on top of the still-live outgoing
// scene, with its own `intro` parameter: each scene's own elements start
// offset from their normal position and undersized, then fly in and settle,
// staggered per element (via timing.js's introFor). Both scenes are
// genuinely animating throughout — this is elements of scene B moving into
// frame while scene A keeps playing, not a mask over two flat renders.
// 'cut' remains available as an instant, non-introduced hard edit.
import * as I from '../prototype-05r/scene-i.js';
import * as J from '../prototype-06r/scene-j.js';
import * as K from '../prototype-07r/scene-k.js';
import * as L from '../prototype-10/scene-l.js';
import * as M from '../prototype-11/scene-m.js';
import * as N from '../prototype-12t/scene-n.js';
import * as O from '../prototype-13/scene-o.js';
import * as P from '../prototype-14/scene-p.js';
import * as Q from '../prototype-15/scene-q.js';
import * as R from '../prototype-16/scene-r.js';
import * as S from '../prototype-17/scene-s.js';
import * as T from '../prototype-18/scene-t.js';
import * as U from '../prototype-19/scene-u.js';
import * as V from '../prototype-20/scene-v.js';
import * as W from '../prototype-21/scene-w.js';
import * as X from '../prototype-22/scene-x.js';
import * as Y from '../prototype-23/scene-y.js';
import * as Z from '../prototype-24/scene-z.js';
import * as AA from '../prototype-25/scene-aa.js';
import * as AB from '../prototype-26/scene-ab.js';
import * as AC from '../prototype-27/scene-ac.js';
import * as AD from '../prototype-28/scene-ad.js';
import * as AE from '../prototype-29/scene-ae.js';
import * as AF from '../prototype-30/scene-af.js';
import * as AG from '../prototype-31/scene-ag.js';
import * as AH from '../prototype-32/scene-ah.js';
import * as AI from '../prototype-33/scene-ai.js';
import * as AJ from '../prototype-34/scene-aj.js';
import * as AK from '../prototype-35/scene-ak.js';
import * as AL from '../prototype-36/scene-al.js';
import * as AM from '../prototype-37/scene-am.js';
import * as AN from '../prototype-38/scene-an.js';
import * as AO from '../prototype-39/scene-ao.js';
import * as AP from '../prototype-40/scene-ap.js';
import * as AQ from '../prototype-41/scene-aq.js';
import * as AR from '../prototype-42/scene-ar.js';
import * as AS from '../prototype-43/scene-as.js';
import * as AT from '../prototype-44/scene-at.js';
import * as AU from '../prototype-45/scene-au.js';
import * as AV from '../prototype-46/scene-av.js';
import * as AW from '../prototype-47/scene-aw.js';
import * as AX from '../prototype-48/scene-ax.js';
import * as AY from '../prototype-49/scene-ay.js';
import * as AZ from '../prototype-50/scene-az.js';
import * as BA from '../prototype-51/scene-ba.js';
import * as BB from '../prototype-52/scene-bb.js';
import * as BC from '../prototype-53/scene-bc.js';
import * as BD from '../prototype-54/scene-bd.js';
import * as BE from '../prototype-55/scene-be.js';
import * as BF from '../prototype-56/scene-bf.js';
import * as BG from '../prototype-57/scene-bg.js';
import * as BH from '../prototype-58/scene-bh.js';
import * as BI from '../prototype-59/scene-bi.js';
import * as BJ from '../prototype-60/scene-bj.js';

export const SCENES = {
  I,
  J,
  K,
  L,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
  AA,
  AB,
  AC,
  AD,
  AE,
  AF,
  AG,
  AH,
  AI,
  AJ,
  AK,
  AL,
  AM,
  AN,
  AO,
  AP,
  AQ,
  AR,
  AS,
  AT,
  AU,
  AV,
  AW,
  AX,
  AY,
  AZ,
  BA,
  BB,
  BC,
  BD,
  BE,
  BF,
  BG,
  BH,
  BI,
  BJ,
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
