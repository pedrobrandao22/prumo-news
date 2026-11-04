/* ---------- 122: decisões do Pedro (03/11) ----------
   1. Repost sem comentário cujo original ficou indisponível (apagado, arquivado, amizade desfeita, bloqueio) não aparece no Feed nem no
      perfil de quem não repostou; quem repostou continua vendo (no próprio Feed e no próprio perfil) com o aviso "Publicação indisponível".
      A citação (repost com comentário) continua aparecendo com o comentário e o aviso.
   2. Sem post triplo: o original e os reposts sem comentário dos amigos viram um item só no Feed, com a linha "Bia e Carla repostaram"
      em cima, na posição do repost mais recente (como no X). Citações continuam itens separados. Os números (Repostar 2) e a Atividade
      não mudam: só o Feed junta.
   3. Sai a linha "Relato pessoal, não checado pela redação do Prumo" (no 117).
   4. Cartão A: todo post de amigo (e o próprio) começa por quem postou — bolinha e nome, embaixo quando e onde — depois o texto, a mídia,
      o Contexto do Prumo e as ações, como o relato do 117. O selo (Análise, Pergunta) vira um chapéu pequeno em cima do título.
      Notícias (pautas) não mudam.
   5. "Relato" passa a se chamar "De perto" em tudo o que a pessoa lê. A chave interna ("rel") e os dados guardados não mudam.
   Nomes globais com o prefixo dc122. */

/* ===== 5. "De perto" no lugar de "Relato" ===== */
const DC122_DP="De perto";
try{const r=CN102_KS.find(k=>k[0]==="rel");if(r)r[1]=DC122_DP;CN102_NOME.rel=DC122_DP}catch(e){}
try{const r=FC105_KS.find(k=>k[0]==="rel");if(r)r[1]=DC122_DP}catch(e){}
try{const r=FC107_PK.find(k=>k[0]==="rel");if(r)r[1]=DC122_DP}catch(e){}
{const _ck122=cn102Kick;cn102Kick=function(k,au){return k==="rel"?`${DC122_DP} · ${esc(nomeDe(au))}`:_ck122.apply(this,arguments)}}
{const _fk122=fc105Kicker;fc105Kicker=function(c,nome){return c&&c.k==="rel"?`${DC122_DP} · ${nome||nomeDe(S.uid)||""}`:_fk122.apply(this,arguments)}}
{const _sn122=fc107StNoticia;fc107StNoticia=function(x){return _sn122.apply(this,arguments)||/^De perto · /.test(String((x&&x.texto)||""))}}
{const _va122=cn102Valida;cn102Valida=function(){const r=_va122.apply(this,arguments);return r==="Dê um título curto ao relato."?"Dê um título curto ao que você viu.":r}}
{const _cd122=cn102Det;cn102Det=function(el){const r=_cd122.apply(this,arguments);try{const P=ED&&ED.po;if(P&&P.cn&&P.cn.k==="rel"&&el){const av=el.querySelector(".cn102-aviso");
  if(av)av.textContent=`Aparece como “${DC122_DP} · ${cn102Primeiro(S.uid)}”. Conte só o que você viu ou confirmou: a redação não checa estes posts.`}}catch(e){}return r}}
{const _pt122=fc107PfTile;fc107PfTile=function(){const h=_pt122.apply(this,arguments);return typeof h==="string"?h.replace("<small>Relato</small>",`<small>${DC122_DP}</small>`):h}}
{const _an122=atPubNome;atPubNome=function(){const n=_an122.apply(this,arguments);return typeof n==="string"?n.replace(/^seu relato\b/,"seu post De perto"):n}}
{const _br122=fc107Barra;fc107Barra=function(){const r=_br122.apply(this,arguments);try{const b=$("#cn102-bar .fc107-bmais");if(b)b.setAttribute("aria-label","Publicar outra coisa: notícia, De perto, análise ou pergunta")}catch(e){}return r}}
function dc122Nome(h){return typeof h==="string"&&h.indexOf("Relato")>=0?h.replace(/(class="cn102-lb cn102-lb-rel">)Relato</g,`$1${DC122_DP}<`).replace(/(<span class="vn-q-k">)Relato</g,`$1${DC122_DP}<`):h}
{const _q122=vn112Quote;vn112Quote=function(){return dc122Nome(_q122.apply(this,arguments))}}

