/* ---------- 136: colunas, fase 4 — coluna pública com link e newsletter por e-mail ----------
   1. "Antes de publicar" › Quem pode ler ganha "Todos (link público)": a coluna ganha uma página aberta em
      prumonews.com.br/c/<título>-<id>.html (feita pelo robô do GitHub a cada 15 min, tools/colunas_publicas.py), que abre
      sem conta, com prévia no LinkedIn/X/WhatsApp e no Google. Dentro do app ela aparece como "para seguidores".
      Coluna já publicada: menu "…" › "Quem pode ler" muda (função coluna_mudar_publico).
   2. Na coluna pública: selo "Pública · Copiar link" para a autora; "Copiar link" do Enviar copia o link aberto; o
      Exportar (LinkedIn, X, Facebook, WhatsApp, Instagram, e-mail, Markdown) leva "Leia a coluna completa: <link>".
   3. Newsletter: no perfil de quem tem coluna pública (e na página da coluna), "Colunas por e-mail": o membro assina com
      1 toque usando o e-mail da conta, só depois de marcar que concorda (ou outro e-mail, com confirmação). A autora vê
      em "Minhas colunas" quantos confirmaram e baixa a lista dos confirmados (CSV). Envio pela função enviar-newsletter.
   Tudo depende de sql/publicacoes-v14.sql; sem ela o app detecta e esconde. Nomes globais com o prefixo pb136 / PB136. */

