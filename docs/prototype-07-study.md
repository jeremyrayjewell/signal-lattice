# Scene K — Gestural Dials

## Reference study, 2026-09-22

E.C.H. / Eiichi Ishii, dailycoding - 20260912 / graphic. Reference is the user-supplied screenshot; URL not supplied. License recorded as CC BY-NC-SA per the user's standing instruction for this creator. Source code was supplied in conversation and seen, but is not copied, executed, or stored in this repository.

The image has a white ground and a loose five-by-five arrangement of isolated marks. Each cluster combines an incomplete-looking segmented circular outline with several irregular crossing curves. Ring diameter, dash size, curve weight and color vary considerably. Some clusters are almost entirely gray or black; others contrast cyan, yellow, violet or red with neutral strokes. White gutters separate the clusters. The visual hierarchy is the arrangement of individual glyph-like clusters, then the broken circles, then the curves. The rings are square-ended, with conspicuous white gaps. The curves have irregular hooks, turns and intersections rather than a shared repeating waveform. Only a still was supplied; no motion is inferred. The border and artist seal are omitted.

## Independent implementation

Use 21 large glyphs in seven columns and three rows, spaced for a horizontal frame. Independent polar trajectories with smoothly varying angular and radial harmonics generate open curved gestures; these are sampled paths, not the supplied random Bezier routine. Explicit rectangular ring segments have seeded counts and widths. Placement, palette selection, gesture trajectories and animation are original. Ring and gesture sizes vary while generous white gutters preserve individual identities. No reference function or exact still layout is reproduced.

## Motion and audio

Track time is 128 + frame / 30. Each glyph samples timestamped cached features with a small position-dependent delay. Bass gently deforms ring radius; mids change gesture curvature; highs and their residue articulate ring segments; transients briefly displace segments and bend gestures with existing decay; RMS changes stroke weight modestly; centroid biases accent saturation. Independent slow angular drift, curve evolution and local segment travel continue without audio.

CALM / ACTIVE / EXTREME interpolate continuously with smoothstep over 5–11 and 11–20 seconds. Parameters (calm, active, extreme): bend (.3,.65,1), drift (.3,.6,1), disturbance (.35,.8,1.3), detail (.35,.65,1). Calm holds 0–5 seconds; extreme holds 20–25. Existing analysis memory: fast attack/release 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transient decay 650ms.

## Output

25 seconds at 960 x 540, 30 fps, H.264 with real audio, source 02:08.000–02:33.000. The existing full-track analysis and exact PCM excerpt are reused. No full-track timeline changes.

- Video: renders/prototype-07/signal-lattice-07-scene-k-25s.mp4
- Contact: renders/prototype-07/contact-sheet.jpg
- Preview: /pages/prototype-07.html
- Render: node scripts/render-prototype-07.mjs

All previous scene code and studies remain unchanged.

Completed: all 750 frames rendered without browser errors; deterministic replay, audio response, autonomous motion and historical source hashes passed. The six-frame contact sheet was extracted from the encoded MP4 and inspected. The gestures read more as curled glyphs than the reference's crossing strokes; this is a visible difference to evaluate in review. No further scene refinement or full-track render was started.
