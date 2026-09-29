# Scene AX — Chromatic Refractions

Eighth new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20260115 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference is a dense stack of hard-edged, near-square colour tiles on black, blended so overlaps stay vivid rather than muddy. Each tile is four-way mirrored and holds a soft, jagged fan of radial petals that thins toward the tile edge; roughly a fifth of the tiles are white with a dark colour starburst. Between the tiles a fine grid of small bright squares (whole and half cell, random brightness, one hue per row) shows through the black. Thin outline squares and circles, several slightly offset copies each, cross everything. The overlap of saturated blocks, ray texture, pixel grid and hairlines is the defining relationship.

## Revision toward the source

The first version used smooth gradient wedges, a sparse dim pixel layer and small outlines, which read as flat translucent squares. The revision rebuilds each element around the reference's structure:

- **Tiles:** 52 blocks, 35 on a stratified 7 × 5 start and the rest scattered so black gaps survive. Each has a near-square superellipse body with a radial gradient (deep core to bright edge) built from a mirrored outline, so the edge stays crisp and symmetrical. Colours sit near 0/1 per channel so hard-light overlap keeps saturation, picks are weighted toward yellow, cyan, green and blue so red/pink does not dominate, and about a quarter of tiles are white.
- **Petals:** each tile has two cached petal stamps, each a stack of 34 low-alpha concentric jagged rings. Jagged outlines come from seeded sums of high-frequency sines folded into one quadrant, so the four quadrants mirror exactly. The accumulated rings read as soft rays with dark gaps and spill past the tile edge. Roughly two-thirds of tiles are jagged, the rest smooth.
- **Pixel field:** 60 × 34 cells, half lit, at full or half cell size, one palette hue per row, brighter and denser than before.
- **Outlines:** 46 groups of ten jittered hairline copies, square or fully round, larger than before and drawn in normal blend so the colours stay distinct.

All constructions are independent Canvas2D; no source functions or constants are reused.

## Audio response

- Bass: tile size pulse.
- Highs: the two petal stamps trade weight faster, and the pixel field brightens.
- RMS: tile and petal intensity.
- Onsets: decaying petal gain and outline jitter.
- Centroid: outline weight.
- Mids/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (tile response is offset by horizontal position). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Calm/active/extreme interpolation affects drift amplitude and impulse strength. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-48/signal-lattice-48-scene-ax-25s.mp4`
- `renders/prototype-48/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-48/scene-ax.js`
- Preview `/pages/prototype-48.html`
- Render `node scripts/render-prototype-48.mjs`
- Analysis `assets/analysis/prototype-02.json`

Supports seeded per-element introductions without clearing the outgoing canvas during partial entry. Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
