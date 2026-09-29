# Prototype-03: four-scene architecture

This milestone keeps prototypes 01 and 02 intact and adds an independent 960 × 540, 30 fps, 40-second demonstration. The source interval is **443.000–483.000 seconds (07:23.000–08:03.000)** of the source track. No full-song video is rendered.

## Scene library

| Family                    | Main composition                                                                                                                 | Music response                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A — Lattice banks         | Large open nested brackets separated by two bending horizontal voids.                                                            | Bass bends the voids; RMS changes their width; mids articulate cells; highs move the short internal rungs; transient memory adds local displacement.                                       |
| B — Ribbon currents       | Five broad, filled, sinuous bands spanning the frame, with sparse dark cross-rungs.                                              | Bass changes bend depth, mids change band thickness, transient residue disturbs the curve, highs and their residue alter cross-rungs.                                                      |
| C — Orbital constellation | Three unequal circular clusters: one dominant left-hand form and two smaller satellites, with broad arc gaps and crescent cores. | Bass separates orbital layers; mids offset angular positions; transients displace leading satellites; high-frequency residue changes satellite size; RMS subtly changes outer-line weight. |
| D — Stepped piers         | Seven large, filled architectural slabs with rectangular cutouts, offset ledges and an uneven skyline.                           | Bass shifts structural height, mids affect lean and shelf angle, transients add differing lateral disturbances, and high-frequency residue extends side accents.                           |

A uses **12 × 6 = 72 potential cells**, down from 24 × 12 = 288 in Prototype-02. Outer bracket width increases from 34 to 60 pixels before local scaling. Only two nested outlines and one internal rung remain per motif, replacing three outlines and several small details. Void half-widths are approximately 28–43 pixels before the soft bank boundary. Its identity is retained, but the balance moves toward larger cells and broad negative space. Cells near the void boundary are culled; this draft can show small appearance/disappearance steps at that boundary, a continuity detail for later review rather than a rendering fault.

The new families are original drawing implementations; no external sketch code or scene assets were retrieved or copied. Shared colors connect the scenes while their dominant silhouettes differ. All families keep independent time-driven motion when the audio controls are disabled.

## Analysis and musical structure

The existing full-track analysis is reused without recomputing or modifying it: `assets/analysis/prototype-02.json`, backed by the content-addressed cache `8cf6bb72803a70fa.json`. The original source hash is checked before preparation and after rendering.

The excerpt is selected by a deterministic score over complete 40-second windows: 0.25 × mean slow RMS + 0.85 × range of eight five-second RMS means + 0.35 × summed standard deviations of slow bass/mid/high. This favors sustained contrast, rather than requiring uniformly high intensity. The chosen passage has a 0.664 range of five-second normalized RMS means. Candidate scores are saved in the timeline.

The prototype order A → B → C → D is deliberately authored. Approximate ten-second scene-change targets are snapped to nearby detected transients within ±1.2 seconds, balancing onset strength and distance from the target. Starts are quantized to 30 fps, so cue rounding is at most half a frame. This is not a claim of automatic section detection. Local sustained intensity changes are recorded for future scheduling rules; they do not currently choose the scene family.

## Scene manager

- `src/prototype-03/scenes/` contains one drawing module per family.
- `src/prototype-03/shared.js` supplies the palette, audio context and shared math.
- `src/prototype-03/scene-manager.js` owns the scene registry, pure `stateAt(timeline, frame)` scheduling, parameter interpolation, two reusable offscreen canvases and compositing.
- `assets/analysis/prototype-03-timeline.json` stores source selection, clip start frames, scene IDs, transition settings and per-scene `paramsFrom`/`paramsTo` values.
- `src/prototype-03/sketch.js` connects preview audio playback or explicit offline frames to the manager.

