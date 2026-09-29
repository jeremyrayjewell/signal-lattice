# Scene BE — Hard-Light Swash

Fifteenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251120 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference layers three passes on white. First, about a hundred randomly placed and rotated bundles of nearly-parallel wavy strokes in a ten-colour palette, translucent, blended with hard light, so overlaps saturate and darken into a painterly swash. Second, a handful of very large, thin scribble threads in pure black or white, blended with overlay, sweeping across and beyond the whole frame. Third, a loose grid of semi-transparent black or white squares, each row shifted sideways, sitting on top in normal blend, giving the picture a broken checker structure. Saturated hard-light paint, fine scribble threads and a translucent checker overlay is the defining relationship.

## Independent construction

**Bundles:** about 130 bundles (scaled up from the source's hundred for this wider frame), each a single flowing noise-driven centreline stroked as nine slightly offset, low-alpha translucent copies rather than the source's many nearly-identical rows — the same "stack of jittered copies" technique already used for the ribbon and window textures in [Scene BA](prototype-51-study.md), which gives the same soft painterly swash far more cheaply. Each bundle has its own seeded life cycle of 6–12 s; every "epoch" is a pure function of the bundle and epoch number: rotation, length, palette colour, base alpha and noise seed. Bundles live on a wrapped field slightly larger than the frame and drift continuously, each on its own factor.

**Loop threads:** fourteen large scribbles, each a flowing two-axis noise walk sampled across a sliding time window so the whole thread continuously reshapes, spanning well beyond the frame edges as in the source. Colour is fixed black or white per thread, changing only every nine seconds.

**Checker overlay:** a 19 × 8 grid of squares, each row shifted sideways by a slow sine wander instead of a single random offset per row, so the shift itself drifts. Cell colour (black or white) is fixed per cell; whether a cell is visible at all flips on a steady, time-quantized hashed cadence, giving the checker a subtle flicker rather than the source's one-shot random draw.

Draw order and blend modes match the source's structure — hard light, then overlay, then normal — but no source functions, constants or literal randomness sequences are reused.

## Audio response

- Bass: extra wave amplitude in the bundle flow.
- Mids: bundle flow noise scale.
- Highs: bundle alpha and checker-cell alpha.
- RMS: bundle alpha.
- Centroid: loop thread weight.
- Onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each bundle responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-55/signal-lattice-55-scene-be-25s.mp4`
- `renders/prototype-55/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-55/scene-be.js`
- Preview `/pages/prototype-55.html`
- Render `node scripts/render-prototype-55.mjs`
- Analysis `assets/analysis/prototype-02.json`

Unlike [Scene BD](prototype-54-study.md), this scene's blend modes are local to each drawing operation rather than a whole-frame post effect, so no private buffer is needed: bundles, threads and checker cells are each introduced directly with `introFor`, flying in and blending live against whatever is already on the canvas, including the outgoing scene during a transition. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
