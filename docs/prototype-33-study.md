# Scene AI — Prismatic Ringfields

## Reference

E.C.H. / Eiichi Ishii, dailycoding 20221114 / graphic. User supplied the source and screenshot. CC BY-NC-SA recorded under the standing instruction; no URL supplied. Source was seen but not copied, executed, translated or stored. Artist seal excluded.

The image shows saturated flat rings on black, irregularly tilted into ellipses, with variable apertures and fine white/black crossing strands. Two opposed perspective fields meet near the middle; large foreground rings contrast with smaller distant rows. This study preserves that visual grammar with original layout, analytic projection and motion.

## Construction and motion

Two independently seeded fields use an analytic depth scale and row placement, drawn directly with Canvas2D. No WEBGL scene or source masking procedure is ported. Color discs with opaque black elliptical apertures are layered with swaying cubic strands. Offscreen columns keep the distant field spanning the width. The lower field has independent colors, apertures and phases rather than duplicating the upper image.

Autonomous motion changes ring tilt, aperture, lateral row drift, local height and strand curvature on different timescales. The central join moves slowly. All motion is a direct function of track time, with seeded geometry and no accumulated state.

## Audio mappings

- Bass: aperture breathing, field deformation and small seam movement.
- Mids: elliptical flattening/tilt appearance.
- Highs: strand sway.
- Onsets: short ring-tilt disturbances, using the established decaying impulse.
- Residue: lingering strand extension.
- Centroid: strand visibility.
- RMS is supplied by the shared interface but not separately mapped here.

Existing full-track analysis is reused at actual source timestamps, with lateral delays. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, impulse decay 650 ms. Calm/active/extreme interpolation affects impulse strength. Autonomous motion remains when controls are disabled.

## Deliverable

25 seconds, real track **02:08.000–02:33.000**. Clock: `128 + frame / 30`. 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-33/signal-lattice-33-scene-ai-25s.mp4`
- `renders/prototype-33/contact-sheet.jpg` — six frames from the encoded MP4
- `src/prototype-33/scene-ai.js`
- Preview: `/pages/prototype-33.html`
- Render: `node scripts/render-prototype-33.mjs`

Supports existing seeded element introductions without clearing the outgoing scene during partial entry. This is a standalone study for review, not a new 60-second assembly. Earlier prototypes remain unchanged.
