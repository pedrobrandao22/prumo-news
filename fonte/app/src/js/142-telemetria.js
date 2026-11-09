/* ===== 142 · Registro de erros e contagem de uso (anônimos, desligáveis) =====
   Para o administrador saber os erros reais que acontecem nos aparelhos e quais partes do app são usadas.
   - Erros: window "error", "unhandledrejection", erros do service worker (sw.js manda por mensagem) e chamadas ao Supabase
     que voltam com falha de verdade (5xx e 4xx que não são as detecções de versão do banco). Agrupados por assinatura
     (mensagem limpa + arquivo:linha:coluna + função), com contagem, versão, aparelho resumido, tela e as 5 últimas ações
     (rótulo genérico do botão: nome do atributo data-*, id ou classe; nunca o texto do botão nem o que foi digitado).
   - Uso: contagem por dia + evento + plataforma (as chamadas a uso() que o app já faz, as telas, publicar por tipo,
     comentar, curtir, reagir e o estado do dia: aparelho ativo, notificações ligadas, app instalado).
   - Envio: só depois da Capa; em lote a cada 30 s (erros) ou 5 min (só contagens) e ao sair (pagehide/oculto, fetch
     keepalive); no máximo 20 lotes por aparelho por dia; SEM a sessão da pessoa (só a chave publicável), para o próprio
     Supabase do Prumo. Sem a v15 (sql/publicacoes-v15.sql) o app detecta e não manda nada.
   - Privacidade: nada de uid, nome, e-mail, texto digitado, conteúdo de post/mensagem ou URL com dados; o id do aparelho é
     aleatório e é apagado quando a pessoa desliga em Ajustes do app › Privacidade (padrão: ligado).
   Painel: Administração › App (Erros e Uso), só para o papel admin. Nomes globais com o prefixo tl142 / TL142. */
var TL142={t0:Date.now(),custo:0,iniciado:false,v15:null,fila:{},nf:0,uso:{},acoes:[],tique:0,ultEnvio:0,enviando:false,ciclo:(window.__tl142Ciclo||30000),
  adm:{sub:"erros",erros:null,uso:null,dias:30,abre:null,limpo:false,limpeza:null,falta:false,det:{}},alertas:[],alT:0};
const TL142_LS={off:"prumo-tl142-off",ap:"prumo-tl142-ap",env:"prumo-tl142-env",uso:"prumo-tl142-uso",v15:"prumo-tl142-v15",dia:"prumo-tl142-dia"};
const TL142_FETCH=(typeof window.fetch==="function")?window.fetch.bind(window):null;
function tl142Ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
function tl142Desligado(){return tl142Ls(TL142_LS.off)==="1"}
function tl142Cfg(){let url="",key="";try{url=/^https:\/\/\S+$/.test(SB_URL)?SB_URL.replace(/\/+$/,""):"";key=SB_KEY&&SB_KEY.indexOf("%%")<0?SB_KEY:""}catch(e){}return {url,key,ok:!!(url&&key)}}
function tl142Permitido(){return !tl142Desligado()&&tl142Cfg().ok&&TL142.v15!==false&&!!TL142_FETCH&&(!navigator.webdriver||!!window.__tl142Teste)}
function tl142Dia(){try{return new Date(Date.now()-3*3600e3).toISOString().slice(0,10)}catch(e){return ""}}
function tl142Ap(){let a=tl142Ls(TL142_LS.ap);if(a&&/^[A-Za-z0-9_-]{16,64}$/.test(a))return a;
  try{const u=new Uint8Array(16);crypto.getRandomValues(u);a=[...u].map(x=>x.toString(16).padStart(2,"0")).join("")}catch(e){a=(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)+"0000000000000000").slice(0,24)}
  tl142Ls(TL142_LS.ap,a);return a}

/* ----- aparelho resumido ----- */
function tl142Aparelho(){if(TL142._apr)return {...TL142._apr,w:tl142Larg(),i:tl142Pwa()};const ua=String(navigator.userAgent||"");let p="outro",b="outro",bv=0,m=null;
  try{if(/iPhone|iPad|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))p="ios";else if(/Android/.test(ua))p="android";else if(/Windows|Macintosh|Mac OS X|Linux|CrOS/.test(ua))p="desktop"}catch(e){}
  if((m=ua.match(/SamsungBrowser\/([0-9]+)/)))b="samsung";else if((m=ua.match(/EdgA?\/([0-9]+)|EdgiOS\/([0-9]+)/)))b="edge";else if((m=ua.match(/FxiOS\/([0-9]+)|Firefox\/([0-9]+)/)))b="firefox";
  else if((m=ua.match(/CriOS\/([0-9]+)|Chrome\/([0-9]+)/)))b="chrome";else if((m=ua.match(/Version\/([0-9]+)[^ ]* (Mobile\/[^ ]+ )?Safari/)))b="safari";else if(p==="ios"&&(m=ua.match(/OS ([0-9]+)_/)))b="safari";
  if(m)bv=Math.min(999,+(m[1]||m[2]||0)||0);TL142._apr={p,b,bv};return {p,b,bv,w:tl142Larg(),i:tl142Pwa()}}
