/* ---------- topo: semana, mudanças, agenda, quiz ---------- */
function topoHTML(){
  if(FILTRO!=="tudo")return "";
  let h="";const sem=FEED.semana;
  if(sem&&(sem.itens||[]).length)h+=`<div class="chg gut wk"><h4>${esc(sem.titulo||"A semana em resumo")}</h4><ul>${sem.itens.slice(0,8).map(i=>`<li><span><b>${esc(i.tema)}.</b> ${esc(i.texto)}</span></li>`).join("")}</ul></div>`;
  h+=agendaHTML();
  return h;
}
