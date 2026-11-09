/* Melhoria contínua 09/11/2026: o capítulo da linha do tempo no "Nesta matéria" leva o mesmo nome da seção
   ("Como a história andou" ou o título próprio da linha do tempo), em vez do fixo "Linha do tempo". */
function mc143NomeTl(){const m=$("#layer .mat");if(!m)return;const tl=m.querySelector(".mat-tl.fs2-alvo");if(!tl||!tl.id)return;
  const bt=m.querySelector(`.fs2-cap-b[aria-controls="${tl.id}"]`);if(!bt)return;
  const b=tl.querySelector(":scope > b"),nome=((b&&b.textContent)||"").replace(/\s+/g," ").trim();
  const t=[...bt.childNodes].filter(n=>n.nodeType===3).pop();if(t&&nome.length>=3&&nome.length<=32)t.textContent=nome}
if(typeof f113Caps==="function"){const _fc143=f113Caps;f113Caps=function(){const r=_fc143.apply(this,arguments);try{mc143NomeTl()}catch(e){}return r}}
