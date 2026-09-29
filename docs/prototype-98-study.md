# Scene CV — Chromatic Registers

New standalone scene study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250502 / graphic. User-supplied source and screenshot inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted. This reference shares a date with an earlier supplied study but has a distinct supplied composition and code; this entry identifies the current ring-and-RGB-stripe study specifically.

The reference has staggered rows of concentric ring stacks on near-black. Cyan, yellow and magenta stacks are slightly offset and sheared, while black rings interrupt their overlaps. Line widths increase toward the center. Fine vertical red/green/blue stripes add a screen-like texture, particularly around antialiased ring edges and in the dark ground.

## Independent construction

Five rows of seeded clusters, including offscreen edge clusters, each contain four independently parameterized ellipse banks. Three banks use the limited CMY combinations; the fourth draws black interruptions. Explicit-time offsets, rotation, shear and ellipse proportions change continuously. The alternating ring counts remain stable to avoid random flicker.

A six-pixel RGB pattern is applied with overlay compositing. A separate alpha snapshot preserves the scene's transparency during partial introductions, so the texture does not repaint the outgoing scene. Native Canvas primitives and compositing implement the visual grammar; reference functions and artist seal are not reused.

## Audio and states

- Bass expands ring radii.
- Mids alter shear.
- Decaying transients increase bank misalignment.
- RMS subtly increases line weight.
- Calm/active/extreme motion and impulse fields strengthen rotation modulation and transient separation. Other shared fields remain available but are not independently mapped.

Existing real-track controls, smoothing and spatial delays are retained. Autonomous rotation, drift, shear and misalignment continue without audio response.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)** within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC. Final timeline placement is not assigned here.

- Video: `renders/prototype-98/signal-lattice-98-scene-cv-25s.mp4`
- Contact sheet: `renders/prototype-98/contact-sheet.jpg`
- Preview: `pages/prototype-98.html`
- Source: `src/prototype-98/scene-cv.js`
- Render: `node scripts/render-prototype-98.mjs`

Seeded introductions preserve the outgoing scene. Explicit-time rendering permits arbitrary seeks without warm-up. Fixed coordinates and fine RGB stripe pitch target 960 × 540; other resolutions require scaling decisions and compression can soften the stripe detail. No new dependencies or previous scene/segment edits; slot 97 is untouched.
