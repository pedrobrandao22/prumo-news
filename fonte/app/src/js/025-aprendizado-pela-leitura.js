/* ---------- aprendizado pela leitura ---------- */
function autoPesos(){
  if(PREF.autoOff||!FEED)return {};
  const desde=Date.now()-14*864e5;const it=Object.values(HIST).filter(h=>new Date(h.t).getTime()>=desde);if(it.length<15)return {};
  const lidas={};it.forEach(h=>lidas[h.secao]=(lidas[h.secao]||0)+1);
  const vis=SECS().map(s=>s.id);const tot=it.length;const out={};
  vis.forEach(s=>{const share=(lidas[s]||0)/tot,base=1/vis.length;out[s]=Math.max(-2,Math.min(2,Math.round((share-base)*12)))});
  return out;
}
let AUTO={};

