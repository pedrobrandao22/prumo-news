/* ---------- Etapa 70: arquivo, destaques, editar e fixar ---------- */
var V5={on:null},DEST={},ARQ=null;
async function v5Testa(){if(V5.on!==null||!SB||!S.uid)return V5.on;try{const r=await SB.from("destaques").select("id").limit(1);V5.on=!r.error}catch(e){V5.on=false}return V5.on}
async function pubAssinaLista(l){const now=Date.now(),fs=[],vs=[];l.forEach(x=>{(x.fotos||[]).forEach(p=>{const c=PUB.urls[p];if(!c||c.exp<now+600e3)fs.push(p)});const v=x.estilo&&x.estilo.video;if(v){const c=PUB.urls[v];if(!c||c.exp<now+600e3)vs.push(v)}});
  try{if(fs.length){const r=await SB.storage.from("fotos").createSignedUrls(fs,6*3600);(r.data||[]).forEach(d=>{if(d&&d.signedUrl)PUB.urls[d.path]={u:d.signedUrl,exp:now+6*3600e3}})}
    if(vs.length){const r=await SB.storage.from("videos").createSignedUrls(vs,6*3600);(r.data||[]).forEach(d=>{if(d&&d.signedUrl)PUB.urls[d.path]={u:d.signedUrl,exp:now+6*3600e3}})}}catch(e){}}
const pubNorm=x=>{x.fotos=Array.isArray(x.fotos)?x.fotos:[];try{pubLimpa(x)}catch(e){}return x};
/* destaques */
async function destCarregar(u){if(!(await v5Testa()))return [];try{const r=await SB.from("destaques").select("*").eq("dono",u).order("ordem",{ascending:true});if(r.error)return DEST[u]||[];
  const ds=(r.data||[]).filter(d=>Array.isArray(d.itens));const ids=[...new Set(ds.flatMap(d=>d.itens))];let st=[];
  if(ids.length){const q=await SB.from("publicacoes").select("*").in("id",ids);st=(q.data||[]).map(pubNorm)}const by={};st.forEach(x=>by[x.id]=x);
  ds.forEach(d=>{d.stories=d.itens.map(i=>by[i]).filter(Boolean)});DEST[u]=ds.filter(d=>d.stories.length||d.dono===S.uid);await pubAssinaLista(st);return DEST[u]}catch(e){return DEST[u]||[]}}
function destCapa(d){const x=(d.capa&&d.stories.find(s=>s.id===d.capa))||d.stories[0];const f=x&&x.fotos[0]&&pubUrl(x.fotos[0]);return f?`<img src="${pubSrc(f)}" alt="">`:`<span style="background:${pubFundo(1)}"></span>`}
function destRowHTML(u){const ds=DEST[u]||[];const eu=u===S.uid;if(!V5.on||(!ds.length&&!eu))return "";
  return `<div class="pf-dests">${ds.map(d=>`<button type="button" class="pf-d" data-pfdest="${esc(d.id)}" data-dono="${esc(u)}"><span class="pf-dc">${destCapa(d)}</span><b>${esc(d.nome)}</b></button>`).join("")}${eu?`<button type="button" class="pf-d pf-dn" data-destnovo><span class="pf-dc">+</span><b>Novo</b></button>`:""}</div>`}
/* lista especial no visualizador de stories ("_u:~…") */
{const _sd70=pubStoriesDe;pubStoriesDe=function(u){if(String(u).charAt(0)==="~")return (ST&&ST._lista)||[];return _sd70.apply(this,arguments)}}
{const _so70=storyOrdem;storyOrdem=function(){if(ST&&String(ST.sec||"").indexOf("_u:~")===0)return [ST.sec];return _so70.apply(this,arguments)}}
{const _nm70=igNomeSt;igNomeSt=function(sec){if(String(sec).indexOf("_u:~")===0)return (ST&&ST._nome)||"Story";return _nm70.apply(this,arguments)}}
function stLista(lista,i,nome,chave){if(!lista.length)return;if($("#layer").innerHTML)closeLayer();ST={sec:"_u:~"+chave,ids:lista.map(x=>"us:"+x.id),itens:lista,i:Math.max(0,i||0),ordem:[],_lista:lista,_nome:nome,_chave:chave};drawStory()}
async function abrirDestaque(id,u){const d=(DEST[u]||[]).find(x=>x.id===id);if(!d||!d.stories.length){if(d&&u===S.uid)toast("Este destaque está vazio.");return}uso("destaque_perfil");stLista(d.stories,0,d.nome,"d"+id)}
{const _du70=igDrawUser;igDrawUser=function(){const r=_du70.apply(this,arguments);try{if(ST&&String(ST.sec||"").indexOf("_u:~")===0){const w=$("#layer .story .sg-who b");if(w&&ST._nome)w.textContent=ST._nome;const t=$("#layer .story .sg-who span");const x=ST.itens[ST.i];if(t&&x)t.textContent=new Date(x.at).toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}
  const x=ST.itens&&ST.itens[ST.i];if(x&&x.autor===S.uid&&V5.on){const f=$("#layer .story .us-f");if(f&&!f.querySelector("[data-usdest]"))f.querySelector(".sp")?.insertAdjacentHTML("afterend",`<button type="button" class="sg-ler" data-usdest="${esc(x.id)}">♥ Destacar</button>`)}}catch(e){}return r}}
