/* ---------- 181: "só seguir" (17/11, decisão do Pedro). Nomes com o prefixo sg181. ----------
   Não existem mais amigos nem Melhores amigos: cada pessoa tem perfil aberto (padrão) ou fechado.
   - Perfil aberto: qualquer membro segue na hora, vê os posts, interage e manda mensagem.
   - Perfil fechado: "Seguir" vira pedido (o dono aprova no Perfil); quem não segue vê nome, foto e os números, mas não os
     posts, as listas nem manda mensagem (só responde se a pessoa começou a conversa).
   - Post e giro: para todos no perfil aberto, só seguidores no fechado (sem escolha de público).
   - Coluna: "Para todos" (padrão) ou "Só para quem me segue".
   Tudo depende de sql/proposta-2026-11-17-so-seguir.sql: a função seguir_estado() diz se ele foi rodado. Sem ela, o app fica
   exatamente como antes (amigos, Melhores amigos, perfil aberto opcional). Com ela, S.amigos passa a ser "quem você segue"
   (assim o Feed, as listas de enviar, as menções e o resto do app seguem funcionando sem mudar cada tela). */
var SG181={on:null,n:0,uid:null,aberto:true,env:new Set(),rec:[],fech:new Set(),t:0,cache:null,ck:""};

/* ===== 0. detecção e estado ===== */
const sg181SemFuncao=e=>/PGRST202|42883|Could not find the function|does not exist|schema cache/i.test(String(e&&e.message||"")+" "+String(e&&e.code||""));
async function sg181Estado(){if(typeof SB==="undefined"||!SB||!S.uid||!S.membro)return;const eu=S.uid;
  try{const r=await SB.rpc("seguir_estado");if(S.uid!==eu)return;
    if(r&&r.error){if(sg181SemFuncao(r.error))SG181.on=false;return}
    const d=r&&r.data||{},liga=SG181.on!==true;SG181.on=true;SG181.t=Date.now();
    const k0=JSON.stringify([SG181.aberto,[...SG181.env],SG181.rec.map(x=>x.uid),[...SG181.fech]]);
    SG181.aberto=d.aberto!==false;SG181.env=new Set(Array.isArray(d.enviados)?d.enviados:[]);SG181.fech=new Set(Array.isArray(d.fechados)?d.fechados:[]);
    SG181.rec=(Array.isArray(d.recebidos)?d.recebidos:[]).filter(x=>x&&x.uid).map(x=>({uid:x.uid,at:+x.at||0}));
    (Array.isArray(d.recebidos)?d.recebidos:[]).forEach(x=>{try{cs123Pess({...x,aberto:true})}catch(e){}});
    try{cs123Nomes()}catch(e){}
    if(liga)sg181Liga();
    if(liga||k0!==JSON.stringify([SG181.aberto,[...SG181.env],SG181.rec.map(x=>x.uid),[...SG181.fech]]))sg181Redesenha()}
  catch(e){}}
setInterval(()=>{if(S.uid!==SG181.uid){SG181.uid=S.uid;SG181.on=null;SG181.n=0;SG181.env=new Set();SG181.rec=[];SG181.fech=new Set();document.body&&document.body.classList.remove("sg181-on")}
  if(!S.uid||!S.membro)return;
  if(SG181.on===null&&SG181.n<40){SG181.n++;sg181Estado()}
  else if(SG181.on===true&&!document.hidden&&Date.now()-SG181.t>60e3)sg181Estado()},2500);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&SG181.on===true)setTimeout(sg181Estado,700)});
function sg181Liga(){document.body.classList.add("sg181-on");try{V9.on=true;cs123Liga()}catch(e){}try{MA.on=false;MA.set=new Set()}catch(e){}}
const sg181On=()=>SG181.on===true&&!!S.uid&&!!S.membro;
const sg181Prim=u=>String(nomeDe(u)||"").split(" ")[0];
/* vê os posts de u? (você, quem você segue, ou perfil aberto) */
const sg181Ve=u=>!!u&&(u===S.uid||CS123.sigo.has(u)||!SG181.fech.has(u))&&!(S.bloq||[]).includes(u);
/* pode mandar mensagem para u? (o mesmo, ou responder a quem começou a conversa) */
const sg181Msg=u=>!!u&&u!==S.uid&&!(S.bloq||[]).includes(u)&&!!S.membros[u]&&!S.membros[u].excluido&&(sg181Ve(u)||(S.msgsIn||[]).some(m=>m.de===u));

