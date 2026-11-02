/* ---------- uso dos recursos (para decidir o que manter) ---------- */
let USO=lsObj("radar-uso"),usoTimer=null;
let USO_SUJO=false;
function uso(k){USO[k]=(USO[k]||0)+1;lsSet("radar-uso",USO);USO_SUJO=true}
async function enviarUso(){if(!USO_SUJO||!S.db||!S.uid||!S.membro)return;USO_SUJO=false;try{await S.db.doc(`data/users/${S.uid}/uso`).set({contagem:USO,at:Date.now()})}catch(e){USO_SUJO=true}}
document.addEventListener("visibilitychange",()=>{if(document.hidden){enviarUso();if(typeof enviarHist==="function")enviarHist()}});

let LOTE={lista:[],pos:0};
const moreIO=("IntersectionObserver" in window)?new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))carregarMais()},{rootMargin:"600px"}):null;
function observarMais(){const m=$("#mais");if(!m)return;if(moreIO)moreIO.observe(m);else carregarMais()}
function garantirPost(pid){if(document.getElementById("p-"+pid))return true;const idx=LOTE.lista.findIndex(p=>p.id===pid);if(idx<0)return false;let g=0;while(LOTE.pos<=idx&&$("#mais")&&g++<20)carregarMais(true);return !!document.getElementById("p-"+pid)}
function carregarMais(sync){
  const m=$("#mais");if(!m)return;const prox=LOTE.lista.slice(LOTE.pos,LOTE.pos+6);LOTE.pos+=prox.length;
  const tmp=document.createElement("div");tmp.innerHTML=prox.map(postSeguro).join("");const frag=[...tmp.children];
  frag.forEach(el=>m.before(el));prox.forEach(p=>updateSocial(p.id));frag.forEach(el=>wireTracks(el));
  if(LOTE.pos>=LOTE.lista.length){moreIO?.unobserve(m);m.remove();return}
  if(!sync)requestAnimationFrame(()=>{const r=m.getBoundingClientRect();if(r.top<innerHeight+600)carregarMais()});
}
