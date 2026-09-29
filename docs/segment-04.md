# Segment 4 assembly

Target: 03:00?04:00 of the real track, 60 seconds, 960 ? 540, 30 fps, H.264/AAC.

Status: rendered. prototype-78 / Scene CB ("Splinter Burst", dailycoding 20250628) was supplied 2026-09-28, filling the gap this document previously described. `node scripts/render-segment-04.mjs` then ran to completion: the existence guard for all twenty scenes passed, the out-of-order determinism check passed, all 1800 frames rendered, and `renders/segment-04/signal-lattice-segment-04-60s.mp4` (60.0s) was produced. Spot-checked frames around several transitions render correctly at full resolution; one frame's downsampled thumbnail preview looked like it might show transparency but full-resolution inspection (and a raw-pixel check confirming plain RGB, no alpha channel) showed it was Scene BL's own intentional #c8c8c8/#ffffff checkerboard background, not a bug.

The segment has its own HTML, manager, timeline and real audio excerpt; earlier segment timelines are untouched. All planned transitions use the established live-element introduction (54 frames / 1.8 seconds), with both scenes continuing to animate. Scene entry times are selected from nearby real transients. The recently revised #74 and #79 modules are imported directly.

| Scene | Track entry | Segment frame |
| ----- | ----------: | ------------: |
| BK    |    180.000s |             0 |
| BL    |    183.033s |            91 |
| BM    |    185.767s |           173 |
| BN    |    188.867s |           266 |
| BO    |    192.567s |           377 |
| BP    |    195.567s |           467 |
| BQ    |    197.767s |           533 |
| BR    |    200.567s |           617 |
| BS    |    204.567s |           737 |
| BT    |    206.767s |           803 |
| BU    |    210.067s |           902 |
| BV    |    213.567s |          1007 |
| BW    |    216.067s |          1082 |
| BX    |    219.567s |          1187 |
| BY    |    222.033s |          1261 |
| BZ    |    225.300s |          1359 |
| CA    |    227.533s |          1426 |
| CB    |    230.967s |          1529 |
| CC    |    234.533s |          1636 |
| CD    |    237.033s |          1711 |
