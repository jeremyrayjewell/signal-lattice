# Scene P — Chroma Quilt

## Reference analysis, 2026-09-23

E.C.H. / Eiichi Ishii, dailycoding - 20260617 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine, byte-identical to the one seen with OP-2919966) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a strict 6x6 grid of flat-color square cells — the first gridded, tiled source in this project's set, unlike the prior sources' continuous overlap-driven fields. Each cell has a solid background from a restrained ten-color palette, a contrasting flat-color triangle motif (a diagonal split, a center pinwheel, an edge fan, or a denser zigzag), and one to several thin arc/half-circle strokes (some dashed) in black, white or a palette color. No gradients, transparency or blur anywhere.

## Independent implementation

Scene P tiles an 11x6 grid of 90px square cells across the 960x540 frame (adapted from the source's 6x6 square grid to 16:9). Each cell fixes its own background color, one of four independently defined triangle-motif archetypes (split/pinwheel/fan/zigzag, generated analytically rather than from the source's vertex lists) and one to three arc accents, chosen once from a seeded, independently authored ten-color flat palette — not the source's exact hex values. Unlike every prior scene in this set, there is no additive/`lighter` compositing: shapes are flat and largely opaque, matching the source's unblended character.

## Motion and music

- Autonomous: each cell's motif rotates continuously at its own slow rate; each arc sweeps around its own center at its own rate. Nothing reshuffles or re-randomizes between frames.
- A small delay offset keyed to each cell's grid position (`(col+row) * 0.018s`) means the same musical event reaches cells at slightly different times, so transients visibly ripple diagonally across the grid instead of flashing every cell at once.
- Bass: motif scale pulses.
- Mids: motif rotation speed increases.
- Highs: arc sweep speed increases.
- Transient impulse: brief per-cell background lightness flash, riding the ripple delay above.
- RMS: modest overall lightness/prominence boost.
- Centroid: subtle hue bias on motif fills.
- A slowly traveling subset of cells (selected via the same per-id sine technique used in Scenes N/O) reads with slightly boosted lightness and arc weight, echoing the source's local variation without random reshuffling.

State interpolation reuses the established calm 0–5s, transition to active 5–11s, transition to extreme 11–20s, extreme hold 20–25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000–02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-14/signal-lattice-14-scene-p-25s.mp4
- Contact sheet: renders/prototype-14/contact-sheet.jpg
- Source: src/prototype-14/scene-p.js
- Preview: /pages/prototype-14.html
- Render: node scripts/render-prototype-14.mjs

All previous scenes and renders remain unchanged. Scene P is not added to the full-track timeline; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and inspected: the flat-color grid, four motif archetypes and black/white/palette arc accents (including dashed variants) all read correctly, and motif rotation is visibly different across CALM/ACTIVE/EXTREME frames. This is the first scene in the set with no additive compositing, matching the source's flat/opaque character. No pipeline regression was found. Stopped for review.
