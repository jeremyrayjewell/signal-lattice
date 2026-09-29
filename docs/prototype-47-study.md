# Scene AW — Soft Signals

Seventh new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260502 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference contrasts soft parallel white bars with crisp square and rounded-square outlines on black. Bar clusters vary in orientation, count and thickness. Partial sets of outlines surround them, slightly tilted. Long thin diagonal threads span multiple groups. The combination of blurred light and sharp geometry is the defining visual relationship. Animation is an original extension of the still.

## Independent construction

Eighteen groups in a 6 × 3 horizontal arrangement use cached native Canvas glow stamps, rather than the source's repeated shrinking stroke-width loops. Each cluster has seeded bar widths and brightness, with independent length and position modulation. Selected outline quadrants vary between square and rounded shapes. Eleven independently moving threads span the frame. The reference's exact arrangement and source functions are not reused.

Autonomous motion changes bar spacing, length, orientation and intensity, with slower group drift and outline deformation. Threads move on separate timescales. All motion is explicit-time and seeded, independent of render order.

## Audio response

- Bass: bar-cluster spacing.
- Mids: cluster and outline articulation.
- Onsets: decaying, locally phased bar-length disturbances.
- RMS: restrained glow intensity.
- Centroid: outline weight.
- Highs/residue are supplied by the common interface but not separately mapped in this study.

Existing full-track features use timestamp interpolation and lateral delays. Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects angular movement and disturbance strength. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-47/signal-lattice-47-scene-aw-25s.mp4`
- `renders/prototype-47/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-47/scene-aw.js`
- Preview `/pages/prototype-47.html`
- Render `node scripts/render-prototype-47.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-group introductions without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.

## Background texture revision

The flat black ground is replaced with a dark charcoal texture combining seeded fine grain, a subtle four-pixel scanline/weave pattern, and short faint fibers. It stays monochrome and fixed over time so it adds surface detail without flicker or competing with the moving luminous forms. Partial introductions still preserve the outgoing canvas.

Stronger texture revision: raised charcoal luminance, combined fine grain with 3-pixel coarse grain, strengthened the 6-pixel light/dark weave, and increased fiber density and contrast so the surface survives video compression more clearly. Foreground animation and audio mappings remain unchanged.

Animated texture revision: the seeded grain/weave/fiber surface now scrolls continuously at 18 px/s horizontally and 11 px/s vertically, with smooth oscillating drift and shear. Bass offsets horizontal motion, mids flex the weave, and the smoothed transient envelope nudges vertical motion. All motion is evaluated from absolute track time; the texture repeats to cover the frame without exposed edges. Foreground mappings remain unchanged.