/* S.amigos = quem você segue (e, numa conversa aberta com quem pode receber mensagem, essa pessoa também) */
(function(){let am=S.amigos;try{Object.defineProperty(S,"amigos",{configurable:true,enumerable:true,
  get(){if(SG181.on!==true)return am;const s=CS123.sigo,t=typeof THREAD!=="undefined"?THREAD:null;
    if(!t||s.has(t)||!sg181Msg(t))return s;const k=t+"|"+s.size;if(SG181.ck!==k||!SG181.cache){SG181.ck=k;SG181.cache=new Set([...s,t])}return SG181.cache},
  set(v){am=v}})}catch(e){}})();
/* Melhores amigos: desligado */
if(typeof maCarregar==="function"){const _ma=maCarregar;maCarregar=async function(){if(SG181.on===true){MA.on=false;MA.set=new Set();return}return _ma.apply(this,arguments)}}

function sg181Redesenha(){try{if(typeof PFV!=="undefined"&&PFV&&PFV.modo==="grade"&&$("#layer .pfv"))pfvDesenha()}catch(e){}
  try{if(VIEW==="me")renderMe()}catch(e){}try{if(VIEW==="msgs")renderMsgs()}catch(e){}try{atDot();atRedesenha()}catch(e){}}

/* ===== 1. botão Seguir / Pedido enviado / Seguindo ===== */
function sg181Bt(u,extra){const sigo=CS123.sigo.has(u),env=SG181.env.has(u);
  return `<button type="button" class="btn${sigo||env?" ghost":""} sg181-bt${extra?" "+extra:""}" data-sg181seg="${esc(u)}" aria-pressed="${sigo}">${sigo?"Seguindo":env?"Pedido enviado":"Seguir"}</button>`}
async function sg181Seguir(u,b){if(precisaConta()||!sg181On()||!u||u===S.uid)return;
  if(CS123.sigo.has(u)){sheet("Seguindo "+nomeDe(u),`<div class="opt"><button type="button" data-sg181deixa="${esc(u)}">Deixar de seguir<span>${SG181.fech.has(u)?"o perfil é fechado: para ver de novo, você precisa pedir de novo":"as publicações de "+esc(sg181Prim(u))+" saem do seu Feed"}</span></button></div>`);return}
  if(SG181.env.has(u)){sheet("Pedido enviado",`<div class="opt"><button type="button" data-sg181deixa="${esc(u)}">Cancelar o pedido<span>${esc(sg181Prim(u))} ainda não aprovou</span></button></div>`);return}
  if(b){b.disabled=true}
  try{const r=await SB.rpc("seguir",{p_uid:u});if(r&&r.error)throw r.error;
    if(r.data==="pedido"){SG181.env.add(u);toast("Pedido enviado. "+sg181Prim(u)+" precisa aprovar.")}
    else{CS123.sigo.add(u);SG181.env.delete(u);toast("Você está seguindo "+nomeDe(u))}
    try{vibrar(8);uso("seguir")}catch(e){}delete CS123.perf[u];sg181Depois(u)}
  catch(e){const m=String((e&&(e.code||""))+" "+(e&&e.message||""));toast(/54000|demais/.test(m)?"Você seguiu muita gente hoje. Tente amanhã.":"Não deu para seguir agora.");if(b)b.disabled=false;sg181Depois(u)}}
async function sg181Deixa(u){try{const r=await SB.rpc("deixar_de_seguir",{p_uid:u});if(r&&r.error)throw r.error;const era=SG181.env.has(u);CS123.sigo.delete(u);SG181.env.delete(u);
    toast(era?"Pedido cancelado":"Você deixou de seguir "+nomeDe(u));if(SG181.fech.has(u))PUB.itens=PUB.itens.filter(x=>x.autor!==u||(x.publico==="todos"||x.publico==="publico"));delete CS123.perf[u];sg181Depois(u)}
  catch(e){toast("Não deu agora.")}}
