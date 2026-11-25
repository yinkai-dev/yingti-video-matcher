/* The index is built from the picture text and timed captions only. No exam or gold IDs. */
(() => {
  'use strict';
  const version = 'yt-physics-1.1';
  const normalize = value => (value || '').normalize('NFKC').toLowerCase()
    .replace(/每秒平方/g, '/s2').replace(/千米每小时|公里每小时/g, 'km/h')
    .replace(/米每秒|米每二次方秒/g, m => m === '米每秒' ? 'm/s' : 'm/s2')
    .replace(/欧姆/g, 'ω').replace(/千克|公斤/g, 'kg').replace(/安培/g, 'a')
    .replace(/伏特/g, 'v').replace(/厘米/g, 'cm').replace(/毫秒/g, 'ms')
    .replace(/米(?=\s*[/／])|米/g, 'm').replace(/秒/g, 's').replace(/度(?=角)|(?<=\d)度/g, '°')
    .replace(/([零一二两三四五六七八九十]+)(?=\s*(?:m|s|ω|v|a|kg|°|安|伏|欧)(?![a-z]))/g, (_, n) => {
      const digits = '零一二三四五六七八九';
      n = n.replace(/两/g, '二');
      if (n.includes('十')) {
        const [a,b] = n.split('十'); return String((a ? digits.indexOf(a) : 1)*10+(b ? digits.indexOf(b) : 0));
      }
      return [...n].map(c => digits.indexOf(c)).join('');
    });
  const topics = [
    ['平抛运动', /平抛|沿水平(?:方向)?.{0,18}(?:扔|抛|投|射)出|水平(?:向[左右])?(?:抛|飞|投|射)出?|水平(?:方向)?初速度|沿水平(?:方向)?(?:抛|射|扔)|横向抛|平台边缘|桌边飞出/],
    ['斜面模型', /斜面|斜坡|坡面|坡顶|沿坡/], ['电阻电路', /电阻|串联|并联|支路|分流|分压|欧姆|ω/],
    ['碰撞模型', /碰撞|碰后|相撞|撞上|相碰|粘合|黏合|动量|相粘|撞击/],
    ['电容器', /电容|电介质/], ['弹簧', /弹簧|弹性势能/], ['磁场', /磁场|磁感应强度/],
    ['振动', /简谐|振子|单摆/], ['光学', /透镜|折射|焦距/]
  ];
  const methods = [
    ['分运动', /分解|分速度|水平方向|竖直方向|水平匀速|自由落体|飞行时间|分运动|水平位移/],
    ['矢量合成', /勾股|矢量合成|互相垂直|合速度|合成|平方和/],
    ['牛顿第二定律', /牛顿|合力|重力分量|重力.*分解|受力|支持力|加速度/],
    ['滑动摩擦', /动摩擦|滑动摩擦|摩擦力|摩擦因数/],
    ['欧姆定律', /欧姆|分压|分流|电压相等|电流相同|总电阻|支路电流|i\s*=\s*u/],
    ['动量守恒', /动量|外力冲量|外力.*零/]
  ];
  const goals = [
    ['水平距离', /水平(?:方向的?)?(?:位移|射程|距离|落点)|射程|多远|水平相距|离.{0,12}(?:正下方|底边).{0,4}(?:多远|距离)|落点位置/],
    ['速度大小', /落地(?:瞬间|时|前)?的?(?:合?速度|速率)|着地(?:时|前)?的?(?:合?速度|速率)|共同速度|碰后.{0,8}(?:速度|速率)|速度的大小|速率|有多快|末速|共速|一起运动的速度|共同运动.{0,4}速度/],
    ['时间', /时间|时长|多久|多长时间|何时|几秒|几s|多长的时间/],
    ['加速度', /加速度|速度变化率/], ['电压', /分压|电势差|电压|多少伏/],
    ['电流', /分流|电流|多少安/], ['能量', /动能|热量|机械能|能量损失|发热/],
    ['比值', /之比|比值|比为多少|电压比|电流比/], ['功率', /功率/], ['摩擦力大小', /摩擦力(?:的)?大小|摩擦力为多少/],
    ['角度', /夹角|倾角为多少|偏转角/], ['长度', /弹簧.{0,5}(?:伸长|压缩)|滑行距离|下滑距离|上滑距离/]
  ];
  function tags(raw, dictionary) {
    const s = normalize(raw);
    return dictionary.filter(([,re]) => re.test(s)).map(([label]) => label);
  }
  function focus(raw) {
    const pieces = raw.split(/[。？！?!；;\n]/).map(s => s.trim()).filter(Boolean);
    const questions = pieces.filter(s => /求|计算|试问|多少|几秒|多远|多快|多久|何时|多大|多长|怎样变化|如何变化|多高/.test(s));
    const final = (questions.length ? questions[questions.length-1] : pieces[pieces.length-1]) || '';
    const i = Math.max(final.lastIndexOf('求'),final.lastIndexOf('计算'),final.lastIndexOf('试问'));
    return i >= 0 ? final.slice(i) : (final.split(/[，,]/).at(-1) || final);
  }
  function goalTags(raw, heading='') {
    const g = tags(focus(raw),goals);
    return g.length ? g : tags(heading,goals);
  }
  const condLabels = {
    surface:{smooth:'光滑斜面',rough:'粗糙斜面'}, direction:{up:'沿斜面上滑',down:'沿斜面下滑'},
    wiring:{series:'串联',parallel:'并联'}, collision:{stick:'碰后粘合',elastic:'弹性碰撞',bounce:'碰后分离'},
    land:{level:'水平地面',slope:'落在斜面'}, launch:{horizontal:'水平抛出',angled:'斜抛'},
    drag:{ignore:'忽略空气阻力',present:'计入空气阻力'}
  };
  function conditions(raw) {
    const s=normalize(raw), a={};
    if (/粗糙|动摩擦|有摩擦/.test(s)) a.surface='rough';
    else if (/光滑|无摩擦|没有摩擦/.test(s) && /坡|斜面/.test(s)) a.surface='smooth';
    if (/斜面|斜坡|坡面|坡顶|沿坡/.test(s)) {
      if (/(?:上滑(?!下))|滑上|向上(?:推出|滑|运动)|冲上|向坡顶|沿坡向上/.test(s)) a.direction='up';
      else if (/下滑|滑下|向下滑|向坡底|沿坡向下/.test(s)) a.direction='down';
    }
    if (/并联/.test(s)) a.wiring='parallel';
    else if (/串联/.test(s)) a.wiring='series';
    if (/粘|黏|共同速度|结合|合为一体|锁在一起|完全非弹性|连在一起|一起运动/.test(s)) a.collision='stick';
    else if (/弹性碰撞|完全弹性/.test(s)) a.collision='elastic';
    else if (/弹开|分离|分开/.test(s)) a.collision='bounce';
    if (/落到斜面|落在斜面|落回斜面|落回坡面|再次.*斜面|打到坡面/.test(s)) a.land='slope';
    else if (/水平地面|水平地板|水平地上|落地|落到地面/.test(s)) a.land='level';
    if (/斜抛|斜向|斜上方|与水平.{0,6}角.{0,5}抛/.test(s)) a.launch='angled';
    else if (/平抛|沿水平(?:方向)?.{0,18}(?:扔|抛|投|射)出|水平.{0,4}(抛|飞|射|扔)|初速度水平/.test(s)) a.launch='horizontal';
    if (/不可忽略|不能忽略|考虑(?:恒定)?(?:的)?空气阻力|计入(?:空气)?阻力|受到空气阻力/.test(s)) a.drag='present';
    else if (/忽略(?:空气)?阻力|不计(?:空气)?阻力|无空气阻力/.test(s)) a.drag='ignore';
    return a;
  }
  const numRe = /(\d+(?:\.\d+)?)\s*(km\/h|m\/s(?:\^?2)?|cm|kg|ms|m(?![a-z])|s(?![a-z])|ω|欧|v(?![a-z])|伏|a(?![a-z])|安|°)/gi;
  const numUnits = {'km/h':['m/s',1/3.6],cm:['m',.01],ms:['s',.001],欧:['Ω',1],ω:['Ω',1],a:['A',1],安:['A',1],v:['V',1],伏:['V',1]};
  function values(raw) {
    const s=normalize(raw), arr=[];
    for(const [,n,original] of s.matchAll(numRe)) {
      const unit=original.replace('^',''), [u,k]=numUnits[unit]||[unit==='m/s2'?'m/s²':unit,1];
      arr.push([Math.round(+n*k*10000)/10000,u]);
    }
    for(const m of s.matchAll(/(?:动摩擦(?:因|系)数|摩擦(?:因|系)数|μ)\s*(?:为|是|取|=|等于)?\s*(0?\.\d+)/g)) arr.push([+m[1],'μ']);
    return [...new Map(arr.map(x=>[key(x),x])).values()];
  }
  const key = pair => pair.join('|');
  function quantityText(pair) { return pair[1]==='μ'?'μ = '+pair[0]:pair[0]+' '+pair[1]; }
  function resistanceTarget(s) { return values(focus(s)).find(v=>v[1]==='Ω')?.[0]; }
  function massRoles(raw) {
    const s=normalize(raw), roles={};
    const firstMass=t=>{const m=t.match(/(\d+(?:\.\d+)?)\s*kg/);return m ? +m[1] : undefined;};
    const collision=s.match(/^(.*?)(?:撞上|撞向|撞到|撞击)(.*)$/);
    if(collision){
      roles.incoming=firstMass(collision[1]);
      roles.target=firstMass(collision[2]);
    }
    for(const [key,re] of [['incoming',/入射(?:小)?车.{0,12}?(\d+(?:\.\d+)?)\s*kg/],
                           ['target',/(?:靶车|静止的).{0,10}?(\d+(?:\.\d+)?)\s*kg/]]) {
      const m=s.match(re);if(m)roles[key]=+m[1];
    }
    return roles;
  }
  function tokens(raw) {
    const out=[];
    const s=normalize(raw);
    for(const [run] of s.matchAll(/[\u3400-\u9fff]+|[a-zα-ω]+|\d+(?:\.\d+)?/gu)) {
      if (/[\u3400-\u9fff]/.test(run)) {
        for(let i=0;i<run.length-1;i++) out.push(run.slice(i,i+2));
      } else out.push(run);
    }
    return out;
  }
  function hist(items) { const m=new Map();for(const x of items)m.set(x,(m.get(x)||0)+1);return m; }
  function segment(course) {
    const cuts=[0], cues=course.cues;
    for(let i=1;i<cues.length;i++) {
      if(i-cuts.at(-1)<2)continue;
      const s=cues[i].text, p=cues[i-1].text;
      const transition=/^(换一道|再看一个|下[一1]题|换一种|接下来[，,]?来看|另一个例题)/.test(s);
      const setup=/把.{1,12}以|从.{1,16}(?:高度|顶端)|一(?:辆|个|只|块)|将.{0,12}接|沿.{0,12}推出/.test(s);
      const solved=/得到|代入|为\s*[\d]|是\s*\d|等于|因此/.test(p);
      const statesGivens=values(s).length>=2;
      if(transition || ((setup||statesGivens) && solved && /求|多少|多久/.test(s))) cuts.push(i);
    }
    const points=cuts.map((idx,j)=>j===0?0:Math.round((cues[idx-1].end+cues[idx].start)/2));
    return cuts.map((idx,j)=>{
      const block=cues.slice(idx,cuts[j+1]??cues.length);
      const first=block[0],last=block.at(-1);
      const text=block.map(c=>c.text+' '+c.heading+' '+c.board).join(' ');
      const setup=first.text+' '+first.board;
      const quantities=values(setup);
      // Gravity can be stated after the setup. Do not count solved outputs as givens.
      const gravity=normalize(text).match(/(?:g|重力加速度)\s*(?:=|取|为|等于)?\s*(\d+(?:\.\d+)?)\s*m\/s\^?2/);
      if(gravity && !quantities.some(v=>v[1]==='m/s²' && v[0]===+gravity[1]))quantities.push([+gravity[1],'m/s²']);
      return {id:course.id+'@'+idx,video:course.id,course:course.title,grade:course.grade,kind:course.kind,
        title:first.heading,start:points[j],end:points[j+1]??course.duration,duration:course.duration,whole:cuts.length===1,
        poster:first.poster,cues:block,text,topics:tags(text,topics),methods:tags(text,methods),
        goals:goalTags(first.text,first.heading),cond:conditions(first.text+' '+first.heading), quantities,
        target:resistanceTarget(first.text),massRoles:massRoles(first.text),outputs:values(last.board.split(/=|≈/).at(-1)),tf:hist(tokens(text)),length:tokens(text).length};
    });
  }
  function createIndex(courses) {
    const docs=courses.flatMap(segment), df=new Map(), avg=docs.reduce((s,d)=>s+d.length,0)/(docs.length||1);
    docs.forEach(d=>d.tf.forEach((_,t)=>df.set(t,(df.get(t)||0)+1)));
    return {docs,df,avg};
  }
  function bm25(index, words, doc) {
    let value=0, mass=0;
    for (const [t,qCount] of words) {
      const df=index.df.get(t); if(!df)continue;
      const idf=Math.log(1+(index.docs.length-df+.5)/(df+.5)), weight=Math.min(qCount,2);
      mass+=idf*weight;
      const f=doc.tf.get(t)||0;
      value+=idf*weight*f*2.2/(f+1.2*(.25+.75*doc.length/index.avg));
    }
    return {raw:value, norm:mass?Math.min(1,value/mass):0};
  }
  const common = (a,b) => a.filter(t=>b.includes(t));
  function describe(q) {
    const text=[q.stem,q.analysis,q.knowledge].filter(Boolean).join(' ');
    return {topic:tags(text,topics),method:tags(text,methods),goal:goalTags(q.stem,q.title),cond:conditions(q.stem),
      target:resistanceTarget(q.stem),massRoles:massRoles(q.stem), quantity:values(q.stem),answer:values(q.answer),
      words:hist(tokens([q.stem,q.stem,q.analysis,q.knowledge,q.answer].filter(Boolean).join(' ')))};
  }
  function search(index,q) {
    const p=describe(q);
    return index.docs.map(d=>{
      const lex=bm25(index,p.words,d);
      const topic=common(p.topic,d.topics), method=common(p.method,d.methods), goal=common(p.goal,d.goals);
      const hits=[], conflicts=[], gaps=[], conds=[];
      const dnums=new Set(d.quantities.map(key));
      for(const v of p.quantity) {
        if(dnums.has(key(v)))hits.push(v);
        else if(d.quantities.some(y=>y[1]===v[1])) conflicts.push('给定量不一致：题目含 '+quantityText(v));
        else gaps.push('题设中的 '+quantityText(v)+' 未在条件中找到');
      }
      for(const [k,v] of Object.entries(p.cond)){
        if(d.cond[k]===v)conds.push(condLabels[k][v]);
        else if(d.cond[k])conflicts.push(condLabels[k][v]+' / 视频为'+condLabels[k][d.cond[k]]);
        else if(['collision','launch','wiring','surface','direction','land','drag'].includes(k)){
          // An omitted assumption may be inferred from a caption stating it explicitly.
          const expanded=conditions(d.text);
          if(expanded[k]===v)conds.push(condLabels[k][v]);
          else if(expanded[k]) conflicts.push(condLabels[k][v]+' / 视频为'+condLabels[k][expanded[k]]);
          else if(k!=='drag' || v==='present')gaps.push('片中未核实'+condLabels[k][v]);
        }
      }
      if(p.target!=null && d.target!=null && p.target!==d.target)conflicts.push('所求电阻不同：题目 '+p.target+' Ω / 视频 '+d.target+' Ω');
      if(topic.includes('碰撞模型')) {
        for(const [k,v] of Object.entries(p.massRoles)) {
          if(v!=null && d.massRoles[k]!=null && v!==d.massRoles[k])
            conflicts.push((k==='incoming'?'入射车':'被撞车')+'质量不同：题目 '+v+' kg / 视频 '+d.massRoles[k]+' kg');
        }
        if(/迎面|相向|对向|追上|两车均在运动/.test(q.stem) && /静止/.test(d.cues[0].text))conflicts.push('被撞物体的初始运动状态不同');
      }
      const missed=p.goal.filter(g=>!d.goals.includes(g));
      if(missed.length)conflicts.push('所求量缺少'+missed.join('、'));
      const answerHits=p.answer.filter(v=>d.outputs.some(x=>x[1]===v[1] && Math.abs(x[0]-v[0])<.011));
      if(p.answer.some(v=>d.outputs.some(x=>x[1]===v[1]) && !answerHits.includes(v)))conflicts.push('参考答案与板书结果不一致');
      const topicRatio=p.topic.length?topic.length/p.topic.length:0;
      const score0=22*lex.norm+17*topicRatio+18*(p.goal.length?goal.length/p.goal.length:0)
        +19*(p.quantity.length?hits.length/p.quantity.length:.28)+9*(Object.keys(p.cond).length?conds.length/Object.keys(p.cond).length:.45)
        +6*(p.method.length?method.length/p.method.length:.4)+5*(p.answer.length?answerHits.length/p.answer.length:.4)
        +(q.grade?(q.grade===d.grade?2:-3):1)+(q.kind?(q.kind===d.kind?2:-1):1);
      const score=Math.max(0,Math.min(99,Math.round(score0-12*Math.min(3,conflicts.length)-6*Math.min(2,gaps.length))));
      const sufficient=topic.length>0 && (hits.length>=1 || (method.length>=1 && conds.length>=2));
      const eligible=score>=63 && sufficient && p.goal.length>0 && !missed.length && !conflicts.length && !gaps.length && topicRatio>=.5;
      return {doc:d,score,lexical:lex.raw,eligible,topic,method,goal,conds,quantities:hits.map(quantityText),
        answers:answerHits.map(quantityText),conflicts,gaps};
    }).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.score-a.score||b.lexical-a.lexical||a.doc.id.localeCompare(b.doc.id));
  }
  const api={version,createIndex,search,describe,quantityText};
  globalThis.YT_MATCH=api;
  if(typeof module!=='undefined' && module.exports)module.exports=api;
})();
