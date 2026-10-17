# NoviOcean 開発段階タイムライン図（note記事用）。出典：NoviOcean Validationページ（確認日 2026-10-13）
import sys
from PIL import Image, ImageDraw, ImageFont
font, out = sys.argv[1], sys.argv[2]
W,H=1280,720
navy=(8,30,58); aqua=(30,140,190); grey=(120,132,145); light=(232,240,246); white=(255,255,255)
im=Image.new('RGB',(W,H),white); d=ImageDraw.Draw(im)
def F(s,w):
    f=ImageFont.truetype(font,s); f.set_variation_by_name(w); return f
d.text((60,40),'NoviOceanの開発段階',font=F(40,'Bold'),fill=navy)
d.text((60,96),'同社Validationページの区分。段階5・6は同社の見込み・計画で、時期は変わりえます。',font=F(20,'Regular'),fill=grey)
stages=[('段階1','2016〜2019年','コンセプト開発と\n数値計算による検証','done'),
        ('段階2','2019〜2021年','1/6縮尺模型の\n水槽試験','done'),
        ('段階3','2022〜2025年','1/5縮尺の試験機\n（波＋太陽光）\nを海上試験','done'),
        ('段階4','2026年','デモ機「NO3」\n（波・風・太陽）\nを海上試験','now'),
        ('段階5','2027〜2028年（見込み）','実機サイズの\n初号パイロット','plan'),
        ('段階6','2029年以降（計画）','複数台を並べた\n商用の発電ファーム','plan')]
x0,x1,y=110,1170,330
n=len(stages); xs=[x0+i*(x1-x0)/(n-1) for i in range(n)]
# line: solid up to stage4, dashed after
d.line([(x0,y),(xs[3],y)],fill=navy,width=6)
x=xs[3]
while x<x1:
    d.line([(x,y),(min(x+18,x1),y)],fill=grey,width=6); x+=32
for (lab,yr,desc,st),cx in zip(stages,xs):
    r=22 if st!='now' else 30
    if st=='done': d.ellipse([cx-r,y-r,cx+r,y+r],fill=navy)
    elif st=='now':
        d.ellipse([cx-r-10,y-r-10,cx+r+10,y+r+10],fill=(205,232,244))
        d.ellipse([cx-r,y-r,cx+r,y+r],fill=aqua)
    else: d.ellipse([cx-r,y-r,cx+r,y+r],fill=white,outline=grey,width=5)
    col=navy if st!='plan' else grey
    f1=F(26,'Bold'); w=d.textlength(lab,font=f1); d.text((cx-w/2,y-95),lab,font=f1,fill=col)
    f2=F(18,'Medium')
    for k,t in enumerate([yr]):
        w=d.textlength(t,font=f2); d.text((cx-w/2,y-58),t,font=f2,fill=col)
    f3=F(18,'Regular')
    for k,t in enumerate(desc.split('\n')):
        w=d.textlength(t,font=f3); d.text((cx-w/2,y+50+k*28),t,font=f3,fill=col if st!='now' else navy)
# now badge
cx=xs[3]; b='いま、ここ'; fb=F(22,'Bold'); bw=d.textlength(b,font=fb)
d.rounded_rectangle([cx-bw/2-16,y+148,cx+bw/2+16,y+190],radius=8,fill=aqua)
d.text((cx-bw/2,y+154),b,font=fb,fill=white)
# footer notes
notes=['同社は「実機サイズの装置は現時点で海上では稼働していない」と明記しています。',
       '同社の2026年7月の発表では、初号の商用パイロットの目標を2026〜2027年としています。',
       '出典：NoviOcean AB「Validation」ページ、同社2026年7月18日の記事（確認日 2026年10月17日）をもとに株式会社コホマダ作成']
for k,t in enumerate(notes):
    d.text((60,580+k*34),t,font=F(19,'Regular' if k<2 else 'Light'),fill=navy if k<2 else grey)
im.save(out,'PNG',optimize=True)