var PB136={v14:null,n:0,uid:null,info:{},infoT:{},link:null};
const PB136_SITE="https://prumonews.com.br";
const pb136Slug=s=>{const t=String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");return t.slice(0,60).replace(/-+$/g,"")||"coluna"};
const pb136Arq=x=>{const c=x&&cs123Col(x);return `${pb136Slug(c?c.tit:"")}-${String(x&&x.id||"").replace(/[^0-9a-f]/gi,"").slice(0,8).toLowerCase()}.html`};
const pb136Link=x=>`${PB136_SITE}/c/${pb136Arq(x)}`;
const pb136E=x=>!!(x&&x.publico==="publico"&&cs123Col(x));
const pb136Prim=u=>String(nomeDe(u)||"").split(" ")[0]||"a autora";
const pb136Erro=e=>String((e&&(e.code||""))+" "+(e&&e.message||""));
const PB136_TX="Qualquer pessoa lê pelo link, mesmo sem conta no Prumo (LinkedIn, X, Google). No app, aparece para seus amigos e seguidores. Comentários continuam só no Prumo.";

/* a limpeza dos dados (065/123) só conhece amigos/próximos/seguidores: guarda o "publico" da coluna */
{const _pl=pubLimpa;pubLimpa=function(x){const p=x&&x.publico;const r=_pl.apply(this,arguments);if(p==="publico"&&x&&x.tipo==="post")x.publico="publico";return r}}
/* quem só segue a autora (perfil aberto) vê a coluna pública no Feed, como as "para seguidores" */
const pb136DeSeguido=x=>!!(x&&PB136.v14===true&&typeof V9!=="undefined"&&V9.on&&x.tipo==="post"&&x.publico==="publico"&&!x.arquivado&&x.autor!==S.uid&&CS123.sigo&&CS123.sigo.has(x.autor)&&!(S.bloq||[]).includes(x.autor));
{const _pv=pubVisiveis;pubVisiveis=function(){const base=_pv.apply(this,arguments);try{if(PB136.v14!==true||!CS123.sigo||!CS123.sigo.size)return base;const b=new Set(base);
  if(!PUB.itens.some(x=>!b.has(x)&&pb136DeSeguido(x)))return base;return PUB.itens.filter(x=>b.has(x)||pb136DeSeguido(x))}catch(e){return base}}}

/* ===== 0. detectar a v14 (a função newsletter_info só existe com ela) ===== */
async function pb136Testa(){if(PB136.v14!==null||typeof SB==="undefined"||!SB||!S.uid||!S.membro)return PB136.v14;
  try{const r=await SB.rpc("newsletter_info",{p_autora:S.uid});if(!r.error){PB136.v14=true;PB136.info[S.uid]=r.data||{};PB136.infoT[S.uid]=Date.now()}
    else if(ED132_FALTA.test(pb136Erro(r.error)))PB136.v14=false}catch(e){}
  if(PB136.v14)pb136Redesenha();return PB136.v14}
setInterval(()=>{if(S.uid!==PB136.uid){PB136.uid=S.uid;PB136.v14=null;PB136.n=0;PB136.info={};PB136.infoT={}}
  if(S.uid&&S.membro&&PB136.v14===null&&PB136.n<30){PB136.n++;pb136Testa()}},3000);
async function pb136Info(u,forca){if(PB136.v14!==true||!u||typeof SB==="undefined"||!SB)return null;if(!forca&&PB136.info[u]&&Date.now()-(PB136.infoT[u]||0)<60e3)return PB136.info[u];
  if(PB136.infoT[u]===-1)return PB136.info[u]||null;const t0=PB136.infoT[u];PB136.infoT[u]=-1;
  try{const r=await SB.rpc("newsletter_info",{p_autora:u});if(r.error)throw r.error;PB136.info[u]=r.data||{};PB136.infoT[u]=Date.now()}catch(e){PB136.infoT[u]=t0||0}return PB136.info[u]||null}
function pb136Redesenha(){try{if(typeof PFV!=="undefined"&&PFV&&PFV.u&&$("#layer .pfv")&&PFV.modo==="grade")pfvDesenha()}catch(e){}try{ed132HubRedesenha()}catch(e){}try{pb136PaginaPoe()}catch(e){}}

/* ===== 1. editor: "Quem pode ler" com "Todos (link público)" (coluna nova) ===== */
const pb136PubTx=E=>E.pb136?PB136_TX:ed132PubTx(E.pub);
{const _pn=ed132Painel;ed132Painel=function(){const r=_pn.apply(this,arguments);try{pb136Painel()}catch(e){}return r}}
function pb136Painel(){const E=ED132.E,root=$("#layer > .ed132 .ed132-pp");if(!E||!root||PB136.v14!==true||E.modo==="editar")return;
  let g=root.querySelector(".cs123-pub");
  if(!g){const ref=[...root.querySelectorAll(".ed132-ps")].find(s=>s.querySelector(".ed132-qv,.ed132-pvf"));if(!ref)return;
    ref.insertAdjacentHTML("beforebegin",`<section class="ed132-ps"><h3>Quem pode ler</h3><div class="cs123-pub" role="radiogroup" aria-label="Quem pode ler"><button type="button" role="radio" data-ed132pubv="amigos" aria-checked="${!E.pb136}">Amigos</button></div><p class="hint" data-ed132pubh></p></section>`);
    g=root.querySelector(".cs123-pub")}
  if(!g.querySelector('[data-ed132pubv="publico"]'))g.insertAdjacentHTML("beforeend",`<button type="button" role="radio" class="pb136-op" data-ed132pubv="publico" aria-checked="false">Todos (link público)</button>`);
  g.querySelectorAll("[data-ed132pubv]").forEach(b=>b.setAttribute("aria-checked",String(E.pb136?b.dataset.ed132pubv==="publico":b.dataset.ed132pubv===(E.pub==="seguidores"&&b.parentNode.querySelector('[data-ed132pubv="seguidores"]')?"seguidores":"amigos"))));
  const h=root.querySelector("[data-ed132pubh]");if(h)h.textContent=pb136PubTx(E)}
/* o 132 trata o toque (e põe "amigos" para valor que não conhece); aqui só guardo a escolha "pública" */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("#layer > .ed132 [data-ed132pubv]");if(!b||!ED132.E)return;const E=ED132.E;
  E.pb136=b.dataset.ed132pubv==="publico";setTimeout(()=>{try{pb136Painel();if(E.pb136)ed132Agenda()}catch(_){}},0)},true);
