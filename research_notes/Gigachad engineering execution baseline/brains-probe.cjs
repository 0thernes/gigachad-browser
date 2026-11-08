'use strict';
const { PortedMultiverseBrainsFederation: Federation, Heterogeneous7TierPrecisionArena: Arena } = require('../../systems/ported-multiverse-brains.js');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const input = t => ({trainableAlifeNeuralHub:{zPerc16:Float64Array.from({length:16},(_,i)=>Math.sin((t+1)*(i+1)*0.031)),tdAdvantageDelta:Math.sin(t*0.017)*0.2,adaptivePlasticityLr:0.008,learnedMotorThrust2D:new Float32Array(2)}});
const a=new Federation(), control=new Federation();
for(let i=0;i<100;i++){a.step60Hz(input(i));control.step60Hz(input(i));}
const before=JSON.parse(JSON.stringify(a.exportLearnedState()));
const b=new Federation(); const imported=b.importLearnedState(before);
let firstDifference=null;
for(let i=100;i<120;i++){
  a.step60Hz(input(i));control.step60Hz(input(i));b.step60Hz(input(i));
  if(!firstDifference && JSON.stringify(a.exportLearnedState())!==JSON.stringify(b.exportLearnedState()))firstDifference={tick:i+1,uninterruptedMotor:Array.from(a.councilConsensusMotor2D),restoredMotor:Array.from(b.councilConsensusMotor2D),uninterruptedPrng:a.precisionArena._prngState,restoredPrng:b.precisionArena._prngState};
}
const arena=new Arena();let finiteFp16RoundtripFailures=0;
for(let i=0;i<65536;i++){if((i&0x7c00)===0x7c00)continue;if(arena.encodeFp16(arena.decodeFp16(i))!==i)finiteFp16RoundtripFailures++;}
const z=new Federation(); const noLearningInput=input(0);noLearningInput.trainableAlifeNeuralHub.adaptivePlasticityLr=0;
const zeroBefore=Array.from(z.brain5Xenomimic.W1_6x8);z.step60Hz(noLearningInput);
const report={revision:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,moduleSha256:crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../../systems/ported-multiverse-brains.js'))).digest('hex'),deterministicUninterrupted:JSON.stringify(a.exportLearnedState())===JSON.stringify(control.exportLearnedState()),snapshotImported:imported,firstDifference,emptySnapshotAccepted:new Federation().importLearnedState({}),unknownVersionAccepted:new Federation().importLearnedState({version:'INVALID'}),zeroLrChangesXenomimicWeights:zeroBefore.some((v,i)=>v!==z.brain5Xenomimic.W1_6x8[i]),finiteFp16RoundtripFailures,fp16Samples:[0,-0,2**-24,2**-14,1e-5,1,65504].map(v=>({input:String(v),bits:arena.encodeFp16(v),decoded:arena.decodeFp16(arena.encodeFp16(v))})),xenomimicWaveNorm:Math.hypot(...a.brain5Xenomimic.psiRe16,...a.brain5Xenomimic.psiIm16)};
fs.writeFileSync(path.join(__dirname,'brains-probe-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