/* ===== 1 e 2. reposts no Feed ===== */
/* repost sem comentário de uma publicação: o {k,id} citado */
function dc122Simples(x){const r=x&&typeof vn112Rp==="function"?vn112Rp(x):null;return r&&r.k==="pub"&&!String(x.texto||"").trim()?r:null}
/* o original, para quem lê: "ok" (pode ver), "fora" (indisponível) ou "esp" (ainda não se sabe; foi pedido ao banco) */
var DC122_ESP=new Set();
function dc122Orig(id){const x=vn112Pub(id);if(x)return {st:"ok",x};if(pubDe(id)||VN112_Q.has(id))return {st:"fora"};DC122_ESP.add(id);vn112Pede(id);return {st:"esp"}}
/* repost simples de outra pessoa cujo original não está disponível: some */
function dc122Some(x){const r=dc122Simples(x);return !!r&&x.autor!==S.uid&&dc122Orig(r.id).st!=="ok"}
const dc122Prim=u=>u===S.uid?"Você":String(nomeDe(u)||"").split(" ")[0];
function dc122Quem(us){us=us.filter(u=>u===S.uid).concat(us.filter(u=>u!==S.uid));const n=us.map(dc122Prim),v=n.length>1?"repostaram":"repostou";
  return (n.length===1?n[0]:n.length===2?n[0]+" e "+n[1]:n.length===3?n[0]+", "+n[1]+" e "+n[2]:n[0]+", "+n[1]+" e mais "+(n.length-2))+" "+v}
