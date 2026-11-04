/* ---------- 124: notificações — bolinhas no app, número no ícone e avisos no celular (Web Push) ----------
   Três níveis, todos com liga/desliga em Perfil › Conta › Notificações:
   1. No app (ligado por padrão): bolinhas e números na barra de baixo e no Perfil, e a faixa "Desde a sua última visita"
      no alto da Atividade. O "visto" vale neste aparelho e também vai junto das preferências (os outros aparelhos sabem).
   2. Número no ícone do app (Badging API), quando o Prumo está instalado na tela de início e o aparelho permite.
   3. Avisos no celular (desligados por padrão; a pessoa escolhe tipo a tipo). Dependem do sql/publicacoes-v10.sql e da
      função enviar-push (supabase/LEIA-ME-push.md). Sem a v10, a página mostra só os itens 1 e 2. Com a v10 e sem a chave
      pública do VAPID gravada pelo administrador, aparece "Ainda não ativado pelo administrador".
   Os avisos que chegam abrem o app em "./?nt=<ação>" (ou, com o app aberto, o service worker manda a ação para cá). */
var NT124={v10:null,n10:0,chave:null,v9:null,segCols:null,seguidores:[],seguindo:new Set(),segT:0,filtro:"",ocupado:false,badgeN:null,pt:0,rota:null};
const NT124_TIPOS=[
  ["mensagens","Mensagens","Mensagens novas nas Conversas","✉"],
  ["amizades","Pedidos de amizade","Pedidos novos e pedidos aceitos","+"],
  ["comentarios","Comentários e respostas","Nas suas publicações e onde você comentou","💬"],
  ["mencoes","Menções","Quando alguém marca você","@"],
  ["curtidas","Curtidas","Nos seus posts, stories e comentários (agrupadas)","♥"],
  ["reposts","Reposts","Quando repostam ou citam sua publicação","↻"],
  ["seguidores","Novos seguidores","Quando alguém começa a seguir você","👤",1],
  ["seguindo","Posts de quem você segue","Publicações novas de quem você segue","▤",1],
  ["coberturas","Coberturas que você segue","Atualizações das notícias que você segue","📌"],
  ["colunas","Colunas","Colunas novas de quem você segue","✎",1]];
const NT124_PLURAL={mensagens:["mensagem","mensagens"],amizades:["pedido de amizade","pedidos de amizade"],comentarios:["comentário","comentários"],mencoes:["menção","menções"],
  curtidas:["curtida","curtidas"],reposts:["repost","reposts"],seguidores:["seguidor novo","seguidores novos"],seguindo:["post de quem você segue","posts de quem você segue"],
  coberturas:["cobertura atualizada","coberturas atualizadas"],colunas:["coluna nova","colunas novas"],outros:["novidade","novidades"]};
function nt124Tipos(){return NT124_TIPOS.filter(t=>!t[4]||NT124.v9===true)}
function nt124Pref(){const n=PREF.notif&&typeof PREF.notif==="object"?PREF.notif:{};return n}
function nt124App(tipo){const a=nt124Pref().app;return !(a&&a[tipo]===false)}
function nt124BadgeOn(){return nt124Pref().badge!==false}
function nt124PrefMuda(f){PREF.notif={...nt124Pref()};f(PREF.notif);salvarPrefs()}

/* ===== 1. categoria de cada item da Atividade ===== */
function nt124Cat(x){const k=String(x&&x.k||""),a=x&&x.acao||"";
  if(x.ped||/^(p|a):/.test(k))return "amizades";
  if(a==="men"||/^m:/.test(k))return "mencoes";
  if(/^s:/.test(k))return x.ic==="♥"?"curtidas":"comentarios";
  if(a==="cmt"||/^(c|cn|fc107):/.test(k))return "comentarios";
  if(a==="vnrp"||/^(vn112|sh):/.test(k))return "reposts";
  if(a==="cob"||/^cob:/.test(k))return "coberturas";
  if(/^nt124s:/.test(k))return "seguidores";
  if(/^nt124c:/.test(k))return "colunas";
  if(/^nt124p:/.test(k))return "seguindo";
  if(/^(curtida|voto|cc8):/.test(k)||a==="cc8"||a==="pub")return "curtidas";
  return "outros"}