function tl142Larg(){try{return Math.max(0,Math.min(9990,Math.round((innerWidth||0)/10)*10))}catch(e){return 0}}
function tl142Pwa(){try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true?1:0}catch(e){return 0}}
function tl142Tela(){let v="";try{v=typeof VIEW==="string"?VIEW:""}catch(e){}if(!/^[a-z0-9_-]{1,20}$/.test(v))v="";
  for(const id of ["layer2","layer"]){const L=document.getElementById(id),c=L&&L.firstElementChild;if(!c)continue;const k=String(typeof c.className==="string"?c.className:"").split(/\s+/)[0].toLowerCase();
    if(/^[a-z][a-z0-9_-]{0,20}$/.test(k))return (v||"x")+":"+k;break}return v}

/* ----- limpeza do texto: nunca e-mail, id, endereço, número longo, texto entre aspas nem o que está digitado ----- */
function tl142Limpa(t){t=String(t==null?"":t).replace(/^Uncaught (in promise )?/,"");
  t=t.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,"<email>").replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,"<id>")
   .replace(/https?:\/\/[^\s)"']+/g,"<url>").replace(/"[^"]*[^A-Za-z0-9_."][^"]*"/g,'"…"').replace(/'[^']*[^A-Za-z0-9_.'][^']*'/g,"'…'").replace(/[0-9]{4,}/g,"<n>")
   .replace(/[\u0000-\u001f\u007f]+/g," ").replace(/\s+/g," ").trim();return t.slice(0,200)}
function tl142Protege(m){try{const it=[];try{if(S&&S.email)it.push(String(S.email));const n=S&&S.uid&&S.membros&&S.membros[S.uid]&&S.membros[S.uid].nome;if(n)it.push(String(n))}catch(e){}
    document.querySelectorAll("input,textarea").forEach(x=>{const v=String(x.value||"").trim();if(v.length>=3&&x.type!=="checkbox"&&x.type!=="radio")it.push(v)});
    document.querySelectorAll("[contenteditable=true],[contenteditable='']").forEach(x=>String(x.textContent||"").split(/[\n.!?;]+/).forEach(s=>{s=s.trim();if(s.length>=6)it.push(s)}));
    it.sort((a,b)=>b.length-a.length).forEach(s=>{const sl=s.toLowerCase();if(!sl||m.toLowerCase().indexOf(sl)<0)return;m=m.split(s).join("<texto>");if(m.toLowerCase().indexOf(sl)>=0)m="<texto>"})}catch(e){}return m}
