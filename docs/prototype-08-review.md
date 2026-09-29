# Prototype 08 — revised scene bank and assembled sample

90-second review sample, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000–03:38.000** of the source track. Full-track analysis remains assets/analysis/prototype-02.json. Every layer samples actual track time: 128 + frame / 30. No full-song render was attempted.

## Revised A–H

| Family                  | Geometry and diversity revision                                                                  | Motion and musical behavior                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A Lattice Banks         | Mixed open brackets, arcs, diamonds and crossbars; unequal nesting depth around two wide voids   | Stronger independent rotations, vertical/lateral offsets; bass bends moving voids, mids twist motifs, highs articulate crossbars          |
| B Ribbon Currents       | Unequal stream widths, changing internal lanes, perforations and staggered rungs                 | Faster large waves, opposing local undulation, sliding details; bass changes broad bending, mids width, highs rung activity               |
| C Orbital Constellation | Elliptical broken arcs, differentiated ticks and circular/rectangular satellites at three scales | Independent orbital speeds and tilt, moving centers; bass separates radii, mids angular offsets, high residue satellite/tick articulation |
| D Stepped Piers         | Unequal modular towers with 3–5 sliding tiers, apertures and detached caps                       | Larger skyline changes, independent lean and tier motion; bass height, mids shear, transients displacement                                |
| E Convergent Filaments  | Unequal bundles, branching trajectories, changing convergence and strand spacing                 | Faster moving knots and reversing bows; bass curvature, mids bend shape, highs knot accents, transient disturbances                       |
| F Cellular Territories  | Shared moving boundaries, differently nested and sheared internal polygons, edge markers         | Larger seed excursions and traveling boundary marks; bass/mids move neighboring territories, residue articulates boundaries               |
| G Opposed Fans          | Broken ray segments, branching marks and moving opposed origins                                  | Larger directional sweeps and unequal extending rays; bass length, mids width, transients angular impulses                                |
| H Fractured Monument    | Eight parent plates containing unequal sets of offset inset shards and registration contours     | Larger separation and twist, independent internal slipping; onsets fracture, mids twist, bass line displacement                           |

The new modules are under src/prototype-08/scenes/. Original A–H and all previous studies are retained. I uses prototype-05r, J uses prototype-06r, and K uses prototype-07r without changes to those files.

## States and music

A–H retain continuously interpolated calm/active/extreme parameters, with higher autonomous baselines:

| State   | motion | deformation | spread | detail | impulse | response |
| ------- | -----: | ----------: | -----: | -----: | ------: | -------: |
| Calm    |    .75 |         .65 |    .86 |     .5 |      .5 |      .75 |
| Active  |    1.1 |         1.1 |      1 |     .8 |     1.1 |        1 |
| Extreme |   1.55 |         1.5 |    1.1 |      1 |    1.65 |     1.15 |

Audio is sampled with existing local delays, smoothing and decay. No frame-integrated state or random runtime sampling was introduced. I–K use adapters mapping authored state progress onto their established state curves, while their animation clock and feature lookup remain absolute track time. Scene-local state progress does not seek or restart the music.

## Sequence and transitions

Authored order: **A → E → F → G → C → K → I → B → J → H → D → A**. Changes are snapped to strong cached onsets within 0.65 seconds of the authored target, roughly 7.5 seconds apart. This is an authored review timeline, not a claim of automatic musical section detection. The final A returns in extreme-to-active state rather than the initial calm-to-active regime.

Every change has a three-second overlap. Both outgoing and incoming scenes continue animating and responding to the track throughout ordinary blends. Crossfades mix full layers; sweeps use a broad soft lateral front; curved spatial blends mix the layers at different rates across the frame. These are overlap transitions, not hard cuts.

The E→F structural handoff uses actual filament knot positions as the territory seeds. Filaments retract into those knots while polygons unfold, then inherited seeds settle toward the territory family's own moving layout. This is the existing structural adapter extended to the richer revised geometry. It remains specific to E→F; other pairs use layer blending rather than a claimed general shape morph.

Encoded midpoint inspection exposed a sparse gap in the inherited collapse/unfold timing. The revised timing keeps both geometries at half extent at midpoint, eliminating that gap. All 90 affected frames were replaced before the final encode; the remainder of the animation was retained.

Exact start frames, states, onset strengths and transitions: assets/analysis/prototype-08-timeline.json. Source modules are isolated from the timeline and can be reused. The variant field is reserved; distinct returns currently come from absolute time and state, not variant-specific layouts.

## Outputs and reproduction

- renders/prototype-08/signal-lattice-08-90s.mp4
- renders/prototype-08/contact-sheet.jpg (one frame per appearance, including both A states)
- renders/prototype-08/transition-sheet.jpg (one encoded midpoint per transition mechanism)
- renders/prototype-08/render-report.json
- Browser: /pages/prototype-08.html
- Preparation: python scripts/prepare-prototype-08.py
- Rendering: node scripts/render-prototype-08.mjs

The accepted render/audio pipeline is reused. New checks cover all eleven families' state distinctions, autonomous movement and audio response, plus deterministic structural handoff and historical source hashes. No basic synchronization test suite is rerun unless a regression appears.

This is a review sample. The early scenes retain their restrained palette, while I–K have intentionally different palette structures. Long overlaps demonstrate that contrast; whether the resulting dark-to-light shifts suit the final song remains a creative review decision.

During rendering, a preview-text edit triggered Vite hot reload and interrupted capture. The offline server now disables watching and HMR. The run resumed after 1,537 saved frames, checking that the last saved frame matched a fresh capture exactly before continuing. Geometry, timing and audio were unchanged. Use `node scripts/render-prototype-08.mjs --resume` only with unchanged render inputs; its boundary check is not a complete source manifest comparison.

Completed: 2,700 frames encoded with real audio. All eleven families passed state, audio-response and autonomous-motion checks; structural replay was deterministic and previous source hashes remained unchanged. No browser errors in the completed run. The twelve-frame scene contact sheet and four-frame transition sheet were extracted from the encoded MP4 and inspected. No remaining rendering blocker was found.
