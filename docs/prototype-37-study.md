# Scene AM — Planet Weave

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20260612 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a field of circular "planet" patches on black, each filled with a mottled two-color brick/weave texture, layered over a fine background grid of thin, randomly-colored crosshatch lines. Patches are larger and denser toward the center of the frame, smaller and more scattered toward the edges.

## Independent implementation

26 circular brick-texture tiles are pre-rendered once (160x160 offscreen canvases, cached and reused), each a two-color mottled pattern from an own sum-of-sines pseudo-noise threshold (own coherent-blob construction, not the source's Perlin `noise()` calls), clipped to a circle, with occasional per-cell 90°-rotation for texture variety. 184 patch instances (130 on a 13x10 jittered grid in a normal-blend pass, 54 more on a coarser 9x6 jittered grid in a second `overlay`-blended pass, echoing the source's own two-pass structure) are spread evenly across the whole canvas, each with its own independently-randomized size — not concentrated toward the center. A background grid of 220 independently-colored, independently-opacity'd lines (own placement, not the source's exact per-line draw sequence) sits beneath.

## Motion and music

- Autonomous: every patch continuously rotates at its own independent rate/direction, and every background line's opacity gently breathes on its own phase, so the composition stays visibly alive without audio (confirmed by comparing calm vs. extreme frames — clearly different patch rotations and scattered-element positions throughout).
- Bass: patch size pulses.
- Highs: patch opacity and line brightness increase.
- Transient impulse: a brief size/brightness flash across patches and lines.
- A per-patch delay offset keyed to horizontal position sends transients rippling gently across the field.
- Built with the project-wide `intro` element-introduction parameter from the start (every patch and line flies in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-37/signal-lattice-37-scene-am-25s.mp4
- Contact sheet: renders/prototype-37/contact-sheet.jpg
- Source: src/prototype-37/scene-am.js
- Preview: /pages/prototype-37.html
- Render: node scripts/render-prototype-37.mjs

All previous scenes and renders remain unchanged. Scene AM is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. First pass placed patches via `sqrt(random)*radius` polar sampling from the canvas center (a uniform-density-over-a-disk technique, matching what the source's own position formula actually does) combined with a size falloff that shrunk patches with distance from center. The user pointed out the result still read as concentrated in the middle rather than spread out equidistantly — correct: even though the _position_ sampling was uniform-density, making central patches much larger than edge patches (up to ~6x) meant they visually dominated and overlapped far more in the middle, while edge patches shrank to near-invisible specks. Fixed by replacing the polar placement with two independent jittered grids (13x10 for the blend pass, 9x6 for the overlay pass) spanning the whole canvas evenly, and decoupling size from position entirely (each patch now gets its own independently-randomized size). A first attempt at the new spread read as too densely packed edge-to-edge with little black showing through; trimmed the size range down so individual patches stay distinguishable. Re-rendered and confirmed even coverage with no center concentration in every state.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously-rotating composition across the calm/active/extreme arc: mottled brick-textured planet patches spread evenly across the whole frame, over a colored line grid. No pipeline regression was found. Stopped for review.
