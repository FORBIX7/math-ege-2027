const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto').webcrypto;
const root=path.resolve(__dirname,'..')+'/';
function boot(map=new Map(),fault={}){const stub={addEventListener(){},innerHTML:'',classList:{toggle(){},add(){},remove(){}},style:{setProperty(){}},value:'',querySelector(){return stub}};const c={window:{scrollTo(){},addEventListener(){}},document:{querySelector(){return stub},querySelectorAll(){return []},addEventListener(){},documentElement:stub,body:stub},localStorage:{getItem(k){if(fault.read?.(k))throw Error('read denied');return map.get(k)??null},setItem(k,v){if(fault.write?.(k))throw Error('quota');map.set(k,v)}},print(){},TextEncoder,TextDecoder,Uint8Array,Uint32Array,atob,btoa,console,location:{hash:'#home',protocol:'file:'},navigator:{},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},katex:require(root+'vendor/katex.min.js'),crypto,Blob,Response,CompressionStream,DecompressionStream};vm.createContext(c);for(const f of ['data.js','course.js','concepts.js','hints.js','engine-v2.1.js','engine.js','visuals.js','panels.js']){vm.runInContext(fs.readFileSync(root+f,'utf8'),c);Object.assign(c,c.window)}c.CourseVisuals.mount=()=>{};vm.runInContext(fs.readFileSync(root+'app-v2.js','utf8'),c);return c}
const run=(c,s)=>vm.runInContext(s,c),key='ponyatno.v2';
for(const raw of ['{invalid json','{"version":2,"attempts":[{"original":"keep me"}]}']){const store=new Map([[key,raw]]),c=boot(store);assert(run(c,'recoveryLocked'));assert([...store].some(([k,v])=>k.startsWith(key+'.recovery.')&&v===raw));run(c,"start('topic',3);state.draft.answers[0]='123';save()");assert.equal(store.get(key),raw);assert.equal(JSON.parse(store.get(key+'.pending')).draft.answers[0],'123');const reloaded=boot(store);assert.equal(run(reloaded,'state.draft.answers[0]'),'123');assert.equal(store.get(key),raw)}
for(const fault of [{write:k=>k.includes('.recovery.')},{write:()=>true},{read:k=>k===key}]){const raw='{broken',store=new Map([[key,raw]]),c=boot(store,fault);run(c,'save()');assert.equal(store.get(key),raw);assert(run(c,'recoveryLocked'))}
const c=boot(),M=c.MathCourse,old=c.MathCourseV21;
assert.equal(M.check({answer:'Через 3 ч'},'3').ok,true);assert.equal(M.check({answer:'Через 1,5 ч'},'1,5').ok,true);assert.equal(M.check({answer:'Через 3 ч'},'2').ok,false);
for(const [target,input,ok] of [['2√3','√12',true],['2√3','−√12',false],['2√3','√13',false],['3','√9',true],['x≤3','(-∞;3]',true],['x≤3','(-∞;3)',false],['(-2;1]','x≤1',false],['x > 5','(5;+∞)',true]])assert.equal(M.check({answer:target},input).ok,ok,target+' / '+input);
for(const route of ['lesson(3,2)','labs()','reference()','printTopic(3)']){run(c,"state=fresh();start('topic',3)");run(c,route);assert.equal(run(c,'state.draft.help[0]'),1,route);run(c,'state.draft.answers[0]=state.draft.tasks[0].answer;grade()');assert.equal(run(c,'state.draft.results[0].help'),true)}
run(c,"state=fresh();lesson(3,0);start('topic',3);state.draft.answers[0]=state.draft.tasks[0].answer;grade()");assert.equal(run(c,'state.draft.results[0].help'),false,'free study before a new question does not taint the new question');
for(const route of ['lesson(3,0)','labs()','reference()','examReport("none")']){run(c,"state=fresh();start('exam')");run(c,route);assert.equal(run(c,'state.draft.mode'),'exam');assert.equal(c.location.hash,'#session');assert(!c.document.querySelector().innerHTML.includes('readerText'),route)}
// Valid data and exact snapshots survive an upgrade, including a pending old task.
const t=old.generate(27,0,55);c.savedTask=t;run(c,"state=fresh();state.attempts=[{id:'legacy-test',task:savedTask.id,topic:27,family:savedTask.family,ok:true,help:false,at:1700000000000,taskSnapshot:savedTask}];state.draft={id:'old-draft',mode:'topic',tasks:[savedTask],answers:['0,9'],results:[null],index:0,started:1700000000000,help:[0],revealed:[false],choices:[null],tries:[0]};save()");const store=new Map([[key,run(c,'JSON.stringify(state)')]]),reloaded=boot(store);assert.equal(run(reloaded,'state.attempts.length'),1);assert.equal(run(reloaded,'state.draft.tasks[0].q'),t.q);assert.equal(run(reloaded,'state.draft.answers[0]'),'0,9');assert.equal(run(reloaded,'valid(state)'),true);
for(let n=1;n<=45;n++)for(let v=0;v<2;v++){const before=old.generate(n,v,35);c.legacyAttempt={task:before.id};const restored=run(c,'restoreTask(legacyAttempt)');assert.equal(restored.q,before.q);assert.equal(restored.answer,before.answer);assert.equal(M.check(restored,before.answer).ok,true)}
c.legacyAttempt={task:'g:unknown:3:0:1',taskSnapshot:{...t,q:'exact stored custom condition'}};assert.equal(run(c,'restoreTask(legacyAttempt).q'),'exact stored custom condition');
// Independent numerical checks use the displayed conditions, not the generator's solution.
const value=s=>{const r=M.parse(s);return Number(r[0])/Number(r[1])};
for(let seed=0;seed<500;seed++){
 let t=M.generate(26,1,seed),m=t.q.match(/3 получили (\d+).*5 — (\d+)/);assert(Math.abs(value(t.answer)-(3*Number(m[1])+5*Number(m[2]))/(Number(m[1])+Number(m[2])))<1e-12);
 t=M.generate(27,0,seed);m=t.q.match(/Из (\d+).*подготовил (\d+)/);assert(Math.abs(value(t.answer)-(Number(m[1])-Number(m[2]))/Number(m[1]))<1e-12);
 t=M.generate(31,1,seed);m=t.q.match(/ехали (\d+).*половину (\d+)/);assert(Math.abs(value(t.answer)-2/(1/Number(m[1])+1/Number(m[2])))<1e-10);
 t=M.generate(30,1,seed);m=t.q.match(/2\^(\d+)/);assert.equal(t.answer,String(2n**BigInt(m[1])%10n));
 t=M.generate(28,1,seed);m=t.q.match(/A посещают (\d+), кружок B — (\d+), оба — (\d+).*больше (\d+).*посещают (\d+) человек/);const [A,B,both,threshold,union]=m.slice(1).map(Number),answer=(A>threshold?'1':'')+(A+B-both===union?'2':'');assert.equal(t.answer,answer);
}
const variation=[];for(const position of [5,8,20]){const tasks=Array.from({length:300},(_,i)=>M.exam(i)[position-1]);const questions=new Set(tasks.map(t=>t.q)),answers=new Set(tasks.map(t=>t.answer));assert(questions.size>20);assert(answers.size>=3);variation.push({position,questions:questions.size,answers:answers.size})}
assert(new Set(Array.from({length:100},(_,i)=>M.exam(i)[16].topic)).size>=5);assert(new Set(Array.from({length:100},(_,i)=>M.exam(i)[17].family)).size>=5);
console.log('PASS preservation / denied storage / reload / legacy snapshots & 90 old families / study assistance / exam isolation / numeric & equivalent answers / 2500 independent math checks.');console.log(JSON.stringify(variation));

