# Scene CJ — Coil Registers

New standalone study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20251216 / graphic. Source and screenshot supplied by the user, inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

Six horizontal registers contain overlapping, slightly irregular elliptical coils. Each row combines several line colors and weights over a grid of full and half-sized flat color blocks. The palette mixes dark neutrals, teal and blue with strong red, yellow and pink. White intervals between rows keep the dense coils legible. The continuous linear rhythm is the scene's defining structure.

## Independent construction and motion

Sixty background rectangles occupy a 10-by-6 horizontal grid. Six rows each contain four continuous parametric coil paths. Harmonic radial modulation creates asymmetric bends without copying the reference's noise traversal. Lane offsets, thicknesses, colors, loop dimensions and row direction are seeded.

Rows travel in alternating directions, their spacing and ellipse proportions change smoothly, and their constituent lines move relative to one another. Background block sizes breathe slightly while retaining the grid. Motion is computed at absolute track time, without accumulated state or frame-to-frame randomness.

## Audio and states

- Bass expands coil height and block width.
- Mids change loop width.
- Decaying transients send a small vertical disturbance along each row and pulse block height.
- RMS changes line weight subtly.
- Calm/active/extreme motion and impulse state fields amplify shape modulation and transient disturbances. Other shared fields remain available but are not independently mapped.

The existing real-track feature interpolation and envelopes are reused with short spatial delays. Autonomous travel and deformation continue without music response.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)**, within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC. This is not a final scene placement or full-segment assembly.

- Video: `renders/prototype-86/signal-lattice-86-scene-cj-25s.mp4`
- Contact sheet: `renders/prototype-86/contact-sheet.jpg`
- Preview: `pages/prototype-86.html`
- Source: `src/prototype-86/scene-cj.js`
- Render: `node scripts/render-prototype-86.mjs`

Seeded block and coil-lane introductions preserve the outgoing canvas. Explicit-time rendering permits seeking and reuse without warm-up. Coordinates target 960 × 540; larger outputs require scaling. No new dependencies or changes to previous scenes/segments; slot 85 is untouched.
