/* 161 · Guardados numa lista só (decisão do Pedro, 16/11).
   A aba "Guardados" do Perfil junta as notícias guardadas e os posts guardados, com filtro Tudo · Notícias · Posts.
   No app todo a palavra é "Guardar" (antes os posts diziam "Salvar"/"Salvos"). Prefixo gd161. */
var GD161_F="tudo";
function gd161Noticias(){const sv=vp99Sv();return Object.entries(sv).filter(([k,x])=>x&&!vp99EhPost(k)).sort((a,b)=>(+b[1].at||0)-(+a[1].at||0))}
function gd161Chips(nN,nP){const c=(k,t,n)=>`<button type="button" role="tab" data-gd161="${k}" aria-selected="${GD161_F===k}">${t}${n?` <em>${n}</em>`:""}</button>`;
  return `<div class="gd161-f" role="tablist" aria-label="Filtrar guardados">${c("tudo","Tudo",nN+nP)}${c("noticias","Notícias",nN)}${c("posts","Posts",nP)}</div>`}
function gd161ListaNoticias(l){return `<ul class="svl gd161-nl">${l.map(([pid,x])=>{const s=x.snap||snapById(pid)||{};
  return linhaSalva(pid,s,`${esc(secNome(s.secao||"politica"))} · guardada ${esc(quando(x.at))}`,x.nota?`<span class="nt">Nota: ${esc(x.nota)}</span>`:"")}).join("")}</ul>`}
{const _pt161=pfTiles;pfTiles=function(l,aba,u){if(aba!=="salvos")return _pt161.apply(this,arguments);
  try{const nt=gd161Noticias(),nN=nt.length,nP=(l||[]).length;let h=gd161Chips(nN,nP);
    const verN=GD161_F!=="posts",verP=GD161_F!=="noticias";
    if(verN&&nN){if(GD161_F==="tudo"&&nP)h+=`<h3 class="gd161-h">Notícias</h3>`;h+=gd161ListaNoticias(nt)}
    if(verP&&nP){if(GD161_F==="tudo"&&nN)h+=`<h3 class="gd161-h">Posts</h3>`;h+=_pt161.call(this,l,"posts",u)}
    const vazio=(GD161_F==="tudo"&&!nN&&!nP)||(GD161_F==="noticias"&&!nN)||(GD161_F==="posts"&&!nP);
    if(vazio)h+=`<div class="pf-vz"><b>${GD161_F==="noticias"?"Nenhuma notícia guardada":GD161_F==="posts"?"Nenhum post guardado":"Nada guardado ainda"}</b><span>Toque em “Guardar” (o marcador) numa notícia ou num post para ele aparecer aqui.</span></div>`;
    return h+`<p class="hint vp99-so">Só você vê o que guardou.</p>`}
  catch(e){return _pt161.apply(this,arguments)}}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-gd161]");if(!b)return;e.preventDefault();e.stopPropagation();
  GD161_F=b.dataset.gd161;try{renderMe()}catch(_){}},true);
/* ver os guardados (do aviso de post guardado ou do menu do Perfil) abre a aba com o filtro certo */
function gd161Abre(f){GD161_F=f||"tudo";try{vp99VerSalvos()}catch(e){}}
/* textos: Guardar em todo o app */
{const _tt161=toast;toast=function(m,ac,fn){const a=[...arguments];try{if(m==="Salvo"){a[0]="Guardado";if(ac==="Ver salvos"){a[1]="Ver guardados";a[2]=()=>gd161Abre("posts")}}
  else if(m==="Removido dos salvos")a[0]="Removido dos guardados";else if(m==="Não deu para salvar agora.")a[0]="Não deu para guardar agora."}catch(e){}return _tt161.apply(this,a)}}
/* o item "Guardadas" do menu do Perfil abre a aba Guardados */
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest('#v-me .card.menu [data-vgo="saved"]');if(!b||!S.uid||!S.membro)return;
  e.preventDefault();e.stopPropagation();gd161Abre("noticias")},true);
{const _rm161=renderMe;renderMe=function(){const r=_rm161.apply(this,arguments);try{const b=document.querySelector('#v-me .card.menu [data-vgo="saved"] span');if(b&&b.textContent==="Guardadas")b.textContent="Guardados"}catch(e){}return r}}
