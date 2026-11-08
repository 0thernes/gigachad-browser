import { v21Inputs, SEEDS } from "./harness";
const fs=require("fs"); const puppeteer=require("puppeteer-core");
const app=fs.readFileSync("../src/app.tsx","utf8");
const SCENE=app.match(/const SCENE_FS = `([\s\S]*?)`;/)![1];
const REDUCED=SCENE.replace("vec2 map(vec3 p){ return opU(outer(p), inner(p)); }","vec2 map(vec3 p){ return vec2(body(p),0.); }");
if (REDUCED===SCENE) throw new Error("map() not found");
(async()=>{
 const b=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:true,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-sandbox"]});
 const p=await b.newPage(); await p.setContent("<canvas id=c width=384 height=384></canvas>");
 const inputs:any={}; for(const s of SEEDS) inputs[s]=v21Inputs(s);
 const r=await p.evaluate((inputs:any,SCENE:string,REDUCED:string)=>{
  const gl=(document.getElementById("c") as HTMLCanvasElement).getContext("webgl2")!;
  const dbg=gl.getExtension("WEBGL_debug_renderer_info"); const renderer=String(dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
  const VS=`#version 300 es\nin vec2 p; out vec2 uv; void main(){ uv=p*.5+.5; gl_Position=vec4(p,0,1); }`;
  const prog=(f:string)=>{const P=gl.createProgram()!;for(const [t,src] of [[gl.VERTEX_SHADER,VS],[gl.FRAGMENT_SHADER,f]] as any){const s=gl.createShader(t)!;gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)!);gl.attachShader(P,s);}gl.bindAttribLocation(P,0,"p");gl.linkProgram(P);if(!gl.getProgramParameter(P,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(P)!);return P;};
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  // integer hash compute: 16x16 R32UI target
  const HF=(body:string)=>`#version 300 es\nprecision highp float; precision highp int; uniform highp usampler2D I; out uint o; void main(){ uint x=texelFetch(I,ivec2(gl_FragCoord.xy),0).r; ${body} o=x; }`;
  const hh="x^=x>>16u; x*=0x7feb352du; x^=x>>15u; x*=0x846ca68bu; x^=x>>16u;", xs="x^=x<<13u; x^=x>>17u; x^=x<<5u;";
  const tex=(fmt:number,ifmt:number,type:number,w:number,h:number,data:any)=>{const t=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,data);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;};
  const runHash=(body:string,inp:number[])=>{const P=prog(HF(body));gl.useProgram(P);const it=tex(gl.RED_INTEGER,gl.R32UI,gl.UNSIGNED_INT,16,16,new Uint32Array(inp));const ot=tex(gl.RED_INTEGER,gl.R32UI,gl.UNSIGNED_INT,16,16,null);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,ot,0);gl.viewport(0,0,16,16);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,it);gl.uniform1i(gl.getUniformLocation(P,"I"),0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);const out=new Uint32Array(1024);gl.readPixels(0,0,16,16,gl.RGBA_INTEGER,gl.UNSIGNED_INT,out);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return Array.from({length:256},(_,i)=>out[i*4]>>>0);};
  const hhGpu:any={},xsGpu:any={}; for(const s in inputs){hhGpu[s]=runHash(hh,inputs[s]);xsGpu[s]=runHash(xs,inputs[s]);}
  // scene detail
  const mul=(seed:number)=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
  const detail=(src:string)=>{const P=prog(src);gl.useProgram(P);const actT=tex(gl.RED,gl.R32F,gl.FLOAT,100,200,new Float32Array(20000));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,actT);gl.uniform1i(gl.getUniformLocation(P,"ACT"),0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);const W=384;gl.viewport(0,0,W,W);const res:number[]=[];const U=(n:string)=>gl.getUniformLocation(P,n);
   for(let k=0;k<16;k++){const r=mul(1000+k);const u1=r(),u2=r(),u3=r();gl.uniform2f(U("R"),W,W);gl.uniform1f(U("T"),3+37*u1);gl.uniform2f(U("M"),(2*u2-1)*.8,(2*u3-1)*.8);gl.uniform1f(U("calm"),0);gl.uniform1f(U("EN"),.5);gl.uniform1f(U("WS"),0);gl.uniform1f(U("SIG"),0);gl.uniform4f(U("N"),.5,.5,.5,.5);gl.uniform4f(U("N2"),.5,.5,.5,.5);gl.uniform4f(U("Q"),0,0,0,0);gl.uniform4f(U("QP"),0,0,0,0);gl.uniform4f(U("W4"),0,0,0,0);gl.uniform4f(U("CUT"),0,0,0,0);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);const er=gl.getError();if(er)throw new Error("gl error "+er);const px=new Uint8Array(W*W*4);gl.readPixels(0,0,W,W,gl.RGBA,gl.UNSIGNED_BYTE,px);const L=(x:number,y:number)=>{const i=(y*W+x)*4;return(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2])/255;};let s=0;for(let y=1;y<W-1;y++)for(let x=1;x<W-1;x++){const gx=L(x+1,y-1)+2*L(x+1,y)+L(x+1,y+1)-L(x-1,y-1)-2*L(x-1,y)-L(x-1,y+1);const gy=L(x-1,y+1)+2*L(x,y+1)+L(x+1,y+1)-L(x-1,y-1)-2*L(x,y-1)-L(x+1,y-1);s+=Math.hypot(gx,gy);}res.push(s/((W-2)*(W-2)));}
   return res;};
  return {renderer,hhGpu,xsGpu,detailFull:detail(SCENE),detailReduced:detail(REDUCED)};
 },inputs,SCENE,REDUCED);
 fs.writeFileSync("gpu_record.json",JSON.stringify(r)); console.log(r.renderer,r.detailFull.slice(0,3),r.detailReduced.slice(0,3)); await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
