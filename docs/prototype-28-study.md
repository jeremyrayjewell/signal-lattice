# Scene AD — Gradient Quilt

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20211208 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a grid of tiles on white, each a smooth four-corner rainbow gradient (red/lime/cyan/violet) with a nested smaller gradient shape (square or 45°-rotated diamond), a circle outline, a filled circle, four corner dots, and thin white quarter-circle arcs sweeping across tiles.

## Independent implementation

16 tile bitmaps are pre-rendered once. Each is a true bilinear four-corner gradient (computed via per-pixel `ImageData` interpolation — Canvas2D has no built-in four-corner gradient, so this stands in for the source's per-vertex-colored WEBGL quad) with a nested smaller gradient shape (own second bilinear-gradient bitmap, composited at 0° or 45° for square/diamond), a stroked circle outline, a filled semi-transparent circle, and four semi-transparent corner dots — all own construction. These are composited across a 9x5 grid, each cell independently rotated (0/90/-90/180°) and mirrored, cycling through the 16 tiles, with fresh white quarter-arc accents (a large sweeping arc plus one of two smaller corner-accent variants) drawn per frame on top.

## Motion and music

- Autonomous: every cell's rendered tile continuously cycles through the hue wheel via a per-cell CSS `hue-rotate` filter (own rate/direction, no per-frame re-rasterization needed), and every cell carries a continuous two-frequency rotational wobble plus gentle scale-breathing, so the whole quilt stays visibly alive and richly colorful without audio (confirmed by comparing calm vs. extreme frames — clearly different hues and cell tilts throughout).
- Bass: cell scale pulses.
- Mids/motion state: wobble amplitude and hue-rotation speed both increase.
- Highs: hue-rotation speed increases further; white-arc brightness increases.
- Transient impulse: a brief scale/brightness flash across cells.
- A per-cell delay offset keyed to horizontal position sends transients rippling gently across the grid.
- Built with the project-wide `intro` element-introduction parameter from the start (each cell flies in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-28/signal-lattice-28-scene-ad-25s.mp4
- Contact sheet: renders/prototype-28/contact-sheet.jpg
- Source: src/prototype-28/scene-ad.js
- Preview: /pages/prototype-28.html
- Render: node scripts/render-prototype-28.mjs

All previous scenes and renders remain unchanged. Scene AD is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

None — applying the lessons from Scenes U, Z and AC earlier in this batch (continuous motion must be strong and unmistakable, not just technically present), the wobble/breathe/hue-rotate motion layer was designed in from the start rather than added after the fact. The bilinear-gradient-plus-hue-rotate-filter construction matched the reference well and showed clearly evolving color/composition on the first rendered attempt.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously color-cycling and wobbling composition across the calm/active/extreme arc: a rotated grid of smooth four-corner-gradient tiles with nested diamond/square shapes, circles, corner dots and white arc accents. No pipeline regression was found. Stopped for review.
