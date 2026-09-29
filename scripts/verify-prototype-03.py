"""Validate analysis and measure mux alignment against the original source."""
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
from scipy.signal import correlate, correlation_lags

ROOT = Path(__file__).resolve().parents[1]


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:a:0',
                          '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype='<f4')


timeline = json.loads((ROOT / 'assets/analysis/prototype-03-timeline.json').read_text())
data = json.loads((ROOT / 'assets/analysis/prototype-02.json').read_text())
data['selection'] = timeline['selection']
times = np.array(data['times'])
assert times[0] == 0 and np.all(np.diff(times) > 0)
assert abs(times[-1] - data['duration']) < 1 / 60 + 1e-6
for group in ['immediate', 'slow']:
    for name, values in data[group].items():
        values = np.array(values)
        assert len(values) == len(times) and np.all(np.isfinite(values)), name
        assert values.min() >= 0 and values.max() <= 1 + 1e-6, name
digest = hashlib.sha256()
with Path(data['source']).open('rb') as handle:
    for chunk in iter(lambda: handle.read(1024 * 1024), b''):
        digest.update(chunk)
assert digest.hexdigest() == data['source_sha256'], 'Source changed'
original = decode(data['source'])
start = data['selection']['start'] * 8000
expected = original[start:start + 40 * 8000]
pcm = decode(ROOT / 'assets/audio/prototype-03-excerpt.wav')
assert len(pcm) == 40 * 8000
# Resampling boundary samples can differ when trimming precedes resampling.
assert np.max(np.abs(expected[100:-100] - pcm[100:-100])) < 1e-4, 'PCM excerpt differs from original interval'
encoded = decode(ROOT / 'renders/prototype-03/signal-lattice-03-40s.mp4')
results = []
for second in [1, 18, 36]:
    sl = slice(second * 8000, (second + 3) * 8000)
    a, b = encoded[sl], expected[sl]
    corr = correlate(a, b, method='fft')
    lags = correlation_lags(len(a), len(b))
    nearby = np.abs(lags) <= 400
    lag = int(lags[nearby][np.argmax(corr[nearby])])
    coefficient = float(np.corrcoef(a, b)[0, 1])
    assert abs(lag) <= 8, f'Audio offset >1 ms: {lag / 8000}'
    assert coefficient > .97, f'Unexpected audio content correlation: {coefficient}'
    results.append(dict(excerpt_second=second, offset_samples_at_8000_hz=lag,
                        offset_ms=lag / 8, source_correlation=coefficient))
report = dict(fullTimelineValid=True, originalSourceUnchanged=True, pcmMatchesSourceInterval=True,
              sourceRange=[data['selection']['start'], data['selection']['end']],
              encodedAudioAlignment=results, toleranceMs=1,
              note='AAC is lossy; correlation checks alignment at beginning, middle and end. Visual feature envelopes intentionally have documented response delays.')
(ROOT / 'renders/prototype-03/audio-verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