async function sg181Depois(u){try{PUB.sig="";if(u)PF_T[u]=0;sg181Redesenha();await pubCarregar();if(u)await pfCarregar(u);await cs123Perf(u,true)}catch(e){}
  sg181Redesenha();try{cs123Carregar()}catch(e){}sg181Estado()}
/* aprovar ou recusar um pedido (perfil fechado) */
async function sg181Responde(u,sim,b){if(b)b.disabled=true;try{const r=await SB.rpc("seguir_responder",{p_uid:u,p_aceitar:!!sim});if(r&&r.error)throw r.error;
    SG181.rec=SG181.rec.filter(x=>x.uid!==u);toast(sim?nomeDe(u)+" agora segue você":"Pedido recusado");delete CS123.perf[S.uid];sg181Redesenha();try{cs123Carregar()}catch(e){}}
  catch(e){if(b)b.disabled=false;toast("Não deu agora.")}}
/* perfil fechado (Ajustes do app › Privacidade) */
async function sg181Fecha(fechar,b){if(b)b.disabled=true;try{const r=await SB.rpc("mudar_perfil_aberto",{p_aberto:!fechar});if(r&&r.error)throw r.error;SG181.aberto=!fechar;CS123.aberto=!fechar;
    if(b){b.classList.toggle("on",fechar);b.setAttribute("aria-checked",String(fechar))}
    toast(fechar?"Perfil fechado: quem quiser seguir você pede e você aprova":"Perfil aberto: qualquer membro pode seguir você");if(!fechar)SG181.rec=[];sg181Estado()}
  catch(e){toast("Não deu para mudar agora.")}finally{if(b)b.disabled=false}}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||SG181.on!==true)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-sg181seg]")){pare();sg181Seguir(b.dataset.sg181seg,b);return}
  if(b=t.closest("[data-sg181deixa]")){pare();const u=b.dataset.sg181deixa;closeLayer();sg181Deixa(u);return}
  if(b=t.closest("[data-sg181sim]")){pare();sg181Responde(b.dataset.sg181sim,true,b);return}
  if(b=t.closest("[data-sg181nao]")){pare();sg181Responde(b.dataset.sg181nao,false,b);return}
  if(b=t.closest("[data-sg181fech]")){pare();sg181Fecha(b.getAttribute("aria-checked")!=="true",b);return}
  if(b=t.closest("[data-sg181lista]")){pare();cs123Lista(b.dataset.u,b.dataset.sg181lista);return}
  /* as listas antigas de "amigos" viram a lista de quem você segue */
  if(t.closest("[data-fd104am],[data-veramigos]")){pare();cs123Lista(S.uid,"seguindo");return}},true);

/* ===== 2. perfil ===== */
function sg181NumHTML(u){const p=CS123.perf[u];if(!p||!p.ok)return "";const lista=u===S.uid||p.lista!==false&&sg181Ve(u);
  const it=(k,n,tx)=>lista?`<button type="button" data-sg181lista="${k}" data-u="${esc(u)}"><b>${cs123Num(n||0)}</b> ${tx}</button>`:`<span><b>${cs123Num(n||0)}</b> ${tx}</span>`;
  return `<span class="sg181-num">${it("seguidores",p.seguidores,p.seguidores===1?"seguidor":"seguidores")}${it("seguindo",p.seguindo,"seguindo")}</span>`}
