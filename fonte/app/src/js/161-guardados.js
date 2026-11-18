/* 161 · Guardados numa lista só (decisão do Pedro, 16/11).
   A aba "Guardados" do Perfil junta as notícias guardadas e os posts guardados, com filtro Tudo · Notícias · Posts.
   No app todo a palavra é "Guardar" (antes os posts diziam "Salvar"/"Salvos"). Prefixo gd161. */
var GD161_F="tudo";
function gd161Noticias(){const sv=vp99Sv();return Object.entries(sv).filter(([k,x])=>x&&!vp99EhPost(k)).sort((a,b)=>(+b[1].at||0)-(+a[1].at||0))}
function gd161Chips(nN,nP){const c=(k,t,n)=>`<button type="button" role="tab" data-gd161="${k}" aria-selected="${GD161_F===k}">${t}${n?` <em>${n}</em>`:""}</button>`;
  return `<div class="gd161-f" role="tablist" aria-label="Filtrar guardados">${c("tudo","Tudo",nN+nP)}${c("noticias","Notícias",nN)}${c("posts","Posts",nP)}</div>`}
function gd161ListaNoticias(l){return `<ul class="svl gd161-nl">${l.map(([pid,x])=>{const s=x.snap||snapById(pid)||{};
  return linhaSalva(pid,s,`${esc(secNome(s.secao||"politica"))} · guardada ${esc(quando(x.at))}`,x.nota?`<span class="nt">Nota: ${esc(x.nota)}</span>`:"")}).join("")}</ul>`}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-gd161]");if(!b)return;e.preventDefault();e.stopPropagation();
  GD161_F=b.dataset.gd161;try{renderMe()}catch(_){}},true);
/* ver os guardados (do aviso de post guardado ou do menu do Perfil) abre a aba com o filtro certo */
function gd161Abre(f){GD161_F=f||"tudo";try{vp99VerSalvos()}catch(e){}}
/* textos: Guardar em todo o app */
/* o item "Guardadas" do menu do Perfil abre a aba Guardados */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('#v-me .card.menu [data-vgo="saved"]');if(!b||!S.uid||!S.membro)return;
  e.preventDefault();e.stopPropagation();gd161Abre("noticias")},true);
