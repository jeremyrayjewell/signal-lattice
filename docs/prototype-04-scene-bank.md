# Prototype-04 — eight families and continuous scene states

75 seconds, 960 × 540, 30 fps, H.264 with the real 48 kHz stereo track excerpt. Source interval: **128.000–203.000 seconds (02:08.000–03:23.000)** of the source track.

Prototype-03 and Scene Bank 1 remain unchanged. State-aware A–D modules live in `src/prototype-04/scenes/`, alongside E–H. They retain the prior visual grammar while exposing the new controls. The existing full-track analysis and its timestamp sampler are reused; no new audio analysis, structure detector or full-track timeline was built.

## New families

**E — Convergent Filaments.** Seven sweeping bundles of continuous curves, with five fine filaments per bundle. The paths turn through explicit moving knots; convergence, divergence and intersections form the main composition. Unfilled paths, a small number of bundles and widely spaced knots distinguish it from B's broad, segmented ribbons.

**F — Cellular Territories.** Seven large, irregular neighboring regions are computed using convex half-plane clipping around moving seeds. Broad gaps, a single inset boundary and a small seed marker keep the image legible. The territories push against their neighbors as seeds move; this version maintains seven regions and does not claim splitting/merging topology.

**G — Opposed Fans.** Two offscreen origins send nine long tapered rays each into the frame. Angular openings, opposed directions and moving ray ends create a directional structure, with no orbital rings. Sparse accent strokes are secondary to the wedges.

**H — Fractured Monument.** One large diamond-shaped form is divided into eight triangular plates. Plates separate along their own outward directions, rotate slightly and carry offset registration contours; musical disturbances decay back toward the assembled form. It uses coherent geometric disassembly rather than pixel noise, scanlines or generic digital glitches.

## Continuous state interface

Every family accepts the same six parameters, interpreted by its own drawing logic. Scene clips specify `stateFrom` and `stateTo`; each numeric parameter follows smoothstep interpolation over the clip. Stable calm/extreme appearances are supported by using the same state at both endpoints. During a scene transition, outgoing and incoming geometry use their own continuously evaluated parameters.

| Parameter   | Calm | Active | Extreme | Meaning                                                                      |
| ----------- | ---: | -----: | ------: | ---------------------------------------------------------------------------- |
| motion      | 0.35 |   0.80 |    1.35 | Autonomous displacement amplitude; phase still follows absolute time.        |
| deformation | 0.30 |   0.80 |    1.45 | Curvature, angular disorder, territorial movement or fragment separation.    |
| spread      | 0.82 |   1.00 |    1.15 | Family-specific void width, band width, radius, slab height or fan aperture. |
| detail      | 0.25 |   0.70 |    1.00 | Secondary articulation and high-frequency residue strength.                  |
| impulse     | 0.25 |   1.00 |    1.90 | Gain on the existing decaying transient envelope.                            |
| response    | 0.50 |   1.00 |    1.35 | Gain on timestamp-sampled immediate and smoothed audio controls.             |

The interface exposes all six values to every family; families consume the values relevant to their geometry rather than forcing an identical motion model. E, F and H emphasize deformation and detail over the general spread control. `motion` controls amplitude rather than multiplying absolute time, avoiding phase jumps as states interpolate. All six musical features remain available through `ctx.at(delay)`, along with transient and high-frequency memory. The existing attack/release constants are unchanged.

Family-specific interpretation:

- **A:** state changes widen or narrow channels, increase their bending and cell articulation, and alter internal rung activity.
- **B:** state changes curve depth, autonomous displacement, band thickness and cross-rung articulation.
- **C:** state changes orbital radius and layer separation, cluster displacement, and the prominence of the two smaller clusters. Calm leaves the satellites subdued; extreme expands the orbit structure and gives stronger local impulses.
- **D:** state changes pier height, leaning, vertical displacement and small edge accents.
- **E:** state changes path curvature, knot drift, bundle spacing, line articulation and impulse displacement.
- **F:** state changes seed movement and inset boundary articulation while retaining seven macro territories.
- **G:** state changes fan aperture, ray reach variation, angular motion and wedge thickness.
- **H:** state changes plate separation, rotational displacement, registration offsets and transient fracture strength.

## E–H feature mappings

| Feature              | E: filaments                          | F: territories                                      | G: fans                    | H: fracture                                     |
| -------------------- | ------------------------------------- | --------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| RMS                  | Main-strand line weight               | Region fill extent                                  | Subtle ray reach           | Base plate separation                           |
| Bass, smoothed       | Knot displacement and broad curvature | Horizontal boundary pressure from seed displacement | Ray reach                  | Internal cut-line displacement                  |
| Mids                 | Secondary tangent curvature           | Vertical seed movement                              | Wedge angular thickness    | Per-plate angular disturbance                   |
| Highs / residue      | Moving knot marker size               | Fine inset-boundary displacement                    | Fading ray-end accents     | Fading misregistration outlines                 |
| Transients, decaying | Knot displacement                     | Seed-marker disturbance                             | Phase-offset angular waves | Outward plate separation, with staggered delays |
| Centroid, smoothed   | Fine line-weight bias                 | Inset-boundary line weight                          | Accent-line weight         | Registration-contour weight                     |

