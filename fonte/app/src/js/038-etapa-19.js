/* ---------- Etapa 19 ---------- */
(function(){const ant=abrirMateria;abrirMateria=function(){window.MT_USADOS=new Set();try{return ant.apply(this,arguments)}finally{window.MT_USADOS=null}}})();
var INST_EV=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();INST_EV=e});
addEventListener("appinstalled",()=>{lsSet("prumo-inst",{ok:1});const c=$("#v-capa .cp-inst");if(c)c.remove();uso("instalou")});
(function(){try{const d=lsGet("prumo-dias",[]),h=hojeSP();const l=Array.isArray(d)?d.filter(x=>typeof x==="string"):[];if(!l.includes(h)){l.push(h);lsSet("prumo-dias",l.slice(-30))}}catch(e){}})();
function instTipo(){try{if(matchMedia("(display-mode: standalone)").matches||navigator.standalone)return null}catch(e){}
  const st=lsGet("prumo-inst",{})||{};if(st.ok||(st.ate&&Date.now()<st.ate))return null;const d=lsGet("prumo-dias",[]);if(!Array.isArray(d)||d.length<2)return null;
  if(INST_EV)return "android";const ua=navigator.userAgent||"";if(/iPhone|iPad|iPod/.test(ua)&&/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|GSA/.test(ua))return "ios";return null}
function instHTML(){const k=instTipo();if(!k)return "";
  return `<div class="cp-inst"><div class="ci-t"><b>Tenha o Prumo na tela do celular</b><span>${k==="ios"?`Toque em <i class="ci-sh" aria-label="Compartilhar"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg></i> <b>Compartilhar</b> e depois em <b>“Adicionar à Tela de Início”</b>.`:"Abre na hora, como um app, e não ocupa espaço."}</span></div><div class="ci-b">${k==="android"?`<button type="button" class="btn" data-instok>Instalar</button>`:""}<button type="button" class="ci-n" data-instnao>Agora não</button></div></div>`}
async function instalar(){const ev=INST_EV;if(!ev)return;uso("instalar");try{ev.prompt();const r=await ev.userChoice;if(r&&r.outcome==="accepted"){lsSet("prumo-inst",{ok:1});const c=$("#v-capa .cp-inst");if(c)c.remove()}}catch(e){}INST_EV=null}

