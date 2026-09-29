# Scene BO — Gradient Portholes

Twenty-fifth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251011 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid of square cells on black, each holding a soft circular gradient between two distinct colours from a five-colour palette, a scatter of small black or coloured squares over a four-to-twenty division sub-grid, and eight rotated, wobbling bezier curves in white or a palette colour. Soft gradient portholes with scattered pixels and looping white threads is the defining relationship.

## Independent construction

A 108 px grid (a fifth of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with a one-cell wrap margin and a slow continuous drift, as in the other lettered grid scenes. Each cell picks two distinct palette colours and renders their blend as a native two-stop radial gradient rather than the source's forty discrete concentric rings — a cheaper, smoother equivalent of the same continuous colour interpolation. A four-to-twenty division sub-grid holds a scatter of small black or coloured squares, and eight bezier curves, each rotated to one of four right angles, cross the cell in white or a palette colour.

Each cell has its own seeded life cycle of 4–8 s, and every "epoch" is a pure function of the cell and epoch number: both gradient colours, circle scale, every square's position and colour, and every curve's rotation, colour and control points. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- The gradient circle breathes gently in size.
- Squares pulse slightly in size.
- Bezier curves wobble continuously along their length.
- At an epoch change the old cell content dissolves while a new one fades in.
- The whole grid drifts slowly down and to the right, wrapping at the frame edge.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: gradient circle breathing.
- Highs: square pulse and curve wobble.
- Centroid: curve weight.
- RMS/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-65/signal-lattice-65-scene-bo-25s.mp4`
- `renders/prototype-65/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-65/scene-bo.js`
- Preview `/pages/prototype-65.html`
- Render `node scripts/render-prototype-65.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own black backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
