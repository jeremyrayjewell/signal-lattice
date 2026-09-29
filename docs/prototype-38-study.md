# Scene AN — Halftone Orbits

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260303 / graphic. User supplied source and screenshot. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or saved in the repository. Artist seal excluded.

The reference layers square-dot fields over black and translucent charcoal blocks. Some fields are axis-aligned and others diagonal; dot sizes vary across each patch, producing quieter interiors and larger peripheral marks. Thin curved line bundles cross the composition. Opaque discs interrupt the fine detail. Cream, tan, gold, vermilion, blue and plum supply a restrained but varied palette. The screenshot is static; animation is an original extension.

## Independent implementation

115 seeded patches use independently selected square marks around moving elliptical quiet zones, with a traveling modulation across each patch. This replaces the source's literal radial grid recipe. Ninety translucent background blocks add depth, 39 interleaved arc bundles provide long curves, and 29 solid discs supply larger shapes. The palette is chosen close to the supplied visual reference, with a new arrangement designed for 16:9. Existing scenes are not modified.

Autonomous motion includes patch drift and gentle tilt, moving low-density centers, traveling dot activity, evolving arc radii and angular motion, slow background displacement, and modest disc breathing. Fixed seeds and explicit track time make arbitrary frame rendering reproducible. The shapes are drawn natively with Canvas2D through the established p5 preview.

## Music response

- Bass: patch displacement and arc curvature/radius.
- Mids: patch articulation and arc angle.
- Highs: localized square-mark activity, with distinct phases.
- High residue: lingering detail activation.
- Onsets: decaying patch disturbances.
- RMS: restrained disc breathing.
- Centroid: arc line weight.

All features come from the existing full-track cache, with actual timestamp interpolation and lateral offsets. Existing memory remains fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and impulse decay 650 ms. Calm/active/extreme parameters interpolate continuously and affect tilt/impulse response. Motion persists with audio disabled.

## Output and reuse

Real track interval **02:08.000–02:33.000**, with `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC. No full-song or 60-second assembly is made in this study.

- Video: `renders/prototype-38/signal-lattice-38-scene-an-25s.mp4`
- Contact sheet: `renders/prototype-38/contact-sheet.jpg`, extracted from the encoded MP4
- Source: `src/prototype-38/scene-an.js`
- Preview: `/pages/prototype-38.html`
- Render: `node scripts/render-prototype-38.mjs`
- Analysis: `assets/analysis/prototype-02.json`

The scene implements the established per-element introduction interface. Partial introduction does not clear the outgoing scene. Background blocks, patches, discs and arcs arrive with seeded offsets. Determinism, autonomous motion, audio response and browser errors are checked by the existing renderer.

## Increased-motion revision

After user review, patches travel farther and faster, tilt more strongly, and carry traveling row shear and local lifts. Low-density centers sweep across each patch faster. Arc bundles counter-rotate with moving centers and larger curvature changes; discs now orbit locally. Bass and transient disturbances are stronger and remain spatially staggered. All changes preserve explicit-time determinism, the original palette and the scene's layered visual grammar.
