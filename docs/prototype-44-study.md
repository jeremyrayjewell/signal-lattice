# Scene AT — Facet Columns

Fourth new study for Segment 3. Earlier scenes and completed segment assemblies remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260629 / graphic. User supplied source and screenshot. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or stored. Artist seal excluded.

The reference forms a dense field of vertically staggered square panels. Gray grounds carry sharp triangular planes in black, navy, orange, red, muted blue, green and white. Internal vertices vary, so some panels resemble folded wedges or off-center pinwheels. Fine colored rays and striped margins contrast with broad flat fills. Quarter-turn orientations and panel insets produce variation while preserving a strong column structure.

## Independent implementation

Twelve columns span the horizontal canvas, with independently seeded panels extending beyond its vertical edges. Each panel is constructed from a moving internal hub and selected triangular sectors, with some sectors only partially filled to expose its gray ground. This replaces the source's specific three-triangle arrangement. Variable insets reveal thin colored border teeth behind selected panels. Fine corner rays articulate the facets. The exact reference arrangement and source functions are not reused.

Autonomous motion includes independent column transport, moving facet hubs, changing partial-sector edges, subtle insets and traveling border detail. Column movement is an explicit-time oscillation, so arbitrary seeking does not depend on wrapping or accumulated state. The overall mosaic stays crisply aligned instead of rotating as a whole.

## Audio response

- Bass: independently phased column displacement.
- Mids: internal facet-hub displacement.
- Onsets: short local hub disturbances through the existing decaying impulse.
- Highs: border-line activity.
- High residue: subtle inset persistence.
- Centroid: fine ray weight.
- RMS is available in the common interface but not separately mapped.

Actual timestamp interpolation uses the existing full-track analysis with lateral delays. Envelopes remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and onset decay 650 ms. Calm/active/extreme interpolation affects disturbance strength. Autonomous motion remains when audio controls are disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-44/signal-lattice-44-scene-at-25s.mp4`
- `renders/prototype-44/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-44/scene-at.js`
- Preview `/pages/prototype-44.html`
- Render `node scripts/render-prototype-44.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no additional dependencies. Supports seeded element introductions while preserving the outgoing canvas during partial entry. This is a standalone study, not a full Segment 3 assembly.

## Increased-motion revision

Columns now travel farther and faster, with stronger bass displacement. Internal hubs sweep across more of each panel, triangular sectors open and close more widely, and striped borders move faster. One third of panels perform staggered, smoothly eased quarter-turns at seeded 10–19 second intervals. Every change remains a direct function of source time; no accumulated rotation or frame-dependent events are used.
