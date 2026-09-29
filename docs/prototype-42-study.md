# Scene AR — Woven Currents

Second new study for Segment 3. Previous scenes and completed segment assemblies remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260301 / graphic. User supplied source and screenshot. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference combines a patchwork of black, gray and muted colored squares with overlapping families of undulating lines. Rotated regions contain roughly perpendicular wave bundles, mixing solid strokes with short square dashes. Width, spacing and palette vary between regions. Pink, mustard, rust, slate blue and muted green cross the neutral background. Dense crossings alternate with dark openings; the drawing resembles a woven contour map. Motion is an original extension of the still.

## Independent construction

24 seeded regions span a loose horizontal arrangement. Each contains two independently articulated wave families generated with analytic, spatially coupled oscillations. The construction does not reproduce the source's noise-coordinate walking or curve-vertex loops. Individual line availability, width, color and dash style are fixed by seed. A separate 150-block background drifts slowly beneath them.

Lines in each family share coherent broad bending, with smaller folds and gradual divergence between rows. Bundles drift and rotate slightly; dashes travel along the curves. Opposing orientations and varying frequencies give layered motion without rotating the whole composition. Seeded element introductions preserve the outgoing scene during partial entry.

## Audio mappings

- Bass: broad curve amplitude and group displacement.
- Mids: local lateral deformation and group orientation.
- Onsets: localized, decaying wave disturbances.
- High-frequency residue: short-lived dash-phase displacement.
- Centroid: modest line-weight changes.
- RMS and immediate highs remain available through the shared interface but are not separately mapped in this study.

Actual timestamp lookups use the established full-track cache with slight lateral delays. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and impulse decay 650 ms. Calm/active/extreme interpolation affects angular movement and transient strength. Autonomous motion remains with audio disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-42/signal-lattice-42-scene-ar-25s.mp4`
- `renders/prototype-42/contact-sheet.jpg` — six frames from the encoded MP4
- `src/prototype-42/scene-ar.js`
- Preview `/pages/prototype-42.html`
- Render `node scripts/render-prototype-42.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D rendering uses no new dependencies. This is a standalone scene study; Segment 3's final authored timeline is not assembled here.
