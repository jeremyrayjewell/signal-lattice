# Scene BH — Noise Bloom

Eighteenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251108 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference starts from a fine mosaic of solid earth-toned tiles on black, half occupied. Over it sit three layered "clouds" of noise-perturbed organic blobs, each cloud built from many overlapping quarter-arc streaks of small filled circles at random rotations and mirrors, so they read as a soft coral-like mass rather than individual shapes: one blended with overlay and a drop shadow, one blended normally at partial opacity, and one blurred and blended with difference at a slightly smaller, static size. That third pass is drawn smaller than the other two, and because all three clouds are large enough to fill their whole square canvas edge to edge, the mismatch in size leaves a visible square frame where the smaller pass ends — the reference's most distinctive feature, together with the darker, mosaic-flecked centre that the difference blend produces. A single large white scribble thread crosses through the middle.

## Independent construction

A 48 px mosaic (half occupancy, one solid palette tile per cell) tiles the whole 960 × 540 frame on black. Three cloud passes are built independently, echoing the source's three separate graphics buffers: each is seventy overlapping blobs, and each blob traces its own noise-perturbed quarter-arc of small filled circles (own seeded value noise for both the path radius and the circle size, mirrored and rotated at random) in one palette colour, generated into a 560 × 560 canvas — large enough, together with the blobs' own reach, that the canvas fills edge to edge with little gap, matching the source's incidental full-bleed coverage.

Building a cloud is the expensive part, so each cloud is cached once per epoch (7–11 s per pass) rather than rebuilt every frame; only the three finished cloud canvases are drawn each frame, kept in step with the audio and clock through blend mode, shadow, blur, sway and pulse applied at draw time. Pass three (difference) is pre-blurred once into its own cached canvas, and — matching the source — is drawn at a fixed, non-rotated 0.833 scale against the other two full-scale, gently swaying passes, which is what produces the square frame edge and the darker, tile-flecked centre.

A single flowing scribble thread reflows continuously via a sliding value-noise window, needing no caching since it's just a line.

Reference layout, draw order, blend modes and relative scale of the three passes are kept because they are what produces the frame's structure, but no source functions, constants or literal randomness sequences are reused. Mosaic cells are individually introduced (`introFor`), and each of the three cloud passes and the scribble thread is introduced as its own large element, flying in from an offset, undersized start, rather than the scene fading or wiping in as one picture.

## Audio response

- Bass: cloud pulse (all three passes breathe together).
- Mids: cloud sway rate.
- Highs/centroid: scribble thickness.
- Impulse/onsets: shadow depth on the overlay pass.
- RMS: partial-opacity pass's alpha.
- Residue is supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-58/signal-lattice-58-scene-bh-25s.mp4`
- `renders/prototype-58/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-58/scene-bh.js`
- Preview `/pages/prototype-58.html`
- Render `node scripts/render-prototype-58.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. Cloud generation is cached per pass per epoch to keep per-frame cost low despite the many overlapping noise-path circles involved; steady-state frames render in well under half the time of a cache-miss frame. This is a standalone study for review, not a full Segment 3 assembly.
