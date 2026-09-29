# Scene AY — Modular Tiles

Ninth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260226 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a square poster of a five-by-five tile wall on white. Each tile has a loose mosaic of pale grey and muted-colour rectangles (one large, a two-by-two or a four-by-four set, each at full or half size), then a quarter-turned overlay: a small square near one corner, a large circle tucked into the adjacent corner, one long black line from the square to a random point on the far edge, and a comb of thin black verticals in one quadrant, either sparse or dense and slightly jittered. A ten-colour earth palette (slate, near-black, cream, terracotta, green, mustard, rose, teal, periwinkle, sage) is shared across tiles. The tidy grid holding many small unrelated compositions is the defining relationship.

## Independent construction

The 960 × 540 frame holds square 108 px cells (one fifth of the frame height). Each cell has its own seeded life cycle of 4.4–9.2 s, and every "epoch" is a pure function of the cell and epoch number: mosaic subdivision and rectangle sizes, quarter-turn, corner-square size (a quarter or an eighth of the cell), circle and square colours, line end point, and comb density with per-line jitter. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- The whole wall drifts diagonally as one sheet (about 19 px/s across, 11.5 px/s down, with slow wander), so the grid stays tidy while cells stream through and new cells enter from the edges with their own compositions.
- At each cell's epoch change the old mosaic shrinks away while the new one grows in, the overlay swings to its new quarter turn with a small overshoot, the corner square and circle change size and colour smoothly, and the long line sweeps to its new end point.
- Dense and sparse combs share the same twenty candidate lines; the sparse regime keeps every other one, so changing density grows or retracts lines rather than swapping them.
- Every comb line sways at its own rate, and the long lines continually oscillate.

Background (added by request): the white ground is replaced by a blue sky with clouds. A vertical blue gradient carries three parallax layers of cumulus, each cluster a hump of overlapping soft puffs with a shaded underside and a flat base. The layers drift left at 3.5, 7 and 12 px/s, slower than the wall, and the puffs slowly billow, with bass adding a slight swell. The sky is painted from time alone into one offscreen buffer per frame, so it is order-independent. The pale-grey mosaic rectangles are now semi-transparent so the sky and clouds show through them; palette-coloured tiles stay opaque. During introductions each entering cell carries its own patch of the same sky, aligned with the full frame when it settles, instead of a white backing.

The overlay is clipped to its own cell so rotation swings stay tidy. Reference layout, order of draws and source functions are not reused.

## Audio response

- Bass: circle pulse.
- Mids: mosaic breathing and corner-square size.
- Highs: comb sway amplitude.
- Centroid: line weight.
- Onsets: small decaying rotational kicks in each cell.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects drift wander, line sweep and comb sway. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-49/signal-lattice-49-scene-ay-25s.mp4`
- `renders/prototype-49/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-49/scene-ay.js`
- Preview `/pages/prototype-49.html`
- Render `node scripts/render-prototype-49.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own sky patch) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
