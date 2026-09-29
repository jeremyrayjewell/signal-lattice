import json
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
out=root/'renders/prototype-71'
study=json.loads((out/'study.json').read_text())
folder=out/'contact-frames';folder.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1480,640),'#0c0c0a')
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',17)
labels=['CALM','CALM > ACTIVE','ACTIVE','TRANSIENT / ACTIVE > EXTREME','EXTREME','EXTREME']
for i,frame in enumerate(study['representativeFrames']):
    target=folder/f'{frame:05d}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'signal-lattice-71-scene-bu-25s.mp4'),'-vf',f'select=eq(n\\,{frame}),scale=480:270','-frames:v','1','-update','1',str(target)],check=True)
    x=10+(i%3)*490;y=10+(i//3)*315
    sheet.paste(Image.open(target),(x,y))
    ImageDraw.Draw(sheet).text((x+4,y+277),f'{labels[i]} / {frame/30:.2f}s',font=font,fill='#d8d8de')
sheet.save(out/'contact-sheet.jpg',quality=94)
