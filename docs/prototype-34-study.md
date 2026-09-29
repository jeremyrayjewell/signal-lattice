# Scene AJ — Ring Field

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20221114 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md). This source also has an independent interpretation by Codex, Scene AI "Prismatic Ringfields" at prototype-33; this is a separate, independently-built scene from the same source, not a duplicate of that work.

The screenshot is a dense field of colorful ring/donut shapes on black — each a flat-colored circle with a black hole punched through it, the hole's size varying independently per ring from a thin sliver to nearly the whole circle. Wispy thin white thread-like curves radiate vertically through scattered points in the field. A visible horizontal seam partway down the frame marks where the ring pattern's exact arrangement shifts, as if two independently-generated fields were stacked.

## Independent implementation

340 ring shapes (own filled-circle-plus-smaller-black-circle construction, with a per-ring radial gradient for a glossy, lit look rather than a flat fill) are placed by a genuine simulated depth (z) rather than a flat tiled grid: each ring's distance from a horizon band near the top of the frame controls its size, hole size and how far it spreads horizontally, converging toward the horizon and widening/enlarging toward the bottom — an own analytic-perspective construction, not the source's literal 3D WEBGL rotateX(45) camera. Each ring's own depth continuously cycles over time (wrapping back to the horizon once it passes the bottom), so the whole field reads as flying at speed through a tunnel of rings rather than sitting in a static tiled arrangement.

Two further own additions push the look well past a flat field: an **atmospheric depth fog** (saturation, lightness and opacity all scale with depth, so distant rings desaturate and dim into the black rather than staying uniformly bright/saturated regardless of distance), and a **motion-streak trail** behind every ring (a tapered, depth-faded gradient quad connecting each ring's current position back to its position a short distance behind it in depth, giving a genuine comet-tail/warp-speed look rather than discrete static-looking dots). About 40% of rings also carry a scattered wisp-thread burst (own bezier-curve construction, scaled and faded with distance, always rendered white/pale since the source's black-on-black wisp option would be invisible against its own black background too).

The backdrop itself is no longer flat black: a dark, glitchy static texture sits behind the ring tunnel — blocky corrupted cells and fine TV-static grain, reusing this project's established stepped-flicker technique (a per-cell hash keyed to a time-quantized clock, not a smooth tween, for a genuine glitch cadence — see Scene AA) rather than the source's own approach. Kept deliberately dark and low-contrast so the bright ring tunnel remains the clear focal point.

## Motion and music

- Autonomous: every ring continuously approaches from the horizon and grows before wrapping back into the distance (own independent depth-cycling rate/phase per ring), its hue continuously drifts, its tilt oscillates on two overlapping frequencies, and active wisp bursts reshuffle on their own stepped clock — a much stronger, structurally-driven motion than a flat field's parameter pulsing (confirmed by comparing frames seconds apart — the whole depth arrangement visibly reshuffles, not just color).
- Bass: ring size grows slightly and hole size shrinks (rings read as "closing up") with bass energy; overall approach speed increases with motion state.
- Highs: hue-drift speed increases; wisp flicker rate and brightness increase.
- Transient impulse: a brief size/hole/wisp-brightness flash across the field.
- Built with the project-wide `intro` element-introduction parameter from the start (every ring and its wisp burst fly in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-34/signal-lattice-34-scene-aj-25s.mp4
- Contact sheet: renders/prototype-34/contact-sheet.jpg
- Source: src/prototype-34/scene-aj.js
- Preview: /pages/prototype-34.html
- Render: node scripts/render-prototype-34.mjs

All previous scenes and renders remain unchanged. Scene AJ is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. Originally built and rendered as "Scene AF" at prototype-30 on 2026-09-25, before it was discovered that slot already held unrelated, unrecoverably-overwritten work by Codex (a different source, "Striped Dialogues"). Rebuilt unchanged at prototype-34 with a new, non-colliding scene letter (AJ) to avoid any further ambiguity with Codex's own lettering; the implementation, motion and audio mapping were initially identical to the original build.
2. Second pass: once both this scene and Codex's independent interpretation of the same source (Scene AI "Prismatic Ringfields" at prototype-33) existed side by side, the user pointed out this one read as a slight modification of Codex's rather than a genuinely distinct scene — both were a flat, uniformly-tiled dense grid of flat-colored rings on black, checked directly by comparing the two rendered contact sheets. Reworked the whole placement/rendering model: rings are now placed by simulated perspective depth (converging toward a horizon, enlarging toward the viewer) with continuously cycling depth per ring, rather than a static tiled grid, and each ring gets a radial-gradient glossy shading instead of a flat fill — leaning into the source's actual (but previously unused) 3D perspective-camera technique as the differentiator, rather than only tuning color/timing parameters. First attempt at the new layout was too sparse at the top of the frame (a narrow converging point rather than the source's full-width dense field); fixed by widening the horizontal spread at all depths and raising the ring count.
3. Third pass: the user asked to push the differentiation further still. Added atmospheric depth fog (color/opacity scale with simulated depth, so the field genuinely fades into the dark toward the horizon rather than staying uniformly saturated) and a motion-streak comet-tail behind every ring, giving the whole scene a "warp speed" quality with no equivalent in Codex's static, evenly-lit field. Re-verified with frames at different times showing clear streaking and depth-fade in every state.
4. Fourth pass: the user asked for the flat black background to become a glitchy, staticky abstraction. Added a dark blocky-static-plus-grain backdrop layer (reusing the project's established stepped-flicker glitch technique from Scene AA), gated behind the scene's existing `intro>=1` check so it doesn't break the element-introduction transition mechanic by painting an opaque layer over an outgoing scene mid-transition. Kept deliberately dark/low-contrast relative to the bright ring tunnel. Verified the glitch pattern visibly reshuffles between frames only half a second apart.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously color-shifting composition across the calm/active/extreme arc: a dense tiled field of rings with varying hole sizes, scattered wispy thread bursts, and a subtle compositional seam. No pipeline regression was found. Stopped for review.