function dc122Feed(out){if(!Array.isArray(out)||!out.length)return out;const tira=new Set(),troca=new Map(),gr=new Map(),orig=new Map();
  out.forEach((p,i)=>{const x=p&&p.__pub;if(!x)return;const r=dc122Simples(x);
    if(!r){if(!orig.has(x.id))orig.set(x.id,i);return}
    const o=dc122Orig(r.id);if(o.st!=="ok"){if(x.autor!==S.uid)tira.add(i);return}
    if(!gr.has(r.id))gr.set(r.id,[]);gr.get(r.id).push(i)});
  gr.forEach((is,id)=>{const x=vn112Pub(id);if(!x)return;const rps=is.map(i=>out[i].__pub).sort((a,b)=>b.at-a.at),us=[...new Set(rps.map(y=>y.autor))];
    const io=orig.get(id),po=io!=null?out[io]:null,vis=pubVisiveis().some(y=>y.id===id);
    if(!vis){/* o original não veio na lista do app (antigo): fica o repost mais recente, com a linha se houver mais de um */
      const i0=is.find(i=>out[i].__pub===rps[0]);is.forEach(i=>{if(i!==i0)tira.add(i)});if(us.length>1)troca.set(i0,{...out[i0],__dc122:{us}});return}
    /* o original uma vez só: no lugar dele se está junto da notícia ("O que seus amigos acham"); senão, onde está o repost mais recente */
    const alvo=po&&po.__fc107?io:Math.min(...is,io!=null?io:Infinity);
    [...is,io].forEach(i=>{if(i!=null&&i!==alvo)tira.add(i)});
    troca.set(alvo,{...(po&&alvo===io?po:{}),id:"u:"+id,__pub:x,__dc122:{us}})});
  if(!tira.size&&!troca.size)return out;
  const res=[];out.forEach((p,i)=>{if(troca.has(i))res.push(troca.get(i));else if(!tira.has(i))res.push(p)});return res}
{const _pm122=pubMistura;pubMistura=function(lista){const out=_pm122.apply(this,arguments);try{return dc122Feed(out)}catch(e){console.error(e);return out}}}
/* a linha "Bia e Carla repostaram" em cima do original */
function dc122Linha(h,p){const us=p.__dc122.us;if(!us||!us.length||typeof h!=="string"||!h)return h;const a=vn112Tp(h);if(!a)return h;
  a.classList.add("dc122-rpd");const ln=`<p class="dc122-rpl">${VN112_IC.rp}<span>${esc(dc122Quem(us))}</span></p>`;
  const ref=a.querySelector(":scope>.ph");if(ref)ref.insertAdjacentHTML("beforebegin",ln);else a.insertAdjacentHTML("afterbegin",ln);return a.outerHTML}
{const _ps122=postSeguro;postSeguro=function(p){const h=_ps122.apply(this,arguments);try{if(p&&p.__dc122)return dc122Linha(h,p)}catch(e){}return h}}
/* perfil de outra pessoa: o repost simples indisponível também some (no próprio perfil fica) */
{const _pl122=pfLista;pfLista=function(u,aba){const l=_pl122.apply(this,arguments);try{if(aba==="posts"&&Array.isArray(l)&&u!==S.uid)return l.filter(x=>!(x&&x.autor===u&&dc122Some(x)))}catch(e){}return l}}
/* quando o banco responde sobre um original que faltava: redesenha (se apareceu) ou tira o que ficou indisponível */
{const _vb122=vn112Busca;vn112Busca=async function(){const r=await _vb122.apply(this,arguments);try{
    const ok=[...DC122_ESP].filter(id=>VN112_Q.has(id));ok.forEach(id=>DC122_ESP.delete(id));
    if(ok.some(id=>vn112Pub(id)))pubRedesenha();
    document.querySelectorAll(".upost.vn-rp-so").forEach(a=>{const x=pubDe(String(a.id).replace(/^p-u:/,""));if(x&&dc122Some(x))a.remove()})}catch(e){}return r}}

/* ===== 4. cartão A: quem postou primeiro em todo post de amigo ===== */
/* o gráfico da análise como foto do carrossel (o cartão colorido sai: título e texto ficam em cima) */
function dc122Grafico(x,cn){const nm=typeof cn102Primeiro==="function"?cn102Primeiro(x.autor):nomeDe(x.autor);
  const fo=cn.d.tipo==="ind"?"Indicador da edição do Prumo":cn.fu?"Fonte: "+((cn102Fonte(cn.fu)||{}).n||""):"Números informados por "+nm;
  return `<div class="sl up-sl cn102-sl cn102-dsl"><div class="cn102-cd">${cn102Svg(cn.d)}<p class="cn102-dfo">${esc(fo)}</p></div></div>`}
/* depois de tirar o cartão colorido: pontinhos e contador com o número novo de fotos; sem nada, a mídia sai */
function dc122Slides(a){const car=a.querySelector(":scope>.car");if(!car)return;const tr=car.querySelector(".track"),n=tr?tr.children.length:0;
  if(!n){car.remove();a.classList.remove("fc107-auto");return}
  const d=car.querySelector(".pdots")||a.querySelector(".acts .pdots");
  if(d){if(n>1)d.outerHTML=`<div class="prog pdots vn-dots" aria-hidden="true">${[...Array(n)].map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}<span class="pg">1/${n}</span></div>`;else d.remove()}
  const pg=car.querySelector(".vp99-pg");if(pg){if(n>1)pg.textContent="1/"+n;else pg.remove()}}
