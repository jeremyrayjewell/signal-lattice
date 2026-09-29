# Scene AZ — Pinwheel Shards

Tenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260314 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a square poster of a four-by-four cell wall on black. Each cell has a gapless mosaic of square tiles (one, two, four or eight per side, about half of them present) in either random greys or a ten-colour muted palette (brown, sky blue, orange, maroon, deep blue, red, pink-grey, navy, teal, midnight). Over it, rotated by a random angle, sits a pinwheel of ten, twenty or thirty independently shaped triangles, each either solid or a thin outline, whose long tips reach past the cell edge into its neighbours. Each cell ends with one circle in black, white or a palette colour, placed at a random spot in the rotated cell. Sharp, uneven shards against calm grids and round dots are the defining relationship.

## Independent construction

Cells are 135 px squares (a quarter of the frame height). Each has its own seeded life cycle of 5–9.5 s, and every "epoch" is a pure function of the cell and epoch number: mosaic subdivision and tile picks, base rotation, spoke count, the shape and style of each of sixty candidate spokes, and the circle's size, position and colour. Nothing is stateful, so any frame renders alone and out of order.

- The pinwheel has sixty candidate spokes; ten, twenty or thirty evenly spaced ones are active (every sixth, third or second). Changing the count grows or retracts spokes out of the centre, and spokes present in both epochs morph vertex by vertex.
- The whole burst, circle included, spins continuously at a cell-specific rate of about 5–15 degrees per second in either direction, on top of the swing to each epoch's new base angle.
- Solid and outline spokes trade weight rather than popping between styles; colours interpolate.
- At an epoch change the old mosaic shrinks away while the new one grows in, and the circle glides to its new size, position and colour.
- Spoke tips breathe and flutter at their own rates; circles wander and pulse.
- The wall drifts diagonally to the right and down as one sheet (about 15 px/s across and 8 px/s down, with slow wander). Cells are drawn column by column, so later cells overlap earlier spikes as in the reference.

Background (added by request): the black ground is replaced by a twinkling star field on near-black with a faint deep-blue cast at the top. Three parallax layers (260, 130 and 44 stars) drift in the same direction as the wall but slower (2.5, 5 and 9 px/s across), each star with its own twinkle rate and phase, so brightness and size swell and fade independently. Stars are white, pale blue, warm cream or pale rose, and the nearest layer carries cross-shaped glints that lengthen as a star brightens. The field is painted from time alone into one offscreen buffer per frame, so it is order-independent. During introductions each entering cell carries its own patch of the same field, aligned with the full frame when it settles, instead of a black backing.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: spoke length swell, circle pulse and a slight star swell.
- Mids: mosaic tile breathing.
- Highs: spoke tip flutter, and faster, brighter star twinkle.
- Centroid: outline weight.
- Onsets: small decaying rotational kicks in each cell.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects drift wander and kick strength. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-50/signal-lattice-50-scene-az-25s.mp4`
- `renders/prototype-50/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-50/scene-az.js`
- Preview `/pages/prototype-50.html`
- Render `node scripts/render-prototype-50.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own patch of star field) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
