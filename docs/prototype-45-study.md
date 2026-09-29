# Scene AU — Luminous Channels

Fifth new scene study for Segment 3; previous scenes and completed assemblies remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260513 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or stored. Artist seal omitted.

The reference presents luminous vertical channels against black. Layered slanted blocks accumulate into saturated color and white highlights, while long thin curves curl through the columns. Fine square mosaic fragments modulate the color field. Channel boundaries stay recognizable despite overlap and energetic detail. The palette spans the spectrum rather than using a few fixed hues. Motion is an original extension of the still.

## Independent implementation

Twelve horizontal-layout channels contain fourteen seeded light packets each. Analytic gradient envelopes and several independently slanted bands generate luminous accumulation, rather than porting the source's nested shrinking-rectangle loop. Nine original parametric filaments per channel mix long sweeps with deeper curls. A cached, seeded multiscale square texture is overlaid on the result, independently of the source's subdivision recipe.

Autonomous motion includes vertical packet transport, changing slant, subtle color evolution, filament curvature and slow texture displacement. Bright additive intersections contrast with black gaps. Grain remains stable rather than changing randomly each frame. Every visible state derives directly from track time.

## Audio mappings

- Bass: vertical light-packet displacement.
- Mids: packet slant.
- RMS: light-packet intensity.
- Highs: filament weight and local mosaic displacement.
- High residue: persistent luminous layering.
- Onsets: localized, decaying filament disturbances.
- Centroid is available through the common interface but is not separately mapped.

Features use the established full-track analysis at actual timestamps, with per-channel delays. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and onset decay 650 ms. Calm/active/extreme interpolation affects impulse strength. Autonomous motion remains with audio disabled.

## Deliverable and integration

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-45/signal-lattice-45-scene-au-25s.mp4`
- `renders/prototype-45/contact-sheet.jpg` — six frames from that MP4
- `src/prototype-45/scene-au.js`
- Preview `/pages/prototype-45.html`
- Render `node scripts/render-prototype-45.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D with no added dependencies. Supports seeded channel introductions and preserves the outgoing canvas during partial entry. This is a standalone scene study, not a full Segment 3 render.
