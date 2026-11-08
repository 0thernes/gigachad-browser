import{gb as Lq}from"./chunk-a5tpay1m.js";import{$b as e,Wb as Eq,Xb as Pq,Yb as Cq}from"./chunk-v165dhvh.js";import"./chunk-n3hkxdz7.js";import{jd as zq,od as Yq,pd as Mq,qd as Iq,rd as Nq,sd as Fq,td as Rq,ud as Wq,vd as u}from"./chunk-tk2w7j1m.js";import{Jd as k,fe as n}from"./chunk-8prwmdh2.js";import{Ce as U}from"./chunk-6d66f5kk.js";import"./chunk-myhf6vrs.js";var o=function(){var q=U(function(z,G,J,Z){for(J=J||{},Z=z.length;Z--;J[z[Z]]=G);return J},"o"),K=[6,8,10,11,12,14,16,17,18],X=[1,9],N=[1,10],Q=[1,11],Y=[1,12],F=[1,13],H=[1,14],R={trace:U(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:U(function(G,J,Z,M,I,B,L){var P=B.length-1;switch(I){case 1:return B[P-1];case 2:this.$=[];break;case 3:B[P-1].push(B[P]),this.$=B[P-1];break;case 4:case 5:this.$=B[P];break;case 6:case 7:this.$=[];break;case 8:M.setDiagramTitle(B[P].substr(6)),this.$=B[P].substr(6);break;case 9:this.$=B[P].trim(),M.setAccTitle(this.$);break;case 10:case 11:this.$=B[P].trim(),M.setAccDescription(this.$);break;case 12:M.addSection(B[P].substr(8)),this.$=B[P].substr(8);break;case 13:M.addTask(B[P-1],B[P]),this.$="task";break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},q(K,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:X,12:N,14:Q,16:Y,17:F,18:H},q(K,[2,7],{1:[2,1]}),q(K,[2,3]),{9:15,11:X,12:N,14:Q,16:Y,17:F,18:H},q(K,[2,5]),q(K,[2,6]),q(K,[2,8]),{13:[1,16]},{15:[1,17]},q(K,[2,11]),q(K,[2,12]),{19:[1,18]},q(K,[2,4]),q(K,[2,9]),q(K,[2,10]),q(K,[2,13])],defaultActions:{},parseError:U(function(G,J){if(J.recoverable)this.trace(G);else{var Z=Error(G);throw Z.hash=J,Z}},"parseError"),parse:U(function(G){var J=this,Z=[0],M=[],I=[null],B=[],L=this.table,P="",w=0,Kq=0,Qq=0,jq=2,Gq=1,Sq=B.slice.call(arguments,1),C=Object.create(this.lexer),$={yy:{}};for(var m in this.yy)if(Object.prototype.hasOwnProperty.call(this.yy,m))$.yy[m]=this.yy[m];if(C.setInput(G,$.yy),$.yy.lexer=C,$.yy.parser=this,typeof C.yylloc>"u")C.yylloc={};var l=C.yylloc;B.push(l);var Tq=C.options&&C.options.ranges;if(typeof $.yy.parseError==="function")this.parseError=$.yy.parseError;else this.parseError=Object.getPrototypeOf(this).parseError;function wq(O){Z.length=Z.length-2*O,I.length=I.length-O,B.length=B.length-O}U(wq,"popStack");function Jq(){var O=M.pop()||C.lex()||Gq;if(typeof O!=="number"){if(O instanceof Array)M=O,O=M.pop();O=J.symbols_[O]||O}return O}U(Jq,"lex");var V,i,b,A,oq,r,g={},_,S,Uq,p;while(!0){if(b=Z[Z.length-1],this.defaultActions[b])A=this.defaultActions[b];else{if(V===null||typeof V>"u")V=Jq();A=L[b]&&L[b][V]}if(typeof A>"u"||!A.length||!A[0]){var c="";p=[];for(_ in L[b])if(this.terminals_[_]&&_>jq)p.push("'"+this.terminals_[_]+"'");if(C.showPosition)c="Parse error on line "+(w+1)+`:
`+C.showPosition()+`
Expecting `+p.join(", ")+", got '"+(this.terminals_[V]||V)+"'";else c="Parse error on line "+(w+1)+": Unexpected "+(V==Gq?"end of input":"'"+(this.terminals_[V]||V)+"'");this.parseError(c,{text:C.match,token:this.terminals_[V]||V,line:C.yylineno,loc:l,expected:p})}if(A[0]instanceof Array&&A.length>1)throw Error("Parse Error: multiple actions possible at state: "+b+", token: "+V);switch(A[0]){case 1:if(Z.push(V),I.push(C.yytext),B.push(C.yylloc),Z.push(A[1]),V=null,!i){if(Kq=C.yyleng,P=C.yytext,w=C.yylineno,l=C.yylloc,Qq>0)Qq--}else V=i,i=null;break;case 2:if(S=this.productions_[A[1]][1],g.$=I[I.length-S],g._$={first_line:B[B.length-(S||1)].first_line,last_line:B[B.length-1].last_line,first_column:B[B.length-(S||1)].first_column,last_column:B[B.length-1].last_column},Tq)g._$.range=[B[B.length-(S||1)].range[0],B[B.length-1].range[1]];if(r=this.performAction.apply(g,[P,Kq,w,$.yy,A[1],I,B].concat(Sq)),typeof r<"u")return r;if(S)Z=Z.slice(0,-1*S*2),I=I.slice(0,-1*S),B=B.slice(0,-1*S);Z.push(this.productions_[A[1]][0]),I.push(g.$),B.push(g._$),Uq=L[Z[Z.length-2]][Z[Z.length-1]],Z.push(Uq);break;case 3:return!0}}return!0},"parse")},W=function(){var z={EOF:1,parseError:U(function(J,Z){if(this.yy.parser)this.yy.parser.parseError(J,Z);else throw Error(J)},"parseError"),setInput:U(function(G,J){if(this.yy=J||this.yy||{},this._input=G,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges)this.yylloc.range=[0,0];return this.offset=0,this},"setInput"),input:U(function(){var G=this._input[0];this.yytext+=G,this.yyleng++,this.offset++,this.match+=G,this.matched+=G;var J=G.match(/(?:\r\n?|\n).*/g);if(J)this.yylineno++,this.yylloc.last_line++;else this.yylloc.last_column++;if(this.options.ranges)this.yylloc.range[1]++;return this._input=this._input.slice(1),G},"input"),unput:U(function(G){var J=G.length,Z=G.split(/(?:\r\n?|\n)/g);this._input=G+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-J),this.offset-=J;var M=this.match.split(/(?:\r\n?|\n)/g);if(this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),Z.length-1)this.yylineno-=Z.length-1;var I=this.yylloc.range;if(this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:Z?(Z.length===M.length?this.yylloc.first_column:0)+M[M.length-Z.length].length-Z[0].length:this.yylloc.first_column-J},this.options.ranges)this.yylloc.range=[I[0],I[0]+this.yyleng-J];return this.yyleng=this.yytext.length,this},"unput"),more:U(function(){return this._more=!0,this},"more"),reject:U(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:U(function(G){this.unput(this.match.slice(G))},"less"),pastInput:U(function(){var G=this.matched.substr(0,this.matched.length-this.match.length);return(G.length>20?"...":"")+G.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:U(function(){var G=this.match;if(G.length<20)G+=this._input.substr(0,20-G.length);return(G.substr(0,20)+(G.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:U(function(){var G=this.pastInput(),J=Array(G.length+1).join("-");return G+this.upcomingInput()+`
`+J+"^"},"showPosition"),test_match:U(function(G,J){var Z,M,I;if(this.options.backtrack_lexer){if(I={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges)I.yylloc.range=this.yylloc.range.slice(0)}if(M=G[0].match(/(?:\r\n?|\n).*/g),M)this.yylineno+=M.length;if(this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:M?M[M.length-1].length-M[M.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+G[0].length},this.yytext+=G[0],this.match+=G[0],this.matches=G,this.yyleng=this.yytext.length,this.options.ranges)this.yylloc.range=[this.offset,this.offset+=this.yyleng];if(this._more=!1,this._backtrack=!1,this._input=this._input.slice(G[0].length),this.matched+=G[0],Z=this.performAction.call(this,this.yy,this,J,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input)this.done=!1;if(Z)return Z;else if(this._backtrack){for(var B in I)this[B]=I[B];return!1}return!1},"test_match"),next:U(function(){if(this.done)return this.EOF;if(!this._input)this.done=!0;var G,J,Z,M;if(!this._more)this.yytext="",this.match="";var I=this._currentRules();for(var B=0;B<I.length;B++)if(Z=this._input.match(this.rules[I[B]]),Z&&(!J||Z[0].length>J[0].length)){if(J=Z,M=B,this.options.backtrack_lexer)if(G=this.test_match(Z,I[B]),G!==!1)return G;else if(this._backtrack){J=!1;continue}else return!1;else if(!this.options.flex)break}if(J){if(G=this.test_match(J,I[M]),G!==!1)return G;return!1}if(this._input==="")return this.EOF;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:U(function(){var J=this.next();if(J)return J;else return this.lex()},"lex"),begin:U(function(J){this.conditionStack.push(J)},"begin"),popState:U(function(){var J=this.conditionStack.length-1;if(J>0)return this.conditionStack.pop();else return this.conditionStack[0]},"popState"),_currentRules:U(function(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1])return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;else return this.conditions.INITIAL.rules},"_currentRules"),topState:U(function(J){if(J=this.conditionStack.length-1-Math.abs(J||0),J>=0)return this.conditionStack[J];else return"INITIAL"},"topState"),pushState:U(function(J){this.begin(J)},"pushState"),stateStackSize:U(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:U(function(J,Z,M,I){var B=I;switch(M){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;break;case 8:return this.popState(),"acc_title_value";break;case 9:return this.begin("acc_descr"),14;break;case 10:return this.popState(),"acc_descr_value";break;case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return z}();R.lexer=W;function E(){this.yy={}}return U(E,"Parser"),E.prototype=R,R.Parser=E,new E}();o.parser=o;var Dq=o,h="",t=[],f=[],y=[],$q=U(function(){t.length=0,f.length=0,h="",y.length=0,Yq()},"clear"),bq=U(function(q){h=q,t.push(q)},"addSection"),uq=U(function(){return t},"getSections"),gq=U(function(){let q=Xq(),K=100,X=0;while(!q&&X<K)q=Xq(),X++;return f.push(...y),f},"getTasks"),hq=U(function(){let q=[];return f.forEach((X)=>{if(X.people)q.push(...X.people)}),[...new Set(q)].sort()},"updateActors"),fq=U(function(q,K){let X=K.substr(1).split(":"),N=0,Q=[];if(X.length===1)N=Number(X[0]),Q=[];else N=Number(X[0]),Q=X[1].split(",");let Y=Q.map((H)=>H.trim()),F={section:h,type:h,people:Y,task:q,score:N};y.push(F)},"addTask"),yq=U(function(q){let K={section:h,type:h,description:q,task:q,classes:[]};f.push(K)},"addTaskOrg"),Xq=U(function(){let q=U(function(X){return y[X].processed},"compileTask"),K=!0;for(let[X,N]of y.entries())q(X),K=K&&N.processed;return K},"compileTasks"),xq=U(function(){return hq()},"getActors"),Zq={getConfig:U(()=>u().journey,"getConfig"),clear:$q,setDiagramTitle:Rq,getDiagramTitle:Wq,setAccTitle:Mq,getAccTitle:Iq,setAccDescription:Nq,getAccDescription:Fq,addSection:bq,getSections:uq,getTasks:gq,addTask:fq,addTaskOrg:yq,getActors:xq},_q=U((q)=>`.label {
    font-family: ${q.fontFamily};
    color: ${q.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${q.textColor}
  }

  .legend {
    fill: ${q.textColor};
    font-family: ${q.fontFamily};
  }

  .label text {
    fill: #333;
  }
  .label {
    color: ${q.textColor}
  }

  .face {
    ${q.faceColor?`fill: ${q.faceColor}`:"fill: #FFF8DC"};
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${q.mainBkg};
    stroke: ${q.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${q.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${q.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${q.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${q.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
  }

  .cluster text {
    fill: ${q.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${q.fontFamily};
    font-size: 12px;
    background: ${q.tertiaryColor};
    border: 1px solid ${q.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .task-type-0, .section-type-0  {
    ${q.fillType0?`fill: ${q.fillType0}`:""};
  }
  .task-type-1, .section-type-1  {
    ${q.fillType0?`fill: ${q.fillType1}`:""};
  }
  .task-type-2, .section-type-2  {
    ${q.fillType0?`fill: ${q.fillType2}`:""};
  }
  .task-type-3, .section-type-3  {
    ${q.fillType0?`fill: ${q.fillType3}`:""};
  }
  .task-type-4, .section-type-4  {
    ${q.fillType0?`fill: ${q.fillType4}`:""};
  }
  .task-type-5, .section-type-5  {
    ${q.fillType0?`fill: ${q.fillType5}`:""};
  }
  .task-type-6, .section-type-6  {
    ${q.fillType0?`fill: ${q.fillType6}`:""};
  }
  .task-type-7, .section-type-7  {
    ${q.fillType0?`fill: ${q.fillType7}`:""};
  }

  .actor-0 {
    ${q.actor0?`fill: ${q.actor0}`:""};
  }
  .actor-1 {
    ${q.actor1?`fill: ${q.actor1}`:""};
  }
  .actor-2 {
    ${q.actor2?`fill: ${q.actor2}`:""};
  }
  .actor-3 {
    ${q.actor3?`fill: ${q.actor3}`:""};
  }
  .actor-4 {
    ${q.actor4?`fill: ${q.actor4}`:""};
  }
  .actor-5 {
    ${q.actor5?`fill: ${q.actor5}`:""};
  }
  ${Lq()}
`,"getStyles"),pq=_q,qq=U(function(q,K){return Eq(q,K)},"drawRect"),kq=U(function(q,K){let N=q.append("circle").attr("cx",K.cx).attr("cy",K.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),Q=q.append("g");Q.append("circle").attr("cx",K.cx-5).attr("cy",K.cy-5).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),Q.append("circle").attr("cx",K.cx+5).attr("cy",K.cy-5).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function Y(R){let W=n().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);R.append("path").attr("class","mouth").attr("d",W).attr("transform","translate("+K.cx+","+(K.cy+2)+")")}U(Y,"smile");function F(R){let W=n().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);R.append("path").attr("class","mouth").attr("d",W).attr("transform","translate("+K.cx+","+(K.cy+7)+")")}U(F,"sad");function H(R){R.append("line").attr("class","mouth").attr("stroke",2).attr("x1",K.cx-5).attr("y1",K.cy+7).attr("x2",K.cx+5).attr("y2",K.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}if(U(H,"ambivalent"),K.score>3)Y(Q);else if(K.score<3)F(Q);else H(Q);return N},"drawFace"),Vq=U(function(q,K){let X=q.append("circle");if(X.attr("cx",K.cx),X.attr("cy",K.cy),X.attr("class","actor-"+K.pos),X.attr("fill",K.fill),X.attr("stroke",K.stroke),X.attr("r",K.r),X.class!==void 0)X.attr("class",X.class);if(K.title!==void 0)X.append("title").text(K.title);return X},"drawCircle"),Aq=U(function(q,K){return Cq(q,K)},"drawText"),dq=U(function(q,K){function X(Q,Y,F,H,R){return Q+","+Y+" "+(Q+F)+","+Y+" "+(Q+F)+","+(Y+H-R)+" "+(Q+F-R*1.2)+","+(Y+H)+" "+Q+","+(Y+H)}U(X,"genPoints");let N=q.append("polygon");N.attr("points",X(K.x,K.y,50,20,7)),N.attr("class","labelBox"),K.y=K.y+K.labelMargin,K.x=K.x+0.5*K.labelMargin,Aq(q,K)},"drawLabel"),mq=U(function(q,K,X){let N=q.append("g"),Q=e();Q.x=K.x,Q.y=K.y,Q.fill=K.fill,Q.width=X.width*K.taskCount+X.diagramMarginX*(K.taskCount-1),Q.height=X.height,Q.class="journey-section section-type-"+K.num,Q.rx=3,Q.ry=3,qq(N,Q),Oq(X)(K.text,N,Q.x,Q.y,Q.width,Q.height,{class:"journey-section section-type-"+K.num},X,K.colour)},"drawSection"),a=-1,lq=U(function(q,K,X,N){let Q=K.x+X.width/2,Y=q.append("g");a++;let F=450;Y.append("line").attr("id",N+"-task"+a).attr("x1",Q).attr("y1",K.y).attr("x2",Q).attr("y2",F).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),kq(Y,{cx:Q,cy:300+(5-K.score)*30,score:K.score});let H=e();H.x=K.x,H.y=K.y,H.fill=K.fill,H.width=X.width,H.height=X.height,H.class="task task-type-"+K.num,H.rx=3,H.ry=3,qq(Y,H);let R=K.x+14;K.people.forEach((W)=>{let E=K.actors[W].color,z={cx:R,cy:K.y,r:7,fill:E,stroke:"#000",title:W,pos:K.actors[W].position};Vq(Y,z),R+=10}),Oq(X)(K.task,Y,H.x,H.y,H.width,H.height,{class:"task"},X,K.colour)},"drawTask"),iq=U(function(q,K){Pq(q,K)},"drawBackgroundRect"),Oq=function(){function q(Q,Y,F,H,R,W,E,z){let G=Y.append("text").attr("x",F+R/2).attr("y",H+W/2+5).style("font-color",z).style("text-anchor","middle").text(Q);N(G,E)}U(q,"byText");function K(Q,Y,F,H,R,W,E,z,G){let{taskFontSize:J,taskFontFamily:Z}=z,M=Q.split(/<br\s*\/?>/gi);for(let I=0;I<M.length;I++){let B=I*J-J*(M.length-1)/2,L=Y.append("text").attr("x",F+R/2).attr("y",H).attr("fill",G).style("text-anchor","middle").style("font-size",J).style("font-family",Z);L.append("tspan").attr("x",F+R/2).attr("dy",B).text(M[I]),L.attr("y",H+W/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),N(L,E)}}U(K,"byTspan");function X(Q,Y,F,H,R,W,E,z){let G=Y.append("switch"),Z=G.append("foreignObject").attr("x",F).attr("y",H).attr("width",R).attr("height",W).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");Z.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(Q),K(Q,G,F,H,R,W,E,z),N(Z,E)}U(X,"byFo");function N(Q,Y){for(let F in Y)if(F in Y)Q.attr(F,Y[F])}return U(N,"_setTextAttrs"),function(Q){return Q.textPlacement==="fo"?X:Q.textPlacement==="old"?q:K}}(),rq=U(function(q,K){a=-1,q.append("defs").append("marker").attr("id",K+"-arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics"),x={drawRect:qq,drawCircle:Vq,drawSection:mq,drawText:Aq,drawLabel:dq,drawTask:lq,drawBackgroundRect:iq,initGraphics:rq},cq=U(function(q){Object.keys(q).forEach(function(X){j[X]=q[X]})},"setConf"),T={},d=0;function vq(q){let K=u().journey,X=K.maxLabelWidth;d=0;let N=60;Object.keys(T).forEach((Q)=>{let Y=T[Q].color,F={cx:20,cy:N,r:7,fill:Y,stroke:"#000",pos:T[Q].position};x.drawCircle(q,F);let H=q.append("text").attr("visibility","hidden").text(Q),R=H.node().getBoundingClientRect().width;H.remove();let W=[];if(R<=X)W=[Q];else{let E=Q.split(" "),z="";if(H=q.append("text").attr("visibility","hidden"),E.forEach((G)=>{let J=z?`${z} ${G}`:G;if(H.text(J),H.node().getBoundingClientRect().width>X){if(z)W.push(z);if(z=G,H.text(G),H.node().getBoundingClientRect().width>X){let M="";for(let I of G)if(M+=I,H.text(M+"-"),H.node().getBoundingClientRect().width>X)W.push(M.slice(0,-1)+"-"),M=I;z=M}}else z=J}),z)W.push(z);H.remove()}W.forEach((E,z)=>{let G={x:40,y:N+7+z*20,fill:"#666",text:E,textMargin:K.boxTextMargin??5},Z=x.drawText(q,G).node().getBoundingClientRect().width;if(Z>d&&Z>K.leftMargin-Z)d=Z}),N+=Math.max(20,W.length*20)})}U(vq,"drawActorLegend");var j=u().journey,D=0,sq=U(function(q,K,X,N){let Q=u(),Y=Q.journey.titleColor,F=Q.journey.titleFontSize,H=Q.journey.titleFontFamily,R=Q.securityLevel,W;if(R==="sandbox")W=k("#i"+K);let E=R==="sandbox"?k(W.nodes()[0].contentDocument.body):k("body");v.init();let z=E.select("#"+K);x.initGraphics(z,K);let G=N.db.getTasks(),J=N.db.getDiagramTitle(),Z=N.db.getActors();for(let w in T)delete T[w];let M=0;Z.forEach((w)=>{T[w]={color:j.actorColours[M%j.actorColours.length],position:M},M++}),vq(z),D=j.leftMargin+d,v.insert(0,0,D,Object.keys(T).length*50),nq(z,G,0,K);let I=v.getBounds();if(J)z.append("text").text(J).attr("x",D).attr("font-size",F).attr("font-weight","bold").attr("y",25).attr("fill",Y).attr("font-family",H);let B=I.stopy-I.starty+2*j.diagramMarginY,L=D+I.stopx+2*j.diagramMarginX;zq(z,B,L,j.useMaxWidth),z.append("line").attr("x1",D).attr("y1",j.height*4).attr("x2",L-D-4).attr("y2",j.height*4).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#"+K+"-arrowhead)");let P=J?70:0;z.attr("viewBox",`${I.startx} -25 ${L} ${B+P}`),z.attr("preserveAspectRatio","xMinYMin meet"),z.attr("height",B+P+25)},"draw"),v={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:U(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:U(function(q,K,X,N){if(q[K]===void 0)q[K]=X;else q[K]=N(X,q[K])},"updateVal"),updateBounds:U(function(q,K,X,N){let Q=u().journey,Y=this,F=0;function H(R){return U(function(E){F++;let z=Y.sequenceItems.length-F+1;if(Y.updateVal(E,"starty",K-z*Q.boxMargin,Math.min),Y.updateVal(E,"stopy",N+z*Q.boxMargin,Math.max),Y.updateVal(v.data,"startx",q-z*Q.boxMargin,Math.min),Y.updateVal(v.data,"stopx",X+z*Q.boxMargin,Math.max),R!=="activation")Y.updateVal(E,"startx",q-z*Q.boxMargin,Math.min),Y.updateVal(E,"stopx",X+z*Q.boxMargin,Math.max),Y.updateVal(v.data,"starty",K-z*Q.boxMargin,Math.min),Y.updateVal(v.data,"stopy",N+z*Q.boxMargin,Math.max)},"updateItemBounds")}U(H,"updateFn"),this.sequenceItems.forEach(H())},"updateBounds"),insert:U(function(q,K,X,N){let Q=Math.min(q,X),Y=Math.max(q,X),F=Math.min(K,N),H=Math.max(K,N);this.updateVal(v.data,"startx",Q,Math.min),this.updateVal(v.data,"starty",F,Math.min),this.updateVal(v.data,"stopx",Y,Math.max),this.updateVal(v.data,"stopy",H,Math.max),this.updateBounds(Q,F,Y,H)},"insert"),bumpVerticalPos:U(function(q){this.verticalPos=this.verticalPos+q,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:U(function(){return this.verticalPos},"getVerticalPos"),getBounds:U(function(){return this.data},"getBounds")},s=j.sectionFills,Hq=j.sectionColours,nq=U(function(q,K,X,N){let Q=u().journey,Y="",F=Q.height*2+Q.diagramMarginY,H=X+F,R=0,W="#CCC",E="black",z=0;for(let[G,J]of K.entries()){if(Y!==J.section){W=s[R%s.length],z=R%s.length,E=Hq[R%Hq.length];let M=0,I=J.section;for(let L=G;L<K.length;L++)if(K[L].section==I)M=M+1;else break;let B={x:G*Q.taskMargin+G*Q.width+D,y:50,text:J.section,fill:W,num:z,colour:E,taskCount:M};x.drawSection(q,B,Q),Y=J.section,R++}let Z=J.people.reduce((M,I)=>{if(T[I])M[I]=T[I];return M},{});J.x=G*Q.taskMargin+G*Q.width+D,J.y=H,J.width=Q.diagramMarginX,J.height=Q.diagramMarginY,J.colour=E,J.fill=W,J.num=z,J.actors=Z,x.drawTask(q,J,Q,N),v.insert(J.x,J.y,J.x+J.width+Q.taskMargin,450)}},"drawTasks"),Bq={setConf:cq,draw:sq},JK={parser:Dq,db:Zq,renderer:Bq,styles:pq,init:U((q)=>{Bq.setConf(q.journey),Zq.clear()},"init")};export{JK as diagram};
