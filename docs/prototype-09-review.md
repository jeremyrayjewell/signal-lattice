# Prototype 09 — expanded color and geometry, A–H

The previous revision retained too much of the early bank's sparse outlines and shared paper/teal/terracotta palette. This revision replaces the A–H drawing modules while preserving their family identities, established audio context, and scene manager. Prototype 08 and all earlier sources remain unchanged. I–K are reused unchanged.

## What changed

| Family                  | Color system                                                                                 | Structural diversity                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A Lattice Banks         | Navy ground with coral, amber, cream, turquoise, blue, violet, pink and white                | 45 larger motifs rather than 72 small ones; filled cut-corner frames, open arcs, nested diamonds, stepped gates and animated inset panels; two moving channels |
| B Ribbon Currents       | Deep blue ground; cobalt, sky blue, turquoise, mint, gold, orange, pink and violet lanes     | Six unequal streams, each divided into five colored lanes; folded triangular facets, staggered crossbars and curling offshoots                                 |
| C Orbital Constellation | Pale lavender ground with plum, violet, magenta, vermilion, ochre, teal, blue and near-black | Four unequal constellations; five elliptical arc systems each, tick bars and circular satellites; alternating sector cores and interlocking ellipses           |
| D Stepped Piers         | Warm cream ground with cobalt, blue, turquoise, green, yellow, orange, pink and purple       | Eight moving stacks with 3–6 modules, colored side faces, three-window or single-window panels, cantilevers and connecting bridges                             |
| E Convergent Filaments  | Near-black violet ground with eight luminous spectral strand colors                          | Seven bundles of unequal strand count; independent convergence, reversing bows, looping offshoots and moving local beads                                       |
| F Cellular Territories  | Dark purple ground; eight jewel/pastel territory hues                                        | Seven shared-boundary territories, each subdivided into colored facets around displaced centers; nested edges, stripes or elliptical insets                    |
| G Opposed Fans          | Pale sand ground with pink, orange, yellow, green, teal, blue, violet and purple             | Two moving opposed origins; each ray is a chain of five separated trapezoid facets, with unequal tip markers and branching strokes                             |
| H Fractured Monument    | Dark plum ground with hot pink, orange, gold, turquoise, blue, violet, orchid and cream      | Eight parent plates split into 24 independently sliding triangle/quadrilateral sections; stripe fields, nested insets and displaced registration outlines      |

Every family uses its own eight-color palette. Color distribution follows geometry—lanes, layers, sections or facets—rather than a full-canvas hue cycle. Background lightness now differs between families. These palettes are authored; this revision does not claim automatic audio-derived color selection.

## Motion and audio

The new forms retain autonomous track-time-driven motion: channel drift, ribbon waves, independent orbits, sliding modules, moving knots, shared territorial deformation, angular propagation and plate disassembly. Local features sample the existing cached analysis at actual timestamps with spatial offsets. Bass controls broad shape; mids affect curvature, width or twist; decaying transients displace selected elements; high-frequency residue articulates local marks. The specific mappings differ between families, and not every family uses every available feature.

States retain prototype-08's continuously interpolated calm/active/extreme controls. Analysis smoothing and musical memory are unchanged. Scene I–K adapters and their established mappings remain intact.

## Review sequence

Same exact sequence and musical interval as prototype 08 for comparison:

**A → E → F → G → C → K → I → B → J → H → D → A**

90 seconds, source **02:08.000–03:38.000**, 960 x 540, 30 fps, H.264 with synchronized real audio. Scene changes align to cached strong onsets, with three-second overlaps. Both layers continue moving during crossfades and spatial blends. E→F retains its geometry handoff; its background now interpolates between the new family colors, and both geometries remain substantial at midpoint.

The full-song timeline is not changed. Structural seed inheritance still specifically supports E→F; other scene pairs blend rendered layers.

## Files

- Video: renders/prototype-09/signal-lattice-09-90s.mp4
- Scene sheet: renders/prototype-09/contact-sheet.jpg
- Previous/revised A–H comparison: renders/prototype-09/comparison-sheet.jpg
- Transition sheet: renders/prototype-09/transition-sheet.jpg
- Timeline: assets/analysis/prototype-09-timeline.json
- New sources: src/prototype-09/scenes/, src/prototype-09/paint.js
- Preview: /pages/prototype-09.html
- Render: node scripts/render-prototype-09.mjs

The renderer reuses the exact prototype-08 PCM excerpt. It checks all eleven families for distinct states, autonomous motion and audio response; checks deterministic replay of the structural transition; and verifies historical source hashes. No basic synchronization test suite is repeated.

Completed: 2,700 frames encoded successfully; all eleven families passed state, autonomous-motion and audio-response checks. Structural replay was deterministic, previous source hashes were unchanged, and no browser errors were recorded. Scene, transition and matching-time comparison sheets were extracted from the encoded video and inspected. Stopped for review.
