/* ---------- 126: QA noite B — correções das notificações (bolinhas, preferências entre aparelhos, sair da conta, número no ícone) ----------
   NB01 novo seguidor aparecia duas vezes na Atividade (o "sg:" do 123 e o "nt124s:" do 124) e contava 2 (um deles como "outros").
   NB02/NB03 o "visto" e as escolhas "No app" só chegavam ao outro aparelho ao recarregar, e um aparelho desatualizado, ao abrir a
        Atividade, regravava as preferências inteiras por cima das mudanças feitas no outro aparelho (escolhas, coberturas seguidas…).
        Agora: as preferências do banco são acompanhadas em tempo real (e relidas antes de gravar uma escolha das notificações).
   NB04 sair da conta deixava o aparelho inscrito: o celular continuava recebendo as mensagens da conta que saiu.
   NB05 abrir o destino (comentários, post, perfil, cobertura, conversa) não apagava a bolinha daquele item; só abrir a Atividade.
   NB06 ligar um tipo no celular depois que o servidor esqueceu o aparelho (404/410, outra conta) parecia ligado mas não gravava nada.
   NB07 o número no ícone vindo do aviso (service worker) ignorava "Número no ícone" desligado e as escolhas "No app".
   NB08 item com horário no futuro (atualização de cobertura com fuso errado) deixava a bolinha presa.
   NB09 coluna da v9 (estilo.coluna = {tit, linha…}) de quem você segue aparecia como "publicou" (tipo "Posts"), sem o título.
   Itens de quem foi bloqueado que o 124 acrescenta (seguidores, posts de quem você segue) agora também saem. */
var QB126={db:null,unsub:null,fila:Promise.resolve(),cfgS:"",fut:null};

/* ===== NB01: um item por novo seguidor ===== */
{const _c126=nt124Cat;nt124Cat=function(x){if(/^sg:/.test(String(x&&x.k||"")))return "seguidores";return _c126.apply(this,arguments)}}
{const _ai126=atItens;atItens=function(){let it=_ai126.apply(this,arguments);try{if(!Array.isArray(it))return it;
    const sg=new Set(it.filter(x=>x&&/^sg:/.test(String(x.k||""))).map(x=>String(x.k).slice(3)));
    if(sg.size)it=it.filter(x=>!(x&&/^nt124s:/.test(String(x.k||""))&&sg.has(String(x.k).slice(7))));
    it.forEach(x=>{if(!x||!/^nt124c:/.test(String(x.k||"")))return;const pb=pubDe(x.pub),tit=qb126TitCol(pb);
      if(tit)x.txt=`<b>${esc(nomeDe(pb.autor))}</b> publicou uma coluna: “${esc(tit.length>80?tit.slice(0,79).trimEnd()+"…":tit)}”`});
    if(typeof tb121SemBloq==="function")it=tb121SemBloq(it)}catch(e){}return it}}

/* ===== NB09: coluna da v9 ===== */
function qb126TitCol(x){const c=x&&x.estilo&&x.estilo.coluna;return c&&typeof c==="object"&&!Array.isArray(c)?String(c.tit||"").trim():""}
{const _ec126=nt124EhColuna;nt124EhColuna=function(x){const c=x&&x.estilo&&x.estilo.coluna;if(c&&typeof c==="object"&&!Array.isArray(c))return true;return _ec126.apply(this,arguments)}}

/* ===== NB05/NB08: o que conta como novo ===== */
function qb126Vk(){const v=nt124Pref().vk;return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}
/* hora "de verdade" de um item com hora no futuro: a primeira vez que o aparelho o viu */
function qb126Fut(k){const ch="prumo-qb126-fut:"+(S.uid||"");if(!QB126.fut){try{QB126.fut=JSON.parse(localStorage.getItem(ch)||"null")||{}}catch(e){QB126.fut={}}}
  if(!QB126.fut[k]){QB126.fut[k]=Date.now();const ks=Object.keys(QB126.fut);if(ks.length>200)ks.sort((a,b)=>QB126.fut[a]-QB126.fut[b]).slice(0,ks.length-200).forEach(x=>delete QB126.fut[x]);
    try{localStorage.setItem(ch,JSON.stringify(QB126.fut))}catch(e){}}return QB126.fut[k]}
