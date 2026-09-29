# Scene CG — Dash Lattice

Third new study for Segment 7. Slot 82/letter CF (Codex's Scene CF, "Checker Apertures") exists on disk; earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260924 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference tiles a fifth-of-height grid of cells, columns a full cell apart but rows packed a quarter-cell apart so neighbouring rows heavily overlap. Each cell draws a short strip of small squares — four to twenty of them, each independently coloured from a warm gold/rust/teal/cream palette — along one of four 45-degree-apart axes, and about half the cells additionally get a thin black square outline whose four corners are each independently sharp or fully rounded to a quarter circle. The dense row overlap turns the coloured strips into crossing diagonal dashes, while the black outlines' rounded corners chain into circle-and-arc fragments threading through the grid.

## Independent construction

A 108 px grid (a fifth of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with columns a full cell apart and rows a quarter-cell apart — the source's own tight vertical packing, kept exactly, is what produces the overlapping-dash density. Each cell's recipe — square count, strip axis, each square's own colour, and whether it carries a black outline plus that outline's four independent corner radii (sharp or full quarter-circle, canvas `roundRect`'s per-corner array) — is a pure function of the cell and a local epoch number, re-rolled every 4–8 s. Nothing is stateful, so any frame renders alone and out of order. The colour palette is newly authored (12 warm gold/rust/teal/cream tones), not the source's own values; reference layout, draw order and source functions are not reused.

Motion:

- A cell's strip axis holds steady but carries a slight continuous tilt wobble, so it never reads as perfectly frozen.
- Small squares pulse gently in scale.
- At an epoch change the old cell content dissolves while a new one fades in.
- The whole grid drifts slowly, wrapping at the frame edge.

## Audio response

- Highs: strip-axis wobble amplitude.
- Bass: square pulse depth.
- Centroid: per-square shimmer within a strip.
- Impulse/onsets: black-outline stroke weight.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-83/signal-lattice-83-scene-cg-25s.mp4`
- `renders/prototype-83/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-83/scene-cg.js`
- Preview `/pages/prototype-83.html`
- Render `node scripts/render-prototype-83.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
