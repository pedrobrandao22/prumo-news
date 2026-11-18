/* ---------- Etapa 39: Feed ---------- */
function legendaPost(p){const L=lente(),sub=capaSub(p,L,"")||(pontosDe(p,L)||[])[0]||"";if(!sub)return "";
  return `<button type="button" class="pt-cap" data-capmat="${esc(p.id)}"><span class="pt-cap-t">${esc(sub)}</span><span class="pt-cap-m">Ler a matéria <i aria-hidden="true">›</i></span></button>`}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-capmat]");if(!b)return;e.stopPropagation();uso("feed_legenda");abrirMateria(b.dataset.capmat)},true);
/* "5 min" vira o primeiro círculo do topo do Feed */

document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-5min]");if(!b)return;e.stopPropagation();const o=$("#b-5min");if(o)o.click()},true);
/* curtir: o botão "pula" ao marcar */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest('.post .act[data-a="like"]');if(!b)return;setTimeout(()=>{if(b.getAttribute("aria-pressed")==="true"||b.classList.contains("on")){b.classList.remove("pulsa");void b.offsetWidth;b.classList.add("pulsa")}},30)});