function qb126At(x){let at=+(x&&x.at)||0;if(at>Date.now()+6e5)at=qb126Fut(String(x.k||""));return at}
function qb126Novo(x,v,vk){if(!x)return false;if(x.fixo)return true;const at=qb126At(x);return at>v&&!(+vk[x.k]>=at)}
nt124Contagem=function(){const out={por:{},ativ:0,msgs:0,total:0};if(!S.uid||!S.membro)return out;
  let l=[];try{l=atItens()}catch(e){}const v=atVisto(),vk=qb126Vk();
  l.forEach(x=>{if(!qb126Novo(x,v,vk))return;const c=nt124Cat(x);if(c!=="outros"&&!nt124App(c))return;out.por[c]=(out.por[c]||0)+1;out.ativ++});
  out.msgs=nt124App("mensagens")?nt124MsgsN():0;out.total=out.ativ+out.msgs;return out};
/* marca como vistos os itens da Atividade que levam ao destino que acabou de abrir */
function qb126Marca(pred){if(!S.uid||!S.membro)return;try{const v=atVisto(),vk=qb126Vk(),ag=Date.now();
    const ks=atItens().filter(x=>x&&!x.fixo&&x.k&&qb126Novo(x,v,vk)&&pred(x)).map(x=>x.k);if(!ks.length)return;
    nt124PrefMuda(n=>{const m={};const lim=Math.max(atVisto(),ag-31*864e5);Object.entries(qb126Vk()).forEach(([k,t])=>{if(+t>lim)m[k]=+t});ks.forEach(k=>{m[k]=ag});
      const o=Object.keys(m).sort((a,b)=>m[b]-m[a]).slice(0,150);n.vk={};o.forEach(k=>{n.vk[k]=m[k]})});nt124Pinta()}catch(e){}}
function qb126MarcaDepois(pred){setTimeout(()=>qb126Marca(pred),60)}
{const _oc126=openComments;openComments=function(pid){const r=_oc126.apply(this,arguments);try{const id=String(pid||"");
    if(/^u:/.test(id)){const pub=id.slice(2);qb126MarcaDepois(x=>(x.pub===pub&&nt124Cat(x)==="comentarios")||String(x.k).indexOf("cc8:"+pub+"|")===0)}
    else if(id)qb126MarcaDepois(x=>(x.pid===id&&nt124Cat(x)==="comentarios")||x.cpid===id||(x.msg&&x.msg.pid===id))}catch(e){}return r}}
function qb126MarcaPub(id){id=String(id||"");if(!id)return;qb126MarcaDepois(x=>x.pub===id||x.vnrp===id||x.k==="nt124p:"+id||x.k==="nt124c:"+id||(x.msg&&x.msg.snap&&x.msg.snap.upub===id))}
{const _pi126=pubIrPara;pubIrPara=function(id){const r=_pi126.apply(this,arguments);qb126MarcaPub(id);return r}}
if(typeof vn112AbrePub==="function"){const _va126=vn112AbrePub;vn112AbrePub=function(id){const r=_va126.apply(this,arguments);qb126MarcaPub(id);return r}}
{const _ap126=abrirPerfil;abrirPerfil=function(u){const r=_ap126.apply(this,arguments);try{if(u&&u!==S.uid)qb126MarcaDepois(x=>x.k==="a:"+u||(nt124Cat(x)==="seguidores"&&(x.us||[]).includes(u)))}catch(e){}return r}}
{const _pc126=abrirPagCob;abrirPagCob=function(pid){const r=_pc126.apply(this,arguments);try{if(pid)qb126MarcaDepois(x=>String(x.k).indexOf("cob:"+pid+":")===0)}catch(e){}return r}}
{const _ac126=abrirConversa;abrirConversa=function(u){const r=_ac126.apply(this,arguments);try{if(u)qb126MarcaDepois(x=>x.msg&&x.msg.de===u&&!(x.msg.snap&&x.msg.snap.upub))}catch(e){}return r}}

