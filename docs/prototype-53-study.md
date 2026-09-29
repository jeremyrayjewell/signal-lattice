# Scene BC — Onion Ripples

Thirteenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251222 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a square, strictly black-and-white field of about a thousand overlapping teardrop domes. Each dome is a stack of roughly twenty concentric-looking circles, biggest first, alternating black and white, where each smaller circle sits higher than the last, so the stack pinches to a point above the base and the stripes read as arcs wrapped around a cone. Domes are randomly placed, tilted a little either way, and either apex-up or apex-down, and each starts on a random colour of the alternation. Over the top, a loose ten-by-ten scatter of circles inverts whatever lies beneath, turning patches of the stripes to their negative. Dense op-art stripes with pockets of negative is the defining relationship.

## Independent construction

About three thousand domes live on a wrapped field slightly larger than the 960 × 540 frame, matching the reference's density per unit area; only what is on screen is drawn, and the field margin exceeds a dome's reach so nothing pops at the wrap. Each dome is twenty-one nested circles, drawn biggest first with alternating black and white; the centre of each circle rises by exactly its own shrink, so the stack pinches to an apex one base-diameter above the centre.

The stripes stream: ring sizes slide by a fraction of a ring while the black/white alternation shifts by one at each whole ring, and the outermost ring is held at the base size, so stripes flow up or down the dome with no visible seam and new rings grow from the apex. Every dome has its own flow direction and speed.

Each dome has its own seeded life cycle of 6–12 s, and every "epoch" is a pure function of the dome and epoch number: tilt, apex direction, alternation start, flow speed and phase. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- Stripes flow along every dome continuously, in both directions across the field.
- The whole field drifts down and to the left, with each dome on its own drift factor, so layers slide over one another.
- Domes sway on their tilt and orbit slightly around their places.
- At an epoch change the old dome shrinks away while a new one grows in.
- The inverting circles (one per grid cell, extended across the wide frame) stay locked to the screen while pulsing and orbiting inside their cells, so the negative patches slide across the flowing stripes.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: dome swell and inversion-blob pulse.
- Mids: extra stripe advance (a smooth offset of up to a couple of rings, so stripes surge forward with mid energy).
- Highs: tilt flutter.
- Onsets: small decaying rotational kicks.
- RMS/centroid/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (twelve delayed reads across the frame width stand in for a per-dome delay). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects orbit wander and kick strength. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-53/signal-lattice-53-scene-bc-25s.mp4`
- `renders/prototype-53/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-53/scene-bc.js`
- Preview `/pages/prototype-53.html`
- Render `node scripts/render-prototype-53.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-element introductions without clearing the outgoing canvas during partial entry. Because this scene is extremely dense, introduction progress is raised to the fourth power before the per-element stagger so the outgoing scene stays visible while domes fan in; it still reaches exactly identity at completion. The inverting circles are also introduced as elements, so during a transition they invert whatever lies beneath them, including the outgoing scene. Native Canvas2D, no new dependencies. The scene draws roughly two thousand dome stacks per frame (about 0.5 s per frame offline). This is a standalone study for review, not a full Segment 3 assembly.
