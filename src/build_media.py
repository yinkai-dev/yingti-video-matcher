"""Render the original lessons to seekable VP8/WebM, with Pillow and Python.
Run from any directory. An installed CJK font is required (CJK_FONT may override).
Each WebP picture supplies a standards-compliant VP8 keyframe to the WebM muxer.
"""
import io
import json
import math
import os
import struct
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from lessons import COURSES

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "dist" / "media"
MEDIA.mkdir(parents=True, exist_ok=True)
W, H = 960, 540
INK, MUTED, MINT, AMBER = "#edf6ed", "#a4c5b9", "#8ce7c3", "#f5c779"
DARK = "#123c36"
font_choices = [os.environ.get("CJK_FONT"), "/System/Library/Fonts/Hiragino Sans GB.ttc",
                "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
                "C:/Windows/Fonts/msyh.ttc"]
cjk = next((s for s in font_choices if s and Path(s).is_file()), None)
if not cjk:
    raise SystemExit("Set CJK_FONT to an installed Chinese TrueType/OpenType font.")

@lru_cache(None)
def font(size, heavy=False):
    if heavy and cjk.endswith("Hiragino Sans GB.ttc"):
        return ImageFont.truetype(cjk, size, index=1)
    return ImageFont.truetype(cjk, size)

@lru_cache(None)
def mathfont(size):
    fallback=Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf")
    return ImageFont.truetype(str(fallback),size) if fallback.is_file() else font(size)

def selectfont(words,size,heavy=False):
    return mathfont(size) if any(ch in words for ch in "₀₁₂²½") else font(size,heavy)

def txt(d, x, y, words, size, color=INK, heavy=False):
    d.text((x, y), words, fill=color, font=selectfont(words,size,heavy), anchor="lt")

def fit(d, x, y, words, size, width, color=INK, heavy=False):
    while size > 12 and d.textlength(words, font=selectfont(words,size,heavy)) > width:
        size -= 1
    txt(d, x, y, words, size, color, heavy)

def wrap(d, words, width, size):
    result, current = [], ""
    for char in words:
        if current and d.textlength(current+char, font=selectfont(current+char,size)) > width:
            result.append(current.rstrip())
            current = ""
        current += char
    if current.strip():
        result.append(current.strip())
    return result

def line(d, points, color=MUTED, width=3):
    d.line(points, fill=color, width=width, joint="curve")

def arrow(d, a, b, color=MINT, label=None):
    line(d, [a,b], color, 3)
    dx,dy=b[0]-a[0], b[1]-a[1]
    t=math.atan2(dy,dx)
    p=[(b[0]-12*math.cos(t+i),b[1]-12*math.sin(t+i)) for i in (-.43,.43)]
    d.polygon([b,*p],fill=color)
    if label: txt(d,(a[0]+b[0])/2,(a[1]+b[1])/2-23,label,19,color)

def dashed(d,a,b,color=MUTED):
    dist=math.dist(a,b)
    for pos in range(0, int(dist), 12):
        ends=[min(k/dist,1) for k in (pos,pos+6)]
        line(d,[(a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v) for v in ends],color,2)

def dot(d,x,y,r,color):
    d.ellipse([x-r,y-r,x+r,y+r],fill=color)

def trajectory(d, kind, phase, stage):
    x0,y0,x1,y1=130,162,484,384
    if kind=="slopeflight":
        line(d,[(x0,y0),(525,410)],MUTED,4)
        txt(d,325,323,"θ = 37°",18,AMBER)
    else:
        d.polygon([(55,y0),(x0,y0),(x0,y1),(55,y1)],fill="#29534a")
        line(d,[(55,y0),(x0,y0),(x0,y1)],MUTED,3)
        line(d,[(55,y1),(530,y1)],MUTED,3)
        txt(d,66,252,"5 m",18,AMBER)
    arrow(d,(x0+5,y0),(x0+108,y0),MINT)
    txt(d,x0+39,y0-29,"v₀",23,MINT)
    pts=[(x0+(x1-x0)*t/60,y0+(y1-y0)*(t/60)**2) for t in range(61)]
    for i in range(0,60,3): line(d,pts[i:i+2],MINT,3)
    for n in range(1,7):
        t=n/7
        dot(d,x0+(x1-x0)*t,y0+(y1-y0)*t*t,4,MINT)
    t=min(1,(.32,.64,.98)[phase] + .015*stage)
    dot(d,x0+(x1-x0)*t,y0+(y1-y0)*t*t,9,AMBER)
    dot(d,x0,y0,5,INK)
    if kind=="impact":
        arrow(d,(x1-48,y1-80),(x1+7,y1),AMBER)
        txt(d,x1-14,y1-72,"v",21,AMBER)
    elif kind!="slopeflight":
        dashed(d,(x0,y1+16),(x1,y1+16))
        txt(d,260,y1+18,"x",21,MINT)
    else:
        dashed(d,(x1,y0),(x1,y1))
        dashed(d,(x0+112,y0),(x1,y0))

