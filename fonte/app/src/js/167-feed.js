/* ---------- 167: segunda rodada de acertos do Feed (16/11, noite). Prefixo fd167. ----------
   Continua o 156. Topo: o círculo Últimas e a miniatura do Em 5 min não repetem a notícia do 1º cartão; a ilustração dos
   círculos sai sem a etiqueta desenhada (que aparecia cortada no canto); a fileira fica onde estava ao fechar um giro.
   Cartão: "seguindo" não é cortado no meio (vira "✓ seguindo" inteiro e o subtema encolhe); sem o vão embaixo da linha da
   cobertura. Comentários: o comentário guardado sem internet aparece na conversa ("Enviando quando a internet voltar ·
   Cancelar"); no celular o retorno pula linha (só a seta publica) e as quebras de linha aparecem; responder mostra
   "Respondendo a Fulano" acima do campo em vez de escrever "@Fulano" no texto, e a resposta não repete o nome no texto.
   Sem conta: "curtir" no lugar de "gostar". Rodapé: a hora da última conferência e a próxima atualização, sem a lista de
   horários. Voltar do celular: refaz o caminho das abas (Perfil → Feed na mesma altura → Conversas → Capa) e só sai do
   site a partir da raiz. (Letra grande, barra de baixo opaca e o véu do giro estão no css/70-feed.css.) */

/* ---- topo: Últimas e Em 5 min não repetem o 1º cartão do Feed ---- */
function fd167Primeiro(){try{const l=(LOTE&&LOTE.lista&&LOTE.lista.length?LOTE.lista:listaFeed())||[];const f=l.find(x=>x&&x.id&&pautaById(x.id));return f?fd156Id(f.id):""}catch(e){return ""}}
/* primeiro item não visto das Últimas que não é a notícia do 1º cartão (se só houver ela, fica ela) */
function fd167Ult(){try{const r=igLista("_ult"),pr=fd167Primeiro();const its=r.itens||[];
  const ok=its.filter(x=>fd156Id(x.pid)!==pr);const i=ok.find(x=>!ULT_VISTOS.has(ultKey(x)))||its.find(x=>!ULT_VISTOS.has(ultKey(x)))||ok[0]||its[0];return i||null}catch(e){return null}}
_vp156Ult=function(){const i=fd167Ult();return i&&i.pid};
{const _vp167=vn112Primeira;vn112Primeira=function(sec){const r=_vp167.apply(this,arguments);try{
  if(sec==="_ult"){const i=fd167Ult();if(i)return {p:pautaById(i.pid),t:i.txt||""};return r}
  /* Em 5 min: a miniatura usa outra notícia quando a primeira já é o 1º cartão ou a das Últimas (só dentro do desenho do topo) */
  if(sec==="_5min"&&FD156_EXCL&&r&&r.p&&FD156_EXCL.has(fd156Id(r.p.id))){const ps=(igLista("_5min").ps||[]).filter(p=>!FD156_EXCL.has(fd156Id(p.id)));if(ps[0])return {p:ps[0],t:r.t}}}catch(e){}return r}}

/* ---- círculos do topo: a ilustração sem a etiqueta do canto (o círculo já tem o título) ---- */
function fd167SemEtiqueta(root){try{(root||document).querySelectorAll(".vn-tl svg text.t").forEach(t=>{if(+t.getAttribute("y")>34)return;
  const a=t.previousElementSibling;if(a&&a.tagName.toLowerCase()==="rect"&&+a.getAttribute("y")<=16&&+a.getAttribute("height")<=24)a.remove();t.remove()})}catch(e){}}
{const _tl167=vn112Tiles;vn112Tiles=function(){const r=_tl167.apply(this,arguments);fd167SemEtiqueta(document.getElementById("secs"));return r}}