/* ===== NB02/NB03: as preferências seguem o que está no banco ===== */
function qb126Caminho(){return `data/users/${S.uid}/prefs`}
/* aplica as preferências do banco se forem mais novas que as deste aparelho (o mesmo jeito da abertura do app) */
function qb126Aplica(d){if(!d||typeof d!=="object"||(+d.mod||0)<=(+PREF.mod||0))return false;
  const visto=Math.max(+(nt124Pref().visto||0),+((d.notif&&d.notif.visto)||0));
  const chave=()=>JSON.stringify([PREF.ordem,PREF.ordem2,PREF.ocultas,PREF.ajuste,PREF.fonte]);const antes=chave();
  const loc=PREF.conhecidas||{};Object.assign(PREF,JSON.parse(JSON.stringify(d)));try{normPrefs()}catch(e){}
  PREF.conhecidas={...(d.conhecidas||{}),...loc};PREF.ajuste=Object.assign({sec:{},tag:{}},d.ajuste||{});
  if(visto)PREF.notif={...nt124Pref(),visto};lsSet("radar-prefs",PREF);
  if(chave()!==antes){try{aplicarFonte()}catch(e){}try{if(FEED){calcularNovidades();renderFeed()}}catch(e){}}
  try{nt124Pinta();atDot()}catch(e){}try{if($("#layer .pfv-nt124"))nt124Desenha()}catch(e){}return true}
async function qb126Puxa(){if(!S.db||!S.uid||!S.membro)return;const db=S.db,uid=S.uid;
  try{const g=await nt124Prazo(db.doc(`data/users/${uid}/prefs`).get(),4000);if(S.db===db&&S.uid===uid&&g&&g.exists)qb126Aplica(g.data())}catch(e){}}
setInterval(()=>{try{if(!S.db||!S.uid||!S.membro){if(QB126.unsub){try{QB126.unsub()}catch(e){}QB126.unsub=null}QB126.db=null;return}
    if(QB126.db===S.db)return;if(QB126.unsub){try{QB126.unsub()}catch(e){}QB126.unsub=null}QB126.db=S.db;const uid=S.uid,db=S.db;
    const u=db.doc(qb126Caminho()).onSnapshot(s=>{if(S.db!==db||S.uid!==uid||!s||!s.exists)return;try{qb126Aplica(s.data())}catch(e){}},()=>{});
    QB126.unsub=typeof u==="function"?u:null}catch(e){}},2000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)qb126Puxa()});
/* diferença entre as escolhas antes e depois de uma mudança (até o segundo nível: notif.app.curtidas, notif.vk.…) */
function qb126Dif(a,b){const d={},js=v=>JSON.stringify(v===undefined?null:v),obj=v=>!!v&&typeof v==="object"&&!Array.isArray(v);
  Object.keys(b).forEach(k=>{const x=a[k],y=b[k];if(js(x)===js(y))return;
    if(obj(x)&&obj(y)){const s={};Object.keys(y).forEach(sk=>{if(js(x[sk])!==js(y[sk]))s[sk]=y[sk]});Object.keys(x).forEach(sk=>{if(!(sk in y))s[sk]=null});d[k]={s,troca:k==="vk"}}
    else d[k]={v:y}});return d}
function qb126Junta(base,dif){const n={...base};Object.entries(dif).forEach(([k,o])=>{
    if(o.s){const m=o.troca?{}:{...(n[k]&&typeof n[k]==="object"&&!Array.isArray(n[k])?n[k]:{})};
      if(o.troca){const atual=n[k]&&typeof n[k]==="object"?n[k]:{};Object.entries(atual).forEach(([sk,t])=>{m[sk]=t})}
      Object.entries(o.s).forEach(([sk,v])=>{if(v===null)delete m[sk];else if(o.troca)m[sk]=Math.max(+m[sk]||0,+v||0);else m[sk]=v});n[k]=m}
    else if(k==="visto")n[k]=Math.max(+n[k]||0,+o.v||0);else n[k]=o.v});return n}
/* mudar uma escolha das notificações: vale na hora neste aparelho; antes de gravar, relê o banco (se outro aparelho mudou
   algo depois, junta as duas coisas em vez de apagar a do outro aparelho) */
