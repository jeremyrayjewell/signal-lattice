# Scene I — Chromatic Veils

Source study **OP-3010898**, artwork `20260917` / `dailycoding - 20260917 / graphic`, E.C.H. (Eiichi Ishii), @u277028.

The exact license label visible in the supplied page screenshot is **CC BY-NC-SA**. No version number is visible. Visual evidence and license evidence were supplied by the user after direct page access was blocked. The visual analysis and license label were recorded before implementation in [source-references.md](source-references.md).

## Visual analysis and reinterpretation

The reference's distinctive grammar combines a dense multicolor ground of overlapping translucent fan-like fields with sharply opaque square marks following curved trajectories. Soft interiors meet straight cut boundaries. Bright openings, smoky dark pockets and variable scales create an asymmetric, almost full-frame patchwork. Saturated blue, cyan, green, orange, yellow, pink and violet coexist with light and dark square marks. A lower-left red seal identifies the artist. No animation was visually observed; the supplied evidence is a still image.

Chromatic Veils independently reinterprets the relationship between soft color fields and crisp square trails. It uses a light ground and a broad hue range rather than the A–H house palette. Twelve large, asymmetrical curvilinear panes establish the 16:9 composition, with six foreground square trajectories. Calm emphasizes separate fields and pale breathing spaces; active/extreme increase the overlaps, pane curvature and local trail articulation. Motion comes from pane boundary deformation, individual displacement, changing overlaps and travel along curves, with a fixed camera.

## Material implementation differences

- Twelve explicitly composed anchor sites replace an uncontrolled field of many randomly placed instances. Layout, orientation, scale and color placement differ from the supplied still.
- Each pane is one closed path with two straight edges and an asymmetric bowed edge, filled by an independently positioned radial gradient. It is not built from the source's repeated arc procedure.
- Six low-contrast internal ribs per pane provide secondary material structure rather than reproducing the reference's dense layering.
- Foreground square positions follow analytic combinations of sine curves, evaluated at explicit time; no dashed Bézier implementation or source function is used.
- State-dependent travel speed is integrated analytically, preventing phase jumps as regimes change.
- The artist's seal, signature, source functions, palette array and exact composition are not copied or executed.
- Source text was supplied in the conversation, so this is not a claim that the source implementation was unseen. The code was independently authored after recording observations from the screenshot; the supplied code was not saved into the repository.

## Music and state design

The existing full-track analysis and timestamp-based audio context are reused. Scene time is **128 + frame / 30 seconds**. The study uses the source track's **128.000–153.000 second interval (02:08.000–02:33.000)**, a previously selected active 25-second window. The accepted exact PCM excerpt is reused for preview and muxing.

| Feature                | Geometry-specific mapping                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Slow RMS               | Modest pane opacity/overlap strength, revealing greater color interaction rather than a uniform frame flash.     |
| Slow bass              | Broad pane displacement and vertical extent; differing pane phases push overlap regions in different directions. |
| Slow mids              | The curvature of each pane's bowed edge.                                                                         |
| Immediate mids         | Small independent local pane-angle offsets.                                                                      |
| Immediate highs        | Foreground square size, modulated by per-mark phases.                                                            |
| High-frequency residue | A faint offset square on selected marks, fading with the existing release envelope.                              |
| Transient memory       | Brief local pane displacement and square-angle disturbance with differing signs/phases.                          |
| Slow centroid          | Small hue biases within the multicolor palette; no whole-frame hue rotation.                                     |

Panes sample delays of 0–225 ms; trails sample delays of 0–275 ms. The existing immediate, slow, bass and high-residue attack/release curves and 650 ms transient decay are unchanged. Autonomous structural motion continues with all musical controls disabled.

| Parameter  | Calm | Active | Extreme |
| ---------- | ---: | -----: | ------: |
| curvature  | 0.25 |   0.70 |    1.10 |
| overlap    | 0.32 |   0.52 |    0.70 |
| drift      | 0.22 |   0.65 |    1.00 |
| saturation | 0.72 |   0.95 |    1.00 |
| trailSpeed | 0.18 |   0.40 |    0.65 |
| detail     | 0.40 |   0.70 |    1.00 |
| impulse    | 0.35 |   1.00 |    1.70 |
| scale      | 0.85 |   1.00 |    1.20 |

Parameters are family-specific coefficients, not physical units. `trailSpeed` is analytically integrated and converted to path progress by the drawing module. Curvature/deformation and motion phase are controlled separately.

Regime schedule: **0–5 s calm; 5–11 s smooth calm → active; 11–20 s smooth active → extreme; 20–25 s extreme.** Every numeric control uses smoothstep interpolation. This does not register I in the multi-scene timeline or modify any A–H modules.

## Artifacts and reproduction

- Video: `renders/prototype-05/signal-lattice-05-scene-i-25s.mp4`
- Contact sheet: `renders/prototype-05/contact-sheet.jpg`
- Source provenance: `docs/source-references.md`
- Exact sample frames and selected transient: `renders/prototype-05/study.json`
- Focused checks: `renders/prototype-05/render-report.json`
- Scene: `src/prototype-05/scene-i.js`
- State curves: `src/prototype-05/states.js`

```powershell
npm run dev
# http://127.0.0.1:5173/pages/prototype-05.html
node scripts/test-prototype-05.mjs
node scripts/render-prototype-05.mjs
```

Output: 960 × 540, 30 fps, 750 frames, H.264 CRF 18, yuv420p, 48 kHz stereo AAC at 320 kb/s. The six contact-sheet frames are decoded from the encoded MP4. One sample is aligned to the strongest detected transient between source seconds 143 and 147. Labels sit outside the video images.

The new checks cover state-boundary continuity, integrated trail progress, autonomous motion and audio influence in each regime, reordered-frame determinism and unchanged historical files. The established synchronization pipeline is reused without another basic synchronization test suite. Scene J and the full-track timeline are outside this milestone.

Completed: all 750 frames rendered, the MP4 and six-frame contact sheet were generated, and the focused checks passed with no browser errors. The transient sample is frame 481, source time 144.033 seconds, with normalized onset strength 0.840. The contact sheet was visually inspected for the source-inspired soft-field/hard-square relationship and distinct internal regimes. Protected A–H files and Prototype-04 outputs remain unchanged. Scene I has not been added to the multi-scene timeline.
