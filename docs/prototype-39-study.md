# Scene AO — Contour Frequencies

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260606 / graphic. User supplied a screenshot and source attachment. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context but not copied, executed, translated or stored. Artist seal omitted.

The reference is a grid of grayscale square panels over black. Within each panel, soft tonal regions meet stepped bands, irregular circular contours and broken granular trails. Offset square boundaries overlap. Fine horizontal or vertical lines in white, black and red cross the panels; red is the only chromatic accent. Difference-like tonal inversions produce intricate interactions without a bright palette. The supplied still establishes appearance, not movement.

## Independent construction

Eighteen panels in a 6 × 3 horizontal arrangement use independently phased analytic contours. Layered polygon bands and a radial tonal base replace the source's blur/posterize pipeline. A second moving formation uses standard difference compositing. Four fine irregular boundaries with seeded granular marks add a sharper layer. Twenty-four thin drifting lines per panel include sparse red accents; panels alternate line orientation. No source noise-ring routine, image catalogue, arrangement or seal is reused.

Autonomous motion includes continuously morphing contour profiles, opposing formation rotation, relative displacement, granular travel, shifting panel outlines and independently moving scan lines. All geometry depends on fixed seeds and explicit track time. Stable grain seeds avoid random frame flicker.

## Audio response

- Bass: broad formation breathing.
- Mids: relative orientation between tonal formations.
- Onsets: decaying contour and scan-line displacement.
- High residue: lingering spread of granular marks.
- Highs: red-line emphasis.
- RMS: restrained red-line weight changes.
- Centroid: neutral scan-line weight.

Features come from the established full-track analysis at actual timestamps, with lateral delays. Fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms and onset decay 650 ms remain unchanged. Calm/active/extreme parameters interpolate continuously and modify transient strength. Autonomous movement remains without audio.

## Deliverable and integration

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. Native 960 × 540, 30 fps, 25 seconds, 750 frames, H.264/AAC.

- `renders/prototype-39/signal-lattice-39-scene-ao-25s.mp4`
- `renders/prototype-39/contact-sheet.jpg` — extracted from the encoded MP4
- `src/prototype-39/scene-ao.js`
- Preview `/pages/prototype-39.html`
- Render `node scripts/render-prototype-39.mjs`
- Analysis `assets/analysis/prototype-02.json`

The established `introFor` interface introduces complete panels while retaining the outgoing canvas during partial entry. This study does not alter previous scenes or assemble a full-track/60-second sequence.
