# Scene BS — Water Ripples

Twenty-ninth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250810 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a soft radial vignette (white centre fading to black at the corners) overlaid with a fine dot-grid halftone, each dot sampling the vignette's tone under it and lifted with a subtle drop shadow. Eighty scattered clusters of concentric rings, overlay-blended, sit on top in black or white. Requested by name: the result should genuinely read as water drop ripples.

## Independent construction

The vignette is a single radial gradient (white centre, black edge) rather than the source's two hundred stepped concentric fills, and the dot grid's tone at each point is the same continuous function evaluated analytically rather than sampled pixel-by-pixel from the rendered canvas, matching the visual result more cheaply. Each dot carries a native drop shadow, as in the source.

To genuinely read as water drop ripples (the user's explicit request), the ring clusters are not static concentric snapshots as in the source; each one is a true animation. A drop has several rings in flight at once, staggered in phase: each ring's radius grows continuously from zero out to the drop's reach and its opacity fades as it travels outward, exactly like a real ripple dissipating, then that ring slot starts over as a fresh ring at the centre. Each ring also wobbles slightly on an independent noise path rather than tracing a perfect circle, since real water ripples are never perfectly round. A first version placed drops uniformly across the frame and kept ring opacity fixed regardless of distance travelled; it read as abstract scribbled circles rather than ripples. Clustering most drops loosely around a handful of hotspots (so ripples pool and overlap densely in a few places, as in the reference) and making opacity fall off sharply with distance travelled were the two changes that made it unmistakably read as water.

Each drop has its own seeded life cycle (8–14 s) governing where it sits and how far it reaches; within that, the animated rings run continuously and are not tied to the epoch's crossfade. Nothing is stateful: the ring animation and the epoch's position/reach are both pure functions of time and a hash, so any frame renders alone and out of order.

Reference layout and the overlay-blended ring-cluster structure are kept because they define the picture's identity, but no source functions, constants or literal randomness sequences are reused, and the rings' motion is an original addition beyond the source's static rendering.

## Audio response

- Bass: ripple reach.
- Highs: ring wobble and dot-grid crispness (via centroid on ring weight).
- Centroid: ring line weight.
- RMS/impulse/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each drop responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-69/signal-lattice-69-scene-bs-25s.mp4`
- `renders/prototype-69/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-69/scene-bs.js`
- Preview `/pages/prototype-69.html`
- Render `node scripts/render-prototype-69.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