/* arquivo dos seus stories */
async function arqCarregar(){try{const r=await SB.from("publicacoes").select("*").eq("autor",S.uid).eq("tipo","story").order("at",{ascending:false}).limit(200);if(r.error)return ARQ||[];ARQ=(r.data||[]).map(pubNorm);await pubAssinaLista(ARQ);return ARQ}catch(e){return ARQ||[]}}
async function abrirArquivo(){if($("#layer").innerHTML)closeLayer();PFV={u:S.uid,modo:"arq"};$("#layer").innerHTML=`<div class="pfv pfv-arq" role="dialog" aria-modal="true" aria-label="Arquivo de stories"></div>`;if(pushH())HST++;arqDesenha();await arqCarregar();arqDesenha()}
function arqDesenha(){const el=$("#layer .pfv-arq");if(!el)return;const l=ARQ||[];let dia="";
  el.innerHTML=`<div class="pfv-h"><button type="button" class="icbtn" data-pfvolta aria-label="Voltar"><svg class="ico" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b>Arquivo de stories<small>só você vê</small></b><span class="sp"></span></div>
    <div class="pfv-sc">${ARQ===null?`<p class="hint" style="padding:20px">Carregando…</p>`:!l.length?`<div class="pf-vz"><b>Nenhum story ainda</b><span>Seus stories ficam guardados aqui depois das 24 horas (por 30 dias, ou para sempre se estiverem num destaque).</span></div>`:`<div class="pf-grade arq-grade">${l.map((x,i)=>{const f=x.fotos[0]&&pubUrl(x.fotos[0]);const d=new Date(x.at);const lab=d.toLocaleDateString("pt-BR",{day:"numeric",month:"short"});const novo=lab!==dia;dia=lab;
      return `<button type="button" class="pf-t arq-t" data-arqi="${i}">${f?`<img src="${pubSrc(f)}" alt="" loading="lazy">`:`<span class="pf-tx" style="background:${pubFundo(x.estilo&&x.estilo.fundo)}">${esc(String(x.texto||"").slice(0,60))}</span>`}${novo?`<i class="arq-d"><b>${d.getDate()}</b>${esc(d.toLocaleDateString("pt-BR",{month:"short"}).replace(".",""))}</i>`:""}${x.estilo&&x.estilo.video?`<i class="pf-ic">▶</i>`:""}${(x.expira||0)>Date.now()?`<i class="arq-ativo">no ar</i>`:""}</button>`}).join("")}</div>`}</div>`}
{const _lm70=pubLimparMeus;pubLimparMeus=async function(){if(V5.on===null)await v5Testa();if(!V5.on)return _lm70.apply(this,arguments);
  /* com o SQL v5: guarda 30 dias no arquivo; o que está em destaque fica para sempre */
  if(!DEST[S.uid])await destCarregar(S.uid);const emDest=new Set((DEST[S.uid]||[]).flatMap(d=>d.itens||[]));const lim=Date.now()-30*864e5;
  const velhos=PUB.itens.filter(x=>x.autor===S.uid&&x.tipo==="story"&&(x.expira||0)<lim&&!emDest.has(x.id));for(const x of velhos)await pubApagar(x.id,true)}}
/* editar a legenda, fixar */
async function pubEditar(id,txt){const x=pubDe(id);if(!x)return;const r=await SB.from("publicacoes").update({texto:txt}).eq("id",id);if(r&&r.error){toast("Não deu para salvar agora.");return}x.texto=txt;x.editado=Date.now();toast("Legenda atualizada");
  const el=document.getElementById("p-u:"+id);if(el){try{el.outerHTML=pubPostHTML(x);const n=document.getElementById("p-u:"+id);if(n){wireTracks(n);updateSocial("u:"+id)}}catch(e){}}if(typeof avisarMencoes==="function"&&txt)pubAvisarMencoes(id,txt,"post")}