function dc122Hf(h,x){if(typeof h!=="string"||!h||!x||x.tipo!=="post"||typeof VN112_CT==="undefined"||VN112_CT!=="a")return h;
  const a=vn112Tp(h);if(!a||!a.classList.contains("vn-ca")||!a.classList.contains("upost")||a.classList.contains("ac117-rel")||a.classList.contains("dc122-hf"))return h;
  const ph=a.querySelector(":scope>.ph"),nm=ph&&ph.querySelector(".ph-nm");if(!ph||!nm)return h;
  a.classList.add("dc122-hf");const cn=typeof cn102De==="function"?cn102De(x):null,k=cn&&cn.k;
  /* 1. o cabeçalho vai para cima (o resto mantém a ordem) */
  const antes=[];for(let e=a.firstElementChild;e&&e!==ph;e=e.nextElementSibling)if(!e.matches(".fc107-gh,.dc122-rpl"))antes.push(e);
  if(antes.length)antes[0].before(ph);
  /* 2. embaixo do nome: quando, onde e "editado" (o repost simples continua com "repostou" na frente) */
  const sub=nm.querySelector(":scope>.ph-sub"),lb=sub&&sub.querySelector(".cn102-lb"),es=x.estilo||{};
  const st=sub?sub.textContent:"",ed=!!x.editado||/·\s*editado\s*$/.test(st),rpk=sub&&sub.querySelector(".vn-rpk");
  const meta=document.createElement("span");meta.className="ph-sub dc122-meta";
  meta.innerHTML=`${rpk?rpk.outerHTML:""}<span class="dc122-qd">${esc(quando(x.at))}</span>${es.local?`<span class="dc122-loc">${AC117_PIN}<span>${esc(es.local)}</span></span>`:""}${/com notícia/.test(st)?`<span>com notícia</span>`:""}${ed?`<span class="dc122-ed">editado</span>`:""}${(x.publico==="seguidores"||(sub&&sub.querySelector(".cs123-ps")))?`<span class="cs123-ps">seguidores</span>`:""}`;
  if(sub)sub.replaceWith(meta);else nm.appendChild(meta);
  /* 3. o texto: chapéu do tipo e título (Análise, Pergunta), depois o que a pessoa escreveu e a fonte */
  let corpo=a.querySelector(":scope>.vn-txt")||a.querySelector(":scope>.vn-rptx");
  if(k==="ana"||k==="enq"){const car=a.querySelector(":scope>.car"),card=k==="ana"&&car&&car.querySelector(".track>.cn102-ana");
    if(!corpo&&card){const ex=card.querySelector(".cn102-ex");if(ex){ex.classList.remove("cn102-ex");ex.classList.add("up-leg","vn-txt");corpo=ex}}
    const cab=document.createElement("div");cab.className="dc122-cab";
    cab.innerHTML=`<span class="cn102-lb cn102-lb-${k}">${esc(lb?lb.textContent:k==="ana"?"Análise":"Pergunta")}</span>${k==="ana"&&cn.tit?`<h3 class="dc122-tit">${esc(cn.tit)}</h3>`:""}`;
    ph.after(cab);if(corpo)cab.after(corpo);
    const fo=[...a.querySelectorAll(".cn102-fonte")];if(fo.length){const w=document.createElement("div");w.className="dc122-fo";fo.forEach(f=>{f.classList.remove("tb121-fonte");w.appendChild(f)});(corpo||cab).after(w)}
    if(card){if(cn.d&&!car.querySelector(".cn102-dsl"))card.insertAdjacentHTML("afterend",dc122Grafico(x,cn));card.remove();dc122Slides(a)}}
  if(corpo)corpo.classList.add("dc122-corpo");
  return a.outerHTML}
{const _pp122=pubPostHTML;pubPostHTML=function(x){let h=_pp122.apply(this,arguments);try{h=dc122Hf(h,x)}catch(e){}try{h=dc122Nome(h)}catch(e){}return h}}
if(typeof VISUAL_NOVO!=="undefined"&&VISUAL_NOVO&&typeof VN112_CT!=="undefined"&&VN112_CT==="a")document.documentElement.classList.add("dc122");
