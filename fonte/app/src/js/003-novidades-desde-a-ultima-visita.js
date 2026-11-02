/* ---------- novidades desde a última visita ---------- */
function calcularNovidades(){
  NOVAS=new Set();ATUALIZADAS=new Set();
  const k=PREF.conhecidas||{};const primeiraVez=!Object.keys(k).length;
  (FEED.pautas||[]).forEach(p=>{if(!k[p.id]){if(!primeiraVez)NOVAS.add(p.id)}else{const u=ultimaAtualizacao(p);if(u&&tms(u)>tms(k[p.id]))ATUALIZADAS.add(p.id)}const t=LIDAS.get(p.id),u2=ultimaAtualizacao(p);if(t&&u2&&tms(u2)>tms(t))ATUALIZADAS.add(p.id)});
}
function registrarConhecidas(){
  const k=PREF.conhecidas||(PREF.conhecidas={});const agora=new Date().toISOString();PREF.visitaAtual=agora;
  const prim=!Object.keys(k).length;(FEED.pautas||[]).forEach(p=>{if(!prim&&!lidaAtual(p)&&!SEEN.has(seenKey(p))&&!CPV.has(p.id)&&!(k[p.id]&&!ATUALIZADAS.has(p.id)))return;const u=ultimaAtualizacao(p)||p.hora||agora;k[p.id]=tms(u)>tms(k[p.id])?u:k[p.id]});
  const ids=Object.keys(k);if(ids.length>400)ids.sort((a,b)=>tms(k[a])-tms(k[b])).slice(0,ids.length-400).forEach(i=>delete k[i]);
  salvarPrefs();
}

