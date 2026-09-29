# Prototype-02: existing audio implementation review

Status: Prototype-02 implemented and rendered using the user-selected track. See [prototype-02-mappings.md](prototype-02-mappings.md) for the selected interval, final mappings, reproduction steps and verification results. Prototype-01 source and artifacts remain unchanged. The review below records the integration decisions made before implementation.

## Approach

librosa RMS, a 2048-sample STFT with a 512-sample hop, mean power in bass (20–180 Hz), mid (180–2000 Hz), and high (2000 Hz upward) bands, onset strength, and beat tracking. Each continuous signal is normalized using its 99th percentile and clipped to [0, 1]. Features have explicit analysis timestamps and are linearly interpolated at requested track time. NPZ caching avoids repeated analysis.

Normalized-index resampling should not be used for synchronization: actual timestamps preserve the analysis hop timing. Excerpt repetition and synthetic fallbacks are inappropriate for a real-track deliverable.

## Integration decisions for the next implementation

- Use the feature extraction and percentile normalization approach above inside Signal Lattice.
- Missing/unreadable audio must produce an error, never substitute synthetic music features.
- Use `trackTime = excerptStart + frame / 30` for both autonomous animation and feature lookup. Trim the actual audio to exactly the same start and duration for muxing.
- Compute immediate and smoothed controls, attack/release envelopes, and transient decay across the source timeline before selecting the excerpt. This preserves musical history at its beginning and permits arbitrary frame order.
- Use source-content and analysis-settings hashes for reproducible cache identification.
- Add spectral centroid as a subtle detail/palette control. Treat beat estimates as estimates; use detected transients where beat reliability is insufficient.
- Retain nested cells; build a new 960 × 540 composition with broad interacting void channels and delayed lateral disturbances. Keep all prototype-01 files and outputs intact.
- Select one active 20–30 second excerpt after examining the real features; do not render a full track.

Proposed mappings: RMS to activity, bass to void bending/width and slow displacement, mids to group articulation, highs to internal rungs and fading detail, transients to decaying traveling structural disturbances, centroid to restrained contrast/detail bias. Exact ranges and decay constants await implementation and evaluation against the provided track.

## Original prerequisite (resolved)

The user subsequently supplied their own source track. Its complete 495-second timeline was analyzed. The selected excerpt is 128–153 seconds; the original source file remains unchanged.