nt124PrefMuda=function(f){const antes=JSON.parse(JSON.stringify(nt124Pref()));PREF.notif={...antes};f(PREF.notif);const dif=qb126Dif(antes,PREF.notif);lsSet("radar-prefs",PREF);
  if(!S.db||!S.uid||!S.membro){salvarPrefs();return}
  QB126.fila=QB126.fila.then(async()=>{await qb126Puxa();PREF.notif=qb126Junta(nt124Pref(),dif);salvarPrefs();
    try{nt124Pinta();if($("#layer .pfv-nt124"))nt124Desenha()}catch(e){}}).catch(()=>{})};

/* ===== NB04: sair da conta tira este aparelho dos avisos ===== */
async function qb126TiraAparelho(){if(!S.uid)return;let ep=nt124Local().endpoint||null,sub=null;
  try{if("serviceWorker" in navigator&&navigator.serviceWorker){const reg=await navigator.serviceWorker.getRegistration();sub=reg&&reg.pushManager?await reg.pushManager.getSubscription():null;if(sub&&sub.endpoint)ep=sub.endpoint}}catch(e){}
  try{if(ep&&typeof SB!=="undefined"&&SB)await SB.from("push_inscricoes").delete().eq("endpoint",ep)}catch(e){}
  try{if(sub)await sub.unsubscribe()}catch(e){}
  if(ep||nt124Local().ativo)nt124LocalSalva({ativo:false,endpoint:null})}
{const _sa126=sair;sair=async function(){try{await nt124Prazo(qb126TiraAparelho(),4000)}catch(e){}try{qb126BadgeCfg(0,true)}catch(e){}return _sa126.apply(this,arguments)}}
{const _pk126=nt124PushCard;nt124PushCard=function(){const r=_pk126.apply(this,arguments);try{if(r&&r.col&&nt124Ativo())r.h=r.h.replace(/<div class="nt124-bts">/,`<p class="hint qb126-nota">Ao sair da conta, este aparelho deixa de receber os avisos.</p><div class="nt124-bts">`)}catch(e){}return r}}

/* ===== NB06: ligar um tipo no celular confere se o servidor ainda conhece o aparelho ===== */
nt124PushTroca=async function(tipo){if(!nt124Ativo()){await nt124Ativar(tipo);return}
  const L=nt124Local(),prefs=nt124PushPrefs();prefs[tipo]=!prefs[tipo];nt124LocalSalva({prefs});nt124Desenha();
  try{const r=await SB.from("push_inscricoes").update({prefs}).eq("endpoint",L.endpoint).select("endpoint");if(r&&r.error)throw r.error;
    if(r&&Array.isArray(r.data)&&!r.data.length){nt124LocalSalva({ativo:false});if(!(await nt124Ativar()))throw new Error("reinscrever")}}
  catch(e){prefs[tipo]=!prefs[tipo];nt124LocalSalva({prefs});nt124Desenha();toast("Não deu para salvar agora.")}};

/* ===== NB07: o service worker sabe o que o app mostra (para o número no ícone que chega com o aviso) ===== */
function qb126BadgeCfg(n,saiu){const on=!saiu&&!!(S.uid&&S.membro&&nt124BadgeOn());
  const cfg={on,n:on?Math.max(0,Math.min(99,+n||0)):0,off:on?NT124_TIPOS.map(t=>t[0]).filter(k=>!nt124App(k)):[]};const s=JSON.stringify(cfg);if(s===QB126.cfgS)return;QB126.cfgS=s;
  try{if(typeof caches==="undefined"||!caches.open)return;caches.open("prumo-v1").then(c=>c.put("./__nt-badge",new Response(JSON.stringify({...cfg,t:Date.now()}),{headers:{"Content-Type":"application/json"}}))).catch(()=>{})}catch(e){}}
{const _pb126=nt124PoeBadge;nt124PoeBadge=function(n){const r=_pb126.apply(this,arguments);try{qb126BadgeCfg(n)}catch(e){}return r}}
if("serviceWorker" in navigator&&navigator.serviceWorker&&navigator.serviceWorker.addEventListener)navigator.serviceWorker.addEventListener("message",e=>{const d=e&&e.data;if(!d||d.prumo!=="nt-push")return;
  if(document.hidden)return;NT124.badgeN=null;QB126.cfgS="";nt124Pinta()});
