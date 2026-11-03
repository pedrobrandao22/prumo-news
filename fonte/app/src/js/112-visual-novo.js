/* ---------- 112: visual novo (teste), com um pouco de X e de YouTube ----------
   Tudo atrás de uma chave, DESLIGADA por padrão (VISUAL_PADRAO). Liga por aparelho:
   - abrir o site com ?visual=novo (ou ?visual=atual para voltar), ou
   - Perfil › Conta › "Visual novo (teste)" (aparece para quem já ligou alguma vez neste aparelho e para os administradores).
   Com a chave ligada: topo com cartões verticais (no lugar das bolinhas), barra de chips (Tudo · Amigos · Política · Economia · Seguindo),
   post e notícia no ritmo do X (avatar na coluna da esquerda, texto antes da imagem, ações com números), Repostar e Repostar com comentário,
   perfil no estilo do X (faixa, avatar sobreposto, "no Prumo desde", abas Posts · Respostas · Mídia em lista) e os nomes "Giro" (stories)
   e "Coleções" (destaques). Desligada, nada disso é instalado (só a leitura dos reposts, ver abaixo).
   Repost sem SQL novo: é um post comum com estilo.rp={k:"pauta"|"pub",id}. Quem lê só vê a publicação citada se ela estiver visível para si
   (a regra do banco decide) e for "amigos"; senão aparece "Publicação indisponível". Esta leitura (cartão citado, aviso na Atividade e a
   miniatura no perfil) funciona com a chave ligada ou não, para quem estiver no visual atual não ver um post vazio.
   Nos testes automáticos fica tudo como antes, a não ser com localStorage "prumo-teste-visual"="1". */
const VISUAL_PADRAO="atual";
const VN112_ATIVO=(()=>{try{return !navigator.webdriver||localStorage.getItem("prumo-teste-visual")==="1"}catch(e){return !navigator.webdriver}})();
const VISUAL_NOVO=(()=>{if(!VN112_ATIVO)return false;try{
  const q=new URLSearchParams(location.search),v=q.get("visual");
  if(v==="novo"||v==="atual"){localStorage.setItem("prumo-visual",v);q.delete("visual");const s=q.toString();try{history.replaceState(history.state,"",location.pathname+(s?"?"+s:"")+location.hash)}catch(e){}}
  const g=localStorage.getItem("prumo-visual");return (g==="novo"||g==="atual"?g:VISUAL_PADRAO)==="novo"}catch(e){return VISUAL_PADRAO==="novo"}})();

/* ===== 1. repost: leitura (vale para todos) ===== */
const VN112_IC={rp:'<svg class="ico" viewBox="0 0 24 24"><path d="M7 7h9.5a2.5 2.5 0 0 1 2.5 2.5V12"/><path d="M10 4L7 7l3 3"/><path d="M17 17H7.5A2.5 2.5 0 0 1 5 14.5V12"/><path d="M14 20l3-3-3-3"/></svg>'};
var VN112_Q=new Map(),VN112_BUSCA=new Set();
function vn112Rp(x){const r=x&&x.tipo==="post"&&x.estilo&&x.estilo.rp;if(!r||typeof r!=="object")return null;const k=r.k==="pauta"||r.k==="pub"?r.k:"",id=String(r.id||"");
  if(!k||!id||id.length>200||(k==="pub"&&!/^[0-9a-f-]{36}$/i.test(id)))return null;return {k,id}}
/* a publicação citada, só se quem lê pode vê-la (pubVisiveis ou o que o banco devolveu) e se ela for para "amigos" */
function vn112Pub(id){const x=pubVisiveis().find(y=>y.id===id)||VN112_Q.get(id);if(!x||x.tipo!=="post"||x.arquivado||x.publico==="proximos")return null;if(x.autor!==S.uid&&!S.amigos.has(x.autor))return null;return x}
async function vn112Busca(){const ids=[...VN112_BUSCA].filter(id=>!VN112_Q.has(id));if(!ids.length||typeof SB==="undefined"||!SB||!S.uid)return;
  try{const r=await SB.from("publicacoes").select("*").in("id",ids);(r.data||[]).forEach(x=>{x.fotos=Array.isArray(x.fotos)?x.fotos:[];try{pubLimpa(x)}catch(e){}VN112_Q.set(x.id,x)});
    ids.forEach(id=>{if(!VN112_Q.has(id))VN112_Q.set(id,null)});await pubAssinar()}catch(e){ids.forEach(id=>VN112_Q.set(id,null))}
  document.querySelectorAll(".vn-q[data-vnqesp]").forEach(q=>{const id=q.dataset.vnqesp;q.outerHTML=vn112Quote({k:"pub",id})})}
