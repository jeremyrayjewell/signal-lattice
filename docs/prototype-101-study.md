# Scene CY — Paper Crane Flock

Twelfth new study for Segment 7. Slot 100/letter CX (Codex's Scene CX, "Gossamer Folds") exists on disk; slot 101/letter CY was free. Earlier scenes and completed segments remain unchanged. Built to the user's explicit direction: these should read as **flying** origami cranes/swans, not a tumbling static scatter.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20241222 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference is a WebGL flock of four hundred origami cranes (`drawTsuru`): each a genuine 3D folded-paper model — a diamond body, a front/back ridge crease, a belly flap, small connector facets, a tail spike, a beak-kinked head, and two wings (each a folded pentagon with a centre crease) hinged up out of the body plane at a random angle between roughly 45 and 90 degrees — one solid colour per crane from a ten-tone vivid palette, a thin white stroke on every face. The whole flock is scattered at random 3D positions and orientations (static, not actually flying), then softly blurred and given an overlay-blended noise-grain texture.

## Independent construction

Several 2D approximations were tried first — a flattened bird silhouette, an abstract faceted shatter, a hand-tuned "recognisable swan" shape, a shape derived from working out the source's fold geometry by hand — and each still fell short in some way the user caught directly: not matching the reference's texture and density, not reading as a swan, not clearly grounded in the reference image itself, its creases not reading clearly, some cranes appearing to fly upside down. The user's own diagnosis was the right one: build the actual 3D model the source builds, rather than continuing to approximate it in 2D.

This construction does that: a genuine 3D crane, drawn face by face in p5's own WEBGL immediate mode (`createGraphics(..., WEBGL)`, `beginShape`/`vertex`/`endShape`, `rotateX`/`Y`/`Z`) — the source's own technique, not a raw-WebGL shader pipeline like Scene AQ's smooth solids. Every face keeps the source's own vertex proportions exactly: body, ridge, belly, connector facets, tail, head, and two wings each with a centre crease line, folded up out of the body plane. With real 3D geometry and per-face white strokes, the folds are properly visible as seams between facets at different angles and depths, the way the reference actually shows them, rather than something a 2D approximation had to fake. Depth-testing (built into p5's WEBGL renderer) handles occlusion between facets and between cranes correctly on its own.

Two changes turn the source's static, randomly-tumbled scatter into an actual flock in flight, per the user's original direction. First, each wing's fold angle now animates continuously as a real flap — oscillating within the source's own established 45–90 degree range, driven by an independent phase and rate per crane, with wing 2 staying the source's own mirror of wing 1 (180 degrees minus wing 1's angle) — rather than the source's one-shot random angle. Second, each crane flies its own course across the 960 × 540 frame (position, vertical bob, and a small amount of depth for parallax) instead of sitting at one random static point. Orientation is also handled deliberately rather than fully randomly: yaw (facing direction) is free to spin continuously, since that alone can never flip a bird upside down, but pitch and roll are kept to small, audio-modulated oscillations (climbing/diving and banking cues) rather than the source's own fully free random rotation on every axis — which is what let cranes tumble past upside-down in an earlier pass. Colour and size are a pure function of the crane and a local epoch number, smoothly interpolated (not crossfaded via transparency, which would fight WEBGL's depth test) every 9–17 s. The source's closing blur and overlay-blended noise-grain texture are both kept, the grain as a single cached, periodically-regenerated image composited over the whole frame rather than redrawing tens of thousands of per-cell rects every frame. Reference layout and source functions are not reused; the vertex proportions that define the crane's actual shape are.

Motion:

- Both wings flap continuously and asynchronously per crane, oscillating through the source's own established fold range.
- Each crane flies its own course, bobbing for lift and gently pitching/banking, never tumbling upside down.
- A crane's colour and size interpolate between an old and new random draw every 9–17 s.
- The whole flock wraps around the frame edge as it flies.
- The glitter-texture overlay shimmers, regenerating every couple of seconds.

## Audio response

- Highs: flap-rate boost.
- Impulse/onsets: a touch of extra wing-flap amplitude.
- Motion (state): yaw-rate and bank-angle amplitude.
- Bass/centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each crane responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-101/signal-lattice-101-scene-cy-25s.mp4`
- `renders/prototype-101/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-101/scene-cy.js`
- Preview `/pages/prototype-101.html`
- Render `node scripts/render-prototype-101.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-crane introductions (each entering crane flies in at reduced scale) without clearing the outgoing canvas during partial entry. p5's WEBGL renderer for the flock (matching the source's own technique), composited onto the native Canvas2D frame; no other new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
