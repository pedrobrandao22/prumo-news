/* ---------- 125: QA da noite (A) — colunas, seguir e reposts usados por várias pessoas em vários dias ----------
   1. Quem escreve vê as curtidas, os comentários e os votos de quem o segue nos próprios posts (e na Atividade);
      quem segue vê as respostas de quem escreveu. Os amigos do autor que você não conhece continuam fora (como antes).
   2. Repostar ou citar um post de quem você segue: o original aparece para você (antes, "Publicação indisponível"
      no seu próprio Feed) e o Feed junta original + repost ("Você repostou").
   3. Coluna aberta da página de uma hashtag: o Voltar devolve à hashtag.
   4. Textos: cartão da conversa diz "Coluna"; enviar e repostar post para seguidores dizem quem consegue abrir.
   Nomes globais com o prefixo qa125. */

/* ===== 1. reações entre quem escreve e quem segue ===== */
function qa125Conhece(u){try{return !!(u&&typeof V9!=="undefined"&&V9.on&&(CS123.sigo.has(u)||CS123.segs.some(s=>s.uid===u)))}catch(e){return false}}
function qa125VeReac(u,x){return !!u&&(ehVisivel(u)||!!(x&&u===x.autor)||qa125Conhece(u))}
{const _so=socialOf;socialOf=function(pid){const r=_so.apply(this,arguments);try{if(typeof PS==="undefined"||!PS.on||String(pid).indexOf("u:")!==0||!r)return r;
  const id=String(pid).slice(2),x=pubDe(id);if(!x)return r;const lk=new Set(r.likes||[]);let mudou=false;
  (PS.lk[id]||new Set()).forEach(u=>{if(!lk.has(u)&&qa125VeReac(u,x)){lk.add(u);mudou=true}});
  const ja=new Set((r.cm||[]).map(c=>c.id)),mais=(PS.cm[id]||[]).filter(c=>!ja.has(c.id)&&qa125VeReac(c.uid,x)&&!(CPEND[c.uid+"\u0001"+c.id]&&CPEND[c.uid+"\u0001"+c.id].v===null));
  if(!mudou&&!mais.length)return r;return {...r,likes:[...lk],cm:(r.cm||[]).concat(mais).sort((a,b)=>a.at-b.at)}}catch(e){return r}}}
{const _vd=votosDe;votosDe=function(k){const r=_vd.apply(this,arguments);try{if(typeof PS==="undefined"||!PS.on||typeof psPub!=="function")return r;const id=psPub(k);if(!id)return r;const x=pubDe(id);if(!x)return r;
  let o=null;Object.entries(PS.vt[k]||{}).forEach(([u,v])=>{if(!(u in r)&&qa125VeReac(u,x)){o=o||{...r};o[u]=v}});return o||r}catch(e){return r}}}
/* Atividade: curtidas e comentários de quem segue você (o nome vem da lista de seguidores) */
{const _ai=atItens;atItens=function(){const pus=[];try{if(typeof AT!=="undefined"&&Array.isArray(AT.rows))AT.rows.forEach(x=>{const u=x&&x.uid;if(u&&!S.membros[u]&&!S.amigos.has(u)&&qa125Conhece(u)&&!pus.includes(u)){const p=CS123.pess[u]||{};S.membros[u]={uid:u,nome:p.nome||nomeDe(u),foto:p.foto||null};pus.push(u)}})}catch(e){}
  try{return _ai.apply(this,arguments)}finally{pus.forEach(u=>{delete S.membros[u]})}}}

/* ===== 2. repost e citação de quem você segue ===== */
{const _vp=vn112Pub;vn112Pub=function(id){const r=_vp.apply(this,arguments);if(r)return r;try{const x=pubVisiveis().find(y=>y.id===id)||VN112_Q.get(id);
  if(x&&x.tipo==="post"&&!x.arquivado&&typeof cs123DeSeguido==="function"&&cs123DeSeguido(x))return x}catch(e){}return r}}

/* ===== 3. hashtag › coluna › Voltar ===== */
{const _ab=cs123Abrir;cs123Abrir=function(id){let tag=null;try{const pg=$("#layer .pfv-ht");if(pg&&!$("#layer2")?.innerHTML)tag=pg.dataset.tag||null}catch(e){}
  if(!tag)return _ab.apply(this,arguments);HT_FECHANDO=true;let r;try{r=_ab.apply(this,arguments)}finally{HT_FECHANDO=false}
  try{if(CS123.ler&&CS123.ler.id===id)CS123.ler.ht=tag;else if(!$("#layer").innerHTML)abrirHashtag(tag,{reabre:true})}catch(e){}return r}}
{const _cl=closeLayer;closeLayer=function(fromPop){const l2=!!($("#layer2")&&$("#layer2").innerHTML);const ht=!l2&&$("#layer > .cs123-ler")&&CS123.ler&&CS123.ler.ht;
  const r=_cl.apply(this,arguments);try{if(ht&&fromPop===true&&!$("#layer").innerHTML)setTimeout(()=>{if(!$("#layer").innerHTML)abrirHashtag(ht,{reabre:true})},0)}catch(e){}return r}}

