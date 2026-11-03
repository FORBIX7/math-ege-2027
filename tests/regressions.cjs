const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto').webcrypto;
const root=path.resolve(__dirname,'..')+'/';
function boot(map=new Map(),fault={}){const stub={addEventListener(){},innerHTML:'',classList:{toggle(){},add(){},remove(){}},style:{setProperty(){}},value:'',querySelector(){return stub}};const c={window:{scrollTo(){},addEventListener(){}},document:{querySelector(){return stub},querySelectorAll(){return []},addEventListener(){},documentElement:stub,body:stub},localStorage:{getItem(k){if(fault.read?.(k))throw Error('read denied');return map.get(k)??null},setItem(k,v){if(fault.write?.(k))throw Error('quota');map.set(k,v)}},print(){},TextEncoder,TextDecoder,Uint8Array,Uint32Array,atob,btoa,console,location:{hash:'#home',protocol:'file:'},navigator:{},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},katex:require(root+'vendor/katex.min.js'),crypto,Blob,Response,CompressionStream,DecompressionStream};vm.createContext(c);for(const f of ['data.js','course.js','concepts.js','hints.js','engine-v2.1.js','engine.js','task-support.js','visuals.js','panels.js','textbook.js']){vm.runInContext(fs.readFileSync(root+f,'utf8'),c);Object.assign(c,c.window)}c.CourseVisuals.mount=()=>{};vm.runInContext(fs.readFileSync(root+'app-v2.js','utf8'),c);return c}
const run=(c,s)=>vm.runInContext(s,c),key='ponyatno.v2';
for(const raw of ['{invalid json','{"version":2,"attempts":[{"original":"keep me"}]}']){const store=new Map([[key,raw]]),c=boot(store);assert(run(c,'recoveryLocked'));assert([...store].some(([k,v])=>k.startsWith(key+'.recovery.')&&v===raw));run(c,"start('topic',3);state.draft.answers[0]='123';save()");assert.equal(store.get(key),raw);assert.equal(JSON.parse(store.get(key+'.pending')).draft.answers[0],'123');const reloaded=boot(store);assert.equal(run(reloaded,'state.draft.answers[0]'),'123');assert.equal(store.get(key),raw)}
for(const fault of [{write:k=>k.includes('.recovery.')},{write:()=>true},{read:k=>k===key}]){const raw='{broken',store=new Map([[key,raw]]),c=boot(store,fault);run(c,'save()');assert.equal(store.get(key),raw);assert(run(c,'recoveryLocked'))}
const c=boot(),M=c.MathCourse,old=c.MathCourseV21;
// A correct pair is not a mathematical error just because it uses «и».
const bracketTask=run(c,"fixed.find(t=>t.id==='f:1:5')");
for(const input of ['-25 и 25','−25; 25','-25\n25','−25,0 и 25,00'])assert.equal(M.check(bracketTask,input).ok,true,input);
assert.equal(M.check(bracketTask,'25 и -25').ok,false,'expression values must retain their order');
for(const input of ['-25','-25, 25','-25 и двадцать пять'])assert.equal(M.check(bracketTask,input).ok,null,'format guidance before counting a mistake');
const roots={q:'Решите уравнение',answer:'−1/2; 2'};
assert.equal(M.check(roots,'2 и −0,5').ok,true,'root order is free and decimal commas remain decimal');
assert.equal(M.check(roots,'2; 2').ok,false,'do not reuse one matched element');
assert.equal(M.check({answer:'1; 1; 2'},'1; 2; 2').ok,false);
assert.equal(M.check(run(c,"fixed.find(t=>t.id==='f:2:0')"),'5; 8').ok,true);
assert.equal(M.check(run(c,"fixed.find(t=>t.id==='f:35:5')"),'4 и 8').ok,true,'unlabelled segment lengths may be in either order');
assert.equal(M.answerSpec({answer:'−2; −1; 1; 2'}).example,'2 и −3 и 4 и −5');
assert.notEqual(M.check({type:'matching',answer:'123'},'1 и 2 и 3').ok,true);
assert.equal(M.check({answer:'(−2;1]'},'−2 и 1').ok,null,'an interval is not a number list');
assert.equal(c.TaskSupport.fixedCount,315);
for(const t of run(c,'fixed')){
 const steps=c.TaskSupport.steps(t);
 assert.equal(steps[0].title,'На что обратить внимание',t.id+' has an authored hint');
 assert(steps.length>=2&&steps.length<=3,t.id);
 assert(steps.every(x=>typeof x.text==='string'&&x.text.trim().length>0),t.id);
}
const bracketSteps=c.TaskSupport.steps(bracketTask);
assert.equal(bracketSteps.length,2);
assert(bracketSteps[0].text.includes('основание'));
assert(bracketSteps[1].text.includes('−(5 · 5)'));
assert(c.TaskSupport.solution(bracketTask).includes('−25 и 25'));
assert(bracketSteps.every(x=>!x.text.includes('сложение')),'no generic addition hint in an exponent task');
// A historical or custom condition must never inherit an editorial hint by id.
const historical={...bracketTask,q:'Совсем другое сохранённое условие',solution:'Особый первый шаг. Особый второй шаг.'};
assert.equal(c.TaskSupport.steps(historical)[0].text,historical.solution);
assert.equal(c.TaskSupport.steps(historical)[0].title,'Начало разбора этой задачи');
assert.equal(historical.q,'Совсем другое сохранённое условие');
const overridden={...M.generate(8,1,20),q:'Другое условие',solution:'Начните с перевода литров. Продолжите расчёт.'};
assert.equal(c.TaskSupport.steps(overridden)[0].text,overridden.solution);
for(let n=1;n<=45;n++)for(let v=0;v<2;v++)for(const seed of [0,71,999]){
 const t=M.generate(n,v,seed),steps=c.TaskSupport.steps(t);
 assert.equal(steps[0].title,'На что обратить внимание',t.id);
 assert.equal(steps[0].text,c.TASK_HINTS[n][v]);
}
// Follow the actual wrong-answer / hint / correction flow. Formatting does not
// create an attempt or mark a task as supported; requesting help does.
c.testTask=bracketTask;
const reset=()=>run(c,"state=fresh();state.draft={id:'brackets',mode:'topic',tasks:[testTask],answers:['-25 и 25'],results:[null],index:0,started:Date.now(),help:[0],revealed:[false],choices:[null],tries:[0]}");
reset();run(c,'grade()');assert.equal(run(c,'state.draft.results[0].ok'),true);assert.equal(run(c,'state.draft.results[0].help'),false);
reset();run(c,"state.draft.answers[0]='-25';grade()");assert.equal(run(c,'state.attempts.length'),0);assert.equal(run(c,'state.draft.help[0]'),0);
reset();run(c,"state.draft.answers[0]='25 и 25';grade()");assert.equal(run(c,'state.draft.results[0]'),null);assert.equal(run(c,'state.draft.tries[0]'),1);
assert(!run(c,'retryMessage(testTask,1)').includes('Умножение и сложение'));
assert(run(c,'retryMessage(testTask,2)').includes('−(5 · 5)'));
assert(!run(c,'hintText(testTask,2)').includes('правила знаков'));
run(c,"state.draft.answers[0]='-25 и 25';grade()");assert.equal(run(c,'state.draft.results[0].ok'),true);assert.equal(run(c,'state.draft.results[0].help'),true);
assert(run(c,"button('−','key:−')").includes('type="button"'),'symbol buttons cannot submit the answer');
console.log('PASS task-specific hints for 315 fixed tasks / 270 generated cases / saved conditions / ordered answers / correction flow.');
for(const [kind,config] of Object.entries(c.CourseVisuals.cfg)){
 const values=config.map(row=>row[3]);
 for(const mode of kind==='fractionOps'?['add','subtract','multiply','divide']:kind==='derivative'?['square','abs']:['square']){
  const t=c.CourseVisuals.exercise(kind,values,1,mode),steps=c.TaskSupport.steps(t);
  assert(steps.length>=2,kind);
  assert.equal(steps[0].title,'На что обратить внимание',kind);
  assert(!/NaN|undefined/.test(t.solution),kind);
 }
}
for(const [kind,values,expected] of [['probability',[3,2],['3/5','2/4']],['sets',[3,4,2],['3 + 4 + 2']],['area',[6,4,3],['3²','108']],['expLog',[3],['3','9']],['numberline',[2,-3],['-1','влево']]]){
 const t=c.CourseVisuals.exercise(kind,values,1);
 for(const fragment of expected)assert(t.solution.includes(fragment),kind+' / '+fragment);
}
console.log('PASS model hints and condition-specific solutions, including two draws, disjoint sets and similar areas.');
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

