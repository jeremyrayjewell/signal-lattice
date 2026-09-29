# Scene BI — Domino Field

Nineteenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251026 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid of square cells on white, each either left whole or split into a two-by-two set of smaller faces, echoing a sheet of domino or dice tiles. Each face is rotated to one of four right angles and holds four drop-shadowed black or white pips in one of three layouts — the four corners, the four edge midpoints, or a centre-plus-triangle cluster. A thin partial box outline sits inset in each face, with each of its four sides independently present or missing. Dice-like pip clusters, partial box frames and the mix of whole and subdivided cells is the defining relationship.

## Independent construction

A 67.5 px grid (an eighth of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with a one-cell wrap margin and a slow continuous drift, as in the other lettered grid scenes. Each outer cell independently stays whole or splits into a two-by-two set of faces; each face gets its own rotation, one of the three pip layouts, four independently coloured pips with native drop shadows, and an inset box outline with each side independently present.

Each outer cell has its own seeded life cycle of 4–8 s, and every "epoch" is a pure function of the cell and epoch number: the subdivision, and every face's rotation, layout, pip tones and border sides. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- Each face's rotation sways continuously around its resting right angle rather than sitting fixed.
- Pips pulse gently in size.
- Border sides flex in and out along their length.
- At an epoch change the old cell content dissolves while a new one fades in.
- The whole grid drifts slowly down and to the left, wrapping at the frame edge.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: pip size pulse.
- Highs: rotation sway and border flex.
- Centroid: border weight.
- Impulse/onsets: shadow depth.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-59/signal-lattice-59-scene-bi-25s.mp4`
- `renders/prototype-59/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-59/scene-bi.js`
- Preview `/pages/prototype-59.html`
- Render `node scripts/render-prototype-59.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own opaque white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