/* ===== 4. textos ===== */
{const _dc=dmCard;dmCard=function(m){const h=_dc.apply(this,arguments);try{if(typeof h!=="string"||!dmEhPub(m))return h;const x=pubDe(String(m.pid).slice(2)),c=x&&cs123Col(x);if(!c)return h;
  return h.replace(/(<span class="dm-uh">[\s\S]*?<small>)Post(<\/small>)/,"$1Coluna$2").replace(/(<b class="dm-utx">)[\s\S]*?(<\/b>)/,`$1${esc(c.tit)}$2`)}catch(e){return h}}}
const qa125Prim=u=>String(nomeDe(u)||"").split(" ")[0];
{const _pe=pubEnviar;pubEnviar=function(x){const r=_pe.apply(this,arguments);try{if(x&&x.publico==="seguidores"){const h=document.querySelector("#layer .sheet .hint, #layer2 .sheet .hint");
  if(h&&document.querySelector("#pick"))h.textContent=x.autor===S.uid?"Seus amigos e quem segue você conseguem abrir o post.":`Só quem é amigo de ${qa125Prim(x.autor)} ou segue ${qa125Prim(x.autor)} consegue abrir o post.`}}catch(e){}return r}}
{const _vm=vn112Menu;vn112Menu=function(k,id){const r=_vm.apply(this,arguments);try{const a=vn112Alvo(k,id);if(a&&a.x&&a.x.publico==="seguidores"&&a.x.autor!==S.uid){
  const s=document.querySelector("[data-vnrpja] span");if(s)s.textContent=`Só aparece para quem também pode ver o post de ${qa125Prim(a.x.autor)} (amigos ou seguidores)`}}catch(e){}return r}}
/* De perto (cabeçalho próprio do 117) também mostra "seguidores" quando o post é para seguidores */
{const _pp=pubPostHTML;pubPostHTML=function(x){const h=_pp.apply(this,arguments);try{if(!x||x.publico!=="seguidores"||typeof h!=="string"||h.indexOf("ac117-meta")<0)return h;
  const a=vn112Tp(h),m=a&&a.querySelector(".ph .ac117-meta");if(!m||m.querySelector(".cs123-ps"))return h;m.insertAdjacentHTML("beforeend",`<span class="cs123-ps">seguidores</span>`);return a.outerHTML}catch(e){}return h}}
/* Atividade: "sua coluna “título”" no lugar de "seu post" */
{const _an=atPubNome;atPubNome=function(x){const n=_an.apply(this,arguments);try{const c=x&&cs123Col(x);if(c)return `sua coluna “${esc(c.tit.length>60?c.tit.slice(0,59).trimEnd()+"…":c.tit)}”`}catch(e){}return n}}
/* coluna citada: "Coluna", título e linha fina (não o texto cru com as hashtags); tocar abre a leitura */
{const _q=vn112Quote;vn112Quote=function(rp,snap){const h=_q.apply(this,arguments);try{if(!rp||rp.k!=="pub"||typeof h!=="string"||h.indexOf("vn-qp")<0)return h;const x=vn112Pub(rp.id),c=x&&cs123Col(x);if(!c)return h;
  const a=vn112Tp(h);if(!a)return h;a.querySelectorAll(":scope>p,:scope>.vn-q-k,:scope>.vn-q-t").forEach(e=>e.remove());a.dataset.cs123ler=x.id;a.classList.add("qa125-qcol");
  const au=a.querySelector(".vn-q-au");const bl=`<span class="vn-q-k">Coluna</span><b class="vn-q-t qa125-qt">${esc(c.tit)}</b>${c.linha?`<p>${esc(c.linha)}</p>`:""}`;
  if(au)au.insertAdjacentHTML("afterend",bl);else a.insertAdjacentHTML("afterbegin",bl);a.setAttribute("aria-label",`Coluna citada de ${nomeDe(x.autor)}: ${c.tit}`);return a.outerHTML}catch(e){return h}}}
/* "Bia começou a seguir você" (chave "sg:" do 123) conta como seguidor novo no resumo da Atividade, não como "novidade" */
if(typeof nt124Cat==="function"){const _nc=nt124Cat;nt124Cat=function(x){return /^sg:/.test(String(x&&x.k||""))?"seguidores":_nc.apply(this,arguments)}}

/* ===== 5. "Perfis abertos" na aba Buscar (a do menu de baixo e da lupa). O 123 só ligava na busca antiga, em folha (#btext) ===== */
function qa125BusPoe(){const out=$("#bvres"),q=(($("#bvq")||{}).value||"").trim();if(!out)return;out.querySelector(".qa125-bus")?.remove();const B=CS123.bus;
  if(typeof V9==="undefined"||!V9.on||!B||!B.l||B.q!==q||!B.l.length||q.length<2)return;
  out.insertAdjacentHTML("afterbegin",`<div class="cs123-bus qa125-bus"><b class="cs123-bh">Perfis abertos</b><ul class="amgl cs123-l">${B.l.slice(0,5).map(cs123LinhaAb).join("")}</ul></div>`)}
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="bvq"||typeof V9==="undefined"||!V9.on||!S.uid||!S.membro)return;const q=t.value.trim();qa125BusPoe();clearTimeout(qa125BusPoe.t);if(q.length<2)return;
  qa125BusPoe.t=setTimeout(async()=>{const l=await cs123Abertos(q);if(l&&(($("#bvq")||{}).value||"").trim()===q){CS123.bus={q,l};qa125BusPoe()}},300)});
{const _rb=renderBuscaView;renderBuscaView=function(){const r=_rb.apply(this,arguments);try{qa125BusPoe()}catch(e){}return r}}