var VN112_BT=0;function vn112Pede(id){if(VN112_Q.has(id))return;VN112_BUSCA.add(id);clearTimeout(VN112_BT);VN112_BT=setTimeout(vn112Busca,120)}
const vn112Corta=h=>String(h||"").replace(/<svg(?![^>]*preserveAspectRatio)/g,'<svg preserveAspectRatio="xMidYMid slice"');
const vn112Curto=(s,n)=>{s=String(s||"").trim();return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,"")+"…":s};
/* cartão citado (o "quote" do X) */
function vn112Quote(rp,snap){if(!rp)return "";
  if(rp.k==="pauta"){const p=pautaById(rp.id),sn=snap||{};const tit=p?versao(p,lente()).titulo:sn.titulo,sec=p?secOf(p):sn.secao||"politica";
    if(!tit)return `<div class="vn-q vn-q0"><b>Notícia indisponível</b><span>Ela saiu da edição do Prumo.</span></div>`;
    return `<button type="button" class="vn-q vn-qn" data-capmat="${esc(rp.id)}" aria-label="Notícia citada: ${esc(tit)}"><span class="vn-q-tx"><small style="color:${secCor(sec)}">${esc(secNome(sec))} · Prumo</small><b>${esc(tit)}</b></span>${p?vn112Corta(capaArte(p,"vn-q-art")):""}</button>`}
  const x=vn112Pub(rp.id);
  if(!x){if(!VN112_Q.has(rp.id)&&!pubDe(rp.id)){vn112Pede(rp.id);return `<div class="vn-q vn-q0" data-vnqesp="${esc(rp.id)}" aria-busy="true"><span>Carregando a publicação…</span></div>`}
    return `<div class="vn-q vn-q0" role="note"><b>Publicação indisponível</b><span>Ela foi apagada ou é de alguém que não está entre os seus amigos.</span></div>`}
  const r2=vn112Rp(x),cn=typeof cn102De==="function"?cn102De(x):null,f=x.fotos[0]&&pubUrl(x.fotos[0]),nt=x.pid&&pautaById(x.pid);
  let tx=String(x.texto||"").trim();if(cn&&cn.tit&&tx.indexOf(cn.tit)===0)tx=tx.slice(cn.tit.length).trim();
  const sub=r2&&!tx?`<span class="vn-q-k">${VN112_IC.rp}repostou</span>`:cn&&cn.k&&cn.k!=="nt"?`<span class="vn-q-k">${esc({ana:"Análise",rel:"Relato",enq:"Pergunta",opi:"Opinião"}[cn.k]||"")}</span>`:"";
  return `<div class="vn-q vn-qp" role="button" tabindex="0" data-vnqpub="${esc(x.id)}" aria-label="Publicação citada de ${esc(nomeDe(x.autor))}"><span class="vn-q-au">${avatar(x.autor)}<b>${esc(nomeDe(x.autor))}</b><i>· ${esc(quando(x.at))}</i></span>${sub}
    ${cn&&cn.tit?`<b class="vn-q-t">${esc(cn.tit)}</b>`:""}${tx?`<p>${esc(vn112Curto(tx,280))}</p>`:""}
    ${f?`<img class="vn-q-img" src="${pubSrc(f)}" alt="${esc((x.estilo.alt&&x.estilo.alt[0])||"Foto da publicação citada")}" loading="lazy" decoding="async">`:nt?`<span class="vn-q-nt"><small style="color:${secCor(secOf(nt))}">${esc(secNome(secOf(nt)))}</small>${esc(versao(nt,lente()).titulo)}</span>`:r2&&r2.k==="pauta"&&pautaById(r2.id)?`<span class="vn-q-nt">${esc(versao(pautaById(r2.id),lente()).titulo)}</span>`:""}</div>`}
function vn112RpHTML(h,x){const rp=vn112Rp(x);if(!rp||typeof h!=="string"||!h)return h;const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;
  const tx=String(x.texto||"").trim();a.classList.add("vn-rp");if(!tx)a.classList.add("vn-rp-so");
  const car=a.querySelector(":scope>.car");if(car)car.outerHTML=`<div class="vn-rpw">${tx?`<p class="vn-rptx">${dmMarcaPub(tx)}</p>`:""}${vn112Quote(rp,x.snap)}</div>`;
  a.querySelector(".up-leg")?.remove();
  const sub=a.querySelector(".ph-sub");if(sub&&!tx)sub.insertAdjacentHTML("afterbegin",`<span class="vn-rpk">${VN112_IC.rp}repostou</span> · `);
  return a.outerHTML}
{const _pp112=pubPostHTML;pubPostHTML=function(x){const h=_pp112.apply(this,arguments);try{return vn112RpHTML(h,x)}catch(e){return h}}}
/* perfil em grade: o repost mostra o que foi citado */
{const _pt112=pfTiles;pfTiles=function(l){let h=_pt112.apply(this,arguments);try{if(typeof h!=="string"||!(l||[]).some(vn112Rp))return h;const tp=document.createElement("template");tp.innerHTML=h;
  tp.content.querySelectorAll("[data-pfi]").forEach(b=>{const x=l[+b.dataset.pfi],rp=x&&vn112Rp(x),o=b.querySelector(".pf-tx");if(!rp||!o)return;const q=rp.k==="pauta"?pautaById(rp.id):vn112Pub(rp.id);
    const t=rp.k==="pauta"?(q?versao(q,lente()).titulo:(x.snap&&x.snap.titulo)||"Notícia"):q?(q.texto||"Publicação de "+nomeDe(q.autor)):"Publicação indisponível";
    o.outerHTML=`<span class="pf-tx vn-pfrp"><small>${VN112_IC.rp}${String(x.texto||"").trim()?"Citação":"Repost"}</small><b>${esc(vn112Curto(String(x.texto||"").trim()||t,90))}</b></span>`});h=tp.innerHTML}catch(e){}return h}}
