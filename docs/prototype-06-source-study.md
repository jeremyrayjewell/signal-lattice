# Scene J — Neon Faultlines

Source: **OP-3013816**, https://openprocessing.org/@u277028/3013816, `dailycoding - 20260920 / graphic`, E.C.H. (Eiichi Ishii). The supplied page screenshot displays **CC BY-NC-SA**, without a version number. The creator-wide license instruction is recorded in [source-references.md](source-references.md); no repeated license questions are needed for subsequent works by this creator.

## Visual evidence and independent implementation

The supplied still shows laterally flowing, sharply faceted neon material on black. Pointed folds and changing strip width create the main forms. Magenta, cyan, yellow and orange intersections reach white; purple and wine-colored material recedes. Uneven black corridors separate groups. Axis-aligned square interruptions and accents sit over and between the bands. No motion was visually observed from the supplied still.

This independent scene uses **eight broad articulated streams**, each defined by eleven moving knots. Each span has four explicit polygonal facets around an offset internal point. There is no source-code triangle-strip routine, random placement of many instances, reference palette array, or copied subdivision function. Overlapping facets use additive light; a separate sparse square layer selectively interrupts the moving geometry. The artist seal is omitted, and the layout is original and adapted to 16:9.

The streams remain the macro structure. Squares are tested against the stream geometry at a low-density set of positions, with occasional isolated color accents in black space. The prototype has stronger scale separation and fewer major structures than the source screenshot. It is not a reimplementation of the supplied code or a traced composition.

## Music and states

| Feature                | Mapping                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| RMS                    | Local stream width and additive crossing intensity.                        |
| Smoothed bass          | Broad separation of stream centers, with alternating phase across streams. |
| Smoothed mids          | Fold height and angular articulation.                                      |
| Immediate highs        | Square-interruption size.                                                  |
| High-frequency residue | Fading secondary square accents at selected positions.                     |
| Transient memory       | Phase-offset displacement of knots, briefly dislocating the streams.       |
| Smoothed centroid      | Restrained hue bias within each stream's neon hue family.                  |

Lookup delays vary along and between streams. The existing precomputed audio memory is unchanged. Autonomous folds, widths, drift and local accent opacity evolve with explicit source time, including with music influence disabled. The camera stays fixed.

| Used state parameter | Calm | Active | Extreme |
| -------------------- | ---: | -----: | ------: |
| fold                 |  .45 |    .85 |    1.25 |
| width                |  .75 |   1.00 |    1.10 |
| drift                |  .35 |    .70 |    1.00 |
| intensity            |  .65 |    .85 |    1.00 |
| mosaic               |  .35 |    .70 |    1.00 |
| impulse              |  .40 |   1.00 |    1.65 |

The standalone study uses smooth calm → active → extreme interpolation: calm through 5 seconds, active reached at 11 seconds, extreme reached at 20 seconds and held to the end. It uses the same **02:08.000–02:33.000** source interval as Scene I for direct musical comparison. Track time remains `128 + frame / 30`.

## Deliverables

- `renders/prototype-06/signal-lattice-06-scene-j-25s.mp4`
- `renders/prototype-06/contact-sheet.jpg` — six images decoded from that MP4.
- `renders/prototype-06/study.json` — interval and representative frame IDs.
- `renders/prototype-06/render-report.json` — focused scene checks and historical-file preservation.
- `src/prototype-06/scene-j.js`, `states.js`, `sketch.js`.

```powershell
npm run dev
# http://127.0.0.1:5173/pages/prototype-06.html
node scripts/test-prototype-06.mjs
node scripts/render-prototype-06.mjs
```

Format: 25 seconds, 960 × 540, 30 fps, H.264 CRF 18 / yuv420p, real 48 kHz stereo audio encoded as AAC 320 kb/s. The accepted audio trim and rendering pipeline are reused. Earlier scenes remain unchanged. Scene J is a standalone study and is not added to a multi-scene or full-track timeline.

Completed: 750 frames rendered successfully, with no browser errors. Calm, active and extreme retain autonomous motion and audio influence, and reordered-frame access reproduced the same image. The six-frame sheet was extracted from the final MP4 and inspected for angular macro forms, black corridors, luminous intersections and square interruptions. Protected earlier files remain unchanged. This first study intentionally has fewer, more orderly streams than the source's dense irregular overlap; it is ready for review rather than a claim of an exact match.
