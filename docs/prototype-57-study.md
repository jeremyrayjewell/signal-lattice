# Scene BG — Scribbled Ledger

Seventeenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251104 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid of square cells on white, each a flat solid colour from a seven-colour palette, holding a rotated bowtie of thin-to-thick radial lines in a second colour, fifteen loose curved scribbles (some dashed) in the background colour or in black/white, and a fine diagonal-cross grid, half visible, in black or white. A different pair of flat colours per cell, tangled linework, and the delicate cross-hatch grid on top is the defining relationship.

## Independent construction

A 135 px grid (a quarter of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with a one-cell wrap margin and a slow continuous drift, as in the other lettered grid scenes. Each cell draws directly onto the shared canvas — no filter or blur is involved here, so no private buffer is needed, unlike Scenes BD and BF.

Each cell's recipe is a solid background colour, a rotated set of twenty-one to sixty-one thin-to-thick radial line pairs (line count and thickness taper reproduce the source's variable line density and its thin-near-zero, thick-near-180-degree taper), fifteen bezier scribbles (each independently coloured, some dashed), and a two- or four-division diagonal-cross sub-grid, about half the cells present. Two distinct palette colours are picked per cell for the background and the radial lines, matching the source's explicit distinct-colour rule.

Each cell has its own seeded life cycle of 3.5–7 s, and every "epoch" is a pure function of the cell and epoch number: both colours, the radial line count, jitter and lengths, all fifteen scribbles' control points and styles, and the cross-grid layout. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- The whole starburst spins continuously at its own rate and direction, on top of a wobble in each line's jitter.
- Scribble control points wander continuously at individual phases, so the tangles keep squirming rather than sitting static.
- The cross-grid lines flex slightly in and out.
- At an epoch change the old cell content dissolves while a new one fades in, both drawn fully so the crossfade reads correctly across the mixed fills, strokes and curves.
- The whole grid drifts slowly up and to the left, wrapping at the frame edge.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: radial line reach.
- Mids/RMS: scribble wander amplitude.
- Highs: line jitter, taper weight and cross-grid flex.
- Onsets/impulse: a burst of extra starburst spin and line weight.
- Centroid/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-57/signal-lattice-57-scene-bg-25s.mp4`
- `renders/prototype-57/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-57/scene-bg.js`
- Preview `/pages/prototype-57.html`
- Render `node scripts/render-prototype-57.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own opaque white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