function tl142Arq(u){u=String(u||"");if(!u)return "";let ext=false;try{const x=new URL(u,location.href);ext=x.host!==location.host;u=x.pathname}catch(e){u=u.split(/[?#]/)[0]}
  let b=u.split("/").pop()||"index.html";b=b.replace(/[^A-Za-z0-9_.-]/g,"").slice(0,60)||"?";return (ext?"ext:":"")+b}
function tl142Pilha(st){const L=String(st||"").split("\n");for(const s of L){let m=s.match(/at (?:async )?([A-Za-z0-9_$.]+) \((.+):([0-9]+):([0-9]+)\)/);if(m)return {f:m[1],l:tl142Arq(m[2])+":"+m[3]+":"+m[4]};
    m=s.match(/^\s*([A-Za-z0-9_$.]*)@(.+):([0-9]+):([0-9]+)\s*$/);if(m)return {f:m[1],l:tl142Arq(m[2])+":"+m[3]+":"+m[4]};
    m=s.match(/at (.+):([0-9]+):([0-9]+)\s*$/);if(m)return {f:"",l:tl142Arq(m[1])+":"+m[2]+":"+m[3]}}return null}

/* ----- últimas ações (rótulo genérico, sem texto) ----- */
const TL142_VAL=new Set(["a","acao","go","admaba","aba","pfaba","tl142aba","usodias","nav","v","usoaba"]);
function tl142Rotulo(el){const b=el&&el.closest&&el.closest("button,a,[role=button],[role=tab],[role=switch],summary,label,input[type=checkbox]");if(!b)return null;
  for(const at of [...b.attributes]){const n=at.name;if(n.indexOf("data-")!==0||!/^data-[a-z0-9_-]{1,30}$/.test(n))continue;const k=n.slice(5);
    const v=String(at.value||"");return (TL142_VAL.has(k)&&/^[a-z][a-z_-]{0,20}$/.test(v)?k+"."+v:k).slice(0,38)}
  const id=String(b.id||"");if(/^[a-z][a-z0-9_-]{0,30}$/i.test(id)&&!/[0-9]{3,}/.test(id))return "id-"+id.toLowerCase().slice(0,30);
  const c=String(typeof b.className==="string"?b.className:"").split(/\s+/).find(x=>/^[a-z][a-z0-9_-]{1,30}$/i.test(x)&&!/[0-9]{4,}/.test(x));
  return (b.tagName.toLowerCase()+(c?"."+c.toLowerCase():"")).slice(0,38)}
function tl142Acao(a){if(!a||tl142Desligado())return;a=String(a).toLowerCase().replace(/[^a-z0-9_:.-]/g,"").slice(0,40);if(!a)return;TL142.acoes.push(a);if(TL142.acoes.length>5)TL142.acoes.shift()}
document.addEventListener("click",e=>{try{const r=tl142Rotulo(e.target);if(r)tl142Acao("c:"+r)}catch(x){}},true);

/* ----- erros ----- */
function tl142Erro(tipo,msg,arq,lin,col,err,loc){try{if(tl142Desligado()||TL142.v15===false)return;let m=tl142Limpa(tl142Protege(String(msg==null?"":msg)));if(!m||/^Script error\.?$/i.test(m)||/ResizeObserver loop/i.test(m))return;
    let l=loc||(arq?tl142Arq(arq)+(lin?":"+lin+":"+(col||0):""):""),f="";const pl=err&&err.stack?tl142Pilha(err.stack):null;if(pl){f=pl.f||"";if(!l)l=pl.l}
    l=String(l).replace(/[^A-Za-z0-9_./:<>-]/g,"").slice(0,120);f=String(f).replace(/[^A-Za-z0-9_$.]/g,"").slice(0,60);
    const k=tipo+"|"+m+"|"+l+"|"+f;let x=TL142.fila[k];
    if(!x){if(Object.keys(TL142.fila).length>=10)return;if(++TL142.nf>200)return;x=TL142.fila[k]={t:tipo,m,l,f,n:0}}
    if(x.n>=50)return;x.n++;let v="";try{v=/^[0-9a-f]{12}$/.test(APP_VERSAO)?APP_VERSAO:""}catch(e){}
    const A=tl142Aparelho();Object.assign(x,{v,p:A.p,b:A.b,bv:A.bv,i:A.i,w:A.w,s:tl142Tela(),a:TL142.acoes.slice(-5)});
    if(TL142.iniciado&&TL142.v15===true)tl142Agenda()}catch(e){}}
addEventListener("error",e=>{if(e&&e.target&&e.target!==window&&e.target.nodeType)return;tl142Erro("js",e&&e.message,e&&e.filename,e&&e.lineno,e&&e.colno,e&&e.error)},true);
addEventListener("unhandledrejection",e=>{const r=e&&e.reason;let m="";if(r&&typeof r==="object")m=(r.code?r.code+" ":"")+(r instanceof Error&&r.name&&r.name!=="Error"&&r.message?r.name+": "+r.message:(r.message||r.name||""));else m=String(r);tl142Erro("promessa",m||"rejeição sem motivo","",0,0,r instanceof Error?r:null)});
try{if(navigator.serviceWorker){navigator.serviceWorker.addEventListener("message",e=>{const d=e&&e.data;if(d&&d.prumo==="tl142-erro")tl142Erro("sw",d.m,"",0,0,null,String(d.l||"sw.js").replace(/[^A-Za-z0-9_./:-]/g,"").slice(0,60))});
  const sw=navigator.serviceWorker,_r=sw.register&&sw.register.bind(sw);if(_r)sw.register=function(){const p=_r.apply(null,arguments);try{p.catch(err=>tl142Erro("sw","registro: "+(err&&err.message||err),"sw.js",0,0,null))}catch(e){}return p}}}catch(e){}
/* chamadas ao Supabase que voltam com falha (não as detecções de versão: função/tabela/coluna que não existe, 404, sessão) */
const TL142_SUP_OK=/^(42703|42883|42P01|PGRST202|PGRST204|PGRST205|PGRST116|PGRST106|PGRST200|23505)$/;
function tl142Caminho(u){let p="";try{p=new URL(u).pathname}catch(e){return "?"}const s=p.split("/");let n=4;if(s[3]==="rpc")n=5;else if(s[1]==="storage")n=6;
  return s.slice(0,n).map(x=>/[0-9]{4,}|[0-9a-f]{8}-[0-9a-f]{4}/i.test(x)?"<id>":x.replace(/[^A-Za-z0-9_.-]/g,"").slice(0,40)).join("/")}
if(TL142_FETCH){try{window.fetch=function(i,o){const p=TL142_FETCH.apply(this,arguments);try{const C=tl142Cfg(),u=typeof i==="string"?i:(i&&i.url)||"";
    if(C.url&&u.indexOf(C.url)===0&&u.indexOf("/rpc/tl142_")<0&&u.indexOf("/auth/v1/")<0&&!tl142Desligado()){const met=String((o&&o.method)||(i&&i.method)||"GET").toUpperCase().slice(0,7);
      p.then(r=>{if(!r||r.status<400||[401,404,406,416].includes(r.status))return;const cam=tl142Caminho(u);
        r.clone().json().catch(()=>null).then(b=>{const cod=b&&typeof b==="object"?String(b.code||"").slice(0,12):"";if(cod&&TL142_SUP_OK.test(cod))return;
          tl142Erro("supabase","HTTP "+r.status+" "+met+" "+cam+(cod?" "+cod:"")+(b&&b.message?": "+b.message:""),"",0,0,null,cam)})},()=>{})}}catch(e){}return p}}catch(e){}}

/* ----- uso ----- */
function tl142Conta(ev,n){try{if(tl142Desligado()||TL142.v15===false)return;ev=String(ev||"");if(!/^[a-z][a-z0-9_]{1,39}$/.test(ev))return;const k=tl142Dia()+"|"+ev;
    TL142.uso[k]=Math.min(200,(TL142.uso[k]||0)+(n||1));clearTimeout(TL142._us);TL142._us=setTimeout(tl142GuardaUso,800)}catch(e){}}
function tl142GuardaUso(){try{const o={};Object.entries(TL142.uso).forEach(([k,n])=>{if(n>0)o[k]=n});tl142Ls(TL142_LS.uso,Object.keys(o).length?JSON.stringify(o):null)}catch(e){}}
(function(){try{const o=JSON.parse(tl142Ls(TL142_LS.uso)||"null");if(o&&typeof o==="object")Object.entries(o).forEach(([k,n])=>{if(/^[0-9]{4}-[0-9]{2}-[0-9]{2}\|[a-z][a-z0-9_]{1,39}$/.test(k)&&+n>0)TL142.uso[k]=Math.min(200,+n)})}catch(e){}})();
{const _u=uso;uso=function(k){const r=_u.apply(this,arguments);try{if(typeof k==="string")tl142Conta(k)}catch(e){}return r}}
{const _g=go;go=function(v){const ant=typeof VIEW==="string"?VIEW:"";const r=_g.apply(this,arguments);try{if(typeof v==="string"&&/^[a-z]{2,12}$/.test(v)){tl142Acao("go:"+v);if(v!==ant)tl142Conta("tela_"+v)}}catch(e){}return r}}
if(typeof reagir==="function"){const _rg=reagir;reagir=function(){try{tl142Conta("reagir_msg")}catch(e){}return _rg.apply(this,arguments)}}
function tl142ContaIns(t,row){const rs=Array.isArray(row)?row:[row];rs.forEach(x=>{if(!x||typeof x!=="object")return;
  if(t==="publicacoes"){const col=x.estilo&&typeof x.estilo==="object"&&x.estilo.coluna&&typeof x.estilo.coluna==="object";const tp=/^[a-z]{2,12}$/.test(String(x.tipo||""))?x.tipo:"post";tl142Conta("publicar_"+(col?"coluna":tp))}
  else if(t==="pub_reacoes"){const tp=String(x.tipo||"");tl142Conta(tp==="comentario"?"comentar":tp==="curtida"?"curtir_post":"reagir_post")}})}
function tl142PatchSB(c){try{if(!c||c.__tl142||typeof c.from!=="function")return c;c.__tl142=1;const _f=c.from;
  c.from=function(t){const b=_f.apply(this,arguments);try{if((t==="publicacoes"||t==="pub_reacoes")&&b&&typeof b.insert==="function"){const _i=b.insert;b.insert=function(row){try{tl142ContaIns(t,row)}catch(e){}return _i.apply(this,arguments)}}}catch(e){}return b}}catch(e){}return c}
{const _s=sbCliente;sbCliente=function(){return tl142PatchSB(_s.apply(this,arguments))}}
try{if(SB)tl142PatchSB(SB)}catch(e){}

/* ----- envio ----- */
function tl142Post(fn,args,keep){const C=tl142Cfg();return TL142_FETCH(C.url+"/rest/v1/rpc/"+fn,{method:"POST",keepalive:!!keep,credentials:"omit",cache:"no-store",
  headers:{"Content-Type":"application/json",apikey:C.key,Authorization:"Bearer "+C.key},body:JSON.stringify(args||{})})}
async function tl142Detecta(){if(TL142.v15!==null)return TL142.v15;let c=null;try{c=JSON.parse(tl142Ls(TL142_LS.v15)||"null")}catch(e){}
  if(c&&c.ok===true&&Date.now()-c.t<24*3600e3){TL142.v15=true;return true}if(c&&c.ok===false&&Date.now()-c.t<6*3600e3){tl142Sem15();return false}
  try{const r=await tl142Post("tl142_ligado",{});if(r.ok){TL142.v15=true;tl142Ls(TL142_LS.v15,JSON.stringify({ok:true,t:Date.now()}));return true}
    let b=null;try{b=await r.json()}catch(e){}if(r.status===404||/PGRST202|42883/.test(String(b&&b.code||""))){tl142Ls(TL142_LS.v15,JSON.stringify({ok:false,t:Date.now()}));tl142Sem15();return false}}catch(e){}
  return null}
function tl142Sem15(){TL142.v15=false;TL142.fila={};TL142.uso={};tl142GuardaUso()}
function tl142Env(){let o=null;try{o=JSON.parse(tl142Ls(TL142_LS.env)||"null")}catch(e){}const d=tl142Dia();return o&&o.d===d?o:{d,n:0}}
function tl142TemAlgo(){return Object.keys(TL142.fila).length>0||Object.keys(TL142.uso).length>0}
function tl142Agenda(){if(TL142._ag)return;TL142._ag=setTimeout(()=>{TL142._ag=0;tl142Envia(false)},Math.min(TL142.ciclo,30000))}
async function tl142Envia(saindo){if(!TL142.iniciado||TL142.v15!==true||!tl142Permitido()||TL142.enviando||!tl142TemAlgo())return false;
  const E=tl142Env();if(E.n>=20)return false;
  const erros=Object.values(TL142.fila).slice(0,10).map(x=>({...x})),uso=[];const usoK=Object.keys(TL142.uso).slice(0,40);
  usoK.forEach(k=>{const [d,e]=k.split("|");uso.push({e,n:TL142.uso[k],p:tl142Aparelho().p,d})});
  if(!erros.length&&!uso.length)return false;
  const filaAnt=TL142.fila,usoAnt={};usoK.forEach(k=>{usoAnt[k]=TL142.uso[k];delete TL142.uso[k]});TL142.fila={};tl142GuardaUso();
  E.n++;tl142Ls(TL142_LS.env,JSON.stringify(E));TL142.enviando=true;TL142.ultEnvio=Date.now();
  const volta=()=>{Object.entries(usoAnt).forEach(([k,n])=>{TL142.uso[k]=Math.min(200,(TL142.uso[k]||0)+n)});Object.entries(filaAnt).forEach(([k,x])=>{if(!TL142.fila[k]&&Object.keys(TL142.fila).length<10)TL142.fila[k]=x});tl142GuardaUso()};
  try{const r=await tl142Post("tl142_registrar",{p_aparelho:tl142Ap(),p_lote:{erros,uso}},saindo);if(!r.ok){if(r.status===404){tl142Ls(TL142_LS.v15,JSON.stringify({ok:false,t:Date.now()}));tl142Sem15()}else if(r.status>=500)volta()}}
  catch(e){if(!saindo)volta()}finally{TL142.enviando=false}return true}
function tl142Tique(){if(document.hidden)return;if(Object.keys(TL142.fila).length||(Object.keys(TL142.uso).length&&Date.now()-TL142.ultEnvio>5*60e3))tl142Envia(false)}
function tl142Sai(){if(TL142.iniciado&&TL142.v15===true&&tl142TemAlgo())tl142Envia(true)}
addEventListener("pagehide",tl142Sai);
document.addEventListener("visibilitychange",()=>{if(document.hidden)tl142Sai()});
function tl142Estado(){const d=tl142Dia();if(tl142Ls(TL142_LS.dia)===d)return;tl142Ls(TL142_LS.dia,d);tl142Conta("aparelho_ativo");if(tl142Pwa())tl142Conta("app_instalado");
  try{if(typeof nt124Ativo==="function"&&nt124Ativo())tl142Conta("notif_ligadas")}catch(e){}}
async function tl142Inicia(){if(TL142.iniciado||tl142Desligado()||!tl142Cfg().ok||!(!navigator.webdriver||window.__tl142Teste))return;TL142.iniciado=true;
  const on=await tl142Detecta();if(on===null){TL142.iniciado=false;setTimeout(tl142Inicia,60e3);return}if(!on)return;
  tl142Estado();setInterval(tl142Tique,TL142.ciclo);setInterval(tl142AdmTique,60e3);[1500,5000,12000].forEach(ms=>setTimeout(tl142AdmTique,ms));if(Object.keys(TL142.fila).length)tl142Agenda()}
/* começa só depois da primeira tela desenhada (a Capa; para quem não entrou, o Feed): não disputa a abertura */
function tl142EsperaCapa(n){if(document.querySelector("#v-capa .cpi,#posts > :not(.skel)")||n>=40){const f=()=>setTimeout(tl142Inicia,window.__tl142Ciclo?300:1500);window.requestIdleCallback?requestIdleCallback(f,{timeout:4000}):f();return}setTimeout(()=>tl142EsperaCapa(n+1),500)}
setTimeout(()=>tl142EsperaCapa(0),400);

/* ----- Ajustes do app › Privacidade: liga/desliga (padrão ligado) ----- */
function tl142Liga(on){if(on){tl142Ls(TL142_LS.off,null);TL142.v15=null;TL142.iniciado=false;setTimeout(tl142Inicia,300)}
  else{tl142Ls(TL142_LS.off,"1");TL142.fila={};TL142.uso={};TL142.acoes=[];[TL142_LS.ap,TL142_LS.uso,TL142_LS.dia].forEach(k=>tl142Ls(k,null))}}
function tl142PrivHTML(){const on=!tl142Desligado();return `<div class="card tl142-priv"><b>Privacidade</b><div class="tl142-pl"><p class="hint">O Prumo registra erros e contagens de uso anônimas para melhorar o app. Nunca guarda o que você escreve, nem seu nome ou e-mail.</p><button type="button" class="tl142-sw${on?" on":""}" role="switch" aria-checked="${on}" aria-label="Registrar erros e uso anônimos" data-tl142sw><i></i></button></div></div>`}
{const _aj=ajustesHTML;ajustesHTML=function(){let h=_aj.apply(this,arguments);try{h+=tl142PrivHTML()}catch(e){}return h}}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-tl142sw]");if(!b)return;const on=tl142Desligado();tl142Liga(on);
  b.classList.toggle("on",on);b.setAttribute("aria-checked",String(on));toast(on?"Registro anônimo ligado":"Registro anônimo desligado neste aparelho")});
{const _pv=abrirPrivacidade;abrirPrivacidade=function(){const r=_pv.apply(this,arguments);try{const el=document.createElement("div");
  el.innerHTML=`<h4>Registro de erros e uso</h4><p>O Prumo registra erros e contagens de uso anônimas para melhorar o app: o tipo de aparelho e navegador, a tela e os botões tocados logo antes de um erro, e quantas vezes cada parte do app é aberta por dia. Nunca o que você escreve, posts, mensagens, nome, e-mail ou a sua conta. Dá para desligar em Ajustes do app › Privacidade.</p>`;
  const box=document.querySelector("#layer .priv");if(box){const h=[...box.querySelectorAll("h4")].find(x=>/O que o Prumo não faz/.test(x.textContent));[...el.childNodes].forEach(n=>h?box.insertBefore(n,h):box.appendChild(n))}}catch(e){}return r}}

