/* ---------- @ no comentário: sugere amigos e manda a notícia por mensagem ---------- */
var MEN_BOX=null,MEN_INP=null;
function menFecha(){MEN_BOX?.remove();MEN_BOX=null;MEN_INP=null}
function menToken(i){const v=i.value.slice(0,i.selectionStart??i.value.length);const m=v.match(/(^|\s)@([^\s@]{0,24})$/);return m?{q:m[2],ini:v.length-m[2].length-1}:null}
function menSugere(i){const tk=menToken(i);if(!tk||!S.uid||!S.membro){menFecha();return}const n=norm(tk.q);const l=amigosL().filter(u=>!n||norm(nomeDe(u)).split(/\s+/).some(w=>w.startsWith(n))||norm(nomeDe(u)).startsWith(n)).slice(0,5);
  if(!l.length){menFecha();return}if(!MEN_BOX){MEN_BOX=document.createElement("div");MEN_BOX.className="men-box";MEN_BOX.setAttribute("role","listbox");document.body.appendChild(MEN_BOX)}MEN_INP=i;
  MEN_BOX.innerHTML=l.map(u=>`<button type="button" role="option" data-men="${esc(u)}">${avatar(u)}<span>${esc(nomeDe(u))}</span></button>`).join("");
  const r=i.getBoundingClientRect();MEN_BOX.style.left=Math.max(8,r.left)+"px";MEN_BOX.style.width=Math.min(innerWidth-16,Math.max(220,r.width))+"px";MEN_BOX.style.bottom=(innerHeight-r.top+6)+"px"}
document.addEventListener("input",e=>{const i=e.target;if(i&&i.matches&&i.matches("#ctext,#layer .sg-rp input"))menSugere(i)});
document.addEventListener("focusout",e=>{if(e.target===MEN_INP)setTimeout(()=>{if(document.activeElement!==MEN_INP)menFecha()},150)});
document.addEventListener("pointerdown",e=>{const b=e.target.closest&&e.target.closest(".men-box [data-men]");if(!b||!MEN_INP)return;e.preventDefault();const i=MEN_INP,tk=menToken(i);if(!tk)return;const nome=nomeDe(b.dataset.men),pos=i.selectionStart??i.value.length;
  i.value=i.value.slice(0,tk.ini)+"@"+nome+" "+i.value.slice(pos);const np=tk.ini+nome.length+2;try{i.setSelectionRange(np,np)}catch(_){}i.dispatchEvent(new Event("input",{bubbles:true}));menFecha();i.focus()},true);
function mencionados(t){const n=norm(t);const out=[];amigosL().slice().sort((a,b)=>nomeDe(b).length-nomeDe(a).length).forEach(u=>{const k="@"+norm(nomeDe(u));if(n.includes(k)&&!out.includes(u))out.push(u)});return out}
async function avisarMencoes(pid,t){const us=mencionados(t);if(!us.length||!S.uid||!S.membro)return;const snap=snapById(pid);
  const res=await Promise.all(us.map(u=>dmEnviar(u,{texto:String(t).slice(0,1000),pid,snap,tipo:"mencao"},true)));const ok=us.filter((u,i)=>res[i]);
  if(ok.length)setTimeout(()=>toast(`${ok.length>2?ok.length+" amigos receberam":ok.map(nomeDe).join(" e ")+(ok.length>1?" receberam":" recebeu")} a notícia por mensagem`),900)}
var CMT_PID=null;
{const _oc53=openComments;openComments=function(pid){CMT_PID=pid;return _oc53.apply(this,arguments)}}
document.addEventListener("submit",e=>{const f=e.target;if(!f||f.id!=="cform")return;const t=($("#ctext")?.value||"").trim();if(t&&CMT_PID&&S.uid&&S.membro){const pid=CMT_PID;setTimeout(()=>avisarMencoes(pid,t),50)}menFecha()},true);
{const _ic53=igComentar;igComentar=async function(pid,t){const ok=await _ic53.apply(this,arguments);if(ok)avisarMencoes(pid,t);menFecha();return ok}}

