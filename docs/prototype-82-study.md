# Scene CF — Checker Apertures

New scene study for Segment 7, following the user's segment assignment. Existing segment assemblies are untouched.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20260923 / graphic. Screenshot and source supplied by the user, inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference layers checkerboard squares of several resolutions with solid square frames whose open centers reveal earlier marks. Black alternates with a restrained red, orange, yellow, blue, green and neutral palette. White calligraphic strokes cross the frames and sometimes escape their edges. Large underlying structures and smaller foreground interruptions create the dense collage; the open centers must remain transparent rather than being painted white.

## Independent construction

180 seeded layers descend from large to small. Cached repeating checker textures use native Canvas patterns; even-odd paths define the open frames. Independent quadratic stroke paths provide four animated white gestures per frame layer. Random placement and palette choices remain fixed while continuous time drives the animation. No reference functions are reused.

Checker layers drift bodily while their internal patterns slide. Frame openings breathe and the white curves flex independently. Small angular changes preserve the primarily axis-aligned composition. No per-frame random regeneration or accumulated simulation state is needed.

## Audio and states

- Bass expands layer scale.
- Mids shift internal checker patterns.
- Decaying transients change frame openings.
- RMS subtly changes white stroke width.
- Calm/active/extreme motion and impulse parameters affect drift and opening response; other shared fields are retained but not separately mapped.

Existing full-track analysis, smoothing and timestamp controls are reused with short spatial delays. Autonomous movement remains when audio response is disabled.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)**, within Segment 7's 06:00–07:00 interval. This is a 25-second standalone study rather than a final scene placement. 960 × 540, 30 fps, 750 frames, H.264/AAC. A new exact excerpt is extracted from the original audio for this study.

- Video: `renders/prototype-82/signal-lattice-82-scene-cf-25s.mp4`
- Contact sheet: `renders/prototype-82/contact-sheet.jpg`
- Preview: `pages/prototype-82.html`
- Implementation: `src/prototype-82/scene-cf.js`
- Render: `node scripts/render-prototype-82.mjs`

Seeded partial introductions preserve the outgoing canvas; frame apertures remain transparent. Explicit-time rendering permits arbitrary seeks and reuse. Coordinates target 960 × 540 and require scaling at other resolutions. No new dependencies or changes to previous scenes. This does not create or assign #81.
