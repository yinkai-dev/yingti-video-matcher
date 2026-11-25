/* In-memory DOM integration test. Media decoding is checked independently.
   node src/check_ui.mjs [absolute path to LinkeDOM's worker.js] */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const {parseHTML}=await import(process.argv[2] || 'linkedom');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const storage=new Map();
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
function session(){
  const {window:dom,document}=parseHTML(read('index.html'));
  const dialog=document.querySelector('dialog');
  dialog.showModal=()=>{dialog.open=true;};
  dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new dom.Event('close'));};
  const v=Object.getPrototypeOf(document.createElement('video'));
  Object.assign(v,{readyState:2,paused:true,currentTime:0,playbackRate:1});
  v.play=function(){this.paused=false;this.dispatchEvent(new dom.Event('play'));return Promise.resolve();};
  v.pause=function(){this.paused=true;this.dispatchEvent(new dom.Event('pause'));};
  const input=Object.getPrototypeOf(document.createElement('input'));
  if(!input.checkValidity)input.checkValidity=function(){const n=Number(this.value);return this.value!==''&&n>=Number(this.getAttribute('min'))&&n<=Number(this.getAttribute('max'));};
  if(!('valueAsNumber' in input))Object.defineProperty(input,'valueAsNumber',{get(){return Number(this.value);}});
  class TestFormData extends Map{
    constructor(form){super([...form.querySelectorAll('[name]')].map(e=>[e.name||e.getAttribute('name'),e.value??e.querySelector('option')?.textContent??'']));}
  }
  const env={document,console,URL,Blob,FormData:TestFormData,crypto:globalThis.crypto,
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    location:{hash:''},history:{replaceState(){}},addEventListener(){},scrollTo(){},
    setTimeout:()=>0,clearTimeout(){}};
  env.window=env;
  const context=vm.createContext(env);
  for(const name of ['corpus.js','seeds.js','matcher.js','evaluation.js','app.js'])vm.runInContext(read(name),context,{filename:name});
  const el=s=>{const e=document.querySelector(s);assert.ok(e,'Missing element '+s);return e;};
  const fire=(node,name)=>node.dispatchEvent(new dom.Event(name,{bubbles:true,cancelable:true}));
  const click=s=>fire(el(s),'click');
  const submit=s=>fire(el(s),'submit');
  const fill=(s,val)=>{el(s).value=val;};
  return {document,dom,el,fire,click,submit,fill};
}
const saved=()=>JSON.parse(storage.get('yingti.review.v1'));
const q1=()=>saved().papers[0].questions[0];
let h=session();
assert.equal(h.document.querySelectorAll('.qrow').length,6);
assert.match(h.el('.bounds').textContent,/00:27 – 00:56/);
h.fire(h.el('#video'),'loadedmetadata');assert.equal(h.el('#video').currentTime,27);
h.click('.quote');assert.equal(h.el('#video').paused,false);assert.ok(h.el('#video').currentTime>=27);
h.el('#video').currentTime=56.1;h.fire(h.el('#video'),'timeupdate');assert.equal(h.el('#video').paused,true);
h.click('[data-act=confirm]');assert.equal(q1().link.start,27);assert.equal(q1().status,'linked');
h.click('[data-act=bounds]');h.fill('[name=start]','01:30');h.submit('#boundsForm');assert.match(h.el('#boundError').textContent,/确保/);
h.fill('[name=start]','00:28');h.fill('[name=end]','00:54');h.submit('#boundsForm');
assert.equal(q1().link.start,27);h.click('[data-act=confirm]');assert.equal(q1().link.start,28);assert.equal(q1().link.end,54);
h.click('[data-act=pick]');h.click('[data-pick="experiment@0"]');assert.equal(q1().link.video,'motion');
h.click('[data-act=confirm]');assert.equal(q1().link.video,'experiment');
h=session();assert.match(h.el('.matchhead').textContent,/已挂载/);assert.match(h.el('.matchhead').textContent,/等时间隔/);
h.click('[data-act=reject]');h.submit('#rejectForm');assert.equal(q1().link,null);assert.equal(q1().status,'rejected');
h.click('[data-question=q-cap]');assert.match(h.el('.empty').textContent,/没有足够可靠/);assert.equal(h.document.querySelector('[data-act=confirm]'),null);
h.click('[data-act=reject]');h.submit('#rejectForm');assert.equal(saved().events.at(-1).action,'记录缺口');
h.click('[data-act=newPaper]');h.fill('[name=name]','交互验证卷');h.submit('#paperForm');assert.match(h.el('.maincol').textContent,/录入第一道题/);
h.click('[data-act=newQ]');h.fill('[name=stem]','两个电阻3 Ω和6 Ω并联，总电流3 A，求6 Ω支路电流。');h.fill('[name=answer]','1 A');h.submit('#questionForm');
assert.match(h.el('.matchhead').textContent,/两个电阻/);h.click('[data-act=confirm]');
assert.equal(saved().papers[1].questions[0].link.video,'circuit');
h.click('[data-filter=pending]');assert.match(h.el('.maincol').textContent,/当前筛选暂无/);h.click('[data-act=showAll]');
h.click('[data-nav=catalog]');assert.equal(h.document.querySelectorAll('.vcard').length,5);h.click('[data-course=motion]');h.click('[data-library-cue="27"]');assert.equal(h.el('#libraryVideo').currentTime,27);h.click('[data-act=close]');
h.click('[data-nav=metrics]');assert.match(h.el('.kpis').textContent,/首选片段命中/);assert.match(h.el('main').textContent,/弱字幕/);
assert.match(h.el('#savings').textContent,/3.67/);
h.fill('[data-calc=n]','200');h.fire(h.el('[data-calc=n]'),'input');assert.match(h.el('#savings').textContent,/7.33/);
assert.equal(saved().events.length,6);
console.log('Passed queue, timestamp seek/stop, trim bounds, deferred replacement, mount, persistence, reject, no-match, paper creation, question intake, filters, catalog, metrics and event history.');
