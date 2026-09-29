export const SETTINGS = Object.freeze({
  width: 540,
  height: 960,
  fps: 30,
  frames: 300,
  seed: 73129,
});

// Drawn once when this module first evaluates -- once per live-preview page load, and once per
// offline render script invocation (each does exactly one page navigation). Every scene keeps
// hashing through the same randomAt() calls with the same scene-local literal it always has; this
// only changes what that hash produces, so a run looks like a fresh instance of the same generative
// system each time (matching how the source dailycoding sketches reseed on every page load) while
// staying perfectly stable frame-to-frame within one run, since RUN_SEED never changes after this
// module is first evaluated. Pass ?seed=N in the page URL to pin a specific run for reproduction.
const urlParams = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
const forcedSeed = urlParams?.get('seed');
export const RUN_SEED = forcedSeed ? Number(forcedSeed) >>> 0 : (Math.random() * 0x100000000) >>> 0;
if (typeof window !== 'undefined') window.__signalLatticeRunSeed = RUN_SEED;

export function stateAt(frame) {
  if (!Number.isSafeInteger(frame) || frame < 0)
    throw new Error('Frame must be a nonnegative integer');
  return Object.freeze({ frame, time: frame / SETTINGS.fps, seed: SETTINGS.seed ^ RUN_SEED });
}

// Stateless integer hash: independent of evaluation order and previous frames within one run.
export function randomAt(seed, index) {
  let n = (seed ^ RUN_SEED ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x21f0aaad);
  n = Math.imul(n ^ (n >>> 15), 0x735a2d97);
  return ((n ^ (n >>> 15)) >>> 0) / 4294967296;
}

// A seeded, staggered "entry" offset scene modules can use to support partial
// introduction during a cross-scene transition: element `id` starts offset
// from its normal position (direction/distance seeded per id) and undersized,
// arriving at its own staggered time within intro (0-1), so distinct elements
// visibly fly in and settle into their normal position rather than a mask
// revealing an already-finished picture. When intro>=1 (default, normal
// playback) this always returns the identity {0,0,1,true}, so existing
// scenes/renders are completely unaffected unless a caller passes intro<1.
const INTRO_TAU = Math.PI * 2;
export function introFor(id, intro, spread = 460) {
  if (intro >= 1) return { dx: 0, dy: 0, scale: 1, active: true };
  const delay = randomAt(424242, id * 7 + 3) * 0.55;
  const local = Math.max(0, Math.min(1, (intro - delay) / (1 - delay)));
  if (local <= 0) return { dx: 0, dy: 0, scale: 0, active: false };
  const q = local - 1,
    eased = 1 + 2.4 * q * q * q + 1.4 * q * q; // easeOutBack
  const ang = randomAt(424242, id * 7 + 5) * INTRO_TAU;
  const dist = spread * (1 - Math.min(1, eased));
  return {
    dx: Math.cos(ang) * dist,
    dy: Math.sin(ang) * dist,
    scale: Math.max(0, Math.min(1.1, eased)),
    active: true,
  };
}
