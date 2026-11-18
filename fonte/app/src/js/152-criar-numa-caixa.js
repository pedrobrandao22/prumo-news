/* ---------- 152: criar numa caixa só (14/11) ----------
   Pedido do Pedro: "muitas telas diferentes para criar um novo post". Antes o "+" abria cartões de tipo (Comentar notícia,
   De perto, Análise, Pergunta, Coluna, Só texto, fotos, Minhas colunas) e cada formulário repetia a escolha do tipo em abas.
   Agora o "+" abre uma tela só:
   - no alto, Post · Giro · Coluna;
   - Post: uma caixa "Escreva…" e, embaixo, o que dá para juntar: Foto, Notícia, Enquete, Número, De perto. Só texto publica
     dali mesmo; juntar algo abre o formulário daquele tipo já com o texto escrito (sem as abas de tipo repetidas), e
     "voltar" traz de volta para a caixa com o texto;
   - Coluna: continuar um rascunho (os mais recentes) ou começar uma nova; a lista completa ("Minhas colunas") foi para o Perfil.
   Nomes com o prefixo cp152. */
var CP152={aba:"post",txt:"",pub:"amigos",veio:false};
const CP152_IC={foto:CN102_ICO.foto,nt:CN102_ICO.nt,enq:CN102_ICO.enq,ana:CN102_ICO.ind,rel:CN102_ICO.rel};
const CP152_ANEXOS=[["foto","Foto"],["nt","Notícia"],["enq","Enquete"],["ana","Número"],["rel","De perto"]];
function cp152Publicos(){const l=[["amigos","Todos os amigos"]];try{if(MA.on)l.push(["proximos","★ Melhores amigos"])}catch(e){}try{if(typeof cs123PodeSeg==="function"&&cs123PodeSeg())l.push(["seguidores","Seguidores e amigos"])}catch(e){}return l}
function cp152Rascs(){let l=[];try{l=ed132RascLe()}catch(e){}return l}
function cp152ColHTML(){const rs=cp152Rascs();
  return `<div class="cp152-col">
    ${rs.length?`<p class="cp152-h">Continuar escrevendo</p><ul class="cp152-rl">${rs.slice(0,3).map(r=>`<li><button type="button" class="cp152-r" data-cp152rasc="${esc(r.rid)}">${CN102_SVG('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>')}<span><b>${esc(String(r.tit||"").trim()||"Sem título")}</b><small>${esc(quando(r.at))} · ${(+r.pal||0).toLocaleString("pt-BR")} ${+r.pal===1?"palavra":"palavras"}</small></span><i aria-hidden="true">›</i></button></li>`).join("")}</ul>`:""}
    <button type="button" class="btn cp152-nova" data-cp152nova>${CN102_SVG(CN102_ICO.mais)}Nova coluna</button>
    <p class="cp152-dica">Coluna é um texto longo, com título, como um artigo. O que você escreve fica guardado sozinho.${rs.length>3?" Os outros rascunhos estão no seu Perfil, em Minhas colunas.":" Rascunhos, agendadas e publicadas ficam no seu Perfil, em Minhas colunas."}</p></div>`}
function cp152PostHTML(){const pubs=cp152Publicos();if(!pubs.some(p=>p[0]===CP152.pub))CP152.pub="amigos";
  return `<div class="cp152-post"><div class="cp152-quem">${avatar(S.uid)}<b>${esc(nomeDe(S.uid))}</b></div>
    <textarea id="cp152-tx" class="cp152-tx" maxlength="2200" rows="5" placeholder="Escreva o que você acha…" aria-label="Seu post">${esc(CP152.txt)}</textarea>
    <p class="cp152-h">Juntar ao post</p>
    <div class="cp152-ax" role="group" aria-label="Juntar ao post">${CP152_ANEXOS.map(([k,n])=>`<button type="button" class="cp152-a cp152-a-${k}" data-cp152ax="${k}">${CN102_SVG(CP152_IC[k])}<span>${n}</span></button>`).join("")}</div>
    <label class="cp152-pub"><span>Público</span><select id="cp152-pub" aria-label="Quem vê">${pubs.map(([k,n])=>`<option value="${k}"${k===CP152.pub?" selected":""}>${esc(n)}</option>`).join("")}</select><i aria-hidden="true">›</i></label>
    <div id="cp152-rascs"></div>
    <p class="cp152-dica">Notícia comenta uma notícia da edição; Enquete pergunta aos amigos; Número junta um indicador ou gráfico; De perto conta o que você viu, com local e hora. Use @ para marcar alguém.</p></div>`}
