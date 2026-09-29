# Scene L — Prismatic Patchwork

## Reference analysis, 2026-09-22

E.C.H. / Eiichi Ishii, dailycoding - 20260825 / graphic. The reference is the user-supplied image; no URL was supplied. CC BY-NC-SA is recorded under the user's standing instruction for this creator. Source code was supplied and seen in conversation, but no reference implementation is copied, executed or stored in the repository.

The image is an edge-to-edge patchwork of rectangular footprints containing sharply divided triangular color fields. Large green, turquoise, cream, orange, magenta and black areas interrupt much denser small-scale fragments. Several scales coexist rather than forming a single regular grid. Many shapes align horizontally or vertically, while internal diagonal edges produce wedges, kites and trapezoids. Cream/white gaps expose thin crossing lines and dotted square trails. Dots and lines also cross solid patches, so they read as a separate layer. Colors mix saturated hues, pale pink/lavender/cream, olive, navy and black. The result's hierarchy depends on uneven block sizes and occupancy, not just on many triangles. Only a still is supplied; motion is an independent extension. The artist seal is omitted.

## Independent design

Scene L uses a seeded hierarchical rectangular partition with a fixed topology. Different branches terminate at different depths, giving large uninterrupted anchors among smaller fragments. Shared split boundaries move continuously, preserving adjacency. Leaf panels use several independently designed planar divisions: diagonal halves, offset wedges, oblique quadrilaterals and displaced triangular fans. Selected leaves remain cream voids. A separate sparse overlay supplies fine solid rules, moving square dashes and occasional compact inset fragments. No source triangle-strip loop, layered randomized grid passes, palette array or signature function is imported.

The layout is designed for 960 x 540. A broad 16-color palette includes saturated and muted colors plus cream, deep navy and near-black. Color assignments remain seeded and stable, so animation changes geometry rather than flashing through random colors.

## Motion and audio

- Autonomous: shared partition boundaries drift on multiple timescales; internal apexes sweep; fine rule positions and dash phases evolve continuously.
- Bass: modest changes to broad partition boundaries.
- Mids: internal wedge/apex displacement.
- RMS: increases local articulation rather than whole-frame scaling.
- Highs and residue: line weight, moving dotted accents and local detail.
- Transients: short displaced seams and apex disturbances, using existing decaying impulse data.
- Centroid: subtle line/overlay opacity bias.

Calm / active / extreme interpolate continuously. Motion coefficients: .45 / .8 / 1.15; articulation: .45 / .8 / 1.2; impulse response: .4 / .9 / 1.4; detail: .45 / .75 / 1. Calm holds 0–5 seconds, transitions to active during 5–11, then extreme during 11–20, holding through 25. Existing audio memory remains fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transient decay 650ms.

## Standalone review output

25 seconds, source **02:08.000–02:33.000**, 960 x 540, 30 fps, H.264/AAC. The same real excerpt and full-track analysis are reused. Track time is 128 + frame / 30. All previous scene code and renders remain unchanged; L is not added to the full timeline yet.

- Video: renders/prototype-10/signal-lattice-10-scene-l-25s.mp4
- Contact: renders/prototype-10/contact-sheet.jpg
- Source: src/prototype-10/scene-l.js
- Preview: /pages/prototype-10.html
- Render: node scripts/render-prototype-10.mjs

A first render revealed oversized panels and excessive central empty space. The final partition restricts early termination to nominal areas below 24,000 square pixels, extends the maximum depth to nine, and reduces explicit cream void occupancy to nine percent of seeded leaves. This retains large anchors while increasing the medium/small fragment population. All 750 frames were rerendered after that adjustment.

Final verification: all 750 frames completed, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio response checks passed; historical source hashes remained unchanged. The six-frame contact sheet was generated from the final encoded MP4 and inspected. No synchronization or rendering problem was found in the reused pipeline. Stopped for review.
