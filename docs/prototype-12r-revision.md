# Scene N revision — denser and more dynamic

The original Neon Meridians study is preserved. This revision keeps its black ground and additive neon curves, but expands the geometry and independent motion.

- Three related wire grammars: sheared meridian cages, moving cross-sectional hoops, and braided closed contours with breathing central openings.
- 16–24 primary curves per form, up from 9–14. Selected large forms gain five contrasting cross-bracing curves; small forms stay simpler.
- Group drift expands from roughly 7–22 pixels to roughly 40–58 pixels horizontally, with an additional smaller motion component. Groups overlap and separate instead of remaining anchored in almost fixed positions.
- Faster independent 3D rotation, larger pitch changes, stronger axis breathing and visibly deforming contour rails.
- Selected moving highlight segments and varied hue offsets create local activity. No full-canvas rotation or uniform beat flash.
- Bass affects proportions; mids affect orientation and braid depth; transients displace and twist groups with existing decay; highs/residue articulate selected contours; RMS modestly affects opacity; centroid biases hue/lightness.

The same calm/active/extreme interpolation and precomputed audio smoothing are retained. Track time remains 128 + frame / 30. The source and license notes remain in prototype-12-study.md; no reference code is copied.

Output: 25 seconds, 960 x 540, 30 fps, H.264/AAC, real source interval **02:08.000–02:33.000**.

- renders/prototype-12r/signal-lattice-12r-scene-n-25s.mp4
- renders/prototype-12r/contact-sheet.jpg
- src/prototype-12r/scene-n.js
- Preview: /pages/prototype-12r.html
- Render: node scripts/render-prototype-12r.mjs

Completed 2026-09-23: all 750 frames encoded with real audio, with no browser errors. Deterministic replay, music response and autonomous movement checks passed. Previous source hashes remained unchanged. The six-frame contact sheet was extracted from the final MP4 and inspected. Stopped for review.
