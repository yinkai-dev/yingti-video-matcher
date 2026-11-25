(() => {
  'use strict';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons={plus:'M12 5v14 M5 12h14',check:'m5 12 4 4 10-10',play:'m7 4 13 8-13 8z',pause:'M8 5v14 M16 5v14',video:'M3 5h14v14H3z M17 9l5-3v12l-5-3',file:'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 16h6',swap:'M4 8h15l-3-3 M20 16H5l3 3',close:'m6 6 12 12 M18 6 6 18',clip:'M6 4v16 M18 4v16 M3 8h6 M15 16h6 M9 12h6',layer:'m3 8 9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5',info:'M12 11v6 M12 7v1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',expand:'M9 3H3v6 M15 3h6v6 M3 15v6h6 M21 15v6h-6',clock:'M12 6v6l4 3 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',down:'m5 9 7 7 7-7',book:'M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z M12 6v14',sound:'M3 9h4l5-5v16l-5-5H3z M16 8c3 2 3 6 0 8 M18 5c5 3 5 11 0 14',log:'M4 5h16v15H4z M8 9h8 M8 13h8 M8 17h5',search:'M16 16l5 5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',folder:'M3 7V5h6l2 3h10v12H3z'};
  const icon=k=>'<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="'+icons[k]+'"/></svg>';
  const btn=(action,label,ic='',style='')=>'<button type="button" class="btn '+style+'" data-act="'+action+'">'+(ic?icon(ic):'')+label+'</button>';
  const stamp=n=>{n=Math.max(0,Math.floor(n||0));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
  const tag=t=>'<span class="tag">'+esc(t)+'</span>';
  const pill=(t,c='good')=>'<span class="pill '+c+'">'+esc(t)+'</span>';
  const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
  const meterKey='yingti.review.v1', viewKey='yingti.view.v1';
  let persistent=true,state;
  const initial=()=>({papers:[{id:'sample',name:'高中物理 · 典型问题选练',questions:YT_SEEDS.map(q=>({...q,status:'pending',link:null}))}],events:[]});
  function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
  function readState(){const s=stored(meterKey);return s && Array.isArray(s.papers)&&s.papers.length&&Array.isArray(s.events)?s:null;}
  function persist(){try{localStorage.setItem(meterKey,JSON.stringify(state));}catch{persistent=false;}}
  state=readState()||initial();persist();
  const pref=stored(viewKey)||{};
  let paperId=pref.paperId, questionId=pref.questionId, filter='all', screen='review';
  let draft=null, answerOpen=false, openedAt=Date.now(),toastTimer, modalMode='';
  let voiceOn=false,lastSpoken=-1;
  const index=YT_MATCH.createIndex(YT_CORPUS),docs=index.docs,courses=new Map(YT_CORPUS.map(c=>[c.id,c]));
  const $root=$('#root'),dialog=$('#dialog'),modal=$('#modal'),urlCache=new Map();
  const paper=()=>state.papers.find(p=>p.id===paperId)||state.papers[0];
  const question=()=>paper().questions.find(q=>q.id===questionId);
  const statusName=s=>({pending:'待审核',linked:'已挂载',rejected:'已拒绝'}[s]||'待审核');
  const resultFor=q=>q?YT_MATCH.search(index,q):[];
  const clipFor=d=>({doc:d.id,video:d.video,start:d.start,end:d.end});
  function asset(path){
    if(!globalThis.YT_ASSETS?.[path])return path;
    if(!urlCache.has(path)){
      const [type,b64]=YT_ASSETS[path];
      const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
      urlCache.set(path,URL.createObjectURL(new Blob([bytes],{type})));
    }
    return urlCache.get(path);
  }
  function remember(){try{localStorage.setItem(viewKey,JSON.stringify({paperId,questionId}));}catch{persistent=false;}}
  function clearSpeech(){if(voiceOn && 'speechSynthesis' in window)speechSynthesis.cancel();lastSpoken=-1;}
  function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2500);}
  function resetDraft(){draft=null;answerOpen=false;openedAt=Date.now();clearSpeech();}
  function visibleQuestions(){return paper().questions.filter(q=>filter==='all'||(filter==='pending'?q.status==='pending':q.status!=='pending'));}
  function reconcile(){
    paperId=paper().id;
    const visible=visibleQuestions();
    if(!visible.some(q=>q.id===questionId)){questionId=visible[0]?.id||'';resetDraft();}
    remember();
  }
  function refreshState(){if(persistent)state=readState()||state;reconcile();}
  function changeQ(id){questionId=id;resetDraft();remember();render();}
  function top(title,sub,actions=''){return '<div class="pagehead"><div><div class="overline">教研空间</div><h1>'+title+'</h1><p>'+sub+'</p></div>'+actions+'</div>';}
  function side(q){
    const p=paper(), total=p.questions.length, done=p.questions.filter(q=>q.status!=='pending').length;
    const rows=p.questions.map((item,i)=>({item,i})).filter(({item})=>filter==='all'||(filter==='pending'?item.status==='pending':item.status!=='pending'));
    return '<aside class="sidebar"><div class="sidehead"><div class="between"><h3>试卷题目</h3>'+btn('newPaper','新建试卷','plus','slim subtle')+'</div><select id="paperSelect" class="paper-select" aria-label="切换试卷">'+state.papers.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===paperId?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select><div class="between tiny" style="margin-bottom:6px"><span>审核进度</span><span>'+done+' / '+total+'</span></div><div class="progress"><span style="width:'+(total?100*done/total:0)+'%"></span></div></div><div class="filters">'+[['all','全部'],['pending','待审'],['done','已处理']].map(([v,t])=>'<button aria-pressed="'+(v===filter)+'" class="'+(v===filter?'on':'')+'" data-filter="'+v+'">'+t+'</button>').join('')+'</div><div class="queue">'+(rows.map(({item,i})=>'<button class="qrow '+(q?.id===item.id?'on':'')+'" data-question="'+esc(item.id)+'" '+(q?.id===item.id?'aria-current="true"':'')+'><span class="qnum">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(item.title)+'</strong><small>'+esc(item.grade||'年级未填')+' · <em class="'+(item.status==='linked'?'done':'')+'">'+statusName(item.status)+'</em></small></span></button>').join('')||'<p class="none">此列表暂无题目</p>')+'</div><div class="sidefoot">'+icon('log')+'<button class="linkbtn" data-act="history">本卷反馈记录（'+state.events.filter(e=>e.paperId===p.id).length+'）</button></div></aside>';
  }
  function qCard(q){
    const pos=paper().questions.indexOf(q)+1;
    return '<section class="card qcard"><div class="headingline"><div class="labels"><span class="overline">第 '+String(pos).padStart(2,'0')+' 题</span>'+[q.grade,q.kind].filter(Boolean).map(tag).join('')+'</div><button class="linkbtn" data-act="answer" aria-expanded="'+answerOpen+'">答案与解析 '+icon('down')+'</button></div><h2>'+esc(q.title)+'</h2><p class="stem">'+esc(q.stem)+'</p>'+(answerOpen?'<div class="ans"><p><b>参考答案</b>　'+esc(q.answer||'未填写')+'</p><p><b>题目解析</b>　'+esc(q.analysis||'未填写')+'</p><p><b>知识点</b>　'+esc(q.knowledge||'未填写')+'</p></div>':'')+'</section>';
  }
  function ensureDraft(q,ranked){
    if(draft)return;
    if(q.status==='linked'&&q.link){draft={...q.link};return;}
    const hit=ranked.find(x=>x.eligible);
    if(q.status!=='rejected'&&hit)draft=clipFor(hit.doc);
  }
  function clipPlayer(r){
    const d=r.doc,course=courses.get(d.video),start=draft.start,end=draft.end;
    return '<div><div class="player" id="player"><div class="stage"><video id="video" preload="metadata" playsinline src="'+asset(course.src)+'" poster="'+asset(d.cues.find(c=>c.start<=start&&c.end>=start)?.poster||d.poster)+'" aria-label="'+esc(course.title)+'"></video><button class="bigplay" data-act="play" aria-label="播放所选片段">'+icon('play')+'</button></div><div class="ctl"><input id="playhead" class="rangebar" aria-label="在原视频中定位" type="range" min="0" max="'+course.duration+'" value="'+start+'" step="0.1" style="background:linear-gradient(to right,#536c60 '+start/course.duration*100+'%,#9ce3b4 '+start/course.duration*100+'%,#9ce3b4 '+end/course.duration*100+'%,#536c60 '+end/course.duration*100+'%)"><div class="pctl"><button data-act="play" id="playBtn" aria-label="播放或暂停">'+icon('play')+'</button><span id="clock" class="clock">'+stamp(start)+'</span><span>/ '+stamp(course.duration)+'</span><button id="voiceBtn" hidden class="push" data-act="voice">朗读</button><button class="push" data-act="full" aria-label="全屏播放">'+icon('expand')+'</button></div></div></div><div class="bounds">'+icon('clip')+'<span>选段 <b class="mono">'+stamp(start)+' – '+stamp(end)+'</b> · '+(end-start)+' 秒</span><button class="linkbtn" data-act="bounds">调整起止</button></div></div>';
  }
  function evidence(r){
    const d=r.doc, tokens=[...r.goal,...r.quantities,...r.conds].slice(0,6);
    const quotes=[d.cues[0],d.cues.at(-1)].filter((c,i,a)=>a.indexOf(c)===i);
    return '<aside class="evidence"><h3>'+icon('layer')+'匹配依据</h3><div class="proof">'+(tokens.length?tokens.map(t=>'<span>'+esc(t)+'</span>').join(''):'<span>待人工核对</span>')+'</div>'+quotes.map(c=>'<button class="quote" data-cue="'+c.start+'" aria-label="跳至 '+stamp(c.start)+' 的字幕"><span class="stamp">'+stamp(c.start)+'</span>'+esc(c.text)+'</button>').join('')+
      ((r.conflicts.length||r.gaps.length)?'<p class="alert">'+esc([...r.conflicts,...r.gaps].slice(0,2).join('；'))+'</p>':'')+'</aside>';
  }
  function recCard(q,ranked){
    ensureDraft(q,ranked);
    if(!draft){
      const rejected=q.status==='rejected';
      const maybe=ranked[0];
      const reason=maybe?(maybe.conflicts[0]||maybe.gaps[0]||(maybe.topic.length?'可核实的题设与所求量不足。':'视频库暂未覆盖这道题的物理模型。')):'暂无候选。';
      return '<section class="card empty"><div class="emptyicon">'+icon(rejected?'log':'search')+'</div>'+pill(rejected?'已拒绝':'暂不推荐','warn')+'<h2>'+(rejected?'本题保留为空挂载':'没有足够可靠的讲解')+'</h2><p>'+esc(rejected?(q.reason||'教研已拒绝本次推荐。'):reason)+'</p><div class="wrap">'+btn('pick','手动查找片段','search')+(rejected?btn('reopen','重新审核','swap','subtle'):btn('reject','记录缺口','log','subtle'))+'</div></section>';
    }
    const r=ranked.find(r=>r.doc.id===draft.doc);
    if(!r){draft=null;return recCard(q,ranked);}
    const d=r.doc,same=q.status==='linked'&&q.link?.doc===draft.doc&&q.link?.start===draft.start&&q.link?.end===draft.end;
    const changed=q.status==='linked'&&!same;
    const label=same?'已挂载':r.eligible?'推荐讲解':'人工选择 · 需核对';
    return '<section class="card matchcard"><div class="matchhead"><div><div class="labels">'+pill(label,same||r.eligible?'good':'warn')+'<span class="tiny">'+(d.whole?'整段微课':'长视频片段')+'</span></div><h2>'+esc(d.course)+'</h2><div class="tiny">'+esc(d.title)+' · '+esc(d.grade)+'物理</div></div><div class="score" title="排序分反映规则匹配程度，未经概率校准"><b>'+r.score+'</b><span>/ 100<br>排序分</span></div></div><div class="matchbody">'+clipPlayer(r)+evidence(r)+'</div><div class="actions">'+
      (same?pill('已关联到本题'):btn('confirm',changed?'确认替换':r.eligible?'确认并挂载':'人工挂载此片段','check','main'))+
      btn('pick','更换候选','swap')+btn('reject',q.status==='linked'?'撤下挂载':'拒绝推荐','close','subtle')+
      '<span class="tiny note">'+(same?'已保存起止时间':'由教研确认后挂载')+'</span></div></section>';
  }
  function reviewPage(){
    const q=question(), p=paper();
    const intro='核对新题与视频讲解，确认合适的片段后挂载。';
    const blank='<section class="card empty"><div class="emptyicon">'+icon('file')+'</div><h2>'+esc(p.name)+'</h2><p>录入第一道题，系统会从已有视频中检索讲解。</p>'+btn('newQ','录入第一道题','plus','main')+'</section>';
    return top('讲解匹配工作台',intro,'<div class="headtools wrap">'+btn('guide','42 秒演示','play','subtle')+btn('newQ','录入新题','plus','main')+'</div>')+'<div class="workspace">'+side(q)+'<div class="maincol">'+(q?qCard(q)+recCard(q,resultFor(q)):p.questions.length?'<section class="card empty"><h2>当前筛选暂无题目</h2>'+btn('showAll','查看全部题目')+'</section>':blank)+'</div></div>';
  }
  function catalogPage(){
    return top('视频素材库','' + YT_CORPUS.length + ' 部原创物理板书微课，可查看原片、字幕和可检索片段。')+
      '<div class="cataloggrid">'+YT_CORPUS.map(c=>{
        const list=docs.filter(d=>d.video===c.id);
        return '<button class="card vcard" data-course="'+esc(c.id)+'"><img src="'+asset(c.cues[0].poster)+'" alt=""><section><div class="labels">'+tag(c.grade)+tag(c.group)+'</div><h2 style="margin-top:7px">'+esc(c.title)+'</h2><p>'+stamp(c.duration)+' · '+list.length+' 个讲解单元 · 字幕板书</p></section></button>';
      }).join('')+'</div>';
  }
  function kpi(t,v,n){return '<div class="card kpi"><div class="tiny">'+t+'</div><b>'+v+'</b><div class="tiny">'+n+'</div></div>';}
  function metricsPage(){
    const s=YT_EVAL.stats, probes=YT_EVAL.probes, logs=state.events, calcInput=(n,t,v,min,max,step)=>'<label>'+t+'<input data-calc="'+n+'" type="number" value="'+v+'" min="'+min+'" max="'+max+'" step="'+step+'"></label>';
    const row=(name,a,b)=>'<tr><td>'+name+'</td><td>'+a+'</td><td><b>'+b+'</b></td></tr>';
    return top('效果与成本','同一套题、同一个片段索引，对照词面检索与物理条件核对。','<div class="tools">'+(document.documentElement.dataset.package==='yes'?'<a class="btn" style="text-decoration:none" href="'+asset('project.zip')+'" download="映题-演示项目.zip">下载项目包</a>':'')+btn('exportEval','导出评测','log')+'</div>')+
      '<div class="kpis">'+kpi('首选片段命中',s.top1+' / '+s.positive,'有对应讲解的题目')+kpi('缺讲解时留空',s.withheld+' / '+s.negative,'无合适片段的题目')+kpi('起止平均绝对误差',s.startMae+' / '+s.endMae+' s',s.spans+' 个命中长课样本，起点 / 终点')+kpi('单题检索 P95',s.p95+' ms','索引预热后，本机 Node 实测')+'</div>'+
      '<div class="split"><section class="card block"><h2>检索对照</h2><div class="tablewrap"><table><thead><tr><th>指标</th><th>仅 BM25</th><th>加入条件核对</th></tr></thead><tbody>'+
      row('有解题首选命中',s.lexicalTop1+' / '+s.positive,s.top1+' / '+s.positive)+row('无解题正确留空',s.lexicalWithheld+' / '+s.negative,s.withheld+' / '+s.negative)+row('推荐精确率',s.lexicalTop1+' / '+(s.lexicalIssued??'—'),s.correct+' / '+s.issued)+'</tbody></table></div><p class="metricfoot">共 '+s.videos+' 部原创板书视频（'+stamp(s.courseSeconds)+'），'+s.docs+' 个可检索单元。对照组的拒推阈值用另 '+s.dev+' 道开发题选择。此处为合成回归集；脚本的自然转场比真实课堂清晰。</p></section>'+
      '<section class="card block"><h2>单批试卷能省多少时间？</h2><div class="calc">'+calcInput('n','新录题数（道）',100,1,100000,1)+calcInput('c','可复用比例（%）',60,0,100,1)+calcInput('m','纯人工查找（分钟/题）',5,0,120,.1)+calcInput('r','核对推荐（分钟/题）',1,0,120,.1)+calcInput('e','无结果初筛（分钟/题）',.5,0,120,.1)+'</div><div class="savings" id="savings"></div><p class="metricfoot">情景测算。无结果题仍计入人工查找。默认参数待教研计时验证。</p></section></div>'+
      '<div class="split"><section class="card block"><h2>运行成本与审核反馈</h2><p>本版使用本机字幕索引，单题外部模型调用 0 次，API 费用 ¥0。人审工时、素材制作、设备和托管另计。首次建索引 '+s.indexMs+' ms；检索计时 '+s.timings+' 次，不含页面和视频加载。</p><div class="sectiongap tools">'+pill('本机已记录 '+logs.length+' 条审核事件','muted')+btn('exportFeedback','导出反馈 JSON','log','slim')+'</div></section>'+
      '<section class="card block"><h2>真实素材试点</h2><ol><li>选两套新卷和 20 部已有课，覆盖同题、变式和缺讲解。两位教研独立标注可挂载区间。</li><li>接入字幕或中文 ASR、板书 OCR，对照现有检索与中文向量重排，检查噪音和跨题误切。</li><li>交叉计时人工查找与辅助审核；记录错挂率、单题净耗时和每道成功挂载成本，再决定扩库。</li></ol></section></div>'+
      '<section class="card block"><h2>换问法与弱字幕补测</h2><div class="tablewrap"><table><thead><tr><th>测试条件</th><th>首选命中</th><th>正确留空</th></tr></thead><tbody>'+row('新增同源改写题（回归）',probes.freshTop+' / '+probes.freshPos,probes.freshWithheld+' / '+probes.freshNeg)+row('去掉部分换题提示及全部板书，扰动字幕时间',probes.noisyTop+' / '+s.positive,probes.noisyWithheld+' / '+s.negative)+row('在弱字幕基础上再删除约四分之一的发言',probes.missingTop+' / '+s.positive,probes.missingWithheld+' / '+s.negative)+'</tbody></table></div><p class="metricfoot">弱字幕实验重新建立了 '+probes.noisyDocs+' 个片段索引。首轮补测有 1 道改写题漏召回、1 道电压比误推荐，修订后已纳入回归。导出可查看每题预测。</p></section>'+
      '<details class="card block"><summary>逐题结果与计分口径</summary><p class="metricfoot">合格首选须命中标注视频，且片段时间交并比至少 0.5。允许多个正确解法。正例 Top-3 命中 '+s.top3+' / '+s.positive+'。长课误差按命中查询统计，重复引用同一段会重复计数。题目与视频同源自建，回归中修复过错误，不代表真实课堂准确率。</p><div class="tablewrap"><table><thead><tr><th>题目</th><th>预期</th><th>实际</th></tr></thead><tbody>'+YT_EVAL.rows.map(r=>'<tr><td>'+esc(r.stem)+'</td><td>'+ (r.gold.length?'应推荐':'应留空')+'</td><td>'+esc(r.top?docs.find(d=>d.id===r.top)?.title:'留空')+'</td></tr>').join('')+'</tbody></table></div></details>'+
      '<details class="card block"><summary>方案、素材与可复用接口</summary><p class="metricfoot">字幕时间、板书与视频是输入。转题提示、题设出现和前题收束决定片段边界。中文双字词和 BM25 负责召回，再核对所求量、适用条件、对象、单位和答案，返回视频、起止时间、依据和冲突。审核事件单独记录，供同类试卷、作业与错题本复用。</p><p>当前由原创脚本提供字幕与板书文字。真实课堂的语音识别、视觉识别和跨设备题库接入留到试点。</p><div class="sourcelinks"><a href="https://www.sqlite.org/fts5.html#the_bm25_function" target="_blank" rel="noreferrer">BM25 排序公式</a><a href="https://aclanthology.org/J97-1003/" target="_blank" rel="noreferrer">段落主题切分研究</a><a href="https://github.com/openai/whisper" target="_blank" rel="noreferrer">Whisper</a><a href="https://huggingface.co/BAAI/bge-m3" target="_blank" rel="noreferrer">BGE-M3</a></div></details>';
  }
  function render(){
    clearSpeech();reconcile();
    document.querySelectorAll('[data-nav]').forEach(b=>{b.classList.toggle('active',b.dataset.nav===screen);b.setAttribute('aria-current',b.dataset.nav===screen?'page':'false');});
    $('.local').innerHTML=persistent?'<i></i> 本机工作区':'当前会话 · 存储不可用';
    $root.innerHTML=screen==='review'?reviewPage():screen==='catalog'?catalogPage():metricsPage();
    if(screen==='review' && $('#video'))bindPlayer();
    if(screen==='metrics')calc();
  }
  function calc(){
    const x={};let valid=true;
    document.querySelectorAll('[data-calc]').forEach(el=>{x[el.dataset.calc]=el.valueAsNumber;if(!el.checkValidity()||!Number.isFinite(el.valueAsNumber))valid=false;});
    const el=$('#savings');if(!el)return;
    if(!valid){el.textContent='请填写有效的数值。';return;}
    const p=x.c/100,manual=x.n*x.m,assisted=x.n*(p*x.r+(1-p)*(x.m+x.e)),delta=manual-assisted;
    el.innerHTML='预计'+(delta>=0?'节省':'增加')+' <strong>'+Math.abs(delta/60).toFixed(2)+' 小时</strong>　<span class="tiny">人工 '+manual.toFixed(0)+' → 辅助 '+assisted.toFixed(0)+' 分钟</span>';
  }
  function zhVoice(){if(!('speechSynthesis' in window))return null;return speechSynthesis.getVoices().find(v=>v.localService&&/^zh[-_](cn|hans)/i.test(v.lang))||null;}
  function syncVoice(){const b=$('#voiceBtn');if(b){b.hidden=!zhVoice();b.textContent=voiceOn?'关闭朗读':'朗读字幕';}}
  function speakAt(t){if(!voiceOn||!draft)return;const v=zhVoice(),c=courses.get(draft.video).cues.find(c=>c.start<=t&&c.end>=t);if(!v||!c||lastSpoken===c.start)return;lastSpoken=c.start;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(c.text);u.voice=v;u.lang=v.lang;u.rate=1.15;speechSynthesis.speak(u);}
  function bindPlayer(){
    const v=$('#video'),head=$('#playhead'),clock=$('#clock'),expected=draft;
    v.addEventListener('loadedmetadata',()=>{if(expected===draft)v.currentTime=expected.start;},{once:true});
    v.addEventListener('error',()=>{if(v.isConnected)toast('浏览器未能解码此视频，可用 Chrome 或 Safari 打开。');});
    function update(){if(!v.isConnected || expected!==draft)return;const t=v.currentTime;head.value=t;clock.textContent=stamp(t);if(!v.paused&&t>=draft.end-.06){v.pause();if(t>draft.end+.07)v.currentTime=draft.end;}else if(!v.paused)speakAt(t);}
    let stopTimer;
    function armStop(){
      clearTimeout(stopTimer);if(v.paused||!v.isConnected||expected!==draft)return;
      const remaining=(expected.end-v.currentTime)/v.playbackRate;
      if(remaining<=0){v.pause();return;}
      stopTimer=setTimeout(()=>{if(!v.isConnected||expected!==draft)return;if(v.currentTime>=expected.end-.04){v.pause();v.currentTime=expected.end;}else armStop();},Math.max(30,remaining*1000));
    }
    v.addEventListener('timeupdate',update);
    for(const event of ['playing','seeked','ratechange'])v.addEventListener(event,armStop);
    v.addEventListener('pause',()=>clearTimeout(stopTimer));
    v.addEventListener('pause',()=>{if(!v.isConnected)return;clearSpeech();$('.bigplay').hidden=false;$('#playBtn').innerHTML=icon('play');});
    v.addEventListener('play',()=>{if(!v.isConnected)return;$('.bigplay').hidden=true;$('#playBtn').innerHTML=icon('pause');});
    head.addEventListener('input',()=>{v.pause();v.currentTime=Number(head.value);clock.textContent=stamp(v.currentTime);});
    v.addEventListener('click',()=>play());
    syncVoice();
  }
  function play(at=null){
    const v=$('#video');if(!v||!draft)return;
    if(at===null&&!v.paused){v.pause();return;}
    const go=()=>{
      if(!v.isConnected)return;
      if(at!==null)v.currentTime=Math.min(Math.max(at,draft.start),draft.end-.12);
      else if(v.currentTime<draft.start||v.currentTime>=draft.end-.15)v.currentTime=draft.start;
      v.play().catch(()=>{if(v.isConnected)toast('请按播放键重试');});
    };
    if(v.readyState)go();else v.addEventListener('loadedmetadata',go,{once:true});
  }
  if('speechSynthesis' in window)speechSynthesis.addEventListener?.('voiceschanged',syncVoice);
  function openModal(title,html,mode,wide=false){
    $('#video')?.pause();clearSpeech();modalMode=mode;
    modal.innerHTML='<div class="dlghead"><h2 id="dialogTitle">'+esc(title)+'</h2>'+btn('close','关闭','close','slim subtle')+'</div>'+html;
    dialog.classList.toggle('wide',wide);
    if(!dialog.open)dialog.showModal();
    const focusEl=modal.querySelector('input:not([type=hidden]),textarea,select');if(focusEl)focusEl.focus();
  }
  function closeModal(){dialog.close();modal.innerHTML='';modalMode='';}
  dialog.addEventListener('close',()=>{modal.querySelector('video')?.pause();});
  const footer=(label)=>'<div class="dlgfoot">'+btn('close','取消')+'<button class="btn main" type="submit">'+esc(label)+'</button></div>';
  function questionForm(){
    openModal('录入新题','<form id="questionForm"><p class="hint" style="margin-bottom:12px">将录入《'+esc(paper().name)+'》，保存后立即检索。</p><div class="formgrid">'+
      '<label class="field wide">题干<textarea autofocus required name="stem" rows="3" maxlength="6000" placeholder="输入题目条件与所求量"></textarea></label>'+
      '<label class="field wide">题目简称（选填）<input name="title" maxlength="50" placeholder="未填写时使用题干开头"></label>'+
      '<label class="field">年级<select name="grade"><option>高一</option><option>高二</option><option>高三</option><option>初三</option><option value="">未指定</option></select></label><label class="field">题型<select name="kind"><option>计算题</option><option>选择题</option><option>简答题</option><option>实验题</option></select></label>'+
      '<label class="field wide">参考答案（选填）<input name="answer" maxlength="500"></label>'+
      '<label class="field wide">解析（选填）<textarea rows="2" name="analysis" maxlength="2000"></textarea></label>'+
      '<label class="field wide">知识点（选填）<input name="knowledge" maxlength="200" placeholder="如 平抛运动、运动的分解"></label></div>'+footer('保存并匹配')+'</form>','question');
  }
  function paperForm(){openModal('新建试卷','<form id="paperForm"><label class="field">试卷名称<input name="name" required maxlength="60" placeholder="例如 高一物理期中卷"></label>'+footer('创建试卷')+'</form>','paper');}
  function pickForm(){
    openModal('更换讲解片段','<label class="field">搜索素材<input id="pickSearch" type="search" placeholder="输入课名、物理条件或片段标题"></label><div id="pickList" class="picklist"></div>','pick',true);renderPick();
  }
  function renderPick(){
    const q=question(),s=$('#pickSearch').value.trim().toLowerCase(),list=resultFor(q).filter(r=>(r.doc.course+r.doc.text).toLowerCase().includes(s));
    $('#pickList').innerHTML=list.map(r=>'<button class="pick" data-pick="'+esc(r.doc.id)+'"><div class="between"><strong>'+esc(r.doc.title)+'</strong>'+pill(r.eligible?'可挂载候选':'仅供人工核对',r.eligible?'good':'warn')+'</div><div class="meta">'+esc(r.doc.course)+' · '+stamp(r.doc.start)+' – '+stamp(r.doc.end)+' · '+r.score+' 分</div><p>'+esc((r.conflicts[0]||r.gaps[0])||(r.eligible?'题设与所求量可在片中核实。':'可核实的匹配依据不足。'))+'</p></button>').join('')||'<p class="none">未找到相应素材。</p>';
  }
  function boundsForm(){
    if(!draft)return;
    const dura=courses.get(draft.video).duration;
    openModal('调整讲解起止','<form id="boundsForm"><p class="hint" style="margin-bottom:12px">原片 '+stamp(dura)+'。可输入分:秒或整数秒。</p><div class="formgrid"><label class="field">开始时间<input name="start" value="'+stamp(draft.start)+'" required></label><label class="field">结束时间<input name="end" value="'+stamp(draft.end)+'" required></label></div><p class="hint sectiongap" id="boundError" role="alert"></p>'+footer('应用到预览')+'</form>','bounds');
  }
  function rejectForm(){
    const q=question(),linked=q.status==='linked';openModal(linked?'撤下题目挂载':'记录审核意见','<form id="rejectForm"><label class="field">原因<select name="reason">'+['题库缺少对应讲解','题设或所求量不一致','讲解片段不完整','讲解质量不足','其他'].map(a=>'<option>'+a+'</option>').join('')+'</select></label><label class="field sectiongap">备注（选填）<textarea name="note" rows="2" maxlength="500"></textarea></label>'+footer(linked?'撤下并记录':'拒绝并记录')+'</form>','reject');
  }
  function courseModal(id){
    const c=courses.get(id);if(!c)return;
    openModal(c.title,'<video class="modalvideo" id="libraryVideo" controls playsinline preload="metadata" src="'+asset(c.src)+'" poster="'+asset(c.cues[0].poster)+'"></video><div class="between sectiongap"><h3>讲解片段</h3><span class="tiny">'+stamp(c.duration)+' · '+c.cues.length+' 条字幕</span></div>'+docs.filter(d=>d.video===id).map(d=>'<button class="pick" data-library-cue="'+d.start+'"><div class="between"><strong>'+esc(d.title)+'</strong><span class="stamp">'+stamp(d.start)+' – '+stamp(d.end)+'</span></div><p>'+esc(d.cues[0].text)+'</p></button>').join(''),'course',true);
  }
  function historyModal(){
    const p=paper(),rows=state.events.filter(e=>e.paperId===p.id).slice().reverse();
    openModal('本卷审核记录','<div class="feedback-list">'+(rows.map(e=>'<div class="resultrow"><span>'+pill(e.action,'muted')+'</span><span>'+esc(e.title)+'<small class="tiny">　'+esc(e.reason||'')+'</small></span><span class="tiny">'+new Date(e.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+'</span></div>').join('')||'<p class="hint">确认、替换、拒绝或记录缺口后，这里会出现审核记录。</p>')+'</div><div class="dlgfoot">'+btn('exportFeedback','导出全部反馈','log')+'</div>','history',true);
  }
  function exportJSON(name,obj){
    const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已生成 '+name);
  }
  function snapshot(link){return link?{...link}:null;}
  function commit(type,reason=''){
    const wanted=snapshot(draft),qid=questionId,pid=paperId;
    refreshState();
    const q=question();
    if(!q||q.id!==qid||paperId!==pid){toast('题目已变更，请重新选择');return;}
    const ranked=resultFor(q),previous=snapshot(q.link);
    const newLink=type==='挂载'?wanted:null;
    if(type==='挂载'&&!newLink)return;
    if(type==='挂载'&&previous&&JSON.stringify(previous)===JSON.stringify(newLink))return;
    const idx=ranked.findIndex(r=>r.doc.id===wanted?.doc);
    const action=type==='挂载'?(previous?(previous.doc===newLink.doc?'调整起止':'替换'):'挂载'):type;
    const original=ranked.find(r=>r.eligible);
    state.events.push({id:uid(),at:new Date().toISOString(),version:YT_MATCH.version,paperId,questionId:q.id,title:q.title,action,
      from:previous,to:newLink,originalRecommendation:original?clipFor(original.doc):null,reviewedCandidate:wanted,
      selectedRank:idx<0?null:idx+1,selectedScore:idx<0?null:ranked[idx].score,reason,
      reviewElapsedSeconds:Math.round((Date.now()-openedAt)/1000)});
    q.link=newLink;q.status=newLink?'linked':type==='重新审核'?'pending':'rejected';q.reason=reason;
    persist();resetDraft();if(dialog.open)closeModal();render();
    toast((persistent?'已保存':'已记入本次会话')+' · '+action);
  }
  function parseTime(s){s=s.trim();if(/^\d+$/.test(s))return +s;const m=s.match(/^(\d+):([0-5]\d)$/);return m?60*Number(m[1])+Number(m[2]):NaN;}
  function setScreen(next){if(screen===next)return;resetDraft();screen=next;history.replaceState(null,'','#'+screen);render();window.scrollTo(0,0);}
  document.addEventListener('click',e=>{
    const target=e.target.closest('button,a.brand');if(!target)return;
    const d=target.dataset;
    if(target.matches('a.brand')){e.preventDefault();setScreen('review');return;}
    if(d.nav){setScreen(d.nav);return;}
    if(d.question){changeQ(d.question);return;}
    if(d.filter){filter=d.filter;const rows=paper().questions.filter(q=>filter==='all'||(filter==='pending'?q.status==='pending':q.status!=='pending'));if(rows.length&&!rows.some(q=>q.id===questionId)){changeQ(rows[0].id);}else render();return;}
    if(d.cue!=null){play(+d.cue);return;}
    if(d.libraryCue!=null){const v=$('#libraryVideo');const go=()=>{v.currentTime=+d.libraryCue;v.play().catch(()=>toast('请按播放键重试'));};if(v.readyState)go();else v.addEventListener('loadedmetadata',go,{once:true});return;}
    if(d.course){courseModal(d.course);return;}
    if(d.pick){const x=docs.find(x=>x.id===d.pick);if(x){draft=clipFor(x);closeModal();render();toast('已切换预览，确认后挂载');}return;}
    switch(d.act){
      case 'showAll':filter='all';render();break;case 'newPaper':paperForm();break;case 'newQ':questionForm();break;
      case 'guide':openModal('从一道新题到讲解挂载','<video class="modalvideo" controls playsinline autoplay src="'+asset('media/walkthrough.webm')+'" poster="'+asset('media/walkthrough.webp')+'"></video><p class="hint sectiongap">42 秒字幕演示，按实际匹配结果回放录入、选段、确认和留空。</p>','guide',true);break;
      case 'history':historyModal();break;case 'answer':answerOpen=!answerOpen;render();break;
      case 'close':closeModal();break;case 'pick':pickForm();break;case 'bounds':boundsForm();break;
      case 'reject':rejectForm();break;case 'reopen':commit('重新审核');break;
      case 'confirm':commit('挂载');break;case 'play':play();break;
      case 'voice':voiceOn=!voiceOn;if(!voiceOn){speechSynthesis.cancel();lastSpoken=-1;}else if(!$('#video').paused)speakAt($('#video').currentTime);syncVoice();break;
      case 'full':{const p=$('#player');if(document.fullscreenElement)document.exitFullscreen();else if(p.requestFullscreen)p.requestFullscreen().catch(()=>toast('当前窗口不支持全屏'));else $('#video')?.webkitEnterFullscreen?.();break;}
      case 'exportEval':exportJSON('映题-评测结果.json',YT_EVAL);break;
      case 'exportFeedback':exportJSON('映题-审核反馈.json',{exportedAt:new Date().toISOString(),engine:YT_MATCH.version,papers:state.papers,events:state.events});break;
    }
  });
  document.addEventListener('change',e=>{if(e.target.id==='paperSelect'){paperId=e.target.value;questionId='';filter='all';resetDraft();render();}});
  document.addEventListener('input',e=>{if(e.target.id==='pickSearch')renderPick();if(e.target.dataset.calc)calc();});
  document.addEventListener('submit',e=>{
    e.preventDefault();const form=e.target, data=Object.fromEntries(new FormData(form));for(const k of Object.keys(data))data[k]=String(data[k]).trim();
    if(form.id==='questionForm'){
      if(!data.stem){form.elements.stem.setCustomValidity('请输入题干');form.elements.stem.reportValidity();form.elements.stem.oninput=()=>form.elements.stem.setCustomValidity('');return;}
      refreshState();const q={...data,title:data.title||data.stem.slice(0,20),id:uid(),status:'pending',link:null};
      paper().questions.push(q);filter='all';persist();closeModal();changeQ(q.id);toast('新题已录入，匹配完成');
    }else if(form.id==='paperForm'){
      if(!data.name){form.elements.name.focus();return;}
      refreshState();const p={id:uid(),name:data.name,questions:[]};state.papers.push(p);paperId=p.id;questionId='';filter='all';persist();resetDraft();closeModal();render();toast('试卷已创建');
    }else if(form.id==='boundsForm'){
      const a=parseTime(data.start),b=parseTime(data.end),dur=courses.get(draft.video).duration;
      if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||b>dur||b<=a){$('#boundError').textContent='请确保 0 ≤ 开始时间 < 结束时间 ≤ '+stamp(dur)+'。';return;}
      draft={...draft,start:a,end:b};closeModal();render();toast('已更新预览区间，确认后保存');
    }else if(form.id==='rejectForm'){const q=question();commit(q.status==='linked'?'撤下':draft?'拒绝':'记录缺口',[data.reason,data.note].filter(Boolean).join(' · '));}
  });
  window.addEventListener('storage',e=>{if(e.key===meterKey && !dialog.open){refreshState();resetDraft();render();}});
  screen=['review','catalog','metrics'].includes(location.hash.slice(1))?location.hash.slice(1):'review';
  window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(['review','catalog','metrics'].includes(next))setScreen(next);});
  render();
})();
