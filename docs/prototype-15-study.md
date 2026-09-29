# Scene Q — Halo Bouquet

## Reference analysis, 2026-09-23

E.C.H. / Eiichi Ishii, dailycoding - 20251017 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

This source takes the prototype-15 slot after "Scribbled Garden" (the earlier dailycoding 20260312 source) was deleted from the repository following several revision rounds that never read correctly against its reference. This scene reuses the letter Q.

The screenshot is a 4x4 grid of macro cells on white, each holding either one large cluster of concentric/scattered glowing circles or four smaller such clusters. Each cluster is a shrinking sequence of circles blending between two colors, some perfectly concentric, some randomly offset within the cell, some outlined in black or white, with a soft glow halo bleeding into the white ground around each cluster.

## Independent implementation

Scene Q tiles a 9x5 grid of 108px macro cells across the 960x540 frame. Each macro cell independently rolls a one-vs-four split (the source's binary choice), producing one large cluster or four smaller ones per cell. Each cluster draws 16-25 circles shrinking from the cell's half-size down to nearly zero, each filled with a color blended between two independently chosen palette hues (the blend fraction combines the ring's radius with a slow global "breathing" phase), with roughly half the rings concentric and half randomly offset within the cell, and a subset outlined in black or off-white. Only the three outermost (largest) rings of each cluster carry a soft glow (`shadowBlur`), which is where the source's blur reads most strongly and keeps the expensive canvas blur operation affordable across 750 frames; inner rings are crisp.

## Motion and music

- Autonomous: each cluster drifts gently, its color-blend phase breathes slowly, and it rotates at a slow independent rate.
- Bass: cluster scale pulses.
- Mids: rotation speed increases.
- Highs: glow intensity on the outer rings increases.
- Transient impulse: brief extra glow bloom on the outer rings.
- RMS: modest overall lightness boost.
- Centroid: subtle hue bias on the ring fills.
- A slowly traveling subset of clusters (the per-id sine "selected" technique used in Scenes N/O/P/R) reads with slightly boosted lightness.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-15/signal-lattice-15-scene-q-25s.mp4
- Contact sheet: renders/prototype-15/contact-sheet.jpg
- Source: src/prototype-15/scene-q.js
- Preview: /pages/prototype-15.html
- Render: node scripts/render-prototype-15.mjs

All previous scenes and renders remain unchanged. Scene Q is not added to the full-track timeline; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors despite the canvas shadow-blur cost. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and inspected: the concentric/scattered circle clusters, two-color blending, glow haloes and black/white outline accents all read correctly against the reference. No pipeline regression was found. Stopped for review.

A follow-up review asked for more dynamism and more glow. Glow rings went from the 3 outermost to the 6 outermost, with a stronger blur radius and a brighter shadow color, so the halo now visibly bleeds and blends between neighboring clusters rather than staying a thin edge effect. Drift amplitude, scale-pulse range, rotation speed, color-blend breathing speed and the bass/mids/transient coefficients driving all of them were roughly doubled, so the composition visibly shifts, pulses and rotates across the calm-to-extreme arc instead of only subtly. No pipeline regression was found. Stopped for review.
