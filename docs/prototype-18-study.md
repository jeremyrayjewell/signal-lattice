# Scene T — Hatched Aurora

## Reference analysis, 2026-09-24

E.C.H. / Eiichi Ishii, dailycoding - 20260304 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

This source replaces the earlier Amber Paisley attempt (dailycoding 20260809, prototype-18), which was deleted after two revision rounds still didn't read as its reference. This scene reuses the letter T.

The screenshot is a full-bleed atmospheric wash where color regions are not round soft blobs but anisotropic, curved, sweeping ribbon/fan shapes with genuinely dark, untouched black corners — several instances at once, blending additively (bright, near-white where they overlap) rather than covering the whole frame evenly. Colors span the full spectrum chaotically, not a small fixed palette. Over this, a fine texture of scratchy marks of uneven length — single ticks and small bundles of 2-4 near-parallel lines — covers the frame independent of the color regions. Re-examining the source code against the re-shared screenshot (rather than an earlier written description of it) showed why: each of 40 instances rotates every row of its wavy line-stack by an angle mapped across a quarter turn, which is what produces the curved, sheaf-like boundaries rather than circular symmetry; a fixed small palette was never used, since the source rolls each RGB channel independently per instance.

## Independent implementation

Scene T builds 44 "fan" instances spread across (and beyond) the 960x540 frame. Each stacks 16-26 thick, smoothly curved bands (own sine-based wobble, not Perlin noise) across its own local height, with every band's rotation sweeping through roughly a quarter turn from one edge of the instance to the other — the structural feature that gives the reference its curved boundaries. Each instance is a single full-spectrum random hue (matching the source's independent-RGB-channel rolls), composited with `lighter` at low alpha so many overlapping instances melt into a diffuse wash rather than reading as individually legible shapes. A separate layer of 340 scratch-mark clusters (mostly single ticks, some bundles of 2-4 near-parallel lines at varied length) is scattered across the whole frame independent of the fan regions, giving the scored-surface texture.

## Motion and music

- Autonomous: each fan drifts gently, its rows continuously re-wobble (a slow twisting motion), and fan rotation drifts independently.
- Bass: fan scale pulses.
- Mids: row-twist speed increases.
- Highs/RMS: stroke and scratch brightness/opacity increase.
- Transient impulse: brief scratch-texture brightness spike.
- Centroid: subtle hue bias.
- A slowly traveling subset of fans and scratch clusters (the per-id sine "selected" technique used throughout Scenes N-T) reads brighter, echoing shifting bright overlaps.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail/impulse reserved for future refinement of this scene). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-18/signal-lattice-18-scene-t-25s.mp4
- Contact sheet: renders/prototype-18/contact-sheet.jpg
- Source: src/prototype-18/scene-t.js
- Preview: /pages/prototype-18.html
- Render: node scripts/render-prototype-18.mjs

All previous scenes and renders remain unchanged. Scene T is not added to the full-track timeline; this is a standalone study.

This scene went through many revisions against the reference, the first several based on a written description of the screenshot rather than the screenshot itself:

1. A first pass (many thin per-row-rotated wavy strokes stacked per "cloud") read as far too sparse and dim, and the texture collapsed into a rotationally-symmetric spirograph/rosette rather than an irregular hatch, because every row reused the same wobble curve just rotated.
2. A second pass fixed the per-row correlation and substantially increased density. This produced one uniform, continuously-blended "fur" texture everywhere, with no distinct color regions — a genuine over-correction.
3. A third pass replaced round radial-gradient wash regions plus a separate scratch layer. The wash read reasonably, but comparing it against the actual reference screenshot (re-shared at this point, since earlier passes had been working from an internal written description that had drifted from the real image) showed the fundamental shape was wrong: the reference's color regions are anisotropic sweeping ribbons with real black negative space and full-spectrum chaotic color, not round soft-edged blobs from a small palette — and the scratch texture needed a mix of short and long marks in small clusters, not uniform short ticks.
4. The fan-sweep structure (per-row rotation across a quarter turn, giving curved ribbon boundaries) was rebuilt with these corrections, then tuned across three more passes: first too few/too bold instances read as individually legible spiral shapes rather than a melted wash; lowering opacity to fix that made the result too dim, losing the reference's punchy near-white highlights; the current balance (44 instances, moderate opacity) restores both the diffuse blending and the brightness.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and inspected; full-resolution frames were checked directly against the reference screenshot at each tuning step. No pipeline regression was found. Stopped for review.
