import{hb as oz}from"./chunk-0xhfgpsq.js";import{jb as az}from"./chunk-nn10dry1.js";import{lb as tz}from"./chunk-ga8gg86w.js";import{bc as sz}from"./chunk-v165dhvh.js";import{ic as nz,rc as iz}from"./chunk-c05sh8f5.js";import{Dc as yz,id as l,od as cz,pd as pz,qd as mz,rd as lz,sd as $z,td as rz,ud as dz,vd as g}from"./chunk-tk2w7j1m.js";import{Dd as O,Jd as Rz}from"./chunk-8prwmdh2.js";import{Ce as M}from"./chunk-6d66f5kk.js";var fz=function(){var z=M(function(p,Z,U,X){for(U=U||{},X=p.length;X--;U[p[X]]=Z);return U},"o"),J=[1,2],B=[1,3],Q=[1,4],j=[2,4],H=[1,9],G=[1,11],F=[1,16],q=[1,17],P=[1,18],w=[1,19],k=[1,33],h=[1,20],b=[1,21],Y=[1,22],N=[1,23],E=[1,24],f=[1,26],V=[1,27],u=[1,28],S=[1,29],D=[1,30],d=[1,31],Wz=[1,32],Xz=[1,35],Zz=[1,36],Kz=[1,37],qz=[1,38],n=[1,34],R=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],Bz=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],Nz=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],Pz={trace:M(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:M(function(Z,U,X,v,L,W,i){var K=W.length-1;switch(L){case 3:return v.setRootDoc(W[K]),W[K];break;case 4:this.$=[];break;case 5:if(W[K]!="nl")W[K-1].push(W[K]),this.$=W[K-1];break;case 6:case 7:this.$=W[K];break;case 8:this.$="nl";break;case 12:this.$=W[K];break;case 13:let Hz=W[K-1];Hz.description=v.trimColon(W[K]),this.$=Hz;break;case 14:this.$={stmt:"relation",state1:W[K-2],state2:W[K]};break;case 15:let Yz=v.trimColon(W[K]);this.$={stmt:"relation",state1:W[K-3],state2:W[K-1],description:Yz};break;case 19:this.$={stmt:"state",id:W[K-3],type:"default",description:"",doc:W[K-1]};break;case 20:var I=W[K],y=W[K-2].trim();if(W[K].match(":")){var t=W[K].split(":");I=t[0],y=[y,t[1]]}this.$={stmt:"state",id:I,type:"default",description:y};break;case 21:this.$={stmt:"state",id:W[K-3],type:"default",description:W[K-5],doc:W[K-1]};break;case 22:this.$={stmt:"state",id:W[K],type:"fork"};break;case 23:this.$={stmt:"state",id:W[K],type:"join"};break;case 24:this.$={stmt:"state",id:W[K],type:"choice"};break;case 25:this.$={stmt:"state",id:v.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:W[K-1].trim(),note:{position:W[K-2].trim(),text:W[K].trim()}};break;case 29:this.$=W[K].trim(),v.setAccTitle(this.$);break;case 30:case 31:this.$=W[K].trim(),v.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:W[K-3],url:W[K-2],tooltip:W[K-1]};break;case 33:this.$={stmt:"click",id:W[K-3],url:W[K-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:W[K-1].trim(),classes:W[K].trim()};break;case 36:this.$={stmt:"style",id:W[K-1].trim(),styleClass:W[K].trim()};break;case 37:this.$={stmt:"applyClass",id:W[K-1].trim(),styleClass:W[K].trim()};break;case 38:v.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:v.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:v.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:v.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:W[K].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:W[K-2].trim(),classes:[W[K].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:W[K-2].trim(),classes:[W[K].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:J,5:B,6:Q},{1:[3]},{3:5,4:J,5:B,6:Q},{3:6,4:J,5:B,6:Q},z([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],j,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:H,5:G,8:8,9:10,10:12,11:13,12:14,13:15,16:F,17:q,19:P,22:w,24:k,25:h,26:b,27:Y,28:N,29:E,32:25,33:f,35:V,37:u,38:S,41:D,45:d,48:Wz,51:Xz,52:Zz,53:Kz,54:qz,57:n},z(R,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:F,17:q,19:P,22:w,24:k,25:h,26:b,27:Y,28:N,29:E,32:25,33:f,35:V,37:u,38:S,41:D,45:d,48:Wz,51:Xz,52:Zz,53:Kz,54:qz,57:n},z(R,[2,7]),z(R,[2,8]),z(R,[2,9]),z(R,[2,10]),z(R,[2,11]),z(R,[2,12],{14:[1,40],15:[1,41]}),z(R,[2,16]),{18:[1,42]},z(R,[2,18],{20:[1,43]}),{23:[1,44]},z(R,[2,22]),z(R,[2,23]),z(R,[2,24]),z(R,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},z(R,[2,28]),{34:[1,49]},{36:[1,50]},z(R,[2,31]),{13:51,24:k,57:n},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},z(Bz,[2,44],{58:[1,56]}),z(Bz,[2,45],{58:[1,57]}),z(R,[2,38]),z(R,[2,39]),z(R,[2,40]),z(R,[2,41]),z(R,[2,6]),z(R,[2,13]),{13:58,24:k,57:n},z(R,[2,17]),z(Nz,j,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},z(R,[2,29]),z(R,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},z(R,[2,14],{14:[1,71]}),{4:H,5:G,8:8,9:10,10:12,11:13,12:14,13:15,16:F,17:q,19:P,21:[1,72],22:w,24:k,25:h,26:b,27:Y,28:N,29:E,32:25,33:f,35:V,37:u,38:S,41:D,45:d,48:Wz,51:Xz,52:Zz,53:Kz,54:qz,57:n},z(R,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},z(R,[2,34]),z(R,[2,35]),z(R,[2,36]),z(R,[2,37]),z(Bz,[2,46]),z(Bz,[2,47]),z(R,[2,15]),z(R,[2,19]),z(Nz,j,{7:78}),z(R,[2,26]),z(R,[2,27]),{5:[1,79]},{5:[1,80]},{4:H,5:G,8:8,9:10,10:12,11:13,12:14,13:15,16:F,17:q,19:P,21:[1,81],22:w,24:k,25:h,26:b,27:Y,28:N,29:E,32:25,33:f,35:V,37:u,38:S,41:D,45:d,48:Wz,51:Xz,52:Zz,53:Kz,54:qz,57:n},z(R,[2,32]),z(R,[2,33]),z(R,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:M(function(Z,U){if(U.recoverable)this.trace(Z);else{var X=Error(Z);throw X.hash=U,X}},"parseError"),parse:M(function(Z){var U=this,X=[0],v=[],L=[null],W=[],i=this.table,K="",I=0,y=0,t=0,Hz=2,Yz=1,MJ=W.slice.call(arguments,1),x=Object.create(this.lexer),$={yy:{}};for(var Lz in this.yy)if(Object.prototype.hasOwnProperty.call(this.yy,Lz))$.yy[Lz]=this.yy[Lz];if(x.setInput(Z,$.yy),$.yy.lexer=x,$.yy.parser=this,typeof x.yylloc>"u")x.yylloc={};var Oz=x.yylloc;W.push(Oz);var GJ=x.options&&x.options.ranges;if(typeof $.yy.parseError==="function")this.parseError=$.yy.parseError;else this.parseError=Object.getPrototypeOf(this).parseError;function RJ(_){X.length=X.length-2*_,L.length=L.length-_,W.length=W.length-_}M(RJ,"popStack");function Ez(){var _=v.pop()||x.lex()||Yz;if(typeof _!=="number"){if(_ instanceof Array)v=_,_=v.pop();_=U.symbols_[_]||_}return _}M(Ez,"lex");var C,wz,r,T,pJ,xz,a={},Uz,c,Dz,Mz;while(!0){if(r=X[X.length-1],this.defaultActions[r])T=this.defaultActions[r];else{if(C===null||typeof C>"u")C=Ez();T=i[r]&&i[r][C]}if(typeof T>"u"||!T.length||!T[0]){var bz="";Mz=[];for(Uz in i[r])if(this.terminals_[Uz]&&Uz>Hz)Mz.push("'"+this.terminals_[Uz]+"'");if(x.showPosition)bz="Parse error on line "+(I+1)+`:
`+x.showPosition()+`
Expecting `+Mz.join(", ")+", got '"+(this.terminals_[C]||C)+"'";else bz="Parse error on line "+(I+1)+": Unexpected "+(C==Yz?"end of input":"'"+(this.terminals_[C]||C)+"'");this.parseError(bz,{text:x.match,token:this.terminals_[C]||C,line:x.yylineno,loc:Oz,expected:Mz})}if(T[0]instanceof Array&&T.length>1)throw Error("Parse Error: multiple actions possible at state: "+r+", token: "+C);switch(T[0]){case 1:if(X.push(C),L.push(x.yytext),W.push(x.yylloc),X.push(T[1]),C=null,!wz){if(y=x.yyleng,K=x.yytext,I=x.yylineno,Oz=x.yylloc,t>0)t--}else C=wz,wz=null;break;case 2:if(c=this.productions_[T[1]][1],a.$=L[L.length-c],a._$={first_line:W[W.length-(c||1)].first_line,last_line:W[W.length-1].last_line,first_column:W[W.length-(c||1)].first_column,last_column:W[W.length-1].last_column},GJ)a._$.range=[W[W.length-(c||1)].range[0],W[W.length-1].range[1]];if(xz=this.performAction.apply(a,[K,y,I,$.yy,T[1],L,W].concat(MJ)),typeof xz<"u")return xz;if(c)X=X.slice(0,-1*c*2),L=L.slice(0,-1*c),W=W.slice(0,-1*c);X.push(this.productions_[T[1]][0]),L.push(a.$),W.push(a._$),Dz=i[X[X.length-2]][X[X.length-1]],X.push(Dz);break;case 3:return!0}}return!0},"parse")},UJ=function(){var p={EOF:1,parseError:M(function(U,X){if(this.yy.parser)this.yy.parser.parseError(U,X);else throw Error(U)},"parseError"),setInput:M(function(Z,U){if(this.yy=U||this.yy||{},this._input=Z,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges)this.yylloc.range=[0,0];return this.offset=0,this},"setInput"),input:M(function(){var Z=this._input[0];this.yytext+=Z,this.yyleng++,this.offset++,this.match+=Z,this.matched+=Z;var U=Z.match(/(?:\r\n?|\n).*/g);if(U)this.yylineno++,this.yylloc.last_line++;else this.yylloc.last_column++;if(this.options.ranges)this.yylloc.range[1]++;return this._input=this._input.slice(1),Z},"input"),unput:M(function(Z){var U=Z.length,X=Z.split(/(?:\r\n?|\n)/g);this._input=Z+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-U),this.offset-=U;var v=this.match.split(/(?:\r\n?|\n)/g);if(this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),X.length-1)this.yylineno-=X.length-1;var L=this.yylloc.range;if(this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:X?(X.length===v.length?this.yylloc.first_column:0)+v[v.length-X.length].length-X[0].length:this.yylloc.first_column-U},this.options.ranges)this.yylloc.range=[L[0],L[0]+this.yyleng-U];return this.yyleng=this.yytext.length,this},"unput"),more:M(function(){return this._more=!0,this},"more"),reject:M(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:M(function(Z){this.unput(this.match.slice(Z))},"less"),pastInput:M(function(){var Z=this.matched.substr(0,this.matched.length-this.match.length);return(Z.length>20?"...":"")+Z.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:M(function(){var Z=this.match;if(Z.length<20)Z+=this._input.substr(0,20-Z.length);return(Z.substr(0,20)+(Z.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:M(function(){var Z=this.pastInput(),U=Array(Z.length+1).join("-");return Z+this.upcomingInput()+`
`+U+"^"},"showPosition"),test_match:M(function(Z,U){var X,v,L;if(this.options.backtrack_lexer){if(L={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges)L.yylloc.range=this.yylloc.range.slice(0)}if(v=Z[0].match(/(?:\r\n?|\n).*/g),v)this.yylineno+=v.length;if(this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:v?v[v.length-1].length-v[v.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+Z[0].length},this.yytext+=Z[0],this.match+=Z[0],this.matches=Z,this.yyleng=this.yytext.length,this.options.ranges)this.yylloc.range=[this.offset,this.offset+=this.yyleng];if(this._more=!1,this._backtrack=!1,this._input=this._input.slice(Z[0].length),this.matched+=Z[0],X=this.performAction.call(this,this.yy,this,U,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input)this.done=!1;if(X)return X;else if(this._backtrack){for(var W in L)this[W]=L[W];return!1}return!1},"test_match"),next:M(function(){if(this.done)return this.EOF;if(!this._input)this.done=!0;var Z,U,X,v;if(!this._more)this.yytext="",this.match="";var L=this._currentRules();for(var W=0;W<L.length;W++)if(X=this._input.match(this.rules[L[W]]),X&&(!U||X[0].length>U[0].length)){if(U=X,v=W,this.options.backtrack_lexer)if(Z=this.test_match(X,L[W]),Z!==!1)return Z;else if(this._backtrack){U=!1;continue}else return!1;else if(!this.options.flex)break}if(U){if(Z=this.test_match(U,L[v]),Z!==!1)return Z;return!1}if(this._input==="")return this.EOF;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:M(function(){var U=this.next();if(U)return U;else return this.lex()},"lex"),begin:M(function(U){this.conditionStack.push(U)},"begin"),popState:M(function(){var U=this.conditionStack.length-1;if(U>0)return this.conditionStack.pop();else return this.conditionStack[0]},"popState"),_currentRules:M(function(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1])return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;else return this.conditions.INITIAL.rules},"_currentRules"),topState:M(function(U){if(U=this.conditionStack.length-1-Math.abs(U||0),U>=0)return this.conditionStack[U];else return"INITIAL"},"topState"),pushState:M(function(U){this.begin(U)},"pushState"),stateStackSize:M(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:M(function(U,X,v,L){function W(){let K=X.yytext.indexOf("%%");if(K===0)return!1;if(K>0){let I=X.yytext.slice(0,K),y=X.yytext.slice(K);if(y)U.lexer.unput(y);X.yytext=I}return!0}M(W,"processId");var i=L;switch(v){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;break;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;break;case 17:return this.popState(),"acc_title_value";break;case 18:return this.begin("acc_descr"),35;break;case 19:return this.popState(),"acc_descr_value";break;case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;break;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";break;case 25:return this.popState(),this.pushState("CLASSDEFID"),42;break;case 26:return this.popState(),43;break;case 27:return this.pushState("CLASS"),48;break;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;break;case 29:return this.popState(),50;break;case 30:return this.pushState("STYLE"),45;break;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;break;case 32:return this.popState(),47;break;case 33:return this.pushState("SCALE"),17;break;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),X.yytext=X.yytext.slice(0,-8).trim(),25;break;case 38:return this.popState(),X.yytext=X.yytext.slice(0,-8).trim(),26;break;case 39:return this.popState(),X.yytext=X.yytext.slice(0,-10).trim(),27;break;case 40:return this.popState(),X.yytext=X.yytext.slice(0,-8).trim(),25;break;case 41:return this.popState(),X.yytext=X.yytext.slice(0,-8).trim(),26;break;case 42:return this.popState(),X.yytext=X.yytext.slice(0,-10).trim(),27;break;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";break;case 49:if(!W())return;return this.popState(),"ID";break;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:throw Error('Error: State name must be a single word. Found: "'+X.yytext.trim()+'"');case 53:return 19;case 54:this.popState();break;case 55:return this.popState(),this.pushState("struct"),20;break;case 56:return this.popState(),21;break;case 57:break;case 58:return this.begin("NOTE"),29;break;case 59:return this.popState(),this.pushState("NOTE_ID"),59;break;case 60:return this.popState(),this.pushState("NOTE_ID"),60;break;case 61:this.popState(),this.pushState("FLOATING_NOTE");break;case 62:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";break;case 63:break;case 64:return"NOTE_TEXT";case 65:if(!W())return;return this.popState(),"ID";break;case 66:if(!W())return;return this.popState(),this.pushState("NOTE_TEXT"),24;break;case 67:return this.popState(),X.yytext=X.yytext.substr(2).trim(),31;break;case 68:return this.popState(),X.yytext=X.yytext.slice(0,-8).trim(),31;break;case 69:return 6;case 70:return 6;case 71:return 16;case 72:return 57;case 73:if(!W())return;return 24;case 74:return X.yytext=X.yytext.trim(),14;break;case 75:return 15;case 76:return 28;case 77:return 58;case 78:return 5;case 79:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:\w+\s+\w+.*?\{)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,56,57,58,72,73,74,75,76,77],inclusive:!1},FLOATING_NOTE_ID:{rules:[65],inclusive:!1},FLOATING_NOTE:{rules:[62,63,64],inclusive:!1},NOTE_TEXT:{rules:[67,68],inclusive:!1},NOTE_ID:{rules:[66],inclusive:!1},NOTE:{rules:[59,60,61],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54,55],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,55,58,69,70,71,72,73,74,75,77,78,79],inclusive:!0}}};return p}();Pz.lexer=UJ;function jz(){this.yy={}}return M(jz,"Parser"),jz.prototype=Pz,Pz.Parser=jz,new jz}();fz.parser=fz;var sJ=fz,FJ="TB",ez="TB",kz="dir",o="state",s="root",uz="relation",vJ="classDef",PJ="style",LJ="applyClass",Jz="default",zJ="divider",JJ="fill:none",QJ="fill: #333",WJ="c",XJ="markdown",ZJ="normal",Cz="rect",Az="rectWithTitle",OJ="stateStart",wJ="stateEnd",Tz="divider",_z="roundedWithTitle",xJ="note",bJ="noteGroup",Qz="statediagram",CJ="state",AJ=`${Qz}-${CJ}`,KJ="transition",fJ="note",uJ="note-edge",hJ=`${KJ} ${uJ}`,NJ=`${Qz}-${fJ}`,EJ="cluster",DJ=`${Qz}-${EJ}`,kJ="cluster-alt",TJ=`${Qz}-${kJ}`,qJ="parent",BJ="note",_J="state",hz="----",gJ=`${hz}${BJ}`,gz=`${hz}${qJ}`,jJ=M((z,J=ez)=>{if(!z.doc)return J;let B=J;for(let Q of z.doc)if(Q.stmt==="dir")B=Q.value;return B},"getDir"),VJ=M(function(z,J){return J.db.getClasses()},"getClasses"),SJ=M(async function(z,J,B,Q){O.info("REF0:"),O.info("Drawing state diagram (v2)",J);let{securityLevel:j,state:H,layout:G}=g();Q.db.extract(Q.db.getRootDocV2());let F=Q.db.getData(),q=oz(J,j);if(F.type=Q.type,F.layoutAlgorithm=G,F.nodeSpacing=H?.nodeSpacing||50,F.rankSpacing=H?.rankSpacing||50,g().look==="neo")F.markers=["barbNeo"];else F.markers=["barb"];F.diagramId=J,await az(F,q);let w=8;try{(typeof Q.db.getLinks==="function"?Q.db.getLinks():new Map).forEach((h,b)=>{let Y=typeof b==="string"?b:typeof b?.id==="string"?b.id:"",N=F.nodes.find((D)=>D.id===Y);if(!Y){O.warn("⚠️ Invalid or missing stateId from key:",JSON.stringify(b));return}let E=q.node()?.querySelectorAll("g.node, g.rough-node"),f;if(E?.forEach((D)=>{let d=D.textContent?.trim();if(D.id===N?.domId||d===Y)f=D}),!f){O.warn("⚠️ Could not find node matching text:",Y);return}let V=f.parentNode;if(!V){O.warn("⚠️ Node has no parent, cannot wrap:",Y);return}let u=document.createElementNS("http://www.w3.org/2000/svg","a"),S=h.url.replace(/^"+|"+$/g,"");if(u.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",S),u.setAttribute("target","_blank"),h.tooltip){let D=h.tooltip.replace(/^"+|"+$/g,"");u.setAttribute("title",D),f.setAttribute("title",D)}V.replaceChild(u,f),u.appendChild(f),O.info("\uD83D\uDD17 Wrapped node in <a> tag for:",Y,h.url)})}catch(k){O.error("❌ Error injecting clickable links:",k)}iz.insertTitle(q,"statediagramTitleText",H?.titleTopMargin??25,Q.db.getDiagramTitle()),tz(q,w,Qz,H?.useMaxWidth??!0)},"draw"),oJ={getClasses:VJ,draw:SJ,getDir:jJ},Fz=new Map,m=0;function vz(z="",J=0,B="",Q=hz){let j=B!==null&&B.length>0?`${Q}${B}`:"";return`${_J}-${z}${j}-${J}`}M(vz,"stateDomId");var IJ=M((z,J,B,Q,j,H,G,F)=>{O.trace("items",J),J.forEach((q)=>{switch(q.stmt){case o:zz(z,q,B,Q,j,H,G,F);break;case Jz:zz(z,q,B,Q,j,H,G,F);break;case uz:{zz(z,q.state1,B,Q,j,H,G,F),zz(z,q.state2,B,Q,j,H,G,F);let P=G==="neo",w={id:"edge"+m,start:q.state1.id,end:q.state2.id,arrowhead:"normal",arrowTypeEnd:P?"arrow_barb_neo":"arrow_barb",style:JJ,labelStyle:"",label:l.sanitizeText(q.description??"",g()),arrowheadStyle:QJ,labelpos:WJ,labelType:XJ,thickness:ZJ,classes:KJ,look:G};j.push(w),m++}break}})},"setupDoc"),Vz=M((z,J=ez)=>{let B=J;if(z.doc){for(let Q of z.doc)if(Q.stmt==="dir")B=Q.value}return B},"getDir");function e(z,J,B){if(!J.id||J.id==="</join></fork>"||J.id==="</choice>")return;if(J.cssClasses){if(!Array.isArray(J.cssCompiledStyles))J.cssCompiledStyles=[];J.cssClasses.split(" ").forEach((j)=>{let H=B.get(j);if(H)J.cssCompiledStyles=[...J.cssCompiledStyles??[],...H.styles]})}let Q=z.find((j)=>j.id===J.id);if(Q)Object.assign(Q,J);else z.push(J)}M(e,"insertOrUpdateNode");function HJ(z){return z?.classes?.join(" ")??""}M(HJ,"getClassesFromDbInfo");function YJ(z){return z?.styles??[]}M(YJ,"getStylesFromDbInfo");var zz=M((z,J,B,Q,j,H,G,F)=>{let q=J.id,P=B.get(q),w=HJ(P),k=YJ(P),h=g();if(O.info("dataFetcher parsedItem",J,P,k),q!=="root"){let b=Cz;if(J.start===!0)b=OJ;else if(J.start===!1)b=wJ;if(J.type!==Jz)b=J.type;if(!Fz.get(q))Fz.set(q,{id:q,shape:b,description:l.sanitizeText(q,h),cssClasses:`${w} ${AJ}`,cssStyles:k});let Y=Fz.get(q);if(J.description){if(Array.isArray(Y.description))Y.shape=Az,Y.description.push(J.description);else if(Y.description?.length&&Y.description.length>0)if(Y.shape=Az,Y.description===q)Y.description=[J.description];else Y.description=[Y.description,J.description];else Y.shape=Cz,Y.description=J.description;Y.description=l.sanitizeTextOrArray(Y.description,h)}if(Y.description?.length===1&&Y.shape===Az)if(Y.type==="group")Y.shape=_z;else Y.shape=Cz;if(!Y.type&&J.doc)O.info("Setting cluster for XCX",q,Vz(J)),Y.type="group",Y.isGroup=!0,Y.dir=Vz(J),Y.explicitDir=J.doc.some((E)=>E.stmt==="dir"),Y.shape=J.type===zJ?Tz:_z,Y.cssClasses=`${Y.cssClasses} ${DJ} ${H?TJ:""}`;let N={labelStyle:"",shape:Y.shape,label:Y.description,cssClasses:Y.cssClasses,cssCompiledStyles:[],cssStyles:Y.cssStyles,id:q,dir:Y.dir,domId:vz(q,m),type:Y.type,isGroup:Y.type==="group",padding:8,rx:10,ry:10,look:G,labelType:"markdown"};if(N.shape===Tz)N.label="";if(z&&z.id!=="root")O.trace("Setting node ",q," to be child of its parent ",z.id),N.parentId=z.id;if(N.centerLabel=!0,J.note){let E={labelStyle:"",shape:xJ,label:J.note.text,labelType:"markdown",cssClasses:NJ,cssStyles:[],cssCompiledStyles:[],id:q+gJ+"-"+m,domId:vz(q,m,BJ),type:Y.type,isGroup:Y.type==="group",padding:h.flowchart?.padding,look:G,position:J.note.position},f=q+gz,V={labelStyle:"",shape:bJ,label:J.note.text,cssClasses:Y.cssClasses,cssStyles:[],id:q+gz,domId:vz(q,m,qJ),type:"group",isGroup:!0,padding:16,look:G,position:J.note.position};m++,V.id=f,E.parentId=f,e(Q,V,F),e(Q,E,F),e(Q,N,F);let u=q,S=E.id;if(J.note.position==="left of")u=E.id,S=q;j.push({id:u+"-"+S,start:u,end:S,arrowhead:"none",arrowTypeEnd:"",style:JJ,labelStyle:"",classes:hJ,arrowheadStyle:QJ,labelpos:WJ,labelType:XJ,thickness:ZJ,look:G})}else e(Q,N,F)}if(J.doc)O.trace("Adding nodes children "),IJ(J,J.doc,B,Q,j,!H,G,F)},"dataFetcher"),yJ=M(()=>{Fz.clear(),m=0},"reset"),A={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Sz=M(()=>new Map,"newClassesList"),Iz=M(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),Gz=M((z)=>JSON.parse(JSON.stringify(z)),"clone"),zQ=class{constructor(z){this.version=z,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Sz(),this.documents={root:Iz()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.funs=[],this.getAccTitle=mz,this.setAccTitle=pz,this.getAccDescription=$z,this.setAccDescription=lz,this.setDiagramTitle=rz,this.getDiagramTitle=dz,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this),this.bindFunctions=this.bindFunctions.bind(this)}static{M(this,"StateDB")}static{this.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3}}extract(z){this.clear(!0);for(let Q of Array.isArray(z)?z:z.doc)switch(Q.stmt){case o:this.addState(Q.id.trim(),Q.type,Q.doc,Q.description,Q.note);break;case uz:this.addRelation(Q.state1,Q.state2,Q.description);break;case vJ:this.addStyleClass(Q.id.trim(),Q.classes);break;case PJ:this.handleStyleDef(Q);break;case LJ:this.setCssClass(Q.id.trim(),Q.styleClass);break;case"click":this.addLink(Q.id,Q.url,Q.tooltip);break}let J=this.getStates(),B=g();yJ(),zz(void 0,this.getRootDocV2(),J,this.nodes,this.edges,!0,B.look,this.classes);for(let Q of this.nodes){if(!Array.isArray(Q.label))continue;if(Q.description=Q.label.slice(1),Q.isGroup&&Q.description.length>0)throw Error(`Group nodes can only have label. Remove the additional description for node [${Q.id}]`);Q.label=Q.label[0]}}handleStyleDef(z){let J=z.id.trim().split(","),B=z.styleClass.split(",");for(let Q of J){let j=this.getState(Q);if(!j){let H=Q.trim();this.addState(H),j=this.getState(H)}if(j)j.styles=B.map((H)=>H.replace(/;/g,"")?.trim())}}setRootDoc(z){if(O.info("Setting root doc",z),this.rootDoc=z,this.version===1)this.extract(z);else this.extract(this.getRootDocV2())}docTranslator(z,J,B){if(J.stmt===uz){this.docTranslator(z,J.state1,!0),this.docTranslator(z,J.state2,!1);return}if(J.stmt===o)if(J.id===A.START_NODE)J.id=z.id+(B?"_start":"_end"),J.start=B;else J.id=J.id.trim();if(J.stmt!==s&&J.stmt!==o||!J.doc)return;let Q=[],j=[];for(let H of J.doc)if(H.type===zJ){let G=Gz(H);G.doc=Gz(j),Q.push(G),j=[]}else j.push(H);if(Q.length>0&&j.length>0){let H={stmt:o,id:nz(),type:"divider",doc:Gz(j)};Q.push(Gz(H)),J.doc=Q}J.doc.forEach((H)=>this.docTranslator(J,H,!0))}getRootDocV2(){return this.docTranslator({id:s,stmt:s},{id:s,stmt:s,doc:this.rootDoc},!0),{id:s,doc:this.rootDoc}}addState(z,J=Jz,B=void 0,Q=void 0,j=void 0,H=void 0,G=void 0,F=void 0){let q=z?.trim();if(!this.currentDocument.states.has(q))O.info("Adding state ",q,Q),this.currentDocument.states.set(q,{stmt:o,id:q,descriptions:[],type:J,doc:B,note:j,classes:[],styles:[],textStyles:[]});else{let P=this.currentDocument.states.get(q);if(!P)throw Error(`State not found: ${q}`);if(!P.doc)P.doc=B;if(!P.type)P.type=J}if(Q)O.info("Setting state description",q,Q),(Array.isArray(Q)?Q:[Q]).forEach((w)=>this.addDescription(q,w.trim()));if(j){let P=this.currentDocument.states.get(q);if(!P)throw Error(`State not found: ${q}`);P.note=j,P.note.text=l.sanitizeText(P.note.text,g())}if(H)O.info("Setting state classes",q,H),(Array.isArray(H)?H:[H]).forEach((w)=>this.setCssClass(q,w.trim()));if(G)O.info("Setting state styles",q,G),(Array.isArray(G)?G:[G]).forEach((w)=>this.setStyle(q,w.trim()));if(F)O.info("Setting state styles",q,G),(Array.isArray(F)?F:[F]).forEach((w)=>this.setTextStyle(q,w.trim()))}clear(z){if(this.nodes=[],this.edges=[],this.funs=[this.setupToolTips.bind(this)],this.documents={root:Iz()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Sz(),!z)this.links=new Map,cz()}getState(z){return this.currentDocument.states.get(z)}getStates(){return this.currentDocument.states}logDocuments(){O.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(z,J,B){this.links.set(z,{url:J,tooltip:B}),O.warn("Adding link",z,J,B)}getLinks(){return this.links}startIdIfNeeded(z=""){if(z===A.START_NODE)return this.startEndCount++,`${A.START_TYPE}${this.startEndCount}`;return z}startTypeIfNeeded(z="",J=Jz){return z===A.START_NODE?A.START_TYPE:J}endIdIfNeeded(z=""){if(z===A.END_NODE)return this.startEndCount++,`${A.END_TYPE}${this.startEndCount}`;return z}endTypeIfNeeded(z="",J=Jz){return z===A.END_NODE?A.END_TYPE:J}addRelationObjs(z,J,B=""){let Q=this.startIdIfNeeded(z.id.trim()),j=this.startTypeIfNeeded(z.id.trim(),z.type),H=this.startIdIfNeeded(J.id.trim()),G=this.startTypeIfNeeded(J.id.trim(),J.type);this.addState(Q,j,z.doc,z.description,z.note,z.classes,z.styles,z.textStyles),this.addState(H,G,J.doc,J.description,J.note,J.classes,J.styles,J.textStyles),this.currentDocument.relations.push({id1:Q,id2:H,relationTitle:l.sanitizeText(B,g())})}addRelation(z,J,B){if(typeof z==="object"&&typeof J==="object")this.addRelationObjs(z,J,B);else if(typeof z==="string"&&typeof J==="string"){let Q=this.startIdIfNeeded(z.trim()),j=this.startTypeIfNeeded(z),H=this.endIdIfNeeded(J.trim()),G=this.endTypeIfNeeded(J);this.addState(Q,j),this.addState(H,G),this.currentDocument.relations.push({id1:Q,id2:H,relationTitle:B?l.sanitizeText(B,g()):void 0})}}addDescription(z,J){let B=this.currentDocument.states.get(z),Q=J.startsWith(":")?J.replace(":","").trim():J;B?.descriptions?.push(l.sanitizeText(Q,g()))}cleanupLabel(z){return z.startsWith(":")?z.slice(2).trim():z.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(z,J=""){if(!this.classes.has(z))this.classes.set(z,{id:z,styles:[],textStyles:[]});let B=this.classes.get(z);if(J&&B)J.split(A.STYLECLASS_SEP).forEach((Q)=>{let j=Q.replace(/([^;]*);/,"$1").trim();if(RegExp(A.COLOR_KEYWORD).exec(Q)){let G=j.replace(A.FILL_KEYWORD,A.BG_FILL).replace(A.COLOR_KEYWORD,A.FILL_KEYWORD);B.textStyles.push(G)}B.styles.push(j)})}getClasses(){return this.classes}setupToolTips(z){let J=sz();Rz(z).select("svg").selectAll("g.node, g.rough-node").on("mouseover",(j)=>{let H=Rz(j.currentTarget),G=H.attr("title");if(G===null)return;let F=j.currentTarget?.getBoundingClientRect();J.transition().duration(200).style("opacity",".9"),J.style("left",window.scrollX+F.left+(F.right-F.left)/2+"px").style("top",window.scrollY+F.bottom+"px"),J.html(yz.sanitize(G)),H.classed("hover",!0)}).on("mouseout",(j)=>{J.transition().duration(500).style("opacity",0),Rz(j.currentTarget).classed("hover",!1)})}setCssClass(z,J){z.split(",").forEach((B)=>{let Q=this.getState(B);if(!Q){let j=B.trim();this.addState(j),Q=this.getState(j)}Q?.classes?.push(J)})}setStyle(z,J){this.getState(z)?.styles?.push(J)}setTextStyle(z,J){this.getState(z)?.textStyles?.push(J)}bindFunctions(z){this.funs.forEach((J)=>{J(z)})}getDirectionStatement(){return this.rootDoc.find((z)=>z.stmt===kz)}getDirection(){return this.getDirectionStatement()?.value??FJ}setDirection(z){let J=this.getDirectionStatement();if(J)J.value=z;else this.rootDoc.unshift({stmt:kz,value:z})}trimColon(z){return z.startsWith(":")?z.slice(1).trim():z.trim()}getData(){let z=g();return{nodes:this.nodes,edges:this.edges,other:{},config:z,direction:jJ(this.getRootDocV2())}}getConfig(){return g().state}},cJ=M((z)=>`
defs [id$="-barbEnd"] {
    fill: ${z.transitionColor};
    stroke: ${z.transitionColor};
  }
g.stateGroup text {
  fill: ${z.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${z.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${z.stateLabelColor};
}

g.stateGroup rect {
  fill: ${z.mainBkg};
  stroke: ${z.nodeBorder};
}

g.stateGroup line {
  stroke: ${z.lineColor};
  stroke-width: ${z.strokeWidth||1};
}

.transition {
  stroke: ${z.transitionColor};
  stroke-width: ${z.strokeWidth||1};
  fill: none;
}

.stateGroup .composit {
  fill: ${z.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${z.noteBorderColor};
  fill: ${z.noteBkgColor};

  text {
    fill: ${z.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${z.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${z.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${z.edgeLabelBackground};
  p {
    background-color: ${z.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${z.edgeLabelBackground};
    fill: ${z.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${z.transitionLabelColor||z.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${z.transitionLabelColor||z.tertiaryTextColor};
}

.stateLabel text {
  fill: ${z.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${z.specialStateColor};
  stroke: ${z.specialStateColor};
}

.node .fork-join {
  fill: ${z.specialStateColor};
  stroke: ${z.specialStateColor};
}

.node circle.state-end {
  fill: ${z.innerEndBackground};
  stroke: ${z.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${z.compositeBackground||z.background};
  // stroke: ${z.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${z.stateBkg||z.mainBkg};
  stroke: ${z.stateBorder||z.nodeBorder};
  stroke-width: ${z.strokeWidth||1}px;
}
.node polygon {
  fill: ${z.mainBkg};
  stroke: ${z.stateBorder||z.nodeBorder};;
  stroke-width: ${z.strokeWidth||1}px;
}
[id$="-barbEnd"] {
  fill: ${z.lineColor};
}

.statediagram-cluster rect {
  fill: ${z.compositeTitleBackground};
  stroke: ${z.stateBorder||z.nodeBorder};
  stroke-width: ${z.strokeWidth||1}px;
}

.cluster-label, .nodeLabel {
  color: ${z.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${z.stateBorder||z.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${z.compositeBackground||z.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${z.altBackground?z.altBackground:"#efefef"};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${z.altBackground?z.altBackground:"#efefef"};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${z.noteBkgColor};
  stroke: ${z.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${z.noteBkgColor};
  stroke: ${z.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${z.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${z.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${z.noteTextColor};
}

[id$="-dependencyStart"], [id$="-dependencyEnd"] {
  fill: ${z.lineColor};
  stroke: ${z.lineColor};
  stroke-width: ${z.strokeWidth||1};
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${z.textColor};
}

[data-look="neo"].statediagram-cluster rect {
  fill: ${z.mainBkg};
  stroke: ${z.useGradient?"url("+z.svgId+"-gradient)":z.stateBorder||z.nodeBorder};
  stroke-width: ${z.strokeWidth??1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${z.radius}px;
  ry: ${z.radius}px;
  filter: ${z.dropShadow?z.dropShadow.replace("url(#drop-shadow)",`url(${z.svgId}-drop-shadow)`):"none"}
}
`,"getStyles"),JQ=cJ;
export{sJ as h,oJ as i,zQ as j,JQ as k};
