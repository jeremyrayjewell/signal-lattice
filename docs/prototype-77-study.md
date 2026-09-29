# Scene CA — Folded Currents

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250705 / graphic. User supplied screenshot and source, inspected 2026-09-28. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The source image places small angular ribbon bundles across a white field. Large and small bundles share green, dark blue, cyan, near-white and gray strokes. Coarse bends, squared ends, overlapping colors and white cuts make each bundle appear folded rather than smoothly curved. Open white intervals separate the bundles, while neighboring ends occasionally meet.

## Independent implementation

A 12-by-7 field of 80-pixel cells mixes full-size bundles with four smaller bundles. Twenty seeded lanes follow an independently defined five-vertex polyline spine, with individual widths, offsets and vertex deviations. Native Canvas square caps and beveled joins retain the faceted appearance. This does not use the source's WEBGL buffers or Bezier construction.

Explicit-time deformation bends the shared spine while each lane moves slightly relative to it. Bundles turn, drift and breathe at distinct phases. Fixed seeded identities preserve coherent motion and the two spatial scales without random regeneration. White lanes act as local cuts through preceding colored strokes.

## Audio and states

- Bass changes bundle scale and spine bend amplitude.
- Mids articulate bundle orientation.
- Decaying transients spread the individual lanes.
- RMS subtly changes stroke width.
- Calm/active/extreme motion and impulse parameters amplify bending, turning and transient spread. Other common feature/state fields remain available but are not independently mapped.

The existing real-track controls, envelope smoothing and lateral delays are retained. Autonomous motion remains active when audio response is disabled.

## Output and reuse

25-second study, **02:08–02:33** of the real track, 960 × 540, 30 fps, 750 frames, H.264/AAC. The interval follows the recent standalone study convention, not a final full-song scene assignment.

- Video: `renders/prototype-77/signal-lattice-77-scene-ca-25s.mp4`
- Contact sheet: `renders/prototype-77/contact-sheet.jpg`
- Source: `src/prototype-77/scene-ca.js`
- Preview: `pages/prototype-77.html`
- Render: `node scripts/render-prototype-77.mjs`

No frame history or warm-up is required for arbitrary reuse. Seeded partial introductions preserve the outgoing scene. Layout uses the bank's fixed 960 × 540 coordinates; other dimensions require scaling. No new dependencies or previous scene/segment edits; slot 76 is untouched.
