import{rc as c0}from"./chunk-c05sh8f5.js";import{wc as fu}from"./chunk-n3hkxdz7.js";import{id as N0,jd as H0,od as D0,pd as B0,qd as X0,rd as O0,sd as w0,td as C0,ud as E0,vd as Qf}from"./chunk-tk2w7j1m.js";import{$d as _0,Cd as G0,Dd as zf,Fd as v0,Gd as A0,Hd as P0,Id as j0,Jd as Bf,Kd as F0,Qd as I0,Rd as cf,Sd as yf,Td as rf,Ud as lf,Vd as nf,Wd as b0,Xd as V0,Yd as S0,Zd as x0,_d as g0,ae as T0,be as $f,ce as kf,de as p0}from"./chunk-8prwmdh2.js";import{Ce as U}from"./chunk-6d66f5kk.js";import{Ee as Jf,Fe as Cf}from"./chunk-myhf6vrs.js";var q0=Cf((If,bf)=>{(function(f,u){typeof If=="object"&&typeof bf<"u"?bf.exports=u():typeof define=="function"&&define.amd?define(u):(f=typeof globalThis<"u"?globalThis:f||self).dayjs_plugin_isoWeek=u()})(If,function(){var f="day";return function(u,Z,M){var z=function(C){return C.add(4-C.isoWeekday(),f)},L=Z.prototype;L.isoWeekYear=function(){return z(this).year()},L.isoWeek=function(C){if(!this.$utils().u(C))return this.add(7*(C-this.isoWeek()),f);var v,y,b,l,r=z(this),n=(v=this.isoWeekYear(),y=this.$u,b=(y?M.utc:M)().year(v).startOf("year"),l=4-b.isoWeekday(),b.isoWeekday()>4&&(l+=7),b.add(l,f));return r.diff(n,"week")+1},L.isoWeekday=function(C){return this.$utils().u(C)?this.day()||7:this.day(this.day()%7?C:C-7)};var N=L.startOf;L.startOf=function(C,v){var y=this.$utils(),b=!!y.u(v)||v;return y.p(C)==="isoweek"?b?this.date(this.date()-(this.isoWeekday()-1)).startOf("day"):this.date(this.date()-1-(this.isoWeekday()-1)+7).endOf("day"):N.bind(this)(C,v)}}})});var U0=Cf((Vf,Sf)=>{(function(f,u){typeof Vf=="object"&&typeof Sf<"u"?Sf.exports=u():typeof define=="function"&&define.amd?define(u):(f=typeof globalThis<"u"?globalThis:f||self).dayjs_plugin_customParseFormat=u()})(Vf,function(){var f={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY h:mm A",LLLL:"dddd, MMMM D, YYYY h:mm A"},u=/(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|Q|YYYY|YY?|ww?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g,Z=/\d/,M=/\d\d/,z=/\d\d?/,L=/\d*[^-_:/,()\s\d]+/,N={},C=function(w){return(w=+w)+(w>68?1900:2000)},v=function(w){return function(E){this[w]=+E}},y=[/[+-]\d\d:?(\d\d)?|Z/,function(w){(this.zone||(this.zone={})).offset=function(E){if(!E)return 0;if(E==="Z")return 0;var O=E.match(/([+-]|\d\d)/g),x=60*O[1]+(+O[2]||0);return x===0?0:O[0]==="+"?-x:x}(w)}],b=function(w){var E=N[w];return E&&(E.indexOf?E:E.s.concat(E.f))},l=function(w,E){var O,x=N.meridiem;if(x){for(var o=1;o<=24;o+=1)if(w.indexOf(x(o,0,E))>-1){O=o>12;break}}else O=w===(E?"pm":"PM");return O},r={A:[L,function(w){this.afternoon=l(w,!1)}],a:[L,function(w){this.afternoon=l(w,!0)}],Q:[Z,function(w){this.month=3*(w-1)+1}],S:[Z,function(w){this.milliseconds=100*+w}],SS:[M,function(w){this.milliseconds=10*+w}],SSS:[/\d{3}/,function(w){this.milliseconds=+w}],s:[z,v("seconds")],ss:[z,v("seconds")],m:[z,v("minutes")],mm:[z,v("minutes")],H:[z,v("hours")],h:[z,v("hours")],HH:[z,v("hours")],hh:[z,v("hours")],D:[z,v("day")],DD:[M,v("day")],Do:[L,function(w){var E=N.ordinal,O=w.match(/\d+/);if(this.day=O[0],E)for(var x=1;x<=31;x+=1)E(x).replace(/\[|\]/g,"")===w&&(this.day=x)}],w:[z,v("week")],ww:[M,v("week")],M:[z,v("month")],MM:[M,v("month")],MMM:[L,function(w){var E=b("months"),O=(b("monthsShort")||E.map(function(x){return x.slice(0,3)})).indexOf(w)+1;if(O<1)throw Error();this.month=O%12||O}],MMMM:[L,function(w){var E=b("months").indexOf(w)+1;if(E<1)throw Error();this.month=E%12||E}],Y:[/[+-]?\d+/,v("year")],YY:[M,function(w){this.year=C(w)}],YYYY:[/\d{4}/,v("year")],Z:y,ZZ:y};function n(w){var E,O;E=w,O=N&&N.formats;for(var x=(w=E.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g,function(T,g,G){var D=G&&G.toUpperCase();return g||O[G]||f[G]||O[D].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g,function(B,X,Q){return X||Q.slice(1)})})).match(u),o=x.length,i=0;i<o;i+=1){var V=x[i],H=r[V],R=H&&H[0],I=H&&H[1];x[i]=I?{regex:R,parser:I}:V.replace(/^\[|\]$/g,"")}return function(T){for(var g={},G=0,D=0;G<o;G+=1){var B=x[G];if(typeof B=="string")D+=B.length;else{var{regex:X,parser:Q}=B,h=T.slice(D),W=X.exec(h)[0];Q.call(g,W),T=T.replace(W,"")}}return function(K){var P=K.afternoon;if(P!==void 0){var Y=K.hours;P?Y<12&&(K.hours+=12):Y===12&&(K.hours=0),delete K.afternoon}}(g),g}}return function(w,E,O){O.p.customParseFormat=!0,w&&w.parseTwoDigitYear&&(C=w.parseTwoDigitYear);var x=E.prototype,o=x.parse;x.parse=function(i){var{date:V,utc:H,args:R}=i;this.$u=H;var I=R[1];if(typeof I=="string"){var T=R[2]===!0,g=R[3]===!0,G=T||g,D=R[2];g&&(D=R[2]),N=this.$locale(),!T&&D&&(N=O.Ls[D]),this.$d=function(h,W,K,P){try{if(["x","X"].indexOf(W)>-1)return new Date((W==="X"?1000:1)*h);var Y=n(W)(h),j=Y.year,q=Y.month,$=Y.day,J=Y.hours,A=Y.minutes,F=Y.seconds,p=Y.milliseconds,c=Y.zone,S=Y.week,_=new Date,ff=$||(j||q?1:_.getDate()),uf=j||_.getFullYear(),Uf=0;j&&!q||(Uf=q>0?q-1:_.getMonth());var Kf,Wf=J||0,k=A||0,Zf=F||0,e=p||0;return c?new Date(Date.UTC(uf,Uf,ff,Wf,k,Zf,e+60*c.offset*1000)):K?new Date(Date.UTC(uf,Uf,ff,Wf,k,Zf,e)):(Kf=new Date(uf,Uf,ff,Wf,k,Zf,e),S&&(Kf=P(Kf).week(S).toDate()),Kf)}catch(d){return new Date("")}}(V,I,H,O),this.init(),D&&D!==!0&&(this.$L=this.locale(D).$L),G&&V!=this.format(I)&&(this.$d=new Date("")),N={}}else if(I instanceof Array)for(var B=I.length,X=1;X<=B;X+=1){R[1]=I[X-1];var Q=O.apply(this,R);if(Q.isValid()){this.$d=Q.$d,this.$L=Q.$L,this.init();break}X===B&&(this.$d=new Date(""))}else o.call(this,i)}}})});var K0=Cf((xf,gf)=>{(function(f,u){typeof xf=="object"&&typeof gf<"u"?gf.exports=u():typeof define=="function"&&define.amd?define(u):(f=typeof globalThis<"u"?globalThis:f||self).dayjs_plugin_advancedFormat=u()})(xf,function(){return function(f,u){var Z=u.prototype,M=Z.format;Z.format=function(z){var L=this,N=this.$locale();if(!this.isValid())return M.bind(this)(z);var C=this.$utils(),v=(z||"YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g,function(y){switch(y){case"Q":return Math.ceil((L.$M+1)/3);case"Do":return N.ordinal(L.$D);case"gggg":return L.weekYear();case"GGGG":return L.isoWeekYear();case"wo":return N.ordinal(L.week(),"W");case"w":case"ww":return C.s(L.week(),y==="w"?1:2,"0");case"W":case"WW":return C.s(L.isoWeek(),y==="W"?1:2,"0");case"k":case"kk":return C.s(String(L.$H===0?24:L.$H),y==="k"?1:2,"0");case"X":return Math.floor(L.$d.getTime()/1000);case"x":return L.$d.getTime();case"z":return"["+L.offsetName()+"]";case"zzz":return"["+L.offsetName("long")+"]";default:return y}});return M.bind(this)(v)}}})});var W0=Cf((_f,Tf)=>{(function(f,u){typeof _f=="object"&&typeof Tf<"u"?Tf.exports=u():typeof define=="function"&&define.amd?define(u):(f=typeof globalThis<"u"?globalThis:f||self).dayjs_plugin_duration=u()})(_f,function(){var f,u,Z=1000,M=60000,z=3600000,L=86400000,N=31536000000,C=2628000000,v=/^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/,y=/\[([^\]]+)]|YYYY|YY|Y|M{1,2}|D{1,2}|H{1,2}|m{1,2}|s{1,2}|SSS/g,b={years:N,months:C,days:L,hours:z,minutes:M,seconds:Z,milliseconds:1,weeks:604800000},l=function(V){return V instanceof o},r=function(V,H,R){return new o(V,R,H.$l)},n=function(V){return u.p(V)+"s"},w=function(V){return V<0},E=function(V){return w(V)?Math.ceil(V):Math.floor(V)},O=function(V){return Math.abs(V)},x=function(V,H){return V?w(V)?{negative:!0,format:""+O(V)+H}:{negative:!1,format:""+V+H}:{negative:!1,format:""}},o=function(){function V(R,I,T){var g=this;if(this.$d={},this.$l=T,R===void 0&&(this.$ms=0,this.parseFromMilliseconds()),I)return r(R*b[n(I)],this);if(typeof R=="number")return this.$ms=R,this.parseFromMilliseconds(),this;if(typeof R=="object")return Object.keys(R).forEach(function(B){g.$d[n(B)]=R[B]}),this.calMilliseconds(),this;if(typeof R=="string"){var G=R.match(v);if(G){var D=G.slice(2).map(function(B){return B!=null?Number(B):0});return this.$d.years=D[0],this.$d.months=D[1],this.$d.weeks=D[2],this.$d.days=D[3],this.$d.hours=D[4],this.$d.minutes=D[5],this.$d.seconds=D[6],this.calMilliseconds(),this}}return this}var H=V.prototype;return H.calMilliseconds=function(){var R=this;this.$ms=Object.keys(this.$d).reduce(function(I,T){return I+(R.$d[T]||0)*b[T]},0)},H.parseFromMilliseconds=function(){var R=this.$ms;this.$d.years=E(R/N),R%=N,this.$d.months=E(R/C),R%=C,this.$d.days=E(R/L),R%=L,this.$d.hours=E(R/z),R%=z,this.$d.minutes=E(R/M),R%=M,this.$d.seconds=E(R/Z),R%=Z,this.$d.milliseconds=R},H.toISOString=function(){var R=x(this.$d.years,"Y"),I=x(this.$d.months,"M"),T=+this.$d.days||0;this.$d.weeks&&(T+=7*this.$d.weeks);var g=x(T,"D"),G=x(this.$d.hours,"H"),D=x(this.$d.minutes,"M"),B=this.$d.seconds||0;this.$d.milliseconds&&(B+=this.$d.milliseconds/1000,B=Math.round(1000*B)/1000);var X=x(B,"S"),Q=R.negative||I.negative||g.negative||G.negative||D.negative||X.negative,h=G.format||D.format||X.format?"T":"",W=(Q?"-":"")+"P"+R.format+I.format+g.format+h+G.format+D.format+X.format;return W==="P"||W==="-P"?"P0D":W},H.toJSON=function(){return this.toISOString()},H.format=function(R){var I=R||"YYYY-MM-DDTHH:mm:ss",T={Y:this.$d.years,YY:u.s(this.$d.years,2,"0"),YYYY:u.s(this.$d.years,4,"0"),M:this.$d.months,MM:u.s(this.$d.months,2,"0"),D:this.$d.days,DD:u.s(this.$d.days,2,"0"),H:this.$d.hours,HH:u.s(this.$d.hours,2,"0"),m:this.$d.minutes,mm:u.s(this.$d.minutes,2,"0"),s:this.$d.seconds,ss:u.s(this.$d.seconds,2,"0"),SSS:u.s(this.$d.milliseconds,3,"0")};return I.replace(y,function(g,G){return G||String(T[g])})},H.as=function(R){return this.$ms/b[n(R)]},H.get=function(R){var I=this.$ms,T=n(R);return T==="milliseconds"?I%=1000:I=T==="weeks"?E(I/b[T]):this.$d[T],I||0},H.add=function(R,I,T){var g;return g=I?R*b[n(I)]:l(R)?R.$ms:r(R,this).$ms,r(this.$ms+g*(T?-1:1),this)},H.subtract=function(R,I){return this.add(R,I,!0)},H.locale=function(R){var I=this.clone();return I.$l=R,I},H.clone=function(){return r(this.$ms,this)},H.humanize=function(R){return f().add(this.$ms,"ms").locale(this.$l).fromNow(!R)},H.valueOf=function(){return this.asMilliseconds()},H.milliseconds=function(){return this.get("milliseconds")},H.asMilliseconds=function(){return this.as("milliseconds")},H.seconds=function(){return this.get("seconds")},H.asSeconds=function(){return this.as("seconds")},H.minutes=function(){return this.get("minutes")},H.asMinutes=function(){return this.as("minutes")},H.hours=function(){return this.get("hours")},H.asHours=function(){return this.as("hours")},H.days=function(){return this.get("days")},H.asDays=function(){return this.as("days")},H.weeks=function(){return this.get("weeks")},H.asWeeks=function(){return this.as("weeks")},H.months=function(){return this.get("months")},H.asMonths=function(){return this.as("months")},H.years=function(){return this.get("years")},H.asYears=function(){return this.as("years")},V}(),i=function(V,H,R){return V.add(H.years()*R,"y").add(H.months()*R,"M").add(H.days()*R,"d").add(H.hours()*R,"h").add(H.minutes()*R,"m").add(H.seconds()*R,"s").add(H.milliseconds()*R,"ms")};return function(V,H,R){f=R,u=R().$utils(),R.duration=function(g,G){var D=R.locale();return r(g,{$l:D},G)},R.isDuration=l;var I=H.prototype.add,T=H.prototype.subtract;H.prototype.add=function(g,G){return l(g)?i(this,g,1):I.bind(this)(g,G)},H.prototype.subtract=function(g,G){return l(g)?i(this,g,-1):T.bind(this)(g,G)}}})});var y0=Jf(fu(),1),s=Jf(G0(),1),r0=Jf(q0(),1),l0=Jf(U0(),1),n0=Jf(K0(),1),Rf=Jf(G0(),1),a0=Jf(W0(),1);var mf=function(){var f=U(function(X,Q,h,W){for(h=h||{},W=X.length;W--;h[X[W]]=Q);return h},"o"),u=[6,8,10,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,28,29,30,31,33,35,36,38,40],Z=[1,26],M=[1,27],z=[1,28],L=[1,29],N=[1,30],C=[1,31],v=[1,32],y=[1,33],b=[1,34],l=[1,9],r=[1,10],n=[1,11],w=[1,12],E=[1,13],O=[1,14],x=[1,15],o=[1,16],i=[1,19],V=[1,20],H=[1,21],R=[1,22],I=[1,23],T=[1,25],g=[1,35],G={trace:U(function(){},"trace"),yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,weekend:19,weekend_friday:20,weekend_saturday:21,dateFormat:22,inclusiveEndDates:23,topAxis:24,axisFormat:25,tickInterval:26,excludes:27,includes:28,todayMarker:29,title:30,acc_title:31,acc_title_value:32,acc_descr:33,acc_descr_value:34,acc_descr_multiline_value:35,section:36,clickStatement:37,taskTxt:38,taskData:39,click:40,callbackname:41,callbackargs:42,href:43,clickStatementDebug:44,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",20:"weekend_friday",21:"weekend_saturday",22:"dateFormat",23:"inclusiveEndDates",24:"topAxis",25:"axisFormat",26:"tickInterval",27:"excludes",28:"includes",29:"todayMarker",30:"title",31:"acc_title",32:"acc_title_value",33:"acc_descr",34:"acc_descr_value",35:"acc_descr_multiline_value",36:"section",38:"taskTxt",39:"taskData",40:"click",41:"callbackname",42:"callbackargs",43:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[19,1],[19,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[37,2],[37,3],[37,3],[37,4],[37,3],[37,4],[37,2],[44,2],[44,3],[44,3],[44,4],[44,3],[44,4],[44,2]],performAction:U(function(Q,h,W,K,P,Y,j){var q=Y.length-1;switch(P){case 1:return Y[q-1];case 2:this.$=[];break;case 3:Y[q-1].push(Y[q]),this.$=Y[q-1];break;case 4:case 5:this.$=Y[q];break;case 6:case 7:this.$=[];break;case 8:K.setWeekday("monday");break;case 9:K.setWeekday("tuesday");break;case 10:K.setWeekday("wednesday");break;case 11:K.setWeekday("thursday");break;case 12:K.setWeekday("friday");break;case 13:K.setWeekday("saturday");break;case 14:K.setWeekday("sunday");break;case 15:K.setWeekend("friday");break;case 16:K.setWeekend("saturday");break;case 17:K.setDateFormat(Y[q].substr(11)),this.$=Y[q].substr(11);break;case 18:K.enableInclusiveEndDates(),this.$=Y[q].substr(18);break;case 19:K.TopAxis(),this.$=Y[q].substr(8);break;case 20:K.setAxisFormat(Y[q].substr(11)),this.$=Y[q].substr(11);break;case 21:K.setTickInterval(Y[q].substr(13)),this.$=Y[q].substr(13);break;case 22:K.setExcludes(Y[q].substr(9)),this.$=Y[q].substr(9);break;case 23:K.setIncludes(Y[q].substr(9)),this.$=Y[q].substr(9);break;case 24:K.setTodayMarker(Y[q].substr(12)),this.$=Y[q].substr(12);break;case 27:K.setDiagramTitle(Y[q].substr(6)),this.$=Y[q].substr(6);break;case 28:this.$=Y[q].trim(),K.setAccTitle(this.$);break;case 29:case 30:this.$=Y[q].trim(),K.setAccDescription(this.$);break;case 31:K.addSection(Y[q].substr(8)),this.$=Y[q].substr(8);break;case 33:K.addTask(Y[q-1],Y[q]),this.$="task";break;case 34:this.$=Y[q-1],K.setClickEvent(Y[q-1],Y[q],null);break;case 35:this.$=Y[q-2],K.setClickEvent(Y[q-2],Y[q-1],Y[q]);break;case 36:this.$=Y[q-2],K.setClickEvent(Y[q-2],Y[q-1],null),K.setLink(Y[q-2],Y[q]);break;case 37:this.$=Y[q-3],K.setClickEvent(Y[q-3],Y[q-2],Y[q-1]),K.setLink(Y[q-3],Y[q]);break;case 38:this.$=Y[q-2],K.setClickEvent(Y[q-2],Y[q],null),K.setLink(Y[q-2],Y[q-1]);break;case 39:this.$=Y[q-3],K.setClickEvent(Y[q-3],Y[q-1],Y[q]),K.setLink(Y[q-3],Y[q-2]);break;case 40:this.$=Y[q-1],K.setLink(Y[q-1],Y[q]);break;case 41:case 47:this.$=Y[q-1]+" "+Y[q];break;case 42:case 43:case 45:this.$=Y[q-2]+" "+Y[q-1]+" "+Y[q];break;case 44:case 46:this.$=Y[q-3]+" "+Y[q-2]+" "+Y[q-1]+" "+Y[q];break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},f(u,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:Z,13:M,14:z,15:L,16:N,17:C,18:v,19:18,20:y,21:b,22:l,23:r,24:n,25:w,26:E,27:O,28:x,29:o,30:i,31:V,33:H,35:R,36:I,37:24,38:T,40:g},f(u,[2,7],{1:[2,1]}),f(u,[2,3]),{9:36,11:17,12:Z,13:M,14:z,15:L,16:N,17:C,18:v,19:18,20:y,21:b,22:l,23:r,24:n,25:w,26:E,27:O,28:x,29:o,30:i,31:V,33:H,35:R,36:I,37:24,38:T,40:g},f(u,[2,5]),f(u,[2,6]),f(u,[2,17]),f(u,[2,18]),f(u,[2,19]),f(u,[2,20]),f(u,[2,21]),f(u,[2,22]),f(u,[2,23]),f(u,[2,24]),f(u,[2,25]),f(u,[2,26]),f(u,[2,27]),{32:[1,37]},{34:[1,38]},f(u,[2,30]),f(u,[2,31]),f(u,[2,32]),{39:[1,39]},f(u,[2,8]),f(u,[2,9]),f(u,[2,10]),f(u,[2,11]),f(u,[2,12]),f(u,[2,13]),f(u,[2,14]),f(u,[2,15]),f(u,[2,16]),{41:[1,40],43:[1,41]},f(u,[2,4]),f(u,[2,28]),f(u,[2,29]),f(u,[2,33]),f(u,[2,34],{42:[1,42],43:[1,43]}),f(u,[2,40],{41:[1,44]}),f(u,[2,35],{43:[1,45]}),f(u,[2,36]),f(u,[2,38],{42:[1,46]}),f(u,[2,37]),f(u,[2,39])],defaultActions:{},parseError:U(function(Q,h){if(h.recoverable)this.trace(Q);else{var W=Error(Q);throw W.hash=h,W}},"parseError"),parse:U(function(Q){var h=this,W=[0],K=[],P=[null],Y=[],j=this.table,q="",$=0,J=0,A=0,F=2,p=1,c=Y.slice.call(arguments,1),S=Object.create(this.lexer),_={yy:{}};for(var ff in this.yy)if(Object.prototype.hasOwnProperty.call(this.yy,ff))_.yy[ff]=this.yy[ff];if(S.setInput(Q,_.yy),_.yy.lexer=S,_.yy.parser=this,typeof S.yylloc>"u")S.yylloc={};var uf=S.yylloc;Y.push(uf);var Uf=S.options&&S.options.ranges;if(typeof _.yy.parseError==="function")this.parseError=_.yy.parseError;else this.parseError=Object.getPrototypeOf(this).parseError;function Kf(t){W.length=W.length-2*t,P.length=P.length-t,Y.length=Y.length-t}U(Kf,"popStack");function Wf(){var t=K.pop()||S.lex()||p;if(typeof t!=="number"){if(t instanceof Array)K=t,t=K.pop();t=h.symbols_[t]||t}return t}U(Wf,"lex");var k,Zf,e,d,ku,jf,Lf={},Of,Yf,J0,wf;while(!0){if(e=W[W.length-1],this.defaultActions[e])d=this.defaultActions[e];else{if(k===null||typeof k>"u")k=Wf();d=j[e]&&j[e][k]}if(typeof d>"u"||!d.length||!d[0]){var Ff="";wf=[];for(Of in j[e])if(this.terminals_[Of]&&Of>F)wf.push("'"+this.terminals_[Of]+"'");if(S.showPosition)Ff="Parse error on line "+($+1)+`:
`+S.showPosition()+`
Expecting `+wf.join(", ")+", got '"+(this.terminals_[k]||k)+"'";else Ff="Parse error on line "+($+1)+": Unexpected "+(k==p?"end of input":"'"+(this.terminals_[k]||k)+"'");this.parseError(Ff,{text:S.match,token:this.terminals_[k]||k,line:S.yylineno,loc:uf,expected:wf})}if(d[0]instanceof Array&&d.length>1)throw Error("Parse Error: multiple actions possible at state: "+e+", token: "+k);switch(d[0]){case 1:if(W.push(k),P.push(S.yytext),Y.push(S.yylloc),W.push(d[1]),k=null,!Zf){if(J=S.yyleng,q=S.yytext,$=S.yylineno,uf=S.yylloc,A>0)A--}else k=Zf,Zf=null;break;case 2:if(Yf=this.productions_[d[1]][1],Lf.$=P[P.length-Yf],Lf._$={first_line:Y[Y.length-(Yf||1)].first_line,last_line:Y[Y.length-1].last_line,first_column:Y[Y.length-(Yf||1)].first_column,last_column:Y[Y.length-1].last_column},Uf)Lf._$.range=[Y[Y.length-(Yf||1)].range[0],Y[Y.length-1].range[1]];if(jf=this.performAction.apply(Lf,[q,J,$,_.yy,d[1],P,Y].concat(c)),typeof jf<"u")return jf;if(Yf)W=W.slice(0,-1*Yf*2),P=P.slice(0,-1*Yf),Y=Y.slice(0,-1*Yf);W.push(this.productions_[d[1]][0]),P.push(Lf.$),Y.push(Lf._$),J0=j[W[W.length-2]][W[W.length-1]],W.push(J0);break;case 3:return!0}}return!0},"parse")},D=function(){var X={EOF:1,parseError:U(function(h,W){if(this.yy.parser)this.yy.parser.parseError(h,W);else throw Error(h)},"parseError"),setInput:U(function(Q,h){if(this.yy=h||this.yy||{},this._input=Q,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges)this.yylloc.range=[0,0];return this.offset=0,this},"setInput"),input:U(function(){var Q=this._input[0];this.yytext+=Q,this.yyleng++,this.offset++,this.match+=Q,this.matched+=Q;var h=Q.match(/(?:\r\n?|\n).*/g);if(h)this.yylineno++,this.yylloc.last_line++;else this.yylloc.last_column++;if(this.options.ranges)this.yylloc.range[1]++;return this._input=this._input.slice(1),Q},"input"),unput:U(function(Q){var h=Q.length,W=Q.split(/(?:\r\n?|\n)/g);this._input=Q+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-h),this.offset-=h;var K=this.match.split(/(?:\r\n?|\n)/g);if(this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),W.length-1)this.yylineno-=W.length-1;var P=this.yylloc.range;if(this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:W?(W.length===K.length?this.yylloc.first_column:0)+K[K.length-W.length].length-W[0].length:this.yylloc.first_column-h},this.options.ranges)this.yylloc.range=[P[0],P[0]+this.yyleng-h];return this.yyleng=this.yytext.length,this},"unput"),more:U(function(){return this._more=!0,this},"more"),reject:U(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:U(function(Q){this.unput(this.match.slice(Q))},"less"),pastInput:U(function(){var Q=this.matched.substr(0,this.matched.length-this.match.length);return(Q.length>20?"...":"")+Q.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:U(function(){var Q=this.match;if(Q.length<20)Q+=this._input.substr(0,20-Q.length);return(Q.substr(0,20)+(Q.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:U(function(){var Q=this.pastInput(),h=Array(Q.length+1).join("-");return Q+this.upcomingInput()+`
`+h+"^"},"showPosition"),test_match:U(function(Q,h){var W,K,P;if(this.options.backtrack_lexer){if(P={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges)P.yylloc.range=this.yylloc.range.slice(0)}if(K=Q[0].match(/(?:\r\n?|\n).*/g),K)this.yylineno+=K.length;if(this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:K?K[K.length-1].length-K[K.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+Q[0].length},this.yytext+=Q[0],this.match+=Q[0],this.matches=Q,this.yyleng=this.yytext.length,this.options.ranges)this.yylloc.range=[this.offset,this.offset+=this.yyleng];if(this._more=!1,this._backtrack=!1,this._input=this._input.slice(Q[0].length),this.matched+=Q[0],W=this.performAction.call(this,this.yy,this,h,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input)this.done=!1;if(W)return W;else if(this._backtrack){for(var Y in P)this[Y]=P[Y];return!1}return!1},"test_match"),next:U(function(){if(this.done)return this.EOF;if(!this._input)this.done=!0;var Q,h,W,K;if(!this._more)this.yytext="",this.match="";var P=this._currentRules();for(var Y=0;Y<P.length;Y++)if(W=this._input.match(this.rules[P[Y]]),W&&(!h||W[0].length>h[0].length)){if(h=W,K=Y,this.options.backtrack_lexer)if(Q=this.test_match(W,P[Y]),Q!==!1)return Q;else if(this._backtrack){h=!1;continue}else return!1;else if(!this.options.flex)break}if(h){if(Q=this.test_match(h,P[K]),Q!==!1)return Q;return!1}if(this._input==="")return this.EOF;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:U(function(){var h=this.next();if(h)return h;else return this.lex()},"lex"),begin:U(function(h){this.conditionStack.push(h)},"begin"),popState:U(function(){var h=this.conditionStack.length-1;if(h>0)return this.conditionStack.pop();else return this.conditionStack[0]},"popState"),_currentRules:U(function(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1])return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;else return this.conditions.INITIAL.rules},"_currentRules"),topState:U(function(h){if(h=this.conditionStack.length-1-Math.abs(h||0),h>=0)return this.conditionStack[h];else return"INITIAL"},"topState"),pushState:U(function(h){this.begin(h)},"pushState"),stateStackSize:U(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:U(function(h,W,K,P){var Y=P;switch(K){case 0:return this.begin("open_directive"),"open_directive";break;case 1:return this.begin("acc_title"),31;break;case 2:return this.popState(),"acc_title_value";break;case 3:return this.begin("acc_descr"),33;break;case 4:return this.popState(),"acc_descr_value";break;case 5:this.begin("acc_descr_multiline");break;case 6:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:break;case 9:break;case 10:break;case 11:return 10;case 12:break;case 13:break;case 14:this.begin("href");break;case 15:this.popState();break;case 16:return 43;case 17:this.begin("callbackname");break;case 18:this.popState();break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 41;case 21:this.popState();break;case 22:return 42;case 23:this.begin("click");break;case 24:this.popState();break;case 25:return 40;case 26:return 4;case 27:return 22;case 28:return 23;case 29:return 24;case 30:return 25;case 31:return 26;case 32:return 28;case 33:return 27;case 34:return 29;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return 20;case 43:return 21;case 44:return"date";case 45:return 30;case 46:return"accDescription";case 47:return 36;case 48:return 38;case 49:return 39;case 50:return":";case 51:return 6;case 52:return"INVALID"}},"anonymous"),rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:weekend\s+friday\b)/i,/^(?:weekend\s+saturday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52],inclusive:!0}}};return X}();G.lexer=D;function B(){this.yy={}}return U(B,"Parser"),B.prototype=G,G.Parser=B,new B}();mf.parser=mf;var uu=mf;s.default.extend(r0.default);s.default.extend(l0.default);s.default.extend(n0.default);var L0={friday:5,saturday:6},a="",tf="",ef=void 0,af="",Nf=[],Hf=[],f0=new Map,u0=[],Af=[],Df="",Y0="",$0=["active","done","crit","milestone","vert"],M0=[],hf="",Xf=!1,z0=!1,Z0="sunday",Pf="saturday",of=0,Yu=U(function(){u0=[],Af=[],Df="",M0=[],Ef=0,sf=void 0,vf=void 0,m=[],a="",tf="",Y0="",ef=void 0,af="",Nf=[],Hf=[],Xf=!1,z0=!1,of=0,f0=new Map,hf="",D0(),Z0="sunday",Pf="saturday"},"clear"),Mu=U(function(f){hf=f},"setDiagramId"),zu=U(function(f){tf=f},"setAxisFormat"),Zu=U(function(){return tf},"getAxisFormat"),Qu=U(function(f){ef=f},"setTickInterval"),Ju=U(function(){return ef},"getTickInterval"),qu=U(function(f){af=f},"setTodayMarker"),Uu=U(function(){return af},"getTodayMarker"),Ku=U(function(f){a=f},"setDateFormat"),Wu=U(function(){Xf=!0},"enableInclusiveEndDates"),Lu=U(function(){return Xf},"endDatesAreInclusive"),hu=U(function(){z0=!0},"enableTopAxis"),Ru=U(function(){return z0},"topAxisEnabled"),Gu=U(function(f){Y0=f},"setDisplayMode"),Nu=U(function(){return Y0},"getDisplayMode"),Hu=U(function(){return a},"getDateFormat"),k0=U((f,u)=>{let Z=u.toLowerCase().split(/[\s,]+/).filter((M)=>M!=="");return[...new Set([...f,...Z])]},"mergeTokens"),Du=U(function(f){Nf=k0(Nf,f)},"setIncludes"),Bu=U(function(){return Nf},"getIncludes"),Xu=U(function(f){Hf=k0(Hf,f)},"setExcludes"),Ou=U(function(){return Hf},"getExcludes"),wu=U(function(){return f0},"getLinks"),Cu=U(function(f){Df=f,u0.push(f)},"addSection"),Eu=U(function(){return u0},"getSections"),vu=U(function(){let f=h0(),u=10,Z=0;while(!f&&Z<u)f=h0(),Z++;return Af=m,Af},"getTasks"),m0=U(function(f,u,Z,M){let z=f.format(u.trim()),L=f.format("YYYY-MM-DD");if(M.includes(z)||M.includes(L))return!1;if(Z.includes("weekends")&&(f.isoWeekday()===L0[Pf]||f.isoWeekday()===L0[Pf]+1))return!0;if(Z.includes(f.format("dddd").toLowerCase()))return!0;return Z.includes(z)||Z.includes(L)},"isInvalidDate"),Au=U(function(f){Z0=f},"setWeekday"),Pu=U(function(){return Z0},"getWeekday"),ju=U(function(f){Pf=f},"setWeekend"),o0=U(function(f,u,Z,M){if(!Z.length||f.manualEndTime)return;let z;if(f.startTime instanceof Date)z=s.default(f.startTime);else z=s.default(f.startTime,u,!0);z=z.add(1,"d");let L;if(f.endTime instanceof Date)L=s.default(f.endTime);else L=s.default(f.endTime,u,!0);let[N,C]=Fu(z,L,u,Z,M);f.endTime=N.toDate(),f.renderEndTime=C},"checkTaskDates"),Fu=U(function(f,u,Z,M,z){let L=!1,N=null,C=u.add(1e4,"d");while(f<=u){if(!L)N=u.toDate();if(L=m0(f,Z,M,z),L){if(u=u.add(1,"d"),u>C)throw Error("Failed to find a valid date that was not excluded by `excludes` after 10,000 iterations.")}f=f.add(1,"d")}return[u,N]},"fixTaskDates"),df=U(function(f,u,Z){if(Z=Z.trim(),U((C)=>{let v=C.trim();return v==="x"||v==="X"},"isTimestampFormat")(u)&&/^\d+$/.test(Z))return new Date(Number(Z));let L=/^after\s+(?<ids>[\d\w- ]+)/.exec(Z);if(L!==null){let C=null;for(let y of L.groups.ids.split(" ")){let b=qf(y);if(b!==void 0&&(!C||b.endTime>C.endTime))C=b}if(C)return C.endTime;let v=new Date;return v.setHours(0,0,0,0),v}let N=s.default(Z,u.trim(),!0);if(N.isValid())return N.toDate();else{zf.debug("Invalid date:"+Z),zf.debug("With date format:"+u.trim());let C=new Date(Z);if(C===void 0||isNaN(C.getTime())||C.getFullYear()<-1e4||C.getFullYear()>1e4)throw Error("Invalid date:"+Z);return C}},"getStartDate"),i0=U(function(f){let u=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(f.trim());if(u!==null)return[Number.parseFloat(u[1]),u[2]];return[NaN,"ms"]},"parseDuration"),d0=U(function(f,u,Z,M=!1){Z=Z.trim();let L=/^until\s+(?<ids>[\d\w- ]+)/.exec(Z);if(L!==null){let b=null;for(let r of L.groups.ids.split(" ")){let n=qf(r);if(n!==void 0&&(!b||n.startTime<b.startTime))b=n}if(b)return b.startTime;let l=new Date;return l.setHours(0,0,0,0),l}let N=s.default(Z,u.trim(),!0);if(N.isValid()){if(M)N=N.add(1,"d");return N.toDate()}let C=s.default(f),[v,y]=i0(Z);if(!Number.isNaN(v)){let b=C.add(v,y);if(b.isValid())C=b}return C.toDate()},"getEndDate"),Ef=0,Gf=U(function(f){if(f===void 0)return Ef=Ef+1,"task"+Ef;return f},"parseId"),Iu=U(function(f,u){let Z;if(u.substr(0,1)===":")Z=u.substr(1,u.length);else Z=u;let M=Z.split(","),z={};Q0(M,z,$0);for(let N=0;N<M.length;N++)M[N]=M[N].trim();let L="";switch(M.length){case 1:z.id=Gf(),z.startTime=f.endTime,L=M[0];break;case 2:z.id=Gf(),z.startTime=df(void 0,a,M[0]),L=M[1];break;case 3:z.id=Gf(M[0]),z.startTime=df(void 0,a,M[1]),L=M[2];break;default:}if(L)z.endTime=d0(z.startTime,a,L,Xf),z.manualEndTime=s.default(L,"YYYY-MM-DD",!0).isValid(),o0(z,a,Hf,Nf);return z},"compileData"),bu=U(function(f,u){let Z;if(u.substr(0,1)===":")Z=u.substr(1,u.length);else Z=u;let M=Z.split(","),z={};Q0(M,z,$0);for(let L=0;L<M.length;L++)M[L]=M[L].trim();switch(M.length){case 1:z.id=Gf(),z.startTime={type:"prevTaskEnd",id:f},z.endTime={data:M[0]};break;case 2:z.id=Gf(),z.startTime={type:"getStartDate",startData:M[0]},z.endTime={data:M[1]};break;case 3:z.id=Gf(M[0]),z.startTime={type:"getStartDate",startData:M[1]},z.endTime={data:M[2]};break;default:}return z},"parseData"),sf,vf,m=[],s0={},Vu=U(function(f,u){let Z={section:Df,type:Df,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:u},task:f,classes:[]},M=bu(vf,u);if(Z.raw.startTime=M.startTime,Z.raw.endTime=M.endTime,Z.id=M.id,Z.prevTaskId=vf,Z.active=M.active,Z.done=M.done,Z.crit=M.crit,Z.milestone=M.milestone,Z.vert=M.vert,Z.vert)Z.order=-1;else Z.order=of,of++;let z=m.push(Z);vf=Z.id,s0[Z.id]=z-1},"addTask"),qf=U(function(f){let u=s0[f];return m[u]},"findTaskById"),Su=U(function(f,u){let Z={section:Df,type:Df,description:f,task:f,classes:[]},M=Iu(sf,u);Z.startTime=M.startTime,Z.endTime=M.endTime,Z.id=M.id,Z.active=M.active,Z.done=M.done,Z.crit=M.crit,Z.milestone=M.milestone,Z.vert=M.vert,sf=Z,Af.push(Z)},"addTaskOrg"),h0=U(function(){let f=U(function(Z){let M=m[Z],z="";switch(m[Z].raw.startTime.type){case"prevTaskEnd":{let L=qf(M.prevTaskId);M.startTime=L.endTime;break}case"getStartDate":if(z=df(void 0,a,m[Z].raw.startTime.startData),z)m[Z].startTime=z;break}if(m[Z].startTime){if(m[Z].endTime=d0(m[Z].startTime,a,m[Z].raw.endTime.data,Xf),m[Z].endTime)m[Z].processed=!0,m[Z].manualEndTime=s.default(m[Z].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),o0(m[Z],a,Hf,Nf)}return m[Z].processed},"compileTask"),u=!0;for(let[Z,M]of m.entries())f(Z),u=u&&M.processed;return u},"compileTasks"),xu=U(function(f,u){let Z=u;if(Qf().securityLevel!=="loose")Z=y0.sanitizeUrl(u);f.split(",").forEach(function(M){if(qf(M)!==void 0)e0(M,()=>{window.open(Z,"_self")}),f0.set(M,Z)}),t0(f,"clickable")},"setLink"),t0=U(function(f,u){f.split(",").forEach(function(Z){let M=qf(Z);if(M!==void 0)M.classes.push(u)})},"setClass"),gu=U(function(f,u,Z){if(Qf().securityLevel!=="loose")return;if(u===void 0)return;let M=[];if(typeof Z==="string"){M=Z.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let L=0;L<M.length;L++){let N=M[L].trim();if(N.startsWith('"')&&N.endsWith('"'))N=N.substr(1,N.length-2);M[L]=N}}if(M.length===0)M.push(f);if(qf(f)!==void 0)e0(f,()=>{c0.runFunc(u,...M)})},"setClickFun"),e0=U(function(f,u){M0.push(function(){let Z=hf?`${hf}-${f}`:f,M=document.querySelector(`[id="${Z}"]`);if(M!==null)M.addEventListener("click",function(){u()})},function(){let Z=hf?`${hf}-${f}`:f,M=document.querySelector(`[id="${Z}-text"]`);if(M!==null)M.addEventListener("click",function(){u()})})},"pushFun"),_u=U(function(f,u,Z){f.split(",").forEach(function(M){gu(M,u,Z)}),t0(f,"clickable")},"setClickEvent"),Tu=U(function(f){M0.forEach(function(u){u(f)})},"bindFunctions"),pu={getConfig:U(()=>Qf().gantt,"getConfig"),clear:Yu,setDateFormat:Ku,getDateFormat:Hu,enableInclusiveEndDates:Wu,endDatesAreInclusive:Lu,enableTopAxis:hu,topAxisEnabled:Ru,setAxisFormat:zu,getAxisFormat:Zu,setTickInterval:Qu,getTickInterval:Ju,setTodayMarker:qu,getTodayMarker:Uu,setAccTitle:B0,getAccTitle:X0,setDiagramTitle:C0,getDiagramTitle:E0,setDiagramId:Mu,setDisplayMode:Gu,getDisplayMode:Nu,setAccDescription:O0,getAccDescription:w0,addSection:Cu,getSections:Eu,getTasks:vu,addTask:Vu,findTaskById:qf,addTaskOrg:Su,setIncludes:Du,getIncludes:Bu,setExcludes:Xu,getExcludes:Ou,setClickEvent:_u,setLink:xu,getLinks:wu,bindFunctions:Tu,parseDuration:i0,isInvalidDate:m0,setWeekday:Au,getWeekday:Pu,setWeekend:ju};function Q0(f,u,Z){let M=!0;while(M)M=!1,Z.forEach(function(z){let L="^\\s*"+z+"\\s*$",N=new RegExp(L);if(f[0].match(N))u[z]=!0,f.shift(1),M=!0})}U(Q0,"getTaskTags");Rf.default.extend(a0.default);var cu=U(function(){zf.debug("Something is calling, setConf, remove the call")},"setConf"),R0={monday:V0,tuesday:S0,wednesday:x0,thursday:g0,friday:_0,saturday:T0,sunday:b0},yu=U((f,u)=>{let Z=[...f].map(()=>-1/0),M=[...f].sort((L,N)=>L.startTime-N.startTime||L.order-N.order),z=0;for(let L of M)for(let N=0;N<Z.length;N++)if(L.startTime>=Z[N]){if(Z[N]=L.endTime,L.order=N+u,N>z)z=N;break}return z},"getMaxIntersections"),Mf,pf=1e4,ru=U(function(f,u,Z,M){let z=Qf().gantt;M.db.setDiagramId(u);let L=Qf().securityLevel,N;if(L==="sandbox")N=Bf("#i"+u);let C=L==="sandbox"?Bf(N.nodes()[0].contentDocument.body):Bf("body"),v=L==="sandbox"?N.nodes()[0].contentDocument:document,y=v.getElementById(u);if(Mf=y.parentElement.offsetWidth,Mf===void 0)Mf=1200;if(z.useWidth!==void 0)Mf=z.useWidth;let b=M.db.getTasks(),l=b.filter((G)=>!G.vert),r=[];for(let G of l)r.push(G.type);r=g(r);let n={},w=2*z.topPadding;if(M.db.getDisplayMode()==="compact"||z.displayMode==="compact"){let G={};for(let B of l)if(G[B.section]===void 0)G[B.section]=[B];else G[B.section].push(B);let D=0;for(let B of Object.keys(G)){let X=yu(G[B],D)+1;D+=X,w+=X*(z.barHeight+z.barGap),n[B]=X}}else{w+=l.length*(z.barHeight+z.barGap);for(let G of r)n[G]=l.filter((D)=>D.type===G).length}y.setAttribute("viewBox","0 0 "+Mf+" "+w);let E=C.select(`[id="${u}"]`),O=p0().domain([A0(b,function(G){return G.startTime}),v0(b,function(G){return G.endTime})]).rangeRound([0,Mf-z.leftPadding-z.rightPadding]);function x(G,D){let B=G.startTime,X=D.startTime,Q=0;if(B>X)Q=1;else if(B<X)Q=-1;return Q}U(x,"taskCompare"),b.sort(x),o(b,Mf,w),H0(E,w,Mf,z.useMaxWidth),E.append("text").text(M.db.getDiagramTitle()).attr("x",Mf/2).attr("y",z.titleTopMargin).attr("class","titleText");function o(G,D,B){let X=z.barHeight,Q=X+z.barGap,h=z.topPadding,W=z.leftPadding,K=I0().domain([0,r.length]).range(["#00B9FA","#F95002"]).interpolate(F0);V(Q,h,W,D,B,G,M.db.getExcludes(),M.db.getIncludes()),R(W,h,D,B),i(G,Q,h,W,X,K,D,B),I(Q,h,W,X,K),T(W,h,D,B)}U(o,"makeGantt");function i(G,D,B,X,Q,h,W){G.sort((J,A)=>J.vert===A.vert?0:J.vert?1:-1);let K=G.filter((J)=>!J.vert),Y=[...new Set(K.map((J)=>J.order))].map((J)=>K.find((A)=>A.order===J));E.append("g").selectAll("rect").data(Y).enter().append("rect").attr("x",0).attr("y",function(J,A){return A=J.order,A*D+B-2}).attr("width",function(){return W-z.rightPadding/2}).attr("height",D).attr("class",function(J){for(let[A,F]of r.entries())if(J.type===F)return"section section"+A%z.numberSectionStyles;return"section section0"}).enter();let j=E.append("g").selectAll("rect").data(G).enter(),q=M.db.getLinks();if(j.append("rect").attr("id",function(J){return u+"-"+J.id}).attr("rx",3).attr("ry",3).attr("x",function(J){if(J.milestone)return O(J.startTime)+X+0.5*(O(J.endTime)-O(J.startTime))-0.5*Q;return O(J.startTime)+X}).attr("y",function(J,A){if(A=J.order,J.vert)return z.gridLineStartPadding;return A*D+B}).attr("width",function(J){if(J.milestone)return Q;if(J.vert)return 0.08*Q;return O(J.renderEndTime||J.endTime)-O(J.startTime)}).attr("height",function(J){if(J.vert)return K.length*(z.barHeight+z.barGap)+z.barHeight*2;return Q}).attr("transform-origin",function(J,A){return A=J.order,(O(J.startTime)+X+0.5*(O(J.endTime)-O(J.startTime))).toString()+"px "+(A*D+B+0.5*Q).toString()+"px"}).attr("class",function(J){let F="";if(J.classes.length>0)F=J.classes.join(" ");let p=0;for(let[S,_]of r.entries())if(J.type===_)p=S%z.numberSectionStyles;let c="";if(J.active)if(J.crit)c+=" activeCrit";else c=" active";else if(J.done)if(J.crit)c=" doneCrit";else c=" done";else if(J.crit)c+=" crit";if(c.length===0)c=" task";if(J.milestone)c=" milestone "+c;if(J.vert)c=" vert "+c;return c+=p,c+=" "+F,"task"+c}),j.append("text").attr("id",function(J){return u+"-"+J.id+"-text"}).text(function(J){return J.task}).attr("font-size",z.fontSize).attr("x",function(J){let A=O(J.startTime),F=O(J.renderEndTime||J.endTime);if(J.milestone)A+=0.5*(O(J.endTime)-O(J.startTime))-0.5*Q,F=A+Q;if(J.vert)return O(J.startTime)+X;let p=this.getBBox().width;if(p>F-A)if(F+p+1.5*z.leftPadding>W)return A+X-5;else return F+X+5;else return(F-A)/2+A+X}).attr("y",function(J,A){if(J.vert)return z.gridLineStartPadding+K.length*(z.barHeight+z.barGap)+60;return A=J.order,A*D+z.barHeight/2+(z.fontSize/2-2)+B}).attr("text-height",Q).attr("class",function(J){let A=O(J.startTime),F=O(J.endTime);if(J.milestone)F=A+Q;let p=this.getBBox().width,c="";if(J.classes.length>0)c=J.classes.join(" ");let S=0;for(let[ff,uf]of r.entries())if(J.type===uf)S=ff%z.numberSectionStyles;let _="";if(J.active)if(J.crit)_="activeCritText"+S;else _="activeText"+S;if(J.done)if(J.crit)_=_+" doneCritText"+S;else _=_+" doneText"+S;else if(J.crit)_=_+" critText"+S;if(J.milestone)_+=" milestoneText";if(J.vert)_+=" vertText";if(p>F-A)if(F+p+1.5*z.leftPadding>W)return c+" taskTextOutsideLeft taskTextOutside"+S+" "+_;else return c+" taskTextOutsideRight taskTextOutside"+S+" "+_+" width-"+p;else return c+" taskText taskText"+S+" "+_+" width-"+p}),Qf().securityLevel==="sandbox"){let J;J=Bf("#i"+u);let A=J.nodes()[0].contentDocument;j.filter(function(F){return q.has(F.id)}).each(function(F){var p=A.querySelector("#"+CSS.escape(u+"-"+F.id)),c=A.querySelector("#"+CSS.escape(u+"-"+F.id+"-text"));let S=p.parentNode;var _=A.createElement("a");_.setAttribute("xlink:href",q.get(F.id)),_.setAttribute("target","_top"),S.appendChild(_),_.appendChild(p),_.appendChild(c)})}}U(i,"drawRects");function V(G,D,B,X,Q,h,W,K){if(W.length===0&&K.length===0)return;let P,Y;for(let{startTime:F,endTime:p}of h){if(P===void 0||F<P)P=F;if(Y===void 0||p>Y)Y=p}if(!P||!Y)return;if(Rf.default(Y).diff(Rf.default(P),"year")>5){zf.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return}let j=M.db.getDateFormat(),q=[],$=null,J=Rf.default(P);while(J.valueOf()<=Y){if(M.db.isInvalidDate(J,j,W,K))if(!$)$={start:J,end:J};else $.end=J;else if($)q.push($),$=null;J=J.add(1,"d")}E.append("g").selectAll("rect").data(q).enter().append("rect").attr("id",(F)=>u+"-exclude-"+F.start.format("YYYY-MM-DD")).attr("x",(F)=>O(F.start.startOf("day"))+B).attr("y",z.gridLineStartPadding).attr("width",(F)=>O(F.end.endOf("day"))-O(F.start.startOf("day"))).attr("height",Q-D-z.gridLineStartPadding).attr("transform-origin",function(F,p){return(O(F.start)+B+0.5*(O(F.end)-O(F.start))).toString()+"px "+(p*G+0.5*Q).toString()+"px"}).attr("class","exclude-range")}U(V,"drawExcludeDays");function H(G,D,B,X){if(B<=0||G>D)return 1/0;let Q=D-G,h=Rf.default.duration({[X??"day"]:B}).asMilliseconds();if(h<=0)return 1/0;return Math.ceil(Q/h)}U(H,"getEstimatedTickCount");function R(G,D,B,X){let Q=M.db.getDateFormat(),h=M.db.getAxisFormat(),W;if(h)W=h;else if(Q==="D")W="%d";else W=z.axisFormat??"%Y-%m-%d";let K=j0(O).tickSize(-X+D+z.gridLineStartPadding).tickFormat(kf(W)),Y=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(M.db.getTickInterval()||z.tickInterval);if(Y!==null){let j=parseInt(Y[1],10);if(isNaN(j)||j<=0)zf.warn(`Invalid tick interval value: "${Y[1]}". Skipping custom tick interval.`);else{let q=Y[2],$=M.db.getWeekday()||z.weekday,J=O.domain(),A=J[0],F=J[1],p=H(A,F,j,q);if(p>pf)zf.warn(`The tick interval "${j}${q}" would generate ${p} ticks, which exceeds the maximum allowed (${pf}). This may indicate an invalid date or time range. Skipping custom tick interval.`);else switch(q){case"millisecond":K.ticks(cf.every(j));break;case"second":K.ticks(yf.every(j));break;case"minute":K.ticks(rf.every(j));break;case"hour":K.ticks(lf.every(j));break;case"day":K.ticks(nf.every(j));break;case"week":K.ticks(R0[$].every(j));break;case"month":K.ticks($f.every(j));break}}}if(E.append("g").attr("class","grid").attr("transform","translate("+G+", "+(X-50)+")").call(K).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),M.db.topAxisEnabled()||z.topAxis){let j=P0(O).tickSize(-X+D+z.gridLineStartPadding).tickFormat(kf(W));if(Y!==null){let q=parseInt(Y[1],10);if(isNaN(q)||q<=0)zf.warn(`Invalid tick interval value: "${Y[1]}". Skipping custom tick interval.`);else{let $=Y[2],J=M.db.getWeekday()||z.weekday,A=O.domain(),F=A[0],p=A[1];if(H(F,p,q,$)<=pf)switch($){case"millisecond":j.ticks(cf.every(q));break;case"second":j.ticks(yf.every(q));break;case"minute":j.ticks(rf.every(q));break;case"hour":j.ticks(lf.every(q));break;case"day":j.ticks(nf.every(q));break;case"week":j.ticks(R0[J].every(q));break;case"month":j.ticks($f.every(q));break}}}E.append("g").attr("class","grid").attr("transform","translate("+G+", "+D+")").call(j).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10)}}U(R,"makeGrid");function I(G,D){let B=0,X=Object.keys(n).map((Q)=>[Q,n[Q]]);E.append("g").selectAll("text").data(X).enter().append(function(Q){let h=Q[0].split(N0.lineBreakRegex),W=-(h.length-1)/2,K=v.createElementNS("http://www.w3.org/2000/svg","text");K.setAttribute("dy",W+"em");for(let[P,Y]of h.entries()){let j=v.createElementNS("http://www.w3.org/2000/svg","tspan");if(j.setAttribute("alignment-baseline","central"),j.setAttribute("x","10"),P>0)j.setAttribute("dy","1em");j.textContent=Y,K.appendChild(j)}return K}).attr("x",10).attr("y",function(Q,h){if(h>0)for(let W=0;W<h;W++)return B+=X[h-1][1],Q[1]*G/2+B*G+D;else return Q[1]*G/2+D}).attr("font-size",z.sectionFontSize).attr("class",function(Q){for(let[h,W]of r.entries())if(Q[0]===W)return"sectionTitle sectionTitle"+h%z.numberSectionStyles;return"sectionTitle"})}U(I,"vertLabels");function T(G,D,B,X){let Q=M.db.getTodayMarker();if(Q==="off")return;let h=E.append("g").attr("class","today"),W=new Date,K=h.append("line");if(K.attr("x1",O(W)+G).attr("x2",O(W)+G).attr("y1",z.titleTopMargin).attr("y2",X-z.titleTopMargin).attr("class","today"),Q!=="")K.attr("style",Q.replace(/,/g,";"))}U(T,"drawToday");function g(G){let D={},B=[];for(let X=0,Q=G.length;X<Q;++X)if(!Object.prototype.hasOwnProperty.call(D,G[X]))D[G[X]]=!0,B.push(G[X]);return B}U(g,"checkUnique")},"draw"),lu={setConf:cu,draw:ru},nu=U((f)=>`
  .mermaid-main-font {
        font-family: ${f.fontFamily};
  }

  .exclude-range {
    fill: ${f.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${f.sectionBkgColor};
  }

  .section2 {
    fill: ${f.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${f.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${f.titleColor};
  }

  .sectionTitle1 {
    fill: ${f.titleColor};
  }

  .sectionTitle2 {
    fill: ${f.titleColor};
  }

  .sectionTitle3 {
    fill: ${f.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: ${f.fontFamily};
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${f.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${f.fontFamily};
    fill: ${f.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${f.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: ${f.fontFamily};
  }

  .taskTextOutsideRight {
    fill: ${f.taskTextDarkColor};
    text-anchor: start;
    font-family: ${f.fontFamily};
  }

  .taskTextOutsideLeft {
    fill: ${f.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${f.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${f.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${f.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${f.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${f.taskBkgColor};
    stroke: ${f.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${f.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${f.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${f.activeTaskBkgColor};
    stroke: ${f.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${f.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${f.doneTaskBorderColor};
    fill: ${f.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${f.taskTextDarkColor} !important;
  }

  /* Done task text displayed outside the bar sits against the diagram background,
     not against the done-task bar, so it must use the outside/contrast color. */
  .doneText0.taskTextOutsideLeft,
  .doneText0.taskTextOutsideRight,
  .doneText1.taskTextOutsideLeft,
  .doneText1.taskTextOutsideRight,
  .doneText2.taskTextOutsideLeft,
  .doneText2.taskTextOutsideRight,
  .doneText3.taskTextOutsideLeft,
  .doneText3.taskTextOutsideRight {
    fill: ${f.taskTextOutsideColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${f.critBorderColor};
    fill: ${f.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${f.critBorderColor};
    fill: ${f.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${f.critBorderColor};
    fill: ${f.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${f.taskTextDarkColor} !important;
  }

  /* Done-crit task text outside the bar — same reasoning as doneText above. */
  .doneCritText0.taskTextOutsideLeft,
  .doneCritText0.taskTextOutsideRight,
  .doneCritText1.taskTextOutsideLeft,
  .doneCritText1.taskTextOutsideRight,
  .doneCritText2.taskTextOutsideLeft,
  .doneCritText2.taskTextOutsideRight,
  .doneCritText3.taskTextOutsideLeft,
  .doneCritText3.taskTextOutsideRight {
    fill: ${f.taskTextOutsideColor} !important;
  }

  .vert {
    stroke: ${f.vertLineColor};
  }

  .vertText {
    font-size: 15px;
    text-anchor: middle;
    fill: ${f.vertLineColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${f.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${f.titleColor||f.textColor};
    font-family: ${f.fontFamily};
  }
`,"getStyles"),$u=nu,tu={parser:uu,db:pu,renderer:lu,styles:$u};export{tu as diagram};
