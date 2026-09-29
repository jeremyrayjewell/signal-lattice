# Scene CI — Thread Tangle

Fourth new study for Segment 7. Slot 84/letter CH (Codex's Scene CH, "Arc Assemblies") exists on disk; earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260925 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference scatters a hundred rotated clusters, generously overflowing the canvas edge, on black. Each cluster is a fixed-size square grid of horizontal and vertical lines (four, eight or twelve of each), every line independently kept or dropped at a coin flip and wobbled through its own jittered sample points as a smooth curve. Where many survive and overlap, the crossing wobbly lines read as a tangled thread-ball; where few survive, a sparse wiry lattice. White stroke only, no fill, on black.

## Independent construction

A wrapped, continuously drifting field (per-item position, not the source's one-shot random scatter) carries 42 tangles across the 960 × 540 frame with a one-cluster-radius wrap margin. Each tangle's fixed-size grid — line count, which lines survive, and every survivor's per-point jitter — is a pure function of the tangle and a local epoch number, re-rolled every 7–14 s and crossfaded at the boundary; a tangle's own spin rate and starting tilt are fixed for its whole lifetime so the spin reads as continuous straight through a crossfade. The grid-of-wobbly-lines relationship itself — fixed cluster size, coin-flip line survival, per-point jitter, smoothed into a curve — is the source's own, kept exactly. Reference layout, draw order and source functions are not reused.

Motion:

- Each tangle spins continuously and independently.
- A tangle's line survival and jitter crossfade between an old and new random draw every 7–14 s.
- The whole field drifts slowly, wrapping at the frame edge.
- Entering tangles fly in staggered, at reduced scale.

## Audio response

- Highs: spin-rate boost.
- Impulse/onsets: stroke-weight punch.
- Centroid: per-point wobble amplitude (shimmer).
- Bass: cluster scale breathing.
- RMS/residue are supplied by the common interface but not separately mapped.

Full-track features use timestamp interpolation and lateral delays (each tangle responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-85/signal-lattice-85-scene-ci-25s.mp4`
- `renders/prototype-85/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-85/scene-ci.js`
- Preview `/pages/prototype-85.html`
- Render `node scripts/render-prototype-85.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-tangle introductions (each entering tangle flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
