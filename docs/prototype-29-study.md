# Scene AE — Painterly Bloom

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20210912 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md). (No artist seal/rakkan routine was included in this particular source.)

The screenshot is a warm amber ground filled with soft, blurred, overlapping color blooms arranged radially around the center, textured with a fine scratchy crosshatch overlay, punctuated by a solid black circle at the exact center.

## Independent implementation

26 blob clusters are arranged around the canvas center at varying radius, each built from 7 soft smudges (own radial-gradient construction with a mid-stop for a fuller falloff, not the source's literal 30-40-concentric-circles-at-low-alpha stack) composited with the canvas `overlay` blend mode — a generic, non-distinctive compositing technique — for the same rich, blended-color painterly look. 120 scratch-line clusters (own placement/hatching logic, batched into one path per cluster for performance) are layered on top, also via `overlay`, refreshed on a stepped per-cluster clock for a genuine staticky shimmer. A solid dark circle sits at the center, drawn last in normal blend.

## Motion and music

- Autonomous: the whole blob ring slowly rotates around the center, each smudge drifts independently within its cluster (own sine-based wander), and every scratch cluster's hatching lines reshuffle on their own stepped clock, so the composition is continuously alive without audio (confirmed by comparing calm vs. extreme frames — completely different bloom positions and colors throughout).
- Bass: blob and smudge size pulse; scratch/blob distance from center increases slightly.
- Highs: smudge opacity brightens; scratch-line flicker rate and brightness increase.
- Transient impulse: a brief size/brightness flash across blobs, smudges and scratch lines; the center circle pulses slightly.
- Built with the project-wide `intro` element-introduction parameter from the start (every blob cluster, scratch cluster and the center circle each fly in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-29/signal-lattice-29-scene-ae-25s.mp4
- Contact sheet: renders/prototype-29/contact-sheet.jpg
- Source: src/prototype-29/scene-ae.js
- Preview: /pages/prototype-29.html
- Render: node scripts/render-prototype-29.mjs

All previous scenes and renders remain unchanged. Scene AE is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. First pass: a single radial-gradient pass per smudge at low alpha (0.1-0.24, chosen to loosely mirror the source's per-circle alpha of 10/100) read as washed-out and pale rather than the reference's bold, richly saturated blooms — the source builds up color by stacking the _same_ low-alpha circle dozens of times per smudge, which a single gradient application doesn't replicate. Fixed by roughly tripling the peak alpha range and drawing each smudge in two passes (with a mid-gradient stop for a fuller falloff) for real color buildup where smudges overlap, closer in spirit to the source's repeated-stacking technique without literally copying its circle count or formula. Re-verified with a fresh capture showing bold, clearly-saturated blooms matching the reference's character.

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, continuously-evolving, richly-colored composition across the calm/active/extreme arc: bold overlapping painterly blooms, a fine scratchy texture, and a solid dark void at the center. No pipeline regression was found. Stopped for review.
