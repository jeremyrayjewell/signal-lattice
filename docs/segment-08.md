# Segment 8 — finale reprise (hybrids spanning segments 1, 2, 3, 4, 7)

Target: 07:00–08:15 of the real track (420–495s), 75 seconds, 960 × 540, 30 fps, H.264/AAC. The
final segment — 495s is the full track length, so this ends exactly at the track's end. Continues
straight on from segment 7's 06:00–07:00; segments 5 and 6 (04:00–06:00) were the standalone
same-segment mixing experiments and are unrelated to this curation.

**Not new scenes.** At the user's explicit request, this is a curated reprise: 12 hybrid scenes,
each mixing a pair of scenes sampled from across the whole project — segments 1, 2, 3, 4 and 7 —
using the same element-interweaving technique built for [segment 6](segment-06.md). I+CX bookends
the project's very first scene against its very last; the rest work inward from there, mixing
segments that never otherwise touch.

## The 12 pairs

| Pair    | Scene A                        | Scene B                                 | Mechanism note                                                                                    |
| ------- | ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| I + CX  | I "Chromatic Veils" (seg 1)    | CX "Gossamer Folds" (Codex, seg 7)      | Opening scene vs. closing scene — the whole project's bookends                                    |
| M + CT  | M "Mesh Forms" (seg 1)         | CT "Checker Drift" (Codex, seg 7)       | Mesh-outline forms merged with sliding checker-board tiles                                        |
| Q + CP  | Q "Ring Clusters" (seg 1)      | CP "Dot Counterpoint" (Codex, seg 7)    | Macro-grid ring clusters merged with bezier + disc groups                                         |
| U + CL  | U "Rune Glyphs" (seg 1)        | CL "Signal Junctions" (Codex, seg 7)    | Spinning rune-glyph cells merged with square-corner-arm nodes                                     |
| Y + CH  | Y "Chromatic Wedges" (seg 2)   | CH "Arc Assemblies" (Codex, seg 7)      | Y's whole wedge field (own blur/fringe compositing) kept as one background pass                   |
| AC + CD | AC "Color Plaid Grid" (seg 2)  | CD "Mondrian Plaid Grid" (Codex, seg 7) | Both are private half-size buffer scenes — each kept as one background pass                       |
| AG + BZ | AG "Notebook Pages" (seg 2)    | BZ "Ink Wash Noise" (seg 4)             | Sketchbook pages merged with ink blots + noise clouds                                             |
| AK + BV | AK "Bar-Comb Clusters" (seg 2) | BV "Diamond Kaleidoscope" (seg 4)       | AK's whole bar-comb field (private half-size buffer) kept as one background pass                  |
| AO + BR | AO "Contour Bands" (seg 2)     | BR "Wireframe Tangle" (seg 4)           | Contour-band panels merged with wireframe spheres + BR's own square-grid population               |
| AS + BN | AS "Spoke Wheels" (seg 3)      | BN "Spiral Dust" (seg 4)                | Radial-spoke wheel panels merged with wrapped-field cached spiral sprites                         |
| AW + BJ | AW "Glow Stamp Groups" (seg 2) | BJ "Bundle Streaks + Dither" (seg 4)    | Glow-stamp groups + spanning threads merged with streak bundles                                   |
| BA + BF | BA "Ribbon Windows" (seg 3)    | BF "Circle Mosaic" (seg 3)              | Both drifting-grid, per-cell buffer/cache scenes — interleave as two kinds of drifting-grid cells |

Five of the twelve pairs (CH, CL, CP, CT, CX) pull in a scene originally built by Codex during its
own parallel pass over segment 7; see [segment-07.md](segment-07.md) for that split.

## Mechanism

Same technique as segment 6: each hybrid extracts both sources' discrete populations using their
exact seeded `randomAt` formulas, tags every item with a `kind` and a pseudo-`depth`, merges both
arrays into one, sorts by depth every frame, and draws in one shared loop branching on `kind`. Where
a source's whole scene is itself a monolithic pass in the original — a private half-size composite
buffer, or a whole-frame blur/fringe/pattern post-process — that source is kept as its own
background or overlay pass rather than exploded into pool items (Y, AC, AK; and both halves of AC+CD
and BA+BF). No source function or exact random seed is shared between a pair — each hybrid ports
both sources' own recipe functions under distinct prefixed names so the two populations remain
independently seeded and never collide.

## Cut schedule (real track time)

| Pair    | Track entry | Segment frame | Transition |
| ------- | ----------: | ------------: | ---------- |
| I + CX  |     420.00s |             0 | —          |
| M + CT  |     429.03s |           271 | introduce  |
| Q + CP  |     431.23s |           337 | introduce  |
| U + CL  |     440.53s |           616 | introduce  |
| Y + CH  |     445.03s |           751 | introduce  |
| AC + CD |     450.53s |           916 | introduce  |
| AG + BZ |     457.00s |          1110 | introduce  |
| AK + BV |     464.93s |          1348 | introduce  |
| AO + BR |     470.90s |          1527 | introduce  |
| AS + BN |     476.27s |          1688 | cut        |
| AW + BJ |     482.50s |          1875 | introduce  |
| BA + BF |     488.77s |          2063 | cut        |

Cut points land on nearby real transients, same as every earlier segment; transitions mix
`introduce` (54 frames / 1.8s live-element fly-in) and instant `cut`, same 80/20 split as segments
6–7.

## Verification

`node scripts/render-segment-08.mjs` ran to completion: the existence guard for all twelve hybrid
modules passed, the out-of-order determinism check passed, all 2250 frames rendered, and
`renders/segment-08/signal-lattice-segment-08-75s.mp4` (75.0s) was produced. The contact sheet
(`renders/segment-08/contact-sheet.jpg`) confirms all twelve pairs cut cleanly and both halves of
every pair render correctly and interwoven, not layered.

Two seed-transcription errors were caught and fixed during construction (Q's seed was briefly
written as U's 60203 instead of its own 24107; M's seed was briefly written as Q's 24107 instead of
its own 60713) — both found by re-reading each source file fresh from disk immediately before
writing the next hybrid, rather than trusting recalled values, and fixed before the final render.
