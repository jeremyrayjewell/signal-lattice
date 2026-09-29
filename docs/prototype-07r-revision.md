# Scene K revision — diversity and motion

The first study overused curled polar paths and moved too little. This revision replaces those paths with six independent open stroke grammars: sweeping slashes, bowed arches, upright serpentine strokes, bent elbows, open hooks, and articulated waves. Each cluster mixes two to five strokes with independently seeded lengths, weights, orientations and colors. Ring radii now span 20–54 pixels, with 9–30 ticks; selected rings are incomplete or deform into ovals. White gutters, colored/neutral contrasts and segmented circles retain the reference identity.

Autonomous motion is substantially larger: stroke angles sweep by up to .45 radians, strokes separate by 7–22 pixels, curve shape evolves continuously, and ring centers move on independent 11/12-pixel trajectories. Ring segment circulation runs at .19–.37 radians per second in alternating directions. Motion rates differ between glyphs and strokes; no overall canvas transform is used. These are functions of absolute track time, not frame accumulation.

Bass adds up to 7 pixels to directional ring deformation; mids change gesture shape and orientation; decaying transients displace ticks by up to 15.6 pixels and bend strokes by up to 19.5 pixels in the extreme regime. High-frequency residue articulates tick angle and width. RMS modestly affects line weight; centroid affects accent saturation. Each glyph uses a position-dependent feature delay. Existing analysis smoothing and calm/active/extreme interpolation remain unchanged; see prototype-07-study.md for their values.

25 seconds, source 02:08.000–02:33.000, 960 x 540 at 30 fps. Same real audio and full-track analysis as the first study. Previous source files remain unchanged. Source reference and standing CC BY-NC-SA provenance remain as recorded in prototype-07-study.md; no reference code was copied.

- Video: renders/prototype-07r/signal-lattice-07r-scene-k-25s.mp4
- Contact sheet: renders/prototype-07r/contact-sheet.jpg
- Source: src/prototype-07r/scene-k.js
- Preview: /pages/prototype-07r.html
- Render: node scripts/render-prototype-07r.mjs

Validation: all 750 frames rendered, with no browser errors; deterministic replay, music response, autonomous movement and preserved historical source hashes passed. Contact sheet inspected from the encoded video. Three half-second frame comparisons show roughly 3.3�3.5 times the original mean pixel change, supporting the increased motion; this is not a perceptual quality score. Results: renders/prototype-07r/motion-comparison.json.
