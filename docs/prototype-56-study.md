# Scene BF — Bubble Grid

Sixteenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251102 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid of square cells on white, each independently subdivided into one, four or sixteen sub-cells, and each sub-cell holding a circle that fills it, in a seven-colour palette. That layer is blurred, then a second, independently subdivided circle layer is drawn crisp on top in overlay blend, adding contrast and depth. A third pass, also overlay, adds one rotated rounded square or circle outline per sub-cell plus a scatter of small black or white dots placed uniformly inside a disk. Soft blurred colour, a crisp saturated second layer, and fine glitter texture is the defining relationship.

## Independent construction

A 108 px grid (a fifth of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with a one-cell wrap margin. Each cell's content comes from three independent subdivision passes, echoing the source calling its circle-grid routine three separate times with entirely fresh randomness each call: a blurred base layer, a crisp overlay layer, and a squares-and-glitter overlay layer, each with its own one/four/sixteen subdivision and its own circle sizes and colours.

Each cell is composited privately, the same technique as [Scene BD](prototype-54-study.md): the base pass is drawn to a small offscreen canvas on white and blurred with a canvas blur filter, the crisp overlay pass is drawn on top in overlay blend, then the squares-and-glitter pass (one rotated rounded shape per sub-cell, outline or filled, plus a handful of small dots placed uniformly inside a disk around each sub-cell) is added, also overlay. That finished cell texture is what gets shown, clipped to the cell's own bounds so neighbouring cells never bleed into each other.

Made more dynamic by request: each cell has its own seeded life cycle of 3–6.5 s (shortened from an initial 6–11 s), so cells re-roll noticeably more often, and every "epoch" is a pure function of the cell and epoch number: all three passes' subdivisions, circle colours, square styles and dot placements. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- Circle sizes in both circle passes breathe continuously, with roughly triple the amplitude and speed of the initial version.
- Squares now spin continuously (rather than only wobbling) and wander slightly around their offset; dots orbit within their disk and pulse in brightness rather than sitting fixed.
- The whole grid now drifts slowly up and to the right, wrapping at the frame edge, echoing the drift used in Scenes AY–BE (added back by request after an earlier version left the grid fixed).
- At an epoch change the old cell composite fades out while a new one fades in, both drawn fully so the crossfade stays correct under the overlay blending.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass/mids: circle-pass breathing amplitude (base pass to bass, overlay pass to mids).
- Highs: reduces blur radius slightly, widens dot scatter, lifts square weight and wander.
- Onsets/impulse: extra breathing punch and a burst of square spin.
- RMS: dot brightness.
- Centroid/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-56/signal-lattice-56-scene-bf-25s.mp4`
- `renders/prototype-56/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-56/scene-bf.js`
- Preview `/pages/prototype-56.html`
- Render `node scripts/render-prototype-56.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own opaque white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. The grid now drifts like the other lettered scenes; see the note above. This is a standalone study for review, not a full Segment 3 assembly.
