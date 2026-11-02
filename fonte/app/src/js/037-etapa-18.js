/* ---------- Etapa 18 ---------- */
function matLetraAtualiza(){const b=$("#layer .mat-aap");if(!b)return;const i=FZ.indexOf(PREF.fonte||1);b.querySelector("[data-matfz='-1']").disabled=i<=0;b.querySelector("[data-matfz='1']").disabled=i>=FZ.length-1;
  b.querySelectorAll(".aa-p i").forEach((x,k)=>x.classList.toggle("on",k<=Math.max(0,i)))}
function matLetra(){const top=$("#layer .mat-top"),bt=$("#layer [data-mataa]");if(!top||!bt)return;const ab=$("#layer .mat-aap");if(ab){ab.remove();bt.setAttribute("aria-expanded","false");return}
  const d=document.createElement("div");d.className="mat-aap";d.setAttribute("role","group");d.setAttribute("aria-label","Tamanho da letra");
  d.innerHTML=`<button type="button" data-matfz="-1" aria-label="Letra menor">A</button><span class="aa-p" aria-hidden="true">${FZ.map(()=>"<i></i>").join("")}</span><button type="button" data-matfz="1" aria-label="Letra maior">A</button>`;
  top.appendChild(d);bt.setAttribute("aria-expanded","true");matLetraAtualiza()}
document.addEventListener("click",e=>{const ab=$("#layer .mat-aap");if(ab&&!e.target.closest(".mat-aap,[data-mataa]")){ab.remove();const bt=$("#layer [data-mataa]");if(bt)bt.setAttribute("aria-expanded","false")}},true);
function matZoom(el){const img=el.querySelector("img");if(!img||!img.classList.contains("ok"))return;const L=$("#layer2");if(!L)return;const vazio=!L.innerHTML;const cr=el.querySelector(".cred");
  L.innerHTML=`<div class="zoom" role="dialog" aria-modal="true" aria-label="Foto"><button type="button" class="zoom-x" data-close aria-label="Fechar">✕</button><div class="zoom-c" data-close><img src="${escU(img.currentSrc||img.src)}" alt="${esc(img.alt||"")}"></div>${cr?`<p class="zoom-cr">${esc(cr.textContent)}</p>`:""}</div>`;
  if(vazio&&pushH())HST++;uso("foto_zoom")}