/* o rascunho lembra a escolha */
{const _r=ed132Rasc;ed132Rasc=function(E){const d=_r.apply(this,arguments);if(d&&E&&E.pb136)d.pb136=true;return d}}
{const _d=ed132DoRasc;ed132DoRasc=function(d){const E=_d.apply(this,arguments);try{if(E&&d&&d.pb136===true)E.pb136=true}catch(e){}return E}}
/* publicar: a coluna nova vai com publico = 'publico' */
{const _p=ed132Publica;ed132Publica=async function(){const E=ED132.E;if(!E||!E.pb136||PB136.v14!==true||E.modo==="editar"||!$("#layer > .ed132 .ed132-pp")||typeof SB==="undefined"||!SB)return _p.apply(this,arguments);
  const f=SB.from,n0=PUB.itens.length;let foi=false;
  SB.from=function(t){const b=f.apply(SB,arguments);if(t==="publicacoes"&&b&&typeof b.insert==="function"){const ins=b.insert;b.insert=function(row){if(row&&!Array.isArray(row)&&row.estilo&&row.estilo.coluna){row.publico="publico";foi=true}return ins.call(this,row)}}return b};
  let r;try{r=await _p.apply(this,arguments)}finally{SB.from=f}
  try{const x=foi&&PUB.itens.length>n0&&PUB.itens[0]&&PUB.itens[0].autor===S.uid&&PUB.itens[0].publico==="publico"?PUB.itens[0]:null;
    if(x){PB136.link=pb136Link(x);setTimeout(()=>toast("Coluna publicada com link aberto. A página sai em até 15 minutos.","Copiar link",()=>pb136Copia(x.id)),900)}}catch(e){}
  return r}}

