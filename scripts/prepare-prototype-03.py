"""Select a varied excerpt from the existing full-track analysis; schedule four scenes."""
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'assets/analysis/prototype-02.json').read_text())
out = ROOT / 'renders/prototype-03'
out.mkdir(parents=True, exist_ok=True)
protected = [ROOT / f for f in ['index.html', 'prototype-02.html', 'src/sketch.js', 'src/timing.js', 'src/visual-system.js', 'scripts/render-video.mjs', 'scripts/render-prototype-02.mjs']]
protected += list((ROOT / 'src/prototype-02').glob('*.js'))
protected += [ROOT / f'renders/prototype-{v}/{name}' for v, name in [('01', 'signal-lattice-10s.mp4'), ('01', 'contact-sheet.jpg'), ('02', 'signal-lattice-02-25s.mp4'), ('02', 'contact-sheet.jpg')]]
baseline_file = out / 'baseline-hashes.json'
if not baseline_file.exists():
    baseline_file.write_text(json.dumps([dict(Path=str(p), Hash=hashlib.sha256(p.read_bytes()).hexdigest().upper()) for p in protected], indent=2))
for item in json.loads(baseline_file.read_text()):
    assert hashlib.sha256(Path(item['Path']).read_bytes()).hexdigest().upper() == item['Hash']
assert hashlib.sha256(Path(data['source']).read_bytes()).hexdigest() == data['source_sha256']
duration = 40
signals = {k: np.array(v) for k, v in data['slow'].items()}
candidates = []
for start in range(5, int(data['duration']) - duration - 4):
    sl = slice(start * 60, (start + duration) * 60)
    rms = signals['rms'][sl]
    blocks = [np.mean(rms[i:i + 300]) for i in range(0, len(rms), 300)]
    contrast = np.ptp(blocks)
    timbre = sum(np.std(signals[k][sl]) for k in ['bass', 'mid', 'high'])
    score = .25 * np.mean(rms) + .85 * contrast + .35 * timbre
    candidates.append(dict(start=start, score=float(score), contrast=float(contrast)))
ranked = sorted(candidates, key=lambda c: (-c['score'], c['start']))
start = ranked[0]['start']
cuts = []
for offset in [10, 20, 30]:
    target = start + offset
    near = [e for e in data['events'] if abs(e['time'] - target) <= 1.2]
    chosen = max(near, key=lambda e: e['strength'] - .18 * abs(e['time'] - target)) if near else dict(time=target, strength=0)
    frame = round((chosen['time'] - start) * 30)
    before = float(np.mean(signals['rms'][int((chosen['time'] - 2) * 60):int(chosen['time'] * 60)]))
    after = float(np.mean(signals['rms'][int(chosen['time'] * 60):int((chosen['time'] + 2) * 60)]))
    cuts.append(dict(frame=frame, trackTime=start + frame / 30, onsetStrength=chosen['strength'], intensityChange=after - before,
                     durationFrames=round((1.3 + .7 * (1 - chosen['strength'])) * 30)))
clips = []
for i, scene in enumerate('ABCD'):
    clips.append(dict(scene=scene, startFrame=0 if i == 0 else cuts[i - 1]['frame'],
                      transition=None if i == 0 else dict(type='sweep' if i == 2 else 'crossfade', frames=cuts[i - 1]['durationFrames']),
                      paramsFrom=dict(spread=[1, .85, .90, .92][i], activity=.75),
                      paramsTo=dict(spread=[1.08, 1.05, 1.02, 1.06][i], activity=1.05)))
timeline = dict(version=1, width=960, height=540, fps=30, frames=1200,
                selection=dict(start=start, end=start + duration, duration=duration, topCandidates=ranked[:5]),
                analysis='/assets/analysis/prototype-02.json', source=data['source'], source_sha256=data['source_sha256'],
                clips=clips, musicalCues=cuts,
                strategy='Manual A/B/C/D sequence; onset-snapped ten-second targets; transition length follows onset strength. Excerpt selected by sustained intensity contrast and band variation.')
(ROOT / 'assets/analysis/prototype-03-timeline.json').write_text(json.dumps(timeline, indent=2))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', data['source'], '-map', '0:a:0', '-af', f'atrim=start={start}:duration=40,asetpts=PTS-STARTPTS', '-c:a', 'pcm_s24le', str(ROOT / 'assets/audio/prototype-03-excerpt.wav')], check=True)
print(json.dumps(timeline, indent=2))
