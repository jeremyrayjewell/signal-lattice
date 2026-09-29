# Scene W — Nested Iris

## Reference analysis, 2026-09-24

E.C.H. / Eiichi Ishii, dailycoding - 20260415 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a black-and-white grid of cells, but only cells falling within a circular clip region are drawn — the macro silhouette is a disc, not a full rectangle, the first source in this set to do that. Each included cell holds a nested "onion" motif: concentric shrinking arc-wedges, a small oval and a nested square, alternating black and white layer by layer, with per-cell rotation, mirroring, and occasional shear.

## Independent implementation

Scene W tiles 65px cells across the 960x540 frame, keeping only cells whose center falls within a 248px-radius circle centered on the frame — an independently sized clip, not the source's exact proportions. Each kept cell independently fixes a base 90-degree rotation, mirror, whether it's sheared, and a starting black/white polarity (seeded once). The nested motif is built by an independently written function (its own concentric-layer/arc-wedge/oval/square geometry, not the source's arc/ellipse/rect calls) with 4 or 8 layers alternating black and white. Pure black-and-white throughout, matching the source's stark monochrome palette. Cells also spin continuously (a genuine per-cell rotation, not a subtle wobble — the lesson from Scene U's "not enough movement" feedback applied from the start here) and support the project-wide `intro` element-introduction parameter for transitions.

## Motion and music

- Autonomous: each cell spins continuously at its own independent speed and direction, scaled by the piece's motion envelope.
- A small delay offset keyed to each cell's grid position (`(col+row) * 0.015s`, reused from the earlier grid scenes) sends transients rippling diagonally across the grid.
- Bass: cell scale pulses slightly.
- Mids: spin speed increases.
- Highs: sheared cells' shear angle wobbles a touch more.
- Transient impulse / RMS: brief per-cell brightness lift via a canvas `filter` boost.
- A slowly traveling subset of cells (the per-id sine "selected" technique used throughout this project) reads slightly brighter.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-21/signal-lattice-21-scene-w-25s.mp4
- Contact sheet: renders/prototype-21/contact-sheet.jpg
- Source: src/prototype-21/scene-w.js
- Preview: /pages/prototype-21.html
- Render: node scripts/render-prototype-21.mjs

All previous scenes and renders remain unchanged. Scene W is not added to the full-track timeline or the scene-reel manager (`src/scene-reel/manager.js`) yet; this is a standalone study. It should be added to that manager's `SCENES` map before the next full-segment render if it's to be included there.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and inspected: the circular macro silhouette, jagged circle boundary, nested black/white onion motif and continuous per-cell rotation (clearly different spin angles across the calm-to-extreme frames) all read correctly against the reference. No pipeline regression was found. Stopped for review.