/* Atividade: "Bia repostou sua publicação" */
function vn112AtRp(){const out=[];if(!S.uid)return out;const ag=Date.now();
  pubVisiveis().forEach(x=>{const rp=vn112Rp(x);if(!rp||rp.k!=="pub"||x.autor===S.uid||ag-x.at>30*864e5)return;const o=pubDe(rp.id);if(!o||o.autor!==S.uid)return;const com=!!String(x.texto||"").trim();
    out.push({k:"vn112:"+x.id,at:x.at,us:[x.autor],ic:"↻",txt:`<b>${esc(nomeDe(x.autor))}</b> repostou sua publicação${com?`: “${esc(vn112Curto(x.texto,80))}”`:""}`,pub:rp.id,acao:"vnrp",vnrp:x.id})});return out}
{const _ai112=atItens;atItens=function(){const it=_ai112.apply(this,arguments);try{if(!Array.isArray(it))return it;const n=vn112AtRp();if(!n.length)return it;return it.concat(n).sort((a,b)=>(b.fixo||0)-(a.fixo||0)||b.at-a.at).slice(0,80)}catch(e){return it}}}
{const _aa112=atAcao;atAcao=function(x){if(x&&x.acao==="vnrp"){const id=x.vnrp;if($("#layer .pfv-at"))closeLayer();setTimeout(()=>vn112AbrePub(id),320);return}return _aa112.apply(this,arguments)}}
/* abre uma publicação (a citada ou o repost) numa camada, como no perfil */
function vn112AbrePub(id){const x=pubVisiveis().find(y=>y.id===id)||vn112Pub(id);if(!x){toast("Esta publicação não está disponível para você (ou já foi apagada).");return}
  if($("#layer").innerHTML)closeLayer();PFV={u:x.autor,aba:"posts",modo:"posts",lista:[x],i:0,daGrade:false};$("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Publicação"></div>`;if(pushH())HST++;pfvDesenha()}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("[data-vnqpub]");if(!b||t.closest("a,[data-capmat]"))return;e.stopPropagation();e.preventDefault();vn112AbrePub(b.dataset.vnqpub)},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const b=e.target&&e.target.closest&&e.target.closest("[data-vnqpub]");if(!b)return;e.preventDefault();vn112AbrePub(b.dataset.vnqpub)});

/* ===== 2. a chave em Perfil › Conta ===== */
function vn112VeChave(){try{return localStorage.getItem("prumo-visual")!=null||(S.uid&&(S.membros[S.uid]||{}).papel==="admin")}catch(e){return false}}
function vn112Chave(){const m=$("#v-me .pf-conta .card.menu")||$("#v-me .card.menu");if(!m||m.querySelector("[data-vntroca]")||!vn112VeChave())return;
  m.insertAdjacentHTML("afterbegin",`<button type="button" data-vntroca role="switch" aria-checked="${VISUAL_NOVO}" aria-label="Visual novo (teste): ${VISUAL_NOVO?"ligado":"desligado"}"><span>Visual novo (teste)</span><em class="vn-sw${VISUAL_NOVO?" on":""}" aria-hidden="true"><i></i></em></button>`)}
if(VN112_ATIVO){
  {const _rm112c=renderMe;renderMe=function(){const r=_rm112c.apply(this,arguments);try{vn112Chave()}catch(e){}return r}}
  document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-vntroca]");if(!b)return;e.stopPropagation();e.preventDefault();
    try{localStorage.setItem("prumo-visual",VISUAL_NOVO?"atual":"novo")}catch(_){toast("Não deu para guardar a escolha neste aparelho.");return}
    b.setAttribute("aria-checked",String(!VISUAL_NOVO));b.querySelector(".vn-sw")?.classList.toggle("on",!VISUAL_NOVO);toast(VISUAL_NOVO?"Voltando ao visual atual…":"Ligando o visual novo…");setTimeout(()=>{try{location.reload()}catch(_){}},450)},true);
}

/* ===== 3. nomes: "Giro" no lugar de stories e "Coleções" no lugar de destaques (só o que a pessoa lê) ===== */
const VN112_NOMES=[[/\bNovo destaque\b/g,"Nova coleção"],[/\bnovo destaque\b/g,"nova coleção"],[/\bCriar destaque\b/g,"Criar coleção"],[/\bApagar destaque\b/g,"Apagar coleção"],[/\bNome do destaque\b/g,"Nome da coleção"],
  [/\bDestaque criado\b/g,"Coleção criada"],[/\bDestaque apagado\b/g,"Coleção apagada"],[/\bEste destaque está vazio\b/g,"Esta coleção está vazia"],[/\bUm destaque precisa\b/g,"Uma coleção precisa"],
  [/\bsegure o destaque\b/g,"segure a coleção"],[/\bdo destaque agora\b/g,"da coleção agora"],[/\bsalvar o destaque\b/g,"salvar a coleção"],[/\bcriar o destaque\b/g,"criar a coleção"],[/\bnum destaque\b/g,"numa coleção"],[/\bfora de destaques\b/g,"fora de coleções"],
  [/^\s*Destaques\s*$/g,"Coleções"],[/^\s*Destaque\s*$/g,"Coleção"],[/^\s*Destacar\s*$/g,"Pôr numa coleção"],
  [/\bSTORIES\b/g,"GIROS"],[/\bSTORY\b/g,"GIRO"],[/\bStories\b/g,"Giros"],[/\bstories\b/g,"giros"],[/\bStory\b/g,"Giro"],[/\bstory\b/g,"giro"]];
const VN112_NOMES_T=/[Ss]tor(y|ies)|STOR(Y|IES)|[Dd]estaq|Destacar/;
/* não mexe no conteúdo (notícias, posts, mensagens, comentários): só nos rótulos do app */
const VN112_NOMES_FORA=".ss,.cv,.mat,.txs,.up-leg,.up-tx,.cmt,.cmts,.cn102-cd,.fc107-tl,.vn-q,.vn-rptx,.dm-msgs,.dm-b,.dm-l,.post:not(.upost),#v-capa,#v-busca,.pt-cap,.sg-c,.lead,textarea,input,[contenteditable],script,style";
const VN112_NOMES_FORA_A=VN112_NOMES_FORA.replace(",textarea,input,[contenteditable]","");
function vn112Troca(s){let o=s;VN112_NOMES.forEach(([r,v])=>{o=o.replace(r,v)});return o}
function vn112Nomes(root){if(!root||!VISUAL_NOVO)return;try{
  const pode=el=>!!el&&!(el.closest&&el.closest(VN112_NOMES_FORA))&&!(el.closest&&el.closest(".story")&&!el.closest("button,[role=button],.sg-who,.sg-a"));
  const troca=n=>{if(!VN112_NOMES_T.test(n.nodeValue)||!pode(n.parentElement))return;const v=vn112Troca(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v};
  if(root.nodeType===3){troca(root);return}
  if(root.nodeType!==1||(root.closest&&root.closest(VN112_NOMES_FORA)))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;const l=[];while(n=w.nextNode())if(VN112_NOMES_T.test(n.nodeValue))l.push(n);l.forEach(troca);
  vn112NomesAttr(root)}catch(e){}}
function vn112NomesAttr(root){try{const pode=el=>!(el.closest&&el.closest(VN112_NOMES_FORA_A));
  [root,...root.querySelectorAll("[aria-label],[placeholder],[title]")].forEach(el=>{if(!pode(el))return;["aria-label","placeholder","title"].forEach(a=>{const v=el.getAttribute&&el.getAttribute(a);if(v&&VN112_NOMES_T.test(v)){const nv=vn112Troca(v);if(nv!==v)el.setAttribute(a,nv)}})})}catch(e){}}

/* ===== 4. topo: cartões verticais no lugar das bolinhas ===== */
function vn112Visto(sec){try{const r=igLista(sec);if(sec==="_ult")return r.itens.every(x=>ULT_VISTOS.has(ultKey(x)));return r.ps.length&&r.ps.every(p=>SEEN.has(seenKey(p)))}catch(e){return false}}
function vn112Primeira(sec){try{const r=igLista(sec);if(sec==="_ult"){const i=r.itens.find(x=>!ULT_VISTOS.has(ultKey(x)))||r.itens[0];return i?{p:pautaById(i.pid),t:i.txt||""}:null}
  const p=r.ps.find(p=>!SEEN.has(seenKey(p)))||r.ps[0];return p?{p,t:versao(p,lente()).titulo}:null}catch(e){return null}}
function vn112Tiles(){const box=$("#secs");if(!box)return;box.classList.add("vn-tiles");
  box.querySelectorAll(":scope>.sb.ig-s").forEach(b=>{if(b.querySelector(".vn-tl"))return;const r=b.querySelector(".ig-r");if(!r)return;let art="",tit="",kick=(b.querySelector(":scope>b")||{}).textContent||"",visto=r.classList.contains("visto"),cls="";
    if(b.hasAttribute("data-meustory")){cls="vn-tl-eu";const st=pubStoriesDe(S.uid);const x=st[st.length-1];if(x){const f=x.fotos[0]&&pubUrl(x.fotos[0]);art=f?`<img src="${pubSrc(f)}" alt="" loading="lazy">`:`<i class="vn-tl-fd" style="background:${pubFundo(x.estilo&&x.estilo.fundo)}"></i>`}tit=st.length?"":"Conte o que viu"}
    else if(b.dataset.ustory){cls="vn-tl-u";const st=pubStoriesDe(b.dataset.ustory);const x=st.find(y=>!PUB_VISTOS.has(y.id))||st[st.length-1];visto=st.length&&st.every(y=>PUB_VISTOS.has(y.id));
      if(x){const f=x.fotos[0]&&pubUrl(x.fotos[0]),nt=x.pid&&pautaById(x.pid);art=f?`<img src="${pubSrc(f)}" alt="" loading="lazy">`:nt?capaArte(nt,"vn-tl-art"):`<i class="vn-tl-fd" style="background:${pubFundo(x.estilo&&x.estilo.fundo)}"></i>`;tit=nt?versao(nt,lente()).titulo:vn112Curto(x.texto,60)}}
    else if(b.hasAttribute("data-5min")){cls="vn-tl-5";const a=vn112Primeira("_5min");if(a&&a.p)art=capaArte(a.p,"vn-tl-art");tit="O dia em 5 minutos";visto=false}
    else if(b.hasAttribute("data-ultimas")){cls="vn-tl-ult";const a=vn112Primeira("_ult");tit=a?vn112Curto(a.t,70):"";visto=vn112Visto("_ult")}
    else if(b.dataset.dest){const p=pautaById(b.dataset.dest);if(p){art=capaArte(p,"vn-tl-art");tit=vn112Curto(versao(p,lente()).titulo,70);visto=SEEN.has(seenKey(p))}cls="vn-tl-dest"}
    else if(b.dataset.secStory){const s=b.dataset.secStory,a=vn112Primeira(s);if(a&&a.p)art=capaArte(a.p,"vn-tl-art");tit=a?vn112Curto(a.t,70):"";visto=vn112Visto(s)}
    else return;
    const av=cls==="vn-tl-u"||cls==="vn-tl-eu"?(b.querySelector(".av")||{}).outerHTML||"":"";
    r.insertAdjacentHTML("beforeend",`<span class="vn-tl ${cls}" aria-hidden="true"><span class="vn-tl-bg">${vn112Corta(art)}</span>${av?`<span class="vn-tl-av">${av}</span>`:""}<span class="vn-tl-tx"><small>${esc(kick)}</small>${tit?`<b>${esc(tit)}</b>`:""}</span></span>`);
    b.classList.add("vn-tb");b.classList.toggle("vn-visto",!!visto)});
  vn112Nomes(box)}

/* ===== 5. chips do Feed (Tudo · Amigos · Política · Economia · Seguindo) ===== */
var VN112_CHIP=(()=>{try{return sessionStorage.getItem("prumo-vn-chip")||"tudo"}catch(e){return "tudo"}})(),VN112_CHIP0=true;
const VN112_CHIPS=[["tudo","Tudo"],["amigos","Amigos"],["politica","Política"],["economia","Economia"],["seguindo","Seguindo"]];
function vn112ChipAtual(){if(FILTRO==="tudo")return ["amigos","seguindo"].includes(VN112_CHIP)?VN112_CHIP:"tudo";return FILTRO==="politica"||FILTRO==="economia"?FILTRO:""}
function vn112ChipsHTML(){const at=vn112ChipAtual(),eu=!!(S.uid&&S.membro);
  return VN112_CHIPS.filter(([k])=>(k!=="amigos"||eu)&&(!(k==="politica"||k==="economia")||pautasDa(k).length)).map(([k,n])=>`<button type="button" class="vn-chip" data-vnchip="${k}" aria-pressed="${at===k}">${n}</button>`).join("")}
function vn112Chips(){const v=$("#v-feed");if(!v)return;let bar=$("#vn-chips");
  if(!bar){bar=document.createElement("div");bar.id="vn-chips";bar.className="vn-chips";bar.setAttribute("role","group");bar.setAttribute("aria-label","Filtrar o Feed");const s=$("#secs");if(s)s.after(bar);else v.prepend(bar)}
  const h=vn112ChipsHTML();if(bar.innerHTML!==h)bar.innerHTML=h;v.classList.toggle("vn-ch-amigos",vn112ChipAtual()==="amigos");v.classList.toggle("vn-ch-seguindo",vn112ChipAtual()==="seguindo");
  try{document.documentElement.style.setProperty("--vn-top",(($("header.top")||{}).offsetHeight||52)+"px")}catch(e){}}
function vn112Filtra(out){if(FILTRO!=="tudo"||!Array.isArray(out))return out;const c=VN112_CHIP;if(c!=="amigos"&&c!=="seguindo")return out;
  const solto=p=>p&&p.__fc107?{id:p.id,__pub:p.__pub}:p;
  if(c==="amigos")return out.filter(p=>p&&p.__pub).map(solto);
  return out.filter(p=>{if(!p)return false;if(p.__pub){const q=p.__pub.pid&&pautaById(p.__pub.pid);return !!(q&&seguido(q))}return seguido(p)}).map(p=>p.__fc107&&!seguido(pautaById(p.__pub.pid)||{})?solto(p):p)}
function vn112ChipVai(k){if(k==="politica"||k==="economia"){FILTRO=k;VN112_CHIP=k}else{FILTRO="tudo";VN112_CHIP=k}try{sessionStorage.setItem("prumo-vn-chip",k)}catch(e){}uso("vn_chip_"+k);
  renderPosts();try{renderFilters&&renderFilters()}catch(e){}const bar=$("#vn-chips");if(bar){const y=bar.getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vn-top"))||52);if(scrollY>y)scrollTo(0,Math.max(0,y))}
  const b=$(`#vn-chips [data-vnchip="${k}"]`);if(b){try{b.scrollIntoView({block:"nearest",inline:"nearest"})}catch(e){}}}

/* ===== 6. post e notícia no ritmo do X ===== */
function vn112BtRp(k,id){return `<button type="button" class="act vn-rpb" data-vnrp="${esc(k+":"+id)}" aria-label="Repostar">${VN112_IC.rp}<span>Repostar</span><em class="cnt" data-n="vnrp"></em></button>`}
function vn112NRp(k,id){let n=0,eu=false;pubVisiveis().forEach(x=>{const r=vn112Rp(x);if(r&&r.k===k&&r.id===id){n++;if(x.autor===S.uid)eu=true}});return {n,eu}}
function vn112MeuRp(k,id){return pubVisiveis().find(x=>{const r=vn112Rp(x);return x.autor===S.uid&&r&&r.k===k&&r.id===id&&!String(x.texto||"").trim()})||null}
function vn112XPub(h,x){const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a||!x)return h;a.classList.add("vn-x");
  const leg=a.querySelector(":scope>.gut>.up-leg"),car=a.querySelector(":scope>.car");
  if(leg){const nb=leg.querySelector(":scope>b:first-child");if(nb){const t=nb.nextSibling;nb.remove();if(t&&t.nodeType===3)t.textContent=t.textContent.replace(/^\s+/,"")}leg.classList.add("vn-txt");if(car)car.before(leg);else a.querySelector(":scope>.ph")?.after(leg)}
  const tr=car&&car.querySelector(".track");if(tr&&tr.children.length===1&&tr.firstElementChild.classList.contains("up-tx")){const p=tr.firstElementChild.querySelector("p");car.outerHTML=`<p class="up-leg vn-txt vn-so">${p?p.innerHTML:""}</p>`}
  vn112Dots(a);const cm=a.querySelector('.acts [data-a="cmt"]');if(cm&&!a.querySelector("[data-vnrp]")&&!a.classList.contains("sem-com")){const r=vn112Rp(x);const alvo=r&&!String(x.texto||"").trim()?r:{k:"pub",id:x.id};cm.insertAdjacentHTML("afterend",vn112BtRp(alvo.k,alvo.id))}
  return a.outerHTML}
function vn112XNt(h,p){const tp=document.createElement("template");tp.innerHTML=h.trim();const a=tp.content.firstElementChild;if(!a)return h;a.classList.add("vn-x","vn-xn");
  const car=a.querySelector(":scope>.car"),cap=a.querySelector(".pt-cap"),hr=a.querySelector(".pt-hora"),sub=a.querySelector(".ph-sub");
  if(sub&&hr&&hr.textContent.trim())sub.insertAdjacentHTML("beforeend",`<span class="vn-hr">${sub.textContent.trim()?" · ":""}${esc(hr.textContent.trim())}</span>`);
  const tit=versao(p,lente()).titulo;if(car&&tit){car.insertAdjacentHTML("beforebegin",`<h3 class="vn-tit"><button type="button" data-capmat="${esc(p.id)}">${esc(tit)}</button></h3>`);if(cap)car.before(cap)}
  vn112Dots(a);const cm=a.querySelector('.acts [data-a="cmt"]');if(cm)cm.insertAdjacentHTML("afterend",vn112BtRp("pauta",p.id));return a.outerHTML}
/* os pontinhos do carrossel vão para cima da mídia (a fileira de ações fica só com as ações) */
function vn112Dots(a){const pr=a.querySelector(".acts>.prog"),car=a.querySelector(":scope>.car");if(pr&&car){pr.classList.add("vn-dots");car.appendChild(pr)}}
function vn112Social(pid){const el=document.getElementById("p-"+pid);if(!el||!el.classList.contains("vn-x"))return;try{const {likes,cm}=socialOf(pid);
  const l=el.querySelector('.acts [data-n="like"]'),c=el.querySelector('.acts [data-n="cmt"]');if(l)l.textContent=likes.length||"";if(c)c.textContent=cm.length||"";
  const b=el.querySelector(".acts [data-vnrp]");if(b){const [k,...r]=b.dataset.vnrp.split(":"),{n,eu}=vn112NRp(k,r.join(":"));const e=b.querySelector("em");if(e)e.textContent=n||"";b.classList.toggle("on",eu);b.setAttribute("aria-pressed",String(eu))}}catch(e){}}

/* ===== 7. repostar ===== */
function vn112Alvo(k,id){if(k==="pub"){let x=pubDe(id)||vn112Pub(id);if(!x)return null;const r=vn112Rp(x);if(r&&!String(x.texto||"").trim()){k=r.k;id=r.id;x=k==="pub"?vn112Pub(id):null;if(k==="pub"&&!x)return null}
    if(k==="pub"&&(x.publico==="proximos"||x.tipo!=="post"))return {k,id,x,bloq:true};return {k,id,x}}
  return pautaById(id)?{k,id}:null}
function vn112Menu(k,id){if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}const a=vn112Alvo(k,id);
  if(!a){toast("Esta publicação não está disponível para repostar.");return}
  if(a.bloq){toast(`Este post é só para os Melhores amigos de ${String(nomeDe(a.x.autor)).split(" ")[0]}: não dá para repostar.`);return}
  const meu=vn112MeuRp(a.k,a.id),ref=esc(a.k+":"+a.id);
  sheet("Repostar",`<div class="opt vn-rpo">${meu?`<button type="button" data-vnrpdes="${esc(meu.id)}">Desfazer repost<span>Sai do seu perfil e do Feed dos seus amigos</span></button>`:`<button type="button" data-vnrpja="${ref}">${VN112_IC.rp}Repostar<span>Seus amigos veem no Feed, com o seu nome</span></button>`}<button type="button" data-vnrpcom="${ref}">Repostar com comentário<span>${a.k==="pauta"?"Escreva o que você acha da notícia":"A publicação aparece dentro do seu post"}</span></button></div>`)}
