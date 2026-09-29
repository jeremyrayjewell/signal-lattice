"""Quick overview of actual rendered representative frames."""
from pathlib import Path
from PIL import Image,ImageDraw
files=list(Path('renders/prototype-08/preflight').glob('*.png'))
sheet=Image.new('RGB',(1440,4*294),'#202b30')
for i,p in enumerate(sorted(files)):
    x=(i%3)*480;y=(i//3)*294
    with Image.open(p) as im: sheet.paste(im.resize((480,270)),(x,y))
    ImageDraw.Draw(sheet).text((x+8,y+275),p.stem,fill='white')
sheet.save('renders/prototype-08/preflight.jpg')
