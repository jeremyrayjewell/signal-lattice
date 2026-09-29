# Scene BY — Stripe Counterpoint

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250919 / graphic. User-supplied screenshot and source inspected 2026-09-28. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal are omitted.

The reference is a tightly packed monochrome tile composition. Alternating stripes occupy full tiles, central strips, or wedge-shaped areas. Slightly sloping edges break their regularity. Mixed black and white tile grounds reverse the local figure/ground relationship. Small rectangular dashes form circular contours that disappear against matching stripe colors and reappear against opposite ones.

## Independent implementation

45 square tiles fill a 9-by-5 horizontal field, cropped slightly at the sides. Native Canvas filled quadrilaterals define the stripe shapes, with independently varying slopes and endpoints. Circular contours use individually drawn short arc dashes. Seeded tiles vary stripe count, orientation, coverage mode, polarity, circle radius and motion phase.

Stripe fields turn through staggered, smoothly eased quarter turns inside fixed tile boundaries. Autonomous changes in stripe position, slope and length accompany circulating dashes and slowly wandering, breathing circles. All geometry and motion use explicit time and seeded parameters; no source functions or frame accumulation are used.

## Audio/state mapping

- Bass: stripe thickness and circle radius.
- Mids: stripe displacement and circulating dash phase.
- Decaying transients: central-strip and wedge lengths.
- RMS: circle stroke weight.
- Motion and impulse state parameters increase movement and transient response. Other interface parameters/features are retained but not separately mapped.

The established real-track controls, smoothing and short spatial delays are reused. Calm/active/extreme states retain autonomous motion when audio response is disabled.

## Output and reuse

25-second study at **02:08–02:33**, 960 × 540, 30 fps, 750 frames, H.264/AAC with the real excerpt. This is a standalone review study, not a final timeline assignment.

- Video: `renders/prototype-75/signal-lattice-75-scene-by-25s.mp4`
- Contact sheet: `renders/prototype-75/contact-sheet.jpg`
- Preview: `pages/prototype-75.html`
- Render: `node scripts/render-prototype-75.mjs`
- Source: `src/prototype-75/scene-by.js`

Explicit-time rendering supports arbitrary seeks and later reuse. Partial seeded tile introductions preserve the outgoing canvas. The fixed 960 × 540 coordinate layout requires scaling at other resolutions. No new dependencies, previous scene changes, or full-track assembly; slot 74 is untouched.