async function vn112Publica(k,id,texto){const row={autor:S.uid,tipo:"post",at:Date.now(),texto:String(texto||"").slice(0,2200),fotos:[],pid:null,snap:k==="pauta"?pubSnap(id):null,estilo:{v:2,rp:{k,id}}};
  try{const r=await SB.from("publicacoes").insert(row).select("id");if(r.error)throw r.error;uso(texto?"vn_citar":"vn_repostar");await pubCarregar();try{pubRedesenha()}catch(e){}return true}
  catch(e){toast("Não deu para repostar agora.");return false}}
function vn112Compor(k,id){if(k==="pauta"&&typeof cn102Comeca==="function"){closeLayer();setTimeout(()=>cn102Comeca("nt",{pid:id}),60);return}
  const ref=esc(k+":"+id);closeLayer();setTimeout(()=>{sheet("Repostar com comentário",`<label class="vn-rpl" for="vn-rpt">Seu comentário</label><textarea class="field vn-rpt" id="vn-rpt" rows="4" maxlength="2000" placeholder="O que você acrescenta?"></textarea><div class="vn-rpprev">${vn112Quote({k,id})}</div>`,`<button type="button" class="btn" data-vnrppub="${ref}">Publicar</button>`);
    setTimeout(()=>{try{$("#vn-rpt")?.focus({preventScroll:true})}catch(e){}},80)},60)}
