const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto').webcrypto;
const root=require('path').resolve(__dirname,'..')+'/',stub={addEventListener(){},innerHTML:'',classList:{toggle(){}},style:{setProperty(){}},value:'',querySelector(){return stub}};
const ctx={window:{scrollTo(){},addEventListener(){}},document:{querySelector(){return stub},querySelectorAll(){return []},addEventListener(){},documentElement:stub},localStorage:{getItem(){return null},setItem(){}},TextEncoder,TextDecoder,Uint8Array,Uint32Array,atob,btoa,console,process,location:{hash:'#home',protocol:'file:'},navigator:{},setTimeout,clearTimeout,setInterval,clearInterval,crypto,Blob,Response,CompressionStream,DecompressionStream};
vm.createContext(ctx);for(const f of ['data.js','course.js','concepts.js','hints.js','engine.js','task-support.js','visuals.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),ctx);for(const k of ['LESSONS','COURSE','CONCEPTS','TASK_HINTS','MathCourse','TaskSupport','CourseVisuals'])ctx[k]=ctx.window[k];
const M=ctx.MathCourse,V=ctx.CourseVisuals;let generated=0,visuals=0;
for(let n=1;n<=45;n++)for(let v=0;v<2;v++)for(let seed=0;seed<100;seed++){
 const t=M.generate(n,v,seed);assert.equal(M.check(t,t.answer).ok,true,JSON.stringify(t));assert.deepEqual(t,M.generate(n,v,seed),'determinism');assert(t.q.length>10&&t.solution.length>0,JSON.stringify(t));generated++;
 if(n===14&&v===0){const m=t.q.match(/Решите (\d+)\(x−(\d+)\)=(-?\d+)/);assert(m);assert.equal(Number(m[1])*(Number(t.answer)-Number(m[2])),Number(m[3]));}
 if(n===15&&v===0){const m=t.q.match(/x²−(\d+)x\+(\d+)/),x=Number(t.answer);assert.equal(x*x-Number(m[1])*x+Number(m[2]),0)}
 if(n===17&&v===1){const m=t.q.match(/√\(x\+(\d+)\)=x/),x=Number(t.answer);assert.equal(Math.sqrt(x+Number(m[1])),x)}
 if(n===27&&v===1){const m=t.q.match(/мешке (\d+) красных и (\d+) синих/),r=Number(m[1]),b=Number(m[2]);let all=0,win=0;for(let i=0;i<r+b;i++)for(let j=0;j<r+b;j++)if(i!==j){all++;if(i<r&&j<r)win++}assert(M.equal(M.parse(t.answer),M.rat(win,all)))}
 if(n===32&&v===1){const m=t.q.match(/за (\d+) и (\d+) ч/);assert(M.equal(M.parse(t.answer),M.rat(BigInt(m[1])*BigInt(m[2])-BigInt(m[1])-BigInt(m[2]),BigInt(m[1])*BigInt(m[2]))))}
}
for(let s=0;s<100;s++){const tasks=M.exam(s);assert.equal(tasks.length,21);for(const t of tasks){assert.equal(M.check(t,t.answer).ok,true);if(!t.rule){const r=M.parse(t.answer);assert(r);let d=r[1];while(d%2n===0n)d/=2n;while(d%5n===0n)d/=5n;assert.equal(d,1n,'Exam decimal must terminate: '+JSON.stringify(t))}}const t=tasks[18];for(let n=100;n<1000;n++){const ds=[...String(n)].reduce((a,b)=>a+Number(b),0);assert.equal(M.check(t,String(n)).ok,ds===t.rule.sum&&n%5===0&&n%10!==0)}}
assert(M.equal(M.parse('0,5'),M.parse('1/2')));assert(M.equal(M.parse('-2¾'),M.parse('-11/4')));assert.equal(M.parse('1/0'),null);assert.equal(M.parse('alert(1)'),null);assert.equal(M.check({answer:'1/3'},'0,333').ok,false);
for(const [k,c] of Object.entries(V.cfg)){const lists=[c.map(x=>x[3]),c.map(x=>x[1]),c.map(x=>x[2])];for(const v of lists){const m=V.model(k,v,'square');assert(m.text&&m.visual&&m.question,k);assert(!/NaN|Infinity|undefined/.test(m.visual),'invalid SVG '+k);const t=V.exercise(k,v,1,'square');assert.equal(M.check(t,t.answer).ok,true,'model task '+k);visuals++}}
for(const mode of ['add','subtract','multiply','divide'])for(const v of [[5,6,3,8],[1,2,3,4],[1,2,0,3],[0,1,1,2]]){const m=V.model('fractionOps',v,mode),t=V.exercise('fractionOps',v,3,mode);assert(!/NaN|Infinity|undefined/.test(m.visual));assert.equal(M.check(t,t.answer).ok,true);if(mode==='divide'&&v[2]===0)assert(m.text.includes('нельзя'));visuals++}
const katex=require(root+'vendor/katex.min.js');let formulas=0;for(const l of ctx.LESSONS){assert.equal(l.tasks.length,7);assert(ctx.COURSE[l.n]);for(const f of l.formulas){katex.renderToString(f,{throwOnError:true});formulas++}const parts=[l.intro,...l.blocks.flat(),...ctx.COURSE[l.n].blocks.flatMap(b=>b.paragraphs)];for(const s of parts)for(const match of s.matchAll(/\$([^$]+)\$/g)){katex.renderToString(match[1],{throwOnError:true});formulas++}}
vm.runInContext(fs.readFileSync(root+'panels.js','utf8'),ctx);ctx.CoursePanels=ctx.window.CoursePanels;for(let n=1;n<=45;n++){assert(ctx.CoursePanels.get(n,0)?.html,'inline explanation '+n)}
vm.runInContext(fs.readFileSync(root+'app-v2.js','utf8'),ctx);
vm.runInContext(`
 for(let n=1;n<=45;n++){const t=conceptTask(n);if(MathCourse.check(t,t.answer).ok!==true||!validTask(t))throw Error('concept');}
 const sample=fresh();sample.attempts=Array.from({length:200},(_,i)=>({id:'test'+i,task:'g:1:0:'+i,topic:1,family:'1:0',ok:true,help:false,at:1793500000000+i}));
 if(!valid(sample))throw Error('valid state');
 const old=migrate({v:1,attempts:[{t:1,i:0,ok:true,help:false,at:1793500000000}],stars:[1],assessment:null});if(!valid(old)||old.attempts[0].legacy!==true)throw Error('migration');
 const oldState=state;
 const complete=fresh(),base=1704067200000;
 complete.attempts.push({id:'concept',task:'k:1',topic:1,family:'concept',ok:true,help:false,at:base});
 for(let i=0;i<7;i++)complete.attempts.push({id:'fixed'+i,task:'f:1:'+i,topic:1,family:'fixed:'+i,ok:true,help:false,at:base});
 for(let i=0;i<20;i++){const t=MathCourse.generate(1,i%2,i);complete.attempts.push({id:'gen'+i,task:t.id,topic:1,family:t.family,ok:true,help:false,at:base+Math.floor(i/7)*86400000,taskSnapshot:t})}
 state=complete;if(!mastery(1).good)throw Error('mastery should be reachable');
 complete.attempts=complete.attempts.filter(x=>x.task!=='k:1');if(mastery(1).good)throw Error('concept gate');
 complete.attempts.push({id:'concept',task:'k:1',topic:1,family:'concept',ok:true,help:false,at:base+3*86400000});
 complete.attempts.filter(x=>x.taskSnapshot).forEach(x=>x.taskSnapshot={...x.taskSnapshot,q:'same repeated content'});if(mastery(1).good)throw Error('different seeds are not different conditions');
 if(examCheck({answer:'0,75'},'3/4'))throw Error('exam format must be enforced');
 for(let n=1;n<=45;n++)for(let v=0;v<2;v++){const t=M.generate(n,v,17),opts=choices(t);if(opts){if(opts.length!==4||opts.filter(o=>M.check(t,o).ok===true).length!==1)throw Error('choices: unique correct');if(n===27&&opts.some(o=>{const r=M.parse(o);return r[0]<0n||r[0]>r[1]}))throw Error('probability distractor outside domain')}}
 const training=M.generate(7,0,99);for(let i=0;i<25;i++){const next=distinctTask(training,[training]);if(!next||next.q===training.q)throw Error('analogue repeats current question')}
 const probe=M.generate(3,0,7);state=fresh();state.draft={id:'retry-test',mode:'topic',tasks:[probe],answers:['999'],results:[null],index:0,started:1704067200000,help:[0],revealed:[false],choices:[null],tries:[0]};grade();if(state.draft.results[0]!==null||state.draft.tries[0]!==1||state.attempts[0].ok!==false||state.draft.revealed[0])throw Error('wrong answer must remain editable without full reveal');state.draft.answers[0]=probe.answer;grade();if(!state.draft.results[0].ok||!state.draft.results[0].help||state.attempts.length!==2)throw Error('retry must count as supported');if(!valid(state))throw Error('retry state invalid');state=oldState;
 state=sample;if(mastery(1).good)throw Error('one-family one-day should not pass');state=oldState;
 (async()=>{const code=await pack(sample),restored=await unpack(code);if(JSON.stringify(restored)!==JSON.stringify(sample))throw Error('round trip');let rejected=false;try{await unpack(code+'x')}catch{rejected=true}if(!rejected)throw Error('checksum');console.log('PASS compressed progress/migration/mastery guards; code length',code.length)})().catch(e=>{console.error(e);process.exitCode=1});`,ctx);
console.log('PASS',generated,'generated tasks;',visuals,'visual states;',formulas,'formula renderings; 100 works / digit predicates.');
