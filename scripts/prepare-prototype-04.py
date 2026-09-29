"""Author a 75-second scene/state study using the existing full-track cache."""
import hashlib
import json
from pathlib import Path
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'assets/analysis/prototype-02.json').read_text())
out = ROOT / 'renders/prototype-04'
out.mkdir(parents=True, exist_ok=True)
protected = list((ROOT / 'src/prototype-03').rglob('*.js')) + [ROOT / 'prototype-03.html', ROOT / 'scripts/render-prototype-03.mjs', ROOT / 'assets/analysis/prototype-03-timeline.json']
protected += [ROOT / 'renders/prototype-03' / n for n in ['signal-lattice-03-40s.mp4', 'contact-sheet.jpg']]
baseline = out / 'baseline-hashes.json'
if not baseline.exists():
    baseline.write_text(json.dumps([dict(path=str(p), sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in protected], indent=2))
for item in json.loads(baseline.read_text()):
    assert hashlib.sha256(Path(item['path']).read_bytes()).hexdigest() == item['sha256']
signals = {k: np.array(v) for k, v in data['slow'].items()}
candidates = []
for start in range(15, int(data['duration']) - 90):
    sl = slice(start * 60, (start + 75) * 60)
    rms = signals['rms'][sl]
    blocks = [np.mean(rms[i:i+300]) for i in range(0, len(rms), 300)]
    # Demand activity throughout most of the excerpt while retaining sustained contrasts.
    score = .3 * np.mean(rms) + .6 * np.std(blocks) + .3 * sum(np.std(signals[k][sl]) for k in ['bass', 'mid', 'high'])
    candidates.append(dict(start=start, score=float(score)))
ranked = sorted(candidates, key=lambda c: (-c['score'], c['start']))
start = ranked[0]['start']
sequence = [
    ('A', 0, 'CALM', 'CALM', 'crossfade'),
    ('E', 7, 'CALM', 'ACTIVE', 'sweep'),
    ('F', 15, 'ACTIVE', 'EXTREME', 'structural'),
    ('G', 23, 'ACTIVE', 'EXTREME', 'crossfade'),
    ('C', 30, 'CALM', 'CALM', 'crossfade'),
    ('B', 37, 'ACTIVE', 'EXTREME', 'sweep'),
    ('H', 44, 'EXTREME', 'ACTIVE', 'crossfade'),
    ('D', 52, 'ACTIVE', 'CALM', 'crossfade'),
    ('A', 59, 'EXTREME', 'EXTREME', 'sweep'),
    ('C', 67, 'EXTREME', 'EXTREME', 'crossfade'),
]
clips = []
for i, (scene, offset, state_from, state_to, transition) in enumerate(sequence):
    near = [e for e in data['events'] if abs(e['time'] - (start + offset)) <= .5]
    cue = max(near, key=lambda e: e['strength'] - .3 * abs(e['time'] - start - offset)) if near else dict(time=start+offset, strength=0)
    frame = 0 if i == 0 else round((cue['time'] - start) * 30)
    clips.append(dict(scene=scene, startFrame=frame, stateFrom=state_from, stateTo=state_to, variant=i,
                      transition=None if i == 0 else dict(type=transition, frames=72 if transition == 'structural' else 42),
                      onsetStrength=cue['strength']))
representatives = []
for i, clip in enumerate(clips):
    end = clips[i+1]['startFrame'] if i+1 < len(clips) else 2250
    frame = round(clip['startFrame'] + (end-clip['startFrame']) * .7)
    representatives.append(dict(frame=frame, scene=clip['scene'], state=f"{clip['stateFrom']} → {clip['stateTo']}"))
timeline = dict(version=1, width=960, height=540, fps=30, frames=2250,
                selection=dict(start=start, end=start+75, duration=75, topCandidates=ranked[:5]),
                analysis='/assets/analysis/prototype-02.json', source=data['source'], source_sha256=data['source_sha256'],
                clips=clips, representatives=representatives)
(ROOT / 'assets/analysis/prototype-04-timeline.json').write_text(json.dumps(timeline, indent=2))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', data['source'], '-map', '0:a:0', '-af', f'atrim=start={start}:duration=75,asetpts=PTS-STARTPTS', '-c:a', 'pcm_s24le', str(ROOT / 'assets/audio/prototype-04-excerpt.wav')], check=True)
print(json.dumps(timeline, indent=2))
