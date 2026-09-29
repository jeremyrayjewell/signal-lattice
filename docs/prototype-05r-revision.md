# Chromatic Veils — source-grammar revision

Revised Scene-I-only study: **02:08.000–02:33.000**, 25 seconds, 960 × 540, 30 fps, H.264 with the same synchronized real stereo excerpt. The first Scene I render remains available for comparison. A–H and all multi-scene timelines are unchanged.

## What changed

- **Field count:** 18 major fields rather than 12. Four broad foundation fans and fourteen crossing fields span radii of approximately 310–750 pixels before deformation. Several originate beyond the image edges, so calm is already occupied by overlapping color. The count stays fixed; states change coverage continuously rather than popping fields into existence.
- **Geometry:** independently constructed polar fan boundaries replace the earlier bowed panes. Each fan combines two sharp radial edges with a deformed curved perimeter. Selected fans also have a straight chord cut. Seven faint curved ribs follow each fan's own geometry. These are large sectors, not a dense collection of tiny instances.
- **Overlap:** stronger persistent color in the outer portions of fields; three multiply-composited smoky fields; localized screen-composited light inside selected fans. This creates darker intermediate colors and luminous regions together, rather than equally legible pastel cards. The palette remains broad, with restrained local centroid bias.
- **Square trails:** three coherent curved chains replace six scattered trajectory families. Each chain has 30 square marks with a shared hue, occasional white/dark accents, smooth size variation, and continuously warped spacing. Squares follow their path tangents loosely. No continuous path line is drawn. Highs affect both size and spacing; transient disturbances remain localized along a path.
- **States:** calm is layered but more open; active increases angular coverage, curvature, color interaction and trail articulation; extreme deepens smoky pockets, opens the fans further and strengthens local disturbances. Base scale rises only 6% from calm to extreme, so extreme is not simply magnification.

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

The existing smooth schedule remains: calm through 5 seconds, active reached at 11 seconds, extreme reached at 20 seconds, then held through the end. Trail speed remains analytically integrated to avoid state-change jumps.

## Music and provenance

RMS affects overlap opacity; bass displaces fields and changes sector extent; mids deform curved boundaries and local orientation; highs articulate square size and spacing; transient memory disturbs individual fields and localized trail segments; centroid subtly biases local hue. Existing precomputed smoothing and decay are reused.

The source is still OP-3010898, by E.C.H., with the observed **CC BY-NC-SA** label and no visible version number. The original visual evidence and source-exposure record remain in [source-references.md](source-references.md). This revision independently develops the documented visual grammar; no reference code or exact arrangement is copied.

## Outputs

- `renders/prototype-05r/signal-lattice-05r-scene-i-25s.mp4`
- `renders/prototype-05r/contact-sheet.jpg` — six frames from that exact MP4, including source time 144.033 seconds at a detected transient.
- `renders/prototype-05r/render-report.json`
- `src/prototype-05r/scene-i.js` and `states.js`

```powershell
npm run dev
# http://127.0.0.1:5173/pages/prototype-05r.html
node scripts/test-prototype-05r.mjs
node scripts/render-prototype-05r.mjs
```

The accepted audio trim and video encoding pipeline are reused. Focused checks cover state continuity, integrated trail progress, autonomous motion/audio influence, deterministic frame access and preservation of earlier files. No new scene or full-track arrangement is introduced.

Completed: all 750 frames rendered successfully, with no browser errors. The six-frame sheet was extracted from the encoded MP4 and inspected: calm now has continuous colored coverage, fan boundaries and dark overlap pockets read at half-size, and the three square chains are visibly curved. Historical file hashes remained unchanged. The revision is stopped for review.