/* ===== painel: Administração › App (Erros e Uso) — só o administrador ===== */
function tl142SouAdm(){try{return !!(S.uid&&S.membro&&S.membros[S.uid]&&S.membros[S.uid].papel==="admin")}catch(e){return false}}
const TL142_NOMES={tela_capa:"Abrir a Capa",materia:"Abrir matéria",tela_feed:"Feed",story:"Giro (notícias)",story_amigo:"Giro de amigos",tela_msgs:"Conversas",tela_me:"Perfil",perfil:"Perfil de outra pessoa",
  criar_coluna:"Colunas: escrever",coluna_publicada:"Colunas: publicar",coluna_ler:"Colunas: ler",coluna_exportar:"Colunas: exportar",criar_post:"Abrir criação de post",criar_story:"Abrir criação de Giro",
  publicar_post:"Publicar post",publicar_story:"Publicar no Giro",publicar_coluna:"Publicar coluna",publicar_reel:"Publicar vídeo",comentar:"Comentar",curtir:"Curtir notícia",curtir_post:"Curtir post",
  reagir_post:"Reagir a post",reagir_msg:"Reagir a mensagem",busca:"Buscar",tela_busca:"Busca",notif_ligadas:"Aparelhos com avisos ligados",aparelho_ativo:"Aparelhos ativos",app_instalado:"Aparelhos com o app instalado",
  tela_saved:"Guardadas",tela_play:"Jogos",atividade:"Atividade",notificacoes:"Notificações (tela)"};
