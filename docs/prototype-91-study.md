# Scene CO — Splash Shards

Seventh new study for Segment 7. Slot 91/letter CO was not built by either of us when Scenes CN (90) and CP (92) landed on disk around it — the same kind of skipped/reserved gap as slot 78/letter CB, now filled at the user's explicit request. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250905 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference scatters sixty clusters, generously overflowing the canvas edge, each a large (up to half the canvas) jagged splash: ten filled cubic-bezier curves with fully independent random control points, closed straight back to their start for fill, all in one colour from a five-tone black/blue/red/gold/off-white palette, overlapping into one jagged splash silhouette; then four thin straight streaks in a second, independently chosen colour from the same palette cross through it.

## Independent construction

The splash-and-streak relationship is the source's own and is kept exactly: ten filled bezier splinters in one colour (fully independent random control points per splinter, no shared shape parameter), four thin cross-streaks in a second colour, both colours picked once per cluster. Thirty-four clusters sit in a continuously drifting, wrapping field across the 960 × 540 frame (rather than the source's one-shot scatter) with each cluster's geometry a pure function of the cluster and a local epoch number, re-rolled every 8–15 s and crossfaded at the boundary. Every splinter and streak point carries a small continuous wobble on top of its epoch-fixed position, so a settled cluster still breathes rather than sitting frozen; a cluster's own spin rate is fixed for its whole lifetime. The colour palette is newly authored (five black/blue/red/gold/off-white tones matching the reference's mood), not the source's own hex values. Reference layout, draw order and source functions are not reused.

Motion:

- Every splinter and streak point wobbles continuously and independently.
- Each cluster spins slowly and independently.
- A cluster's whole geometry crossfades between an old and new random draw every 8–15 s.
- The whole field drifts slowly, wrapping at the frame edge.

## Audio response

- Bass: cluster scale breathing.
- Highs: cluster spin-rate boost.
- Impulse/onsets: streak stroke-weight punch.
- Centroid: point-wobble amplitude.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cluster responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-91/signal-lattice-91-scene-co-25s.mp4`
- `renders/prototype-91/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-91/scene-co.js`
- Preview `/pages/prototype-91.html`
- Render `node scripts/render-prototype-91.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cluster introductions (each entering cluster flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