function nt124MsgsN(){try{const bl=S.bloq||[];return (S.msgsIn||[]).filter(m=>!m.lida&&!bl.includes(m.de)).length}catch(e){return 0}}
/* o que é novo desde a última visita (e os pedidos de amizade ainda sem resposta), já com as escolhas "no app" */
function nt124Contagem(){const out={por:{},ativ:0,msgs:0,total:0};if(!S.uid||!S.membro)return out;
  let l=[];try{l=atItens()}catch(e){}const v=atVisto();
  l.forEach(x=>{if(!(x.fixo||x.at>v))return;const c=nt124Cat(x);if(c!=="outros"&&!nt124App(c))return;out.por[c]=(out.por[c]||0)+1;out.ativ++});
  out.msgs=nt124App("mensagens")?nt124MsgsN():0;out.total=out.ativ+out.msgs;return out}
/* o ♥ do topo (atDot) também respeita as escolhas */
{const _an124=atNovas;atNovas=function(){try{return nt124Contagem().ativ}catch(e){return _an124.apply(this,arguments)}}}
/* visto: neste aparelho e nas preferências (os outros aparelhos da pessoa também sabem) */
{const _av124=atVisto;atVisto=function(){const a=_av124.apply(this,arguments);const b=+(nt124Pref().visto||0);return Math.max(a,b>Date.now()+6e4?0:b)}}
{const _am124=atMarcaVisto;atMarcaVisto=function(){const r=_am124.apply(this,arguments);try{if(S.uid&&S.membro)nt124PrefMuda(n=>{n.visto=Date.now()})}catch(e){}return r}}

/* ===== bolinhas: barra de baixo, Perfil (aba Conta e linhas do menu) e número no ícone ===== */
function nt124Pinta(){clearTimeout(NT124.pt);NT124.pt=setTimeout(nt124PintaJa,40)}
function nt124PintaJa(){const c=nt124Contagem();
  try{const b=$("#badge");if(b&&!nt124App("mensagens"))b.hidden=true}catch(e){}
  let n=c.ativ;try{const ped=nt124App("amizades")?(S.pedidosIn||[]).filter(u=>S.membros[u]).length:0;n=Math.max(c.ativ,ped)}catch(e){}
  try{const mb=$("#mbadge");if(mb){mb.hidden=!n;mb.setAttribute("aria-label",n?(n===1?"1 novidade no Perfil":n+" novidades no Perfil"):"")}}catch(e){}
  try{const tab=$('#v-me [data-pfaba="conta"]');if(tab){const d=tab.querySelector(".nt124-dot");if(n&&!d){tab.insertAdjacentHTML("beforeend",`<i class="nt124-dot" aria-hidden="true"></i>`)}else if(!n&&d)d.remove()}
    const r=$("#v-me [data-nt124ativ] em");if(r){r.textContent=n?String(n>99?"99+":n):"";r.className=n?"nt124-n":""}}catch(e){}
  nt124PoeBadge(c.total)}
function nt124Instalado(){try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}}
function nt124BadgeSuporte(){return typeof navigator.setAppBadge==="function"}
function nt124PoeBadge(n){if(!nt124BadgeSuporte())return;const quer=nt124BadgeOn()&&nt124Instalado()&&S.uid&&S.membro?Math.min(99,n):0;
  if(quer===NT124.badgeN)return;NT124.badgeN=quer;try{const p=quer?navigator.setAppBadge(quer):navigator.clearAppBadge();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
{const _ub124=updateBadge;updateBadge=function(){const r=_ub124.apply(this,arguments);nt124Pinta();return r}}
{const _ad124=atDot;atDot=function(){const r=_ad124.apply(this,arguments);nt124Pinta();return r}}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)nt124Pinta()});

