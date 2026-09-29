# Scene AF — Striped Dialogues

Restored from the original implementation recorded in the conversation, including the approved alpha/omega revision. Source, preview, states, render script and contact-sheet script have been rebuilt in their original prototype-30 slots.

## Reference and visual grammar

E.C.H. / Eiichi Ishii, dailycoding 20220824 / graphic. User supplied a screenshot and source attachment. CC BY-NC-SA under the standing instruction; URL not supplied. The source was seen, not copied, executed, translated or stored. Artist seal omitted.

The reference shows staggered columns of slightly tilted square panels on white, each containing two overlapping outlined circles. Diagonal stripes occupy different regions: outside the circles, one or both circles, their intersection, or an external frame. Black outlines, broad white gutters, and muted coral, mustard/olive, pale tan and purple distinguish the composition. The original corner accents resemble an A and folded B; the user explicitly replaced these with alpha and omega.

## Independent implementation

Seven staggered columns use seeded sizes, stripe pitch, orientation, mirror direction and six region treatments. Canvas circle clipping and white fills generate the masks independently of the source's raster-mask catalogue. Custom alpha (α) and omega (Ω) paths retain black strokes with white under-strokes. No artist seal or exact reference layout is reproduced.

Autonomous stripe travel, panel wobble, vertical drift and changing circle overlap continue without audio. Bass influences separation and panel breathing; mids alter the circle offsets; highs and residue articulate symbols; transients add decaying displacement; RMS influences stripe opacity and centroid affects outline weight. Spatially delayed feature lookup avoids a uniform response.

## Timing and integration

Existing full-track cache: `assets/analysis/prototype-02.json`. Exact real source interval **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. Fast envelope 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, impulse decay 650 ms. Calm holds through 5s, interpolates to active at 11s, then extreme at 20s. Supports `draw(..., reactive=true, intro=1)` and seeded per-element introductions; partial entry preserves the outgoing canvas.

## Deliverables

25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC with the existing exact PCM excerpt.

- `renders/prototype-30/signal-lattice-30-scene-af-25s.mp4`
- `renders/prototype-30/contact-sheet.jpg` — extracted from the MP4
- `renders/prototype-30/render-report.json`
- Source: `src/prototype-30/scene-af.js`
- Preview: `/pages/prototype-30.html`
- Render: `node scripts/render-prototype-30.mjs`

Reconstruction is based on the conversation's recorded code, not git history. No 60-second assembly is changed.
