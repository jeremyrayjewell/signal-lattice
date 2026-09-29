# Scene CQ — Coil Springs

Eighth new study for Segment 7. Slot 94/letter CR (Codex's Scene CR, "Neon Oscillograms") exists on disk, and slot 93/letter CQ was free between it and slot 92; earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250323 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference scatters eighty large clusters across a black canvas, each rotated to a right angle and independently flipped on both axes. Each cluster is a coiled-spring curve: a sine wave of four periods across a fixed radius, traced by many thin stroked (unfilled) rings whose diameter grows linearly from nothing at one end to a tenth of that radius at the other, in either one colour (black or white) for the whole coil or, in the source's other mode, an independently random grey value per ring. One solid red-or-black rectangle sits over each cluster.

## Independent construction

The coiled-spring curve is the source's own relationship, kept exactly: same four-period sine sweep, same ring-diameter growing linearly across it, same two colour modes (one colour for the whole coil, or independently random per ring), same accent rectangle. Thirty-two clusters sit in a continuously drifting, wrapping field across the 960 × 540 frame (rather than the source's one-shot scatter), each with its own fixed right-angle rotation and axis flip, and each with a slow additional continuous rotation and scale breathing layered on top for life. Each cluster's radius, colour mode, ring colours and accent rectangle are a pure function of the cluster and a local epoch number, re-rolled every 8–15 s and crossfaded at the boundary.

The coil is also a genuine continuous animation rather than the source's one-shot static curve: the sine wave's phase flows continuously over time, so the spring reads as turning/travelling rather than sitting frozen — a ring-count of two hundred per coil (rather than one iteration per horizontal pixel) keeps this animated version cheap to redraw every frame while still reading as smooth. Reference layout, draw order and source functions are not reused.

Motion:

- Each coil's wave phase flows continuously, giving the spring a turning, travelling look.
- Each cluster spins slowly and independently, on top of its own fixed right-angle/flip orientation.
- A cluster's geometry crossfades between an old and new random draw every 8–15 s.
- The whole field drifts slowly, wrapping at the frame edge.

## Audio response

- Bass: cluster scale breathing and accent-rectangle pulse.
- Highs: coil flow-speed and spin-rate boost.
- Impulse/onsets: ring-diameter and stroke-weight punch.
- Centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cluster responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-93/signal-lattice-93-scene-cq-25s.mp4`
- `renders/prototype-93/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-93/scene-cq.js`
- Preview `/pages/prototype-93.html`
- Render `node scripts/render-prototype-93.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cluster introductions (each entering cluster flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
