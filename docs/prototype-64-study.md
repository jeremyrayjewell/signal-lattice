# Scene BN — Spiral Dust

Twenty-fourth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251022 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a pure grayscale field of overlapping "fingerprint" textures on white: each is a ring of tiny squares spiralling inward over many turns, shrinking to nothing at the centre, with noise-perturbed radial and angular jitter giving each spiral its own wobbling, hand-drawn character. Squares are either filled or outlined, in a single grayscale tone per spiral, no colour anywhere. Dozens of these overlap into a dense textured field.

## Independent construction

A spiral instance is fully deterministic once seeded — a shrinking ring of squares spiralling inward exactly as in the source — so each one is rendered once per epoch into a private cached canvas rather than every frame, the same architecture used for the ring target in [Scene BK](prototype-61-study.md). Two hundred instances drift across a wrapped field slightly larger than the 960 × 540 frame, each with its own seeded life cycle of 6–11 s: radius, square size, jitter, fill/stroke choice and tone are all re-rolled at each epoch.

The cached sprite is built at roughly a third of its final linear size and scaled up at draw time — the same half-resolution-buffer technique already used for backgrounds in earlier scenes, applied here for a different reason: a first version cached each spiral at full size, and even with a warm cache, two hundred instances each drawing a large rotated sprite in software rendering (this project renders headless with GPU compositing disabled) took several hundred milliseconds per frame. Reducing the cached resolution cut that by roughly an order of magnitude with no visible loss of detail, since the spiral texture is already fine and slightly soft in the source.

Motion:

- Every spiral rotates continuously, alternating direction by instance, and breathes gently in scale.
- The whole field drifts across the wrapped area.
- At an epoch change the old spiral fades out while a new one fades in.

Reference layout and the spiral's shape logic (shrinking radius, shrinking square size, per-vertex noise jitter) are kept because they define the picture's structure, but no source functions, constants or literal randomness sequences are reused. No colour is introduced anywhere, matching the source's strict grayscale palette.

## Audio response

- Bass: spiral breathing pulse.
- Mids: rotation rate.
- Highs: sprite alpha.
- Onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each spiral responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-64/signal-lattice-64-scene-bn-25s.mp4`
- `renders/prototype-64/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-64/scene-bn.js`
- Preview `/pages/prototype-64.html`
- Render `node scripts/render-prototype-64.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
