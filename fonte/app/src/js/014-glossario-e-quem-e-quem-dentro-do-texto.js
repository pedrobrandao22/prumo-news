/* ---------- glossário e "quem é quem" dentro do texto ---------- */
function marcarTermos(txt){
  txt=String(txt??"");const lista=[...Object.keys(FEED?.pessoas||{}).map(k=>["p",k]),...Object.keys(FEED?.glossario||{}).map(k=>["g",k])].filter(([,k])=>k).sort((a,b)=>b[1].length-a[1].length);
  if(!lista.length)return esc(txt);const tipo=new Map();lista.forEach(([t,k])=>{if(!tipo.has(k))tipo.set(k,t)});
  const re=new RegExp(`(^|[^\\p{L}\\d])(${[...tipo.keys()].map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})(?=$|[^\\p{L}\\d])`,"gu");
  const usados=window.MT_USADOS||new Set();let out="",last=0,m;
  while((m=re.exec(txt))){const k=m[2],ini=m.index+m[1].length;if(usados.has(k))continue;usados.add(k);const t=tipo.get(k);
    out+=esc(txt.slice(last,ini))+`<button type="button" class="gl ${t==="p"?"gp":""}" data-gl="${t}" data-k="${esc(k)}">${esc(k)}</button>`;last=ini+k.length}
  return out+esc(txt.slice(last));
}
function abrirTermo(t,k){uso(t==="p"?"quem_e":"glossario");
  if(t==="p"){abrirPessoa(k)}
  else{const d=FEED.glossario?.[k];/* 19/11 tarde: termo fora da edição não abre caixa vazia */
    if(!d){const ps=(FEED.pautas||[]).filter(p=>{const n=p&&p.neutro||{};return norm(String(n.titulo||"")+" "+String(n.texto||"")).indexOf(norm(k))>=0}).slice(0,8),L=lente();
      sheet("O que é",`<div class="card"><b style="font-size:18px">${esc(k)}</b><p class="hint">Sem verbete nesta edição.</p></div>${ps.length?`<h4 class="pes-h">Nas notícias (${ps.length})</h4><ul class="mud-l">${ps.map(p=>`<li><button type="button" data-cpnovir="${esc(p.id)}"><span class="mud-t">${esc(versao(p,L).titulo)}</span></button></li>`).join("")}</ul>`:""}`);return}
    sheet("O que é",`<div class="card"><b style="font-size:18px">${esc(k)}</b><p>${esc(d)}</p></div>`)}
}
function abrirExplicador(tema){uso("entenda");
  const e=(FEED.explicadores||{})[tema];if(!e)return;
  sheet("Entenda",`<span class="kick" style="color:var(--accent)">${esc(tema)}</span><h3 style="margin:0;font-family:var(--f-display);font-weight:700;letter-spacing:-.01em;font-size:22px;line-height:1.2">${esc(e.titulo||tema)}</h3><p class="lead" style="margin:0">${marcarTermos(e.texto||"")}</p>${(e.pontos||[]).length?`<ul class="enq">${e.pontos.map(x=>`<li><span>${esc(x)}</span></li>`).join("")}</ul>`:""}${e.atualizado?`<p class="hint">Atualizado em ${esc(e.atualizado)}.</p>`:""}`);
}