function cp152HTML(){const a=CP152.aba;
  return `<div class="cp152-hd"><button type="button" class="cp152-b" data-cp152x aria-label="Fechar">${EDI.x}</button><b>Nova publicação</b>${a==="post"?`<button type="button" class="cp152-ok" data-cp152pub>Publicar</button>`:`<span class="cp152-b" aria-hidden="true"></span>`}</div>
    <div class="cp152-abas" role="tablist" aria-label="O que publicar">${[["post","Post"],["giro","Giro"],["coluna","Coluna"]].map(([k,n])=>`<button type="button" role="tab" data-cp152aba="${k}" aria-selected="${a===k}">${n}</button>`).join("")}</div>
    <div class="cp152-sc">${a==="coluna"?cp152ColHTML():cp152PostHTML()}</div>`}
function cp152Desenha(){const el=$("#layer > .cp152");if(!el)return;el.innerHTML=cp152HTML();if(CP152.aba==="post"){const t=$("#cp152-tx");if(t){t.addEventListener("input",()=>{CP152.txt=t.value;cp152Ok()});cp152Ok()}const s=$("#cp152-pub");if(s)s.addEventListener("change",()=>{CP152.pub=s.value});cp152RascPosts()}}
/* posts que ficaram nos rascunhos (sem rede, ou "salvar rascunho") */
async function cp152RascPosts(){try{const l=await rascLista();const box=$("#cp152-rascs");if(!box||!l.length)return;box.innerHTML=`<button type="button" class="cp152-rp" data-cp152rascp>${CN102_SVG('<path d="M6 4h9l3 3v13H6z"/><path d="M9 11h6M9 15h4"/>')}<span>Rascunhos de post <b>${l.length}</b></span><i aria-hidden="true">›</i></button>`}catch(e){}}
function cp152Ok(){const b=$("#layer [data-cp152pub]");if(b)b.disabled=!CP152.txt.trim()}
function cp152Abre(o){o=o||{};if(precisaConta())return;if(PUB.on===false){toast("Publicar ainda não está ligado no Prumo.");return}
  const L=$("#layer");if(L.innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}if(typeof ED!=="undefined")ED=null;
  if(o.aba)CP152.aba=o.aba;if(!o.manter&&!o.aba)CP152.aba="post";if(!o.manter)CP152.txt="";
  L.innerHTML=`<div class="cp152" role="dialog" aria-modal="true" aria-label="Publicar"></div>`;if(pushH())HST++;cp152Desenha();uso("criar_caixa");
  if(CP152.aba==="post")setTimeout(()=>{const t=$("#cp152-tx");if(t&&!o.semFoco)try{t.focus({preventScroll:true});t.setSelectionRange(t.value.length,t.value.length)}catch(e){}},120);
  /* rascunhos de coluna guardados na conta (outro aparelho) */
  try{Promise.resolve(ed132Testa()).then(()=>ed132Sinc()).then(ok=>{if(ok&&CP152.aba==="coluna"&&$("#layer > .cp152"))cp152Desenha()}).catch(()=>{})}catch(e){}}
