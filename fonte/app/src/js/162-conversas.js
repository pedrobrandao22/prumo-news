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
/* mensagens apagadas por você somem da lista e da conversa: allMsgs no 203 */
/* bolinha e número: não contam conversas silenciadas nem o que foi apagado */
function cv162Conta(m){const c=cv162(m.de);return !c.sil&&!((+c.apg||0)>=(+m.at||0))}
{const _ub162=updateBadge;updateBadge=function(){const real=S.msgsIn;if(!PREF.conv||!Array.isArray(real))return _ub162.apply(this,arguments);
  S.msgsIn=real.filter(cv162Conta);try{return _ub162.apply(this,arguments)}finally{if(Array.isArray(S.msgsIn)&&S.msgsIn!==real)S.msgsIn=real}}}
/* na lista: ícone de sino cortado e sem o ponto de não lida (renderMsgs no 203) */
const CV162_SINO=`<svg class="ico cv162-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l1.5 2H8M10 21h4M4 4l16 16"/></svg>`;
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
