# Scene BM — Crystal Shards

Twenty-third new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251010 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a dense black field of translucent, jagged crystalline shard shapes in a muted earth-and-teal palette, overlapping into a stained-glass-like mass. A grid of black and white circles of varying size sits behind and among the shards, overlay-blended. A handful of soft, blurred white and black streaks cross the frame. Reading the source closely matters here: the shard shapes come from a triangle strip whose vertices all sit near one shared radius with heavy jitter — it never fills to a centre point, so the result is a jagged crenellated ring of triangles, not a smooth radiating star. That distinction is what gives the shapes their broken-glass, faceted character rather than reading as simple bursts.

## Independent construction

Ninety-five shards drift across a wrapped field slightly larger than the 960 × 540 frame. Each shard is a ring of ten to a hundred vertices (in steps of ten, as in the source) near a shared radius, jittered by up to half that radius, each vertex carrying its own colour from the source's eight-colour palette. Consecutive vertex triples are filled as triangles with the average of their three vertex colours, approximating the source's per-vertex Gouraud shading in plain Canvas2D. Each shard has its own seeded life cycle of 5–10 s, and every "epoch" is a pure function of the shard and epoch number: vertex count, jitter, colours and alpha. Nothing is stateful, so any frame renders alone and out of order.

A 54 px grid (a tenth of the frame height) holds one to sixteen black or white dots per cell, overlay-blended, each cell re-rolling on its own schedule with a crossfade between epochs.

The blurred streak layer needs a global blur, so — the same technique used for the ring target in [Scene BK](prototype-61-study.md) — thirty bezier curves are drawn into a private buffer once per epoch (8–12 s), blurred and lightly posterized there, then the finished buffer is drawn each frame in normal blend. Because the curves leave large transparent gaps of their own, unlike the opaque checkerboard in [Scene BL](prototype-62-study.md), the whole layer is safely introduced as a single flying element without hiding the outgoing scene during a transition.

Motion:

- Every shard spins continuously and drifts across the wrapped field, with a slight seeded breathing pulse.
- Grid dots crossfade between epochs on their own schedule.
- At a shard's epoch change the old ring fades out while a new one fades in.

Reference layout, draw order and blend modes are kept because they define the picture's structure, but no source functions, constants or literal randomness sequences are reused. Shards and grid cells are each introduced individually (`introFor`).

## Audio response

- Bass: shard breathing pulse.
- Mids: shard spin rate.
- Onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each shard responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-63/signal-lattice-63-scene-bm-25s.mp4`
- `renders/prototype-63/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-63/scene-bm.js`
- Preview `/pages/prototype-63.html`
- Render `node scripts/render-prototype-63.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
