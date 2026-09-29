# Scene AH — Chromatic Crossroads

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20220903 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; no URL supplied. Source seen for context but not copied, executed, translated or stored in the repository.

The reference combines overlapping chunky arrows, oblique extruded edges, saturated candy colors, contrasting black/white outlines, and dotted circular paths. Scale, orientation and occlusion give the flat composition depth. Arrows often form opposed pairs. White ground is mostly obscured by the dense collage. The artist seal is omitted. The still does not establish motion; this scene's animation is original.

## Implementation

88 seeded groups, with smaller background forms and larger foreground arrows, fill a horizontal canvas. A separately designed arrow polygon is extruded with a generic edge-visibility calculation rather than reproducing the source's hand-authored face sequence. The palette spans coral, orange, yellow, lime, green, mint, cyan, blue, violet and pink. Opposed partners vary their spacing and relative angle. Dotted loops are interleaved with the arrow layers for occlusion and depth.

Autonomous motion includes independent turning, broad drift, changing extrusion depth, pair articulation, and traveling dots. All placement, timing and variation use fixed seeds and explicit track time. No real-time random state is used.

## Audio controls

- Bass: spatial waves across the collage and extrusion depth.
- Mids: shaft proportions and paired-arrow articulation.
- RMS: restrained motif breathing.
- Highs: dot travel rate and local dot modulation.
- Onset impulse: decaying vertical disturbances with group-specific directions.
- High residue: lingering loop expansion.
- Centroid remains available through the common control interface; this scene does not map it separately.

Existing full-track data and envelope settings are reused: fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, impulse decay 650 ms. Spatial feature delays prevent a uniform response. Calm/active/extreme interpolation modulates turning and disturbance intensity.

## Output and integration

25 seconds, **02:08.000–02:33.000** of the real source track. Track clock: `128 + frame / 30`. Native 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-32/signal-lattice-32-scene-ah-25s.mp4`
- `renders/prototype-32/contact-sheet.jpg` — extracted from the encoded video
- `src/prototype-32/scene-ah.js`
- Preview `/pages/prototype-32.html`
- Render `node scripts/render-prototype-32.mjs`

The scene supports the established `introFor` element-entry interface; partial introductions preserve the outgoing canvas. No 60-second assembly is created yet. Prior studies are unchanged.
