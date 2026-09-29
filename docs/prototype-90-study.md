# Scene CN — Chromatic Halo

New standalone study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20260101 / graphic. User-supplied screenshot and source inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference combines a thick, irregular luminous ring with a dark multiscale triangle mosaic. Overlapping translucent colored discs produce bright pale intersections and saturated edges. The dark center remains open, showing the underlying triangles. The mosaic continues across the ring but is visually subordinate to the glow.

## Independent construction

Ten independently phased bands of cached radial color stamps form the halo. Harmonic radius modulation replaces the reference's noise traversal. An elliptical placement adapts the central ring to 16:9 while retaining its dark interior. A seeded triangular grid at three cell sizes supplies dark colored facets beneath the halo, with a restrained additional facet pass over it. Native Canvas screen compositing creates the luminous overlaps; no reference functions are reused.

Bands counter-travel at different rates, radius profiles deform, local disc size varies, and the center drifts slightly. Mosaic opacity changes slowly. All movement is explicit-time and seeded, without random regeneration or frame accumulation.

## Audio and states

- Bass expands band radii.
- Decaying transients enlarge the luminous discs.
- RMS increases glow strength slightly.
- High-frequency activity lifts mosaic opacity.
- Calm/active/extreme impulse parameters strengthen transient response. Other shared state/feature fields remain available but are not separately mapped.

Real-track controls use the existing interpolation, smoothing and staggered band delays. Autonomous circulation and deformation continue without audio response.

## Deliverables and reuse

Track interval **06:08–06:33 (368–393 seconds)** within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC with real audio. Final scene placement is not assigned here.

- Video: `renders/prototype-90/signal-lattice-90-scene-cn-25s.mp4`
- Contact sheet: `renders/prototype-90/contact-sheet.jpg`
- Preview: `pages/prototype-90.html`
- Source: `src/prototype-90/scene-cn.js`
- Render: `node scripts/render-prototype-90.mjs`

Seeded band and facet introductions preserve the outgoing canvas. Seeking or later reuse needs no simulation warm-up. The fixed coordinate layout and cached stamp resolution target 960 × 540; larger output requires scaling or higher-resolution stamps. No new dependencies, previous scene edits or segment assembly; slot 89 is untouched.
