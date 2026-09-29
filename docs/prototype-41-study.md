# Scene AQ — Chromatic Suspension

First new scene study for Segment 3, following the user's completion of the first 40 studies and Segment 2. Existing scenes and segment assemblies are unchanged.

## Reference study

E.C.H. / Eiichi Ishii, dailycoding 20260531 / graphic. Screenshot and source attachment supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or stored. Artist seal excluded.

The reference places a varied cloud of shaded geometric solids over flowing pink, lavender and blue color bands. Large rings and spheres coexist with narrow rods, cones, boxes, thin wire constructions and bead clusters. Overlaps, foreshortening and colored shading establish depth. The composition mixes large readable silhouettes and small fine elements. Motion is an original extension of the supplied still.

## Independent implementation

78 seeded objects span the horizontal canvas. Original parametric mesh generation covers spheres and tori, with independent polygon construction for rods, cones and boxes. Native WebGL projects the original meshes, interpolates surface normals for smooth per-pixel lighting, and depth-tests overlapping solids. No external framework or copied source scene is introduced. Canvas2D draws the fine line and bead overlay. Bead clusters use shaded radial gradients and rotating spatial layouts. Wire boxes and strands provide fine detail.

A separate analytic color field produces evolving cyan and pale turquoise bands from coupled spatial waves, rather than the source's screen-blended noise-curve procedure. It is evaluated at 240 × 135 and smoothly scaled behind the native-resolution geometry. The shaded solid layer uses standard difference compositing against the background so colors interact across surfaces, matching the reference's visual character without reusing its implementation or composition.

## Motion and audio

Autonomous three-axis rotation, depth drift, lateral motion, background evolution and bead-cluster deformation continue without audio. Track time drives everything directly, independent of previous rendered frames.

- Bass: lateral displacement of solids.
- Mids: orientation and articulation.
- RMS: restrained solid breathing.
- Transients: short rotational disturbances through the established decaying impulse.
- Highs: fine line motion.
- High residue: bead-cluster detail persistence.
- Centroid: fine line weight.

Features use the existing full-track cache and actual timestamp interpolation, with lateral delays. Envelopes remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and onset decay 650 ms. Calm/active/extreme interpolation affects transient strength.

## Deliverable

Standalone 25-second scene study, real track **02:08.000–02:33.000** within the third minute. `trackTime = 128 + frame / 30`. 960 × 540, 30 fps, 750 frames, H.264/AAC. This does not establish or render Segment 3's final authored timeline.

- `renders/prototype-41/signal-lattice-41-scene-aq-25s.mp4`
- `renders/prototype-41/contact-sheet.jpg` — six frames extracted from the encoded video
- `src/prototype-41/scene-aq.js`
- Preview `/pages/prototype-41.html`
- Render `node scripts/render-prototype-41.mjs`
- Analysis `assets/analysis/prototype-02.json`

Seeded element introductions preserve the outgoing canvas during partial entry. Solid meshes now use a proper depth buffer and smooth shading. Fine bead/line details are an intentional overlay and do not participate in solid depth testing. Native WebGL availability is required; the offline browser enables software WebGL for reproducible rendering in this environment. No physical shadows or reflections are simulated.

## Source-fidelity revision

Compared against the user's side-by-side images: the earlier output was too sparse, faceted and independently colored. The revision enlarges and overlaps the forms, expands the object bank from 53 to 78, removes flat-facet lighting, shifts to the cyan reference palette, and lets background color interact with the smooth materials. Existing autonomous and audio-driven motion is retained.
