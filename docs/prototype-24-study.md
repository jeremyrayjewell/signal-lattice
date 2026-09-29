# Scene Z — Ribbon Tangle

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20250731 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md).

The screenshot is a dense tangle of neon ribbon/rope-like scribbles on pure black — each ribbon tapers from a point, some coiling into tight spirals, others sweeping in loose open loops, others reduced to thin hairline traces, each shifting through a narrow band of adjacent hues along its own length but collectively spanning the full color wheel. Faint translucent colored rectangle patches sit behind the tangle, and a scatter of small black and white dot speckles sits on top.

## Independent implementation

42 ribbons, each an own parametric path: a smoothly wandering "spine" (a sum of two sine terms per axis, own frequency/phase/amplitude, continuously drifting over real track time) with a genuine geometric spiral offset traveling around that spine (own loop-count 2-16, radius, and phase — also drifting over time) — an independent construction, not the source's Perlin-noise position walk with a purely size-pulsing dab chain. About 40% of ribbons are "bold" (fewer loops, thicker, larger coil radius); the rest are thinner, tighter-looping hairline traces, matching the reference's mix of scales. Width and coil radius both taper linearly from each ribbon's start (own formula, same taper concept as the source's `k = j / mxj`). Each ribbon is built as a single tapered polygon strip (not per-dab circles, for both performance and a cleaner continuous-ribbon read) filled with a gradient shifting through a narrow hue band along its length. Behind the ribbons, 16 translucent colored rectangles pulse gently with bass; in front, 240 small black/white dot speckles twinkle independently.

## Motion and music

- Autonomous: every ribbon's spine and coil continuously drift/rotate over real track time, so the whole tangle visibly flows and reshapes itself rather than sitting static (confirmed by comparing calm/active/extreme frames — genuinely different ribbon shapes throughout).
- Bass: ribbon width and background-rectangle brightness pulse.
- Mids: coil radius breathes slightly.
- Highs: ribbon opacity brightens; dot speckles twinkle faster.
- Transient impulse: a brief width/brightness flash across ribbons and speckles.
- A slowly traveling subset of ribbons (the per-id sine "selected" technique used throughout this project) reads slightly brighter.
- Built with the project-wide `intro` element-introduction parameter from the start (ribbons, rectangles and dot speckles each fly in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-24/signal-lattice-24-scene-z-25s.mp4
- Contact sheet: renders/prototype-24/contact-sheet.jpg
- Source: src/prototype-24/scene-z.js
- Preview: /pages/prototype-24.html
- Render: node scripts/render-prototype-24.mjs

All previous scenes and renders remain unchanged. Scene Z is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. First pass: the ribbon coil path (STEPS=64) looked slightly jagged/polygonal at the higher loop-counts (up to 16 coils over only 64 points is coarse), rather than smoothly curved. Fixed by raising STEPS to 110. No other issues found — the geometric spine-plus-spiral construction, taper, translucent rectangles and dot-speckle layer matched the reference well on the first attempt, unlike the more iterative scenes earlier in this batch.
2. Second pass: the user asked for more movement and dynamism — the spine-drift and coil-rotation speeds were tuned conservatively enough that shape changes were only clearly visible over several seconds. Fixed by roughly quintupling the spine-drift speed range, increasing coil-rotation speed, and speeding up the dot-twinkle and background-rectangle pulse rates. Verified with two captures only one second apart (frames 60 and 90) showing clearly different ribbon shapes, where the previous version would have shown only a subtle shift.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously-evolving composition across the calm/active/extreme arc: a dense tangle of coiling and loosely-looping neon ribbons at varying scale, translucent color patches, and twinkling black/white speckles on black. No pipeline regression was found. Stopped for review.
