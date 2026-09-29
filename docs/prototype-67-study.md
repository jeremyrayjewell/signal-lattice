# Scene BQ — Woven Waves

Twenty-seventh new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251008 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid of square cells on black, each holding a rough collage of ten overlapping rectangles in black, white or a nine-colour muted palette, then rotated ninety degrees at random, with four to sixteen wavy horizontal lines drawn over it. Each line's wobble is pinched to nothing at the cell's left and right edges and swells to its widest in the middle, so adjacent cells' lines meet flush at the seams while the interior reads as a loose weave. Rectangle collage blocks under a pinch-in-the-middle wave weave is the defining relationship.

## Independent construction

A 108 px grid (a fifth of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with a one-cell wrap margin and a slow continuous drift, as in the other lettered grid scenes. Each cell's ten collage rectangles and four-to-sixteen wave rows are a pure function of the cell and a local epoch number, re-rolled every 4–8 s. Each wave row is drawn as a smoothed path through points spaced across the cell, with per-point vertical jitter that tapers linearly from zero at the cell's edges to its maximum at the centre, reproducing the source's pinch-in-the-middle taper exactly, plus a continuous sine ripple on top so the waves keep undulating rather than sitting static.

Motion:

- Wave rows ripple continuously along their length.
- At an epoch change the old cell content dissolves while a new one fades in.
- The whole grid drifts slowly, wrapping at the frame edge.

Reference layout, draw order and source functions are not reused.

## Audio response

- Highs: wave ripple amplitude and line weight.
- Centroid/RMS/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-67/signal-lattice-67-scene-bq-25s.mp4`
- `renders/prototype-67/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-67/scene-bq.js`
- Preview `/pages/prototype-67.html`
- Render `node scripts/render-prototype-67.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own black backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