/* Perfil › Conta: "Atividade" (com o número) e "Notificações" */
{const _rm124=renderMe;renderMe=function(){const r=_rm124.apply(this,arguments);try{if(S.uid&&S.membro){
    const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-nt124ativ]"))m.insertAdjacentHTML("afterbegin",`<button type="button" data-nt124ativ><span>Atividade</span><em></em><i>›</i></button>`);
    const cc=[...document.querySelectorAll("#v-me .pf-conta .card.menu")].find(x=>x.querySelector(".cm-h"))||m;
    if(cc&&!cc.querySelector("[data-nt124abrir]")){const h=`<button type="button" data-nt124abrir><span>Notificações</span><i>›</i></button>`;const em=cc.querySelector(".cm-email");if(em)em.insertAdjacentHTML("afterend",h);else cc.insertAdjacentHTML("afterbegin",h)}}
  nt124PintaJa()}catch(e){}return r}}

/* ===== 2. Atividade: faixa "Desde a sua última visita" e filtro por tipo ===== */
function nt124Rot(c,n){const p=NT124_PLURAL[c]||NT124_PLURAL.outros;return n+" "+(n===1?p[0]:p[1])}
function nt124Ic(c){const t=NT124_TIPOS.find(x=>x[0]===c);return t?t[3]:"•"}
{const _ad124b=atDesenha;atDesenha=function(){const r=_ad124b.apply(this,arguments);try{nt124Faixa()}catch(e){}return r}}
function nt124Faixa(){const el=$("#layer .pfv-at");if(!el)return;const sc=el.querySelector(".pfv-sc");if(!sc)return;const l=AT._l||[],v=AT._visto0||0;
  const por={};l.forEach(x=>{if(!(x.fixo||x.at>v))return;const c=nt124Cat(x);if(c!=="outros"&&!nt124App(c))return;por[c]=(por[c]||0)+1});
  const ordem=NT124_TIPOS.map(t=>t[0]).concat("outros").filter(c=>por[c]);if(NT124.filtro&&!por[NT124.filtro])NT124.filtro="";
  const nm=nt124App("mensagens")?nt124MsgsN():0;let h="";
  if(ordem.length||nm)h=`<div class="nt124-desde" role="group" aria-label="Desde a sua última visita"><div class="nt124-dh"><b>Desde a sua última visita</b>${v?`<span>${esc(quando(v))}</span>`:""}</div>
    <div class="nt124-chips">${nm?`<button type="button" class="nt124-chip nt124-msg" data-nt124msgs><i aria-hidden="true">✉</i>${esc(nt124Rot("mensagens",nm))} não ${nm===1?"lida":"lidas"}</button>`:""}${ordem.map(c=>`<button type="button" class="nt124-chip${NT124.filtro===c?" on":""}" data-nt124f="${c}" aria-pressed="${NT124.filtro===c}"><i aria-hidden="true">${esc(nt124Ic(c))}</i>${esc(nt124Rot(c,por[c]))}</button>`).join("")}</div></div>`;
  else if(v&&l.length)h=`<p class="nt124-nada">Nada de novo desde a sua última visita (${esc(quando(v))}).</p>`;
  sc.querySelector(".nt124-desde,.nt124-nada")?.remove();if(h)sc.insertAdjacentHTML("afterbegin",h);nt124Filtra()}
function nt124Filtra(){const el=$("#layer .pfv-at");if(!el)return;const f=NT124.filtro,l=AT._l||[];
  el.querySelectorAll(".at-l [data-ati]").forEach(b=>{const x=l[+b.dataset.ati],li=b.closest("li");if(li)li.hidden=!!(f&&x&&nt124Cat(x)!==f)});
  el.querySelectorAll(".at-l").forEach(ul=>{const vis=[...ul.children].some(li=>!li.hidden);ul.hidden=!vis;const h=ul.previousElementSibling;if(h&&h.classList.contains("at-h"))h.hidden=!vis})}
{const _aa124=abrirAtividade;abrirAtividade=function(){NT124.filtro="";const r=_aa124.apply(this,arguments);nt124Pinta();return r}}

