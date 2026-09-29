# Scene CX — Gossamer Folds

New standalone scene study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250128 / graphic. User-supplied source and screenshot inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference overlaps translucent monochrome meshes on black. Some regions read as fine folded linework, others as soft white masses built from many faint triangles. Irregular boundaries, changing local density and dark gaps create depth without solid outlines or added colors.

## Independent construction

A staggered field of 96 seeded patches mixes filled triangular filaments with fine wire meshes. Two harmonic displacement fields define each cached patch's folded profile; reference noise traversal and drawing functions are not reused. Native Canvas transparency builds the gray masses through overlapping marks and overlapping patches.

Patches drift, rock, shear and stretch independently, with changing opacity. Their stable internal meshes preserve fine detail without random flicker. Shape changes are applied at patch level rather than rebuilding every mesh vertex each frame. All animation uses explicit track time and no accumulated simulation state.

## Audio and states

- Bass expands patches.
- Mids change shear.
- RMS and decaying transients lift translucency and brightness.
- Calm/active/extreme motion and impulse fields strengthen rocking and transient brightness. Other common fields remain available but are not separately mapped.

Established real-track feature interpolation, smoothing and spatial delays are reused. Autonomous drifting and deformation remain when audio response is disabled.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)** within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC. No final timeline placement is assigned here.

- Video: `renders/prototype-100/signal-lattice-100-scene-cx-25s.mp4`
- Contact sheet: `renders/prototype-100/contact-sheet.jpg`
- Preview: `pages/prototype-100.html`
- Source: `src/prototype-100/scene-cx.js`
- Render: `node scripts/render-prototype-100.mjs`

Seeded patch introductions preserve the outgoing canvas. Arbitrary reuse and seeking need no warm-up. Coordinates and cached mesh resolution target 960 × 540; larger outputs should regenerate sharper textures. Internal mesh motion is limited to patch transforms. No new dependencies or previous scene/segment changes; slot 99 is untouched.
