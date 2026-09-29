# Scene CD — Plaid Scribble

Thirty-fourth new study for Segment 3. Slots 77 and 79 (Codex's Scenes CA and CC) exist on disk; slot 78/letter CB does not (built by neither of us). Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250702 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a four-by-four grid of square cells on white, each independently flipped, holding four or eight positions where a vertical colour bar and a horizontal colour bar cross, in a five-colour palette, each bar with its own slight scale and rotation jitter and a drop shadow — a Mondrian-like plaid rendered with hand-placed imperfection. Four black bezier scribbles cross each cell on top. Shadowed colour plaid under loose black scribbles is the defining relationship.

## Independent construction

A 135 px grid (a quarter of the frame height, matching the source's own ratio) tiles the 960 × 540 frame with a one-cell wrap margin and a slow continuous drift, as in the other lettered grid scenes. Each cell's recipe — flip, overall tilt, four or eight bar-crossing positions each with its own scale, rotation, width and colour, and four scribble curves — is a pure function of the cell and a local epoch number, re-rolled every 4–8 s. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- Bars pulse gently in scale.
- At an epoch change the old cell content dissolves while a new one fades in.
- The whole grid drifts slowly, wrapping at the frame edge.

Reference layout, draw order and source functions are not reused.

## Audio response

- Highs: bar pulse.
- Impulse/onsets: shadow depth.
- Centroid: scribble weight.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-80/signal-lattice-80-scene-cd-25s.mp4`
- `renders/prototype-80/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-80/scene-cd.js`
- Preview `/pages/prototype-80.html`
- Render `node scripts/render-prototype-80.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
