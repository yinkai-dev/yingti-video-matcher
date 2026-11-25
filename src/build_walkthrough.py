"""Build a 42-second captioned product walkthrough from live matcher results.
Uses original lesson frames. This is an editorial replay, not a screen capture.
Requires Python/Pillow and Node (or set NODE_BIN)."""
import io
import json
import os
import subprocess
from PIL import Image, ImageDraw
from build_media import ROOT, MEDIA, txt, fit, wrap, vp8, webm, line

def clock(t): return f'{t//60:02}:{t%60:02}'
def results():
    script="""
    require('./dist/corpus.js');require('./dist/seeds.js');
    const m=require('./dist/matcher.js'),idx=m.createIndex(YT_CORPUS);
    const pick=q=>m.search(idx,q).map(r=>({video:r.doc.video,title:r.doc.title,course:r.doc.course,start:r.doc.start,
      end:r.doc.end,score:r.score,eligible:r.eligible,poster:r.doc.poster,conflicts:r.conflicts,cues:r.doc.cues}));
    const focus=YT_SEEDS[0],impact=YT_SEEDS[4],empty=YT_SEEDS[5];
    console.log(JSON.stringify({focus,rank:pick(focus),impact,impactRank:pick(impact)[0],empty,emptyCount:pick(empty).filter(x=>x.eligible).length}));
    """
    return json.loads(subprocess.check_output([os.environ.get('NODE_BIN','node'),'-e',script],cwd=ROOT))

def panel(d,x,y,w,h,color="#ffffff",stroke="#cddcd1"):
    d.rounded_rectangle((x,y,x+w,y+h),radius=13,fill=color,outline=stroke,width=2)

def paragraph(d,x,y,s,w,size,clr,leading=1.5):
    for i,row in enumerate(wrap(d,s,w,size)):
        txt(d,x,y+round(i*size*leading),row,size,clr)

def pill(d,x,y,text,w,green=True):
    panel(d,x,y,w,32,"#e0f3e7" if green else "#f9eddb","#e0f3e7" if green else "#f9eddb")
    txt(d,x+10,y+8,text,16,"#216244" if green else "#79501d",True)

def draw(data, stage, phase):
    W,H=1024,576
    im=Image.new("RGB",(W,H),"#f1f5f1");d=ImageDraw.Draw(im)
    deep="#163b2d"; quiet="#466356"
    d.rectangle((0,0,W,57),fill=deep)
    txt(d,33,16,"映题   /   教研工作台",23,"#eff8ef",True)
    txt(d,764,21,"流程演示    ·    样例数据回放",15,"#bbd7c8")
    stages=[
      ("录入一道新题","题干决定所求量，参考答案与解析帮助核对同一道题。"),
      ("同样的数字，讲解可以不同","检索同时核对题设、物理模型和所求量。"),
      ("直接预览对应的 29 秒","点击字幕时间戳，可以从题设跳到推导或结论。"),
      ("确认后，题目才有视频解析","时间区间可以调整。更换候选后，教研可先预览再保存。"),
      ("找不到讲解时，保留缺口","候选证据不足时保持空挂载，记录原因供后续补录。"),
      ("把效果和成本放在一起看","回归结果与缺字幕压力测试分开列出，节省工时由试点计时验证。"),
    ]
    title,sub=stages[stage]
    txt(d,33,80,title,35,deep,True);txt(d,35,133,sub,19,quiet)
    best=data['rank'][0];wrong=next(r for r in data['rank'] if r['video']=='motion' and r['start']==0)
    if stage in (0,4):
        q=data['focus'] if stage==0 else data['empty']
        panel(d,32,181,960,299);pill(d,56,204,q['grade']+'物理',99)
        txt(d,55,258,q['title'],28,deep,True)
        paragraph(d,56,310,q['stem'],887,23,deep)
        if phase>=1:
            txt(d,55,419,("参考答案    "+q['answer']) if stage==0 else "当前题库中的可挂载候选    "+str(data['emptyCount'])+" 个",19,quiet)
    elif stage==1:
        for i,(r,name,note,green) in enumerate([(best,'水平位移','竖直求时间，再计算水平距离。',True),(wrong,'落地速度','相同的高度和初速，视频求合速度。',False)]):
            x=33+i*484;panel(d,x,182,467,301)
            pill(d,x+20,203,'可挂载候选' if green else '所求量不同',113,green)
            txt(d,x+20,269,name,29,deep,True)
            txt(d,x+20,328,r['course'],20,quiet)
            txt(d,x+20,365,clock(r['start'])+' – '+clock(r['end']),24,"#227458")
            if phase>=1:txt(d,x+20,427,note,18,quiet)
    elif stage==2:
        cue=best['cues'][min(phase,2)]
        photo=Image.open(ROOT/'dist'/cue['poster']).convert('RGB').resize((558,314))
        im.paste(photo,(34,178))
        panel(d,610,179,382,312)
        pill(d,630,202,'片段预览',99)
        txt(d,630,269,cue['heading'],25,deep,True)
        txt(d,631,320,clock(int(cue['start'])),28,"#267253",True)
        paragraph(d,631,374,cue['text'],340,18,quiet)
    elif stage==3:
        panel(d,33,183,957,303)
        pill(d,56,207,'已确认挂载',112)
        rows=[('关联题目',data['focus']['title']),('视频来源',best['course']),('讲解起止',clock(best['start'])+' – '+clock(best['end'])),('审核反馈','记录原始推荐、实际选段及操作时间')]
        for i,(k,v) in enumerate(rows):
            if i>1+phase:continue
            y=267+48*i;txt(d,57,y,k,19,quiet);txt(d,256,y,v,21,deep,True)
    else:
        s=data['stats'];p=data['probes']
        for i,(big,lab,desc) in enumerate([(f"{s['top1']} / {s['positive']}",'干净字幕','有解题首选命中'),
                    (f"{p['missingTop']} / {s['positive']}",'字幕缺失压力测试','有解题首选命中'),('¥0','每题外部 API 费用','另计素材、人力和设备')]):
            x=33+i*324;panel(d,x,187,309,282)
            txt(d,x+17,220,lab,19,quiet)
            txt(d,x+17,282,big,43,deep,True)
            txt(d,x+17,400,desc,17,quiet)
    for i in range(6):
        x=34+i*160
        d.rounded_rectangle([x,527,x+150,533],radius=3,fill='#2e7959' if i<=stage else '#cfdbd1')
    txt(d,35,549,'原创样例   ·   高中物理',14,quiet)
    txt(d,860,548,f'{stage+1} / 6',16,quiet)
    return im

def main():
    data=results()
    ev=json.loads((ROOT/'research/results.json').read_text());data.update(stats=ev['stats'],probes=ev['probes'])
    frames=[]
    for stage in range(6):
        for phase in range(3):
            im=draw(data,stage,phase)
            if stage==0 and phase==0:
                im.resize((720,405)).save(MEDIA/'walkthrough.webp',quality=83)
            frames.append((stage*7+phase*7/3,vp8(im)))
    webm(MEDIA/'walkthrough.webm',frames,42,1024,576)
    print('42 s · 6 scenes · 18 frames')
if __name__=='__main__':main()
