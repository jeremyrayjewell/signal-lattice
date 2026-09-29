# Scene K — Gestural Dials

E.C.H. / Eiichi Ishii, dailycoding - 20260912 / graphic. Reference is the user-supplied screenshot; URL not supplied. License recorded as CC BY-NC-SA per the user's standing instruction for this creator. Source code was supplied in conversation and seen, but is not copied, executed, or stored in this repository.

## Visual analysis

The image has a white ground and a loose five-by-five arrangement of isolated marks. Each cluster combines an incomplete-looking segmented circular outline with several irregular crossing curves. Ring diameter, dash size, curve weight and color vary considerably. Some clusters are almost entirely gray or black; others contrast cyan, yellow, violet or red with neutral strokes. White gutters separate the clusters. The rings are square-ended, with conspicuous white gaps; the curves have irregular hooks, turns and intersections rather than a shared repeating waveform. Only a still was supplied; no motion is inferred.

## Implementation

Use 21 large glyphs in seven columns and three rows, spaced for a horizontal frame. An earlier pass (kept only for reference, not wired into any render pipeline) generated gestures from independent polar trajectories with smoothly varying angular and radial harmonics, which read more as curled glyphs than the reference's crossing strokes and moved too little. This version replaces those paths with **six independent open stroke grammars**: sweeping slashes, bowed arches, upright serpentine strokes, bent elbows, open hooks, and articulated waves. Each cluster mixes two to five strokes with independently seeded lengths, weights, orientations and colors. Ring radii span 20–54 pixels, with 9–30 ticks; selected rings are incomplete or deform into ovals. White gutters, colored/neutral contrasts and segmented circles retain the reference identity.

Autonomous motion is substantial: stroke angles sweep by up to .45 radians, strokes separate by 7–22 pixels, curve shape evolves continuously, and ring centers move on independent 11/12-pixel trajectories. Ring segment circulation runs at .19–.37 radians per second in alternating directions, with motion rates differing between glyphs and strokes; no overall canvas transform is used. These are functions of absolute track time, not frame accumulation. None of this reproduces the reference's own random Bézier routine or exact still layout.

## Motion and audio

Track time is `128 + frame / 30`. Each glyph samples timestamped cached features with a small position-dependent delay. Bass adds up to 7 pixels to directional ring deformation; mids change gesture shape and orientation; decaying transients displace ticks by up to 15.6 pixels and bend strokes by up to 19.5 pixels in the extreme regime; high-frequency residue articulates tick angle and width; RMS modestly affects line weight; centroid affects accent saturation. Independent slow angular drift, curve evolution and local segment travel continue without audio.

CALM / ACTIVE / EXTREME interpolate continuously with smoothstep over 5–11 and 11–20 seconds. Parameters (calm, active, extreme): bend (.3, .65, 1), drift (.3, .6, 1), disturbance (.35, .8, 1.3), detail (.35, .65, 1). Calm holds 0–5 seconds; extreme holds 20–25. Existing analysis memory: fast attack/release 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transient decay 650ms.

## Output

25 seconds at 960 × 540, 30 fps, H.264 with real audio, source 02:08.000–02:33.000.

- Video: `renders/prototype-07r/signal-lattice-07r-scene-k-25s.mp4`
- Contact: `renders/prototype-07r/contact-sheet.jpg`
- Source: `src/prototype-07r/scene-k.js`
- Preview: `/pages/prototype-07r.html`
- Render: `node scripts/render-prototype-07r.mjs`

Completed: all 750 frames rendered without browser errors; deterministic replay, audio response and autonomous motion checks pass. Three half-second frame comparisons show roughly 3.3–3.5 times the mean pixel change of the first pass, confirming the increased motion (this is not a perceptual quality score).
