import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
out=root/'renders/segment-07'
timeline=json.loads((root/'assets/analysis/segment-07-timeline.json').read_text())
folder=out/'contact-frames';folder.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1460,1160),'#121212')
font=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',14)
for i,clip in enumerate(timeline['clips']):
    end=timeline['clips'][i+1]['startFrame'] if i+1<len(timeline['clips']) else timeline['frames']
    frame=min(end-1,clip['startFrame']+max(60,(end-clip['startFrame'])*3//4))
    target=folder/f'{frame:05d}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'signal-lattice-segment-07-60s.mp4'),'-vf',f'select=eq(n\\,{frame}),scale=400:225','-frames:v','1','-update','1',str(target)],check=True)
    im=Image.open(target).resize((360,203))
    x=5+(i%4)*365;y=5+(i//4)*230
    sheet.paste(im,(x,y))
    seconds=timeline['selection']['start']+frame/30
    ImageDraw.Draw(sheet).text((x+3,y+206),f'#{81+i} / {clip["scene"]} / {seconds:.2f}s',font=font,fill='#eeeeee')
sheet.save(out/'contact-sheet.jpg',quality=94)
