# Scene CL — Signal Junctions

New standalone scene study for Segment 7.

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20251228 / graphic. User supplied source and screenshot, inspected 2026-09-29. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal omitted.

The reference places thin white square and diamond frameworks on black. Corner dots are paired with smaller inset dots, while outward arms end in tiny terminals. Overlapping frameworks create a fine network with considerable black negative space. Sampled square and rounded patches add soft gray interruptions and occasional enlarged marks.

## Independent construction

82 seeded frameworks use a parameterized corner/arm topology, with animated inner squares, paired junction dots and moving terminals. A private transparent canvas holds only this scene's live geometry. One pixel snapshot supplies a multiscale sampling field of square and rounded patches. A small five-position neighborhood softens the sampling response; patches are drawn from the snapshot without recursive feedback.

Frames drift and gently rock around orthogonal/diagonal orientations, breathing in size as their arms extend and contract independently. Patch values change as the geometry passes beneath them; opacity also varies continuously. Geometry identities and sampling layout remain seeded, with no frame-history dependence.

## Audio and states

- Bass expands frameworks.
- Decaying transients extend the arms.
- RMS enlarges junction dots subtly.
- Centroid changes fine line weight.
- High-frequency activity increases patch opacity.
- Calm/active/extreme motion and impulse state fields increase rocking and arm response. Other common fields remain available but are not independently mapped.

The established real-track controls, envelopes and spatial delays are reused. Autonomous drift, rocking and extension continue without music response.

## Deliverables and reuse

Track interval **06:08–06:33 (368–393 seconds)** within Segment 7. 25-second standalone study, 960 × 540, 30 fps, 750 frames, H.264/AAC with real audio. Final timeline placement is not assigned.

- Video: `renders/prototype-88/signal-lattice-88-scene-cl-25s.mp4`
- Contact sheet: `renders/prototype-88/contact-sheet.jpg`
- Preview: `pages/prototype-88.html`
- Source: `src/prototype-88/scene-cl.js`
- Render: `node scripts/render-prototype-88.mjs`

Partial introductions preserve the outgoing canvas. Sampling is isolated from that canvas so transition history does not alter the scene. Arbitrary seeks need no warm-up. Layout and sampling resolution target 960 × 540 and require scaling for larger outputs. One pixel readback per frame is a performance cost. No new dependencies or earlier scene/segment changes; slot 87 is untouched.
