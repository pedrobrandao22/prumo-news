/* ---------- assinaturas que dependem da edição e do dia ---------- */
const UNS={};
function trocaSub(k,id,fn){if(UNS[k]?.id===id)return false;try{UNS[k]?.off&&UNS[k].off()}catch(e){}UNS[k]={id,off:fn()};return true}
function subEdicao(){derivaQuiz();renderChgBox();updatePlayBadge();if(VIEW==="play")renderPlay()}
/* rodadas.json e erros-respostas.json: arquivos do site, publicados pelas rodadas */
let RODT=0,ERRT=0;
async function carregarRodadas(forcar){if(!forcar&&Date.now()-RODT<60000)return;RODT=Date.now();
  try{const r=await fetch("rodadas.json",{cache:"no-cache"});if(!r.ok)return;const j=await r.json();const nv=j&&typeof j==="object"&&j.dia===hojeSP()&&j.itens&&typeof j.itens==="object"?j:{};
    if(JSON.stringify(nv)!==JSON.stringify(S.rodadas)){S.rodadas=nv;if(VIEW==="me")renderMe();if(VIEW==="feed"&&document.querySelector("#posts .late:not(.offl)")){try{const y=scrollY;renderPosts(true);window.scrollTo(0,y)}catch(e){}}if($("#rodbox"))abrirRodadas(true)}}catch(e){}}
async function carregarErrosResp(){if(Date.now()-ERRT<30000)return;ERRT=Date.now();
  try{const r=await fetch("erros-respostas.json",{cache:"no-cache"});if(!r.ok)return;const j=await r.json();if(!j||typeof j!=="object"||Array.isArray(j))return;
    if(JSON.stringify(j)!==JSON.stringify(S.errosResp)){S.errosResp=j;if(VIEW==="me")renderMe()}}catch(e){}}
