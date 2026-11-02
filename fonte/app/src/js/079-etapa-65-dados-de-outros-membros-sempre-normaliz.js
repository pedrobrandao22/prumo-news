/* ---------- Etapa 65: dados de outros membros sempre normalizados ---------- */
function nfin(v,d,a,b){v=+v;if(!isFinite(v))v=d;return Math.max(a,Math.min(b,v))}
const strs=(v,n)=>typeof v==="string"?v.slice(0,n):typeof v==="number"&&isFinite(v)?String(v).slice(0,n):"";
const PUB_TIPOS_IT=["texto","enq","nt","men","perg","quiz","cont","slid","link","add"];
function pubLimpa(x){if(!x||typeof x!=="object")return;let es=x.estilo;if(es&&es.__ok)return;if(!es||typeof es!=="object"||Array.isArray(es))es={};
  const au=String(x.autor||"")+"/";
  es.itens=(Array.isArray(es.itens)?es.itens:[]).slice(0,12).map(e=>{if(!e||typeof e!=="object"||!PUB_TIPOS_IT.includes(e.t))return {t:"_",x:.5,y:.5,s:1,r:0};
    const o={t:e.t,x:nfin(e.x,.5,-.2,1.2),y:nfin(e.y,.5,-.2,1.2),s:nfin(e.s,1,.2,6),r:nfin(e.r,0,-3600,3600)};
    if(e.t==="texto"){o.tx=strs(e.tx,220);o.f=["classico","moderno","forte","maquina","neon"].includes(e.f)?e.f:"classico";o.cor=/^#[0-9a-f]{6}$/i.test(e.cor||"")?e.cor:"#ffffff";o.al=["c","e","d"].includes(e.al)?e.al:"c";o.fd=[0,1,2].includes(+e.fd)?+e.fd:0;o.tam=nfin(e.tam,1,.5,2.6);o.an=["digitar","surgir","pulsar","onda"].includes(e.an)?e.an:""}
    if(e.t==="enq"||e.t==="quiz"){o.q=strs(e.q,90);o.o=(Array.isArray(e.o)?e.o:[]).slice(0,4).map(v=>strs(v,30));if(o.o.length<2)o.o=["Sim","Não"];o.c=Math.floor(nfin(e.c,0,0,o.o.length-1))}
    if(["perg","add","slid","cont"].includes(e.t))o.q=strs(e.q,90);if(e.t==="cont")o.ate=nfin(e.ate,0,0,8.64e15);if(e.t==="slid")o.emo=strs(e.emo,8)||"😍";
    if(e.t==="link"){o.url=edUrlOk(strs(e.url,500));o.tit=strs(e.tit,30);if(!o.url)return {t:"_",x:.5,y:.5,s:1,r:0}}
    if(e.t==="nt")o.pid=strs(e.pid,200);if(e.t==="men")o.uid=strs(e.uid,60);if(e.t==="add")o.ref=strs(e.ref,80);if(e.t==="pub"){o.ref=/^[0-9a-f-]{36}$/i.test(String(e.ref||""))?String(e.ref):"";o.au=/^[0-9a-f-]{36}$/i.test(String(e.au||""))?String(e.au):""}return o});
  es.fundo=Math.floor(nfin(es.fundo,0,0,99));es.caixa=!!es.caixa;["ini","fim"].forEach(k=>{if(es[k]!=null)es[k]=nfin(es[k],0,0,600)});if(es.dur!=null)es.dur=nfin(es.dur,8,1,600);
  if(es.video!=null&&!(typeof es.video==="string"&&es.video.startsWith(au)))delete es.video;es.ov=es.ov?1:0;es.mudo=!!es.mudo;es.reel=!!es.reel;
  es.marcados=(Array.isArray(es.marcados)?es.marcados:[]).filter(v=>typeof v==="string").slice(0,20);
  es.tags=(Array.isArray(es.tags)?es.tags:[]).filter(t=>t&&typeof t.u==="string").slice(0,30).map(t=>({u:t.u,i:Math.floor(nfin(t.i,0,0,9)),x:nfin(t.x,.5,0,1),y:nfin(t.y,.5,0,1)}));
  es.alt=(Array.isArray(es.alt)?es.alt:[]).slice(0,10).map(v=>strs(v,200));es.local=strs(es.local,60);if(es.arv!=null)es.arv=nfin(es.arv,.8,.5,2);if(es.ar!=null)es.ar=["4:5","1:1","orig"].includes(es.ar)?es.ar:"4:5";
  es.semCom=!!es.semCom;es.semCurt=!!es.semCurt;
  try{Object.defineProperty(es,"__ok",{value:true,enumerable:false})}catch(e){}x.estilo=es;
  x.fotos=(Array.isArray(x.fotos)?x.fotos:[]).filter(p=>typeof p==="string"&&p.startsWith(au)&&!/\.\.|[?#]/.test(p)).slice(0,10);x.texto=strs(x.texto,2200);
  if(x.publico!=null&&x.publico!=="proximos")x.publico="amigos";if(x.pid!=null)x.pid=strs(x.pid,200)||null;if(x.snap!=null&&(typeof x.snap!=="object"||Array.isArray(x.snap)))x.snap=null}
{const _ui65=usItensHTML;usItensHTML=function(x){try{pubLimpa(x)}catch(e){return ""}return _ui65.apply(this,arguments)}}
{const _pp65=pubPostHTML;pubPostHTML=function(x){try{pubLimpa(x)}catch(e){return ""}return _pp65.apply(this,arguments)}}
{const _du65=igDrawUser;igDrawUser=function(){try{const x=ST.itens&&ST.itens[ST.i];if(x)pubLimpa(x)}catch(e){}return _du65.apply(this,arguments)}}
pubFundo=function(i){const n=PUB_FUNDOS.length,k=((Math.floor(+i)||0)%n+n)%n,f=PUB_FUNDOS[k];return `linear-gradient(160deg,${f[0]},${f[1]})`};
{const _mc65=montarCmts;montarCmts=function(){const by=_mc65.apply(this,arguments);try{Object.values(by).forEach(l=>Array.isArray(l)&&l.forEach(c=>{if(c&&typeof c.texto!=="string")c.texto=strs(c.texto,2000)}))}catch(e){}return by}}