/* ---- ao fechar um giro, a fileira do topo fica na mesma posição (antes rolava para centrar o círculo aberto) ---- */
var FD167_FILA=null;
/* a posição é guardada no toque (antes da animação de abrir, que pode rolar a fileira) */
window.addEventListener("click",e=>{const t=e.target&&e.target.closest&&e.target.closest("#secs .sb");if(!t||VIEW!=="feed"||document.querySelector("#layer .story"))return;try{FD167_FILA=document.getElementById("secs").scrollLeft}catch(_){}},true);
{const _ia167=igAbrir;igAbrir=function(){try{const b=document.getElementById("secs");if(b&&VIEW==="feed"&&!document.querySelector("#layer .story")&&FD167_FILA==null)FD167_FILA=b.scrollLeft}catch(e){}return _ia167.apply(this,arguments)}}

/* ---- topo do cartão: "seguindo" nunca cortado ---- */
function fd167Seguindo(el){try{const st=el.querySelector(":scope>.ph .fd156-st");if(!st||st.dataset.fd167)return;st.dataset.fd167="1";
  const w=document.createTreeWalker(st,NodeFilter.SHOW_TEXT);let n,achou=false;while(n=w.nextNode()){if(/ · seguindo\s*$/.test(n.nodeValue)){n.nodeValue=n.nodeValue.replace(/ · seguindo\s*$/,"");achou=true;break}}
  if(!achou)return;const s=document.createElement("span");s.className="fd167-seg";s.innerHTML=`${st.textContent.trim()?" · ":""}<b aria-hidden="true">✓</b> seguindo`;st.after(s)}catch(e){}}
{const _wt167=wireTracks;wireTracks=function(root){const r=_wt167.apply(this,arguments);try{if(root){const ls=root.matches&&root.matches(".post.vn-cn")?[root]:[...root.querySelectorAll(".post.vn-cn")];ls.forEach(fd167Seguindo)}fd167Curtir(root)}catch(e){}return r}}

/* ---- "curtir" no lugar de "gostar" (sem conta e no nome do botão) ---- */
function fd167Curtir(root){try{(root||document).querySelectorAll('[data-a="like"][aria-label="Gostei"]').forEach(b=>b.setAttribute("aria-label","Curtir"))}catch(e){}}
{const _ac167=avisoConta;avisoConta=function(){const r=_ac167.apply(this,arguments);try{const s=document.querySelector("#avisoconta>span");if(s&&/para gostar/.test(s.textContent))s.textContent="Você está só lendo. Entre para curtir, comentar e conversar."}catch(e){}return r}}

/* ---- rodapé do Feed: hora da última conferência e próxima atualização (sem a lista de horários) ---- */
function fd167Conferida(){try{const r=S.rodadas;if(!r||!r.itens||r.dia!==hojeSP())return null;let m=null;
  for(const k of Object.keys(r.itens)){const v=r.itens[k],x=/^(\d{2})h(\d{2})$/.exec(k);if(!v||!x)continue;const t=Date.parse(`${r.dia}T${x[1]}:${x[2]}:00-03:00`);if(isFinite(t)&&(!m||t>m.t))m={t,k:(+x[1])+"h"+x[2],pub:v.publicou===true}}
  return m}catch(e){return null}}
function fd167Rodape(){try{const p=document.querySelector("#extra .foot p");if(!p||!FEED)return;const at=Date.parse(FEED.atualizado_em||"");if(!isFinite(at))return;
  const c=fd167Conferida();const conf=c&&!c.pub&&c.t>at+5*60000?` Conferido às ${c.k}, sem novidades.`:"";
  let prox="";try{prox=" "+proximaRodadaTxt()}catch(e){}
  p.innerHTML=`<b>Atualizado ${esc(diaHora(FEED.atualizado_em))}.</b>${esc(conf)}${esc(prox)}`;p.classList.add("fd167-at")}catch(e){}}
/* lista "Outras notícias": a hora da breve, quando a rodada manda (campo "hora") */
function fd167BreveHora(){try{document.querySelectorAll("#extra .brv-b[data-breve]").forEach(bt=>{const b=(window.BREVES||[])[+bt.dataset.breve];const sp=bt.nextElementSibling;
  if(!b||!sp||sp.querySelector(".fd167-bh")||!tms(b.hora))return;sp.insertAdjacentHTML("beforeend",`<span class="fd167-bh"> · ${esc(quando(b.hora))}</span>`)})}catch(e){}}