def incline(d, kind, phase, stage):
    top,base=(95,174),(490,393)
    d.polygon([top,(95,393),base],fill="#28534a")
    line(d,[top,base,(70,393)],MUTED,3)
    txt(d,360,366,"37°",19,AMBER)
    t= (.45-.075*phase if kind=="up" else .34+.075*phase)
    x,y=top[0]+(base[0]-top[0])*t,top[1]+(base[1]-top[1])*t
    u=(.875,.485); n=(.485,-.875)
    def vec(a,b):return (x+u[0]*a+n[0]*b,y+u[1]*a+n[1]*b)
    d.polygon([vec(-27,1),vec(27,1),vec(27,43),vec(-27,43)],fill=MINT)
    origin=vec(0,22)
    arrow(d,origin,(origin[0],origin[1]+82),AMBER)
    txt(d,origin[0]+7,origin[1]+54,"mg",17,AMBER)
    arrow(d,origin,vec(0,104),MINT)
    txt(d,vec(0,104)[0]+5,vec(0,104)[1],"N",17,MINT)
    if kind!="smooth":
        sign=1 if kind=="up" else -1
        arrow(d,origin,vec(sign*94,22),INK)
        txt(d,vec(sign*94,22)[0]+4,vec(sign*94,22)[1]-24,"f",17,INK)
    txt(d,80,411,"取沿斜面方向为坐标轴",16,MUTED)