document.addEventListener("click",async e=>{if(!VISUAL_NOVO)return;const t=e.target;if(!t||!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()};
  if(b=t.closest("[data-vnchip]")){pare();vn112ChipVai(b.dataset.vnchip);return}
  if(b=t.closest("[data-vnrp]")){pare();const [k,...r]=b.dataset.vnrp.split(":");vn112Menu(k,r.join(":"));return}
  if(b=t.closest("[data-vnrpja]")){pare();if(b.disabled)return;b.disabled=true;const [k,...r]=b.dataset.vnrpja.split(":");const ok=await vn112Publica(k,r.join(":"),"");if(ok){closeLayer();toast("Repostado")}else b.disabled=false;return}
  if(b=t.closest("[data-vnrpdes]")){pare();if(b.disabled)return;b.disabled=true;const ok=await pubApagar(b.dataset.vnrpdes,true);closeLayer();if(ok){toast("Repost desfeito");await pubCarregar()}return}
  if(b=t.closest("[data-vnrpcom]")){pare();const [k,...r]=b.dataset.vnrpcom.split(":");vn112Compor(k,r.join(":"));return}
  if(b=t.closest("[data-vnrppub]")){pare();if(b.disabled)return;const tx=($("#vn-rpt")?.value||"").trim();if(!tx){toast("Escreva um comentário (ou use Repostar).");$("#vn-rpt")?.focus();return}
    b.disabled=true;const [k,...r]=b.dataset.vnrppub.split(":");const ok=await vn112Publica(k,r.join(":"),tx);if(ok){closeLayer();toast("Publicado")}else b.disabled=false;return}
  if(b=t.closest("[data-vnpfaba]")){pare();vn112PfAba(b.dataset.vnpfaba,!!t.closest("#layer .pfv"));return}
  if(b=t.closest("[data-vnmid]")){pare();vn112AbrePub(b.dataset.vnmid);return}
  if(b=t.closest("[data-vnresp]")){pare();const pid=b.dataset.vnresp;if($("#layer").innerHTML)closeLayer();setTimeout(()=>{try{openComments(pid)}catch(_){}},60);return}},true);

