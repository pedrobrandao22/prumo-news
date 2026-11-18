/* ---------- uso dos recursos (para decidir o que manter) ---------- */
let USO=lsObj("radar-uso"),usoTimer=null;
let USO_SUJO=false;
function uso(k){USO[k]=(USO[k]||0)+1;lsSet("radar-uso",USO);USO_SUJO=true}
async function enviarUso(){if(!USO_SUJO||!S.db||!S.uid||!S.membro)return;USO_SUJO=false;try{await S.db.doc(`data/users/${S.uid}/uso`).set({contagem:USO,at:Date.now()})}catch(e){USO_SUJO=true}}
document.addEventListener("visibilitychange",()=>{if(document.hidden){enviarUso();if(typeof enviarHist==="function")enviarHist()}});

let LOTE={lista:[],pos:0};
var LOTE_PASSO=6; /* posts por vez ao rolar (o 148 baixa para 3 e emenda o próximo lote) */
const moreIO=("IntersectionObserver" in window)?new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))carregarMais()},{rootMargin:"600px"}):null;
function observarMais(){const m=$("#mais");if(!m)return;if(moreIO)moreIO.observe(m);else carregarMais()}
function garantirPost(pid){if(document.getElementById("p-"+pid))return true;const idx=LOTE.lista.findIndex(p=>p.id===pid);if(idx<0)return false;let g=0;while(LOTE.pos<=idx&&$("#mais")&&g++<20)carregarMais(true);return !!document.getElementById("p-"+pid)}

