# Segment 5 — permanent scene-pair mixing experiment

Target: 04:00–05:00 of the real track (240–300s), 60 seconds, 960 × 540, 30 fps, H.264/AAC.

**This segment intentionally breaks the standing no-repeat-visuals-across-segments rule, at the user's explicit request, as a one-off experiment.** It does not change that rule for segment 6 onward, which should go back to wholly new scenes as before.

**Revision note:** an earlier version of this segment (and this document) implemented a different idea — cutting between individual scenes drawn from segments 1 and 2, interleaved so the cuts didn't run in two back-to-back blocks. That was a misreading of the brief. The actual request, clarified by the user afterward: pair the _k_-th scene of segment 1 with the _k_-th scene of segment 2 — the 1st scene of segment 1 (I) with the 1st scene of segment 2 (which is literally `prototype-21`, Scene W), the 2nd (J) with the 2nd (`prototype-22`, Scene X), and so on — and draw each pair's two scenes _together_, permanently overlapping for the whole slot, not as a sequence of cuts between whole scenes. This document and the render were redone accordingly.

## How two scenes share one frame without erasing each other

Every scene in this project gates its own full-canvas clear behind `if (intro >= 1)`, checked with strict equality against 1. `src/segment-05/manager.js` uses that gate directly: for each pair, the **primary** scene (the segment-1 half) is drawn with ordinary `intro` semantics — 1 once settled, the transition mix while flying in — so it establishes the background as usual. The **secondary** scene (the segment-2 half) is always drawn with `intro` capped at `0.999`. `introFor`'s easing is already visually complete well before literal 1 (every element reaches roughly 99.8% of its settled position regardless of its own per-element delay), but the strict `>=1` gate never fires, so the secondary scene's background call never clears what the primary scene drew. The same `Math.min(intro, 0.999)` formula covers both cases — flying in during a transition, and staying permanently settled afterward — so no scene file needed to change.

Transitions between pairs use the project's usual live-element `introduce` mechanism, just applied to a pair instead of a single scene: the outgoing pair (both halves already fully settled) keeps drawing normally, while the incoming pair's _own_ elements — both its primary and secondary scene's elements — fly in together on top.

## Construction

`scripts/render-segment-05.mjs` builds 14 pairs (I+W, J+X, K+Y, L+Z, M+AA, N+AB, O+AC, P+AD, Q+AE, R+AF, S+AG, T+AH, U+AI, V+AJ) — all 14 of segment 1's scenes, matched against the first 14 of segment 2's 20 (AK–AP are unused in this experiment). Cut timing follows the same convention as every other segment: real onset/transient positions near evenly-spaced targets, a 2.2s minimum gap, and transitions that are 80% live-element `introduce` (54 frames) and 20% instant `cut`. The transition-type shuffle uses `Math.random()`, acceptable here since this is a one-off build script rather than a deterministic scene module.

`src/segment-05/` holds a dedicated manager and sketch (mirroring the structure Codex used for segment 4's own manager), reading `assets/analysis/segment-05-timeline.json`.

## Actual cut schedule (real track time)

| Pair |    Time | Frame | Transition |
| ---- | ------: | ----: | ---------- |
| I+W  | 240.00s |     0 | —          |
| J+X  | 243.03s |    91 | introduce  |
| K+Y  | 250.53s |   316 | introduce  |
| L+Z  | 252.73s |   382 | cut        |
| M+AA | 259.03s |   571 | introduce  |
| N+AB | 262.53s |   676 | introduce  |
| O+AC | 265.03s |   751 | introduce  |
| P+AD | 269.03s |   871 | cut        |
| Q+AE | 272.53s |   976 | introduce  |
| R+AF | 279.03s |  1171 | introduce  |
| S+AG | 282.53s |  1276 | introduce  |
| T+AH | 288.53s |  1456 | introduce  |
| U+AI | 291.03s |  1531 | introduce  |
| V+AJ | 297.03s |  1711 | introduce  |

## Verification

Before committing to the full render, individual frames were previewed directly in a browser: a settled pair (I+W) showed both scenes' elements genuinely co-existing (Scene I's pastel overlapping shapes visible behind Scene W's bold black-and-white patterns and dashed coloured line strip), confirming the compositing mechanism works as designed rather than one scene silently winning. A second pair (J+X) at two different points in its clip showed the same composite consistently.

Out-of-order determinism check passed before the frame loop began. All 1800 frames rendered (exit code 0). `renders/segment-05/signal-lattice-segment-05-60s.mp4` is 60.0s. Ten frames sampled across the encoded video, one from each pair's clip, all show both halves of that pair's elements genuinely present at once, with clearly distinct character from pair to pair — no corruption, and no pair reading as though one scene had silently won.
