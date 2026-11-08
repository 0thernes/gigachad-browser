import{m as RK}from"./chunk-4t83rbt6.js";import{n as XK}from"./chunk-wnt99ke4.js";import"./chunk-dmxwz5qd.js";import{r as EK}from"./chunk-za0kzzxn.js";import"./chunk-98b3j85d.js";import"./chunk-xfscqbsx.js";import"./chunk-pnv02b3a.js";import"./chunk-yhtdgwf1.js";import"./chunk-8w6m765f.js";import"./chunk-kfpmn7j8.js";import"./chunk-6zmdjz0x.js";import"./chunk-0h4eyr40.js";import"./chunk-rqajrf4p.js";import"./chunk-wpvt8g04.js";import"./chunk-52t5q6bm.js";import"./chunk-5kt52ce8.js";import"./chunk-pc068tpe.js";import"./chunk-84x0a5qc.js";import"./chunk-jhx8pth2.js";import{qc as d}from"./chunk-c05sh8f5.js";import"./chunk-n3hkxdz7.js";import{Fc as i,Hc as qK,Rc as s,jd as zK,od as UK,pd as FK,qd as VK,rd as BK,sd as jK,td as LK,ud as PK}from"./chunk-tk2w7j1m.js";import{Dd as u}from"./chunk-8prwmdh2.js";import{Ce as q}from"./chunk-6d66f5kk.js";import"./chunk-myhf6vrs.js";var GK=q(()=>({domains:new Map,transitions:[]}),"createDefaultData"),g=GK(),YK=q(()=>g.domains,"getDomains"),DK=q(()=>g.transitions,"getTransitions"),CK=q((K)=>{if(!K)return;for(let $ of K){let Q=$.domain,J=($.items??[]).map((F)=>({label:F.label}));g.domains.set(Q,{name:Q,items:J})}},"setDomains"),wK=q((K)=>{if(!K)return;g.transitions=K.filter(($)=>{if($.from===$.to)return u.warn(`Cynefin: self-loop transition on domain "${$.from}" is not meaningful and will be skipped.`),!1;return!0}).map(($)=>({from:$.from,to:$.to,label:$.label||void 0}))},"setTransitions"),_K=q(()=>{return d({...qK.cynefin,...s().cynefin})},"getConfig"),bK=q(()=>{UK(),g=GK()},"clear"),r={getDomains:YK,getTransitions:DK,setDomains:CK,setTransitions:wK,getConfig:_K,clear:bK,setAccTitle:FK,getAccTitle:VK,setDiagramTitle:LK,getDiagramTitle:PK,getAccDescription:jK,setAccDescription:BK},xK=q((K)=>{RK(K,r),r.setDomains(K.domains),r.setTransitions(K.transitions)},"populate"),fK={parse:q(async(K)=>{let $=await XK("cynefin",K);u.debug($),xK($)},"parse")};function l(K){let $=K+1831565813|0;return $=Math.imul($^$>>>15,$|1),$^=$+Math.imul($^$>>>7,$|61),(($^$>>>14)>>>0)/4294967296}q(l,"seededRandom");function IK(K){let $=0;for(let Q=0;Q<K.length;Q++){let J=K.charCodeAt(Q);$=($<<5)-$+J,$|=0}return $}q(IK,"hashString");function MK(K,$){if(typeof K==="number"&&Number.isFinite(K)&&K!==0)return K;return IK($)}q(MK,"resolveSeed");function kK(K,$,Q,J){let F=K/2,L=J??K*0.015,h=7,x=$/7,B=[];for(let Z=0;Z<=7;Z++){let P=l(Q+Z*17)*L*2-L;B.push({x:F+P,y:Z*x})}let W=`M${B[0].x},${B[0].y}`;for(let Z=0;Z<B.length-1;Z++){let P=B[Z],U=B[Z+1],j=(P.y+U.y)/2,k=Z%2===0?1:-1,X=L*1.5*k*l(Q+Z*31+7),f=P.x+X,y=j,p=U.x-X;W+=` C${f},${y} ${p},${j} ${U.x},${U.y}`}return W}q(kK,"generateFoldPath");function HK(K,$,Q,J){let F=$/2,L=J??$*0.015,h=7,x=K/7,B=[];for(let Z=0;Z<=7;Z++){let P=l(Q+Z*23)*L*2-L;B.push({x:Z*x,y:F+P})}let W=`M${B[0].x},${B[0].y}`;for(let Z=0;Z<B.length-1;Z++){let P=B[Z],U=B[Z+1],j=(P.x+U.x)/2,k=Z%2===0?1:-1,X=L*1.5*k*l(Q+Z*37+11),f=j,y=P.y+X,p=j,D=U.y-X;W+=` C${f},${y} ${p},${D} ${U.x},${U.y}`}return W}q(HK,"generateHorizontalBoundary");function OK(K,$){let Q=K/2,J=$*0.5,F=$,L=K*0.03;return[`M${Q},${J}`,`C${Q+L},${J+(F-J)*0.2}`,`${Q-L*1.5},${J+(F-J)*0.55}`,`${Q+L*0.5},${J+(F-J)*0.75}`,`C${Q-L},${J+(F-J)*0.85}`,`${Q+L*0.3},${J+(F-J)*0.95}`,`${Q},${F}`].join(" ")}q(OK,"generateCliffPath");function WK(K,$,Q,J){return[`M${K-Q},${$}`,`A${Q},${J} 0 1,1 ${K+Q},${$}`,`A${Q},${J} 0 1,1 ${K-Q},${$}`,"Z"].join(" ")}q(WK,"generateConfusionPath");var ZK={complex:{model:"Probe → Sense → Respond",practice:"Emergent Practices"},complicated:{model:"Sense → Analyse → Respond",practice:"Good Practices"},clear:{model:"Sense → Categorise → Respond",practice:"Best Practices"},chaotic:{model:"Act → Sense → Respond",practice:"Novel Practices"},confusion:{model:"",practice:"Disorder"}},yK=q((K,$)=>{let Q=K/2,J=$/2;return{complex:{cx:Q/2,cy:J/2,x:0,y:0,w:Q,h:J},complicated:{cx:Q+Q/2,cy:J/2,x:Q,y:0,w:Q,h:J},chaotic:{cx:Q/2,cy:J+J/2,x:0,y:J,w:Q,h:J},clear:{cx:Q+Q/2,cy:J+J/2,x:Q,y:J,w:Q,h:J},confusion:{cx:Q,cy:J,x:Q*0.7,y:J*0.7,w:Q*0.6,h:J*0.6}}},"getDomainLayouts"),pK=q(()=>{let K=i(),$=s();return d(K,$.themeVariables).cynefin},"getCynefinDomainColors"),o=3,cK=q((K,$,Q,J)=>{let F=J.db,L=F.getDomains(),h=F.getTransitions(),x=F.getDiagramTitle(),B=F.getAccTitle(),W=F.getAccDescription(),Z=F.getConfig(),P=pK();u.debug("Rendering Cynefin diagram");let{width:U,height:j,padding:k,showDomainDescriptions:X,boundaryAmplitude:f}=Z,y=U+k*2,p=j+k*2,D={complex:P.complexBg,complicated:P.complicatedBg,clear:P.clearBg,chaotic:P.chaoticBg,confusion:P.confusionBg},A=EK($);if(zK(A,p,y,Z.useMaxWidth??!0),A.attr("viewBox",`0 0 ${y} ${p}`),B)A.append("title").text(B);if(W)A.append("desc").text(W);let T=A.append("g").attr("transform",`translate(${k}, ${k})`),c=yK(U,j),e=MK(Z.seed,$),AK=T.append("g").attr("class","cynefin-backgrounds"),n=["complex","complicated","chaotic","clear"];for(let V of n){let z=c[V];AK.append("rect").attr("class","cynefinDomain").attr("x",z.x).attr("y",z.y).attr("width",z.w).attr("height",z.h).attr("fill",D[V]).attr("fill-opacity",0.4).attr("stroke","none")}let a=T.append("g").attr("class","cynefin-boundaries");a.append("path").attr("class","cynefinBoundary").attr("d",kK(U,j,e,f)).attr("fill","none"),a.append("path").attr("class","cynefinBoundary").attr("d",HK(U,j,e+100,f)).attr("fill","none"),a.append("path").attr("class","cynefinCliff").attr("d",OK(U,j)).attr("fill","none");let TK=U*0.15,vK=j*0.15;T.append("path").attr("class","cynefinConfusion").attr("d",WK(U/2,j/2,TK,vK)).attr("fill",D.confusion).attr("fill-opacity",0.5);let t=T.append("g").attr("class","cynefin-labels");for(let V of n){let z=c[V];t.append("text").attr("class","cynefinDomainLabel").attr("x",z.cx).attr("y",X?z.cy-30:z.cy).attr("text-anchor","middle").attr("dominant-baseline","middle").text(V.charAt(0).toUpperCase()+V.slice(1))}if(t.append("text").attr("class","cynefinDomainLabel").attr("x",U/2).attr("y",X?j/2-10:j/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text("Confusion"),X){let V=T.append("g").attr("class","cynefin-subtitles");for(let z of n){let R=c[z],E=ZK[z];V.append("text").attr("class","cynefinSubtitle").attr("x",R.cx).attr("y",R.cy-10).attr("text-anchor","middle").attr("dominant-baseline","middle").text(E.model),V.append("text").attr("class","cynefinSubtitle").attr("x",R.cx).attr("y",R.cy+5).attr("text-anchor","middle").attr("dominant-baseline","middle").text(E.practice)}V.append("text").attr("class","cynefinSubtitle").attr("x",U/2).attr("y",j/2+8).attr("text-anchor","middle").attr("dominant-baseline","middle").text(ZK.confusion.practice)}let KK=T.append("g").attr("class","cynefin-items"),v=26,$K=10,SK=["complex","complicated","chaotic","clear","confusion"];for(let V of SK){let z=L.get(V);if(!z||z.items.length===0)continue;let R=c[V],E=V==="confusion",C=z.items,w=0;if(E&&z.items.length>o)w=z.items.length-o,C=z.items.slice(0,o);let S;if(E){let I=X?22:14;S=R.cy+I}else S=R.cy+(X?25:15);if([...C].forEach((I,N)=>{let H=S+N*(v+4),Y=KK.append("g"),_=Y.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",v/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(I.label),M=I.label.length*7,G=_.node();if(G&&typeof G.getBBox==="function"){let m=G.getBBox();if(m.width>0)M=m.width}let O=M+$K*2,b=R.cx-O/2;Y.attr("transform",`translate(${b}, ${H})`),Y.insert("rect","text").attr("class","cynefinItem").attr("x",0).attr("y",0).attr("width",O).attr("height",v).attr("rx",4).attr("ry",4).attr("fill",D[V]).attr("fill-opacity",0.95),_.attr("x",O/2).attr("y",v/2)}),w>0){let I=S+C.length*(v+4),N=`+${w} more`,H=KK.append("g"),Y=H.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",v/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(N),_=N.length*7,M=Y.node();if(M&&typeof M.getBBox==="function"){let b=M.getBBox();if(b.width>0)_=b.width}let G=_+$K*2,O=R.cx-G/2;H.attr("transform",`translate(${O}, ${I})`),H.insert("rect","text").attr("class","cynefinItemOverflow").attr("x",0).attr("y",0).attr("width",G).attr("height",v).attr("rx",4).attr("ry",4).attr("fill",D[V]).attr("fill-opacity",0.6),Y.attr("x",G/2).attr("y",v/2)}}if(h.length>0){let V=A.select("defs").empty()?A.append("defs"):A.select("defs"),z=`cynefin-arrow-${$}`;V.append("marker").attr("id",z).attr("viewBox","0 0 10 10").attr("refX",9).attr("refY",5).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto-start-reverse").append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("class","cynefinArrowHead");let R=T.append("g").attr("class","cynefin-arrows");h.forEach((E)=>{let C=c[E.from],w=c[E.to];if(!C||!w)return;if(E.from===E.to){u.warn(`Cynefin renderer: skipping self-loop on domain "${E.from}"`);return}let{cx:S,cy:I}=C,N=w.cx,H=w.cy,Y=(S+N)/2,_=(I+H)/2,M=N-S,G=H-I,O=Math.sqrt(M*M+G*G),b=O*0.15,m=-G/O,NK=M/O,QK=Y+m*b,JK=_+NK*b;if(R.append("path").attr("class","cynefinArrowLine").attr("d",`M${S},${I} Q${QK},${JK} ${N},${H}`).attr("fill","none").attr("marker-end",`url(#${z})`),E.label)R.append("text").attr("class","cynefinArrowLabel").attr("x",QK).attr("y",JK-6).attr("text-anchor","middle").attr("dominant-baseline","auto").text(E.label)})}if(x)T.append("text").attr("class","cynefinTitle").attr("x",U/2).attr("y",-k/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text(x)},"draw"),uK={draw:cK},lK=q(()=>{let K=i(),$=s();return d(K,$.themeVariables).cynefin},"getCynefinTheme"),gK=q(()=>{let K=lK();return`
	.cynefinDomain {
		stroke: none;
	}
	.cynefinDomainLabel {
		font-size: ${K.domainFontSize}px;
		font-weight: bold;
		fill: ${K.labelColor};
	}
	.cynefinSubtitle {
		font-size: ${K.itemFontSize-1}px;
		fill: ${K.textColor};
		font-style: italic;
	}
	.cynefinItem {
		fill-opacity: 0.95;
		stroke: ${K.boundaryColor};
		stroke-width: 1;
	}
	.cynefinItemText {
		font-size: ${K.itemFontSize}px;
		fill: ${K.textColor};
	}
	.cynefinItemOverflow {
		fill-opacity: 0.6;
		stroke: ${K.boundaryColor};
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
	.cynefinBoundary {
		stroke: ${K.boundaryColor};
		stroke-width: ${K.boundaryWidth};
		stroke-dasharray: 6 3;
	}
	.cynefinCliff {
		stroke: ${K.cliffColor};
		stroke-width: ${K.cliffWidth};
	}
	.cynefinConfusion {
		stroke: ${K.boundaryColor};
		stroke-width: 1.5;
		stroke-dasharray: 4 2;
	}
	.cynefinArrowLine {
		stroke: ${K.arrowColor};
		stroke-width: ${K.arrowWidth};
		fill: none;
	}
	.cynefinArrowHead {
		fill: ${K.arrowColor};
		stroke: none;
	}
	.cynefinArrowLabel {
		font-size: ${K.itemFontSize-1}px;
		fill: ${K.textColor};
	}
	.cynefinTitle {
		font-size: ${K.domainFontSize+2}px;
		font-weight: bold;
		fill: ${K.labelColor};
	}
	`},"styles"),hK=gK,iK={parser:fK,db:r,renderer:uK,styles:hK};export{iK as diagram};
