# Scene BT — Scribble Bloom

Thirtieth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250922 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a dense field of two hundred scattered scribble clusters on white: each is a stack of roughly a hundred wavy bezier "hair strands" packed tightly by row, in a single saturated hue that lerps toward black or white as the row descends the shape, so each cluster reads as a colourful spray fading to dark or light at its edges. A fine scattered grid of translucent black and white dots, overlay-blended, sits on top.

## Independent construction

Two hundred and twenty clusters drift across a wrapped field slightly larger than the 960 × 540 frame. Each cluster is eighty near-parallel bezier strands stacked by row, colour lerping from the cluster's own hue at full saturation to black or white as the row descends, matching the source's per-row lerp exactly. Each strand's end points come from our own seeded noise walk rather than the source's `noise()` calls. Each cluster has its own seeded life cycle of 6–11 s, and every "epoch" is a pure function of the cluster and epoch number: size, hue, black/white target, rotation and every strand's control points. Nothing is stateful, so any frame renders alone and out of order.

Strand count and line weight were both raised from an initial, more literal reading of the source's spacing formula, after a first pass looked thin and sparse rather than the reference's bold, densely overlapping painterly mass — density is what makes the colours read as solid rather than as scattered hairlines.

Because the clusters are this dense, introduction progress is squared before the per-element stagger (the same fix used for the densest earlier scenes, [Scene BB](prototype-52-study.md) and [Scene BC](prototype-53-study.md)), so the outgoing scene stays visible for longer during a transition instead of being buried almost immediately.

Motion:

- Strands ripple continuously at individual phases.
- At an epoch change the old cluster fades out while a new one fades in.
- The whole field drifts across the wrapped area.

A fine scattered grid of translucent black and white dots, overlay-blended and individually introduced, sits on top, echoing the source's fine ellipse grid.

Reference layout, draw order and source functions are not reused.

## Audio response

- Highs: strand ripple amplitude.
- Centroid: strand weight.
- RMS: dot brightness.
- Bass/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cluster responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-70/signal-lattice-70-scene-bt-25s.mp4`
- `renders/prototype-70/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-70/scene-bt.js`
- Preview `/pages/prototype-70.html`
- Render `node scripts/render-prototype-70.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
