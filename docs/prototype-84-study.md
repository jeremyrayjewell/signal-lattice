# Scene CH — Arc Assemblies

New standalone scene study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20260926 / graphic. User-supplied source and screenshot inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference arranges flat, multicolored semicircles and quarter-circle sectors in varied orientations on white. Small discs punctuate the open spaces, thin white concentric arcs cut through large colored semicircles, and fine black curves cross the geometric groups. Full-sized and smaller assemblies create uneven white gaps. This contrast between flat geometric masses and fine curved lines is preserved.

## Independent implementation

45 assemblies occupy a 9-by-5 horizontal field. Each uses declarative sector and disc primitives, seeded palette assignments and mixed scales. Native Canvas draws the shapes, clipped within tile bounds. Thin curves animate independently across the white intervals. No source functions or artist seal are reused.

Staggered eased quarter-turns reorient the assemblies. Sector radii breathe, dots orbit locally, white contours vary their spacing, and black curves continuously flex. Motion is evaluated from absolute time without simulation history or per-frame random regeneration.

## Audio/state mapping

- Bass expands assembly scale.
- Transients pulse sector radii.
- Mids affect contour spacing and black curve displacement.
- RMS changes disc size.
- Centroid subtly changes black curve weight.
- Calm/active/extreme motion and impulse parameters strengthen shape/curve movement and transient response. Other shared state fields remain available but are not separately mapped.

The established real-track controls and smoothing are reused, including small spatial delays. Autonomous motion continues without audio response.

## Deliverables and reuse

Track interval **06:08–06:33 (368–393 seconds)** within Segment 7. 25-second standalone review study, 960 × 540, 30 fps, 750 frames, H.264/AAC with the exact real audio excerpt. Final segment placement is not assigned here.

- Video: `renders/prototype-84/signal-lattice-84-scene-ch-25s.mp4`
- Contact sheet: `renders/prototype-84/contact-sheet.jpg`
- Preview: `pages/prototype-84.html`
- Source: `src/prototype-84/scene-ch.js`
- Renderer: `node scripts/render-prototype-84.mjs`

Seeded introductions preserve the outgoing canvas. Arbitrary seeks and later reuse need no warm-up. The fixed 960 × 540 layout requires scaling for other output sizes. No new dependencies or earlier scene/segment changes; slot 83 is untouched.
