"""Measure half-second image changes as a supporting motion check, not a quality score."""
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

results = {}
for version in ['prototype-07', 'prototype-07r']:
    scores = []
    for a, b in [(45, 60), (180, 195), (330, 345)]:
        folder = Path('renders') / version / 'frames'
        with Image.open(folder / f'frame-{a:05d}.png') as x, Image.open(folder / f'frame-{b:05d}.png') as y:
            diff = ImageChops.difference(x.convert('RGB'), y.convert('RGB'))
            scores.append(round(sum(ImageStat.Stat(diff).mean) / 3, 3))
    results[version] = scores
print(json.dumps(results, indent=2))
Path('renders/prototype-07r/motion-comparison.json').write_text(json.dumps(results, indent=2))
