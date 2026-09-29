# Scene N — Neon Meridians

## Reference analysis, 2026-09-22

E.C.H. / Eiichi Ishii, dailycoding - 20260910 / graphic. User-supplied screenshot; no URL supplied. CC BY-NC-SA recorded under the user's standing instruction. Reference source was visible in conversation but is not copied, executed or stored in the repository.

The screenshot is a black field crowded with thin saturated curved outlines. Elliptical bundles suggest globes, lenses and compressed wire volumes. Within a bundle, related curves converge toward common ends; different bundles cross at different orientations and scales. Cyan, green, yellow, magenta, blue and orange lines create bright additive-looking intersections. There are no solid colored faces, radial spokes, central hubs or blur. Cropped edge forms imply a field extending beyond the canvas. Dense regions alternate with irregular black openings. Only a still was supplied; motion is an independent extension. The signature is omitted.

## Independent implementation

Scene N constructs meridian curves on analytic three-dimensional spheroids and projects them into 2D. Independent yaw, pitch, axis proportions and gentle contour deformation produce evolving lenses and wire volumes. This differs from the supplied nested-ellipse drawing procedure: there is no repeated fixed-width/decreasing-height ellipse loop or quarter-turn placement system. The scene uses an original landscape arrangement with several scales and preserved black corridors. Curves are sampled closed paths, combined with additive compositing; no blur or solid fill is added.

## Motion and music

Autonomous motion includes independent 3D precession, local drift, aspect changes and contour flexing. Bass alters axis proportions; mids bias relative axis rotation; transient memory sends uneven angular disturbances through a volume. Highs and their decaying residue emphasize selected moving meridians rather than all lines simultaneously. RMS changes opacity modestly; centroid subtly biases hue/lightness. Each group looks up the real cached features at track time with small position-dependent offsets.

Calm, active and extreme use continuous state interpolation: calm holds 0–5s, transitions to active 5–11s, then extreme 11–20s and holds to 25s. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1. Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transient 650ms.

## Deliverable

Standalone 25-second study, 960 x 540, 30 fps, H.264/AAC. Real track interval **02:08.000–02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-12/signal-lattice-12-scene-n-25s.mp4
- Contact sheet: renders/prototype-12/contact-sheet.jpg
- Source: src/prototype-12/scene-n.js
- Preview: /pages/prototype-12.html
- Render: node scripts/render-prototype-12.mjs

All previous scenes and renders remain unchanged. Scene N is not added to the full-track timeline. Fine neon intersections can change appearance when downscaled or compressed; the final contact sheet is extracted from the encoded MP4.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed; historical source hashes remained unchanged. The six-frame contact sheet was extracted from the final MP4 and inspected. The projected meridians create more pronounced converging poles than the reference's nested ellipse bundles; the composition also retains broader black gaps. No rendering regression was found. Stopped for review.
