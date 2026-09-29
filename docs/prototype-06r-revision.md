# Neon Faultlines — closer source-grammar revision

Same source: OP-3013816 / E.C.H., with the previously recorded CC BY-NC-SA label. The source code remains unused; this is an independent refinement from the supplied image.

## Fidelity changes

The first study's eight evenly spaced, continuous zigzags made it read like an orderly ribbon pattern. The reference instead has irregular lengths, independent pointed fragments, densely intersecting regions and differently sized square interruptions.

This revision uses **26 independently articulated spans**, mixing substantial fragments with finer splinters. Lengths range from 350 to 1,100 pixels, with variable endpoints and cropping. Unequal knot spacing, asymmetric upper/lower widths, tapered ends, and independent fold phases remove the shared zigzag rhythm. Different diagonal facet splits and occasional local hue changes create angular patches rather than uniform-width ribbons.

Bright groups cluster asymmetrically across the upper, middle and lower frame. The original black ground remains visible as irregular corridors. Additive intersections create white-hot regions while dark purple and wine-colored facets recede. The scene is intentionally less orderly and more layered than the first study.

Square modulation is denser and more varied in scale. It is concentrated on the moving material through a soft geometric membership test; a small number of larger accents appear in the black regions. Black, pale and colored interruptions break up the solid facets. The detail layer stays secondary to the long angular spans and large negative spaces. Its continuous membership weights avoid abruptly switching tiles at band edges.

Calm starts with more occupied material (width coefficient .95 rather than .75) and greater square activity (mosaic .55 rather than .35). The same smooth calm → active → extreme schedule, musical memory and audio mappings remain. Earlier studies are preserved.

## Outputs

- `renders/prototype-06r/signal-lattice-06r-scene-j-25s.mp4`
- `renders/prototype-06r/contact-sheet.jpg`
- `renders/prototype-06r/render-report.json`
- `src/prototype-06r/scene-j.js`

25 seconds, source **02:08.000–02:33.000**, 960 × 540, 30 fps, H.264 with the same real stereo excerpt. The six contact frames use the same times as the first study for comparison.

```powershell
node scripts/test-prototype-06r.mjs
node scripts/render-prototype-06r.mjs
# Preview after npm run dev: /pages/prototype-06r.html
```

A–I and the first Scene J study remain unchanged. No scene has been added to the full-track timeline.

All 750 frames rendered with no browser errors. The renderer confirmed deterministic frame reproduction and unchanged historical milestone hashes. The contact sheet was inspected after encoding. The prototype is ready for review.
