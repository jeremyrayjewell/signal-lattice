"""Author a short all-family study, snapping transitions to cached real onsets."""
import json
import hashlib
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'assets/analysis/prototype-02.json').read_text())
start=128
sequence=[('A','CALM','ACTIVE',None),('E','ACTIVE','EXTREME','weave'),('F','ACTIVE','EXTREME','structural'),('G','ACTIVE','EXTREME','crossfade'),('C','ACTIVE','EXTREME','sweep'),('K','ACTIVE','EXTREME','crossfade'),('I','CALM','EXTREME','weave'),('B','ACTIVE','EXTREME','crossfade'),('J','ACTIVE','EXTREME','weave'),('H','EXTREME','ACTIVE','crossfade'),('D','ACTIVE','EXTREME','sweep'),('A','EXTREME','ACTIVE','weave')]
clips=[]
for i,(scene,a,b,transition) in enumerate(sequence):
    desired=start+i*7.5
    nearby=[e for e in data['events'] if abs(e['time']-desired)<.65]
    event=max(nearby,key=lambda e:e['strength']) if nearby else None
    frame=round(((event['time'] if event else desired)-start)*30) if i else 0
    clips.append(dict(scene=scene,startFrame=frame,stateFrom=a,stateTo=b,variant=i,transition=dict(type=transition,frames=90) if i else None,onsetStrength=event['strength'] if event else None))
timeline=dict(version=1,width=960,height=540,fps=30,frames=2700,selection=dict(start=start,end=start+90,duration=90),analysis='/assets/analysis/prototype-02.json',source=data['source'],source_sha256=data['source_sha256'],clips=clips)
timeline['representatives']=[dict(frame=round((c['startFrame']+ (clips[i+1]['startFrame'] if i+1<len(clips) else 2700))/2)+25,scene=c['scene'],state=c['stateFrom']+' > '+c['stateTo']) for i,c in enumerate(clips)]
(root/'assets/analysis/prototype-08-timeline.json').write_text(json.dumps(timeline,indent=2))
out=root/'renders/prototype-08'
out.mkdir(exist_ok=True)
files=[p for p in (root/'src').rglob('*.js') if 'prototype-08' not in p.parts]
(out/'baseline-hashes.json').write_text(json.dumps([dict(path=str(p),sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files],indent=2))
subprocess.run(['ffmpeg','-y','-v','error','-i',data['source'],'-ss','128','-t','90','-c:a','pcm_s24le',str(root/'assets/audio/prototype-08-excerpt.wav')],check=True)
print('Prepared 90 seconds / 12 appearances / 11 scene families, onset-aligned 3-second transitions.')
