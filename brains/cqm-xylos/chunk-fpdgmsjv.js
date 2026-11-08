import{r as h}from"./chunk-za0kzzxn.js";import{Fc as _,Rc as z,cd as g,jd as R,od as p,vd as c}from"./chunk-tk2w7j1m.js";import{Dd as N}from"./chunk-8prwmdh2.js";import{Ce as E}from"./chunk-6d66f5kk.js";var O="",Y="",D="",C=[],A=new Map,y=E((q)=>{return g(q,c())},"sanitizeText"),F=E((q)=>{switch(q.type){case"terminal":return{...q,value:y(q.value)};case"nonterminal":return{...q,name:y(q.name)};case"sequence":return{...q,elements:q.elements.map(F)};case"choice":return{...q,alternatives:q.alternatives.map(F)};case"optional":return{...q,element:F(q.element)};case"repetition":return{...q,element:F(q.element),separator:q.separator?F(q.separator):void 0};case"special":return{...q,text:y(q.text)}}},"sanitizeAstNode"),n=E(()=>{O="",Y="",D="",C.length=0,A.clear(),p(),N.debug("[Railroad] Database cleared")},"clear"),m=E((q)=>{O=y(q),N.debug("[Railroad] Title set:",q)},"setTitle"),u=E(()=>{return O},"getTitle"),l=E((q)=>{let J={...q,name:y(q.name),definition:F(q.definition),comment:q.comment?y(q.comment):void 0};if(N.debug("[Railroad] Adding rule:",J.name),A.has(J.name))N.warn(`[Railroad] Rule '${J.name}' is already defined. Overwriting.`);C.push(J),A.set(J.name,J)},"addRule"),r=E(()=>{return C},"getRules"),i=E((q)=>{return A.get(q)},"getRule"),t=E((q)=>{Y=y(q).replace(/^\s+/g,""),N.debug("[Railroad] Accessibility title set:",q)},"setAccTitle"),a=E(()=>{return Y},"getAccTitle"),e=E((q)=>{D=y(q).replace(/\n\s+/g,`
`),N.debug("[Railroad] Accessibility description set:",q)},"setAccDescription"),qq=E(()=>{return D},"getAccDescription"),Qq=m,$q=u,Jq={clear:n,setTitle:m,getTitle:u,addRule:l,getRules:r,getRule:i,setAccTitle:t,getAccTitle:a,setAccDescription:e,getAccDescription:qq,setDiagramTitle:Qq,getDiagramTitle:$q},k={compactMode:!1,padding:10,verticalSeparation:8,horizontalSeparation:10,arcRadius:10,fontSize:14,fontFamily:"monospace",terminalFill:"#FFFFC0",terminalStroke:"#000000",terminalTextColor:"#000000",nonTerminalFill:"#FFFFFF",nonTerminalStroke:"#000000",nonTerminalTextColor:"#000000",lineColor:"#000000",strokeWidth:2,markerFill:"#000000",commentFill:"#E8E8E8",commentStroke:"#888888",commentTextColor:"#666666",specialFill:"#F0E0FF",specialStroke:"#8800CC",ruleNameColor:"#000066",showMarkers:!0,markerRadius:5},Kq=/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$|^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([\d\s%+,./-]+\)$|^[a-z]+$/i,Zq=/^[\w "',.-]+$/,jq=new Set(["compactMode","padding","verticalSeparation","horizontalSeparation","arcRadius","fontSize","fontFamily","terminalFill","terminalStroke","terminalTextColor","nonTerminalFill","nonTerminalStroke","nonTerminalTextColor","lineColor","strokeWidth","markerFill","commentFill","commentStroke","commentTextColor","specialFill","specialStroke","ruleNameColor","showMarkers","markerRadius"]),d=E((q)=>{if(!q)return!1;return Object.keys(q).every((J)=>J==="railroad"||jq.has(J))},"isRailroadStyleOptions"),Mq=E((q)=>{if(!q)return{};if("railroad"in q&&q.railroad)return q.railroad;return d(q)?q:{}},"extractRailroadOverrides"),Hq=E((q)=>{if(!q||d(q))return{};let{railroad:J,svgId:Z,theme:$,look:Q,...K}=q;return K},"extractThemeOverrides"),B=E((q,J)=>{if(typeof q!=="string")return J;let Z=q.trim();return Kq.test(Z)?Z:J},"sanitizeColorValue"),s=E((q,J)=>{if(typeof q!=="string")return J;let Z=q.trim();return Zq.test(Z)?Z:J},"sanitizeFontFamilyValue"),v=E((q,J)=>{let Z=typeof q==="number"?q:typeof q==="string"?Number.parseFloat(q):Number.NaN;return Number.isFinite(Z)&&Z>=0?Z:J},"sanitizeNumberValue"),Gq=E((q)=>{let J=typeof q==="number"?q:typeof q==="string"?Number.parseFloat(q):Number.NaN;return Number.isFinite(J)&&J>0?J:void 0},"parseThemeFontSize"),Xq=E((q)=>{let J=s(q.fontFamily,k.fontFamily),Z=Gq(q.fontSize)??k.fontSize;return{...k,fontFamily:J,fontSize:Z,terminalFill:B(q.secondBkg??q.secondaryColor,k.terminalFill),terminalStroke:B(q.secondaryBorderColor??q.lineColor,k.terminalStroke),terminalTextColor:B(q.secondaryTextColor??q.textColor,k.terminalTextColor),nonTerminalFill:B(q.mainBkg??q.background,k.nonTerminalFill),nonTerminalStroke:B(q.primaryBorderColor??q.lineColor,k.nonTerminalStroke),nonTerminalTextColor:B(q.primaryTextColor??q.textColor,k.nonTerminalTextColor),lineColor:B(q.lineColor,k.lineColor),markerFill:B(q.lineColor,k.markerFill),commentFill:B(q.labelBackground??q.tertiaryColor,k.commentFill),commentStroke:B(q.tertiaryBorderColor??q.lineColor,k.commentStroke),commentTextColor:B(q.tertiaryTextColor??q.textColor,k.commentTextColor),specialFill:B(q.tertiaryColor??q.secondaryColor,k.specialFill),specialStroke:B(q.tertiaryBorderColor??q.secondaryBorderColor,k.specialStroke),ruleNameColor:B(q.titleColor??q.textColor,k.ruleNameColor)}},"buildThemeDefaults"),x=E((q)=>{let J=z(),Z={..._(),...J.themeVariables??{},...Hq(q)},$=Xq(Z),Q={...J.railroad??{},...Mq(q)};return{compactMode:Q.compactMode??$.compactMode,padding:v(Q.padding,$.padding),verticalSeparation:v(Q.verticalSeparation,$.verticalSeparation),horizontalSeparation:v(Q.horizontalSeparation,$.horizontalSeparation),arcRadius:v(Q.arcRadius,$.arcRadius),fontSize:v(Q.fontSize,$.fontSize),fontFamily:s(Q.fontFamily,$.fontFamily),terminalFill:B(Q.terminalFill,$.terminalFill),terminalStroke:B(Q.terminalStroke,$.terminalStroke),terminalTextColor:B(Q.terminalTextColor,$.terminalTextColor),nonTerminalFill:B(Q.nonTerminalFill,$.nonTerminalFill),nonTerminalStroke:B(Q.nonTerminalStroke,$.nonTerminalStroke),nonTerminalTextColor:B(Q.nonTerminalTextColor,$.nonTerminalTextColor),lineColor:B(Q.lineColor,$.lineColor),strokeWidth:v(Q.strokeWidth,$.strokeWidth),markerFill:B(Q.markerFill,$.markerFill),commentFill:B(Q.commentFill,$.commentFill),commentStroke:B(Q.commentStroke,$.commentStroke),commentTextColor:B(Q.commentTextColor,$.commentTextColor),specialFill:B(Q.specialFill,$.specialFill),specialStroke:B(Q.specialStroke,$.specialStroke),ruleNameColor:B(Q.ruleNameColor,$.ruleNameColor),showMarkers:Q.showMarkers??$.showMarkers,markerRadius:v(Q.markerRadius,$.markerRadius)}},"buildRailroadStyleOptions"),Sq=E((q)=>{let{fontFamily:J,fontSize:Z,terminalFill:$,terminalStroke:Q,terminalTextColor:K,nonTerminalFill:w,nonTerminalStroke:H,nonTerminalTextColor:j,lineColor:U,strokeWidth:X,markerFill:G,commentFill:I,commentStroke:M,commentTextColor:P,specialFill:T,specialStroke:W,ruleNameColor:L}=x(q);return`
  .railroad-diagram {
    font-family: ${J};
    font-size: ${Z}px;
  }

  .railroad-terminal rect {
    fill: ${$};
    stroke: ${Q};
    stroke-width: ${X}px;
  }

  .railroad-terminal text {
    fill: ${K};
    font-family: ${J};
    font-size: ${Z}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-nonterminal rect {
    fill: ${w};
    stroke: ${H};
    stroke-width: ${X}px;
  }

  .railroad-nonterminal text {
    fill: ${j};
    font-family: ${J};
    font-size: ${Z}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-line {
    stroke: ${U};
    stroke-width: ${X}px;
    fill: none;
  }

  .railroad-start circle,
  .railroad-end circle {
    fill: ${G};
  }

  .railroad-comment ellipse {
    fill: ${I};
    stroke: ${M};
    stroke-width: ${X}px;
  }

  .railroad-comment text {
    fill: ${P};
    font-style: italic;
    font-family: ${J};
    font-size: ${Z}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-special rect {
    fill: ${T};
    stroke: ${W};
    stroke-width: ${X}px;
    stroke-dasharray: 5,3;
  }

  .railroad-special text {
    fill: ${j};
    font-family: ${J};
    font-size: ${Z}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-rule-name {
    font-weight: bold;
    fill: ${L};
    font-family: ${J};
    font-size: ${Z}px;
  }

  .railroad-group {
    /* Grouping container, no specific styles */
  }
`},"getStyles"),S=class{constructor(){this.d=""}static{E(this,"PathBuilder")}moveTo(q,J){return this.d+=`M ${q} ${J} `,this}lineTo(q,J){return this.d+=`L ${q} ${J} `,this}horizontalTo(q){return this.d+=`H ${q} `,this}verticalTo(q){return this.d+=`V ${q} `,this}arcTo(q,J,Z,$,Q,K,w){return this.d+=`A ${q} ${J} ${Z} ${$?1:0} ${Q?1:0} ${K} ${w} `,this}build(){return this.d.trim()}},Bq=class{constructor(q,J=x()){this.textCache=new Map,this.svg=q,this.config=J}static{E(this,"RailroadRenderer")}measureText(q){if(this.textCache.has(q))return this.textCache.get(q);let J=this.svg.append("text").attr("font-family",this.config.fontFamily).attr("font-size",this.config.fontSize).text(q),Z=J.node().getBBox(),$={width:Z.width,height:Z.height};return J.remove(),this.textCache.set(q,$),$}renderTerminal(q,J){let Z=this.measureText(J),$=Z.width+this.config.padding*2,Q=Z.height+this.config.padding*2,K=q.append("g").attr("class","railroad-terminal");return K.append("rect").attr("x",0).attr("y",0).attr("width",$).attr("height",Q).attr("rx",10).attr("ry",10),K.append("text").attr("x",$/2).attr("y",Q/2).text(J),{element:K.node(),dimensions:{width:$,height:Q,up:Q/2,down:Q/2}}}renderNonTerminal(q,J){let Z=this.measureText(J),$=Z.width+this.config.padding*2,Q=Z.height+this.config.padding*2,K=q.append("g").attr("class","railroad-nonterminal");return K.append("rect").attr("x",0).attr("y",0).attr("width",$).attr("height",Q),K.append("text").attr("x",$/2).attr("y",Q/2).text(J),{element:K.node(),dimensions:{width:$,height:Q,up:Q/2,down:Q/2}}}renderSequence(q,J){let Z=J.map((j)=>this.renderExpression(q,j)),$=0,Q=0,K=0;for(let j of Z)$+=j.dimensions.width,Q=Math.max(Q,j.dimensions.up),K=Math.max(K,j.dimensions.down);$+=(Z.length-1)*this.config.horizontalSeparation;let w=q.append("g").attr("class","railroad-sequence"),H=0;for(let j=0;j<Z.length;j++){let U=Z[j],X=Q-U.dimensions.up;if(w.node().appendChild(U.element).setAttribute("transform",`translate(${H}, ${X})`),j<Z.length-1){let I=H+U.dimensions.width,M=I+this.config.horizontalSeparation,P=Q;w.append("path").attr("class","railroad-line").attr("d",new S().moveTo(I,P).lineTo(M,P).build())}H+=U.dimensions.width+this.config.horizontalSeparation}return{element:w.node(),dimensions:{width:$,height:Q+K,up:Q,down:K}}}renderChoice(q,J){let Z=J.map((G)=>this.renderExpression(q,G)),$=0,Q=0;for(let G of Z)$=Math.max($,G.dimensions.width),Q+=G.dimensions.height;Q+=(Z.length-1)*this.config.verticalSeparation;let K=this.config.arcRadius,w=K*4,H=$+w,j=q.append("g").attr("class","railroad-choice"),U=0,X=Q/2;for(let G of Z){let I=U,M=I+G.dimensions.up,P=K*2+($-G.dimensions.width)/2;j.node().appendChild(G.element).setAttribute("transform",`translate(${P}, ${I})`);let W=new S,L=M>X;if(M===X)W.moveTo(0,X).lineTo(P,M);else W.moveTo(0,X).arcTo(K,K,0,!1,L,K,X+(L?K:-K)).lineTo(K,M-(L?K:-K)).arcTo(K,K,0,!1,!L,K*2,M).lineTo(P,M);j.append("path").attr("class","railroad-line").attr("d",W.build());let f=new S,b=P+G.dimensions.width,o=H-K*2;if(M===X)f.moveTo(b,M).lineTo(H,X);else f.moveTo(b,M).lineTo(o,M).arcTo(K,K,0,!1,!L,H-K,M+(L?-K:K)).lineTo(H-K,X+(L?K:-K)).arcTo(K,K,0,!1,L,H,X);j.append("path").attr("class","railroad-line").attr("d",f.build()),U+=G.dimensions.height+this.config.verticalSeparation}return{element:j.node(),dimensions:{width:H,height:Q,up:X,down:Q-X}}}renderOptional(q,J){let Z=this.renderExpression(q,J),$=this.config.arcRadius,Q=$*2,K=Z.dimensions.width+$*4,w=Z.dimensions.height+Q,H=q.append("g").attr("class","railroad-optional"),j=$*2,U=Q;H.node().appendChild(Z.element).setAttribute("transform",`translate(${j}, ${U})`);let G=U+Z.dimensions.up,I=new S().moveTo(0,G).lineTo($*2,G);H.append("path").attr("class","railroad-line").attr("d",I.build());let M=new S().moveTo(j+Z.dimensions.width,G).lineTo(K,G);H.append("path").attr("class","railroad-line").attr("d",M.build());let P=new S().moveTo(0,G).arcTo($,$,0,!1,!1,$,G-$).lineTo($,$).arcTo($,$,0,!1,!0,$*2,0).lineTo(K-$*2,0).arcTo($,$,0,!1,!0,K-$,$).lineTo(K-$,G-$).arcTo($,$,0,!1,!1,K,G);return H.append("path").attr("class","railroad-line").attr("d",P.build()),{element:H.node(),dimensions:{width:K,height:w,up:G,down:w-G}}}renderRepetition(q,J,Z){let $=this.renderExpression(q,J),Q=this.config.arcRadius,K=Q*2,w=$.dimensions.width+Q*4,H=Z===0,j=$.dimensions.height+K+(H?K:0),U=q.append("g").attr("class","railroad-repetition"),X=Q*2,G=H?K:0;U.node().appendChild($.element).setAttribute("transform",`translate(${X}, ${G})`);let M=G+$.dimensions.up;U.append("path").attr("class","railroad-line").attr("d",new S().moveTo(0,M).lineTo(Q*2,M).build()),U.append("path").attr("class","railroad-line").attr("d",new S().moveTo(X+$.dimensions.width,M).lineTo(w,M).build());let P=G+$.dimensions.height+Q,T=new S().moveTo(X+$.dimensions.width,M).arcTo(Q,Q,0,!1,!0,X+$.dimensions.width+Q,M+Q).lineTo(X+$.dimensions.width+Q,P).arcTo(Q,Q,0,!1,!0,X+$.dimensions.width,P+Q).lineTo(Q*2,P+Q).arcTo(Q,Q,0,!1,!0,Q,P).lineTo(Q,M+Q).arcTo(Q,Q,0,!1,!0,Q*2,M);if(U.append("path").attr("class","railroad-line").attr("d",T.build()),H){let W=new S().moveTo(0,M).arcTo(Q,Q,0,!1,!1,Q,M-Q).lineTo(Q,Q).arcTo(Q,Q,0,!1,!0,Q*2,0).lineTo(w-Q*2,0).arcTo(Q,Q,0,!1,!0,w-Q,Q).lineTo(w-Q,M-Q).arcTo(Q,Q,0,!1,!1,w,M);U.append("path").attr("class","railroad-line").attr("d",W.build())}return{element:U.node(),dimensions:{width:w,height:j,up:M,down:j-M}}}renderSpecial(q,J){let Z=this.measureText("? "+J+" ?"),$=Z.width+this.config.padding*2,Q=Z.height+this.config.padding*2,K=q.append("g").attr("class","railroad-special");return K.append("rect").attr("x",0).attr("y",0).attr("width",$).attr("height",Q),K.append("text").attr("x",$/2).attr("y",Q/2).text("? "+J+" ?"),{element:K.node(),dimensions:{width:$,height:Q,up:Q/2,down:Q/2}}}renderExpression(q,J){switch(J.type){case"terminal":return this.renderTerminal(q,J.value);case"nonterminal":return this.renderNonTerminal(q,J.name);case"sequence":return this.renderSequence(q,J.elements);case"choice":return this.renderChoice(q,J.alternatives);case"optional":return this.renderOptional(q,J.element);case"repetition":return this.renderRepetition(q,J.element,J.min);case"special":return this.renderSpecial(q,J.text);default:throw Error(`Unknown node type: ${J.type}`)}}renderRule(q,J){let Z=this.svg.append("g").attr("class","railroad-rule").attr("transform",`translate(0, ${J})`),$=q.name+" =",Q=this.measureText($).width+20,K=Q+20,w=Z.append("g"),H=this.renderExpression(w,q.definition),j=Math.max(20,H.dimensions.up),U=j-H.dimensions.up;return w.attr("transform",`translate(${K}, ${U})`),Z.append("g").attr("class","railroad-rule-name-group").append("text").attr("class","railroad-rule-name").attr("x",0).attr("y",j).text($),Z.append("g").attr("class","railroad-start").append("circle").attr("cx",Q).attr("cy",j).attr("r",this.config.markerRadius),Z.append("g").attr("class","railroad-end").append("circle").attr("cx",K+H.dimensions.width+10).attr("cy",j).attr("r",this.config.markerRadius),Z.append("path").attr("class","railroad-line").attr("d",new S().moveTo(Q+this.config.markerRadius,j).lineTo(K,j).build()),Z.append("path").attr("class","railroad-line").attr("d",new S().moveTo(K+H.dimensions.width,j).lineTo(K+H.dimensions.width+10-this.config.markerRadius,j).build()),{height:Math.max(40,U+H.dimensions.height+this.config.padding*2),width:K+H.dimensions.width+10+this.config.markerRadius}}renderDiagram(q){let J=this.config.padding,Z=0;for(let $ of q){let Q=this.renderRule($,J);J+=Q.height+this.config.verticalSeparation,Z=Math.max(Z,Q.width)}return{width:Z+this.config.padding*2,height:J+this.config.padding}}},V=E((q,J,Z)=>{R(q,J.height,J.width,Z),q.attr("viewBox",`0 0 ${J.width} ${J.height}`)},"configureRailroadSvgSize"),Eq=E((q,J,Z)=>{N.debug(`[Railroad] Rendering diagram
`+q);try{let $=h(J);$.attr("class","railroad-diagram");let K=z().railroad?.useMaxWidth??!0,w=Jq.getRules();if(N.debug(`[Railroad] Rendering ${w.length} rules`),w.length===0){N.warn("[Railroad] No rules to render"),V($,{height:100,width:200},K);return}let j=new Bq($,x()).renderDiagram(w);V($,j,K),N.debug("[Railroad] Render complete")}catch($){throw N.error("[Railroad] Render error:",$),$}},"draw"),Nq={draw:Eq};
export{Jq as a,Sq as b,Nq as c};