{const _cr167=carregarRodadas;carregarRodadas=async function(){const r=await _cr167.apply(this,arguments);fd167Rodape();return r}}

/* ---- comentários: retorno pula linha no celular (só a seta publica); quebras de linha aparecem ---- */
var FD167_TOQUE=(()=>{try{return matchMedia("(pointer:coarse)").matches}catch(e){return false}})();
document.addEventListener("keydown",e=>{const t=e.target;if(!FD167_TOQUE||!t||t.id!=="ctext"||e.key!=="Enter")return;
  e.stopImmediatePropagation();/* o 106 publicava no Enter: no celular o retorno é só pular linha */
  setTimeout(()=>{try{if(typeof cm106Ajusta==="function")cm106Ajusta(t)}catch(_){}},0)},true);

/* o 106 trocava a quebra de linha por espaço a cada letra: guarda o texto antes e devolve depois */
document.addEventListener("input",e=>{const t=e.target;if(t&&t.id==="ctext"&&t.tagName==="TEXTAREA"&&/\n/.test(t.value))t._fd167={v:t.value,p:t.selectionStart}},true);
document.addEventListener("input",e=>{const t=e.target;if(!t||t.id!=="ctext"||!t._fd167)return;const x=t._fd167;t._fd167=null;
  if(t.value!==x.v){t.value=x.v;try{t.setSelectionRange(x.p,x.p)}catch(_){}try{if(typeof cm106Ajusta==="function")cm106Ajusta(t)}catch(_){}}});

/* ---- comentários: responder sem escrever "@Fulano" no campo; a resposta não repete o nome no texto ---- */
var FD167_RESP=null;
function fd167RespBarra(){const f=document.getElementById("cform");if(!f)return;let b=document.getElementById("fd167-rb");
  /* 19/11: o campo também diz que é resposta ("Responder a Fulano…") */
  const ct=document.getElementById("ctext");if(ct){if(!ct.dataset.ph0)ct.dataset.ph0=ct.getAttribute("placeholder")||"";ct.setAttribute("placeholder",FD167_RESP?`Responder a ${String(FD167_RESP).split(" ")[0]}…`:ct.dataset.ph0)}
  if(!FD167_RESP){if(b)b.remove();return}
  if(!b){b=document.createElement("div");b.id="fd167-rb";b.className="fd167-rb";f.before(b)}
  b.innerHTML=`<span>Respondendo a <b>${esc(FD167_RESP)}</b></span><button type="button" data-fd167rx aria-label="Cancelar resposta">✕</button>`}
document.addEventListener("click",e=>{const r=e.target&&e.target.closest&&e.target.closest("#cbox [data-resp]");if(r){e.stopPropagation();e.preventDefault();
    FD167_RESP=r.dataset.resp||null;fd167RespBarra();const i=document.getElementById("ctext");if(i){if(/^@/.test(i.value))i.value=i.value.replace(/^@\S[^\n]*?\s/,"");try{i.focus()}catch(_){}}return}
  if(e.target&&e.target.closest&&e.target.closest("[data-fd167rx]")){FD167_RESP=null;fd167RespBarra();try{document.getElementById("ctext").focus()}catch(_){}}},true);
/* ao publicar, a menção vai no começo do texto (é ela que agrupa a resposta embaixo do comentário) */
/* depois de publicar pela seta, a caixa volta ao tamanho de uma linha */
document.addEventListener("submit",e=>{if(!e.target||e.target.id!=="cform")return;setTimeout(()=>{const i=document.getElementById("ctext");if(i&&!i.value)try{if(typeof cm106Ajusta==="function")cm106Ajusta(i)}catch(_){}},0)});
document.addEventListener("submit",e=>{if(!e.target||e.target.id!=="cform"||!FD167_RESP)return;const i=document.getElementById("ctext");
  if(i&&i.value.trim()&&!/^@/.test(i.value.trim())){i.value="@"+FD167_RESP+" "+i.value.trim()}FD167_RESP=null;fd167RespBarra()},true);
