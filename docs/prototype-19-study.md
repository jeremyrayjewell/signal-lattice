# Scene U — Broken Rune

## Reference analysis, 2026-09-24

E.C.H. / Eiichi Ishii, dailycoding - 20260410 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a loosely brick-offset grid of bold, stroke-only black glyphs on white — no fill anywhere in the main composition. Each glyph combines two broken-circle arcs, a small ring/knob, a thin triangle, a curved swoosh, and a few straight accent lines, with per-cell rotation, mirroring, and optional extra outer arcs or a second small ring.

## Independent implementation

Scene U tiles a 10x6 grid of 96px cells across the 960x540 frame on off-white. Each row carries its own fixed horizontal offset (a brick-like jitter, not a strict rectangular lattice), and each cell independently fixes a 90-degree rotation, mirror, optional extra 0.75 scale-down with an additional free rotation, and which optional extras (a second outer arc pair, a second small ring) it carries — all seeded once. The glyph itself is built from an independently written function (its own arc/bezier/line coordinates, not the source's vertex list) producing the same general recipe: two broken-circle arcs, a ring, a thin triangle, a bezier swoosh, and accent lines, entirely stroked with no fill, matching the source's pure monochrome character.

## Motion and music

- Autonomous: each glyph spins continuously at its own independent speed and direction (not a subtle wobble), scaled by the piece's motion envelope; cells with the extra small-scale/rotation variant spin their inner rotation independently as well.
- A small delay offset keyed to each cell's grid position (`(col+row) * 0.016s`, reused from the earlier grid scenes) sends transients rippling diagonally across the grid.
- Bass: glyph radius pulses very slightly.
- Mids: spin speed increases.
- Highs: the inner spin (on cells with the extra small-scale variant) speeds up.
- RMS: overall stroke opacity modest boost.
- Transient impulse: brief per-glyph stroke-weight/opacity flash, riding the ripple delay.
- A slowly traveling subset of glyphs (the per-id sine "selected" technique used throughout Scenes N-U) reads with a touch more weight and opacity.

No color is introduced anywhere — motion and audio-reactivity are expressed entirely through stroke weight, opacity and rotation, to stay faithful to the source's strict black-on-white monochrome.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation/detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-19/signal-lattice-19-scene-u-25s.mp4
- Contact sheet: renders/prototype-19/contact-sheet.jpg
- Source: src/prototype-19/scene-u.js
- Preview: /pages/prototype-19.html
- Render: node scripts/render-prototype-19.mjs

All previous scenes and renders remain unchanged. Scene U is not added to the full-track timeline; this is a standalone study.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet was extracted from the final MP4 and a full-resolution frame was checked directly against the reference screenshot: the broken-circle arcs, ring/knob accents, triangle, swoosh and accent lines, row jitter and per-cell rotation/mirror variety all read correctly, entirely monochrome as in the source. No pipeline regression was found. Stopped for review.
