# Scene X — Halftone Loops

## Reference analysis, 2026-09-24

E.C.H. / Eiichi Ishii, dailycoding - 20251021 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a grid of square tiles, each a halftone/polka-dot pattern with dot size tapering across the tile (rotated and vertically squashed independently per tile), in a flat five-color palette. Over this, a sparser layer of large, smooth, continuously looping scribble curves in bright cyan/white/black sweeps across the frame, blended so it glows against the dot tiles.

## Independent implementation

Scene X tiles an 8x4 grid of 135px cells across the 960x540 frame. Each tile independently fixes a color pair, a dot-lattice rotation, vertical squash, per-tile origin offset and dot density (4-6 across), then precomputes its own dot grid with radius tapering from the tile's horizontal center outward (own taper formula, not the source's `map()` calls), clipped to the tile's bounds. A separate layer of 18 smooth closed loops (each a sum of two independent harmonics — an own multi-frequency construction, not the source's Perlin-noise curve) in bright accent colors is blended over everything with `overlay` compositing, giving the glowing look against the tiles.

## Motion and music

- Autonomous: each tile's dot lattice rotates gently; loop curves drift and rotate independently.
- A small delay offset keyed to each tile's grid position (`(col+row) * 0.016s`, reused from the earlier grid scenes) sends transients rippling diagonally across the grid.
- Bass: dot radius pulses; tile scale breathes slightly.
- Mids: dot-lattice rotation speed and loop rotation speed increase.
- Highs: loop-curve opacity brightens.
- Transient impulse: brief per-tile background brightness flash, plus a loop-opacity boost.
- A slowly traveling subset of tiles and loops (the per-id sine "selected" technique used throughout this project) reads slightly brighter.
- Built with the project-wide `intro` element-introduction parameter from the start, so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-22/signal-lattice-22-scene-x-25s.mp4
- Contact sheet: renders/prototype-22/contact-sheet.jpg
- Source: src/prototype-22/scene-x.js
- Preview: /pages/prototype-22.html
- Render: node scripts/render-prototype-22.mjs

All previous scenes and renders remain unchanged. Scene X is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4, and a full-resolution frame was checked directly against the reference: the gradient halftone-dot tiles (rotation/squash/density variety, correct palette), and the glowing cyan/white/black looping curves crossing the whole frame, all read correctly. No pipeline regression was found. Stopped for review.