// Malformed radical delimiters must not be accepted as equivalent expressions.
assert.notEqual(M.check({answer:'2√3'},'√(12').ok,true);
assert.notEqual(M.check({answer:'2√3'},'√12)').ok,true);

for(let n=1;n<=45;n++){run(c,`state=fresh();start('topic',${n})`);assert.equal(run(c,'new Set(state.draft.tasks.map(t=>t.q)).size'),8,'distinct new practice '+n)}
console.log('PASS 45 new topic queues retain eight distinct conditions.');

for(let seed=0;seed<500;seed++){
 const t=M.exam(seed)[17],kind=seed%5,x=Number(t.answer);let m;
 if(kind===0){m=t.q.match(/−(\d+)x≥(\d+)/);assert(-Number(m[1])*x>=Number(m[2]));assert(-Number(m[1])*(x+1)<Number(m[2]))}
 if(kind===1){m=t.q.match(/(\d+)<x≤(\d+)/);let count=0;for(let z=-100;z<=100;z++)if(z>Number(m[1])&&z<=Number(m[2]))count++;assert.equal(x,count)}
 if(kind===2){m=t.q.match(/x−(\d+)\)\(x\+(\d+)/);const a=Number(m[1]),b=Number(m[2]);assert((x-a)*(x+b)<0);assert((x+1-a)*(x+1+b)>=0)}
 if(kind===3){m=t.q.match(/x−(\d+)\)≤(\d+)/);const b=Number(m[1]),a=Number(m[2]);assert(x>b&&Math.log2(x-b)<=a);assert(Math.log2(x+1-b)>a)}
 if(kind===4){m=t.q.match(/≤(\d+)/);assert(0.5**x<=Number(m[1]));assert(0.5**(x-1)>Number(m[1]))}
}
console.log('PASS 500 independent inequality boundary checks.');
