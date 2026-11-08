'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const {AuthenticAsmodensiusAdapter:Adapter}=require(path.join(root,'systems/authentic-asmodensius-adapter'));
const manifest=require(path.join(root,'systems/generated/authentic-asmodensius.manifest.json'));
const donor=path.resolve(root,'../Asmodensius-v40');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const originalFiles=manifest.inputs.filter(x=>x.path.startsWith('brains/asmodensius-v40/')).map(x=>{
  const original=path.join(donor,x.path.slice('brains/asmodensius-v40/'.length));
  return {snapshot:x.path,original,sha256:x.sha256,matchesCurrentOriginal:fs.existsSync(original)&&hash(original)===x.sha256};
});
const a=new Adapter({seed:104729});const input=t=>Float64Array.from({length:16},(_,i)=>.5+.5*Math.sin(t*.02+i));
for(let t=0;t<200;t++)a.step(input(t));const samples=[];
for(let t=200;t<2200;t++){const before=performance.now();a.step(input(t));samples.push(performance.now()-before);}
samples.sort((x,y)=>x-y);
const report={node:process.version,sourceDigest:Adapter.sourceDigest,originalFiles,allOriginalFilesMatch:originalFiles.every(x=>x.matchesCurrentOriginal),noticeMatchesOriginal:hash(path.join(root,'brains/asmodensius-v40/LICENSE'))===hash(path.join(donor,'LICENSE')),stepBenchmark:{profile:'original-v40-seeded-synthetic',seed:104729,warmupTicks:200,measuredTicks:2000,simulatedMinutesPerTick:1,p50ms:samples[999],p95ms:samples[1899],p99ms:samples[1979],maxMs:samples[1999],note:'Focused Node CPU step duration including adapter readout. Not whole-Electron frame rate, held-out learning quality, or runtime release qualification.'},checkpointPayloadChars:a.exportState().payload.length,finalMotor:a.readout().motor2D};
fs.writeFileSync(path.join(__dirname,'brains-authentic-evidence.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({allOriginalFilesMatch:report.allOriginalFilesMatch,originalFiles:originalFiles.length,noticeMatchesOriginal:report.noticeMatchesOriginal,stepBenchmark:report.stepBenchmark,checkpointPayloadChars:report.checkpointPayloadChars},null,2));
