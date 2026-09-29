# Scene CW — Shadow Blocks

Eleventh new study for Segment 7. Slot 98/letter CV is Codex's completed scene; slot 100/letter CX is Codex's own work in progress (`sketch.js`/`states.js` only, targeting a different track window — left untouched, same situation as slot 96 earlier). Slot 99/letter CW was free between them. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250206 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference layers four things per cluster, generously overflowing the canvas edge: nested drop-shadowed squares shrinking from an outer radius, each independently either centred or jittered within the outer bound, each in black, white or one of five blue/purple/pink palette tones; a small local dot-grid of circles, some filled, some outlined, sharing one colour; five bezier streaks in independent colours crossing the cluster; and a coin-flip chance of one very long, thin bar (a fortieth of the canvas width or less) crossing the entire frame at a shallow angle.

## Independent construction

All four layers are the source's own relationships, kept exactly: the centred-or-jittered drop-shadowed square stack, the mixed filled/outlined dot-grid, the five independent-colour bezier streaks, and the coin-flip full-frame bar. Thirty-two clusters sit in a continuously drifting, wrapping field across the 960 × 540 frame (rather than the source's four-hundred-cluster one-shot scatter), each cluster's full recipe — square count and positions, dot-grid, streaks, and whether it carries a long bar — a pure function of the cluster and a local epoch number, re-rolled every 9–16 s and crossfaded at the boundary. The colour palette is newly authored (five blue/purple/pink tones matching the reference's mood), not the source's own hex values. Reference layout, draw order and source functions are not reused.

Motion:

- Each cluster spins slowly and independently, and breathes gently in scale.
- Drop-shadow depth and blur pulse with the music.
- A cluster's full recipe crossfades between an old and new random draw every 9–16 s.
- The whole field drifts slowly, wrapping at the frame edge.

## Audio response

- Bass: cluster scale breathing.
- Highs: cluster spin-rate boost.
- Impulse/onsets: drop-shadow depth/blur punch.
- Centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cluster responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-99/signal-lattice-99-scene-cw-25s.mp4`
- `renders/prototype-99/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-99/scene-cw.js`
- Preview `/pages/prototype-99.html`
- Render `node scripts/render-prototype-99.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cluster introductions (each entering cluster flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