const TL142_PRINC=["tela_capa","materia","tela_feed","story","tela_msgs","tela_me","criar_coluna","coluna_publicada","coluna_ler","coluna_exportar","publicar_post","publicar_story","comentar","curtir","curtir_post","reagir_post","reagir_msg","busca","notif_ligadas"];
const TL142_ESTADO=new Set(["aparelho_ativo","notif_ligadas","app_instalado"]);
const TL142_PLAT={ios:"iPhone/iPad",android:"Android",desktop:"Computador",outro:"Outro"};
function tl142Nome(k){return TL142_NOMES[k]||k.replace(/_/g," ")}
function tl142Quando(t){try{return new Date(t).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"})}catch(e){return ""}}
function tl142Erro42(r){const m=String(r&&r.error&&((r.error.message||"")+" "+(r.error.code||""))||"");return /tl142_|PGRST202|42883|Could not find the function|does not exist/i.test(m)}
{const _a=abrirAdmin;abrirAdmin=function(aba){const r=_a.apply(this,arguments);try{const sg=document.querySelector("#layer .segs[role=tablist]")||document.querySelector(".sheet .segs[role=tablist]");
  if(sg&&!sg.querySelector('[data-admaba="app"]')){sg.classList.add("tl142-segs");const b=document.createElement("button");b.type="button";b.setAttribute("role","tab");b.dataset.admaba="app";b.textContent="App";b.setAttribute("aria-selected",String(S._admAba==="app"));sg.appendChild(b)}}catch(e){}return r}}
{const _c=adminCarregar;adminCarregar=async function(){if(S._admAba==="app")return tl142Carrega();return _c.apply(this,arguments)}}
{const _d=adminDesenhar;adminDesenhar=function(){if(S._admAba==="app")return tl142Desenha();return _d.apply(this,arguments)}}
async function tl142Carrega(){const A=TL142.adm;if(typeof SB==="undefined"||!SB){tl142Desenha();return}
  try{if(!A.limpo){A.limpo=true;const l=await SB.rpc("tl142_limpar");if(!l.error)A.limpeza=l.data}}catch(e){}
  try{const[e,u]=await Promise.all([SB.rpc("tl142_admin_erros"),SB.rpc("tl142_admin_uso",{p_dias:A.dias})]);
    if(e.error){A.falta=tl142Erro42(e);A.erros=A.falta?[]:null;A.erroMsg=A.falta?"":"Não deu para carregar agora."}else{A.falta=false;A.erros=Array.isArray(e.data)?e.data:[];A.erroMsg=""}
    A.uso=u&&!u.error&&Array.isArray(u.data)?u.data:[]}catch(x){A.erros=null;A.erroMsg="Não deu para carregar agora."}
  tl142Desenha()}
function tl142Desenha(){const b=$("#admbox");if(!b||S._admAba!=="app")return;const A=TL142.adm;
  let h=`<div class="segs tl142-sub" role="tablist">${[["erros","Erros"],["uso","Uso"]].map(([k,l])=>`<button type="button" role="tab" data-tl142aba="${k}" aria-selected="${A.sub===k}">${l}</button>`).join("")}</div>`;
  if(A.falta){b.innerHTML=h+`<p class="hint">O registro de erros e uso ainda não está ligado no banco. Rode uma vez o arquivo <b>sql/publicacoes-v15.sql</b> no Supabase (SQL Editor › New query › colar › Run). Sem ele, o app não manda nada.</p>`;return}
  if(A.erros===null&&!A.erroMsg){b.innerHTML=h+`<p class="hint">Carregando…</p>`;return}
  if(A.erroMsg){b.innerHTML=h+`<p class="erro-t">${esc(A.erroMsg)}</p>`;return}
  b.innerHTML=h+(A.sub==="uso"?tl142UsoHTML():tl142ErrosHTML())}
function tl142Plats(o){return Object.entries(o||{}).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${esc(TL142_PLAT[k]||k)} ${n}`).join(" · ")}
function tl142ErrosHTML(){const A=TL142.adm,L=A.erros||[];let v="";try{v=APP_VERSAO}catch(e){}
  const ab=L.filter(e=>!e.resolvido_em),rs=L.filter(e=>e.resolvido_em);
  const novo=e=>!!(v&&e.primeira_versao===v),freq=e=>!!(e.alerta_em&&Date.now()-Date.parse(e.alerta_em)<24*3600e3);
  ab.sort((a,b)=>(novo(b)-novo(a))||(freq(b)-freq(a))||(Date.parse(b.ultima)-Date.parse(a.ultima)));
  const li=e=>{const ad=A.det[e.id]||A.abre===e.id,d=e.detalhe||{};
    return `<li class="tl142-e${novo(e)?" novo":""}${e.resolvido_em?" feito":""}" data-tl142id="${+e.id}"><div><b class="tl142-m">${esc(e.mensagem)}</b>${novo(e)?` <em class="tag tl142-nv">novo nesta versão</em>`:""}${e.reaberto?` <em class="tag bad">voltou</em>`:""}${freq(e)?` <em class="tag bad">frequente</em>`:""}
      <span>${(+e.contagem).toLocaleString("pt-BR")} ${+e.contagem===1?"vez":"vezes"} · ${+e.aparelhos} ${+e.aparelhos===1?"aparelho":"aparelhos"}${+e.aparelhos_1h?` (${+e.aparelhos_1h} na última hora)`:""} · última ${esc(tl142Quando(e.ultima))}</span>
      <span>versão ${esc(e.ultima_versao||"?")} · ${tl142Plats(e.plataformas)}</span>
      ${ad?`<div class="tl142-det"><span><i>Tipo</i> ${esc({js:"erro de JavaScript",promessa:"promessa sem tratamento",sw:"service worker",supabase:"chamada ao Supabase"}[e.tipo]||e.tipo)}</span>${e.local?`<span><i>Onde</i> ${esc(e.local)}${e.funcao?" · "+esc(e.funcao)+"()":""}</span>`:""}
        <span><i>Primeira vez</i> ${esc(tl142Quando(e.primeira))} · versão ${esc(e.primeira_versao||"?")}</span>
        <span><i>Último aparelho</i> ${esc(TL142_PLAT[d.p]||d.p||"?")} · ${esc(d.b||"?")} ${+d.bv||""} · ${d.i?"app instalado":"no navegador"} · ${+d.w||"?"} px</span>
        <span><i>Tela</i> ${esc(d.s||"?")}</span><span><i>Últimas ações</i> ${Array.isArray(d.a)&&d.a.length?d.a.map(x=>`<code>${esc(x)}</code>`).join(" › "):"—"}</span></div>`:""}</div>
      <div class="admb"><button type="button" class="btn ghost amg-b" data-tl142det="${+e.id}">${ad?"Menos":"Detalhes"}</button><button type="button" class="btn ghost amg-b" data-tl142res="${+e.id}" data-on="${e.resolvido_em?0:1}">${e.resolvido_em?"Reabrir":"Resolvido"}</button></div></li>`};
  let h=`<p class="hint">${ab.length} ${ab.length===1?"erro aberto":"erros abertos"}${ab.filter(novo).length?` · <b>${ab.filter(novo).length} novos nesta versão</b>`:""}. Anônimo: sem conta, sem texto digitado; aparelhos contados por um número aleatório.</p>`;
  h+=ab.length?`<ul class="adml tl142-l">${ab.map(li).join("")}</ul>`:`<div class="empty" style="padding:14px 0"><b>Nenhum erro aberto</b></div>`;
  if(rs.length)h+=`<b class="cm-h">Resolvidos (${rs.length})</b><ul class="adml tl142-l">${rs.map(li).join("")}</ul><p class="hint">Resolvidos somem sozinhos 60 dias depois; se o erro voltar numa versão nova, ele reabre.</p>`;
  return h}
function tl142UsoHTML(){const A=TL142.adm,L=A.uso||[],tot={},plat={},dias={},hj=tl142Dia();
  L.forEach(x=>{const n=+x.n||0,d=String(x.dia).slice(0,10);if(!TL142_ESTADO.has(x.evento)){tot[x.evento]=(tot[x.evento]||0)+n;plat[x.plataforma]=(plat[x.plataforma]||0)+n;dias[d]=(dias[d]||0)+n}});
  const ativos={},avisos={};L.forEach(x=>{const d=String(x.dia).slice(0,10);if(x.evento==="aparelho_ativo")ativos[d]=(ativos[d]||0)+(+x.n||0);if(x.evento==="notif_ligadas")avisos[d]=(avisos[d]||0)+(+x.n||0)});
  let h=`<div class="segs uso-per" role="tablist">${[7,30,90].map(n=>`<button type="button" data-tl142dias="${n}" aria-selected="${A.dias===n}">${n} dias</button>`).join("")}</div>`;
  const ds=[];for(let i=A.dias-1;i>=0;i--){const d=new Date(Date.parse(hj+"T12:00:00Z")-i*864e5).toISOString().slice(0,10);ds.push(d)}
  const mx=Math.max(1,...ds.map(d=>dias[d]||0));
  const ap7=ds.slice(-7).reduce((a,d)=>a+(ativos[d]||0),0);
  h+=`<div class="uso-k"><div><span>Ações no período</span><b>${Object.values(tot).reduce((a,n)=>a+n,0).toLocaleString("pt-BR")}</b><em>somadas</em></div><div><span>Aparelhos hoje</span><b>${ativos[hj]||0}</b><em>abriram o app</em></div><div><span>Média 7 dias</span><b>${String(Math.round(ap7/7*10)/10).replace(".",",")}</b><em>aparelhos por dia</em></div><div><span>Avisos ligados</span><b>${avisos[hj]||0}</b><em>aparelhos hoje</em></div></div>`;
  h+=`<b class="cm-h">Por dia</b><div class="tl142-dias" role="img" aria-label="Ações por dia">${ds.map(d=>`<i title="${esc(d.slice(8,10)+"/"+d.slice(5,7))}: ${dias[d]||0}" style="height:${(3+(dias[d]||0)*60/mx).toFixed(0)}px"></i>`).join("")}</div><div class="uso-hx"><span>${esc(ds[0].slice(8,10)+"/"+ds[0].slice(5,7))}</span><span>hoje</span></div>`;
  const lt=Object.entries(tot).sort((a,b)=>b[1]-a[1]);
  h+=`<b class="cm-h">Telas e ações</b>${lt.length?usoBarras(lt.slice(0,25),x=>tl142Nome(x[0]),x=>x[1]):`<p class="hint">Sem dados ainda.</p>`}`;
  const lp=Object.entries(plat).sort((a,b)=>b[1]-a[1]);if(lp.length)h+=`<b class="cm-h">Por plataforma</b>${usoBarras(lp,x=>TL142_PLAT[x[0]]||x[0],x=>x[1])}`;
  const top=lt.length?lt[0][1]:0,lim=Math.max(2,Math.round(top*0.02));
  const pouco=[...new Set([...TL142_PRINC.filter(k=>!TL142_ESTADO.has(k)),...lt.map(x=>x[0])])].map(k=>[k,tot[k]||0]).filter(x=>x[1]<=lim).sort((a,b)=>a[1]-b[1]).slice(0,20);
  if(pouco.length)h+=`<b class="cm-h">O que quase ninguém usa</b><ul class="tl142-pouco">${pouco.map(([k,n])=>`<li><span>${esc(tl142Nome(k))}</span><b>${n}</b></li>`).join("")}</ul>`;
  if(A.limpeza&&(A.limpeza.erros||A.limpeza.uso))h+=`<p class="hint">Limpeza de hoje: ${+A.limpeza.erros||0} erros resolvidos antigos e ${+A.limpeza.uso||0} contadores com mais de 180 dias apagados.</p>`;
  h+=`<p class="hint">Contagem anônima por dia, evento e tipo de aparelho. Ninguém é identificado; quem desliga em Ajustes não entra.</p>`;return h}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const A=TL142.adm;
  const s=t.closest("[data-tl142aba]");if(s){A.sub=s.dataset.tl142aba;tl142Desenha();return}
  const dd=t.closest("[data-tl142dias]");if(dd){A.dias=+dd.dataset.tl142dias||30;tl142Carrega();return}
  const d=t.closest("[data-tl142det]");if(d){const id=+d.dataset.tl142det;A.det[id]=!(A.det[id]||A.abre===id);if(A.abre===id&&!A.det[id])A.abre=null;tl142Desenha();return}
  const r=t.closest("[data-tl142res]");if(r){const id=+r.dataset.tl142res,on=r.dataset.on==="1";r.disabled=true;
    (async()=>{try{const x=await SB.rpc("tl142_resolver",{p_id:id,p_resolvido:on});if(x.error)throw x.error;toast(on?"Marcado como resolvido":"Reaberto");if(on)TL142.alertas=TL142.alertas.filter(a=>a.id!==id)}catch(err){toast("Não deu agora.")}tl142Carrega()})()}});

/* ===== aviso ao administrador: erro novo frequente (mais de 5 aparelhos em 1 h) na Atividade (124) ===== */
async function tl142AdmTique(){if(!tl142SouAdm()||TL142.v15!==true||typeof SB==="undefined"||!SB||Date.now()-TL142.alT<10*60e3)return;TL142.alT=Date.now();
  try{const r=await SB.rpc("tl142_alertas");if(r.error)return;const ant=TL142.alertas.map(a=>a.id+"|"+a.alerta_em).join();TL142.alertas=Array.isArray(r.data)?r.data:[];
    if(ant!==TL142.alertas.map(a=>a.id+"|"+a.alerta_em).join()){try{atRedesenha()}catch(e){}try{nt124Pinta()}catch(e){}}}catch(e){}}
{const _ai=atItens;atItens=function(){let it=_ai.apply(this,arguments);try{if(!Array.isArray(it)||!TL142.alertas.length||!tl142SouAdm())return it;
  const n=TL142.alertas.map(a=>{const m=String(a.mensagem||"");return {k:"tl142:"+a.id+":"+a.alerta_em,at:Date.parse(a.alerta_em)||Date.now(),us:[],ic:"⚠",acao:"tl142",tl142:+a.id,
    txt:`<b>Erro novo frequente no app</b>: “${esc(m.length>90?m.slice(0,89)+"…":m)}” · ${+a.alerta_n||0} aparelhos em 1 hora`}});
  it=it.concat(n).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}catch(e){}return it}}
{const _aa=atAcao;atAcao=function(x){if(x&&x.acao==="tl142"){if($("#layer").innerHTML)closeLayer();const id=x.tl142;setTimeout(()=>{TL142.adm.sub="erros";TL142.adm.abre=id;abrirAdmin("app")},320);return}return _aa.apply(this,arguments)}}
{const _th=atThumb;atThumb=function(x){if(x&&x.acao==="tl142")return "";return _th.apply(this,arguments)}}
TL142.custo=Date.now()-TL142.t0;
