# Scene AK — Comb Collage

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20221125 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a dense, all-over paper-cut-out collage on white: clusters of thick, chunky color bars stacked in a comb/fan formation with an alternating offset/tilt between bars, layered among "bullseye" concentric-ring circles and small square accents, every shape carrying a soft drop shadow for a lifted-paper depth.

## Independent implementation

88 bar-comb clusters are scattered freely across (and beyond) the canvas, each an own stack of 3-9 bars alternately tilted one way or the other (own alternating-rotation construction, not the source's exact shearX/shearY sequence), in an own five-color warm palette (teal, cream, gold, burnt orange, crimson). Each cluster is paired with either a bullseye (own concentric-ring construction, 5-7 rings) or a small cross accent (own four-square-plus construction, each arm independently filled or stroked-outline) at its own nearby offset. Depth comes from a single shared `shadowBlur`/`shadowOffset` setting applied to every shape (a standard, non-distinctive canvas technique), not the source's exact shadow parameters.

## Motion and music

- Autonomous: every comb continuously rotates at its own independent rate/direction, every bullseye ring pulses on its own phase (a "breathing target" look), and every cross accent slowly rotates, so the whole collage stays visibly alive without audio (confirmed by comparing calm vs. extreme frames — clearly different bar angles and ring proportions throughout).
- Bass: bar length grows; ring/cross pulse amplitude increases.
- Highs/transient: brightness flashes across combs; ring and cross size/brightness briefly flash on transients.
- A per-cluster delay offset keyed to horizontal position sends transients rippling gently across the field.
- Built with the project-wide `intro` element-introduction parameter from the start (every comb and its paired accent fly in together via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-35/signal-lattice-35-scene-ak-25s.mp4
- Contact sheet: renders/prototype-35/contact-sheet.jpg
- Source: src/prototype-35/scene-ak.js
- Preview: /pages/prototype-35.html
- Render: node scripts/render-prototype-35.mjs

All previous scenes and renders remain unchanged. Scene AK is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. Originally built and rendered as "Scene AG" at prototype-31 on 2026-09-25, before it was discovered that slot already held unrelated, unrecoverably-overwritten work by Codex (a different source, "Notebook Storm"). Rebuilt unchanged at prototype-35 with a new, non-colliding scene letter (AK) to avoid any further ambiguity with Codex's own lettering; the implementation, motion and audio mapping are identical to the original build. No content changes were needed — the bar-comb-plus-bullseye/cross construction matched the reference well on the first rendered attempt at prototype-31, and re-rendering at prototype-35 reproduced an identical result.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously-rotating and pulsing composition across the calm/active/extreme arc: dense drop-shadowed bar combs, breathing bullseye rings, and rotating cross accents in the own teal/cream/gold/orange/crimson palette. No pipeline regression was found. Stopped for review.
