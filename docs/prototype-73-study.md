# Scene BW — Prismatic Shatter

## Source study

E.C.H. (Eiichi Ishii), dailycoding 20250711 / graphic. User-supplied source and screenshot inspected 2026-09-28. CC BY-NC-SA under the standing instruction; URL and license version not supplied. Reference functions and artist seal are not included.

The reference forms a dense collage of translucent, thin rectangular solids. Each cluster combines aligned layers with tilted fragments, producing angular silhouettes and overlapping facets. Strong lime, yellow, cyan, orange and magenta clusters alternate with white, gray and near-black clusters. The composition nearly covers its black ground. Plate thickness, transparency and clustered repetition are more important than isolated geometric objects.

## Independent construction

172 seeded clusters contain 18 independently parameterized thin plates each. Native JavaScript projects their eight corners through explicit three-axis rotations; visible faces receive directional shading and are depth-sorted inside each cluster before Canvas rendering. No p5 WEBGL buffers or reference functions are reused. The original source was seen and informed the visual study; this is not a source-unseen implementation.

Cluster placement, dimensions, opacity, color and relative plate angles remain seeded. Explicit-time motion changes cluster orientation and drift, plate tilt and twist, and stack separation. Stable geometry preserves continuity rather than regenerating a random collage each frame. The grayscale component is assigned at construction, with both light and dark stacks.

## Audio and state mappings

- Bass expands cluster scale.
- Mids alter individual plate twist.
- Decaying transients open stack spacing.
- Calm/active/extreme motion and impulse parameters increase articulation and separation responses.
- Other shared feature channels and state fields remain available but are not separately mapped.

Real analyzed track controls use absolute timestamps with short lateral delays. Autonomous animation continues without audio. The established envelopes, scene interface and rendering pipeline are retained.

## Deliverables

25-second standalone study, real track **02:08–02:33**, 960 × 540, 30 fps, 750 frames, H.264/AAC. This is the existing study interval, not a new final timeline placement.

- Video: `renders/prototype-73/signal-lattice-73-scene-bw-25s.mp4`
- Contact sheet: `renders/prototype-73/contact-sheet.jpg`
- Source: `src/prototype-73/scene-bw.js`
- Preview: `pages/prototype-73.html`
- Render: `node scripts/render-prototype-73.mjs`

Seeded partial introductions preserve the outgoing canvas. Arbitrary time reuse needs no simulation warm-up. Coordinate layout currently targets 960 × 540 and requires scaling for other dimensions. Transparent faces are sorted within clusters; inter-cluster overlap follows collage order, not a global 3D depth buffer. This matches the layered composition but is not physically accurate intersecting transparent geometry. Earlier scenes and segment assemblies are unchanged; slot 72 was not created or modified.
