# Scene CM — Noise Threads

Sixth new study for Segment 7. Slot 88/letter CL (Codex's Scene CL, "Signal Junctions") exists on disk; earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251218 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference tiles a gold/yellow base with a grid of small cells, each independently filled with a random tone from a five-colour gold palette, then lays a grid of clusters over it. Each cluster is a single colour — chosen once as either a solitary grey value or a palette tone — traced by a thousand tiny overlapping circles walking two independent slow noise paths (one for x, one for y), reading as a thick wiggly ribbon rather than a scatter. Densely packed and overlapping, the ribbons read as a tangled web sitting over the quilted gold ground.

## Independent construction

The quilted background keeps the source's own grid-of-random-tone-cells relationship, but each cell now cycles to a fresh random tone every 5–10 s (its own colour smoothly interpolated, not just re-picked) rather than being fixed for the whole piece, so the ground stays alive rather than static. Each ribbon's thousand overlapping filled circles are replaced by three overlapping continuous strokes — round-capped, round-joined, smoothed through consecutive midpoints, each its own independent two-noise-walk path at a slightly different amplitude and seed — traced at high enough noise-frequency relative to the ribbon's own footprint that the path loops back over itself repeatedly rather than just sweeping across it once; visually equivalent to the source's dense overlapping-circle build-up at a fraction of the draw cost, the same substitution this project makes wherever a source builds a shape from very many overlapping small circles along a path (e.g. Scene BN's spiral dust, Scene BZ's ink blots). A first pass used one strand at the source's own literal noise-step rate and read as a sparse angular zigzag rather than a tangled scribble-ball; raising the noise-walk's frequency relative to the ribbon's bounding box (so the path completes many loops within it, not just a handful of wide swings) and layering three such strands per ribbon were the two changes that made it read as a proper tangle. Forty-eight ribbons sit in a continuously drifting, wrapping field across the 960 × 540 frame (rather than the source's fixed 3-pass shared-row-offset grid) so their overlap and density vary continuously instead of repeating on a rigid lattice. Each ribbon's paths, radius and colour are a pure function of the ribbon and a local epoch number, re-rolled every 7–14 s and crossfaded at the boundary; a ribbon's own spin rate is fixed for its whole lifetime. The colour palette is newly authored (five gold/yellow tones), not the source's own values. Reference layout, draw order and source functions are not reused.

Motion:

- Each ribbon spins slowly and independently.
- A ribbon's path, radius and colour crossfade between an old and new random draw every 7–14 s.
- The whole ribbon field drifts slowly, wrapping at the frame edge.
- Background cells continuously cycle between random tones.

## Audio response

- Bass: ribbon scale breathing.
- Highs: ribbon spin-rate boost.
- Impulse/onsets: ribbon stroke-weight punch.
- Centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each ribbon responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-89/signal-lattice-89-scene-cm-25s.mp4`
- `renders/prototype-89/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-89/scene-cm.js`
- Preview `/pages/prototype-89.html`
- Render `node scripts/render-prototype-89.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-ribbon introductions (each entering ribbon flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
