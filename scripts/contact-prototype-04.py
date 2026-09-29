"""Representative frames from the final MP4, labeled by scene and internal state."""
import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
timeline=json.loads((root/'assets/analysis/prototype-04-timeline.json').read_text())
out=root/'renders/prototype-04'
samples=out/'contact-frames'
samples.mkdir(exist_ok=True)
sheet=Image.new('RGB',(984,1642),'#15292e')
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',17)
names=dict(A='Lattice Banks',B='Ribbon Currents',C='Orbital Constellation',D='Stepped Piers',E='Convergent Filaments',F='Cellular Territories',G='Opposed Fans',H='Fractured Monument')
for i,item in enumerate(timeline['representatives']):
    frame=item['frame']
    target=samples/f'{i:02d}-{item["scene"]}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'signal-lattice-04-75s.mp4'),'-vf',f'select=eq(n\\,{frame}),scale=480:270','-frames:v','1','-update','1',str(target)],check=True)
    x=8+(i%2)*488;y=8+(i//2)*326
    sheet.paste(Image.open(target),(x,y))
    draw=ImageDraw.Draw(sheet)
    draw.text((x+6,y+275),f'{item["scene"]}  {names[item["scene"]]}',font=font,fill='#e8e2ce')
    state=item['state'].replace(' → ',' > ')
    draw.text((x+6,y+297),f'{state}   {frame/30:.2f}s',font=font,fill='#6eaaa4')
sheet.save(out/'contact-sheet.jpg',quality=94)
