# Scene BX — Blossom Static

Thirty-second new study for Segment 3 (following prototype-73, Codex's Scene BW). Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250712 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is five layers of a randomly rotated, oversized grid of text glyphs picked from unusual Unicode ranges, screen-blended in a five-colour palette, each layer blurred slightly before the next is added, finished with one coarse colour-posterize step. Occasional white bezier scribbles cross individual cells. The result is a dense field of soft, glowing colour clusters on black, each with a faint internal rosette structure, rather than legible text.

## Independent construction

Rendering the source's actual chosen codepoints would be font- and platform-dependent, and — since those particular Unicode ranges render in most fonts as rounded blob and dingbat shapes rather than legible letters — would not add anything a literal text render couldn't already approximate more reliably. Each "glyph" is instead a small rosette of four to six overlapping circles, matching the rounded, cluster-like visual character the source's chosen ranges actually produce.

Five layers, each its own randomly placed and rotated, oversized grid of these rosettes (four or six divisions, one or two sub-cells, matching the source), are composited with screen blend into a private buffer, with a fixed blur pass after each layer and one coarse posterize step (six colour levels per channel) at the end — the same private-buffer architecture used for the ring target in [Scene BK](prototype-61-study.md), needed here because both the blur and posterize are global operations. Building this is expensive, so the whole five-layer composite is cached per epoch (9–13 s) rather than rebuilt every frame.

A first pass used larger rosettes and an increasing blur radius per layer, both closer to a literal reading of the source's numbers; the result washed out to near-solid pale colour with almost no black showing, unlike the reference's distinct clusters on black. Shrinking the rosettes relative to their cells and fixing the blur radius rather than escalating it are what let black gaps survive between clusters after five cumulative layers.

Because the finished composite is opaque and nearly gap-free, it is introduced as eighty-four small tiled patches rather than one flying rectangle — the same fix used for the checkerboard background in [Scene BL](prototype-62-study.md).

Reference layout, the five-layer screen-blend-then-blur-then-posterize structure, and the occasional scribble threads are kept because they define the picture's identity, but no source functions, constants, literal randomness sequences, or actual text rendering are reused.

## Audio response

- Bass: a gentle whole-composite pulse.
- RMS: overall brightness.
- Mids/highs/centroid/onsets/residue are supplied by the common interface but not separately mapped, since the composite itself is cached and not rebuilt every frame.

Existing full-track features use timestamp interpolation. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-74/signal-lattice-74-scene-bx-25s.mp4`
- `renders/prototype-74/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-74/scene-bx.js`
- Preview `/pages/prototype-74.html`
- Render `node scripts/render-prototype-74.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.

## Dynamic revision

The cached composite now flows through a continuously deforming triangular mesh: local horizontal and vertical waves move the clusters and scribbles throughout the frame. Bass drives zoom, mids add local displacement, and transients amplify deformation. Overscan covers moving edges. Epochs now crossfade over the last 35 percent of each interval instead of switching abruptly. The previous gentle pulse-only behavior is superseded. Intro patches use the animated composite. Explicit-time evaluation is retained.
