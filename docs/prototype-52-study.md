# Scene BB — Bloom Field

Twelfth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260109 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a dense black field of several hundred overlapping petal wheels in a muted ten-colour palette (slate, periwinkle, brick red, cream, plum, rose, teal, brown, orange, salmon). Each wheel has six, twelve or eighteen petals, is randomly rotated and mirrored, and is either a single colour or a colour per petal. Each petal is a pinched blade with one curved flank, one straight flank and a scalloped outer edge, so the wheels read as pinwheels and dahlias. A dark disc sits at each centre and a soft black shadow rings every wheel, which carves depth out of the overlaps. Thin white or black outline squares and circles at two sizes float over the tangle. The tension between the calm outlines and the busy, shadowed bloom mass is the defining relationship.

## Independent construction

About thirteen hundred wheels and outlines live on a wrapped field slightly larger than the 960 × 540 frame (wheels roughly match the reference's density per unit area). Wheel diameters run from one twelfth to one quarter of the frame height. Only what is on screen is drawn, and the field margin exceeds any wheel's or outline's reach so nothing pops at the wrap. The black shadow is a shared soft radial halo stamp under each wheel rather than a per-petal blur. Outline elements are independent of the wheels and keep their draw order, so later wheels still cover earlier outlines.

Each wheel has its own seeded life cycle of 5–11 s, and every "epoch" is a pure function of the wheel and epoch number: petal count, single or per-petal colours, size, rotation, spin direction and rate, and mirroring. Nothing is stateful, so any frame renders alone and out of order.

Motion:

- The whole field drifts up and to the right, and every wheel and outline has its own drift factor, so layers slide past each other.
- Every wheel spins continuously at its own rate and direction, and drifts in a small orbit around its place.
- Petals breathe at individual phases, so wheels ripple.
- At an epoch change the old wheel withers while a new one blooms in with new colours, petal count and size.
- Outline corners glide continuously between square and circle, sizes swell, and outlines tilt slightly and orbit.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: wheel swell.
- Mids: petal breathing depth.
- Highs: petal tip flutter.
- Centroid: outline weight.
- Onsets: small decaying rotational kicks in each wheel.
- RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (twelve delayed reads across the frame width stand in for a per-wheel delay). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects orbit wander and kick strength. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-52/signal-lattice-52-scene-bb-25s.mp4`
- `renders/prototype-52/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-52/scene-bb.js`
- Preview `/pages/prototype-52.html`
- Render `node scripts/render-prototype-52.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-element introductions without clearing the outgoing canvas during partial entry. Because this scene is so dense, introduction progress is squared before the per-element stagger so the outgoing scene stays visible longer while wheels fly in; it still reaches exactly identity at completion. Native Canvas2D, no new dependencies. The scene draws roughly a thousand vector wheels per frame (about 0.3 s per frame offline). This is a standalone study for review, not a full Segment 3 assembly.
