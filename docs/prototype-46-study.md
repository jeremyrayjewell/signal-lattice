# Scene AV — Crosscurrent Layers

Sixth new study for Segment 3. Existing scenes and completed segment assemblies remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260504 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or stored. Artist seal omitted.

The reference layers square fields of horizontal and vertical marks across white. Some fields have opaque white backings and soft shadows; others overlap freely. Changes in scale produce large crosses, fine woven grids, broken strokes and dotted fragments. Teal, deep blue, ochre, rust, olive and muted green punctuate the white ground. Broad marks contrast with densely detailed regions. Animation is an original extension of the still.

## Independent construction

48 seeded panels vary in size and density, using 5, 8, 13 or 21 subdivisions per side. Each stores an independently generated mark field. Paired strokes slide continuously in perpendicular directions with different phases, lengths and weights; this does not port the source's discrete offset-selection procedure. Selected panels have white backing cards and cast soft shadows. Others remain transparent so their marks combine with earlier layers.

Autonomous motion includes panel drift, internal cross displacement, changing segment lengths and traveling dashes. No uncontrolled per-frame randomness or accumulated simulation state is used. All geometry is derived from fixed seeds and explicit source time.

## Audio mappings

- Bass: panel displacement.
- Mids: horizontal mark articulation.
- Onsets: decaying, panel-specific vertical disturbances.
- Highs: dash-phase accents.
- High residue: persistent segment extension.
- RMS: vertical-stroke weight.
- Centroid: horizontal-stroke weight.

Controls use timestamp interpolation from the existing full-track cache with lateral offsets. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and onset decay 650 ms. Calm/active/extreme interpolation affects disturbance strength. Motion persists when audio controls are disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-46/signal-lattice-46-scene-av-25s.mp4`
- `renders/prototype-46/contact-sheet.jpg` — six frames from the encoded MP4
- `src/prototype-46/scene-av.js`
- Preview `/pages/prototype-46.html`
- Render `node scripts/render-prototype-46.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-panel introductions, preserving the outgoing canvas during partial entry. Native Canvas2D; no new dependencies. This is a standalone study, not a full Segment 3 assembly.

## Retro website background revision

The exposed background now uses an original 64-pixel wallpaper tile enlarged to a crisp 128-pixel repeat, with stronger sage/cream stippling, bold embossed teal pixel crosses, and ochre checker accents. The GIF-era webpage treatment is intentionally static and seeded, while white backing panels retain their clean fill and shadows. Partial scene introductions still preserve the outgoing canvas.
