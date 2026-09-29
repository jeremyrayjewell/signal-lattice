# Scene CP — Dot Counterpoint

New standalone scene study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250727 / graphic. User-supplied source and screenshot inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference contrasts solid black dot fields with fine wandering curves on white. Dot fields vary between sparse large circles and dense small-dot matrices, with a directional size gradient. Some cells replace a single circle with four small dots. Diagonal compact groups and larger corner dots interrupt the orthogonal arrangement. The curves span several groups and should remain much finer than the circular masses.

## Independent construction

45 seeded groups form a horizontal 9-by-5 field. Two, four or eight subdivisions generate mixed-scale dot patterns with single and four-dot motifs. Selected groups are reduced and turned diagonally, with larger dots around them. Eight independently parameterized cubic paths per group create the continuous fine-line field. All curves are drawn before the dot masses to keep their solid silhouettes clean.

Dot groups rock and drift, local positions undulate, circle sizes breathe, and four-dot groups expand and contract. Curve endpoints and control points move at independent phases. Seeded geometry and explicit-time animation avoid per-frame random regeneration or accumulated simulation state. No reference functions are reused.

## Audio and states

- Bass expands dots.
- Mids increase curve displacement.
- Decaying transients spread four-dot motifs.
- Centroid subtly changes fine line weight.
- Calm/active/extreme motion and impulse state fields strengthen curve/group movement and transient separation. Other common fields remain available but are not separately mapped.

The established real-track controls, smoothing and short spatial delays are retained. Autonomous movement remains without audio response.

## Deliverables and reuse

Real track **06:08–06:33 (368–393 seconds)** within Segment 7. Standalone 25-second study, 960 × 540, 30 fps, 750 frames, H.264/AAC. This does not assign final segment placement.

- Video: `renders/prototype-92/signal-lattice-92-scene-cp-25s.mp4`
- Contact sheet: `renders/prototype-92/contact-sheet.jpg`
- Preview: `pages/prototype-92.html`
- Source: `src/prototype-92/scene-cp.js`
- Render: `node scripts/render-prototype-92.mjs`

Seeded partial introductions preserve the outgoing canvas. Arbitrary seeks and reuse need no warm-up. Coordinates target 960 × 540 and require scaling at other sizes. No new dependencies or prior scene/segment edits; slot 91 is untouched.