Delayed feature lookup differs among bundles, territories, fan origins and plates. Autonomous motion remains present when music response is disabled. Neither states nor audio require rendering earlier frames first.

## Structural handoff

**E → F** is a 72-frame / 2.4-second geometric transition:

1. E's control points and endpoints retract toward its seven actual knot positions.
2. Those exact knot positions become F's region seeds. No unrelated layout is substituted during the handoff.
3. Territory polygons unfold geometrically from each seed to their clipped boundary; no alpha fade or screen wipe is used for this transition.
4. After unfolding, the inherited layout settles continuously toward F's autonomous layout over four seconds.

Both layouts continue using absolute track time, including during overlap. Other scene changes retain the established 42-frame / 1.4-second crossfade or soft sweep. The new manager reuses Prototype-03's pure `stateAt` scheduling function and two-buffer architecture; scene drawing, state interpolation and transition compositing remain separate modules.

## Authored timeline

The excerpt was selected from the existing full-track cache by mean RMS, variation of five-second RMS averages, and slow bass/mid/high variation. Scene order and regimes are authored; nearby detected onsets adjust approximate cut points by no more than half a second. This is a 75-second study, not the final full-track arrangement.

Times below are relative to the excerpt; overlaps begin at each incoming clip's start.

|    Start | Family                    | State path       | Incoming transition       |
| -------: | ------------------------- | ---------------- | ------------------------- |
|  0.000 s | A — Lattice Banks         | Calm             | —                         |
|  7.067 s | E — Convergent Filaments  | Calm → Active    | Sweep                     |
| 15.067 s | F — Cellular Territories  | Active → Extreme | Structural handoff from E |
| 23.067 s | G — Opposed Fans          | Active → Extreme | Crossfade                 |
| 30.033 s | C — Orbital Constellation | Calm             | Crossfade                 |
| 37.033 s | B — Ribbon Currents       | Active → Extreme | Sweep                     |
| 44.067 s | H — Fractured Monument    | Extreme → Active | Crossfade                 |
| 52.033 s | D — Stepped Piers         | Active → Calm    | Crossfade                 |
| 58.800 s | A — Lattice Banks         | Extreme return   | Sweep                     |
| 66.567 s | C — Orbital Constellation | Extreme return   | Crossfade                 |
| 75.000 s | End                       |                  |                           |

The contact sheet follows this order, with labels outside the video frames. It contains all eight families and both calm/extreme appearances of A and C. Frames are extracted from the exact encoded MP4, not separately drawn substitutes.

## Run and outputs

```powershell
python scripts/prepare-prototype-04.py
npm run dev
# http://127.0.0.1:5173/pages/prototype-04.html
node scripts/test-prototype-04.mjs
node scripts/render-prototype-04.mjs
```

- `renders/prototype-04/signal-lattice-04-75s.mp4`
- `renders/prototype-04/contact-sheet.jpg`
- `assets/analysis/prototype-04-timeline.json`
- `renders/prototype-04/render-report.json`
- Main additions: `src/prototype-04/states.js`, `scene-manager.js`, `shared.js`, `sketch.js`, and eight scene modules.

Checks are focused on the new work: state interpolation continuity, full territorial coverage, visibly distinct calm/active/extreme renders for each family, repeatable structural geometry, and unchanged historical files. Basic synchronization testing is not repeated; the accepted source-trim, fixed-frame and FFmpeg mux pipeline is reused. Pillow is used only to label and assemble the contact sheet.

Completed: all 2,250 frames rendered and the MP4/contact sheet were produced successfully. All eight families passed the three-regime image comparison; state interpolation and territorial coverage checks passed; the structural handoff reproduced identically after out-of-order rendering. No browser errors were reported, and all protected Prototype-03 files matched their original hashes. The final ten-frame contact sheet was inspected: E–H have distinct macro structures, and both A and C show clearly different calm/extreme appearances. No further visual revision was made after this successful render.

## Reuse limitations

Any family can recur at any clip position with its own start/end state; animation and musical memory are sampled from track time. There is no scene-order restriction for ordinary crossfades or sweeps.

The structural adapter currently supports **E → F only**. Other geometric handoffs need their own layout adapter; other pairs can already use existing transitions. F's inherited seed layout is used only when its incoming transition explicitly requests this adapter. Internal regimes currently interpolate between two clip endpoints, rather than an arbitrary list of internal keyframes; multiple adjacent same-family clips can extend that vocabulary later. The state-aware A–D copies preserve history but must be maintained alongside the frozen originals. These limitations do not prevent arbitrary later scene reuse.

The contact-sheet label font is currently a Windows font path. Browser rendering and the video pipeline retain their existing cross-platform browser override; the labeling utility would need a font-path change on another OS. No full-track timeline or rendering has been started.
