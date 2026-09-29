# Scene BR — Wireframe Tangle

Twenty-eighth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250927 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is built from three hundred wireframe spheres in WebGL 3D, scattered widely, each a randomly rotated latitude/longitude mesh of 8, 12 or 24 divisions, stroked in a single colour from a five-colour palette with no fill. Viewed from a fixed camera, the overlapping wireframes read as a dense tangle of curved scribbled lines rather than recognisable spheres. Over that, a difference-blended grid of white squares (one to sixteen per grid cell) inverts whatever colour sits beneath, producing the checkerboard-like blocky pattern visible throughout.

## Independent construction

This project works in plain Canvas2D throughout, so the wireframe spheres are not projected in true 3D. Instead, each "sphere" is approximated as a bundle of eight, twelve or twenty-four ellipses, all sharing one centre and radius but each with its own eccentricity and rotation — close to how a real wireframe sphere's latitude and longitude great circles project under an oblique view, without the 3D math. One hundred and forty of these bundles drift across a wrapped field slightly larger than the 960 × 540 frame, each stroked in a single palette colour, matching the source's one-colour-per-sphere rule.

A grid of white squares (one to sixteen per cell, matching the source's subdivision) is blended with difference on top, inverting the colours beneath wherever a square lands.

Each sphere and each grid cell has its own seeded life cycle (5–11 s for spheres, 5–9 s for grid cells), and every "epoch" is a pure function of the element and epoch number. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- Every ring within a sphere rotates continuously at its own rate, so each tangle keeps twisting.
- Spheres pulse gently in size and drift across the wrapped field.
- At an epoch change the old sphere or grid pattern fades out while a new one fades in.

Reference layout, the one-colour-per-sphere rule, and the difference-blended square grid are kept because they define the picture's structure, but no source functions, constants, literal randomness sequences, or 3D rendering are reused.

## Audio response

- Bass: sphere size pulse.
- Mids: ring rotation rate.
- Centroid: line weight.
- RMS: sphere brightness.
- Highs/impulse/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each sphere responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-68/signal-lattice-68-scene-br-25s.mp4`
- `renders/prototype-68/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-68/scene-br.js`
- Preview `/pages/prototype-68.html`
- Render `node scripts/render-prototype-68.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