/* ===== itens novos da Atividade com o "Seguir" (sql v9): novos seguidores, posts e colunas de quem você segue ===== */
const NT124_LED="prumo-nt124-vi";
function nt124PrimeiraVez(chaves){let l={};try{l=JSON.parse(localStorage.getItem(NT124_LED+":"+S.uid)||"null")||null}catch(e){l=null}const base=!l;l=l||{};const ag=Date.now(),viv=new Set(chaves);
  chaves.forEach(k=>{if(!(k in l))l[k]=base?0:ag});Object.keys(l).forEach(k=>{if(!viv.has(k))delete l[k]});try{localStorage.setItem(NT124_LED+":"+S.uid,JSON.stringify(l))}catch(e){}return l}
const nt124Ts=r=>{for(const k of ["criado_em","created_at","at","em"]){const v=r&&r[k];if(v==null)continue;const t=typeof v==="number"?v:Date.parse(v);if(t)return t}return 0};
function nt124RpMeu(x){const r=x&&x.estilo&&x.estilo.rp;if(!r||r.k!=="pub")return false;const o=pubDe(String(r.id||""));return !!(o&&o.autor===S.uid)}  /* repost do meu post já aparece como "repostou" */
function nt124EhColuna(x){const e=x&&x.estilo||{};return x&&(x.tipo==="coluna"||e.coluna===true||e.coluna===1||e.tipo==="coluna"||e.kind==="coluna")}
async function nt124CarregaSeg(){if(!SB||!S.uid||!S.membro||NT124.v9===false)return;NT124.segT=Date.now();
  try{const r=await SB.from("seguidores").select("*").limit(1000);
    if(r.error){if(/does not exist|PGRST205|PGRST106|42P01|Could not find the table|schema cache/i.test(String(r.error.message||"")+" "+String(r.error.code||"")))NT124.v9=false;return}
    const rows=r.data||[],ks=rows[0]?Object.keys(rows[0]):[];const de=["seguidor","de","uid","quem"].find(k=>ks.includes(k)),para=["seguido","para","alvo","autor"].find(k=>ks.includes(k));
    const ant=NT124.v9;NT124.v9=true;if(rows.length&&(!de||!para))return;NT124.segCols=[de,para];
    NT124.seguidores=rows.filter(x=>x[para]===S.uid&&x[de]!==S.uid).map(x=>({u:x[de],at:nt124Ts(x)}));
    NT124.seguindo=new Set(rows.filter(x=>x[de]===S.uid).map(x=>x[para]));
    if(ant!==true&&$("#layer .pfv-nt124"))nt124Desenha();atRedesenha();nt124Pinta()}catch(e){}}
{const _ai124=atItens;atItens=function(){let it=_ai124.apply(this,arguments);try{if(!NT124.v9||!S.uid||!S.membro||!Array.isArray(it))return it;const ag=Date.now(),novos=[];
    const semHora=NT124.seguidores.filter(s=>!s.at).map(s=>"nt124s:"+s.u);const L=semHora.length?nt124PrimeiraVez(semHora):{};
    NT124.seguidores.forEach(s=>{if(!S.membros[s.u]||(S.bloq||[]).includes(s.u))return;const at=s.at||L["nt124s:"+s.u]||0;if(!at)return;
      novos.push({k:"nt124s:"+s.u,at,us:[s.u],ic:"👤",txt:`<b>${esc(nomeDe(s.u))}</b> começou a seguir você`,u:s.u,acao:"perfil"})});
    if(NT124.seguindo.size)pubVisiveis().filter(x=>NT124.seguindo.has(x.autor)&&x.autor!==S.uid&&x.tipo!=="story"&&ag-x.at<30*864e5&&!nt124RpMeu(x)).sort((a,b)=>b.at-a.at).slice(0,12).forEach(x=>{const col=nt124EhColuna(x);
      const tt=String((x.estilo&&x.estilo.titulo)||x.texto||"").trim();
      novos.push({k:(col?"nt124c:":"nt124p:")+x.id,at:x.at,us:[x.autor],ic:col?"✎":"▤",txt:`<b>${esc(nomeDe(x.autor))}</b> ${col?"publicou uma coluna":"publicou"}${tt?`: “${esc(tt.length>80?tt.slice(0,79).trimEnd()+"…":tt)}”`:""}`,pub:x.id,acao:"nt124pub"})});
    if(novos.length)it=it.concat(novos).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}catch(e){}return it}}
{const _aa124b=atAcao;atAcao=function(x){if(x&&x.acao==="nt124pub"){const id=x.pub;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>nt124AbrePub(id),320);return}return _aa124b.apply(this,arguments)}}
{const _th124=atThumb;atThumb=function(x){if(x&&x.acao==="nt124pub"){const pb=pubDe(x.pub);if(!pb)return "";const old=AT.pubs[x.pub];AT.pubs[x.pub]=pb;const h=_th124.apply(this,arguments);if(!old)delete AT.pubs[x.pub];return h}return _th124.apply(this,arguments)}}
function nt124AbrePub(id){try{if(typeof vn112AbrePub==="function"){vn112AbrePub(id);return}}catch(e){}try{pubIrPara(id)}catch(e){}}

