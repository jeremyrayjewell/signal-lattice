# Scene BL — Ribbon Weave

Twenty-second new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251009 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference sits on a fine two-tone grey/white checkerboard. Three "cloud" layers, each built from just eight long, sprawling noise-walk paths of small filled circles in a warm earth-tone palette, overlap into big worm-like ribbon shapes rather than compact blobs, because each path wanders across the whole canvas instead of a bounded arc. One layer is drawn crisp with a drop shadow, giving the ribbons a raised, foreground presence; the other two — one blurred and heavily posterized, one left raw — are blended with difference on top, producing the colour-inverted patches visible through and around the ribbons. Checkerboard ground, foreground ribbons with depth, and colour-inverted difference layers is the defining relationship.

## Independent construction

This scene shares its cloud-caching architecture with [Scene BH](prototype-58-study.md), but the individual blobs are built completely differently: each of the three passes' eight blobs traces its own seeded, sprawling two-axis noise walk of nearly a thousand points across the whole cloud canvas (own value noise, mixing three octaves), rather than a bounded quarter-arc, so the result reads as long overlapping ribbons instead of flower-like bursts.

Building a cloud is the expensive part, so — as in Scene BH — each of the three finished cloud canvases is cached once per epoch (8–12 s) rather than rebuilt every frame. One pass is pre-blurred and reduced to five colour levels per channel, baked into its own cached canvas, matching the source's blur-then-posterize step on its first layer. At draw time the three passes are composited in the source's order: the raw pass drawn crisp with a native drop shadow, then the posterized pass and the third raw pass both blended with difference on top.

The checkerboard is built once at low resolution and scaled up with hard pixel edges, the same cheap technique used for the fine dither and tile textures in Scenes BJ and earlier. Because it is fully opaque with no gaps of its own — unlike the ribbon clouds, whose blob shapes leave the outgoing scene visible through their transparent gaps during a transition — it is introduced as sixty small tiled patches rather than one single flying rectangle; an early version used one large element and it covered the whole outgoing scene almost as soon as the transition began, caught on a synthetic mid-transition frame and fixed before rendering.

Reference layout, draw order, blend modes and the blur-then-posterize treatment of one pass are kept because they define the picture's structure, but no source functions, constants or literal randomness sequences are reused.

## Audio response

- Bass: cloud pulse (all three passes breathe together).
- Mids: cloud rotation rate.
- Impulse/onsets: shadow depth on the foreground pass.
- Centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-62/signal-lattice-62-scene-bl-25s.mp4`
- `renders/prototype-62/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-62/scene-bl.js`
- Preview `/pages/prototype-62.html`
- Render `node scripts/render-prototype-62.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
