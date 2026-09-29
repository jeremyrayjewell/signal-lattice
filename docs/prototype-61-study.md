# Scene BK — Target Static

Twenty-first new study for Segment 3. Earlier scenes and completed segments remain unchanged.

## Source study

E.C.H. / Eiichi Ishii, dailycoding 20251014 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen for context, not copied, executed, translated or stored. Artist seal omitted.

The reference layers four passes on black. A grid of red/green/blue primary cells at random alpha, each with a diagonal cross or an axis cross in black or white, gives a TV-static mosaic. Screen-blended over it, roughly a thousand small RGB confetti-bar clusters are scattered around the centre, each cluster's size and reach growing with its distance from the middle. A big concentric target of rings — some filled, some outlined, in black or white, slightly offset from each other — is blurred and heavily colour-posterized, then blended with difference against everything beneath, producing the picture's dominant circular structure and its high-contrast colour inversions. A handful of large dark translucent bars sit on top. Primary-colour static, a scattered confetti field and a posterized target ring in difference blend is the defining relationship.

## Independent construction

A 67.5 px mosaic (a eighth of the frame height) tiles the 960 × 540 frame, each cell a red, green or blue fill at random alpha plus a diagonal or axis cross in black or white, with a slow continuous drift as in the other lettered grid scenes.

Revised for a closer match after the user supplied a clearer reference: about three hundred and forty confetti clusters (raised from two hundred) orbit the frame centre, brighter and denser so overlapping bars genuinely screen-blend toward the near-white sparkle highlights visible in the reference, rather than staying a muted scatter; each is a short stack of thin RGB bars whose size and orbit radius are tied together exactly as in the source, so clusters further from the centre are both larger and further out, screen-blended so they brighten rather than muddy the mosaic beneath.

The ring target is the expensive part (many concentric circles), so — the same technique used for the noise clouds in [Scene BH](prototype-58-study.md) — it is built into a private buffer once per epoch (6–9 s) rather than every frame: a hundred rings (matching the source's own fixed ring count, independent of frame size), filled or outlined, black or white, each slightly offset, then blurred by less than half a ring's spacing and reduced to five colour levels per channel, both baked into the same cached buffer. That finished buffer is drawn every frame, difference-blended, with a slow continuous rotation and a bass-driven pulse. Revised after an initial pass used far fewer, more widely spaced rings and read as two or three soft bands rather than a true target — keeping the blur small relative to ring spacing, rather than large, is what keeps individual rings distinct after posterizing.

A few dozen dark bars sit on top in normal blend, sized to match the source's own range (up to four grid-cells wide), each with its own seeded base opacity so some read as fully solid black and others stay translucent, matching the source's random alpha rather than a uniform pulse. Mosaic cell alpha was also raised so cells can reach full opacity, as in the source.

Reference layout, draw order and blend modes are kept because they define the picture's structure, but no source functions, constants or literal randomness sequences are reused. Mosaic cells, confetti clusters, the ring target and the occlusion bars are each introduced independently (`introFor`).

## Audio response

- Bass: ring target pulse.
- Mids: confetti orbit rate.
- Highs: mosaic cell line sway and confetti brightness.
- Centroid: mosaic line weight.
- RMS/onsets/residue are supplied by the common interface but not separately mapped.

Existing full-track features use timestamp interpolation and lateral delays (mosaic cells and confetti clusters respond slightly later the further right/further along their orbit they sit). Envelope settings remain fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, onset decay 650 ms. Autonomous motion remains when audio is disabled.

## Deliverable

Real track **02:08.000–02:33.000**, `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-61/signal-lattice-61-scene-bk-25s.mp4`
- `renders/prototype-61/contact-sheet.jpg` — six frames extracted from the encoded MP4
- `src/prototype-61/scene-bk.js`
- Preview `/pages/prototype-61.html`
- Render `node scripts/render-prototype-61.mjs`
- Analysis `assets/analysis/prototype-02.json`

Native Canvas2D, no new dependencies. This is a standalone study for review, not a full Segment 3 assembly.