/* ===== detectar a v10 (e a chave pública) e a v9 ===== */
async function nt124Testa(){if(NT124.v10!==null||typeof SB==="undefined"||!SB||!S.uid||!S.membro)return NT124.v10;
  try{const r=await SB.rpc("push_chave_publica");
    if(!r.error){NT124.v10=true;NT124.chave=typeof r.data==="string"&&r.data.trim()?r.data.trim():null}
    else if(/does not exist|PGRST202|PGRST205|42883|Could not find the function|schema cache/i.test(String(r.error.message||"")+" "+String(r.error.code||"")))NT124.v10=false}catch(e){}
  if(NT124.v10&&nt124Local().ativo)nt124Confere();if($("#layer .pfv-nt124"))nt124Desenha();return NT124.v10}
setInterval(()=>{if(!S.uid||!S.membro)return;if(NT124.v10===null&&NT124.n10<40){NT124.n10++;nt124Testa()}
  if(NT124.v9!==false&&Date.now()-NT124.segT>120e3&&!document.hidden)nt124CarregaSeg()},2500);

/* ===== 3. avisos no celular ===== */
function nt124LK(){return "prumo-nt124:"+(S.uid||"")}
function nt124Local(){try{const o=JSON.parse(localStorage.getItem(nt124LK())||"null");return o&&typeof o==="object"?o:{}}catch(e){return {}}}
function nt124LocalSalva(o){try{localStorage.setItem(nt124LK(),JSON.stringify({...nt124Local(),...o}))}catch(e){}}
function nt124PushPrefs(){const p=nt124Local().prefs;const o={};NT124_TIPOS.forEach(t=>{o[t[0]]=!!(p&&p[t[0]]===true)});return o}
function nt124Suporte(){return "serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window}
function nt124Ios(){try{return /iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}catch(e){return false}}
function nt124Perm(){try{return "Notification" in window?Notification.permission:"default"}catch(e){return "default"}}
function nt124Ativo(){return !!(nt124Local().ativo&&nt124Perm()==="granted"&&NT124.v10&&NT124.chave)}
function nt124B64(s){const p="=".repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function nt124MesmaChave(sub,u8){try{const k=sub&&sub.options&&sub.options.applicationServerKey;if(!k)return true;const a=new Uint8Array(k);return a.length===u8.length&&a.every((x,i)=>x===u8[i])}catch(e){return true}}
function nt124Prazo(p,ms){return Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error("prazo")),ms))])}
async function nt124Reg(){const sw=navigator.serviceWorker;let r=await sw.getRegistration();if(!r)r=await sw.register("sw.js");await nt124Prazo(sw.ready,10000);return r}
async function nt124Ativar(tipo){if(NT124.ocupado)return false;if(!NT124.chave){toast("Ainda não ativado pelo administrador.");return false}
  if(!nt124Suporte()){toast("Este aparelho não recebe notificações do Prumo.");return false}
  NT124.ocupado=true;nt124Desenha();let ok=false;
  try{let perm=nt124Perm();if(perm!=="granted")perm=await Notification.requestPermission();
    if(perm!=="granted"){toast(perm==="denied"?"As notificações estão bloqueadas para o Prumo neste aparelho.":"Tudo bem. Dá para ativar quando quiser.");return false}
    const reg=await nt124Reg();const chave=nt124B64(NT124.chave);let sub=await reg.pushManager.getSubscription();
    if(sub&&!nt124MesmaChave(sub,chave)){try{await sub.unsubscribe()}catch(e){}sub=null}
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:chave});
    const j=typeof sub.toJSON==="function"?sub.toJSON():sub;const prefs=nt124PushPrefs();if(tipo)prefs[tipo]=true;
    const r=await SB.rpc("push_inscrever",{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_prefs:prefs,p_ua:String(navigator.userAgent||"").slice(0,200)});
    if(r&&r.error)throw r.error;
    nt124LocalSalva({ativo:true,endpoint:j.endpoint,prefs});ok=true;uso("notif_ativar");
    toast(Object.values(prefs).some(Boolean)?"Notificações ativadas neste aparelho":"Ativadas. Agora escolha abaixo o que deve chegar.")}
  catch(e){toast("Não deu para ativar agora. Tente de novo.")}
  finally{NT124.ocupado=false;nt124Desenha()}return ok}
