# Scene V — Tapered Weave

## Reference analysis, 2026-09-24

E.C.H. / Eiichi Ishii, dailycoding - 20260330 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a dense, chaotic, full-bleed field of overlapping axis-aligned bar clusters on white — each cluster a single flat color, a run of parallel bars whose thickness tapers linearly across the run, each bar a different random sub-length, about half dashed rather than solid. A sparser layer of thin, softly contrast-blended curved lines sweeps across the frame on top.

## Independent implementation

Scene V scatters 85 bar clusters across (and beyond) the 960x540 frame, each with its own position, size, one of four 90-degree orientations, and a single flat color from an independently authored ten-color muted palette. Each cluster draws 9-13 bars whose thickness tapers linearly from a maximum down to near-zero across the run (own taper/length logic, not the source's loop), each bar a random sub-length within the cluster's extent, about half dashed via `setLineDash`. Clusters occlude by simple draw order — no additive blending, matching the source's flat plaid character. A separate layer of 150 thin curved lines (independently parameterized quadratic curves, grayscale) is blended over the whole frame with `overlay` compositing for the source's soft contrast-modulating look.

## Motion and music

- Autonomous: each cluster drifts gently and its bars' random sub-lengths breathe (grow/shrink) continuously; each cluster also carries a small rotational jitter (not a full spin, which would break the axis-aligned barcode identity that defines this source) for visible life without losing the grammar.
- Bass: cluster scale pulses.
- Mids: rotational jitter amplitude increases.
- RMS/centroid: modest brightness/hue shift on bar strokes.
- Highs: curved-line layer brightens.
- A slowly traveling subset of clusters and curves (the per-id sine "selected" technique used throughout this project) reads with slightly boosted weight/opacity.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/impulse/detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-20/signal-lattice-20-scene-v-25s.mp4
- Contact sheet: renders/prototype-20/contact-sheet.jpg
- Source: src/prototype-20/scene-v.js
- Preview: /pages/prototype-20.html
- Render: node scripts/render-prototype-20.mjs

All previous scenes and renders remain unchanged. Scene V is not added to the full-track timeline; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4, and a full-resolution frame was checked directly against the reference screenshot: the tapering bar clusters, both vertical and horizontal orientations, dashed/solid mix, muted palette and dense woven density all read correctly. No pipeline regression was found. Stopped for review.
