# Scene N — Neon Meridians

E.C.H. / Eiichi Ishii, dailycoding - 20260910 / graphic. User-supplied screenshot; no URL supplied. CC BY-NC-SA recorded under the user's standing instruction. Reference source was visible in conversation but is not copied, executed or stored in the repository.

## Visual analysis

The screenshot is a black field crowded with thin saturated curved outlines. Elliptical bundles suggest globes, lenses and compressed wire volumes. Within a bundle, related curves converge toward common ends; different bundles cross at different orientations and scales. Cyan, green, yellow, magenta, blue and orange lines create bright additive-looking intersections. There are no solid colored faces, radial spokes, central hubs or blur. Cropped edge forms imply a field extending beyond the canvas. Dense regions alternate with irregular black openings. Only a still was supplied; motion is an independent extension.

## Implementation

Scene N constructs meridian curves on analytic three-dimensional spheroids and projects them into 2D — independent yaw, pitch, axis proportions and gentle contour deformation produce evolving lenses and wire volumes. This differs from the reference's own nested-ellipse drawing procedure: there is no repeated fixed-width/decreasing-height ellipse loop or quarter-turn placement system.

This scene went through several iterations (kept only for reference, not wired into any render pipeline) that progressively added complexity — denser wire grammars, cross-sectional hoops, braided loops with breathing openings, and branching links connecting moving centers — before a final pass pulled back toward the reference's actual grammar, removing the braided loops, saddle forms, nested secondary objects and connecting filaments that had drifted away from it. The current implementation uses **76 mixed-scale groups with 10–17 candidate contours each**, seeded omissions to vary density, a pure black ground, thin saturated neon outlines with no filled surfaces or blur, complete clean elliptical contours grouped into lenses with common major-axis endpoints, horizontal and vertical group orientations (no freely tumbling forms), stable hue within each group, and bright additive intersections between groups. The layout is an original 16:9 arrangement and does not trace the reference's exact composition, but its density and silhouette are intended to sit materially closer to the supplied image than the intermediate experiments.

Implementation remains independent throughout: analytically projected circular wires from separately tilted planes, with seeded placement and explicit track-time functions — not the reference's nested-ellipse loop, palette array, signature, or random-redraw behavior.

## Motion and music

Group drift and overlapping compression keep the scene active while preserving clean elliptical contours; local plane inclinations vary continuously and at different rates. Bass modestly changes group size; mids compress contour bundles; decaying transients disturb individual contour radii; highs/residue emphasize traveling subsets of curves; RMS and centroid subtly affect opacity and hue. Motion is intentionally constrained by the source's silhouette — no global spin, uniform pulse, or random per-frame reshuffle, and the large warps and rapid rotations explored in the intermediate iterations are absent here.

Calm, active and extreme use continuous state interpolation: calm holds 0–5s, transitions to active 5–11s, then extreme 11–20s and holds to 25s. Existing feature smoothing/decay: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transient 650ms. Track time is `128 + frame / 30`.

## Output

25 seconds, 960 × 540, 30 fps, H.264/AAC. Real track interval 02:08.000–02:33.000.

- Video: `renders/prototype-12t/signal-lattice-12t-scene-n-25s.mp4`
- Contact sheet: `renders/prototype-12t/contact-sheet.jpg`
- Source: `src/prototype-12t/scene-n.js`
- Preview: `/pages/prototype-12t.html`
- Render: `node scripts/render-prototype-12t.mjs`

All 750 frames render without browser errors; deterministic out-of-order replay, autonomous movement and audio-response checks pass.
