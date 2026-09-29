# Scene BD — Posterized Frames

Fourteenth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251125 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is built from two passes of the same pattern on white: a scatter of translucent colour rectangles paired with wobbly square outlines (each side drawn as ten jittered, slightly offset line copies, either one colour per frame or one colour per line) in a seven-colour palette (cream-yellow, teal, red, gold, navy, tan, crimson). The first pass is blurred, the second is drawn crisp on top, and the whole composite is finished with a colour-posterize step that flattens the blurred pass into soft, banded colour pools while the crisp pass keeps sharp edges. Soft posterized colour underneath crisp wobbly frames is the defining relationship.

## Independent construction

Two independent populations of 190 items each render every frame (raised by request, from an initial 120, for a busier field): pass A becomes the blurred underlayer, pass B stays crisp on top, echoing the source's two separate calls to its pattern routine with entirely fresh randomness each time. Every item pairs one translucent rectangle with one square wire frame offset from it, exactly as the source's second `translate()` moves the frame away from the rectangle. A frame's four sides are each drawn as fourteen jittered strokes (raised by request, from an initial ten, for a more scribbled tangle), each stroke's two endpoints jittering independently on their own axis and rate rather than the whole line wobbling as one, so sides read as a hand-scribbled knot rather than a single wavering outline; frames alternate between one colour for the whole frame and one colour per line, both seeded per item.

Each frame renders in three steps, all into a private offscreen buffer so the effect never touches the shared canvas: pass A is drawn to an internal canvas and composited with a canvas blur filter; pass B is drawn crisp on top; the combined buffer's pixels are then read and every channel is rounded to a small number of even steps (whole-frame colour quantization), reproducing the source's closing posterize filter. That finished buffer is what gets shown.

Each item has its own seeded life cycle of 5–10 s, and every "epoch" is a pure function of the item and epoch number: rectangle size and colour, frame size and offset, and the forty line-jitter seeds. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- Both populations drift continuously and independently across a wrapped field, so rectangles and frames stream past at different rates.
- Frame lines wobble continuously at individual phases.
- At an epoch change the old rectangle-and-frame pair shrinks away while a new one grows in.
- Blur radius, jitter amplitude and posterize step count all shift gently with the audio.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: rectangle size pulse (via the epoch morph amplitude).
- Mids: outline line weight.
- Highs: reduces blur radius slightly and increases line jitter, so the picture sharpens and jitters together on brighter passages.
- Onsets: brief extra posterize steps, a small colour-banding flicker.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-54/signal-lattice-54-scene-bd-25s.mp4`
- `renders/prototype-54/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-54/scene-bd.js`
- Preview `/pages/prototype-54.html`
- Render `node scripts/render-prototype-54.mjs`
- Analysis `assets/analysis/prototype-02.json`

At this density the per-element clip footprints add up fast, so introduction progress is squared before the stagger, keeping the outgoing scene visible for longer while transitions still land exactly on the finished picture at completion.

Introductions work differently here because the scene's visible effects (blur, posterize) are global to its own private buffer, not compatible with drawing directly on the shared canvas mid-transition. Each frame first renders its full, settled composite (both passes, blurred and posterized) into that private buffer. During a transition, every rectangle and every frame is then introduced individually: a tight patch is cut from around just that shape in the finished buffer and carried in from an offset, undersized start via `introFor`, so the outgoing scene stays visible through the gaps and elements genuinely fly in, even though the underlying effect is computed globally. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
