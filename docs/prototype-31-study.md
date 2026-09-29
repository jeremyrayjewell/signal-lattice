# Scene AG — Notebook Storm

Restored from the original implementation recorded in the conversation, including all subsequent user revisions. The surviving `paper-background.js` belongs to this scene and is reused unchanged.

## Reference and visual grammar

E.C.H. / Eiichi Ishii, dailycoding 20220821 / graphic. Screenshot and source supplied by the user. CC BY-NC-SA under the standing instruction; URL not supplied. Source seen, not copied, executed, translated or stored. Artist seal omitted.

The reference uses overlapping white notebook sheets on black, colored rulings or grids, edge perforations, tangled black and colored strokes, and scattered filled marks and rings. Sheets vary in size and overlap with shadows separating layers. Motion is an original extension of the supplied still.

## Approved revisions restored

- Plain square edges, with the perforations removed.
- Fine graphite and muted colored-pencil scribbles instead of heavy ink tangles. Two retraced filaments have varying pressure, opacity and fixed spatial grain that follows the animated paths.
- Warm pale paper background with rapidly evolving crumple shading and stable fiber texture. The original surviving background module uses an irregular lit facet mesh driven by explicit time.
- Occasional staggered clockwise/counterclockwise full turns. Per-panel opportunities recur every 18–32 seconds, with fewer than half selected; turns take 1.7–2.5 seconds with quintic easing.

## Independent geometry and audio

28 seeded panels: eight large sheets across two loose rows, with smaller sheets scattered behind them. Original multi-frequency parametric trajectories create moving pencil tangles rather than porting the source noise-walk. Colored flecks and irregular loops remain as secondary marks. Panel drift, rocking, changing pencil trajectories and fleck movement persist without music.

Bass displaces panels sideways; mids bend scribbles; onsets cause decaying page movement and local bends; highs/residue activate flecks; RMS subtly changes pencil weight; centroid changes ruling weight. Controls are sampled at actual source timestamps with lateral delays.

Existing envelopes: fast 25/160 ms, slow 350/1100 ms, bass 120/850 ms, high residue 10/500 ms, impulse decay 650 ms. Calm/active/extreme parameters interpolate continuously using the restored state module. Seeded element introductions preserve the outgoing scene during partial entry.

## Deliverables

Full-track cache: `assets/analysis/prototype-02.json`. Real track **02:08.000–02:33.000**; `trackTime = 128 + frame / 30`. 25 seconds, 960 × 540, 30 fps, 750 frames, H.264/AAC.

- `renders/prototype-31/signal-lattice-31-scene-ag-25s.mp4`
- `renders/prototype-31/contact-sheet.jpg` — extracted from the MP4
- `renders/prototype-31/render-report.json`
- Source: `src/prototype-31/scene-ag.js`
- Background: `src/prototype-31/paper-background.js`
- Preview: `/pages/prototype-31.html`
- Render: `node scripts/render-prototype-31.mjs`

Reconstruction is based on recorded code from the conversation, not git history. No later scenes or 60-second assembly are modified.
