/* ---------- Etapa 76: primeira abertura guiada ---------- */
const TOUR_IC={capa:'<svg viewBox="0 0 24 24"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  feed:'<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><rect x="4" y="13" width="16" height="7.5" rx="2"/></svg>',
  ativ:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  app:'<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>'};
function tourTelas(nome){return [
  {ic:"capa",k:"Capa",t:nome?`Bem-vindo, ${nome}`:"As notícias do dia",p:"A Capa traz o que importa hoje, em poucas linhas e sem viés. Toque na manchete para ler ali mesmo e escolha a versão Neutra, de Direita ou de Esquerda.",
    demo:`<div class="tr-capa"><i class="tr-k"></i><b></b><b class="c"></b><span class="tr-seg"><em class="on">Neutra</em><em>Direita</em><em>Esquerda</em></span></div>`},
  {ic:"feed",k:"Feed e stories",t:"Notícias que dá para curtir",p:"No Feed, as notícias viram posts e stories, junto com o que seus amigos publicam. Curta, comente, vote nas enquetes e mande para quem quiser.",
    demo:`<div class="tr-feed"><span><i></i><i></i><i></i><i></i></span><div><b></b><b class="c"></b></div><p><em>♥</em><em>💬</em><em>➤</em></p></div>`},
  {ic:"ativ",k:"Amigos e Atividade",t:"Seus amigos estão aqui",p:"Quem te convidou já é seu amigo. O ♥ no topo mostra quem curtiu, comentou ou te marcou, e quando uma cobertura que você segue ganha novidade.",
    demo:`<div class="tr-ativ"><p><i></i><span><b></b><b class="c"></b></span></p><p><i></i><span><b></b><b class="c"></b></span></p><p><i class="q"></i><span><b></b><b class="c"></b></span></p></div>`},
  {ic:"app",k:"Use como app",t:"Deixe na tela de início",p:/iPhone|iPad|iPod/i.test(navigator.userAgent)?"No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”. O Prumo abre como um app, mais rápido e em tela cheia.":"No Chrome, toque nos três pontinhos e depois em “Instalar app” ou “Adicionar à tela inicial”. O Prumo abre como um app, mais rápido e em tela cheia.",
    demo:`<div class="tr-app"><i></i><i></i><i class="p">P</i><i></i></div>`}]}
function abrirTour(nome){const ts=tourTelas(nome);if($("#layer").innerHTML)closeLayer();uso("tour");
  $("#layer").innerHTML=`<div class="tour" role="dialog" aria-modal="true" aria-label="Como usar o Prumo"><button type="button" class="tr-pular" data-tourfim>Pular</button>
    <div class="tr-trilho">${ts.map((x,i)=>`<section class="tr-t" aria-label="${i+1} de ${ts.length}"><div class="tr-demo">${x.demo}</div><span class="tr-kk">${TOUR_IC[x.ic]}${esc(x.k)}</span><h2>${esc(x.t)}</h2><p>${esc(x.p)}</p></section>`).join("")}</div>
    <div class="tr-pe"><span class="tr-dots">${ts.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join("")}</span><button type="button" class="btn tr-prox" data-tourprox>Próximo</button></div></div>`;
  if(pushH())HST++;const tr=$("#layer .tr-trilho");
  const at=()=>{const i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));document.querySelectorAll("#layer .tr-dots i").forEach((d,k)=>d.classList.toggle("on",k===i));const b=$("#layer .tr-prox");if(b)b.textContent=i>=ts.length-1?"Começar a ler":"Próximo";const pl=$("#layer .tr-pular");if(pl)pl.style.visibility=i>=ts.length-1?"hidden":"";return i};
  tr.addEventListener("scroll",()=>{clearTimeout(tr._t);tr._t=setTimeout(at,60)},{passive:true});
  try{localStorage.setItem("prumo-tour-visto","1")}catch(e){}}
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;
  if(t.closest("[data-tourfim]")){e.stopPropagation();closeLayer();return}
  if(t.closest("[data-tourprox]")){e.stopPropagation();const tr=$("#layer .tr-trilho");if(!tr)return;const n=tr.children.length,i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));
    if(i>=n-1){closeLayer();return}tr.scrollTo({left:(i+1)*tr.clientWidth,behavior:ANIM_OK()?"smooth":"auto"});return}
  if(t.closest("[data-tourver]")){e.stopPropagation();abrirTour();return}},true);
/* quem acabou de entrar vê o guia no lugar do texto de boas-vindas */
{const _bv76=boasVindas;boasVindas=function(nome){let teste=false;try{teste=navigator.webdriver&&localStorage.getItem("prumo-teste-tour")!=="1"}catch(e){}if(teste)return _bv76.apply(this,arguments);setTimeout(()=>abrirTour(String(nome||"").split(" ")[0]),280)}}
/* rever em Perfil › Conta */
{const _rm76=renderMe;renderMe=function(){const r=_rm76.apply(this,arguments);try{const m=$("#v-me .pf-conta .card.menu");if(m&&!m.querySelector("[data-tourver]"))m.insertAdjacentHTML("beforeend",`<button type="button" data-tourver><span>Como usar o Prumo</span><i>›</i></button>`)}catch(e){}return r}}

