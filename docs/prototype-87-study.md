# Scene CK — Cube Rosary

Fifth new study for Segment 7. Slot 86/letter CJ (Codex's Scene CJ, "Coil Registers") exists on disk; earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251217 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference is a soft radial vignette (white centre fading to near-black edges, drawn as two hundred stepped concentric fills) filled with five hundred scattered stacks of nested hexagon "cubes" — a flat-topped hexagon with three internal face-diagonals from alternating vertices to its centre, giving an isometric-cube illusion, in black-fill/white-stroke or the reverse. Each stack is two, four or eight of these shrinking evenly from an outer radius, each ring independently mirrored vertically and independently jittered in rotation.

## Independent construction

The vignette is a single radial gradient (white centre, near-black edge) rather than the source's two hundred stepped concentric fills, matching the visual result more cheaply — the same substitution used for Scene BS's vignette. Stacks are placed across the full 960 × 540 frame in a continuously drifting, wrapping field (70 of them) rather than confined to one dense disc in the middle, to fit this project's usual full-frame treatment. Each stack's outer radius, ring count (2/4/8) and every ring's own rotation jitter, flip rate and flip phase are a pure function of the stack and a local epoch number, re-rolled every 8–14 s and crossfaded at the boundary.

Each ring's flip is a genuine continuous animation rather than the source's one-shot random mirror: a smooth cosine carries the ring through face-on, edge-on (briefly a sliver), mirrored face-on, and back, and the fill/stroke colours swap exactly at the edge-on moment — the source's static fifty-fifty fill/mirror choice, turned into motion. The hexagon-with-three-internal-diagonals cube illusion itself is the source's own relationship, kept exactly. Reference layout, draw order and source functions are not reused.

Motion:

- Each ring flips continuously and independently, swapping black/white at each edge-on pass.
- Each stack spins slowly and independently.
- A stack's geometry crossfades between an old and new random draw every 8–14 s.
- The whole field drifts slowly, wrapping at the frame edge.
- The vignette itself breathes gently.

## Audio response

- Bass: stack scale breathing and vignette breathing.
- Highs: stack rotation-rate boost.
- Impulse/onsets: ring rotation-jitter punch.
- RMS/residue/centroid are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each stack responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-87/signal-lattice-87-scene-ck-25s.mp4`
- `renders/prototype-87/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-87/scene-ck.js`
- Preview `/pages/prototype-87.html`
- Render `node scripts/render-prototype-87.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-stack introductions (each entering stack flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
