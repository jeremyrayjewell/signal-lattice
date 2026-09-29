# Scene CB — Splinter Burst

Fills the gap at prototype-78/letter CB, previously absent (see [[segment-04.md]]: Codex's segment 4 assembly was blocked on this scene). Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250628 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is twenty-five difference-blended star-burst clusters on white, each built from forty nested rings shrinking toward the centre, alternating between a mid-grey and white. Each ring is an asymmetric six-vertex wedge spanning one quarter turn and closed across the chord, with alternating short and long vertex radii giving it a jagged, spiky edge rather than a smooth arc — and each ring's own rotation is not reset between rings, so the rotations accumulate layer to layer, producing a twisted, splintered look rather than a tidy radial star.

## Independent construction

Thirty-six bursts drift across a wrapped field slightly larger than the 960 × 540 frame. Each burst's forty ring rotations are precomputed as a running sum of independent seeded offsets, reproducing the source's un-reset, accumulating `rotate()` calls exactly, then drawn with an added continuous spin at draw time (alternating direction ring to ring) so the whole burst keeps twisting rather than sitting static. Grey/white alternation follows ring index directly, as in the source. Each burst has its own seeded life cycle (6–12 s) governing size and tone; nothing is stateful, so any frame renders alone and out of order.

Motion:

- Rings continuously spin, alternating direction by ring index.
- Ring radii pulse gently.
- Bursts drift across the wrapped field.
- At an epoch change the old burst fades out while a new one fades in.

Reference layout, the difference blend, and the accumulating-rotation structure are kept because they define the picture's identity, but no source functions, constants or literal randomness sequences are reused.

## Audio response

- Highs: ring pulse.
- Mids: spin rate.
- Bass/centroid/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-78/signal-lattice-78-scene-cb-25s.mp4`
- `renders/prototype-78/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-78/scene-cb.js`
- Preview `/pages/prototype-78.html`
- Render `node scripts/render-prototype-78.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full segment assembly.
