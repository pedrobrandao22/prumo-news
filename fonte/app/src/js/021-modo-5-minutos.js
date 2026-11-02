/* ---------- modo 5 minutos ---------- */
function abrir5min(){uso("5min");
  const top=ordenadas(visiveis()).filter(p=>!lidaAtual(p)).slice(0,5);const lista=top.length?top:ordenadas(visiveis()).slice(0,5);
  sheet("Em 5 minutos",`<p class="hint" style="margin:0">As ${lista.length} notícias mais importantes que você ainda não leu.</p>${lista.map((p,i)=>`<div class="five"><span class="n">${i+1}</span><div><span class="kick" style="color:${secCor(secOf(p))}">${esc(secNome(secOf(p)))} · ${esc(p.tag||"")}</span><b>${esc(p.neutro?.titulo)}</b><p>${marcarTermos(p.neutro?.texto||"")}</p><button type="button" class="link" data-goto="${esc(p.id)}">Abrir o post</button></div></div>`).join("")}<button type="button" class="btn" data-5lidas="${esc(lista.map(p=>p.id).join(","))}">Marcar as ${lista.length} como lidas</button>`);
}

