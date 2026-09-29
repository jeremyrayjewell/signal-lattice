# Scene CT — Checker Drift

New standalone scene study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250421 / graphic. User-supplied source and screenshot inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference is an almost continuous collage of small checker patches at arbitrary angles. Black cells alternate with rust, orange, navy, green and pale gray. Column displacement gently bends the grids, giving overlapping patches irregular boundaries without losing the small square vocabulary. The visual density and restricted palette are central; large gaps, bright extra colors or decorative outlines would weaken the match.

## Independent construction

280 seeded patches use cached 20-by-20 checker textures. Native Canvas draws each texture as narrow column strips with independently evaluated harmonic displacement. The source's per-cell noise traversal is not reused. Slight patch-size variation keeps cell sizes close to the reference while providing depth through overlap.

Patches drift and rotate independently. Waves travel through columns, shifting the visible checker alignment and outer boundaries. Scale changes remain restrained so the composition stays densely layered. The palette and color assignments remain stable rather than being regenerated per frame. All motion is explicit-time and independent of render order.

## Audio and states

- Bass expands patch scale.
- Mids add local column displacement.
- Decaying transients increase the bending wave amplitude.
- Calm/active/extreme motion and impulse fields strengthen rotation and transient bending. Other common state/features remain available but are not independently mapped.

Real-track controls retain the established interpolation, smoothing and short spatial delays. Autonomous rotation, drift and column waves remain active without audio response.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)** within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC. This does not assign final timeline placement.

- Video: `renders/prototype-96/signal-lattice-96-scene-ct-25s.mp4`
- Contact sheet: `renders/prototype-96/contact-sheet.jpg`
- Preview: `pages/prototype-96.html`
- Source: `src/prototype-96/scene-ct.js`
- Render: `node scripts/render-prototype-96.mjs`

Seeded patch introductions preserve the outgoing canvas. Seeking and reuse require no simulation warm-up. Cached texture resolution and coordinates target 960 × 540; larger output should regenerate higher-resolution textures or scale appropriately. Fine checker patterns are sensitive to downsampling. No new dependencies or previous scene/segment changes; slot 95 is untouched.
