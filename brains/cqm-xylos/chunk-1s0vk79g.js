import{m as A}from"./chunk-4t83rbt6.js";import{n as v}from"./chunk-wnt99ke4.js";import"./chunk-dmxwz5qd.js";import{r as V}from"./chunk-za0kzzxn.js";import"./chunk-98b3j85d.js";import"./chunk-xfscqbsx.js";import"./chunk-pnv02b3a.js";import"./chunk-yhtdgwf1.js";import"./chunk-8w6m765f.js";import"./chunk-kfpmn7j8.js";import"./chunk-6zmdjz0x.js";import"./chunk-0h4eyr40.js";import"./chunk-rqajrf4p.js";import"./chunk-wpvt8g04.js";import"./chunk-52t5q6bm.js";import"./chunk-5kt52ce8.js";import"./chunk-pc068tpe.js";import"./chunk-84x0a5qc.js";import"./chunk-jhx8pth2.js";import{qc as T}from"./chunk-c05sh8f5.js";import"./chunk-n3hkxdz7.js";import{Fc as D,Hc as P,Rc as M,jd as w,od as R,pd as y,qd as k,rd as h,sd as C,td as b,ud as O}from"./chunk-tk2w7j1m.js";import{Dd as j}from"./chunk-8prwmdh2.js";import{Ce as J}from"./chunk-6d66f5kk.js";import"./chunk-myhf6vrs.js";var I={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},_={axes:[],curves:[],options:I},X=structuredClone(_),g=P.radar,c=J(()=>{return T({...g,...M().radar})},"getConfig"),x=J(()=>X.axes,"getAxes"),r=J(()=>X.curves,"getCurves"),o=J(()=>X.options,"getOptions"),t=J(($)=>{X.axes=$.map((q)=>{return{name:q.name,label:q.label??q.name}})},"setAxes"),s=J(($)=>{X.curves=$.map((q)=>{return{name:q.name,label:q.label??q.name,entries:n(q.entries)}})},"setCurves"),n=J(($)=>{if($[0].axis==null)return $.map((K)=>K.value);let q=x();if(q.length===0)throw Error("Axes must be populated before curves for reference entries");return q.map((K)=>{let z=$.find((N)=>N.axis?.$refText===K.name);if(z===void 0)throw Error("Missing entry for axis "+K.label);return z.value})},"computeCurveEntries"),a=J(($)=>{let q=$.reduce((K,z)=>{return K[z.name]=z,K},{});X.options={showLegend:q.showLegend?.value??I.showLegend,ticks:q.ticks?.value??I.ticks,max:q.max?.value??I.max,min:q.min?.value??I.min,graticule:q.graticule?.value??I.graticule}},"setOptions"),i=J(()=>{R(),X=structuredClone(_)},"clear"),L={getAxes:x,getCurves:r,getOptions:o,setAxes:t,setCurves:s,setOptions:a,getConfig:c,clear:i,setAccTitle:y,getAccTitle:k,setDiagramTitle:b,getDiagramTitle:O,getAccDescription:C,setAccDescription:h},e=J(($)=>{A($,L);let{axes:q,curves:K,options:z}=$;L.setAxes(q),L.setCurves(K),L.setOptions(z)},"populate"),qq={parse:J(async($)=>{let q=await v("radar",$);j.debug(q),e(q)},"parse")},Kq=J(($,q,K,z)=>{let N=z.db,U=N.getAxes(),Z=N.getCurves(),Q=N.getOptions(),B=N.getConfig(),F=N.getDiagramTitle(),G=V(q),E=$q(G,B),H=Q.max??Math.max(...Z.map((S)=>Math.max(...S.entries))),W=Q.min,Y=Math.min(B.width,B.height)/2;zq(E,U,Y,Q.ticks,Q.graticule),Nq(E,U,Y,B),f(E,U,Z,W,H,Q.graticule,B),p(E,Z,Q.showLegend,B),E.append("text").attr("class","radarTitle").text(F).attr("x",0).attr("y",-B.height/2-B.marginTop)},"draw"),$q=J(($,q)=>{let K=q.width+q.marginLeft+q.marginRight,z=q.height+q.marginTop+q.marginBottom,N={x:q.marginLeft+q.width/2,y:q.marginTop+q.height/2};return w($,z,K,q.useMaxWidth??!0),$.attr("viewBox",`0 0 ${K} ${z}`).attr("overflow","visible"),$.append("g").attr("transform",`translate(${N.x}, ${N.y})`)},"drawFrame"),zq=J(($,q,K,z,N)=>{if(N==="circle")for(let U=0;U<z;U++){let Z=K*(U+1)/z;$.append("circle").attr("r",Z).attr("class","radarGraticule")}else if(N==="polygon"){let U=q.length;for(let Z=0;Z<z;Z++){let Q=K*(Z+1)/z,B=q.map((F,G)=>{let E=2*G*Math.PI/U-Math.PI/2,H=Q*Math.cos(E),W=Q*Math.sin(E);return`${H},${W}`}).join(" ");$.append("polygon").attr("points",B).attr("class","radarGraticule")}}},"drawGraticule"),Nq=J(($,q,K,z)=>{let N=q.length;for(let U=0;U<N;U++){let Z=q[U].label,Q=2*U*Math.PI/N-Math.PI/2,B=Math.cos(Q),F=Math.sin(Q);$.append("line").attr("x1",0).attr("y1",0).attr("x2",K*z.axisScaleFactor*B).attr("y2",K*z.axisScaleFactor*F).attr("class","radarAxisLine");let G=B>0.01?"start":B<-0.01?"end":"middle",E=F>0.01?"hanging":F<-0.01?"auto":"central",H=4;$.append("text").text(Z).attr("x",K*z.axisLabelFactor*B+H*B).attr("y",K*z.axisLabelFactor*F+H*F).attr("text-anchor",G).attr("dominant-baseline",E).attr("class","radarAxisLabel")}},"drawAxes");function f($,q,K,z,N,U,Z){let Q=q.length,B=Math.min(Z.width,Z.height)/2;K.forEach((F,G)=>{if(F.entries.length!==Q)return;let E=F.entries.map((H,W)=>{let Y=2*Math.PI*W/Q-Math.PI/2,S=m(H,z,N,B),u=S*Math.cos(Y),d=S*Math.sin(Y);return{x:u,y:d}});if(U==="circle")$.append("path").attr("d",l(E,Z.curveTension)).attr("class",`radarCurve-${G}`);else if(U==="polygon")$.append("polygon").attr("points",E.map((H)=>`${H.x},${H.y}`).join(" ")).attr("class",`radarCurve-${G}`)})}J(f,"drawCurves");function m($,q,K,z){let N=Math.min(Math.max($,q),K);return z*(N-q)/(K-q)}J(m,"relativeRadius");function l($,q){let K=$.length,z=`M${$[0].x},${$[0].y}`;for(let N=0;N<K;N++){let U=$[(N-1+K)%K],Z=$[N],Q=$[(N+1)%K],B=$[(N+2)%K],F={x:Z.x+(Q.x-U.x)*q,y:Z.y+(Q.y-U.y)*q},G={x:Q.x-(B.x-Z.x)*q,y:Q.y-(B.y-Z.y)*q};z+=` C${F.x},${F.y} ${G.x},${G.y} ${Q.x},${Q.y}`}return`${z} Z`}J(l,"closedRoundCurve");function p($,q,K,z){if(!K)return;let N=(z.width/2+z.marginRight)*3/4,U=-(z.height/2+z.marginTop)*3/4,Z=20;q.forEach((Q,B)=>{let F=$.append("g").attr("transform",`translate(${N}, ${U+B*Z})`);F.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${B}`),F.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(Q.label)})}J(p,"drawLegend");var Qq={draw:Kq},Bq=J(($,q)=>{let K="";for(let z=0;z<$.THEME_COLOR_LIMIT;z++){let N=$[`cScale${z}`];K+=`
		.radarCurve-${z} {
			color: ${N};
			fill: ${N};
			fill-opacity: ${q.curveOpacity};
			stroke: ${N};
			stroke-width: ${q.curveStrokeWidth};
		}
		.radarLegendBox-${z} {
			fill: ${N};
			fill-opacity: ${q.curveOpacity};
			stroke: ${N};
		}
		`}return K},"genIndexStyles"),Jq=J(($)=>{let q=D(),K=M(),z=T(q,K.themeVariables),N=T(z.radar,$);return{themeVariables:z,radarOptions:N}},"buildRadarStyleOptions"),Uq=J(({radar:$}={})=>{let{themeVariables:q,radarOptions:K}=Jq($);return`
	.radarTitle {
		font-size: ${q.fontSize};
		color: ${q.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${K.axisColor};
		stroke-width: ${K.axisStrokeWidth};
	}
	.radarAxisLabel {
		font-size: ${K.axisLabelFontSize}px;
		color: ${K.axisColor};
	}
	.radarGraticule {
		fill: ${K.graticuleColor};
		fill-opacity: ${K.graticuleOpacity};
		stroke: ${K.graticuleColor};
		stroke-width: ${K.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${K.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${Bq(q,K)}
	`},"styles"),Wq={parser:qq,db:L,renderer:Qq,styles:Uq};export{Wq as diagram};