/* ===== 8. perfil no estilo do X ===== */
var VN112_PF={me:"posts"};
function vn112Desde(u){const at=(S.membros[u]||{}).at;if(!at)return "";const d=new Date(at);if(isNaN(d))return "";return "No Prumo desde "+d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
function vn112Cor(u){const h=avatar(u),m=/background:\s*(#[0-9a-f]{3,8})/i.exec(h);return m?m[1]:corDe(u)}
function vn112Abas(u,ab,eu,orig){const l=[["posts","Posts"],["resp","Respostas"],["midia","Mídia"]];
  if(orig.includes("marc")&&pfLista(u,"marc").length)l.push(["marc","Marcado"]);if(eu&&orig.includes("salvos"))l.push(["salvos","Salvos"]);if(eu&&orig.includes("arq8"))l.push(["arq8","Arquivo"]);
  return `<div class="vn-abas" role="tablist" aria-label="Conteúdo do perfil">${l.map(([k,n])=>`<button type="button" role="tab" data-vnpfaba="${k}" aria-selected="${ab===k}">${n}</button>`).join("")}${eu?`<button type="button" role="tab" class="vn-aba-ct" data-vnpfaba="conta" aria-selected="${ab==="conta"}" aria-label="Conta e ajustes"><svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/></svg></button>`:""}</div>`}
function vn112Resp(u){const l=todosComentarios().filter(c=>c.uid===u).sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,60);
  if(!l.length)return `<div class="pf-vz"><b>Respostas</b><span>${u===S.uid?"Seus comentários nas notícias e nas publicações aparecem aqui.":"Nenhum comentário ainda."}</span></div>`;
  return `<ul class="vn-resp">${l.map(c=>{const m=/^u:(.+)$/.exec(String(c.pid||"")),p=!m&&pautaById(c.pid),x=m&&(pubVisiveis().find(y=>y.id===m[1]));const ctx=p?versao(p,lente()).titulo:x?"publicação de "+nomeDe(x.autor):"";
    return `<li><button type="button" data-vnresp="${esc(c.pid)}">${avatar(u)}<span class="vn-resp-c"><span class="vn-resp-h"><b>${esc(nomeDe(u))}</b><i>· ${esc(quando(c.at))}</i></span>${ctx?`<small>Em resposta a ${p?"“"+esc(vn112Curto(ctx,90))+"”":esc(ctx)}</small>`:""}<span class="vn-resp-t">${esc(vn112Curto(c.texto,400))}</span></span></button></li>`}).join("")}</ul>`}
function vn112Midia(u){const l=pfLista(u,"posts").filter(x=>x.fotos.length);if(!l.length)return `<div class="pf-vz"><b>Mídia</b><span>${u===S.uid?"As fotos que você publicar aparecem aqui.":"Nenhuma foto ainda."}</span></div>`;
  return `<div class="pf-grade vn-mid">${l.map(x=>{const f=pubUrl(x.fotos[0]);return `<button type="button" class="pf-t" data-vnmid="${esc(x.id)}" aria-label="Foto de ${esc(quando(x.at))}">${f?`<img src="${pubSrc(f)}" alt="${esc((x.estilo.alt&&x.estilo.alt[0])||x.texto||"Foto")}" loading="lazy" decoding="async">`:""}${x.fotos.length>1?`<i class="pf-ic">⧉</i>`:""}</button>`}).join("")}</div>`}
function vn112Posts(u){const l=pfLista(u,"posts");const ch=typeof fc107PfChips==="function"&&FOCO_LIGADO?fc107PfChips(u):"";
  if(!l.length)return ch+pfTiles([],"posts",u);return `${ch}<div class="vn-pl">${l.map(x=>{try{return pubPostHTML(x)}catch(e){return ""}}).join("")}</div>`}
function vn112PfAba(k,camada){const proprio=["posts","resp","midia"].includes(k);
  if(camada){if(!PFV)return;PFV.vnAba=k;PFV.aba=proprio?"posts":k;pfvDesenha();const sc=$("#layer .pfv-sc"),ab=sc&&sc.querySelector(".vn-abas");if(sc&&ab&&sc.scrollTop>ab.offsetTop)sc.scrollTop=ab.offsetTop;return}
  VN112_PF.me=k;PF_ABA=proprio?"posts":k;renderMe();const ab=$("#v-me .vn-abas");if(ab){const y=ab.getBoundingClientRect().top+scrollY-60;if(scrollY>y)scrollTo(0,y)}}
/* troca cabeçalho, abas e corpo do perfil (próprio ou de amigo) mantendo os botões e o avatar originais */
function vn112Pf(root,u,ab){if(!root||!u)return;const eu=u===S.uid,cab=root.querySelector(".pf-cab");if(!cab||root.querySelector(".vn-pf"))return;
  const avb=cab.querySelector(".pf-av"),bts=root.querySelector(".pf-bts"),num=cab.querySelector(".pf-num"),abas=root.querySelector(".pf-abas");
  const orig=abas?[...abas.querySelectorAll("[data-pfaba]")].map(b=>b.dataset.pfaba):[];
  const n=pfLista(u,"posts").length,na=amigosL().length,cm=!eu&&S.comuns?S.comuns[u]:null,ds=vn112Desde(u);
  const f=(S.membros[u]||{}).foto&&avb&&avb.querySelector("img");
  const h=document.createElement("div");h.className="vn-pf";h.style.setProperty("--vn-band",vn112Cor(u));
  h.innerHTML=`<div class="vn-pf-band" aria-hidden="true">${f?`<img src="${esc(f.getAttribute("src"))}" alt="">`:""}</div><div class="vn-pf-row"></div><h2 class="vn-pf-nome">${esc(nomeDe(u))}</h2>${ds?`<p class="vn-pf-desde"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>${esc(ds)}</p>`:""}
    <p class="vn-pf-num">${eu?`<span role="button" tabindex="0" data-fd104am aria-label="${na} ${na===1?"amigo":"amigos"}: ver a lista"><b>${na}</b> ${na===1?"amigo":"amigos"}</span>`:cm!=null?`<span><b>${cm}</b> ${cm===1?"amigo em comum":"amigos em comum"}</span>`:""}<span><b>${n}</b> ${n===1?"publicação":"publicações"}</span></p>`;
  const row=h.querySelector(".vn-pf-row");if(avb)row.appendChild(avb);if(bts){if(bts.children.length>1)h.appendChild(bts);else row.appendChild(bts)}
  cab.before(h);cab.remove();root.querySelector(".pf-nome")?.remove();num?.remove();
  const meu=["posts","resp","midia"].includes(ab);
  if(abas)abas.outerHTML=vn112Abas(u,ab,eu,orig);
  if(meu){root.querySelectorAll(".fc107-pk,.pf-grade,.pf-vz").forEach(e=>{if(!e.closest(".pf-ped"))e.remove()});
    const corpo=root.querySelector(".pf-corpo")||root.querySelector(".vn-abas");const html=ab==="resp"?vn112Resp(u):ab==="midia"?vn112Midia(u):vn112Posts(u);
    if(corpo.classList.contains("pf-corpo"))corpo.insertAdjacentHTML("beforeend",html);else corpo.insertAdjacentHTML("afterend",html);
    if(ab==="posts"){const l=pfLista(u,"posts");if(!eu||VIEW==="me")try{pfIdsTroca(l)}catch(e){}const pl=root.querySelector(".vn-pl");if(pl){try{wireTracks(pl)}catch(e){}l.forEach(x=>{try{updateSocial("u:"+x.id)}catch(e){}})}}}
  vn112Nomes(root)}

/* ===== 9. instala ===== */
if(VISUAL_NOVO){
  document.documentElement.classList.add("vn");
  /* topo */
  {const _rs112=renderSecs;renderSecs=function(){const r=_rs112.apply(this,arguments);try{vn112Tiles();vn112Chips()}catch(e){console.error(e)}return r}}
  /* Feed: chips */
  {const _pm112=pubMistura;pubMistura=function(lista){const out=_pm112.apply(this,arguments);try{return vn112Filtra(out)}catch(e){return out}}}
  {const _rp112=renderPosts;renderPosts=function(){if(VN112_CHIP0){VN112_CHIP0=false;if((VN112_CHIP==="politica"||VN112_CHIP==="economia")&&FILTRO==="tudo"&&pautasDa(VN112_CHIP).length)FILTRO=VN112_CHIP}
    if(FILTRO!=="tudo"&&FILTRO!==VN112_CHIP)VN112_CHIP=FILTRO==="politica"||FILTRO==="economia"?FILTRO:"tudo";
    const r=_rp112.apply(this,arguments);try{vn112Chips();const c=vn112ChipAtual();if((c==="amigos"||c==="seguindo")&&!$("#posts .post")){const e=$("#posts .empty");if(e)e.innerHTML=c==="amigos"?`<b>Nada dos seus amigos ainda</b>Quando eles publicarem ou repostarem, aparece aqui.<button type="button" class="btn ghost" data-vnchip="tudo" style="margin-top:10px">Ver tudo</button>`:`<b>Nada do que você segue nesta edição</b>Na página de uma cobertura, toque em “Seguir cobertura”.<button type="button" class="btn ghost" data-vnchip="tudo" style="margin-top:10px">Ver tudo</button>`}}catch(e){}return r}}
  addEventListener("resize",()=>{try{document.documentElement.style.setProperty("--vn-top",(($("header.top")||{}).offsetHeight||52)+"px")}catch(e){}});
  /* post e notícia */
  {const _pp112x=pubPostHTML;pubPostHTML=function(x){const h=_pp112x.apply(this,arguments);try{return typeof h==="string"&&h&&x&&x.tipo==="post"?vn112XPub(h,x):h}catch(e){return h}}}
  {const _ps112=postSeguro;postSeguro=function(p){let h=_ps112.apply(this,arguments);try{if(typeof h==="string"&&h&&p&&!p.__pub&&pautaById(p.id))return vn112XNt(h,p);
    /* 107 escreve o título do comentário único entre aspas duplas (sai "${esc(...)}" na tela); aqui sai o nome */
    if(typeof h==="string"&&p&&p.__fc107&&p.__pub&&h.indexOf("${esc(fc107Prim(x.autor))}")>=0)h=h.replace("${esc(fc107Prim(x.autor))}",esc(fc107Prim(p.__pub.autor)))}catch(e){}return h}}
  /* notícia: o cartão de mídia fica mais baixo (a manchete já está em cima) */
  {const _ft112=fitTrack;fitTrack=function(t){const r=_ft112.apply(this,arguments);try{if(t&&t.closest&&t.closest(".vn-xn")){const w=t.clientWidth;if(w){t.style.setProperty("--slh",Math.max(260,Math.round(Math.min(w*.98,innerHeight*.6)))+"px");try{if(typeof ssCaber==="function")ssCaber(t)}catch(e){}const s=t.children[r|0];if(s&&s.offsetHeight>0)t.style.height=s.offsetHeight+"px"}}}catch(e){}return r}}
  {const _us112=updateSocial;updateSocial=function(pid){const r=_us112.apply(this,arguments);vn112Social(pid);return r}}
  /* perfil */
  {const _rm112=renderMe;renderMe=function(){if(PF_ABA==="posts"&&!["posts","resp","midia"].includes(VN112_PF.me))VN112_PF.me="posts";if(PF_ABA!=="posts")VN112_PF.me=PF_ABA;
    const r=_rm112.apply(this,arguments);try{const m=$("#v-me .pf-me");if(m)vn112Pf(m,S.uid,VN112_PF.me)}catch(e){console.error(e)}return r}}
  {const _pv112=pfvDesenha;pfvDesenha=function(){const r=_pv112.apply(this,arguments);try{if(PFV&&PFV.modo==="grade"){if(PFV.aba!=="posts")PFV.vnAba=PFV.aba;else if(!["posts","resp","midia"].includes(PFV.vnAba))PFV.vnAba="posts";vn112Pf($("#layer .pfv .pfv-sc"),PFV.u,PFV.vnAba)}}catch(e){console.error(e)}return r}}
  {const _go112=go;go=function(v){if(v!=="me"&&VIEW==="me"&&!(PFV&&$("#layer .pfv")))try{pfIdsVolta()}catch(e){}return _go112.apply(this,arguments)}}
  {const _ap112=abrirPerfil;abrirPerfil=function(u){if(u===S.uid)VN112_PF.me="posts";return _ap112.apply(this,arguments)}}
  /* nomes */
  {const _sh112=sheet;sheet=function(){const r=_sh112.apply(this,arguments);try{vn112Nomes($("#layer2")&&$("#layer2").innerHTML?$("#layer2"):$("#layer"))}catch(e){}return r}}
  {const _to112=toast;toast=function(t){const a=[...arguments];try{if(typeof t==="string"&&VN112_NOMES_T.test(t))a[0]=vn112Troca(t)}catch(e){}return _to112.apply(this,a)}}
  try{const ob=new MutationObserver(ms=>{ms.forEach(m=>{if(m.type==="attributes"){const v=m.target.getAttribute(m.attributeName);if(v&&VN112_NOMES_T.test(v))vn112NomesAttr(m.target);return}m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)vn112Nomes(n)})})});
    const liga=()=>{["#layer","#layer2","#v-me"].forEach(s=>{const el=$(s);if(el)ob.observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:["aria-label"]})})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",liga);else liga()}catch(e){}
}
