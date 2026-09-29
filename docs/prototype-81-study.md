# Scene CE — Bullseye Grid

First new study for Segment 7. Segments 3 and 4 (Scenes AQ–CD, prototypes 41–80) are complete; this is a wholly new scene, not a mix of existing ones — the segment-7 plan changed from mixing segment 1 × segment 3 content to new scenes, at the user's direction.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260918 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference scatters thirty nested-square "targets" at random positions on a white square canvas: each is twenty concentric axis-aligned squares shrinking from a third of the canvas down to nothing, stroke weight thin at the rim and thickening toward the centre. Scattered and overlapping, the targets' dense cores and thin outer rims interleave into a crosshatched field, darkest where several overlap. A red hanko seal sits in the lower-left corner (the source's own signature mark, reimplemented functions omitted as usual).

## Independent construction

A wrapped, continuously drifting field (per-item position, not the source's one-shot random scatter) carries 34 targets across the 960 × 540 frame with a one-target-radius wrap margin. Each target's outer radius is a pure function of the target and a local epoch number (re-rolled every 6–12 s, crossfaded at the boundary), while its spin rate and starting tilt are fixed for its whole lifetime so the spin reads as continuous straight through a crossfade rather than snapping. The ring-thickness curve itself — thin at the rim, thickening toward the centre — is the source's own relationship, kept exactly (`lineWidth = (1 - rr/mr) * (rg/3)` for a square shrinking from `mr` to 0 in twenty steps). Reference layout, draw order and source functions are not reused.

Motion:

- Each target spins continuously and independently.
- A target's size crossfades between an old and new random draw every 6–12 s.
- The whole field drifts slowly, wrapping at the frame edge.
- Entering targets fly in staggered, at reduced scale.

## Audio response

- Highs: spin-rate boost.
- Impulse/onsets: punch on the thickest core rings.
- Centroid: gentle per-ring radial shimmer.
- Bass: overall target size breathing.
- RMS/residue are supplied by the common interface but not separately mapped.

Full-track features use timestamp interpolation and lateral delays (each target responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-81/signal-lattice-81-scene-ce-25s.mp4`
- `renders/prototype-81/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-81/scene-ce.js`
- Preview `/pages/prototype-81.html`
- Render `node scripts/render-prototype-81.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-target introductions (each entering target carries its own scale ramp) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