async function nt124Desativar(){if(NT124.ocupado)return;NT124.ocupado=true;nt124Desenha();
  try{let ep=nt124Local().endpoint,sub=null;try{const reg=await navigator.serviceWorker.getRegistration();sub=reg&&await reg.pushManager.getSubscription();if(sub)ep=sub.endpoint}catch(e){}
    if(ep&&SB)await SB.from("push_inscricoes").delete().eq("endpoint",ep);if(sub)try{await sub.unsubscribe()}catch(e){}
    nt124LocalSalva({ativo:false,endpoint:null});toast("Notificações desativadas neste aparelho")}
  catch(e){toast("Não deu para desativar agora.")}finally{NT124.ocupado=false;nt124Desenha()}}
async function nt124PushTroca(tipo){if(!nt124Ativo()){await nt124Ativar(tipo);return}
  const L=nt124Local(),prefs=nt124PushPrefs();prefs[tipo]=!prefs[tipo];nt124LocalSalva({prefs});nt124Desenha();
  try{const r=await SB.from("push_inscricoes").update({prefs}).eq("endpoint",L.endpoint);if(r&&r.error)throw r.error}
  catch(e){prefs[tipo]=!prefs[tipo];nt124LocalSalva({prefs});nt124Desenha();toast("Não deu para salvar agora.")}}
/* o aparelho continua inscrito no servidor? (troca de conta, aparelho apagado por expirar…) */
async function nt124Confere(){const L=nt124Local();if(!L.ativo||!L.endpoint||!SB)return;
  try{const r=await SB.from("push_inscricoes").select("endpoint,prefs").eq("endpoint",L.endpoint);if(r.error)return;
    if(!(r.data||[]).length||nt124Perm()!=="granted")nt124LocalSalva({ativo:false});else nt124LocalSalva({prefs:{...nt124PushPrefs(),...(r.data[0].prefs||{})}});
    if($("#layer .pfv-nt124"))nt124Desenha()}catch(e){}}
async function nt124Teste(){try{const reg=await nt124Reg();await reg.showNotification("Prumo News",{body:"É assim que os avisos do Prumo chegam neste aparelho.",icon:"icon-192.png",tag:"prumo-teste",data:{url:"./?nt=atividade"}});toast("Aviso de teste enviado")}
  catch(e){toast("Não deu para mostrar o aviso de teste.")}}