Every scene receives **trackTime = excerptStart + frame / 30**. Audio lookup uses actual analysis timestamps, including pre-excerpt smoothing history. Scene parameters (`spread`, `activity`) interpolate smoothly between each clip's endpoints. Clips can reference any registered family, including repeated families, and durations follow the next clip boundary or the timeline end. Seeking directly into a transition yields the same image as sequential rendering. No simulation warmup or real-time analysis is required.

Inherited audio memory: immediate attack/release 25/160 ms; slow 350/1100 ms; structural bass 120/850 ms; high residue 10/500 ms; transient decay 650 ms. Different bands, clusters or slabs sample delays of up to 420 ms. Autonomous sinusoidal movement continues in quiet passages.

## Transitions

| Change | Excerpt start | Source start | Length              | Mode               |
| ------ | ------------- | ------------ | ------------------- | ------------------ |
| A → B  | 9.533 s       | 07:32.533    | 44 frames / 1.467 s | Smooth crossfade   |
| B → C  | 19.933 s      | 07:42.933    | 42 frames / 1.400 s | Soft lateral sweep |
| C → D  | 28.900 s      | 07:51.900    | 47 frames / 1.567 s | Smooth crossfade   |

Two scenes continue drawing during overlap, both at the same absolute track time. Crossfades use smoothstep opacity; the sweep uses a broad smooth opacity front across eight-pixel strips. There is no fade to a blank frame. Overlap lengths use `1.3 + 0.7 × (1 − onsetStrength)` seconds, rounded to frames, so stronger attacks give shorter transitions. Parameter interpolation occurs within each scene's parameter set; the implementation does not claim arbitrary geometric morphing between incompatible families.

## Run and outputs

```powershell
python scripts/prepare-prototype-03.py
npm run dev
# Preview: http://127.0.0.1:5173/pages/prototype-03.html
node scripts/test-scene-manager.mjs
node scripts/render-prototype-03.mjs
python scripts/verify-prototype-03.py
```

The legacy npm render command remains untouched; use the explicit Prototype-03 render command above for this milestone.

- Video: `renders/prototype-03/signal-lattice-03-40s.mp4`
- Contact sheet: `renders/prototype-03/contact-sheet.jpg` (A, B, C, D in reading order)
- Timeline: `assets/analysis/prototype-03-timeline.json`
- Audio excerpt: `assets/audio/prototype-03-excerpt.wav` (lossless source trim)
- Render checks: `renders/prototype-03/verification.json`
- Audio checks: `renders/prototype-03/audio-verification.json`

The contact sheet is decoded from final MP4 frames 120, 440, 740 and 1050. Each family is shown after its transition completes. Encoding uses H.264 CRF 18, yuv420p, and 48 kHz stereo AAC at 320 kb/s. The audio source interval is trimmed using `atrim`/`asetpts`; the original WAV is never altered.

## Verification and limits

Checks cover scene boundaries, monotonically increasing blend weights, deterministic overlap frames after reordered access, reload determinism, audio-master preview timing, audio influence and autonomous motion for each scene, 1,200 unique frames, video/audio duration and start timestamps, full decoding, browser playback, preserved baseline hashes, and source-audio correlation at three excerpt positions.

Completed results: all checks passed, with no browser errors. The MP4 contains 1,200 video frames and 40-second video/audio streams beginning at zero. Source comparisons at excerpt seconds 1, 18 and 36 found zero measured audio offset (8 kHz comparison resolution), with correlations of 0.999968, 0.999990 and 0.999830. Original track and protected prototype hashes are unchanged. The final contact sheet was inspected at half-size scene resolution to confirm distinct macro silhouettes. No synchronization or rendering fault remains.

There is no intended full-track blocker in the scene architecture. A full version still needs an authored long-form timeline and corresponding duration configuration in the prototype rendering wrapper. The excerpt selector is a contrast heuristic, not a final structural music detector. Retaining every PNG will consume substantial disk space for long renders; browser builds should remain pinned for pixel reproducibility. Visual acceptance, scene balance and transition taste remain for review before expanding the timeline.
