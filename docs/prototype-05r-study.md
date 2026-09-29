# Scene I — Chromatic Veils

Source study **OP-3010898**, artwork `20260917` / `dailycoding - 20260917 / graphic`, E.C.H. (Eiichi Ishii), @u277028.

The exact license label visible in the supplied page screenshot is **CC BY-NC-SA**. No version number is visible. Visual evidence and license evidence were supplied by the user after direct page access was blocked. The visual analysis and license label were recorded before implementation in [source-references.md](source-references.md).

## Visual analysis and reinterpretation

The reference's distinctive grammar combines a dense multicolor ground of overlapping translucent fan-like fields with sharply opaque square marks following curved trajectories. Soft interiors meet straight cut boundaries. Bright openings, smoky dark pockets and variable scales create an asymmetric, almost full-frame patchwork. Saturated blue, cyan, green, orange, yellow, pink and violet coexist with light and dark square marks. A lower-left red seal identifies the artist. No animation was visually observed; the supplied evidence is a still image.

Chromatic Veils independently reinterprets the relationship between soft color fields and crisp square trails, using a light ground and a broad hue range rather than the house palette used elsewhere in this project.

## Implementation

An earlier pass (kept only for reference, not wired into any render pipeline) used twelve bowed panes on a fixed layout. This version replaces those with **18 major fields**: four broad foundation fans and fourteen crossing fields spanning radii of roughly 310–750 pixels before deformation, several originating beyond the image edges so calm is already occupied by overlapping color. Each fan combines two sharp radial edges with a deformed curved perimeter; selected fans also have a straight chord cut, with seven faint curved ribs following each fan's own geometry — large sectors, not a dense field of tiny instances. Stronger persistent color sits in the outer portions of fields; three multiply-composited smoky fields and localized screen-composited light inside selected fans create darker intermediate colors and luminous regions together.

Three coherent curved square-trail chains replace an earlier scattered arrangement, each with 30 marks sharing a hue, occasional white/dark accents, smooth size variation and continuously warped spacing. Squares follow their path tangents loosely; no continuous path line is drawn.

None of this reproduces the reference's actual generator: no dashed Bézier routine, source function, palette array, or exact composition is copied or executed. Source code was supplied in conversation and seen, but never saved into the repository — implementation follows only the recorded visual grammar.

## State values

| Parameter  | Calm | Active | Extreme |
| ---------- | ---: | -----: | ------: |
| curvature  |  .35 |    .80 |    1.30 |
| overlap    |  .46 |    .62 |     .78 |
| drift      |  .22 |    .65 |    1.00 |
| saturation |  .90 |   1.00 |    1.00 |
| trailSpeed |  .24 |    .48 |     .78 |
| detail     |  .45 |    .75 |    1.00 |
| impulse    |  .40 |   1.00 |    1.80 |
| scale      | 1.00 |   1.03 |    1.06 |
| depth      |  .25 |    .60 |    1.00 |
| aperture   | 1.00 |   1.10 |    1.22 |

Base scale rises only 6% from calm to extreme, so extreme is not simply magnification — coverage, curvature and local disturbance carry the intensity. Regime schedule: calm through 5 seconds, active reached at 11 seconds, extreme reached at 20 seconds and held through 25. `trailSpeed` is analytically integrated to avoid phase jumps as regimes change.

## Music mapping

RMS affects overlap opacity; bass displaces fields and changes sector extent; mids deform curved boundaries and local orientation; highs articulate square size and spacing; transient memory disturbs individual fields and localized trail segments; centroid subtly biases local hue. Scene time is `128 + frame / 30`; each element samples timestamped cached features with a small position-dependent delay. Autonomous structural motion continues with all musical controls disabled.

## Artifacts and reproduction

- Video: `renders/prototype-05r/signal-lattice-05r-scene-i-25s.mp4`
- Contact sheet: `renders/prototype-05r/contact-sheet.jpg`
- Source provenance: `docs/source-references.md`
- Scene: `src/prototype-05r/scene-i.js`
- State curves: `src/prototype-05r/states.js`

```powershell
npm run dev
# http://127.0.0.1:5173/pages/prototype-05r.html
node scripts/render-prototype-05r.mjs
```

Output: 960 × 540, 30 fps, 750 frames, H.264 CRF 18, yuv420p, 48 kHz stereo AAC at 320 kb/s, source interval 02:08.000–02:33.000. All 750 frames render without browser errors; deterministic out-of-order replay, autonomous motion and audio-response checks pass. The contact sheet shows continuous colored coverage in calm, fan boundaries and dark overlap pockets reading at half-size, and the three square chains visibly curved.
