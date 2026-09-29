# Scene CS — Vine Foliage

Ninth new study for Segment 7. Slot 96/letter CT is Codex's own in-progress work (a `sketch.js`/`states.js` pair with no scene file yet, for a different track window — left untouched); slot 95/letter CS was free between the surrounding slots, filled here at the user's explicit request. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20250501 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal (the source's `rakkan()` hanko stamp) omitted.

The reference is the densest source studied yet, layering three things on white: fifty discs of small brown dots (uniformly sampled within each disc via a square-root radius factor); fifty more clusters, each a thin curving "vine" line traced by a tightly-coiled noise walk, with pointed oval leaves — a filled bezier outline, a centre vein, and a herringbone of side veins in a triangular thick-at-the-middle profile — scattered along it in varied green/yellow-green/olive hues around a per-vine base hue.

## Independent construction

Each of the three layers' relationships is the source's own and is kept exactly: uniform-disc dot sampling (`sqrt(random())` radius factor) for the brown speckles; the pointed-oval leaf outline (two bezier curves meeting at a stem point and a tip, both with independently randomised control points) with its centre vein and triangular-profile herringbone side veins; and HSB colour throughout (a proper HSB→RGB conversion, not an approximated hex palette, since the source's colour identity comes from a per-vine base hue with independently jittered per-leaf hue, not a fixed set of named tones). Forty-two combined clusters — each one cluster's worth of dots, one vine and its leaves, all sharing one local origin — sit in a continuously drifting, wrapping field across the 960 × 540 frame, rather than the source's two independently-scattered populations of fifty each, so the layers stay visually tied together as they drift. Each cluster's dots, vine path and leaves are a pure function of the cluster and a local epoch number, re-rolled every 10–16 s and crossfaded at the boundary — a longer cycle than most other scenes, since this much per-cluster detail re-rolling more often would read as noisy rather than organic.

The vine's thousand-plus individually-drawn stem dots become one continuous smoothed stroke through its noise-walked points, and each vine attaches a modest, fixed number of leaves (26, chosen at points along the precomputed path) rather than stochastically testing for a leaf at each of over a thousand stem positions — both the same kind of substitution this project makes wherever a source spends very many draws building one continuous or repeating shape (Scenes BN, BZ, CM). A first pass used a wider noise-walk amplitude and a slower noise-frequency for the vine and far fewer clusters/leaves overall; it read as sparse, thin zigzag lines rather than the source's packed foliage. Raising the cluster/leaf/dot counts substantially and tightening the vine's noise-walk (more sample points, higher frequency relative to its own bounding box) were the two changes that brought the coverage and the vine's flowing character much closer to the reference. Each leaf also carries a small continuous sway (a foliage-in-the-breeze addition beyond the source's static frame) on top of its epoch-fixed position and orientation. Reference layout, draw order and source functions are not reused.

Motion:

- Every leaf sways continuously and independently.
- Each cluster spins slowly and independently.
- A cluster's dots, vine and leaves crossfade between an old and new random draw every 10–16 s.
- The whole field drifts slowly, wrapping at the frame edge.

## Audio response

- Bass: cluster scale breathing.
- Highs: leaf-sway amplitude and cluster spin-rate boost.
- Impulse/onsets: vine and vein stroke-weight punch.
- Centroid/RMS/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cluster responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-95/signal-lattice-95-scene-cs-25s.mp4`
- `renders/prototype-95/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-95/scene-cs.js`
- Preview `/pages/prototype-95.html`
- Render `node scripts/render-prototype-95.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cluster introductions (each entering cluster flies in at reduced scale) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 7 assembly.
