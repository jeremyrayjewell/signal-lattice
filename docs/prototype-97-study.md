# Scene CU — Bubble Scribbles

Tenth new study for Segment 7. Slot 96/letter CT and slot 98/letter CV are both Codex's completed scenes; slot 97/letter CU was free between them. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250115 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference is a fine vertical-stripe background (each stripe's width set by a slow 1D noise walk across the columns) under twenty large clusters, each three things: a black curveVertex scribble loop through twenty random points; a scatter of soft translucent-white "bubble" blobs (built from many concentric circles at the same low alpha, so overlap builds up toward each blob's centre); and a stack of four semi-transparent rectangles in random primary/secondary colours, sharing one rotation but each nudged slightly off-centre, so where they don't fully overlap the edges show as coloured fringes.

## Independent construction

All three foreground relationships are the source's own and are kept exactly: the scribble loop, the concentric-circle soft bubble, and the four-rectangle colour-fringe stack. Thirty-two clusters sit in a continuously drifting, wrapping field across the 960 × 540 frame (rather than the source's one-shot scatter), each cluster's scribble points, fifty bubble positions/sizes, and four rectangle colours/offsets a pure function of the cluster and a local epoch number, re-rolled every 8–15 s and crossfaded at the boundary. Each bubble is now five concentric circles rather than the source's twenty-one — the same softening curve at a fraction of the draw count, the same substitution this project makes wherever a source's per-element detail is far denser than a real-time redraw needs (e.g. Scenes BN, BZ, CM, CS). The striped background keeps the source's own noise-driven variable stripe width, with the noise input also drifting slowly over time so the pattern stays alive rather than frozen. Reference layout, draw order and source functions are not reused.

Motion:

- Each cluster spins slowly and independently, and breathes gently in scale.
- Bubble sizes and the scribble's stroke weight pulse independently.
- A cluster's scribble, bubbles and rectangles crossfade between an old and new random draw every 8–15 s.
- The whole field drifts slowly, wrapping at the frame edge.
- The background stripe pattern drifts continuously.

## Audio response

- Bass: cluster scale breathing and bubble-size pulse.
- Highs: cluster spin-rate boost and stripe-weight pulse.
- Impulse/onsets: scribble stroke-weight punch.
- Centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cluster responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-97/signal-lattice-97-scene-cu-25s.mp4`
- `renders/prototype-97/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-97/scene-cu.js`
- Preview `/pages/prototype-97.html`
- Render `node scripts/render-prototype-97.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cluster introductions (each entering cluster flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
