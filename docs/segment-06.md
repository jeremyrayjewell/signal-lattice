# Segment 6 — element-interwoven scene-pair hybrids (segments 3 × 4)

Target: 05:00–06:00 of the real track (300–360s), 60 seconds, 960 × 540, 30 fps, H.264/AAC.

**This segment intentionally breaks the standing no-repeat-visuals-across-segments rule, at the user's explicit request, as a one-off experiment**, continuing the same idea as [Segment 5](segment-05.md) but for the next pair of segments. It does not change that rule for any future segment, which should go back to wholly new scenes unless told otherwise.

Each of the 20 clips is **one hybrid scene** pairing the _k_-th scene of segment 3 with the _k_-th scene of segment 4: AQ+BK, AR+BL, AS+BM, AT+BN, AU+BO, AV+BP, AW+BQ, AX+BR, AY+BS, AZ+BT, BA+BU, BB+BV, BC+BW, BD+BX, BE+BY, BF+BZ, BG+CA, BH+CB, BI+CC, BJ+CD. Segments 3 and 4 both have exactly 20 scenes, so every one of the 40 is used, none left over.

## Mechanism (corrected)

Segment 6 originally reused segment 5's "intro-capped" trick — the secondary scene of each pair drawn with `intro` capped at `0.999` so its own background-clear (gated behind strict `intro >= 1`) never fires, letting it sit permanently on top of the primary scene. That produces two whole scenes stacked and cut between, not a genuine hybrid: each source's population stays visually intact and segregated in its own depth layer.

The corrected mechanism, per the user's explicit direction ("elements interwoven within one shared population"), instead builds **one new hybrid scene module per pair** in `src/hybrids-3x4/`, each reimplementing both sources' actual discrete populations (reusing each source's exact seeded `randomAt` formulas, so results are bit-identical to what each source would produce standalone) and merging them into one array:

1. Extract every discrete, individually-positioned population from both sources (particles, cells, clusters, bundles, etc.), tagging each item with a `kind` and a pseudo-`depth` — `(seededRandom - .5) * 240 + wobbleAmplitude * Math.sin(t * rate + phase)`.
2. Merge **all** tagged items from both sources into one pool array.
3. `pool.sort((a, b) => a.depth - b.depth)` every frame — because the wobble terms are time-varying, the sort order itself continuously drifts, so which source's element renders in front changes over time rather than one source's whole population sitting permanently on top.
4. Iterate the sorted pool in a single shared loop, branching on `kind` to call the right per-item draw logic. Items that need a non-default blend mode (`difference`, `overlay`, `hard-light`) set and restore it themselves around their own draw call, so they mix correctly with neighbours in the pool regardless of draw order.

Batch/monolithic content that can't be meaningfully split into individually-orderable draws — WebGL-accumulated mesh layers (AQ's `smoothSolids()`), cached blur/posterize private buffers (BK's ring target, BD/BF/BH/BX's composited buffers), procedural backgrounds (star fields, wallpapers, textured grounds) — is kept as its own background/batch pass, drawn structurally before or alongside the interwoven population rather than order-interleaved with it. Two pairs (BD+BX) push this further: since both sources deliver their _entire_ visual as a single pre-built whole-frame buffer revealed through clipped patches, the hybrid decomposes each source's own patch population (BD's 760 block/frame stamps, BX's 84 grid tiles) into interleavable pool items that each cut their patch from their own source's buffer — so even two purely buffer-based scenes end up genuinely mixed at the patch level.

Each of the 20 hybrid files was verified individually: a Node import check (catching syntax/reference errors) and a headless-browser render of one frame (catching runtime/console errors), both clean across all 20.

## Construction

`src/segment-06/manager.js` now imports all 20 hybrid modules from `src/hybrids-3x4/` directly (as `HYBRIDS`, keyed `'AQ+BK'` … `'BJ+CD'`) and draws exactly one hybrid per clip, at the clip's own `intro` value during a transition — the outgoing hybrid keeps drawing fully, the incoming hybrid draws its own elements at their staggered entry positions on top, without clearing what's there (the transition mechanics are otherwise unchanged from segment 5/the original segment 6).

`scripts/render-segment-06.mjs` checks that all 20 hybrid files exist on disk before touching any assets (replacing the old check for all 40 raw scene files, since the hybrids themselves import those). Cut timing is unchanged: real onset/transient positions near evenly-spaced targets, a 2.2s minimum gap, and transitions that are 80% live-element `introduce` (54 frames) and 20% instant `cut`. The timeline's `clips[].scene` field replaces the old `{primary, secondary}` pair.

## Verification

Before the full render, each of the 20 hybrid modules was previewed individually in a headless browser (one frame each) — all clean, no `pageerror`/console errors. The AQ+BK hybrid was additionally spot-checked visually across several frames: Scene BK's confetti and occlusion bars and Scene AQ's beads/boxes were confirmed genuinely mixed within the same depth-sorted pass, rather than one sitting on an unbroken layer on top of the other.

Out-of-order determinism check passed before the frame loop began. All 1800 frames rendered (exit code 0). `renders/segment-06/signal-lattice-segment-06-60s.mp4` is 60.0s.