async function pubFixar(id){const x=pubDe(id);if(!x)return;const on=!x.fixado;if(on&&PUB.itens.filter(y=>y.autor===S.uid&&y.fixado).length>=3){toast("Você já tem 3 posts fixados. Desafixe um antes.");return}
  const r=await SB.from("publicacoes").update({fixado:on?Date.now():null}).eq("id",id);if(r&&r.error){toast("Não deu para fixar agora.");return}x.fixado=on?Date.now():null;toast(on?"Fixado no seu perfil":"Desafixado");if(VIEW==="me")renderMe()}
{const _pl70=pfLista;pfLista=function(u,aba){const l=_pl70.apply(this,arguments);if(aba!=="posts")return l;return l.slice().sort((a,b)=>(+!!b.fixado-+!!a.fixado)||(b.fixado&&a.fixado?b.fixado-a.fixado:0)||(b.at-a.at))}}
{const _pt70=pfTiles;pfTiles=function(l,aba,u){let h=_pt70.apply(this,arguments);if(aba==="posts")l.forEach((x,i)=>{if(x.fixado)h=h.replace(`data-pfi="${i}"`,`data-pfi="${i}" data-fixo`)});return h}}
/* perfil: fileira de destaques */
{const _pc70=pfCab;pfCab=function(u){return _pc70.apply(this,arguments)+destRowHTML(u)}}
{const _cp70=pfCarregar;pfCarregar=async function(u){const r=await _cp70.apply(this,arguments);if(await v5Testa())await destCarregar(u);return r}}
/* Conta: Arquivo */
{const _rm70=renderMe;renderMe=function(){const r=_rm70.apply(this,arguments);try{if(V5.on){const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-arquivo]"))m.insertAdjacentHTML("afterbegin",`<button type="button" data-arquivo><span>Arquivo de stories</span><i>›</i></button>`)}}catch(e){}return r}}
/* folhas: destacar, novo destaque, editar destaque */
function destEscolher(storyId){const ds=DEST[S.uid]||[];sheet("Destacar",`<div class="opt">${ds.map(d=>`<button type="button" data-destpor="${esc(d.id)}" data-st="${esc(storyId)}">${esc(d.nome)}<span>${(d.itens||[]).includes(storyId)?"já está aqui · toque para tirar":d.itens.length+" "+(d.itens.length===1?"story":"stories")}</span></button>`).join("")}<button type="button" data-destnovo data-st="${esc(storyId)}">＋ Novo destaque</button></div>`)}
async function destNovo(pre){const l=await arqCarregar();if(!l.length){toast("Publique um story primeiro.");return}const sel=new Set(pre?[pre]:[]);
  sheet("Novo destaque",`<input class="field" id="dest-nome" maxlength="30" placeholder="Nome do destaque" value="Destaque"><p class="hint">Escolha os stories:</p><div class="dest-pick">${l.map(x=>{const f=x.fotos[0]&&pubUrl(x.fotos[0]);return `<button type="button" class="dest-o" data-destsel="${esc(x.id)}" aria-pressed="${sel.has(x.id)}">${f?`<img src="${pubSrc(f)}" alt="">`:`<span style="background:${pubFundo(x.estilo&&x.estilo.fundo)}"></span>`}<i></i></button>`}).join("")}</div>`,`<button type="button" class="btn" data-destcriar>Criar destaque</button>`)}
async function destSalvar(d,mud){const r=await SB.from("destaques").update(mud).eq("id",d.id);if(r&&r.error){toast("Não deu para salvar o destaque.");return false}Object.assign(d,mud);await destCarregar(S.uid);if(VIEW==="me")renderMe();return true}
document.addEventListener("click",async e=>{const t=e.target;if(!t.closest)return;let b;const pare=()=>{e.stopPropagation();e.preventDefault()};
  if(b=t.closest("[data-pfdest]")){pare();abrirDestaque(b.dataset.pfdest,b.dataset.dono);return}
  if(b=t.closest("[data-destnovo]")){pare();const st=b.dataset.st;if($("#layer2")?.innerHTML)closeLayer();setTimeout(()=>destNovo(st),60);return}
  if(b=t.closest("[data-destsel]")){pare();b.setAttribute("aria-pressed",String(b.getAttribute("aria-pressed")!=="true"));return}
  if(t.closest("[data-destcriar]")){pare();const ids=[...document.querySelectorAll("[data-destsel][aria-pressed=true]")].map(x=>x.dataset.destsel);if(!ids.length){toast("Escolha pelo menos um story.");return}const nome=($("#dest-nome")?.value||"").trim().slice(0,30)||"Destaque";
    const r=await SB.from("destaques").insert({dono:S.uid,nome,itens:ids,ordem:(DEST[S.uid]||[]).length}).select("id");if(r.error){toast("Não deu para criar o destaque.");return}closeLayer();await destCarregar(S.uid);toast("Destaque criado");if(VIEW==="me")renderMe();return}
  if(b=t.closest("[data-usdest]")){pare();igPausa();if(!DEST[S.uid])await destCarregar(S.uid);destEscolher(b.dataset.usdest);return}
  if(b=t.closest("[data-destpor]")){pare();const d=(DEST[S.uid]||[]).find(x=>x.id===b.dataset.destpor),st=b.dataset.st;if(!d)return;const it=d.itens.includes(st)?d.itens.filter(x=>x!==st):d.itens.concat(st);
    if(!it.length){toast("Um destaque precisa de pelo menos um story. Para apagar, segure o destaque no perfil.");return}if(await destSalvar(d,{itens:it})){closeLayer();toast(d.itens.includes(st)?`Adicionado a "${d.nome}"`:`Tirado de "${d.nome}"`)}return}
  if(t.closest("[data-arquivo]")){pare();abrirArquivo();return}
  if(b=t.closest("[data-arqi]")){pare();const i=+b.dataset.arqi;stLista(ARQ||[],i,"Arquivo","a");return}
  if(b=t.closest("[data-ueditar]")){pare();const x=pubDe(b.dataset.ueditar);if(!x)return;closeLayer();setTimeout(()=>sheet("Editar legenda",`<textarea class="field" id="ed-leg" rows="5" maxlength="2200">${esc(x.texto||"")}</textarea>`,`<button type="button" class="btn" data-uedok="${esc(x.id)}">Salvar</button>`),60);return}
  if(b=t.closest("[data-uedok]")){pare();const v=($("#ed-leg")?.value||"").trim().slice(0,2200);closeLayer();pubEditar(b.dataset.uedok,v);return}
  if(b=t.closest("[data-ufixar]")){pare();closeLayer();pubFixar(b.dataset.ufixar);return}
  if(b=t.closest("[data-destedok]")){pare();const d=(DEST[S.uid]||[]).find(x=>x.id===b.dataset.destedok);const nome=($("#dest-nome")?.value||"").trim().slice(0,30);if(d&&nome&&await destSalvar(d,{nome}))closeLayer();return}
  if(b=t.closest("[data-destapagar]")){pare();if(!b.classList.contains("conf")){b.classList.add("conf");b.textContent="Toque de novo para apagar";return}const r=await SB.from("destaques").delete().eq("id",b.dataset.destapagar);closeLayer();if(r&&r.error){toast("Não deu para apagar.");return}await destCarregar(S.uid);toast("Destaque apagado");if(VIEW==="me")renderMe();return}},true);
/* segurar um destaque seu: renomear ou apagar */
(function(){let lp=0;document.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest("[data-pfdest]");if(!b||b.dataset.dono!==S.uid)return;lp=setTimeout(()=>{lp=0;window.__destLP=Date.now();const d=(DEST[S.uid]||[]).find(x=>x.id===b.dataset.pfdest);if(!d)return;vibrar(10);
    sheet("Destaque",`<input class="field" id="dest-nome" maxlength="30" value="${esc(d.nome)}"><p class="hint">Para tirar ou pôr stories, abra o story e toque em "♥ Destacar".</p>`,`<button type="button" class="btn" data-destedok="${esc(d.id)}">Salvar nome</button><button type="button" class="btn ghost perigo" data-destapagar="${esc(d.id)}">Apagar destaque</button>`)},550)},true);
  ["pointerup","pointercancel","pointerleave"].forEach(k=>document.addEventListener(k,()=>{if(lp){clearTimeout(lp);lp=0}},true));
  document.addEventListener("click",e=>{if(Date.now()-(window.__destLP||0)<700&&e.target.closest&&e.target.closest("[data-pfdest]")){e.stopPropagation();e.preventDefault()}},true)})();
/* voltar no arquivo fecha */
{const _cl70=closeLayer;closeLayer=function(){const r=_cl70.apply(this,arguments);if(!$("#layer .pfv-arq")&&PFV&&PFV.modo==="arq")PFV=null;return r}}
setTimeout(()=>{v5Testa()},4000);
{const _pp70=pubPostHTML;pubPostHTML=function(x){const h=_pp70.apply(this,arguments);return x.editado&&x.tipo==="post"?h.replace(/(<span class="ph-sub">)([^<]*)(<\/span>)/,(a,b1,t,b3)=>b1+t+" · editado"+b3):h}}

