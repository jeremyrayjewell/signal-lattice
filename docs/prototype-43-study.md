# Scene AS — Radial Incisions

Third new study for Segment 3. Existing scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260709 / graphic. User supplied source and screenshot. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal excluded.

The reference places black radial structures in an orderly white grid. Spokes vary in length and density; intermittent tangent caps make some look like small I-bars. Irregular polygon centers alternate between solid black and outlined white. Black and white crossing strokes interrupt the radial order. The palette and spacing make each structure readable at a glance. The still provides visual grammar; motion is original.

## Independent construction

Eighteen independently seeded structures form a 6 × 3 horizontal layout. Analytic angular waves control the inner boundary and traveling spoke deformation; the source's noise sampling and vertex loops are not ported. Seeded cap selection and spoke density distinguish each structure. Separately moving irregular polygon cores retain filled/empty contrast. Crossing strokes move on independent trajectories, with white strokes acting as incisions through black geometry.

Autonomous motion includes opposing rotations, traveling changes in spoke length, evolving cores, slight group drift and moving cross-strokes. No whole-composition rotation or uncontrolled frame randomness is used. All behavior is evaluated from source track time.

## Audio mappings

- Bass: inner-boundary displacement and core breathing.
- Mids: group rotation and cross-stroke displacement.
- Highs: local spoke-root articulation.
- High residue: lingering outer-spoke extension.
- Onsets: spatially phased disturbances in spoke length.
- Centroid: radial stroke weight.
- RMS remains available through the common interface but is not separately mapped.

Timestamp-interpolated features use the existing full-track cache with lateral delays. Established envelopes: fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, impulse decay 650 ms. Calm/active/extreme parameters interpolate continuously and affect disturbance intensity. Autonomous movement persists without audio.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-43/signal-lattice-43-scene-as-25s.mp4`
- `renders/prototype-43/contact-sheet.jpg` — extracted from that MP4
- `src/prototype-43/scene-as.js`
- Preview `/pages/prototype-43.html`
- Render `node scripts/render-prototype-43.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports the existing seeded per-element introduction interface without clearing the outgoing canvas during partial entry. Native Canvas2D; no new dependencies or full-segment assembly.
