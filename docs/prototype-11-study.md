# Scene M — Spectral Weave

## Source study, 2026-09-22

Reference: user-supplied image of E.C.H. / Eiichi Ishii's dailycoding - 20260706 / graphic. URL not supplied. License: CC BY-NC-SA under the user's standing instruction for this creator. The supplied source code was visible in conversation but is not copied, executed or stored here.

The image combines black and white angular filaments into dense, overlapping loop-like masses. Their silhouettes are irregular and lobed, with uneven internal openings. Individual straight edges remain visible at close range; dense crossings build nearly solid black or white regions. Some loops crop at the image boundaries. Behind them, softer gray/black/white fields suggest defocused geometry. White meshes interrupt black masses and black meshes interrupt light areas, producing depth through occlusion and contrasting sharpness. The composition is crowded and asymmetric, with overlapping structures at several scales rather than a regular grid. The small red artist seal is excluded. Only a still is supplied; no animation is inferred.

## Independent implementation

Scene M uses four analytically deformed contour rails per structure. Straight segments connect differently offset positions on these rails to form overlapping oblique quadrilateral cages. It does not rotate square primitives along a sampled noise contour, use the reference noise procedure, or copy its layout. Fixed seeded phases, unequal aspect ratios, distinct harmonic deformations and independent guide offsets create the variation.

An independently positioned lower-resolution mesh layer is redrawn and blurred each frame. Crisp foreground cages cross that soft layer in alternating black and white. There is no feedback accumulation or dependence on the previous frame. Foreground structures span much of the 16:9 frame; the fine filament density contributes to their larger silhouettes.

## Motion and music

- Autonomous: each contour evolves with several different frequencies; guide offsets drift; local cages shear and slide, opening and closing internal voids.
- Bass: changes broad contour deformation and the size of openings.
- Mids: changes cage shear and relative rail offsets.
- RMS: modestly changes mesh opacity/density impression.
- Highs/residue: fine-line weight and secondary cage articulation.
- Transients: decaying, spatially varied contour disturbances.
- Centroid: subtle contrast bias between foreground meshes and blurred ground.

State interpolation is continuous, using the same calm 0–5s, transition to active 5–11s, transition to extreme 11–20s, and extreme hold 20–25s schedule. Motion coefficients .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1. Existing precomputed smoothing and decay remain unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Output

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000–02:33.000**, using the existing full-track analysis and exact PCM excerpt. Track time is 128 + frame / 30.

- Video: renders/prototype-11/signal-lattice-11-scene-m-25s.mp4
- Contact sheet: renders/prototype-11/contact-sheet.jpg
- Scene: src/prototype-11/scene-m.js
- Preview: /pages/prototype-11.html
- Render: node scripts/render-prototype-11.mjs

Earlier scenes and historical renders remain unchanged. This is a standalone study, not a full-track timeline addition. Dense monochrome filaments can be sensitive to downscaling and H.264 compression; encoded contact frames are inspected at delivery.

Completed: all 750 frames encoded with real audio, with no browser errors. Deterministic out-of-order replay, audio response and autonomous movement checks passed; historical source hashes remained unchanged. The contact sheet was extracted from the encoded MP4 and inspected. The adaptation uses fewer, larger cages and more open voids than the reference's dense overlapping masses. No pipeline regression was found. Stopped for review.
