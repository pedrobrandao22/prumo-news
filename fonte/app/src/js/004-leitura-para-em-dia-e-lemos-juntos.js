/* ---------- leitura (para "em dia" e "lemos juntos") ---------- */
let leituraFila={},leituraTimer=null;
function marcarLida(pid){
  const pp=pautaById(pid);if(!pid||(pp&&lidaAtual(pp)))return;LIDAS.set(pid,new Date().toISOString());const o=Object.fromEntries([...LIDAS].slice(-500));lsSet("radar-lidas2",o);registrarHistorico(pid);
  const el=document.getElementById("p-"+pid);if(el){el.querySelector(".badge-new")?.remove();el.querySelector(".lida-t")?.removeAttribute("hidden")}
  atualizarEmDia();
}
async function enviarLeituras(){
  const fila=leituraFila;leituraFila={};if(!Object.keys(fila).length||!S.db||!S.uid||!S.membro)return;
  const meu={...(S.leituras[S.uid]||{}),...fila},patch={...fila},ks=Object.keys(meu);
  if(ks.length>700)ks.sort((a,b)=>(meu[a]||0)-(meu[b]||0)).slice(0,ks.length-600).forEach(k=>{patch[k]=null;delete meu[k]});
  S.leituras={...S.leituras,[S.uid]:meu};
  try{await gravarMapa("leituras/"+S.uid,"itens",null,null,patch)}catch(e){}
}
const io=("IntersectionObserver" in window)?new IntersectionObserver(es=>{es.forEach(e=>{const pid=e.target.closest(".post")?.dataset.pid;if(!pid)return;if(e.isIntersecting){clearTimeout(e.target._t);e.target._t=setTimeout(()=>{if(document.hidden||$("#layer").innerHTML||VIEW!=="feed")return;marcarLida(pid)},8000)}else clearTimeout(e.target._t)})},{threshold:.6}):null;
function leram(pid){return Object.entries(S.leituras||{}).filter(([u,m])=>ehVisivel(u)&&m&&m[pid]).map(([u])=>u)}

