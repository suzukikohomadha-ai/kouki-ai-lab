import sys
from PIL import Image, ImageDraw, ImageFont
src, font, out = sys.argv[1], sys.argv[2], sys.argv[3]
W,H=1280,670
im=Image.open(src).convert('RGB')
s=max(W/im.width,H/im.height); im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
# shift crop right so the platform sits right of the text
x0=min(im.width-W, 0); y0=(im.height-H)//2
im=im.crop((x0,y0,x0+W,y0+H))
ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
navy=(8,30,58)
for x in range(W):
    t=x/860
    a=int(245*(1-t)**1.4) if t<1 else 0
    d.line([(x,0),(x,H)],fill=navy+(a,))
for y in range(H-150,H):  # bottom shade for band/credit
    a=int(150*((y-(H-150))/150)**1.5); d.line([(0,y),(W,y)],fill=navy+(a,))
im=Image.alpha_composite(im.convert('RGBA'),ov)
d=ImageDraw.Draw(im)
def F(size,w):
    f=ImageFont.truetype(font,size); f.set_variation_by_name(w); return f
white=(255,255,255); aqua=(140,214,240)
L=72
d.rectangle([L,150,L+56,156],fill=aqua)
d.text((L,180),'波・風・太陽を、',font=F(70,'Bold'),fill=white)
d.text((L,268),'一つの浮体で。',font=F(70,'Bold'),fill=white)
d.text((L,380),'離島の電源を考える、',font=F(30,'Medium'),fill=(225,238,248))
d.text((L,424),'スウェーデン発の洋上ハイブリッド発電',font=F(30,'Medium'),fill=(225,238,248))
# band
band='NoviOcean｜日本での販売・導入相談：株式会社コホマダ'
fb=F(22,'Medium'); bw=d.textlength(band,font=fb)
d.rounded_rectangle([L-18,H-92,L+bw+18,H-46],radius=6,fill=(255,255,255,235))
d.text((L,H-84),band,font=fb,fill=navy)
cr='イメージ図　画像提供：NoviOcean AB'; fc=F(16,'Regular'); cw=d.textlength(cr,font=fc)
d.text((W-cw-24,H-36),cr,font=fc,fill=(235,240,245))
im.convert('RGB').save(out,'PNG',optimize=True)