// A saved task retains its original snapshot but its ambiguous wording is clarified on screen.
const numberTask=c.CourseVisuals.exercise('numberline',[2,-3],1);
assert.equal(numberTask.q,'Вычислите: 2 + (-3).');
assert.equal(M.check(numberTask,'-1').ok,true);
c.wordingTask={...numberTask,q:'Число 2 изменили на -3. Найдите результат.'};
assert.equal(run(c,'taskQuestion(wordingTask)'),'Вычислите: 2 + (-3).');
assert.equal(c.wordingTask.q,'Число 2 изменили на -3. Найдите результат.');
run(c,"state=fresh();start('topic',1);grade(false,'unknown')");
assert(run(c,"feedback(state.draft.tasks[0],state.draft.results[0])").includes('Разберём решение вместе'));
assert(c.CourseVisuals.exercise('box',[4,3,2,30],41).q.includes('прямоугольного параллелепипеда'));
assert(c.CourseVisuals.exercise('probability',[3,2],27).q.includes('не возвращая первый'));
assert(c.CourseVisuals.exercise('work',[6,12,2],32).q.includes('каждый работает один'));
assert(c.CourseVisuals.exercise('circle',[80,230],39).q.includes('опирающийся на ту же дугу'));
console.log('PASS unambiguous addition / saved wording without snapshot loss / no-answer feedback / required geometry and probability assumptions.');

