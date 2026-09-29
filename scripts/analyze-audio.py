"""Full-track audio feature extraction: RMS, band power, onsets, and beat tracking."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess

# A project-local JIT cache avoids probing protected Python installation folders.
ROOT = Path(__file__).resolve().parents[1]
cache_dir = ROOT / 'renders' / 'prototype-02' / 'numba-cache'
cache_dir.mkdir(parents=True, exist_ok=True)
os.environ['NUMBA_CACHE_DIR'] = str(cache_dir)

import librosa
import numpy as np
from scipy.signal import find_peaks

SETTINGS = dict(version=1, sample_rate=22050, n_fft=2048, hop=512, control_rate=60,
                normalization_percentile=99, excerpt_duration=25,
                fast_attack=0.025, fast_release=0.16, slow_attack=0.35,
                slow_release=1.1, bass_attack=0.12, bass_release=0.85,
                high_attack=0.01, high_release=0.5, transient_decay=0.65)


def command(args):
    return subprocess.run(args, check=True, capture_output=True).stdout


def normalize(x):
    peak = float(np.percentile(x, 99))
    return np.clip(x / peak, 0, 1) if peak > 1e-8 else np.zeros_like(x)


def envelope(x, attack, release):
    out = np.zeros_like(x)
    previous = 0.0
    for i, value in enumerate(x):
        tau = attack if value > previous else release
        previous += (1 - np.exp(-1 / (60 * tau))) * (value - previous)
        out[i] = previous
    return out


def analyze(source):
    if not source.is_file():
        raise FileNotFoundError(source)
    digest = hashlib.sha256()
    with source.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    source_hash = digest.hexdigest()
    key = hashlib.sha256((source_hash + json.dumps(SETTINGS, sort_keys=True)).encode()).hexdigest()
    folder = ROOT / 'assets' / 'analysis'
    folder.mkdir(parents=True, exist_ok=True)
    cache = folder / f'{key[:16]}.json'
    if cache.exists():
        result = json.loads(cache.read_text())
    else:
        # Decode the complete source. Resampling is for analysis only; the mux uses original audio.
        raw = command(['ffmpeg', '-v', 'error', '-i', str(source), '-map', '0:a:0', '-ac', '1', '-ar', '22050', '-f', 'f32le', '-'])
        y = np.frombuffer(raw, dtype='<f4').copy()
        sr, hop, fft = 22050, 512, 2048
        duration = len(y) / sr
        if duration < 25:
            raise ValueError('Track must contain at least 25 seconds; no looping or synthetic fallback.')
        print(f'Analyzing FULL track: {duration:.3f}s', flush=True)
        magnitude = np.abs(librosa.stft(y, n_fft=fft, hop_length=hop))
        print('Full-track STFT complete.', flush=True)
        power = magnitude ** 2
        frequencies = librosa.fft_frequencies(sr=sr, n_fft=fft)
        raw_features = dict(rms=librosa.feature.rms(y=y, frame_length=fft, hop_length=hop)[0],
                            onset=librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop),
                            centroid=librosa.feature.spectral_centroid(S=magnitude, sr=sr)[0])
        for name, lo, hi in [('bass', 20, 180), ('mid', 180, 2000), ('high', 2000, sr / 2 + 1)]:
            raw_features[name] = power[(frequencies >= lo) & (frequencies < hi)].mean(axis=0)
        times = np.arange(int(np.floor(duration * 60)) + 1) / 60
        values = {name: np.interp(times, np.arange(len(x)) * hop / sr, normalize(x)) for name, x in raw_features.items()}
        immediate = {name: envelope(x, .025, .16) for name, x in values.items()}
        slow = {name: envelope(x, .35, 1.1) for name, x in values.items()}
        slow['bass'] = envelope(values['bass'], .12, .85)
        peaks, _ = find_peaks(values['onset'], height=.2, prominence=.12, distance=8)
        events = [dict(time=float(times[i]), strength=float(values['onset'][i])) for i in peaks]
        residue = envelope(values['high'], .01, .5)
        pulse = np.zeros_like(times)
        pulse[peaks] = values['onset'][peaks]
        for i in range(1, len(pulse)):
            pulse[i] = max(pulse[i], pulse[i - 1] * np.exp(-1 / (60 * .65)))
        tempo, beat_frames = librosa.beat.beat_track(onset_envelope=raw_features['onset'], sr=sr, hop_length=hop)
        print('Features, envelopes and beat estimates complete.', flush=True)
        # Score complete windows using real activity AND contrast, not just peak volume.
        candidates = []
        for start in range(0, int(duration - 25) + 1):
            sl = slice(start * 60, (start + 25) * 60)
            score = (.25 * np.mean(values['rms'][sl]) + .30 * np.std(values['rms'][sl])
                     + .20 * sum(np.std(values[k][sl]) for k in ['bass', 'mid', 'high'])
                     + .25 * np.mean(values['onset'][sl]))
            candidates.append(dict(start=start, score=float(score)))
        ranked = sorted(candidates, key=lambda c: (-c['score'], c['start']))
        selected = ranked[0]['start']
        result = dict(source=str(source.resolve()), source_sha256=source_hash, cache_key=key,
                      settings=SETTINGS, duration=duration, analyzed_range=[0, duration],
                      versions=dict(numpy=np.__version__, librosa=librosa.__version__),
                      times=times.tolist(), immediate={k: v.tolist() for k, v in immediate.items()},
                      slow={k: v.tolist() for k, v in slow.items()}, high_residue=residue.tolist(),
                      transient=pulse.tolist(), events=events,
                      beat_times=librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop).tolist(),
                      estimated_bpm=float(np.asarray(tempo).reshape(-1)[0]),
                      beat_policy='Estimated beats recorded; detected transients drive visuals without assuming a reliable metrical grid.',
                      selection=dict(start=selected, end=selected + 25, duration=25, top_candidates=ranked[:8]),
                      cache_file=str(cache.relative_to(ROOT)).replace('\\', '/'))
        cache.write_text(json.dumps(result, separators=(',', ':'), allow_nan=False))
    (folder / 'prototype-02.json').write_text(json.dumps(result, separators=(',', ':'), allow_nan=False))
    audio = ROOT / 'assets' / 'audio'
    audio.mkdir(parents=True, exist_ok=True)
    start = result['selection']['start']
    # Decode then trim: exact source-time interval, preserving source rate/channels in PCM.
    command(['ffmpeg', '-y', '-v', 'error', '-i', str(source), '-map', '0:a:0', '-af',
             f'atrim=start={start}:duration=25,asetpts=PTS-STARTPTS', '-c:a', 'pcm_s24le', str(audio / 'prototype-02-excerpt.wav')])
    print(json.dumps({k: result[k] for k in ['duration', 'selection', 'cache_file', 'estimated_bpm']}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    analyze(parser.parse_args().source)
