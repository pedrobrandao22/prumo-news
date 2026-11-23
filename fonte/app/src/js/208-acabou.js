/* ---------- 208: "Acabou de sair" (18/11 noite, decisão do Pedro: "manchete nova vira notícia na hora") ----------
   O robô de manchetes (tools/manchetes.py, agora a cada 10 min pelo "Relógio do Prumo") grava em novidades.json os
   assuntos que os veículos acabaram de publicar e que ainda não estão nas notícias da edição ("novos"). O que tem
   2 ou mais veículos, é relevante e saiu nas últimas 6 h vira uma notícia curta, na Capa (logo depois
   da manchete) e no topo do Feed: "Acabou de sair · há 20 min", o assunto e quem noticiou. Tocar abre a folha com as
   manchetes de cada veículo, com o link. A próxima rodada escreve a matéria completa; quando o assunto entra na edição,
   ele sai daqui sozinho (o robô tira dos "novos"). Prefixo ac208. */
var AC208_MAX=3;
function ac208Itens(){const d=typeof NOVID_AG!=="undefined"?NOVID_AG:null;if(!d||!FEED)return [];const g=Date.parse(d.gerado||"");if(g&&Date.now()-g>8*3600e3)return [];
  const ag=Date.now(),out=[],vistos=new Set();
  (Array.isArray(d.novos)?d.novos:[]).forEach(n=>{if(!n||!n.assunto||n.ja_e_breve||n.lixo||!n.relevante)return;const nf=n.n_fontes||0;if(nf<2)return;
    const ms=(Array.isArray(n.manchetes)?n.manchetes:[]).filter(m=>m&&m.titulo&&!AG_LIXO.test(m.titulo));if(!ms.length)return;
    const hs=ms.map(m=>agHoraMs(m.hora)).filter(Boolean);if(!hs.length)return;const h=Math.max(...hs);if(ag-h>6*3600e3)return;
    const t=[n.assunto,...ms.map(m=>m.titulo)].map(assuntoCurto).find(x=>x&&x.replace("…","").length>=24);if(!t||vistos.has(t)||AG_LIXO.test(t))return;vistos.add(t);
    const vs=[...new Set(ms.map(m=>m.veiculo).filter(Boolean))];
    out.push({t,h,nf,sec:n.secao||"",ms:ms.sort((a,b)=>agHoraMs(b.hora)-agHoraMs(a.hora)),vs,peso:nf*2+(["politica","economia"].includes(n.secao)?2:0)})});
  return out.sort((a,b)=>b.h-a.h||b.peso-a.peso).slice(0,AC208_MAX)}
function ac208Vs(vs){if(!vs.length)return "";const l=vs.slice(0,3);
  /* 19/11 tarde: com mais de 3, um "e" só ("A, B, C e mais 1"), e o "mais 1" não fica sozinho na linha */
  if(vs.length>3)return "Noticiado por "+l.join(", ")+"\u00a0e\u00a0mais\u00a0"+(vs.length-3);
  return "Noticiado por "+(l.length>1?l.slice(0,-1).join(", ")+" e "+l[l.length-1]:l[0])}
function ac208HTML(onde){let l=ac208Itens();
  /* 19/11 (testador): na Capa, logo abaixo da manchete, futebol só com 3 ou mais veículos; no Feed entra tudo */
  if(onde==="capa")l=l.filter(x=>x.sec!=="esportes"||x.nf>=3);if(!l.length)return "";AC208_L[onde]=l;
  return `<section class="ac208 ac208-${onde}" aria-label="Acabou de sair"><h3 class="ac208-h"><i aria-hidden="true"></i>Acabou de sair</h3>${l.map((x,i)=>{const s=x.sec&&typeof secNome==="function"?secNome(x.sec):"";
    return `<button type="button" class="ac208-i" data-ac208="${onde}:${i}"${x.sec?` style="--c:${secCor(x.sec)}"`:""}><span class="ac208-k">${s?esc(s)+" · ":""}${esc(quando(new Date(x.h).toISOString()))}</span><b>${esc(x.t)}</b><small>${esc(ac208Vs(x.vs))}</small></button>`}).join("")}</section>`}
var AC208_L={};
function ac208Abre(k){const [o,i]=String(k).split(":");const x=(AC208_L[o]||[])[+i];if(!x)return;uso("acabou_sair");
  sheet("Acabou de sair",`<p class="ac208-st">${esc(x.t)}</p><p class="hint" style="margin:4px 0 12px">O Prumo ainda vai escrever a matéria completa. Enquanto isso, veja quem já noticiou:</p>
    <ul class="ac208-ml">${x.ms.slice(0,8).map(m=>`<li><a href="${esc(m.url||"#")}" target="_blank" rel="noopener noreferrer"><span>${esc(m.veiculo||"")}${m.hora?" · "+esc(String(m.hora).replace(/^\d{2}\/\d{2} /,"")):""}</span><b>${esc(m.titulo)}</b></a></li>`).join("")}</ul>`)}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-ac208]");if(b){e.preventDefault();e.stopPropagation();ac208Abre(b.dataset.ac208)}},true);
/* Feed: o bloco entra no topo da lista (só em "Tudo") */
function ac208Feed(){const box=document.getElementById("posts");if(!box)return;box.querySelector(":scope > .ac208")?.remove();if(typeof FILTRO!=="undefined"&&FILTRO!=="tudo")return;
  const h=ac208HTML("feed");if(!h)return;const t=document.createElement("template");t.innerHTML=h;let first=box.querySelector(":scope > .post, :scope > article, :scope > div");
  /* 19/11 madrugada (testador): não separar a notícia dos comentários dos amigos que vêm colados nela */
  while(first&&first.nextElementSibling&&first.nextElementSibling.classList.contains("fc107-junto"))first=first.nextElementSibling;
  if(first&&first.nextSibling)box.insertBefore(t.content.firstChild,first.nextSibling);else box.prepend(t.content.firstChild)}
/* chegaram manchetes novas: troca os blocos no lugar, sem redesenhar a tela */
function ac208Atualiza(){try{const c=$("#v-capa .ac208");const h=ac208HTML("capa");if(c){if(h)c.outerHTML=h;else c.remove()}
  else if(h){const ref=$("#v-capa .cp-rel")||$("#v-capa .cpi-man");if(ref)ref.insertAdjacentHTML("afterend",h)}}catch(e){}try{ac208Feed()}catch(e){}}