// Accept the original fixed answers, including their units, without broad text evaluation.
for(const t of run(c,'fixed'))assert.equal(M.check(t,t.answer).ok,true,'canonical fixed answer '+t.id);
for(const [answer,input,ok] of [
 ['630 руб.','630',true],['630 руб.','630 руб',true],['630 руб.','630,0 руб.',true],
 ['630 руб.','631 руб.',false],['630 руб.','630 кг',null],['25%','25',true],
 ['25%','25 %',true],['12 см²','12',true],['12 см²','12 см',null],
 ['Через 3 ч','3',true],['За 4 мин','4 мин',true],['1/2','0,5',true],
 ['1/2','0,5 кг',null],['12 см²','alert(12)',null]
])assert.equal(M.check({answer},input).ok,ok,answer+' <- '+input);
run(c,"state=fresh();start('topic',1);state.draft.tasks[0]={...state.draft.tasks[0],answer:'630 руб.'};state.draft.answers[0]='630 кг';grade()");
assert.equal(run(c,'state.attempts.length'),0,'unit format error must not become a wrong attempt');
assert.equal(run(c,'state.draft.results[0]'),null);
run(c,"state.draft.answers[0]='630 руб.';grade()");
assert.equal(run(c,'state.draft.results[0].ok'),true);

// All topics open as continuous reading; original chapter indices/material stay available.
assert.equal(Object.keys(c.Textbook.topics).length,45);
for(let n=1;n<=45;n++){
 c.readingNumber=n;
 const html=c.Textbook.render(n),topic=c.Textbook.topics[n];
 assert(html.includes('read-example-'+n),'worked example anchor '+n);
 assert(html.includes('Проверяем результат'),'independent check '+n);
 assert(!/NaN|undefined|Infinity/.test(html),'invalid figure/text '+n);
 for(const [heading] of topic.sections)assert(html.includes(heading));
 run(c,'state=fresh();readTopic(readingNumber)');
 assert(run(c,"document.querySelector('#app').innerHTML").includes('Формулы для повторения'));
 run(c,'lesson(readingNumber,0)');
 assert(run(c,"document.querySelector('#app').innerHTML").includes('expandedTextbook'));
 assert.equal(run(c,'chapterList(byTopic(readingNumber))[0].blockIndex'),0);
}
const substitutionChapter=c.Textbook.render(14);
for(const text of ['3 · 4 + 2 = 14','Числа 3 и 2 мы не заменяем','Откуда взять 4','3x + 2 − 2 = 14 − 2','3x : 3 = 12 : 3'])assert(substitutionChapter.includes(text),text);
// Exercise each actual widget handler, including boundaries and negative substitutions.
for(const [kind,values] of Object.entries({equation:[0,1,4,8],substitution:[-4,-2,0,4],function:[-3,0,3,4],linear:[-2,0,2,4],exponential:[-3,0,3],exponentEquation:[-1.5,-1,0,3],derivative:[-2,0,1,2],quadraticShift:[-3,0,3],hyperbolaScale:[1,2,6],logarithm:[.25,1,3,8],wave:[0,.125,.25,.5,1,2]})){
 for(const value of values){
  const output={},result={},input={value,addEventListener(event,handler){this.update=handler}},host={dataset:{bookProbe:kind},querySelector(selector){return selector==='input'?input:selector==='[data-value]'?output:result}};
  c.Textbook.mount({querySelectorAll(){return [host]}});
  assert(result.innerHTML&&!/NaN|undefined|Infinity/.test(result.innerHTML),kind+value);
  if(kind==='equation')assert.equal(result.innerHTML.includes('✓ Равенство выполнено'),value===4);
  if(kind==='substitution')assert(result.innerHTML.includes(String(2*value*value-3*value).replace(/-/g,'−')));
  if(kind==='logarithm')assert(result.innerHTML.includes('≈')&&result.innerHTML.includes('x ≤ 0'));
  if(kind==='wave')assert(result.innerHTML.includes('период равен π'));
  if(kind==='hyperbolaScale')assert(result.innerHTML.includes('две ветви не соединяются'));
  if(kind==='derivative')assert(result.innerHTML.includes('Наклон')&&result.innerHTML.includes('Высота'));
  input.value=value;input.update();
 }
}
// Fractions need visibly different selected/unselected pieces, not decorative empty strips.
const fraction=c.Textbook.visual(2);
assert.equal((fraction.match(/class="selected"/g)||[]).length,5);
assert.equal((fraction.match(/<i /g)||[]).length,8);
console.log('PASS 315 canonical fixed answers / units without false errors / all 45 continuous chapters / substitution explanation / interactive widget boundaries.');
