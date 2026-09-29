"""Representative frames from the final MP4, labeled by scene and internal state."""
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
timeline=json.loads((root/'assets/analysis/prototype-09-timeline.json').read_text())
out=root/'renders/prototype-09'
samples=out/'contact-frames'
samples.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1480,1320),'#15292e')
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',17)
names=dict(A='Lattice Banks',B='Ribbon Currents',C='Orbital Constellation',D='Stepped Piers',E='Convergent Filaments',F='Cellular Territories',G='Opposed Fans',H='Fractured Monument',I='Chromatic Veils',J='Neon Faultlines',K='Gestural Dials')
for i,item in enumerate(timeline['representatives']):
    frame=item['frame']
    target=samples/f'{i:02d}-{item["scene"]}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'signal-lattice-09-90s.mp4'),'-vf',f'select=eq(n\\,{frame}),scale=480:270','-frames:v','1','-update','1',str(target)],check=True)
    x=8+(i%3)*492;y=8+(i//3)*328
    sheet.paste(Image.open(target),(x,y))
    draw=ImageDraw.Draw(sheet)
    draw.text((x+6,y+275),f'{item["scene"]}  {names[item["scene"]]}',font=font,fill='#e8e2ce')
    state=item['state'].replace(' → ',' > ')
    draw.text((x+6,y+297),f'{state}   {frame/30:.2f}s',font=font,fill='#6eaaa4')
sheet.save(out/'contact-sheet.jpg',quality=94)

# Representative midpoint from each transition mechanism, from the SAME encoded MP4.
transitions=Image.new('RGB',(984,652),'#15292e')
seen=set()
for index,clip in enumerate(timeline['clips']):
    transition=clip.get('transition')
    if not transition or transition['type'] in seen: continue
    slot=len(seen);seen.add(transition['type'])
    frame=clip['startFrame']+transition['frames']//2
    target=samples/f'transition-{transition["type"]}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'signal-lattice-09-90s.mp4'),'-vf',f'select=eq(n\\,{frame}),scale=480:270','-frames:v','1','-update','1',str(target)],check=True)
    x=8+(slot%2)*488;y=8+(slot//2)*326
    transitions.paste(Image.open(target),(x,y))
    ImageDraw.Draw(transitions).text((x+6,y+277),f'{timeline["clips"][index-1]["scene"]} > {clip["scene"]}: {transition["type"]}',font=font,fill='#e8e2ce')
transitions.save(out/'transition-sheet.jpg',quality=94)

# Identical track times for an honest previous/revised comparison of A-H.
comparison=Image.new('RGB',(1296,880),'#141323')
old=root/'renders/prototype-08/contact-frames'
for family_index,family in enumerate('ABCDEFGH'):
    old_frame=next(old.glob(f'*-{family}.png'))
    new_frame=next(samples.glob(f'*-{family}.png'))
    row=family_index//2;pair=family_index%2
    for version,source in enumerate([old_frame,new_frame]):
        x=8+pair*648+version*324;y=8+row*220
        with Image.open(source) as im:comparison.paste(im.resize((320,180)),(x,y))
        ImageDraw.Draw(comparison).text((x+4,y+188),f'{family}: {"previous" if version==0 else "revised"}',font=font,fill='#f4efff')
comparison.save(out/'comparison-sheet.jpg',quality=94)
