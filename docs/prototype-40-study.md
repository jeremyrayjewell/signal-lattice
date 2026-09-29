# Scene AP — Ochre Oscillations

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250504 / graphic. User supplied the source and screenshot. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or saved in the repository. Artist seal omitted.

The image places fine angular waveform tangles and flat ovals across a white field. Its airy spacing is important: isolated large ellipses contrast with clusters of smaller circles, and jagged strokes vary in direction. A restrained palette combines charcoal, neutral grays, ochre and yellow. Partially transparent ovals reveal lines beneath. The still supplies visual grammar; animation is an independent extension.

## Independent implementation

54 seeded groups fill a denser horizontal layout. Each larger waveform uses five woven pen paths with different cross-connection lengths around an analytic traveling triangular/sinusoidal centerline. Looped filaments, lateral folds and angular hatching distinguish braided, knotted and serrated clusters. This is independent of the source's noise-modulated triangle-strip construction. Stable seeded offsets add scratchiness without per-frame random flicker. Groups contain either no ovals, one large oval, or a small cluster, with varied opacity and proportions.

Autonomous motion includes traveling wave crests, local path flexing, group drift, changing orientation, and independently orbiting/turning ovals. The composition does not rotate or scale as a whole. All motion uses explicit source time and seeded geometry.

## Audio mappings

- Bass: group displacement and gentle oval breathing.
- Mids: waveform amplitude and orientation, plus oval tilt.
- Onsets: local pen-path disturbances with the established decaying impulse.
- Highs: looped-filament articulation. High-frequency residue: persistent oval deformation and echo-ring visibility.
- RMS: pencil-path opacity.
- Centroid: pencil-path weight.

Uses the existing full-track feature cache with timestamp interpolation and lateral delays. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and impulse decay 650 ms. Calm/active/extreme interpolation modifies waveform amplitude and disturbance strength. Autonomous motion persists with audio disabled.

## Deliverable and integration

Real track **02:08.000–02:33.000**. Clock: `128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-40/signal-lattice-40-scene-ap-25s.mp4`
- `renders/prototype-40/contact-sheet.jpg` — extracted from the encoded MP4
- `src/prototype-40/scene-ap.js`
- Preview `/pages/prototype-40.html`
- Render `node scripts/render-prototype-40.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports the established seeded element-introduction interface while retaining the outgoing canvas during partial entry. Previous scenes and assemblies remain unchanged. This is a standalone study for review.

## Density and effects revision

Following review, the field is substantially denser, strokes are darker and more tangled, and independent motion is faster and broader. Selected scribbles carry faint time-offset trails, sampled analytically rather than accumulated from previous frames. Local onset-driven shear disturbs each cluster, while offset rings around selected ovals create a lingering registration effect. These effects preserve deterministic seeking and retain the white/ochre/yellow visual family.

## Textured oval revision

Ovals now contain clipped graphite grain and three surface treatments: fine curved hatching, crosshatching, or offset contour rings. Dark ovals use pale pencil marks; lighter colors use charcoal marks. Hatching shifts and turns gently within each moving oval, mids bend the lines, and highs modestly strengthen grain contrast. Grain placement is fixed by seed and moves with the oval, preserving deterministic rendering without texture flicker.

## Background texture revision

The white ground now carries the same graphite character as the oval surfaces: faint full-canvas grain (seed-fixed scattered marks, not reseeded per frame) plus long, gently drifting curved hatch strokes across the whole frame. Kept low-opacity and behind the scribble field so it reads as textured paper rather than competing with the foreground; highs modestly strengthen grain contrast, matching the oval texture's audio response.
