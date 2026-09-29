# Scene AL — Squircle Vortex

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20260831 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is dozens of swirling, nested rounded-square ("squircle") contours on black, each a stack of concentric outlines that progressively rotate, drift and squash as they shrink from full size down to a point, creating a hypnotic spiral/vortex look, scattered among sparse flat-colored accent squares.

## Independent implementation

58 swirl instances are scattered freely across (and beyond) the canvas at one of four quarter-turn rotations. Each is a stack of 40 nested squircle (rounded-rectangle) outlines: as each contour shrinks toward the center, it progressively rotates and drifts sideways (an own independently-authored curve, not the source's exact scale/shift/rotate mapping) and squashes along its width using its own power-curve aspect ratio (rather than the source's literal `scale(scl,1)` transform), creating the same swirling/twisting portal look through different math. Each swirl mostly strokes in one main hue from an own 16-hue-plus-white palette, with a per-ring chance of breaking into a different accent hue. A sparse grid of flat-colored accent squares (roughly one in nine cells active, slowly reshuffling which cells are on and what color over time) sits behind/among the swirls.

## Motion and music

- Autonomous: every swirl continuously spins at its own independent rate/direction, its twist/drift phase gently breathes, and the accent-square grid slowly reshuffles which cells are lit and what color on a staggered per-cell clock, so the whole composition is visibly alive without audio (confirmed by comparing calm vs. extreme frames — clearly different swirl angles and accent-square patterns throughout).
- Bass: swirl scale pulses (a "breathing vortex" look).
- Highs: ring stroke brightness increases.
- Transient impulse: a brief scale/brightness flash across swirls and accent squares.
- Built with the project-wide `intro` element-introduction parameter from the start (every swirl and every active accent square fly in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-36/signal-lattice-36-scene-al-25s.mp4
- Contact sheet: renders/prototype-36/contact-sheet.jpg
- Source: src/prototype-36/scene-al.js
- Preview: /pages/prototype-36.html
- Render: node scripts/render-prototype-36.mjs

All previous scenes and renders remain unchanged. Scene AL is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

None — the nested-squircle-vortex construction (own rotation/drift/squash curve per ring) and the sparse reshuffling accent-square grid matched the reference well on the first rendered attempt, and continuous motion (swirl spin, breathing, accent reshuffle) was designed in from the start per this batch's established lesson.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously-spinning composition across the calm/active/extreme arc: dense swirling squircle vortices in a broad neon palette, scattered among reshuffling flat-color accent squares. No pipeline regression was found. Stopped for review.