/* ===== a página Notificações ===== */
function nt124Sw(on,attrs,lab,dis){return `<button type="button" class="nt124-sw${on?" on":""}" role="switch" aria-checked="${!!on}" aria-label="${esc(lab)}" ${attrs}${dis?" disabled":""}><i></i></button>`}
function nt124PushCard(){if(NT124.v10!==true)return {h:"",col:false};
  const ios=nt124Ios(),inst=nt124Instalado();
  if(!NT124.chave)return {h:`<div class="card nt124-cel"><b>Avisos no celular</b><p class="hint" data-nt124estado="admin">Ainda não ativado pelo administrador.</p></div>`,col:false};
  if(!nt124Suporte())return {h:`<div class="card nt124-cel"><b>Avisos no celular</b><p class="hint" data-nt124estado="sem">${ios&&!inst?"No iPhone, os avisos só funcionam com o Prumo na Tela de Início (iOS 16.4 ou mais novo): no Safari, toque em Compartilhar › “Adicionar à Tela de Início” e abra o Prumo por lá.":"Este navegador não recebe avisos do Prumo."}</p></div>`,col:false};
  if(nt124Perm()==="denied")return {h:`<div class="card nt124-cel"><b>Avisos no celular</b><p class="hint" data-nt124estado="bloq">Os avisos estão bloqueados para o Prumo neste aparelho. Para liberar, abra os ajustes do navegador (ou do celular), procure o Prumo e permita notificações.</p></div>`,col:false};
  const at=nt124Ativo(),oc=NT124.ocupado;
  return {col:true,h:`<div class="card nt124-cel"><b>Avisos no celular</b>${at?`<p class="nt124-ok" data-nt124estado="ativo"><i aria-hidden="true">●</i> Ativados neste aparelho</p><p class="hint">Escolha abaixo, na coluna “Celular”, o que deve chegar. Nada chega sem você ligar.</p>
      <div class="nt124-bts"><button type="button" class="btn ghost" data-nt124teste${oc?" disabled":""}>Mostrar um aviso de teste</button><button type="button" class="btn ghost" data-nt124desativar${oc?" disabled":""}>Desativar neste aparelho</button></div>`
    :`<p class="hint" data-nt124estado="inativo">Receba avisos mesmo com o Prumo fechado. O celular só pergunta se pode quando você tocar no botão.${ios?" No iPhone, precisa estar com o Prumo na Tela de Início (iOS 16.4 ou mais novo).":""}</p>
      <button type="button" class="btn" data-nt124ativar${oc?" disabled":""}>${oc?"Ativando…":"Ativar notificações neste aparelho"}</button>`}</div>`}}
