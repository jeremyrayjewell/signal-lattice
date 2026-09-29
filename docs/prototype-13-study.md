# Scene O — Fractured Bloom

## Reference analysis, 2026-09-23

E.C.H. / Eiichi Ishii, dailycoding - 20260418 / graphic, https://openprocessing.org/@u277028/2919966. Direct page access returned HTTP 403 Forbidden. User-supplied screenshot and source text; CC BY-NC-SA recorded under the user's standing instruction for this creator. The supplied source (including its `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md#op-2919966--dailycoding-20260418).

The screenshot shows one dense, roughly circular mass of overlapping neon triangular shards on black, brightest and most saturated at center and thinning toward the corners. Cyan dominates, crossed by magenta, yellow, orange, green, blue and violet shards at many sizes and rotations; heavy overlap pushes some crossings toward white. A much fainter mesh of thin, meandering pale line trails wanders through and past the cluster toward the frame edges. The artist seal is excluded.

## Independent implementation

Scene O builds six cluster centers spread across the 16:9 frame rather than one centered mass, so the source's concentrated density profile reads at video aspect without a single overwhelming blob. Each cluster holds 14–20 independently drifting shards; each shard is three overlapping triangular facets at decreasing scale and independent rotation offset, rather than the reference's evenly spaced concentric shrinking-outline loop. Facets are filled with `lighter` (additive) compositing, so dense overlaps brighten toward white the way the source's screen-blended fields do, without importing its blend/posterize/seal pipeline. A separate, sparse layer of eleven thin wandering trail lines is drawn from deterministic sums of incommensurate sine frequencies per line (not Perlin/simplex noise, matching this project's existing seeded-determinism convention), giving a meandering look distinct from the reference's `noise()`-driven contrail.

## Motion and music

- Autonomous: independent per-shard drift, rotation and facet pinch/spread oscillation; trail lines wander continuously through their own sine fields.
- Bass (slow.bass): shard size pulses larger.
- Mids (slow.mid): shard yaw rotation speed increases.
- Transients (impulse × state impulse): brief per-shard positional jitter.
- Highs/residue: brightens a slowly traveling subset of shards and trail lines, echoing the source's shifting bright crossings.
- RMS: overall facet brightness/alpha.
- Centroid: subtle hue bias on facet fill.

State interpolation reuses the established calm 0–5s, transition to active 5–11s, transition to extreme 11–20s, extreme hold 20–25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail reserved for future refinement of this scene). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000–02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-13/signal-lattice-13-scene-o-25s.mp4
- Contact sheet: renders/prototype-13/contact-sheet.jpg
- Source: src/prototype-13/scene-o.js
- Preview: /pages/prototype-13.html
- Render: node scripts/render-prototype-13.mjs

All previous scenes and renders remain unchanged. Scene O is not added to the full-track timeline; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and inspected.

Two earlier passes read wrong on review and were revised in place:

1. Six small, fully isolated cluster centers with three-facet star-shaped shards, and low-frequency trail paths. This read as six separate repeated icons rather than one mass, and the trail lines swept too little phase within their sampling window to appear as more than short stubs.
2. Four larger, closer-spaced clusters. Still read as distinct separate blobs rather than the reference's single continuous field, because each cluster concentrated many shards around one small centroid.

The current version drops cluster grouping entirely: 54 single-triangle shards, roughly a third stroke-only rather than filled (echoing the source's stroke/fill alternation), are placed by a triangular (difference-of-uniforms) distribution across the full 960x540 frame, so density peaks at the center and thins toward the edges/corners without a hard cluster boundary. This produces one dense, near-full-frame mass of overlapping triangles with additive brightening at the busiest crossings, much closer to the source's silhouette and density profile, while the exact positions, sizes, palette and trail mesh remain independently generated.

A further review round asked for two specific corrections against the reference, both addressed:

- Each shard now fills/strokes 10–19 nested triangles that all share one vertex and shrink toward it (rather than the single centered inner contour used before), so density and brightness build up on that one side of the shape and fade toward the opposite edge — an asymmetric gradient, matching the source's off-center nested-triangle technique, independently implemented as a vertex-anchored shrink rather than the source's fixed-loop code.
- The background trail-line layer grew from 13 to 38 lines, each carrying a small high-frequency wobble on top of its base Lissajous sweep, producing a genuinely squiggly, fine-grained mesh across most of the frame instead of a handful of smooth large loops.

A follow-up review asked for more structures that fly through and cross the frame rather than only drifting in place. A second population of 20 traveling shards was added: each moves in a straight line along one axis at an independent speed, wraps at a fixed offscreen margin, and tumbles faster than the field shards while in flight, so triangles continuously enter and exit rather than only breathing around fixed seeded positions. It shares the same corner-fan rendering as the 54 static field shards; only its position/rotation function differs. This is autonomous motion design, not a fidelity correction — the still reference shows no animation, so entering/exiting flight is an independent extension per the analysis's own note.

No pipeline regression was found. Stopped for review.