function fd167SemMencao(){try{document.querySelectorAll("#cbox .clist li.fd156-resp").forEach(li=>{if(li.dataset.fd167)return;const rt=li.querySelector(".fd156-rt");const q=rt&&rt.textContent.replace(/^respondendo a /,"");
  const sp=li.querySelector(":scope>div>span");if(!q||!sp)return;li.dataset.fd167="1";
  for(const n of sp.childNodes){if(n.nodeType!==3)continue;const v=n.nodeValue;const k=v.indexOf("@"+q);if(k>=0&&!v.slice(0,k).trim()){n.nodeValue=v.slice(0,k)+v.slice(k+q.length+1).replace(/^\s+/,"");break}}})}catch(e){}}

/* ---- comentário guardado sem internet: aparece na conversa até ser enviado (ou cancelado) ---- */
function fd167Pend(){try{const box=document.getElementById("cbox");if(!box||!FD156_PID||!S.uid)return;
  const l=fd156CmtLe().filter(x=>x.pid===FD156_PID&&x.uid===S.uid);const k=l.map(x=>x.at).join(",");
  const tem=box.querySelectorAll("li.fd167-pend").length;if(box.dataset.fd167k===k&&tem===l.length)return;box.dataset.fd167k=k;
  box.querySelectorAll("li.fd167-pend").forEach(x=>x.remove());
  let ul=box.querySelector(".clist");const vazio=box.querySelector(":scope>.empty");
  if(!l.length){if(vazio)vazio.hidden=false;return}
  if(!ul){ul=document.createElement("ul");ul.className="clist";box.appendChild(ul)}if(vazio)vazio.hidden=true;
  ul.insertAdjacentHTML("beforeend",l.map(x=>`<li class="fd167-pend">${avatar(S.uid)}<div><span><b>${esc(nomeDe(S.uid))}</b> ${esc(x.texto)}</span><i>Enviando quando a internet voltar<button type="button" class="c-a" data-fd167cx="${x.at}">Cancelar</button></i></div></li>`).join(""));
  const sb=document.querySelector(".sheet .sh-b");if(sb)sb.scrollTop=sb.scrollHeight}catch(e){}}
function fd167Cancela(at){const l=fd156CmtLe();const i=l.findIndex(x=>String(x.at)===String(at));if(i<0)return;const x=l.splice(i,1)[0];fd156CmtGrava(l);
  const c=document.getElementById("ctext");if(c&&!c.value.trim()){c.value=x.texto;const b=document.querySelector("#cform .sendc");if(b)b.disabled=false;try{if(typeof cm106Ajusta==="function")cm106Ajusta(c)}catch(e){}}
  fd167Pend();toast("Comentário cancelado.")}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-fd167cx]");if(!b)return;e.stopPropagation();fd167Cancela(b.dataset.fd167cx)},true);
/* o Cancelar do aviso cancela o último guardado e atualiza a conversa */
fd156CmtCancela=function(){const l=fd156CmtLe();const x=l[l.length-1];if(x)fd167Cancela(x.at)};
{const _cg167=fd156CmtGuarda;fd156CmtGuarda=function(){const r=_cg167.apply(this,arguments);if(r)setTimeout(fd167Pend,0);return r}}
{const _ce167=fd156CmtEnvia;fd156CmtEnvia=async function(){try{return await _ce167.apply(this,arguments)}finally{fd167Pend()}}}
/* a conversa redesenhada (comentário novo, apagado, etc.) recoloca o pendente e tira a menção repetida */
{const _ag167=fd156Agrupa;fd156Agrupa=function(){const r=_ag167.apply(this,arguments);fd167SemMencao();fd167Pend();return r}}

/* ---- voltar do celular: refaz o caminho das abas ---- */
var FD167_ABAS=["capa","feed","msgs","busca","me"],FD167_PILHA=[];
