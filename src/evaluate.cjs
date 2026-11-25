/* Run with Node 18+. Gold lives outside the browser deployment. */
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..');
require(path.join(root,'dist/corpus.js'));
const M=require(path.join(root,'dist/matcher.js'));
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const cases=read('research/cases.json'), editor=read('research/editorial.json');
const t0=performance.now(),idx=M.createIndex(globalThis.YT_CORPUS),indexMs=performance.now()-t0;
function overlap(a,b){return Math.max(0,Math.min(a.end,b.end)-Math.max(a.start,b.start))/(Math.max(a.end,b.end)-Math.min(a.start,b.start));}
function expected(doc,keys){return keys.map(k=>editor[k]).filter(g=>g.video===doc.video).sort((a,b)=>overlap(b,doc)-overlap(a,doc))[0];}
function hit(doc,g){return !!g && overlap(doc,g)>=.5;}
const round=(v,n=3)=>Number(v.toFixed(n));
const median=a=>{const b=a.slice().sort((x,y)=>x-y);return b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2;};
function runCase([id,stem,answer,keys], corpusIndex=idx){
  const ranked=M.search(corpusIndex,{stem,answer}),qualified=ranked.filter(r=>r.eligible);
  const lexical=ranked.slice().sort((a,b)=>b.lexical-a.lexical)[0],best=qualified[0],g=best&&expected(best.doc,keys);
  const correct=!!best&&hit(best.doc,g);
  return {id,stem,answer,gold:keys,top:best?.doc.id||null,score:best?.score??null,
    top1:correct,top3:qualified.slice(0,3).some(r=>hit(r.doc,expected(r.doc,keys))),
    returned:!!best,lexTop:lexical.doc.id,lexScore:round(lexical.lexical),
    lexHit:hit(lexical.doc,expected(lexical.doc,keys)),iou:correct?round(overlap(best.doc,g)):null,
    startError:correct?Math.abs(best.doc.start-g.start):null,endError:correct?Math.abs(best.doc.end-g.end):null,
    reason:best?null:[...ranked[0].conflicts,...ranked[0].gaps][0]||'可核实的匹配依据不足'};
}
const dev=cases.dev.map(r=>runCase(r)),rows=cases.challenge.map(r=>runCase(r));
// Choose the BM25-only reject threshold on development examples, then freeze it for the challenge.
const thresholds=[0,...dev.map(r=>r.lexScore+.001)];
function balanced(list,k){
  const pos=list.filter(r=>r.gold.length),neg=list.filter(r=>!r.gold.length);
  return (pos.filter(r=>r.lexHit&&r.lexScore>=k).length/pos.length+neg.filter(r=>r.lexScore<k).length/neg.length)/2;
}
const cutoff=thresholds.sort((a,b)=>balanced(dev,b)-balanced(dev,a)||b-a)[0];
const pos=rows.filter(r=>r.gold.length),neg=rows.filter(r=>!r.gold.length),matches=pos.filter(r=>r.top1),issued=rows.filter(r=>r.returned);
const spans=matches.filter(r=>{const d=idx.docs.find(d=>d.id===r.top);return !d.whole;});
const times=[];
for(let n=0;n<16;n++)for(const [,stem,answer] of cases.challenge){
  const t=performance.now();M.search(idx,{stem,answer});if(n>=2)times.push(performance.now()-t);
}
times.sort((a,b)=>a-b);
const stats={positive:pos.length,negative:neg.length,top1:matches.length,top3:pos.filter(r=>r.top3).length,
  withheld:neg.filter(r=>!r.returned).length,issued:issued.length,correct:matches.length,
  lexicalTop1:pos.filter(r=>r.lexHit&&r.lexScore>=cutoff).length,lexicalWithheld:neg.filter(r=>r.lexScore<cutoff).length,
  lexicalIssued:rows.filter(r=>r.lexScore>=cutoff).length,lexicalRawTop1:pos.filter(r=>r.lexHit).length,lexicalCutoff:round(cutoff),
  spans:spans.length,medianIou:spans.length?median(spans.map(r=>r.iou)):null,
  startMae:spans.length?round(spans.reduce((s,r)=>s+r.startError,0)/spans.length):null,
  endMae:spans.length?round(spans.reduce((s,r)=>s+r.endError,0)/spans.length):null,
  indexMs:round(indexMs,2),p50:round(median(times),2),p95:round(times[Math.ceil(times.length*.95)-1],2),timings:times.length,
  docs:idx.docs.length,courseSeconds:YT_CORPUS.reduce((s,v)=>s+v.duration,0),videos:YT_CORPUS.length,dev:dev.length};
const fresh=read('research/paraphrases.json').map(r=>runCase(r));
const freshPos=fresh.filter(r=>r.gold.length),freshNeg=fresh.filter(r=>!r.gold.length);
const degraded=globalThis.YT_CORPUS.map(c=>({...c,cues:c.cues.map((cue,i)=>({...cue,
  start:Math.max(0,cue.start+[1.2,-.7,1.5][i%3]),end:Math.min(c.duration,cue.end+[.6,1.1,-1.4][i%3]),
  text:cue.text.replace(/^(换一道题。|再看一个落点问题。|下一题。|换一种接法。)/,''),
  heading:'',board:''}))}));
const noisyIndex=M.createIndex(degraded), noisyRows=cases.challenge.map(r=>runCase(r,noisyIndex));
const noisyPos=noisyRows.filter(r=>r.gold.length),noisyNeg=noisyRows.filter(r=>!r.gold.length);
const probes={developmentSnapshot:{version:'yt-physics-1.0',freshTop:5,freshWithheld:5,noisyTop:6,noisyWithheld:12},freshPos:freshPos.length,freshTop:freshPos.filter(r=>r.top1).length,freshNeg:freshNeg.length,
  freshWithheld:freshNeg.filter(r=>!r.returned).length,noisyDocs:noisyIndex.docs.length,
  noisyTop:noisyPos.filter(r=>r.top1).length,noisyWithheld:noisyNeg.filter(r=>!r.returned).length};
// Missing speech from the question setup is a separate stress condition.
const clipped=degraded.map((c,vi)=>({...c,cues:c.cues.map((cue,i)=>((i+vi)%4===0?{...cue,text:''}:cue))}));
const lostIndex=M.createIndex(clipped), lostRows=cases.challenge.map(r=>runCase(r,lostIndex));
probes.missingTop=lostRows.filter(r=>r.gold.length&&r.top1).length;
probes.missingWithheld=lostRows.filter(r=>!r.gold.length&&!r.returned).length;
probes.missingDocs=lostIndex.docs.length;
const result={version:M.version,stats,rows,probes,fresh,noisyRows,lostRows};
fs.writeFileSync(path.join(root,'research/results.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(root,'dist/evaluation.js'),'globalThis.YT_EVAL = '+JSON.stringify(result)+';\n');
console.log(stats,probes);
for(const r of fresh.filter(r=>r.gold.length?!r.top1:r.returned))console.log("补测",r.id,r.top,r.reason);
for(const r of rows.filter(r=>r.gold.length?!r.top1:r.returned))console.log(r.id,r.top,r.reason||'不应推荐');
