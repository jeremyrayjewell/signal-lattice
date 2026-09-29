# Scene BU — Interference Etching

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250920 / graphic. User supplied screenshot and source, inspected 2026-09-28. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Source informed the visual study; reference functions and artist seal are not included.

The reference fills the composition with overlapping black and white hatching. Slight differences in direction make dense rectangular fields feel frayed, with long strokes meeting short interruptions. Concentric circular regions invert the accumulated marks, so their boundaries remain legible without replacing the underlying texture. The two structural scales—fine linear interference and broad circular polarity—define the scene.

## Independent construction and motion

112 seeded line clusters use four cached native Canvas Path2D banks each. Each bank contains independently placed orthogonal fragments with a small angular spread and sparse contrasting marks. Explicit-time translation, rotation, stretch and relative bank motion continuously change the intersections. Twelve independently breathing annular masks use difference compositing over the completed line field. Their shared center drifts slowly; the masks preserve the detail beneath them.

No frame-to-frame accumulation, random reseeding during drawing, new dependencies, or copied reference functions. Rendering and audio infrastructure are reused from prototype-70. Earlier scenes remain untouched.

## Audio and states

- Bass expands line clusters and ring radii.
- Mids articulate relative hatch-bank angles.
- Transients stretch hatch banks and widen inversion bands through the existing decaying impulse envelope.
- RMS subtly changes line weight.
- High-frequency and centroid controls remain available but are not independently mapped.

Calm/active/extreme states interpolate using the established state module. Motion and impulse parameters affect this scene; articulation/detail remain interface-compatible but are not separately mapped. Autonomous motion continues without audio. Actual track timestamps and spatially delayed controls are retained.

## Study output

Track interval **02:08–02:33 (128–153 seconds)**, 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC with the real track excerpt. This follows the current standalone study convention; it does not assign a final full-song placement.

- Video: `renders/prototype-71/signal-lattice-71-scene-bu-25s.mp4`
- Contact sheet: `renders/prototype-71/contact-sheet.jpg`
- Preview: `pages/prototype-71.html`
- Renderer: `node scripts/render-prototype-71.mjs`
- Implementation: `src/prototype-71/scene-bu.js`

Seeded introductions preserve the outgoing canvas until full entry. No scene assembly or full-track timeline changes. The study uses a fixed 960 × 540 drawing coordinate system, matching the current bank; other output sizes require scaling. Absolute track time permits arbitrary seeks and later reuse without simulation warm-up.
