# Scene BA — Ribbon Windows

Eleventh new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260508 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a square white page holding a four-by-four grid of slightly irregular square windows. Each window is either black with white ribbons or white with black ribbons. The ribbons are tangled, meandering tubes of wobbling thickness with a scatter of small dots, and each window is laid down as a stack of many faint, slightly offset and non-uniformly scaled copies of one texture, so ribbon edges echo and blur and the window edges go soft. Sixteen textures are reused across the grid. The contrast between a crisp tangled line, its soft echo, and the flat white page is the defining relationship.

## Independent construction

Cells are 135 px squares (a quarter of the frame height) and each shows one window of about 112 px, scaled between 70 and 100 percent on each axis. A window's texture is generated fresh every frame: a string of about fifteen hundred filled circles laid along a smooth noise path, where a second, faster noise sets each circle's radius so the ribbon swells and thins, plus thirty small drifting dots. Noise is three summed octaves of seeded value noise, so the path clusters inside the window rather than wandering away. The texture is rotated by a cell-specific angle and then drawn thirty times at 8–24 percent opacity with seeded jitter, so the echoing edges come from the same stacking idea rather than a blur filter.

Each cell has its own seeded life cycle of 6–11 s, and every "epoch" is a pure function of the cell and epoch number: polarity, ribbon thickness class (a tenth or a twentieth of the cell), noise seeds, rotation, window scale, jitter and dots. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- The noise windows slide at different rates on the two axes, so ribbons keep reshaping instead of merely sliding along themselves; a third, faster slide moves the swells along the ribbons.
- Each texture also rotates at its own slow rate, and the thirty copies wobble continuously around their jitter offsets, so the soft echoes shimmer.
- At an epoch change the old window shrinks away while the new one opens.
- The whole wall drifts as one sheet, left and down (about 13 px/s across and 9 px/s down, with slow wander), so windows stream through while the page stays tidy.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: ribbon thickness swell.
- Mids: window breathing.
- Highs: jitter spread of the copy stack, so echoes separate.
- RMS: copy opacity.
- Centroid/residue/onsets are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each window responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects drift wander. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-51/signal-lattice-51-scene-ba-25s.mp4`
- `renders/prototype-51/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-51/scene-ba.js`
- Preview `/pages/prototype-51.html`
- Render `node scripts/render-prototype-51.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own white page patch) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. Generating the textures each frame makes this scene noticeably heavier than earlier studies (roughly 0.3 s per frame offline). This is a standalone study for review, not a full Segment 3 assembly.
