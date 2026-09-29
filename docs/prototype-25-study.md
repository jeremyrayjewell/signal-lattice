# Scene AA — Static Bands

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20241201 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md). This is the first scene past letter Z in this project's per-source lettering; it continues as **AA**.

The screenshot is roughly 20 thick horizontal bands, each split into two flat colors like a barcode/test pattern, overlaid with dense pixel-noise/datamosh patches (sometimes solid, sometimes sparse), several soft glowing blurred blobs, and several dense bursts of thin black/white vertical scratch lines.

## Independent implementation

Four independent layers, all in an own flat six-hue-plus-black/gray/white palette:

- 16 full-width horizontal bands, each split at its own point into two flat-colored halves, the split position drifting continuously (own sine-drift formula, not the source's per-draw `random(w)`).
- A pixel-noise patch per band (own cell-grid/sparsity logic, not the source's exact `v`/`sw`/`hsw` branching), in grid or vertical-bar mode, each cell's color reassigned on a _stepped_ (not smoothly interpolated) per-band clock — a genuine flicker/glitch cadence rather than a tween, sped up by treble energy.
- 11 soft glow blobs (single or 3x3 clustered), each an own single-radial-gradient fill standing in for the source's 16-40-ring concentric rounded-rect alpha falloff.
- 10 dense vertical scratch-line bursts, each batched into one black and one white stroked path per frame for performance, with per-line position/length reassigned on their own faster shimmer clock.

## Motion and music

- Autonomous: band split points continuously drift; noise-cell colors flicker on a stepped clock; scratch-line positions shimmer on a faster stepped clock; blobs pulse in size — all four layers stay visibly alive without audio (confirmed by comparing calm vs. extreme frames and adjacent-second frames).
- Bass: band-split drift range and blob size increase.
- Highs: noise-flicker rate, scratch-line density and shimmer rate all increase.
- Transient impulse: a brief brightness/flicker-rate flash across bands, noise cells and scratch lines.
- Built with the project-wide `intro` element-introduction parameter from the start (bands, blobs and scratch bursts each fly in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-25/signal-lattice-25-scene-aa-25s.mp4
- Contact sheet: renders/prototype-25/contact-sheet.jpg
- Source: src/prototype-25/scene-aa.js
- Preview: /pages/prototype-25.html
- Render: node scripts/render-prototype-25.mjs

All previous scenes and renders remain unchanged. Scene AA is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. First pass: caught and fixed one bug before rendering — the scratch-line black/white color assignment hashed in the current stroke pass (`white`) as an input, so a line's color could flip between the black and white batches instead of staying fixed, defeating the split. Fixed by hashing a pass-independent constant instead, so each line's color is decided once and both batches agree on it. No other issues found — the four-layer construction (bands, flickering noise, glow blobs, scratch bursts) matched the reference well on the first rendered attempt.

2. Second pass: the user pointed out the static/glitch areas needed to change locations, not just flicker in place. Correct — blob glows and scratch-line bursts had a completely fixed origin (only their internal content flickered/pulsed), and the noise patch only ever tracked its band's split point. Fixed by giving each blob, each scratch burst, and each band's noise-patch offset its own slow wandering drift (an own sine-based path, independent per element), so the whole region relocates across the canvas over the clip rather than just flickering within a static footprint. Verified by comparing frames roughly 13 seconds apart, showing blobs and scratch clusters clearly repositioned (a glow barely present in one frame prominent and shifted in the other) rather than pulsing in the same spot.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously-flickering, continuously-relocating composition across the calm/active/extreme arc: two-tone horizontal bands, glitchy stepped pixel-noise patches, soft glowing blobs and dense scratch-line bursts all visibly repositioned across the frame between states. No pipeline regression was found. Stopped for review.