function cp152Fecha(){if(CP152.txt.trim()){const b=$("#layer [data-cp152x]");if(b&&!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Descartar?";setTimeout(()=>{if(b.isConnected){b.classList.remove("conf");b.innerHTML=EDI.x}},2600);return}}
  CP152.txt="";closeLayer()}
/* abre o editor de post por baixo (como o "Só texto" fazia) */
function cp152Editor(){if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}CN102_SEMGAL=1;CP152.interno=1;try{criarAbrir("post")}finally{CN102_SEMGAL=0;CP152.interno=0}return typeof ED!=="undefined"&&ED&&ED.modo==="post"?ED:null}
async function cp152Publica(){const tx=CP152.txt.trim();if(!tx){toast("Escreva algo para publicar.");return}const pub=CP152.pub;
  const E=cp152Editor();if(!E){toast("Não deu para abrir agora. Tente de novo.");return}const P=E.po;P.texto=tx;P.pub=pub;P.passo="detalhes";try{edDesenha()}catch(e){}
  CP152.txt="";CP152.direto=true;try{await edPublicaPost()}catch(e){}
  /* se não publicou (sem rede), o texto fica no editor de post, com o botão Compartilhar */}
function cp152Anexo(k){const tx=CP152.txt,pub=CP152.pub;CP152.veio=true;
  if(k==="foto"){const E=cp152Editor();if(!E)return;const P=E.po;P.texto=tx;P.pub=pub;
    /* abre a galeria no mesmo toque (o iPhone só deixa abrir dentro do toque); se a pessoa desistir, volta para a caixa */
    const f=$("#ce-pfile");if(f){f.addEventListener("cancel",()=>{if(ED===E&&!E.po.fotos.length&&!(E.po.rolo&&E.po.rolo.length)){CP152.txt=tx;ED=null;cp152Abre({manter:true,aba:"post",semFoco:true})}},{once:true});try{f.click()}catch(e){}}
    return}
  cn102Comeca(k,k==="rel"?{}:{});const E=typeof ED!=="undefined"&&ED;if(!E||!E.po||!E.po.cn)return;const cn=E.po.cn;E.po.pub=pub;
  if(tx){if(k==="enq"&&tx.length<=120&&!/\n/.test(tx))cn.tit=tx;else cn.corpo=tx}
  try{edDesenha()}catch(e){}
  if(k==="nt"&&!E.po.pid)setTimeout(()=>{try{if(!$("#layer .cn102-ntl"))cn102ListaNt("data-edpnt")}catch(e){}},0);
  if(k==="ana")setTimeout(()=>{try{const b=$("#layer [data-cn102dado]");if(b)b.click()}catch(e){}},120)}
/* o texto do formulário volta para a caixa */
function cp152TextoDe(E){try{const P=E&&E.po;if(!P)return CP152.txt;const cn=P.cn;if(!cn)return String(P.texto||"");return [cn.tit,cn.corpo].map(s=>String(s||"").trim()).filter(Boolean).join("\n\n")}catch(e){return CP152.txt}}

/* entradas: o "+" e "Nova publicação" abrem a caixa */
{const _cm152=criarMenu;criarMenu=function(){if(precisaConta())return;cp152Abre()}}
/* "Nova publicação" (Perfil) e outros botões data-criarde="post"; criarAbrir("post") chamado pelo código (rascunhos, testes) continua abrindo o editor */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('[data-criarde="post"]');if(!b)return;e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();
  if($("#layer").innerHTML&&!$("#layer > .cp152")){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}setTimeout(()=>cp152Abre(),40)},true);

window.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  /* no editor de giro, "POST" volta para a caixa */
  const md=t.closest("#layer [data-edmodo='post'],#layer [data-crtipo='post']");if(md&&!$("#layer > .cp152")){e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();if(typeof ED!=="undefined"&&ED&&ED.env)return;
    ED=null;cp152Abre();return}
  /* voltar de um formulário aberto pela caixa: volta para a caixa, com o texto */
  const vt=t.closest("#layer [data-edvolta]");if(vt&&CP152.veio&&typeof ED!=="undefined"&&ED&&ED.po&&(ED.po.cn||ED.po.passo==="detalhes")&&!ED.env){
    e.stopPropagation();e.stopImmediatePropagation();e.preventDefault();CP152.txt=cp152TextoDe(ED);CP152.veio=false;ED=null;cp152Abre({manter:true,aba:"post"});return}
},true);
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  if(!t.closest("#layer > .cp152"))return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(t.closest("[data-cp152x]")){pare();cp152Fecha();return}
  if(b=t.closest("[data-cp152aba]")){pare();const a=b.dataset.cp152aba;if(a==="giro"){const tx=CP152.txt;ED=null;CP152.txt=tx;if($("#layer").innerHTML){closeLayer._ok=true;try{closeLayer()}finally{closeLayer._ok=false}}criarAbrir("story");return}
    CP152.aba=a;cp152Desenha();return}
  if(t.closest("[data-cp152pub]")){pare();cp152Publica();return}
  if(b=t.closest("[data-cp152ax]")){pare();cp152Anexo(b.dataset.cp152ax);return}
  if(t.closest("[data-cp152rascp]")){pare();const E=cp152Editor();if(E)setTimeout(()=>{try{rascPainel()}catch(e){}},60);return}
  if(t.closest("[data-cp152nova]")){pare();ed132Abre(ed132Novo());return}
  if(b=t.closest("[data-cp152rasc]")){pare();const d=cp152Rascs().find(r=>r.rid===b.dataset.cp152rasc);if(d)ed132Abre(ed132DoRasc(d));return}
},true);
/* fechar pelo "voltar" do celular */

