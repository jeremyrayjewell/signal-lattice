# Scene S — Pastel Static

## Reference analysis, 2026-09-23

E.C.H. / Eiichi Ishii, dailycoding - 20250809 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a black-ground 8x8 grid where each cell holds one of two flat pastel archetypes: a circle plus a fan of nested quarter-wedges plus a corner pie and triangle, or a corner triangle plus a comb of alternating-height vertical bars plus a circle. A separate fine grayscale noise/static texture, blended over the whole frame independent of the cell grid, dithers everything uniformly.

## Independent implementation

Scene S tiles a 10x6 grid of 96px cells across the 960x540 frame on black (a slight ~36px crop at the bottom row, in keeping with this project's established tolerance for minor grid overflow at 16:9). Each cell independently picks one of two archetypes (own geometry for both — nested quarter-wedge fan / corner pie / corner triangle, or corner triangle / bar comb / circle — not the source's arc/ellipse calls), a base 90-degree rotation, and eight sub-shape colors from an independently authored five-color pastel palette. A separate global noise-dither layer (a precomputed grid of small tiles with random brightness/alpha, blended with `overlay`) is drawn over the whole frame afterward, independent of the cell grid, echoing the source's tiled blend-mode static without copying its loop.

## Motion and music

- Autonomous: each cell's rotation wobbles gently; the arc-fan/bar-comb spacing breathes slowly.
- A small delay offset keyed to each cell's grid position (`(col+row) * 0.018s`, reused from Scenes P/R) sends transients rippling diagonally across the grid.
- Bass: cell scale pulses.
- Mids: arc-fan/bar-comb spacing breathes more widely.
- Highs: noise overlay shimmers more.
- Transient impulse: brief per-cell brightness flash (riding the ripple delay) plus a brief global noise "static burst."
- RMS: modest overall lightness boost via the noise layer's ambient sample.
- Centroid: subtle hue bias (brightness lift) on cell sub-shapes.
- A slowly traveling subset of cells (the per-id sine "selected" technique used in Scenes N/O/P/Q/R) reads with slightly boosted brightness.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-17/signal-lattice-17-scene-s-25s.mp4
- Contact sheet: renders/prototype-17/contact-sheet.jpg
- Source: src/prototype-17/scene-s.js
- Preview: /pages/prototype-17.html
- Render: node scripts/render-prototype-17.mjs

All previous scenes and renders remain unchanged. Scene S is not added to the full-track timeline; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and inspected: both archetypes, the pastel palette, per-cell rotation and the fine noise-dither texture all read correctly against the reference. No pipeline regression was found. Stopped for review.