function sg181Pf(root,u){if(!root||!sg181On()||!u)return;
  root.querySelectorAll(".co160-am,[data-fd104am],[data-pedir],[data-cancelar],[data-aceitar],[data-recusar],.cs123-num,.cs123-numl,.cs123-ab,.pf-ped").forEach(x=>x.remove());
  if(u!==S.uid){root.querySelectorAll("[data-cs123seg]").forEach(x=>x.remove());if(!sg181Msg(u))root.querySelectorAll("[data-pfmsg]").forEach(x=>x.remove())}
  const num=root.querySelector(".vn-pf-num");
  if(num){[...num.children].forEach(c=>{if(/amigo/i.test(c.textContent))c.remove()});
    if(!num.querySelector(".sg181-num")){const p=CS123.perf[u];if(!p){cs123Perf(u).then(()=>{try{if(u===S.uid){if(VIEW==="me")renderMe()}else if(PFV&&PFV.u===u&&$("#layer .pfv"))pfvDesenha()}catch(e){}})}
      else num.insertAdjacentHTML("afterbegin",sg181NumHTML(u))}}
  if(u!==S.uid&&SG181.fech.has(u)&&!root.querySelector(".sg181-fech")){const cab=root.querySelector(".vn-pf-desde,.vn-pf-num");
    if(cab)cab.insertAdjacentHTML("afterend",`<p class="sg181-fech">${cs123Svg('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>')}Perfil fechado${CS123.perf[u]&&CS123.perf[u].me_segue?" · segue você":""}</p>`)}
  root.querySelectorAll("[data-convidar]").forEach(b=>{if(/amigo/.test(b.textContent))b.textContent="Convidar alguém"})}
/* posts no perfil: os de quem você vê (o banco já só entrega o que pode), não só os de quem você segue */
{const _pv=pubVisiveis;pubVisiveis=function(){if(!SG181.todos||SG181.on!==true)return _pv.apply(this,arguments);const now=Date.now();
  return PUB.itens.filter(x=>x&&(x.autor===S.uid||!x.arquivado)&&(x.tipo!=="story"||(x.expira||0)>now))}}
/* o seu perfil: números, pedidos para seguir (perfil fechado) e sem amizades */
function sg181PedHTML(){const l=SG181.rec.filter(x=>!(S.bloq||[]).includes(x.uid));if(!l.length)return "";
  return `<div class="card amg sg181-ped"><span class="amg-t">${l.length===1?"Pedido para seguir você":l.length+" pedidos para seguir você"}</span><ul class="amgl">${l.map(x=>`<li><button type="button" class="amg-r cs123-lr" data-cs123perfil="${esc(x.uid)}">${avatar(x.uid)}<span class="amg-n"><b>${esc(nomeDe(x.uid))}</b></span></button><button type="button" class="btn amg-b" data-sg181sim="${esc(x.uid)}">Aprovar</button><button type="button" class="btn ghost amg-b" data-sg181nao="${esc(x.uid)}">Recusar</button></li>`).join("")}</ul></div>`}
/* listas de seguidores: linha com o botão novo */
{const _l=cs123Linha;cs123Linha=function(x,meu,tipo){if(!sg181On())return _l.apply(this,arguments);const u=x.uid,eu=u===S.uid;
  return `<li><button type="button" class="amg-r cs123-lr" data-cs123perfil="${esc(u)}">${avatar(u)}<span class="amg-n"><b>${esc(eu?"Você":nomeDe(u))}</b><span>${eu?"":SG181.fech.has(u)?"perfil fechado":""}</span></span></button>${meu&&tipo==="seguidores"?`<button type="button" class="btn ghost amg-b" data-cs123tira="${esc(u)}">Remover</button>`:eu?"":sg181Bt(u,"amg-b")}</li>`}}
/* "Adicionar amigos" vira "Buscar pessoas" (todos os membros, abertos e fechados) */
if(typeof abrirAddAmigos==="function"){const _ad=abrirAddAmigos;abrirAddAmigos=function(){if(sg181On())return cs123Descobre();return _ad.apply(this,arguments)}}

/* ===== 3. Atividade: pedidos para seguir ===== */

/* ===== 4. Ajustes do app › Privacidade: "Perfil fechado" ===== */
{const _aj=ajustesHTML;ajustesHTML=function(){let h=_aj.apply(this,arguments);try{if(!sg181On())return h;const f=!SG181.aberto;
  const row=`<div class="sg181-pf"><span><b>Perfil fechado</b><small>${f?"Quem quiser seguir você pede e você aprova. Quem não segue vê só o seu nome, a foto e os números.":"Desligado: qualquer membro pode seguir você e ver o que você publica."} Colunas “Para todos” continuam abertas.</small></span><button type="button" class="tl142-sw${f?" on":""}" role="switch" aria-checked="${f}" aria-label="Perfil fechado" data-sg181fech><i></i></button></div>`;
  if(h.indexOf('<div class="card tl142-priv"><b>Privacidade</b>')>=0)h=h.replace('<div class="card tl142-priv"><b>Privacidade</b>','<div class="card tl142-priv"><b>Privacidade</b>'+row);
  else h+=`<div class="card tl142-priv"><b>Privacidade</b>${row}</div>`}catch(e){}return h}}

