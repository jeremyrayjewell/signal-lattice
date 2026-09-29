# Scene BJ — Radiant Streaks

Twentieth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251029 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a hundred bundles of near-parallel, slightly jittered bezier streaks, each bundle rotated to a random angle and offset near the frame's centre, in a five-colour palette; some bundles are colourful, some are grayscale. The bundles overlap into a dense radiating mass on white. A very fine grid of random black/white cells at random alpha, blended overlay, glazes the whole thing with a dither-like texture. Dense radiating colour streaks under a fine dither glaze is the defining relationship.

## Independent construction

A hundred bundles, each twenty-seven near-parallel bezier streaks about the height of the frame, are drawn centred near the middle of the 960 × 540 frame, each bundle at its own seeded rotation and offset, in the source's five-colour palette, with about half the bundles grayscale. Each streak keeps its own jitter and colour pick so that later crossfades blend line by line rather than as a flat dissolve.

Each bundle has its own seeded life cycle of 4–8 s, and every "epoch" is a pure function of the bundle and epoch number: rotation, offset, colour mode and every streak's jitter and colour. Nothing is stateful, so any frame renders alone and out of order.

Background texture (added by request): a pale, embossed diamond-weave tile, 36 px, repeated as a `CanvasPattern` behind everything else — the kind of subtle bevelled "tile.gif" background common on late-90s homepages. It scrolls slowly and diagonally, is drawn with hard pixel edges (no antialiasing) to keep the flat, un-dithered look of an indexed-colour GIF, and is introduced as its own large element like the dither overlay below.

The fine dither overlay is built at a fraction of frame resolution (192 × 108) and scaled up with hard pixel edges, reproducing the source's very fine random-alpha grid far more cheaply than drawing thousands of individual cells would allow; it flickers on a stepped, time-quantized cadence rather than being redrawn as literal per-pixel randomness every frame.

Motion:

- Every bundle spins continuously and its streaks flutter at individual phases.
- Streak reach swells gently.
- At an epoch change the old bundle's position, rotation and colours fade and glide into the new ones.
- The dither overlay flickers on its own cadence, independent of the bundles.

Reference layout, draw order and blend modes are kept because they define the picture's structure, but no source functions, constants or literal randomness sequences are reused. Every bundle is introduced individually (`introFor`), and the dither overlay is introduced as its own large element, flying in from an offset, undersized start.

## Audio response

- Bass: streak reach.
- Highs: streak flutter, bundle spin rate and dither brightness.
- Mids: background tile scroll speed.
- Centroid: streak weight.
- RMS/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each bundle responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-60/signal-lattice-60-scene-bj-25s.mp4`
- `renders/prototype-60/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-60/scene-bj.js`
- Preview `/pages/prototype-60.html`
- Render `node scripts/render-prototype-60.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
