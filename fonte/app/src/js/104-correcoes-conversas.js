/* ---------- Correções de Conversas (QA 02/11) ---------- */
function dm104Trecho(m){const t=String(dmTexto(m)||"").replace(/\s+/g," ").trim();return t.length>28?t.slice(0,27)+"…":t}
/* tocar na pílula de reações: mostra quem reagiu com o quê; a sua dá para tirar */
function dm104Reacoes(mid){const m=allMsgs().find(x=>x.id===mid);if(!m)return;const rs=allMsgs().filter(x=>x.tipo==="reacao_msg"&&x.snap&&x.snap.ref===mid);if(!rs.length){dmAcoes(mid);return}
  sheet("Reações",`<ul class="dm104-rl">${rs.map(r=>{const eu=r.de===S.uid;return `<li><button type="button" ${eu?`data-dm104tira="${esc(mid)}" data-e="${esc(r.texto||"❤️")}"`:"disabled"}>${avatar(r.de)}<span class="dm104-rn"><b>${esc(eu?"Você":nomeDe(r.de))}</b>${eu&&S.amigos.has(THREAD)?"<small>Toque para tirar</small>":""}</span><span class="dm104-re">${esc(String(r.texto||"❤️").slice(0,8))}</span></button></li>`}).join("")}</ul>`,
    S.amigos.has(THREAD)?`<button type="button" class="btn ghost" style="width:100%" data-dm104mais="${esc(mid)}">Reagir ou responder</button>`:"")}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;let b;
  if(b=t.closest("#v-msgs .dm-rx[data-dmacoes]")){e.stopImmediatePropagation();e.preventDefault();dm104Reacoes(b.dataset.dmacoes);return}
  if(b=t.closest("[data-dm104tira]")){e.stopImmediatePropagation();const mid=b.dataset.dm104tira,em=b.dataset.e;closeLayer();if(S.amigos.has(THREAD))dmReagir(mid,em);return}
  if(b=t.closest("[data-dm104mais]")){e.stopImmediatePropagation();const mid=b.dataset.dm104mais;closeLayer();setTimeout(()=>dmAcoes(mid),60);return}},true);
window.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-dm104den]");if(!b)return;e.stopImmediatePropagation();const m=allMsgs().find(x=>x.id===b.dataset.dm104den);closeLayer();if(!m)return;
  setTimeout(()=>{abrirDenuncia("mensagem",m.de,m.id);try{const p=$("#layer .sheet p")||$("#layer2 .sheet p");if(p)p.textContent=`A mensagem de ${nomeDe(m.de)} ${denunciaDestino()}. ${nomeDe(m.de)} não fica sabendo quem denunciou.`}catch(_){}},60)},true);
/* notícia ou post mandado na conversa: abre por cima da conversa (o voltar traz de volta), em vez de jogar para o Feed */
function dm104AbrePub(x){if($("#layer").innerHTML)closeLayer();PFV={u:x.autor,aba:"posts",modo:"posts",lista:[x],i:0,daGrade:false};
  $("#layer").innerHTML=`<div class="pfv" role="dialog" aria-modal="true" aria-label="Publicação"></div>`;if(pushH())HST++;pfvDesenha()}
window.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest||VIEW!=="msgs"||!THREAD)return;const b=t.closest("#v-msgs .dm-thr [data-open],#layer .sheet .opt [data-open]");if(!b)return;
  const pid=b.dataset.open||"",naFolha=!!b.closest("#layer");let abre=null;
  if(pid.indexOf("u:")===0){const x=typeof pubDe==="function"&&pubDe(pid.slice(2));if(x&&x.tipo!=="story"&&typeof pfvDesenha==="function")abre=()=>dm104AbrePub(x)}
  else if(pautaById(pid)){const dm=b.closest(".dm-m"),mm=dm&&allMsgs().find(x=>x.id===dm.dataset.mid);if(mm&&mm.tipo==="mencao"&&typeof openComments==="function")abre=()=>openComments(pid);else if(typeof abrirMateria==="function")abre=()=>abrirMateria(pid)}
  if(!abre)return;e.stopImmediatePropagation();e.preventDefault();if(naFolha){closeLayer();setTimeout(abre,60)}else abre()},true);
/* conta excluída: avatar neutro e sem repetir "Conta excluída" no cabeçalho */
function dm104Excluidas(){try{const v=$("#v-msgs");if(!v)return;v.querySelectorAll("[data-thread]").forEach(b=>{const u=b.dataset.thread;if(!S.membros[u]?.excluido)return;const a=b.querySelector(".av");if(a){a.classList.add("dm104-exc");a.textContent=""}});
  if(THREAD&&S.membros[THREAD]?.excluido){const h=v.querySelector(".dm-th-h");if(h){h.querySelectorAll(".av").forEach(a=>{a.classList.add("dm104-exc");a.textContent=""});const s=h.querySelector(".dm-who small");if(s)s.textContent="Não está mais no Prumo"}
    v.querySelectorAll(".dm-av .av").forEach(a=>{a.classList.add("dm104-exc");a.textContent=""})}}catch(e){}}
/* teclado abrindo dentro da conversa: rola até a última mensagem, para ela não ficar atrás do teclado */
{let ant104=0,alt104=innerHeight;const kb104=()=>{try{const k=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--kb"))||0,menor=innerHeight<alt104-80;alt104=innerHeight;if((k>ant104+40||menor)&&document.body.classList.contains("dm-conv")&&document.activeElement&&document.activeElement.id==="mtext")requestAnimationFrame(()=>window.scrollTo(0,document.body.scrollHeight));ant104=k}catch(e){}};
  if(window.visualViewport){visualViewport.addEventListener("resize",()=>setTimeout(kb104,0))}window.addEventListener("resize",()=>setTimeout(kb104,0));
  document.addEventListener("focusin",e=>{if(e.target&&e.target.id==="mtext")setTimeout(kb104,350)})}
/* tocar na citação de uma resposta leva até a mensagem original */
document.addEventListener("click",e=>{const q=e.target.closest&&e.target.closest("#v-msgs .dm-m div.dm-q");if(!q)return;const dm=q.closest(".dm-m"),m=dm&&allMsgs().find(x=>x.id===dm.dataset.mid);const ref=m&&m.tipo==="resposta"&&m.snap&&m.snap.q&&m.snap.q.id;if(!ref)return;
  const el=document.querySelector(`#v-msgs [data-mid="${CSS.escape(String(ref))}"]`);if(!el){toast("A mensagem original foi apagada.");return}
  el.scrollIntoView({block:"center",behavior:ANIM_OK()?"smooth":"auto"});el.classList.remove("dm104-luz");void el.offsetWidth;el.classList.add("dm104-luz");setTimeout(()=>el.classList.remove("dm104-luz"),1600)});
