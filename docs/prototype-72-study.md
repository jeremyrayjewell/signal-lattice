# Scene BV — Diamond Kaleidoscope

Thirty-first new study for Segment 3 (following prototype-71, Codex's Scene BU, "Interference Etching"). Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250713 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid tilted forty-five degrees, so cells read as a diamond lattice, over-sized to cover the whole square canvas with no gaps at the corners. Each cell has, half the time, a translucent colour backing, then one of three motifs in a seven-colour neon palette: a fan of small flag triangles, a ring with an inner filled circle and a diagonal line, or an irregular quad outline flanked by two corner arcs. Neon Memphis-style geometry on a rotated grid is the defining relationship.

## Independent construction

A 54 px grid (a tenth of the frame height, matching the source's own ratio) is drawn inside a rotated coordinate frame rather than a rotated canvas region, with the column/row range computed from the rotated frame's axis-aligned bounding box so every corner of the 960 × 540 viewport stays covered regardless of the current rotation angle. That angle is not fixed at forty-five degrees as in the source; it turns slowly and continuously, giving the whole lattice an ongoing kaleidoscope-like rotation.

Each cell's recipe — background backing, its own rotation, and one of the three sub-motifs with all their colours, sizes and endpoints — is a pure function of the cell and a local epoch number, re-rolled every 4–8 s. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- The whole lattice rotates continuously.
- Each cell's own rotation sways gently on top of that.
- Ring and quad motifs breathe slightly in size.
- At an epoch change the old cell content dissolves while a new one fades in.

Reference layout, the tilted grid, and the three motif types are kept because they define the picture's structure, but no source functions, constants or literal randomness sequences are reused.

## Audio response

- Bass: ring/quad breathing.
- Mids: lattice rotation speed.
- Highs: cell rotation sway.
- Centroid/RMS/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right its rotated position sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-72/signal-lattice-72-scene-bv-25s.mp4`
- `renders/prototype-72/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-72/scene-bv.js`
- Preview `/pages/prototype-72.html`
- Render `node scripts/render-prototype-72.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
