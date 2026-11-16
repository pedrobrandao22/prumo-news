/* 162 · Silenciar e Apagar conversa (decisão do Pedro, 16/11). Prefixo cv162.
   - Fica nas preferências da conta (PREF.conv[uid] = {sil:true, apg:<ms>}), que vão para data/users/<uid>/prefs: vale em
     todos os aparelhos e só você vê.
   - Silenciar: a conversa continua, sem bolinha nem número. O aviso no celular para quando o SQL
     sql/proposta-2026-11-16-silenciar.sql estiver rodado (o banco lê a mesma preferência antes de pôr o aviso na fila).
   - Apagar: some da sua lista o que veio até agora; a outra pessoa continua vendo. Mensagem nova reabre a conversa. */
function cv162(u){const c=PREF.conv&&PREF.conv[u];return c&&typeof c==="object"?c:{}}
function cv162Poe(u,patch){if(!PREF.conv||typeof PREF.conv!=="object")PREF.conv={};const c={...cv162(u),...patch};
  Object.keys(c).forEach(k=>{if(c[k]==null||c[k]===false)delete c[k]});if(Object.keys(c).length)PREF.conv[u]=c;else delete PREF.conv[u];salvarPrefs()}
const cv162Sil=u=>!!cv162(u).sil;
const cv162Outro=m=>m.de===S.uid?m.para:m.de;
/* mensagens apagadas por você somem da lista e da conversa */
{const _am162=allMsgs;allMsgs=function(){const l=_am162.apply(this,arguments);if(!PREF.conv)return l;
  return l.filter(m=>{const a=+cv162(cv162Outro(m)).apg||0;return !a||(+m.at||0)>a})}}
/* bolinha e número: não contam conversas silenciadas nem o que foi apagado */
function cv162Conta(m){const c=cv162(m.de);return !c.sil&&!((+c.apg||0)>=(+m.at||0))}
{const _ub162=updateBadge;updateBadge=function(){const real=S.msgsIn;if(!PREF.conv||!Array.isArray(real))return _ub162.apply(this,arguments);
  S.msgsIn=real.filter(cv162Conta);try{return _ub162.apply(this,arguments)}finally{if(Array.isArray(S.msgsIn)&&S.msgsIn!==real)S.msgsIn=real}}}
/* na lista: ícone de sino cortado e sem o ponto de não lida */
const CV162_SINO=`<svg class="ico cv162-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l1.5 2H8M10 21h4M4 4l16 16"/></svg>`;
{const _rm162=renderMsgs;renderMsgs=function(){const r=_rm162.apply(this,arguments);try{
  document.querySelectorAll('#v-msgs [data-thread]').forEach(b=>{const u=b.dataset.thread;if(!cv162Sil(u))return;
    const d=b.querySelector(".dot");if(d)d.remove();const nm=b.querySelector(".pt b");if(nm&&!nm.querySelector(".cv162-ic")){nm.insertAdjacentHTML("beforeend",CV162_SINO);b.setAttribute("aria-label",(nm.textContent||"")+", conversa silenciada")}
    b.classList.remove("un");const s=b.querySelector(".pt .unread");if(s)s.classList.remove("unread")});
  if(THREAD&&cv162Sil(THREAD)){const h=document.querySelector("#v-msgs .dm-who b, #v-msgs .view-h h1");if(h&&!h.querySelector(".cv162-ic"))h.insertAdjacentHTML("beforeend",CV162_SINO)}}catch(e){}return r}}
/* folha de opções da conversa: Silenciar / Reativar avisos e Apagar conversa */
{const _tm162=abrirThMenu;abrirThMenu=function(u){const r=_tm162.apply(this,arguments);try{const g=document.querySelector("#layer .sheet .co160-opt");if(!g||g.querySelector("[data-cv162sil]"))return r;
  const sil=cv162Sil(u);g.insertAdjacentHTML("beforeend",`<button type="button" data-cv162sil="${esc(u)}">${sil?"Reativar avisos":"Silenciar conversa"}<span>${sil?"volta a avisar quando chegar mensagem":"sem aviso no celular nem bolinha; a conversa continua"}</span></button><button type="button" data-cv162apg="${esc(u)}">Apagar conversa<span>some da sua lista; ${esc(String(nomeDe(u)||"").split(" ")[0])} continua vendo</span></button>`)}catch(e){}return r}}
window.addEventListener("click",e=>{const t=e.target&&e.target.closest;if(!t)return;
  const s=e.target.closest("[data-cv162sil]");if(s){e.preventDefault();e.stopPropagation();const u=s.dataset.cv162sil,on=!cv162Sil(u);cv162Poe(u,{sil:on});closeLayer();
    try{renderMsgs();updateBadge()}catch(_){}toast(on?"Conversa silenciada. Ela continua aqui, sem avisos.":"Avisos da conversa reativados.");return}
  const a=e.target.closest("[data-cv162apg]");if(a){e.preventDefault();e.stopPropagation();
    if(!a.classList.contains("conf")){a.classList.add("conf");const sp=a.querySelector("span");a.firstChild.textContent="Toque de novo para apagar";if(sp)sp.textContent="só some para você";return}
    const u=a.dataset.cv162apg,ant=cv162(u).apg||null;let ult=0;try{ult=_cv162Ultima(u)}catch(_){}
    cv162Poe(u,{apg:Math.max(Date.now(),ult)});closeLayer();
    try{const nl=(S.msgsIn||[]).filter(m=>m.de===u&&!m.lida);if(nl.length&&S.db)S.db.marcarLidas(u).catch(()=>{})}catch(_){}
    if(THREAD===u){THREAD=null}try{renderMsgs();updateBadge()}catch(_){}
    toast("Conversa apagada.","Desfazer",()=>{cv162Poe(u,{apg:ant});try{renderMsgs();updateBadge()}catch(_){}})}},true);
function _cv162Ultima(u){let m=0;[...(S.msgsIn||[]),...(S.msgsOut||[])].forEach(x=>{if((x.de===u||x.para===u)&&(+x.at||0)>m)m=+x.at||0});return m}