/* ===== 2. coluna já publicada: menu "…" › "Quem pode ler" ===== */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-umenu]");if(!b||PB136.v14!==true)return;const x=pubDe(b.dataset.umenu);
  if(!x||x.autor!==S.uid||!cs123Col(x)||PUB.on===false)return;
  setTimeout(()=>{const o=document.querySelector(".sheet .opt");if(!o||o.querySelector("[data-pb136quem]"))return;
    o.insertAdjacentHTML("afterbegin",`${pb136E(x)?`<button type="button" data-pb136link="${esc(x.id)}">Copiar o link aberto<span>${esc(pb136Link(x).replace(/^https:\/\//,""))}</span></button>`:""}<button type="button" data-pb136quem="${esc(x.id)}">Quem pode ler<span>${pb136E(x)?"todos, pelo link público":x.publico==="seguidores"?"seguidores e amigos":"amigos"}</span></button>`)},0)},true);
function pb136Quem(id){const x=pubDe(id);if(!x)return;const ab=typeof V9!=="undefined"&&V9.on&&CS123.aberto,v=pb136E(x)?"publico":x.publico==="seguidores"&&ab?"seguidores":"amigos";
  const op=(k,t,d)=>`<button type="button" role="radio" data-pb136qv="${k}" data-id="${esc(id)}" aria-checked="${v===k}">${t}<span>${d}</span></button>`;
  sheet("Quem pode ler",`<div class="opt pb136-quem" role="radiogroup" aria-label="Quem pode ler">${op("amigos","Amigos","Seus amigos no Prumo")}${ab?op("seguidores","Seguidores e amigos","Quem segue você e seus amigos"):""}${op("publico","Todos (link público)","Página aberta, sem conta")}</div><p class="hint">${esc(PB136_TX)} Ao fechar o link, a página sai do ar na próxima atualização do site (até 15 minutos).</p>`)}
async function pb136Muda(id,v){const x=pubDe(id);if(!x||!SB)return;try{const r=await SB.rpc("coluna_mudar_publico",{p_id:id,p_publico:v});if(r.error)throw r.error;x.publico=String(r.data||v);
    closeLayer();try{PUB.sig="";pubRedesenha()}catch(e){}pb136PaginaPoe();
    if(x.publico==="publico")toast("Coluna aberta. A página sai em até 15 minutos.","Copiar link",()=>pb136Copia(id));else toast("Pronto: a coluna ficou só no Prumo. A página aberta sai do ar em até 15 minutos.")}
  catch(e){toast("Não deu para mudar agora.")}}

/* ===== 3. link: selo para a autora, "Copiar link" do Enviar, cópia ===== */
async function pb136Copia(id){const x=pubDe(id)||(typeof ed132Pub==="function"?ed132Pub(id):null);if(!x||!pb136E(x))return;const l=pb136Link(x);let ok=false;
  try{await navigator.clipboard.writeText(l);ok=true}catch(e){}
  if(ok)toast("Link aberto copiado: qualquer pessoa abre, mesmo sem conta.");else{try{window.prompt("Copie o link da coluna:",l)}catch(e){}}try{uso("coluna_link_publico")}catch(e){}}
{const _l=cs123LerHTML;cs123LerHTML=function(x,c,o){let h=_l.apply(this,arguments);try{if(o&&o.prev||!x||!c||PB136.v14!==true)return h;
  if(x.autor===S.uid&&pb136E(x))h=h.replace(/(<span class="cs123-tk">[^<]*<\/span>)/,`$1<button type="button" class="pb136-selo" data-pb136link="${esc(x.id)}" aria-label="Coluna pública: copiar o link aberto">Pública</button>`);
  else if(x.autor!==S.uid&&pb136E(x))h=h.replace(/(<p class="cs123-aviso">)/,`<div class="pb136-nlp" data-pb136nlp="${esc(x.autor)}"></div>$1`)}catch(e){}return h}}
/* a página da coluna já aberta quando a v14 é detectada (ou quando muda o público) */
function pb136PaginaPoe(){const L=typeof CS123!=="undefined"&&CS123.ler,r=$("#layer .cs123-ler");if(!L||!r)return;const x=pubDe(L.id);if(!x)return;
  const s=r.querySelector(".pb136-selo");if(x.autor===S.uid){if(pb136E(x)&&!s){const tk=r.querySelector(".cs123-top .cs123-tk");if(tk)tk.insertAdjacentHTML("afterend",`<button type="button" class="pb136-selo" data-pb136link="${esc(x.id)}" aria-label="Coluna pública: copiar o link aberto">Pública</button>`)}else if(!pb136E(x)&&s)s.remove();return}
  if(pb136E(x)&&!r.querySelector(".pb136-nlp")){const av=r.querySelector(".cs123-art > .cs123-aviso");if(av)av.insertAdjacentHTML("beforebegin",`<div class="pb136-nlp" data-pb136nlp="${esc(x.autor)}"></div>`)}
  r.querySelectorAll("[data-pb136nlp]").forEach(el=>pb136NlpPinta(el))}
{const _a=typeof cs123Abrir==="function"?cs123Abrir:null;if(_a)cs123Abrir=function(){const r=_a.apply(this,arguments);setTimeout(()=>{try{pb136PaginaPoe()}catch(e){}},60);return r}}
async function pb136NlpPinta(el){const u=el.dataset.pb136nlp;const i=await pb136Info(u);if(!el.isConnected)return;if(!i||!i.aberta){el.innerHTML="";return}
  el.innerHTML=`<button type="button" class="pb136-nlb${i.assinando?" on":""}" data-pb136nl="${esc(u)}" aria-pressed="${!!i.assinando}">${i.assinando?"✓ Recebendo por e-mail":"Receber as colunas por e-mail"}<small>${i.assinando?"toque para mudar":`as próximas colunas de ${esc(pb136Prim(u))}, no seu e-mail`}</small></button>`}
/* "Copiar link" da folha Enviar: na coluna pública, copia o link aberto (antes do 099) */
window.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-vp99link]");if(!b||PB136.v14!==true)return;const x=pubDe(b.dataset.vp99link);if(!pb136E(x))return;
  e.stopImmediatePropagation();e.preventDefault();closeLayer();pb136Copia(x.id)},true);

/* ===== 4. Exportar: "Leia a coluna completa: <link>" ===== */
const pb136Ler=F=>`Leia a coluna completa: ${F.link}`;
{const _d=ex133DaPub;ex133DaPub=function(id){const F=_d.apply(this,arguments);try{const x=F&&F.x;if(x&&PB136.v14===true&&pb136E(x))F.link=pb136Link(x)}catch(e){}return F}}
{const _d=ex133DoEditor;ex133DoEditor=function(){const F=_d.apply(this,arguments);try{const E=ED132.E,x=E&&E.pubId&&(typeof ed132Pub==="function"?ed132Pub(E.pubId):pubDe(E.pubId));if(F&&x&&PB136.v14===true&&pb136E(x))F.link=pb136Link({...x,estilo:{...x.estilo,coluna:{...cs123Col(x),tit:F.tit||cs123Col(x).tit}}})}catch(e){}return F}}
function pb136PoeLink(t,F){t=String(t);if(!F||!F.link||t.indexOf(F.link)>=0)return t;const L=pb136Ler(F);if(t.indexOf(EX133_COMPLETA)>=0)return t.replace(EX133_COMPLETA,L);
  const i=t.lastIndexOf("\n\n");return i>0?t.slice(0,i)+"\n\n"+L+t.slice(i):t+"\n\n"+L}
{const _i=ex133Inteiro;ex133Inteiro=function(F){return pb136PoeLink(_i.apply(this,arguments),F)}}
{const _t=ex133Trecho;ex133Trecho=function(F,k,nPar,max){if(!F||!F.link)return _t.apply(this,arguments);return pb136PoeLink(_t.call(this,F,k,nPar,max-Math.max(0,pb136Ler(F).length-EX133_COMPLETA.length)-4),F)}}
{const _g=ex133Legenda;ex133Legenda=function(F){return pb136PoeLink(_g.apply(this,arguments),F)}}
{const _m=ex133Md;ex133Md=function(F){const t=_m.apply(this,arguments);if(!F||!F.link)return t;const i=t.lastIndexOf("\n\n---\n\n");return i>0?t.slice(0,i)+`\n\n[Leia a coluna completa](${F.link})`+t.slice(i):t+`\n${pb136Ler(F)}\n`}}
{const _f=ex133Fio;ex133Fio=function(F){const l=_f.apply(this,arguments);if(!F||!F.link)return l;const ps=l.map(p=>p.replace(/^\d+\/\d+ /,""));ps.push(pb136Ler(F));const N=ps.length;return ps.map((p,i)=>`${i+1}/${N} ${p}`)}}
{const _e=ex133Email;ex133Email=function(F,doc){const h=_e.apply(this,arguments);if(!F||!F.link)return h;const k='<p style="margin:28px 0 0;padding-top:14px;border-top:1px solid #e5e7eb',i=h.lastIndexOf(k);
  const p=`<p style="margin:24px 0 0;font-size:17px;line-height:1.6;color:#1f2937">Leia a coluna completa: <a href="${esc(F.link)}" style="color:#24406b;text-decoration:underline">${esc(F.link)}</a></p>`;return i>0?h.slice(0,i)+p+h.slice(i):h}}

/* ===== 5. newsletter: perfil da autora (membro assina com 1 toque) ===== */
{const _pc=pfCab;pfCab=function(u){let h=_pc.apply(this,arguments);try{if(PB136.v14!==true||!u||u===S.uid||(S.bloq||[]).includes(u))return h;const i=PB136.info[u];
  if(!i||Date.now()-(PB136.infoT[u]||0)>60e3){if(PB136.infoT[u]!==-1)pb136Info(u).then(n=>{if(n&&n.aberta&&(!i||i.aberta!==n.aberta||i.assinando!==n.assinando))pb136Redesenha()});if(!i)return h}
  if(!i.aberta)return h;const bt=`<button type="button" class="btn ghost pb136-pf${i.assinando?" on":""}" data-pb136nl="${esc(u)}" aria-pressed="${!!i.assinando}">${i.assinando?"✓ Por e-mail":"Colunas por e-mail"}</button>`;
  if(/<div class="pf-bts">/.test(h))h=h.replace(/(<div class="pf-bts">[\s\S]*?)(<\/div>)/,`$1${bt}$2`);else h+=`<div class="pf-bts">${bt}</div>`}catch(e){}return h}}
function pb136NlFolha(u){if(precisaConta())return;const i=PB136.info[u]||{},n=esc(nomeDe(u)),em=esc(S.email||"o e-mail da sua conta");
  const priv=`<p class="hint pb136-priv">Seu e-mail serve só para mandar as colunas abertas de ${n} quando saírem. Não aparece para ninguém; só a autora vê a lista de quem confirmou (e pode baixá-la). Para sair, toque aqui de novo ou use o link “Cancelar” de qualquer e-mail.</p>`;
  if(i.assinando){sheet("Colunas por e-mail",`<p class="pb136-st">Você recebe as colunas abertas de <b>${n}</b> em <b>${em}</b>.</p>${priv}`,`<div class="pb136-bts"><button type="button" class="btn ghost" data-pb136nlx="${esc(u)}">Cancelar a assinatura</button></div>`);return}
  sheet("Colunas por e-mail",`<p class="pb136-st">Receba no e-mail as próximas colunas abertas de <b>${n}</b>, assim que saírem.</p>
    <label class="pb136-ok"><input type="checkbox" id="pb136-cons"> <span>Pode usar o e-mail da minha conta (<b>${em}</b>) para isso.</span></label>${priv}
    <details class="pb136-out"><summary>Usar outro e-mail</summary><div class="pb136-of"><input class="field" id="pb136-em" type="email" maxlength="254" autocomplete="email" inputmode="email" placeholder="outro@email.com" aria-label="Outro e-mail"><button type="button" class="btn ghost" data-pb136nlo="${esc(u)}">Mandar confirmação</button></div><p class="hint">Chega um e-mail para confirmar; sem confirmar, nada é enviado.</p></details>`,
    `<div class="pb136-bts"><button type="button" class="btn" data-pb136nla="${esc(u)}" disabled>Assinar</button></div>`)}
async function pb136NlMuda(u,assinar,b){if(!SB)return;if(b)b.disabled=true;
  try{const r=await SB.rpc("newsletter_membro",{p_autora:u,p_assinar:!!assinar,p_consentimento:!!assinar});if(r.error)throw r.error;
    PB136.info[u]={...(PB136.info[u]||{}),assinando:!!assinar};PB136.infoT[u]=Date.now();closeLayer();pb136Redesenha();
    toast(assinar?`Pronto: as colunas de ${pb136Prim(u)} vão para o seu e-mail.`:`Assinatura cancelada. Você não recebe mais as colunas de ${pb136Prim(u)} por e-mail.`);try{uso(assinar?"newsletter_assinar":"newsletter_cancelar")}catch(e){}}
  catch(e){if(b)b.disabled=false;toast(/consentimento/.test(pb136Erro(e))?"Marque que concorda para assinar.":"Não deu para mudar agora.")}}
async function pb136NlOutro(u,b){const v=String(($("#pb136-em")||{}).value||"").trim();if(!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)){toast("Confira o e-mail digitado.");return}if(b)b.disabled=true;
  try{const r=await SB.rpc("newsletter_assinar",{p_email:v,p_coluna:null,p_autora:u});if(r.error)throw r.error;closeLayer();
    toast(r.data==="limite"?"Muitos pedidos para este e-mail agora. Tente mais tarde.":`Mandamos um e-mail para ${v}. Toque no link dele para confirmar.`)}
  catch(e){if(b)b.disabled=false;toast(/invalido/.test(pb136Erro(e))?"Confira o e-mail digitado.":"Não deu para assinar agora.")}}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="pb136-cons"){const b=document.querySelector("[data-pb136nla]");if(b)b.disabled=!e.target.checked}});