/* ===== formulários abertos pela caixa: sem a faixa de tipos repetida ===== */
{const _cd152=cn102Det;cn102Det=function(el){const r=_cd152.apply(this,arguments);try{if(CP152.veio){const ks=el.querySelector(".cn102-ks");if(ks)ks.hidden=true}}catch(e){}return r}}

/* ===== Perfil: "Minhas colunas" ao lado de "Nova publicação" ===== */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-cp152cols]");if(!b)return;e.preventDefault();e.stopPropagation();ed132Hub()},true);
{const _pc152=pfCab;pfCab=function(u){const h=_pc152.apply(this,arguments);try{if(u===S.uid&&typeof h==="string"&&h.indexOf("data-cp152cols")<0){const i=h.indexOf('<div class="pf-bts">');if(i>=0){const j=h.indexOf("</div>",i)+6;
  return h.slice(0,j)+`<button type="button" class="pf-cols" data-cp152cols>${CN102_SVG('<path d="M6 4h9l3 3v13H6z"/><path d="M9 11h6M9 15h4"/>')}<span><b>Minhas colunas</b><small>rascunhos, agendadas e publicadas</small></span><i aria-hidden="true">›</i></button>`+h.slice(j)}}}catch(e){}return h}}

/* ===== depois de publicar, o post aparece na tela (14/11, testador: "Já está no Feed", mas ficava abaixo da notícia em destaque) ===== */
function cp152Mostra(id){let n=0;const tenta=()=>{const el=document.getElementById("p-u:"+id);if(el&&el.getClientRects().length){try{const top=el.getBoundingClientRect().top+scrollY-((document.querySelector(".top")||{}).offsetHeight||56)-8;scrollTo({top:Math.max(0,top),behavior:"smooth"});el.classList.add("cp152-novo");setTimeout(()=>el.classList.remove("cp152-novo"),2200)}catch(e){}return}
  if(++n<12)setTimeout(tenta,250)};setTimeout(tenta,300)}
{const _ep152=edPublicaPost;edPublicaPost=async function(){const daCaixa=CP152.direto||CP152.veio;CP152.direto=false;CP152.veio=false;if(!daCaixa)return _ep152.apply(this,arguments);const antes=new Set((PUB.itens||[]).filter(x=>x.autor===S.uid).map(x=>x.id));const r=await _ep152.apply(this,arguments);
  try{const novo=(PUB.itens||[]).find(x=>x.autor===S.uid&&x.tipo==="post"&&x.id&&!antes.has(x.id));if(novo){if(VIEW!=="feed")go("feed");cp152Mostra(novo.id)}}catch(e){}return r}}

/* trechos citados (Atividade, conversas): corta na palavra e põe "…" (14/11, testador: "a estimativa do Executivo ” há 1 d") */
function cp152Corta(s,n){s=String(s==null?"":s).replace(/\s+/g," ").trim();if(s.length<=n)return s;const c=s.slice(0,n-1),i=c.lastIndexOf(" ");return (i>n*.6?c.slice(0,i):c).replace(/[\s,;:.\-–—]+$/,"")+"…"}