def circuit(d,kind,phase,stage):
    def resistor(a,b,y,name):
        line(d,[(a,y),(a+12,y)],MINT)
        d.rectangle([a+12,y-12,b-12,y+12],outline=INK,width=3)
        line(d,[(b-12,y),(b,y)],MINT)
        txt(d,(a+b)//2-23,y-48,name,20,AMBER)
    if kind=="series":
        line(d,[(101,235),(101,349),(290,349)],MINT)
        line(d,[(305,349),(480,349),(480,235)],MINT)
        line(d,[(101,235),(133,235)],MINT);resistor(133,240,235,"3 Ω")
        line(d,[(240,235),(316,235)],MINT);resistor(316,423,235,"6 Ω")
        line(d,[(423,235),(480,235)],MINT)
        line(d,[(290,323),(290,375)],AMBER,4);line(d,[(305,337),(305,361)],AMBER,4)
        txt(d,275,385,"9 V",19,AMBER);arrow(d,(116,286),(116,251),MUTED)
    else:
        for y,name in [(216,"3 Ω"),(306,"6 Ω")]:
            line(d,[(132,y),(220,y)],MINT);resistor(220,358,y,name);line(d,[(358,y),(445,y)],MINT)
        line(d,[(132,216),(132,306)],MINT);line(d,[(445,216),(445,306)],MINT)
        arrow(d,(62,259),(126,259),AMBER);line(d,[(445,259),(504,259)],MINT)
        txt(d,50,224,"3 A",19,AMBER);dot(d,132,259,5,INK);dot(d,445,259,5,INK)
        txt(d,164,376,"U₁ = U₂",25,MUTED)
    dot(d,168+22*phase,235 if kind=="series" else 306,4,AMBER)

def collision(d,phase,stage):
    def cart(x,w,y,label,clr):
        d.rounded_rectangle([x,y,x+w,y+44],radius=6,fill=clr)
        txt(d,x+9,y+12,label,18,DARK,True)
        for c in [x+15,x+w-16]: dot(d,c,y+48,9,INK)
    x=142+phase*27 if stage<2 else 236+phase*10
    cart(x,90,266,"2 kg",MINT)
    cart(330 if stage<2 else x+92,76,266,"1 kg",AMBER)
    line(d,[(70,324),(515,324)],MUTED,3)
    arrow(d,(x,231),(x+82,231),MINT)
    txt(d,x,198,"3 m/s" if stage<2 else "2 m/s",19,MINT)
    txt(d,235,371,"水平方向动量守恒",18,MUTED)

def frame(course, lesson, cue, stage, phase):
    _,title,kind,_=lesson
    _,heading,equation,words=cue
    im=Image.new("RGB",(W,H),DARK)
    d=ImageDraw.Draw(im)
    for xx in range(0,W,32): line(d,[(xx,0),(xx,449)],"#1a443c",1)
    for yy in range(0,450,32): line(d,[(0,yy),(W,yy)],"#1a443c",1)
    d.rounded_rectangle([37,29,52,44],radius=4,fill=MINT)
    txt(d,66,29,"映题物理   /   "+course["group"],17,MUTED)
    txt(d,740,29,"例题精讲   ·   板书",17,MUTED)
    line(d,[(39,66),(920,66)],"#3c6054",1)
    txt(d,42,82,title,34,INK,True)
    if kind in ("range","range_alt","impact","slopeflight"):trajectory(d,kind,phase,stage)
    elif kind in ("rough","smooth","up"):incline(d,kind,phase,stage)
    elif kind in ("series","parallel"):circuit(d,kind,phase,stage)
    else:collision(d,phase,stage)
    line(d,[(553,155),(553,412)],"#3d6457",2)
    txt(d,585,176,["题设","推导","结论"][stage],17,AMBER,True)
    fit(d,585,222,heading,27,343,INK,True)
    pieces=equation.split("  ")
    eqs=[p.strip() for p in pieces if p.strip()]
    if len(eqs)==1 and len(equation)>24:
        j=equation.rfind(" = ")
        if j>3:eqs=[equation[:j],equation[j:]]
    for i,s in enumerate(eqs):
        fit(d,585,284+33*i,s.strip(),24,346,MINT)
    d.rectangle([0,449,W,H],fill="#0b2926")
    lines=wrap(d,words,879,21)
    for i,s in enumerate(lines):txt(d,39,464+28*i,s,21,INK)
    return im

def idb(n):
    return n.to_bytes((n.bit_length()+7)//8,"big")
def vsize(n):
    k=next(i for i in range(1,9) if n<(1<<(7*i))-1)
    return ((1<<(7*k))|n).to_bytes(k,"big")
def element(tag,data):
    return idb(tag)+vsize(len(data))+data
def uint(tag,n):return element(tag,idb(n) if n else b'\x00')
def string(tag,s):return element(tag,s.encode())
def vp8(im):
    out=io.BytesIO();im.save(out,format="WEBP",quality=79,method=4)
    data=out.getvalue()
    pos=data.index(b"VP8 ",12);sz=int.from_bytes(data[pos+4:pos+8],"little")
    return data[pos+8:pos+8+sz]

def webm(path,frames,duration,width=W,height=H):
    head=element(0x1a45dfa3,uint(0x4286,1)+uint(0x42f7,1)+uint(0x42f2,4)+uint(0x42f3,8)+string(0x4282,"webm")+uint(0x4287,2)+uint(0x4285,2))
    info=element(0x1549a966,uint(0x2ad7b1,1000000)+string(0x4d80,"Yingti")+string(0x5741,"Yingti")+element(0x4489,struct.pack(">d",duration*1000)))
    tracks=element(0x1654ae6b,element(0xae,uint(0xd7,1)+uint(0x73c5,1)+uint(0x83,1)+uint(0x9c,0)+string(0x86,"V_VP8")+element(0xe0,uint(0xb0,width)+uint(0xba,height))))
    clusters=[];cues=[];offset=len(info)+len(tracks)
    for idx,(t,data) in enumerate(frames):
        stamp=round(t*1000)
        until=frames[idx+1][0] if idx+1<len(frames) else duration
        block=element(0xa0,element(0xa1,b'\x81\x00\x00\x00'+data)+uint(0x9b,round((until-t)*1000)))
        cluster=element(0x1f43b675,uint(0xe7,stamp)+block)
        cues.append(element(0xbb,uint(0xb3,stamp)+element(0xb7,uint(0xf7,1)+uint(0xf1,offset))))
        clusters.append(cluster);offset+=len(cluster)
    path.write_bytes(head+element(0x18538067,info+tracks+b''.join(clusters)+element(0x1c53bb6b,b''.join(cues))))

def build():
    published=[];gold={}
    for course in COURSES:
        single=len(course["lessons"])==1
        t=0;frames=[];cues=[]
        for j,lesson in enumerate(course["lessons"]):
            key,title,_,shots=lesson
            start=t
            for i,cue in enumerate(shots):
                seconds,heading,eq,words=cue
                poster=f"{course['id']}-{len(cues):02}.webp"
                for p in range(3):
                    im=frame(course,lesson,cue,i,p)
                    if not p: im.resize((720,405)).save(MEDIA/poster,quality=83,method=4)
                    frames.append((t+p*seconds/3,vp8(im)))
                # Subtitle timing follows the displayed narrative with a short lead-in/tail.
                cues.append(dict(start=t+(0.65 if not i else .3),end=t+seconds-.5,
                                 text=words,heading=heading,board=eq,poster="media/"+poster))
                t+=seconds
            gold[key]={"video":course["id"],"start":start,"end":t}
        webm(MEDIA/(course["id"]+".webm"),frames,t)
        meta={k:v for k,v in course.items() if k!="lessons"}
        meta.update(duration=t,src="media/"+course["id"]+".webm",cues=cues)
        published.append(meta)
        print(course['id'],t,len(cues),flush=True)
    def enc(obj):return json.dumps(obj,ensure_ascii=False,indent=2)
    (ROOT/"dist/corpus.js").write_text("globalThis.YT_CORPUS = "+enc(published)+";\n")
    (ROOT/"research/editorial.json").write_text(enc(gold)+"\n")
if __name__=="__main__": build()