/* ===== 6. a autora: "Minhas colunas" com a newsletter (contagem e lista dos confirmados) ===== */
{const _h=ed132HubHTML;ed132HubHTML=function(){let h=_h.apply(this,arguments);try{if(PB136.v14!==true||!S.uid)return h;const i=PB136.info[S.uid]||{};
  const c=+i.confirmados||0,p=+i.pendentes||0,tem=!!i.aberta;
  const s=`<section class="pb136-hub" aria-label="Newsletter por e-mail"><h3 class="ed132-hh">Newsletter por e-mail <small>${tem?"das suas colunas abertas":"liga com a primeira coluna aberta"}</small></h3>
    <p class="pb136-n"><b>${cs123Num(c)}</b> ${c===1?"assinante confirmado":"assinantes confirmados"}${p?` · ${cs123Num(p)} ${p===1?"esperando":"esperando"} confirmação`:""}</p>
    <p class="hint">${tem?"Cada coluna aberta nova vai por e-mail para quem confirmou. Ninguém vê esta lista, só você.":"Publique uma coluna com “Todos (link público)”: a página aberta ganha o botão “Assinar por e-mail”."}</p>
    ${c?`<button type="button" class="btn ghost" data-pb136csv>Baixar a lista (CSV)</button>`:""}</section>`;
  return h.replace(/(<\/div><\/div>\s*)$/,s+"$1")}catch(e){}return h}}
{const _hb=ed132Hub;ed132Hub=function(){const r=_hb.apply(this,arguments);if(PB136.v14===true)pb136Info(S.uid,true).then(()=>{try{ed132HubRedesenha()}catch(e){}});return r}}
async function pb136Csv(b){if(!SB)return;if(b)b.disabled=true;try{const r=await SB.rpc("newsletter_exportar");if(r.error)throw r.error;const l=r.data||[];
    const q=s=>{s=String(s==null?"":s);return /[",\n;]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
    const csv="email,desde,origem\n"+l.map(x=>[x.email,x.desde?new Date(x.desde).toISOString().slice(0,10):"",x.origem==="app"?"app":"pagina"].map(q).join(",")).join("\n")+"\n";
    ex133Baixa(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}),"assinantes-prumo.csv");toast(`${l.length} ${l.length===1?"e-mail":"e-mails"} na lista.`);try{uso("newsletter_csv")}catch(e){}}
  catch(e){toast("Não deu para baixar a lista agora.")}finally{if(b)b.disabled=false}}

/* ===== 7. toques ===== */
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-pb136link]")){pare();try{if(b.closest(".sheet"))closeLayer()}catch(_){}pb136Copia(b.dataset.pb136link);return}
  if(b=t.closest("[data-pb136quem]")){pare();const id=b.dataset.pb136quem;closeLayer();setTimeout(()=>pb136Quem(id),60);return}
  if(b=t.closest("[data-pb136qv]")){pare();pb136Muda(b.dataset.id,b.dataset.pb136qv);return}
  if(b=t.closest("[data-pb136nl]")){pare();const u=b.dataset.pb136nl;pb136Info(u,true).then(()=>pb136NlFolha(u));return}
  if(b=t.closest("[data-pb136nla]")){pare();if(!$("#pb136-cons")?.checked){toast("Marque que concorda para assinar.");return}pb136NlMuda(b.dataset.pb136nla,true,b);return}
  if(b=t.closest("[data-pb136nlx]")){pare();pb136NlMuda(b.dataset.pb136nlx,false,b);return}
  if(b=t.closest("[data-pb136nlo]")){pare();pb136NlOutro(b.dataset.pb136nlo,b);return}
  if(b=t.closest("[data-pb136csv]")){pare();pb136Csv(b);return}},true);
