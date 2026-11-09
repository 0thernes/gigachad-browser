'use strict';

// Verification-only: execute the unchanged CPU section of the production method
// on owned arrays. No application, model server, GPU, or browser is launched.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const METHOD='      stepContinuousWorldModelAndFeralMorph60Hz(tick = 0, frameCount = 0, sw = 960, sh = 600) {';
const START='        // 4. Action-Conditioned Selective State-Space Model (SSM / S4 / Mamba-Style Linear O(N) Transition Dynamics):';
const END='        // 5. FERAL ANTI-LOOP RAUT & HALLUCINATION ENGINE + RAPID MORPHODYNAMICS (EXPAND / CONTRACT / EXTEND / SHRINK / HARPOON)';
const FIELD_LENGTHS={delta:64,actProj128:128,H:128,prevValidH:128,predZ:64,reconstructedStream64:64};
const TOLERANCE=Object.freeze({absolute:1e-4,relative:1e-3,rule:'abs(actual-reference) <= absolute + relative*abs(reference); every value must be finite'});
const CASES=Object.freeze([
  {id:'zero',seed:1,steps:1},
  {id:'impulse',seed:0x19012201,steps:64},
  {id:'bounded-random',seed:0x12345678,steps:128},
  {id:'long-sequence',seed:0x90abcdef,steps:512},
  {id:'selective-clamps',seed:0x205da11,steps:8},
  {id:'mouse-threshold',seed:0x0c121212,steps:6},
  {id:'near-zero',seed:0x0a000149,steps:4},
  {id:'saturated-action',seed:0x55aa55aa,steps:32},
  {id:'cancelling-dot-products',seed:0xa55aa55a,steps:32}
]);
const SOURCES=['index.html','scripts/alive-ssm-parity.cjs','scripts/alive_ssm_reference.py','tests/alive-ssm-parity.test.cjs'];
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const sourceHashes=()=>Object.fromEntries(SOURCES.map(name=>[name,sha256(fs.readFileSync(path.join(root,name)))]));
function extractBlock(source) {
  for(const [name,marker] of Object.entries({METHOD,START,END}))if(source.split(marker).length!==2)throw new Error('Expected exactly one unchanged '+name+' anchor');
  const methodAt=source.indexOf(METHOD),startAt=source.indexOf(START),endAt=source.indexOf(END);
  if(!(methodAt<startAt&&startAt<endAt))throw new Error('CPU SSM anchor order is invalid');
  const block=source.slice(startAt,endAt);
  return {block,sha256:sha256(block),firstLine:source.slice(0,startAt).split('\n').length,lastLine:source.slice(0,endAt).split('\n').length-1};
}
function compileBlock(block) {
  return new Function('wm','z','raut','mouseSpeedPx','act32','H','A','delta','B','C','D','actProj128','prevValidH','predZ',block);
}
function rng(seed) { let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;}; }
function makeCases(specs=CASES) {
  return specs.map(spec=>{
    const random=rng(spec.seed),array=(length,scale=1)=>Array.from({length},()=>Math.fround((random()*2-1)*scale));
    const state={H:array(128,.6),A:Array.from({length:128},()=>Math.fround(-.02-random()*1.83)),B:array(128,.7),C:array(128,.7),D:array(64,.3),Wdel:array(4096,.6),Wact:array(4096,.15)};
    const frames=Array.from({length:spec.steps},(_,t)=>({z:array(64),raut:array(64),act32:array(32),mouseSpeedPx:[0,12-1e-9,12,12+1e-9,30][t%5]}));
    if(spec.id==='zero') {for(const values of Object.values(state))values.fill(0);for(const f of frames){f.z.fill(0);f.raut.fill(0);f.act32.fill(0);f.mouseSpeedPx=0;}}
    if(spec.id==='impulse') {state.H.fill(0);for(const [t,f] of frames.entries()){f.z.fill(0);f.raut.fill(0);f.act32.fill(0);f.mouseSpeedPx=0;if(t===0){f.z[0]=1;f.z[63]=-1;f.act32[0]=1;}}}
    if(spec.id==='selective-clamps') {state.Wdel.fill(0);for(let r=0;r<64;r++)state.Wdel[r*64+r]=1;const inputs=[-100,-4.000001,-4,-.000001,.000001,4,4.000001,100];for(const [t,f] of frames.entries()){f.z.fill(inputs[t]);f.raut.fill(0);f.mouseSpeedPx=0;}}
    if(spec.id==='mouse-threshold') {state.Wdel.fill(0);for(const [t,f] of frames.entries()){f.raut.fill(0);f.mouseSpeedPx=[0,12-1e-9,12,12+1e-9,12,30][t];}}
    if(spec.id==='near-zero') {for(const [name,values] of Object.entries(state))values.fill(name==='A'?-Math.pow(2,-126):Math.pow(2,-149));for(const f of frames){f.z.fill(Math.pow(2,-149));f.raut.fill(0);f.act32.fill(Math.pow(2,-126));f.mouseSpeedPx=0;}}
    if(spec.id==='saturated-action') {state.H=state.H.map(v=>v<0?-1:1);state.B=state.B.map(v=>v*100);state.C=state.C.map(v=>v*100);state.Wact=state.Wact.map(v=>v*10000);state.A=state.A.map((v,i)=>i%3===0?0:i%3===1?-100:v);for(const f of frames)f.act32=f.act32.map(v=>v*100);}
    if(spec.id==='cancelling-dot-products') {for(let r=0;r<128;r++)for(let c=0;c<32;c++)state.Wact[r*32+c]=[100000,-100000,1e-4,-1e-4][c%4];for(const f of frames)f.act32=Array.from({length:32},(_,i)=>i%8<4?1:-1);}
    return {id:spec.id,seed:spec.seed,state,frames};
  });
}
function vector(values,length,name) {
  if(!Array.isArray(values)||values.length!==length||values.some(v=>!Number.isFinite(v)))throw new Error('Invalid shape/nonfinite input: '+name);
  const result=new Float32Array(values);if(result.some(v=>!Number.isFinite(v)))throw new Error('Input overflows FP32: '+name);return result;
}
function runCase(testCase,execute) {
  const s=testCase.state,H=vector(s.H,128,'H'),A=vector(s.A,128,'A'),B=vector(s.B,128,'B'),C=vector(s.C,128,'C'),D=vector(s.D,64,'D');
  const wm={W_ssm_delta:vector(s.Wdel,4096,'Wdel'),W_ssm_action:vector(s.Wact,4096,'Wact'),reconstructedStream64:new Float32Array(64)};
  const delta=new Float32Array(64),actProj128=new Float32Array(128),prevValidH=new Float32Array(128),predZ=new Float32Array(64),traces=[];
  for(const frame of testCase.frames) {
    if(!Number.isFinite(frame.mouseSpeedPx))throw new Error('Nonfinite mouseSpeedPx');
    execute(wm,vector(frame.z,64,'z'),vector(frame.raut,64,'raut'),frame.mouseSpeedPx,vector(frame.act32,32,'act32'),H,A,delta,B,C,D,actProj128,prevValidH,predZ);
    traces.push(Object.fromEntries(Object.entries({delta,actProj128,H,prevValidH,predZ,reconstructedStream64:wm.reconstructedStream64}).map(([name,value])=>[name,Array.from(value)])));
  }
  return {id:testCase.id,traces};
}
function runPythonReference(cases,{python=process.env.GIGACHAD_SSM_PYTHON||'python'}={}) {
  const result=spawnSync(python,[path.join(__dirname,'alive_ssm_reference.py')],{cwd:root,input:JSON.stringify({schema:1,cases}),encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:32*1024*1024});
  if(result.error||result.status!==0)throw new Error('Independent Python reference failed: '+(result.error?.message||result.stderr||'exit '+result.status));
  return JSON.parse(result.stdout);
}
function compareTraces(actual,reference,tolerance=TOLERANCE) {
  const report={ok:true,compared:0,mismatches:0,nonFinite:0,shapeErrors:[],firstFailures:[],fields:{},cases:[]};
  const fail=entry=>{report.ok=false;if(report.firstFailures.length<20)report.firstFailures.push(entry);};
  if(actual.length!==reference.length){report.shapeErrors.push('case-count');fail({reason:'case-count'});}
  for(let ci=0;ci<Math.max(actual.length,reference.length);ci++) {
    const a=actual[ci],b=reference[ci],caseResult={id:a?.id||b?.id,steps:a?.traces?.length||0,compared:0,mismatches:0,nonFinite:0,maxAbsoluteError:0,maxToleranceRatio:0};
    report.cases.push(caseResult);
    if(!a||!b||a.id!==b.id||a.traces.length!==b.traces.length){report.shapeErrors.push(caseResult.id);fail({case:caseResult.id,reason:'case-id/trace-count'});continue;}
    for(let t=0;t<a.traces.length;t++)for(const [name,length] of Object.entries(FIELD_LENGTHS)) {
      const x=a.traces[t][name],y=b.traces[t][name];
      if(!Array.isArray(x)||!Array.isArray(y)||x.length!==length||y.length!==length){report.shapeErrors.push(`${a.id}:${t}:${name}`);fail({case:a.id,step:t,field:name,reason:'shape'});continue;}
      const metric=report.fields[name]||(report.fields[name]={compared:0,maxAbsoluteError:0,maxRelativeErrorForNonzeroReference:0,maxToleranceRatio:0});
      for(let i=0;i<length;i++) {
        report.compared++;caseResult.compared++;metric.compared++;
        if(!Number.isFinite(x[i])||!Number.isFinite(y[i])){report.nonFinite++;caseResult.nonFinite++;fail({case:a.id,step:t,field:name,index:i,reason:'nonfinite',actual:String(x[i]),reference:String(y[i])});continue;}
        const abs=Math.abs(x[i]-y[i]),allowed=tolerance.absolute+tolerance.relative*Math.abs(y[i]),ratio=abs/allowed;
        metric.maxAbsoluteError=Math.max(metric.maxAbsoluteError,abs);metric.maxToleranceRatio=Math.max(metric.maxToleranceRatio,ratio);
        if(y[i]!==0)metric.maxRelativeErrorForNonzeroReference=Math.max(metric.maxRelativeErrorForNonzeroReference,abs/Math.abs(y[i]));
        caseResult.maxAbsoluteError=Math.max(caseResult.maxAbsoluteError,abs);caseResult.maxToleranceRatio=Math.max(caseResult.maxToleranceRatio,ratio);
        if(abs>allowed){report.mismatches++;caseResult.mismatches++;fail({case:a.id,step:t,field:name,index:i,actual:x[i],reference:y[i],absoluteError:abs,allowed});}
      }
    }
  }
  return report;
}
function declaration() {
  const source=fs.readFileSync(path.join(root,'index.html'),'utf8'),extracted=extractBlock(source),inputs={schema:1,cases:makeCases()};
  return {inputs,plan:{schema:1,scope:'CPU numerical comparison of the unchanged selective-SSM block only; no browser, GPU, whole-model, scientific or full PDF G1 qualification',
    acceptance:{tolerance:TOLERANCE,allFields:FIELD_LENGTHS,allCasesRequired:true,allStepsRequired:true,allOutputsFinite:true,sourceDriftAllowed:false},cases:CASES,
    rounding:'Inputs and every production TypedArray store are binary32; arithmetic between stores is binary64. Python uses independently expressed equations and math.fsum dot products.',
    random:'LCG uint32: state=(1664525*state+1013904223) mod 2^32; input generation only',
    sourceHashes:sourceHashes(),extraction:{sha256:extracted.sha256,firstLine:extracted.firstLine,lastLine:extracted.lastLine},inputSha256:sha256(JSON.stringify(inputs))}};
}
function declare(outputDir) {
  const {inputs,plan}=declaration();fs.mkdirSync(outputDir,{recursive:true});
  if(fs.existsSync(path.join(outputDir,'plan.json')))throw new Error('Declaration already exists; do not overwrite a frozen plan');
  fs.writeFileSync(path.join(outputDir,'inputs.json'),JSON.stringify(inputs));
  fs.writeFileSync(path.join(outputDir,'plan.json'),JSON.stringify({...plan,declaredAt:new Date().toISOString()},null,2)+'\n');
  return plan;
}
function run(outputDir) {
  const startedAt=new Date().toISOString(),planPath=path.join(outputDir,'plan.json'),planBytes=fs.readFileSync(planPath),declared=JSON.parse(planBytes),current=declaration();
  const {declaredAt,...fixed}=declared;
  if(JSON.stringify(fixed)!==JSON.stringify(current.plan))throw new Error('Frozen cases, acceptance, source or oracle changed after declaration');
  const inputBytes=fs.readFileSync(path.join(outputDir,'inputs.json'));if(sha256(inputBytes)!==declared.inputSha256)throw new Error('Declared input bytes changed');
  const inputs=JSON.parse(inputBytes),extract=extractBlock(fs.readFileSync(path.join(root,'index.html'),'utf8')),execute=compileBlock(extract.block);
  const before=performance.now(),actual=inputs.cases.map(c=>runCase(c,execute)),jsMs=performance.now()-before;
  const pyAt=performance.now(),reference=runPythonReference(inputs.cases),pythonWallMs=performance.now()-pyAt;
  const comparison=compareTraces(actual,reference.cases),endHashes=sourceHashes(),drift=Object.keys(declared.sourceHashes).filter(name=>declared.sourceHashes[name]!==endHashes[name]);
  const artifacts={};for(const [name,value] of [['actual-traces',actual],['reference-traces',reference]]){const bytes=zlib.gzipSync(JSON.stringify(value));const file=path.join(outputDir,name+'.json.gz');fs.writeFileSync(file,bytes);artifacts[name]={path:file,sha256:sha256(bytes),bytes:bytes.length};}
  const report={startedAt,completedAt:new Date().toISOString(),ok:comparison.ok&&drift.length===0,scope:declared.scope,pdfGateG1:'NOT_RUN',
    originalApplicationModified:false,applicationLaunched:false,backend:{actual:'Node/V8 JavaScript CPU, production block extracted unchanged',reference:'Independent Python CPU equations'},
    plan:{path:planPath,sha256:sha256(planBytes),declaredAt},sourceHashes:declared.sourceHashes,sourceHashesAtEnd:endHashes,changedSources:drift,extraction:declared.extraction,
    runtime:{node:{versions:process.versions,platform:process.platform,arch:process.arch,execPath:process.execPath},python:reference.runtime},
    tolerance:declared.acceptance.tolerance,inputSha256:declared.inputSha256,jsComputeMs:jsMs,pythonProcessWallMs:pythonWallMs,comparison,artifacts,
    limitations:['This is not browser execution, GPU dispatch/readback, composed model parity, or a frame-rate measurement.','The supplied WGSL module implements a different recurrence and is outside this comparison.','No threshold, seed, case or source was changed after the frozen declaration.']};
  fs.writeFileSync(path.join(outputDir,'report.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module) {
  const command=process.argv[2],output=path.resolve(process.argv[3]||path.join(root,'research_notes/alive-overdrive-verification/ssm-parity-20261108'));
  try {
    if(command==='--declare'){const plan=declare(output);console.log(JSON.stringify({declared:true,output,cases:plan.cases.length,steps:plan.cases.reduce((n,c)=>n+c.steps,0),inputSha256:plan.inputSha256}));}
    else if(command==='--run'){const report=run(output);console.log(JSON.stringify({ok:report.ok,output,compared:report.comparison.compared,mismatches:report.comparison.mismatches,nonFinite:report.comparison.nonFinite,fields:report.comparison.fields,pdfGateG1:report.pdfGateG1}));process.exitCode=report.ok?0:1;}
    else throw new Error('Use --declare followed by --run; optional output directory');
  }catch(error){console.error(error.stack||String(error));process.exitCode=1;}
}
module.exports={METHOD,START,END,FIELD_LENGTHS,TOLERANCE,CASES,extractBlock,compileBlock,makeCases,runCase,runPythonReference,compareTraces,declaration,declare,run};