/* ===== 5. criar: sem escolha de público no post; coluna "Para todos" ou "Só para quem me segue" ===== */
if(typeof cp152Publicos==="function"){const _cp=cp152Publicos;cp152Publicos=function(){const l=_cp.apply(this,arguments);return sg181On()?[["amigos","Todos"]]:l}}
const SG181_COLTX={amigos:"Qualquer membro do Prumo pode ler, curtir e comentar, mesmo com o perfil fechado.",seguidores:"Só quem segue você pode ler e comentar."};
function sg181ColRotulos(root){if(!root||!sg181On())return;root.querySelectorAll('[data-ed132pubv="amigos"]').forEach(b=>{b.textContent="Para todos"});
  const s=root.querySelector('[data-ed132pubv="seguidores"]');if(s)s.textContent="Só para quem me segue";
  const ph=root.matches&&root.matches("[data-ed132pubh]")?root:root.querySelector("[data-ed132pubh]");
  if(ph&&typeof ED132!=="undefined"&&ED132.E&&!ED132.E.pb136){const tx=SG181_COLTX[ED132.E.pub==="seguidores"?"seguidores":"amigos"];if(ph.textContent!==tx)ph.textContent=tx}}
/* ao publicar a coluna: "todos" (padrão) ou "seguidores"; o link público (136) continua como está */
if(typeof ed132Publica==="function"){const _p=ed132Publica;ed132Publica=async function(){const E=ED132.E;if(!sg181On()||!E||!SB)return _p.apply(this,arguments);const f=SB.from;
  SB.from=function(t){const b=f.apply(SB,arguments);if(t==="publicacoes"&&b&&typeof b.insert==="function"){const ins=b.insert;b.insert=function(row){try{if(row&&!Array.isArray(row)&&row.publico!=="publico")row.publico=E.pub==="seguidores"?"seguidores":"todos"}catch(e){}return ins.apply(this,arguments)}}return b};
  try{return await _p.apply(this,arguments)}finally{SB.from=f}}}
/* coluna já publicada: "Quem pode ler" (136) com as opções novas */
if(typeof pb136Quem==="function"){const _q=pb136Quem;pb136Quem=function(id){const x=pubDe(id);if(!sg181On()||!x)return _q.apply(this,arguments);
  const v=x.publico==="publico"?"publico":x.publico==="seguidores"?"seguidores":"amigos";
  const op=(k,t,d)=>`<button type="button" role="radio" data-pb136qv="${k}" data-id="${esc(id)}" aria-checked="${v===k}">${t}<span>${d}</span></button>`;
  sheet("Quem pode ler",`<div class="opt pb136-quem" role="radiogroup" aria-label="Quem pode ler">${op("amigos","Para todos","Qualquer membro do Prumo")}${op("seguidores","Só para quem me segue","Só os seus seguidores")}${op("publico","Todos (link público)","Página aberta, sem conta")}</div><p class="hint">${esc(PB136_TX)}</p>`)}}
{const _pl=pubLimpa;pubLimpa=function(x){const p=x&&x.publico;const r=_pl.apply(this,arguments);if(p==="todos"&&x)x.publico="todos";return r}}

/* ===== 6. conversas: quem não pode receber mensagem ===== */
function sg181DmAviso(){const v=$("#v-msgs"),u=typeof THREAD!=="undefined"?THREAD:null;if(!v)return;
  if(u&&!sg181Msg(u)&&S.membros[u]&&!S.membros[u].excluido&&!(S.bloq||[]).includes(u)){const h=v.querySelector(".dm-comp .hint");
    if(h&&!h.querySelector(".sg181-bt"))h.innerHTML=`${esc(sg181Prim(u))} tem perfil fechado. Siga para mandar mensagem. ${sg181Bt(u)}`}
  v.querySelectorAll(".dm104-am").forEach(x=>x.remove());
  v.querySelectorAll(".pf165-amh,.dm-sh").forEach(x=>{if(x.textContent.trim()==="Amigos")x.textContent="Quem você segue"})}

