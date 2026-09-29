# Scene J — Neon Faultlines

Source: **OP-3013816**, https://openprocessing.org/@u277028/3013816, `dailycoding - 20260920 / graphic`, E.C.H. (Eiichi Ishii). The supplied page screenshot displays **CC BY-NC-SA**, without a version number. The creator-wide license instruction is recorded in [source-references.md](source-references.md).

## Visual evidence and implementation

The supplied still shows laterally flowing, sharply faceted neon material on black. Pointed folds and changing strip width create the main forms. Magenta, cyan, yellow and orange intersections reach white; purple and wine-colored material recedes. Uneven black corridors separate groups. Axis-aligned square interruptions and accents sit over and between the bands. No motion was visually observed from the supplied still.

An earlier pass (kept only for reference, not wired into any render pipeline) used eight evenly spaced, continuous zigzag streams, which read as an orderly ribbon pattern rather than the reference's irregular, densely intersecting fragments. This version uses **26 independently articulated spans** instead, mixing substantial fragments with finer splinters. Lengths range from 350 to 1,100 pixels, with variable endpoints and cropping. Unequal knot spacing, asymmetric upper/lower widths, tapered ends and independent fold phases remove the shared zigzag rhythm; different diagonal facet splits and occasional local hue changes create angular patches rather than uniform-width ribbons. Bright groups cluster asymmetrically across the upper, middle and lower frame; additive intersections create white-hot regions while dark purple and wine-colored facets recede.

Square modulation is concentrated on the moving material through a soft geometric membership test, with continuous membership weights avoiding abrupt tile switches at band edges; a small number of larger accents appear in the black regions. There is no source-code triangle-strip routine, random placement of many instances, reference palette array, or copied subdivision function — the artist seal is omitted and the layout is original, adapted to 16:9.

## State values

| Used state parameter | Calm | Active | Extreme |
| --------------------- | ---: | -----: | ------: |
| fold                  |  .45 |    .85 |    1.25 |
| width                 |  .95 |   1.00 |    1.10 |
| drift                 |  .35 |    .70 |    1.00 |
| intensity             |  .65 |    .85 |    1.00 |
| mosaic                |  .55 |    .70 |    1.00 |
| impulse               |  .40 |   1.00 |    1.65 |

Calm starts with more occupied material and greater square activity than the first pass. Smooth calm → active → extreme interpolation: calm through 5 seconds, active reached at 11 seconds, extreme reached at 20 seconds and held to the end. Track time is `128 + frame / 30`.

## Music mapping

RMS affects local stream width and additive crossing intensity; smoothed bass broadly separates stream centers with alternating phase across streams; smoothed mids affect fold height and angular articulation; immediate highs affect square-interruption size; high-frequency residue fades secondary square accents at selected positions; transient memory phase-offsets and briefly dislocates knots; smoothed centroid restrains a hue bias within each stream's neon hue family. Lookup delays vary along and between streams. Autonomous folds, widths, drift and local accent opacity evolve with explicit source time, including with music influence disabled.

## Artifacts and reproduction

- Video: `renders/prototype-06r/signal-lattice-06r-scene-j-25s.mp4`
- Contact sheet: `renders/prototype-06r/contact-sheet.jpg`
- Scene: `src/prototype-06r/scene-j.js`

```powershell
npm run dev
# http://127.0.0.1:5173/pages/prototype-06r.html
node scripts/render-prototype-06r.mjs
```

Output: 960 × 540, 30 fps, 750 frames, H.264 CRF 18 / yuv420p, real 48 kHz stereo audio as AAC 320 kb/s, source interval 02:08.000–02:33.000. All 750 frames render without browser errors; deterministic out-of-order replay and audio-response checks pass.