function nt124Desenha(){const el=$("#layer .pfv-nt124");if(!el)return;const sc0=el.querySelector(".pfv-sc"),top=sc0?sc0.scrollTop:0;
  const pc=nt124PushCard(),pp=nt124PushPrefs(),at=nt124Ativo(),bs=nt124BadgeSuporte();
  const linhas=nt124Tipos().map(([k,lab,desc])=>`<li class="nt124-li" data-nt124tipo="${k}"><span class="nt124-tx"><b>${esc(lab)}</b><small>${esc(desc)}</small></span>
      ${nt124Sw(nt124App(k),`data-nt124app="${k}"`,lab+" no app")}${pc.col?nt124Sw(at&&pp[k],`data-nt124push="${k}"`,lab+" no celular",NT124.ocupado):""}</li>`).join("");
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>Notificações</b><span class="sp"></span></div>
    <div class="pfv-sc nt124-pg">${pc.h}
      <div class="card nt124-tab"><div class="nt124-cab"><b>O que avisar</b><span class="nt124-cols${pc.col?"":" um"}"><em>No app</em>${pc.col?"<em>Celular</em>":""}</span></div>
        <p class="hint">“No app” são as bolinhas e os números na barra de baixo e no Perfil. Tudo continua aparecendo na Atividade.</p>
        <ul class="nt124-l">${linhas}</ul></div>
      <div class="card nt124-ic"><div class="nt124-li"><span class="nt124-tx"><b>Número no ícone do app</b><small>${bs?"Mostra quantas novidades há, com o Prumo instalado na tela de início.":"Este aparelho não mostra número no ícone do app."}</small></span>${nt124Sw(bs&&nt124BadgeOn(),"data-nt124badge","Número no ícone do app",!bs)}</div></div>
    </div>`;
  const sc=el.querySelector(".pfv-sc");if(sc)sc.scrollTop=top}
function nt124Abrir(){if(precisaConta())return;if($("#layer").innerHTML)closeLayer();
  $("#layer").innerHTML=`<div class="pfv pfv-nt124" role="dialog" aria-modal="true" aria-label="Notificações"></div>`;if(pushH())HST++;nt124Desenha();uso("notificacoes");
  if(NT124.v10===null||(NT124.v10&&!NT124.chave)){NT124.v10=null;nt124Testa()}else if(NT124.v10&&nt124Local().ativo)nt124Confere();if(NT124.v9===null)nt124CarregaSeg()}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(t.closest("[data-nt124abrir]")){pare();nt124Abrir();return}
  if(t.closest("[data-nt124ativ]")){pare();abrirAtividade();return}
  if(t.closest("#layer .pfv-at [data-nt124msgs]")){pare();closeLayer();setTimeout(()=>go("msgs"),320);return}
  if(b=t.closest("#layer .pfv-at [data-nt124f]")){pare();const f=b.dataset.nt124f;NT124.filtro=NT124.filtro===f?"":f;nt124Faixa();return}
  if(!t.closest("#layer .pfv-nt124"))return;
  if(b=t.closest("[data-nt124app]")){pare();const k=b.dataset.nt124app,on=!nt124App(k);nt124PrefMuda(n=>{n.app={...(n.app||{}),[k]:on}});nt124Desenha();updateBadge();atDot();return}
  if(b=t.closest("[data-nt124push]")){pare();if(!b.disabled)nt124PushTroca(b.dataset.nt124push);return}
  if(b=t.closest("[data-nt124badge]")){pare();if(b.disabled)return;nt124PrefMuda(n=>{n.badge=!nt124BadgeOn()});nt124Desenha();nt124PintaJa();return}
  if(t.closest("[data-nt124ativar]")){pare();nt124Ativar();return}
  if(t.closest("[data-nt124desativar]")){pare();nt124Desativar();return}
  if(t.closest("[data-nt124teste]")){pare();nt124Teste();return}},true);

/* ===== abrir a tela certa ao tocar no aviso ===== */
function nt124Pronto(){return !!(S.uid&&S.membro&&S.amigosOk&&typeof FEED!=="undefined"&&FEED)}
function nt124Rota(nt){nt=String(nt||"");if(!/^[a-z]{3,12}(:[\w.\-]{1,120})?$/.test(nt))return;NT124.rota=nt;nt124RotaTenta(0)}
function nt124RotaTenta(n){const nt=NT124.rota;if(!nt)return;if(!nt124Pronto()){if(n<40)setTimeout(()=>nt124RotaTenta(n+1),500);return}NT124.rota=null;
  const i=nt.indexOf(":"),a=i<0?nt:nt.slice(0,i),v=i<0?"":nt.slice(i+1);
  try{if($("#layer2")?.innerHTML||$("#layer").innerHTML)closeLayer()}catch(e){}
  const pub=async id=>{if(!pubDe(id))try{await pubCarregar()}catch(e){}return pubDe(id)};
  setTimeout(async()=>{try{
    if(a==="conversa"&&v){abrirConversa(v);return}
    if(a==="perfil"&&v){abrirPerfil(v);return}
    if(a==="comentarios"&&v){if(await pub(v))openComments("u:"+v);else abrirAtividade();return}
    if(a==="pub"&&v){await pub(v);nt124AbrePub(v);return}
    if(a==="noticia"&&v){if(pautaById(v))openComments(v);else abrirAtividade();return}
    if(a==="cobertura"&&v){abrirPagCob(v);return}
    abrirAtividade()}catch(e){}},60)}
(function(){try{const q=new URLSearchParams(location.search),nt=q.get("nt");if(!nt)return;q.delete("nt");const s=q.toString();
    history.replaceState(history.state,"",location.pathname+(s?"?"+s:"")+location.hash);nt124Rota(nt)}catch(e){}})();
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const d=e.data;if(!d||d.prumo!=="nt-abrir")return;
  try{nt124Rota(new URL(String(d.url||""),location.href).searchParams.get("nt")||"atividade")}catch(err){}});
