# Scene AC — Arc Quilt

## Reference analysis, 2026-09-25

E.C.H. / Eiichi Ishii, dailycoding - 20230218 / graphic. URL not supplied. CC BY-NC-SA recorded under the user's standing instruction. The supplied source (including the `rakkan` seal routine) was visible in conversation but is not copied, executed or stored here. Full visual-grammar analysis: [source-references.md](source-references.md). The user's explicit instruction for this entry: reuse the same structural approach closely, just with an independently-chosen palette.

The screenshot is a grid of square cells, each independently rotated (0/90/-90/180°) and sometimes mirrored, containing the same four-part recipe: a slightly irregular flat-colored block, a small corner dot, a set of nested quarter-circle arc rings, and sometimes a curved accent line — in a muted, vintage palette (terracotta, sage, cream, slate, burnt orange).

## Independent implementation

A 9x5 grid of 108px cells, each independently rotated (0/90/-90/180°) and sometimes mirrored, in an own five-color palette (deep teal, warm coral, ochre, plum, pale mint) — a deliberate full recolor per the user's request, keeping the same structural recipe. Each cell draws: an own jittered-corner quadrilateral block, a corner dot, a set of nested quarter-circle arc rings (own elliptical-arc construction, not the source's exact vertex/arc formulas), and about half the time a curved accent line in black or white.

## Motion and music

- Autonomous: each cell's arc rings continuously ripple outward on their own independent phase/speed, and every cell carries a small continuous rotational wobble layered on top of its fixed base orientation, so the quilt stays visibly alive without audio (confirmed by comparing frames just two seconds apart, showing clearly different ring spacing).
- Bass: corner-dot size pulses.
- Mids/motion state: wobble amplitude and ripple speed both increase.
- Highs: ripple speed increases further; stroke/curve brightness increases.
- Transient impulse: a brief brightness/dot-size/wobble flash across cells.
- A slowly traveling subset of cells (the per-id sine "selected" technique used throughout this project) reads slightly brighter.
- A per-cell delay offset keyed to horizontal position sends transients rippling gently across the grid.
- Built with the project-wide `intro` element-introduction parameter from the start (each cell flies in independently via `introFor`), so this scene is ready to use in cross-scene transitions immediately.

State interpolation reuses the established calm 0-5s, transition to active 5-11s, transition to extreme 11-20s, extreme hold 20-25s schedule. Motion .45/.8/1.15, articulation .45/.8/1.2, impulse .4/.9/1.4, detail .45/.75/1 (articulation and detail reserved for future refinement). Existing feature smoothing/decay is unchanged: fast 25/160ms, slow 350/1100ms, bass 120/850ms, high residue 10/500ms, transients 650ms.

## Deliverable

25 seconds, 960 x 540, 30 fps, H.264/AAC. Real source interval **02:08.000-02:33.000**, from the established full-track analysis and exact audio excerpt. Track time = 128 + frame / 30.

- Video: renders/prototype-27/signal-lattice-27-scene-ac-25s.mp4
- Contact sheet: renders/prototype-27/contact-sheet.jpg
- Source: src/prototype-27/scene-ac.js
- Preview: /pages/prototype-27.html
- Render: node scripts/render-prototype-27.mjs

All previous scenes and renders remain unchanged. Scene AC is not added to the full-track timeline or the scene-reel manager yet; this is a standalone study.

### Revision history

1. First pass matched the reference structure well, but comparing a calm frame against an extreme frame roughly 23 seconds apart showed an almost identical composition — block color/position/orientation are all fixed per cell by design (to preserve the crisp mid-century grid look), and the only animated property (arc-ring ripple phase) wasn't fast or prominent enough to read as real motion at a glance, echoing the same "not enough movement" issue flagged earlier for Scenes U and Z. Fixed proactively, before user feedback, by roughly tripling the ripple speed range and adding a small continuous rotational wobble (amplitude scaling with motion state and transient impulse) layered on top of each cell's fixed base rotation. Re-verified with frames only two seconds apart showing clearly different ring spacing.
2. Second pass: the user asked for more dynamism overall but less rapid movement specifically in the arc rings — the tripled ripple speed from the previous pass read as frantic/strobing rather than an elegant ripple. Fixed by roughly halving the ripple speed range back down (and softening its motion/treble multiplier), giving each cell's ripple its own independent direction (some rings read as expanding, others contracting) for more variety without more speed, and — to keep the scene dynamic despite the calmer rings — strengthening the rotational wobble into two overlapping sine terms at different frequencies, adding a continuous gentle scale-breathing independent of audio, and adding a slow hue drift to the arc-ring color. Re-verified with frames two seconds apart (clear wobble/breathe motion) and roughly 15 seconds apart (clear ring and hue movement).

Completed: all 750 frames encoded with the real excerpt, with no browser errors. Deterministic out-of-order replay, autonomous movement and audio-response checks passed. The six-frame contact sheet shows a consistent, richly-alive composition across the calm/active/extreme arc: a rotated grid of tilting, breathing color blocks, corner dots, gently rippling arc rings and accent curves in the own teal/coral/ochre/plum/mint palette. No pipeline regression was found. Stopped for review.
