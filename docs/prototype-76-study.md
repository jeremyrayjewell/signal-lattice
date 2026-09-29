# Scene BZ — Ink Wash Noise

Thirty-third new study for Segment 3 (following prototype-75, Codex's Scene BY, "Stripe Counterpoint"). Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250708 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grey field of two overlapping textures. The first is a hundred overlapping rotated rectangles, each filled with dozens of low-alpha, noise-wobbled horizontal scanlines whose vertical jitter is large enough to make the fill read as wavy, hand-brushed hatching rather than clean lines; stacked and blended normally, these accumulate into black-and-white ink-blot, Rorschach-like regions. The second is a hundred overlay-blended clusters of hundreds of tiny squares clustered in a soft ring or blob shape, at random alpha, giving a fine pixel-grain texture over the blots. Ink-wash blots under a fine noise grain is the defining relationship.

## Independent construction

Each of a hundred and ten ink-blot instances is a bundle of thirty wavy scanlines, drawn once per epoch into a small cached canvas rather than redrawn every frame — each canvas needs many overlapping low-alpha strokes to build up its blotchy look, and that is too expensive to repeat every frame across a hundred-plus instances. Scanline waviness comes from our own seeded value noise rather than the source's `noise()` calls. Sprites are built at roughly a third of final size and scaled up at draw time, the same technique used for the spiral sprites in [Scene BN](prototype-64-study.md), since the individual strokes are soft enough that the reduced resolution costs nothing visible.

A hundred and ten noise-cloud instances, each a cached scatter of two hundred and sixty tiny squares in a soft ring around a centre with per-square alpha, are drawn overlay-blended on top, the same private-sprite caching approach.

Both populations drift across a wrapped field slightly larger than the 960 × 540 frame, each with its own seeded life cycle (5–11 s) governing size, tone and rotation. Nothing is stateful: building a sprite is a pure function of the instance and epoch number, so any frame renders alone and out of order.

Motion:

- Ink blots breathe gently in scale.
- Noise clouds pulse slightly with highs.
- Both populations drift continuously across the wrapped field.
- At an epoch change a fresh sprite fades in over the old.

Reference layout and the two-layer blot-then-grain structure are kept because they define the picture's identity, but no source functions, constants or literal randomness sequences are reused.

## Audio response

- Bass: ink-blot breathing.
- Highs: noise-cloud pulse.
- Mids/centroid/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each instance responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-76/signal-lattice-76-scene-bz-25s.mp4`
- `renders/prototype-76/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-76/scene-bz.js`
- Preview `/pages/prototype-76.html`
- Render `node scripts/render-prototype-76.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
