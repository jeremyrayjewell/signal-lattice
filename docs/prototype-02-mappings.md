# Prototype-02: horizontal music response

Selected source interval: **128.000–153.000 seconds (02:08.000–02:33.000)**, 25 seconds. Full-track analysis selected this window with score 0.378733. It contains 84 detected transients. Immediate normalized bass ranges 0.029–0.997, mids 0.196–0.995, highs 0.010–0.988, and RMS 0.347–1.000.

Outputs: `renders/prototype-02/signal-lattice-02-25s.mp4`, `renders/prototype-02/contact-sheet.jpg`, full-track content-addressed cache `assets/analysis/8cf6bb72803a70fa.json`, and browser analysis copy `assets/analysis/prototype-02.json`.

## Reproduce

```powershell
python scripts/analyze-audio.py '/path/to/your/track.wav'
npm run dev
# Open http://127.0.0.1:5173/pages/prototype-02.html
node scripts/render-prototype-02.mjs
python scripts/verify-prototype-02.py
```

Python dependencies: NumPy, SciPy and librosa (recorded versions in the analysis JSON). FFmpeg/ffprobe and the browser prerequisites from the baseline still apply. Preview playback/seek uses the real audio element as clock. The canvas contains no typography. The baseline entry point and all prototype-01 files remain unchanged; the new entry point is `pages/prototype-02.html`.

Initial analysis stalled while Numba probed the protected Python installation for cache files, including outside the sandbox. This was resolved by setting a writable project-local `NUMBA_CACHE_DIR` inside the analysis script. This is an environment fix, not a change of feature algorithm or a synthetic fallback.

## Analysis and master time

The complete 495-second source is analyzed before choosing a 25-second excerpt. The source file is read only. The method uses RMS, STFT band power, onset strength, beat tracking, 99th-percentile normalization, and interpolation at actual timestamps. Analysis uses mono 22050 Hz, FFT size 2048, hop 512; audio for the video retains the source sample rate and channels until AAC encoding. The analysis resampling does not affect mux audio quality.

Features: RMS; bass 20–180 Hz; mids 180–2000 Hz; highs 2000–11025 Hz; onset strength; detected transient times/strengths; spectral centroid; estimated beat times/BPM. Beat estimates are recorded but do not impose a metrical grid on the visuals. Transients use normalized onset height >=0.20, prominence >=0.12 and minimum separation 8/60 seconds.

Normalized features are interpolated onto a timestamped 60 Hz control timeline. Each 25-second candidate, starting at an integer source second, is scored using 0.25 × mean RMS + 0.30 × RMS standard deviation + 0.20 × sum of bass/mid/high standard deviations + 0.25 × mean onset strength. Highest score wins, with earlier start breaking ties. Selected range and the top eight candidates are stored under `selection` in the JSON.

Every frame uses `trackTime = excerptStart + frame / 30`. Autonomous motion also uses that absolute track time. History is precomputed from track start, so seeking and out-of-order rendering never reset envelopes. The source SHA-256 and analysis settings identify the cache. Missing audio fails explicitly; there is no synthetic fallback.

## Final mappings

| Feature           | Visual effect                                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slow RMS          | Each channel is up to 16 px wider in quieter sections, exposing more negative space.                                                                                                                                             |
| Immediate RMS     | Local cursor excursion increases by up to 3 px, with independent cell phases.                                                                                                                                                    |
| Bass with inertia | Upper/lower channel bend amplitudes gain up to 38/26 px; width gains up to 6 px; cell banks shift by up to 7 px.                                                                                                                 |
| Immediate mids    | Group rotation amplitude gains up to 0.48 rad; nested layer articulation gains up to 0.08 rad per layer. Groups have different phases.                                                                                           |
| Slow mids         | Nested hinge displacement gains up to 2 px per layer.                                                                                                                                                                            |
| Immediate highs   | Rung travel gains up to 8 px with independent rung/cell phases; sparse channel stitches gain up to 3 px.                                                                                                                         |
| High residue      | Selected cells retain short extending detail strokes (5 px horizontal / 7 px vertical) and up to 0.8 px extra stroke weight.                                                                                                     |
| Transient events  | Local disturbances travel at 560 px/s, alternating direction from event time. Gaussian width 115 px; displacement up to 13 px horizontally and 10 px vertically; rotation up to 0.24 rad. Superposed influence is clamped to ±1. |
| Slow centroid     | Outer-line stroke weight gains up to 0.25 px. Restrained contrast bias; palette stays paper/teal/terracotta.                                                                                                                     |

The 24-column × 12-row field uses two broad, asymmetric, horizontally meandering voids and three cell banks. Channels narrow, widen and bend continuously; this milestone does not implement explicit topological splitting/merging. Independent low-frequency waves keep the system moving during quiet passages. Groups across the width sample controls with 0–0.42 seconds of delay; transient wave fronts are spatially localized rather than a frame-wide pulse.

## Musical memory

All envelope constants are exponential time constants (63.2% response), not completion times. Computation is causal on the control timeline; centered STFT windows provide roughly ±46 ms measurement support.

| Control                      | Attack                 | Release / decay                                 |
| ---------------------------- | ---------------------- | ----------------------------------------------- |
| Immediate signals            | 25 ms                  | 160 ms                                          |
| Slow signals                 | 350 ms                 | 1100 ms                                         |
| Structural bass              | 120 ms                 | 850 ms                                          |
| High-detail residue          | 10 ms                  | 500 ms                                          |
| Traveling onset disturbances | Immediate event launch | 650 ms exponential decay; discarded after 3.5 s |

The analysis also stores a 650 ms peak-hold transient envelope for reuse; current traveling disturbances use event times directly with the same decay, preserving spatial wave fronts. No per-render mutable simulation state is needed.

## Encoding and verification

960 × 540, 30 fps, 750 frames, H.264 CRF 18, yuv420p, AAC 320 kb/s. Audio is decoded and precisely trimmed to the source interval with `atrim`/`asetpts`, stored as 24-bit PCM WAV, then muxed with the frame sequence. Six contact-sheet images are decoded from MP4 frames 0, 149, 299, 449, 599 and 749.

Verification checks audio-master preview timing; byte-identical frame 317 after reordered access and reload; autonomous movement with audio influence disabled; changed pixels when audio influence is enabled; 750 unique frames; full video/audio decoding; timestamps/durations; browser playback; original source hash; unchanged baseline hashes; and measured AAC alignment against the original at three positions. Reports are in `renders/prototype-02/`.

Completed results: all checks passed. Decoded AAC has zero measured offset at excerpt seconds 1, 11 and 21 (8 kHz comparison; 0.125 ms sample resolution), with source correlations above 0.99996. Both streams start at zero. The PCM excerpt matches the original interval, and the source and baseline hashes are unchanged. No synchronization fault was found. The intentional smoothing and lateral propagation delays described above remain part of the visual behavior.

No full-song rendering is performed. No known architectural blocker to a later full-track render is expected; serial PNG capture will cost time/disk space and browser builds must be pinned for cross-machine pixel reproducibility. The present controls are not a song-length scene arrangement. Perceptual acceptance of the musical mapping remains for the user to judge from the MP4.