/* ===== 7. textos que ainda falam de amizade (troca só o texto inteiro de um trecho, nunca o que alguém escreveu) ===== */
const SG181_TX={"Convidar amigo":"Convidar alguém","Nenhum amigo ainda":"Você ainda não segue ninguém",
  "Adicione amigos no Perfil para mandar notícias para eles.":"Siga pessoas para mandar notícias para elas.","Adicione amigos no Perfil para conversar.":"Siga pessoas para conversar.",
  "Adicione amigos no Perfil para mandar.":"Siga pessoas para mandar.","Seus amigos no Prumo vão ver.":"Quem vê o seu perfil vai ver.",
  "Seus amigos no Prumo vão ver. Use @ para marcar alguém na legenda.":"Quem vê o seu perfil vai ver. Use @ para marcar alguém na legenda.",
  "Você ainda não tem amigos no Prumo.":"Você ainda não segue ninguém no Prumo.","Você ainda não tem amigos no Prumo":"Você ainda não segue ninguém no Prumo",
  "Lidas por amigos":"Lidas por quem você segue","Amigos gostaram":"Quem você segue gostou","O que seus amigos acham":"O que dizem no Prumo",
  "Amigos nesta notícia":"Quem você segue nesta notícia","Nenhum amigo por aqui ainda":"Ninguém que você segue por aqui ainda",
  "Amigo no Prumo":"Você segue","Não são amigos agora":"Você não segue","Perfis abertos":"Pessoas","Descobrir perfis abertos":"Buscar pessoas",
  "Pessoas do Prumo que deixam qualquer membro seguir. Você vê o que elas publicam para seguidores.":"Siga pessoas do Prumo. Perfil fechado: a pessoa aprova o seu pedido.",
  "Nenhum perfil aberto ainda":"Ninguém por aqui ainda","Mencionar um amigo":"Mencionar alguém","Nome do amigo":"Nome da pessoa","Amigos":"Seguindo",
  "Enviar o giro para amigos":"Enviar o giro","seguidores e amigos":"só para quem me segue","amigos":"para todos","Comente esta notícia com seus amigos.":"Comente esta notícia.","Buscar amigo":"Buscar pessoa",
  "Toque num amigo acima, ou mande uma notícia pelo botão Enviar de um post.":"Toque em alguém acima, ou mande uma notícia pelo botão Enviar de um post.",
  "Seus amigos e quem segue você conseguem abrir o post.":"Quem vê o seu perfil consegue abrir o post.","Seus amigos conseguem abrir o post.":"Quem vê o seu perfil consegue abrir o post."};
function sg181Textos(root){if(!root||SG181.on!==true||!root.querySelectorAll)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const troca=[];
  while((n=w.nextNode())){const t=n.nodeValue.trim();if(t&&Object.prototype.hasOwnProperty.call(SG181_TX,t)&&!(n.parentElement&&n.parentElement.closest(".pv-txt,.pub-tx,.dm-c,.cm-t,textarea,[contenteditable]")))troca.push(n)}
  troca.forEach(x=>{x.nodeValue=x.nodeValue.replace(x.nodeValue.trim(),SG181_TX[x.nodeValue.trim()])});
  root.querySelectorAll("input[placeholder]").forEach(i=>{const t=i.getAttribute("placeholder");if(SG181_TX[t])i.setAttribute("placeholder",SG181_TX[t])});
  sg181ColRotulos(root)}
(function(){let fila=new Set(),t=0;const roda=()=>{t=0;const l=[...fila];fila.clear();l.forEach(el=>{try{if(el.isConnected)sg181Textos(el)}catch(e){}})};
  const mo=new MutationObserver(ms=>{if(SG181.on!==true)return;ms.forEach(m=>m.addedNodes.forEach(x=>{if(x.nodeType===1)fila.add(x);else if(x.parentElement)fila.add(x.parentElement)}));if(!t)t=requestAnimationFrame(roda)});
  const liga=()=>{try{mo.observe(document.body,{childList:true,subtree:true})}catch(e){}};if(document.body)liga();else addEventListener("DOMContentLoaded",liga)})();
