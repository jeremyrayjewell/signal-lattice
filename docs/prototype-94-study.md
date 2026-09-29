# Scene CR — Neon Oscillograms

New standalone study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250304 / graphic. Source and screenshot supplied by the user, inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference places thin, saturated waveform bands at many angles on black. Dense high-frequency teeth alternate with wider low-frequency oscillations. Several amplitudes share each band's color and orientation, creating a narrow woven texture. Screen-blended intersections brighten while sizeable black regions separate clusters. The fine angular lines are essential; soft glows or filled ribbons would change the character.

## Independent construction

132 seeded bands each contain seven nested waveform lanes. Two frequency regimes combine with a precomputed irregular amplitude field per lane. Explicit-time interpolation moves through that field, preserving continuous motion rather than generating unrelated random values each frame. Native Canvas screen compositing brightens intersections. This uses an independently parameterized oscillator system, not the reference functions.

Wave phase travels continuously, band amplitudes and lengths breathe, orientations rock, and centers drift independently. Fixed seed identities and explicit-time motion permit deterministic seeking. No frame accumulation or external textures are used.

## Audio and states

- Bass expands band width.
- Decaying transients add amplitude disturbances.
- Mids bend the band centerline slightly.
- High-frequency energy and RMS raise line intensity.
- Centroid subtly changes stroke weight.
- Calm/active/extreme motion and impulse fields strengthen rocking and transient response. Other shared state fields are retained but are not independently mapped.

Existing real-track controls and smoothing are reused with short spatial delays. Autonomous movement remains with audio response disabled.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)** within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC. This does not assign final segment placement.

- Video: `renders/prototype-94/signal-lattice-94-scene-cr-25s.mp4`
- Contact sheet: `renders/prototype-94/contact-sheet.jpg`
- Preview: `pages/prototype-94.html`
- Source: `src/prototype-94/scene-cr.js`
- Render: `node scripts/render-prototype-94.mjs`

Seeded band introductions preserve the outgoing scene. Reuse and seeks need no simulation warm-up. Layout and stroke sampling target 960 × 540 and should be scaled for other resolutions. Fine lines are naturally sensitive to downsampling and video compression. No new dependencies or previous scene/segment edits; slot 93 is untouched.
