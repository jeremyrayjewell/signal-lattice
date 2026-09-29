# Scene BP — Chevron Weave

Twenty-sixth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251006 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is built from columns of square cells, each column offset vertically from its neighbours so the grid reads as staggered bricks rather than a clean lattice, on black or white backgrounds. Each cell holds one of two motifs: a four-triangle pinwheel in muted colour, or a wide white triangle (apex at the cell's centre) with a smaller, inset colour triangle drawn on top of it, leaving a thick white "V" border around the coloured fill, sitting over a soft, very faint colour glow. Thin black and white threads drift across everything. A staggered brick grid of bold white-bordered chevrons and colour pinwheels is the defining relationship.

## Independent construction

A 67.5 px grid (an eighth of the frame height, matching the source's own ratio) tiles the 960 × 540 frame. Each column keeps its own vertical offset, echoing the source's per-column stagger, and that offset itself drifts slowly over time rather than staying fixed, alongside the whole grid's horizontal drift.

Each cell's content is a pure function of the cell and a local epoch number, re-rolled every 4–8 s: background tone, rotation, scale, and either a four-triangle pinwheel (colours drawn from the source's five-colour palette) or the bordered chevron — a wide triangle in white with a smaller inset triangle in one of two chosen colours on top, over a soft radial-gradient glow (a native two-stop gradient standing in for the source's forty low-alpha concentric rings).

Seventy thin overlay threads, each a continuously reflowing value-noise path radiating loosely from the frame centre in black or white, cross the grid in overlay blend, echoing the source's loose bezier curves.

Motion:

- Chevrons and pinwheels breathe gently in scale.
- The glow behind each chevron pulses with bass.
- Overlay threads continuously reshape.
- At an epoch change the old cell content dissolves while a new one fades in.

Reference layout, draw order and source functions are not reused.

## Audio response

- Bass: glow pulse.
- Highs: thread weight (via centroid) and cell breathing.
- Centroid/RMS/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (each cell responds slightly later the further right it sits). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-66/signal-lattice-66-scene-bp-25s.mp4`
- `renders/prototype-66/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-66/scene-bp.js`
- Preview `/pages/prototype-66.html`
- Render `node scripts/render-prototype-66.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-cell introductions (each entering cell carries its own black/white backing) without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
