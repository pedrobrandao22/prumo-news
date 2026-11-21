/* ---------- 183 · Coberturas (17/11, decisão do Pedro) ----------
   1. Avisos por cobertura: quem segue uma cobertura pode desligar os avisos dela (interruptor na página da cobertura).
      Desligada, ela some da Atividade e da bolinha; a cobertura continua no feed, sobe por ser seguida e as matérias
      aparecem normalmente. Religar é o mesmo interruptor (ou "Coberturas que sigo", no Perfil, que leva à página).
      Fica em PREF.cobSemAviso = {<id da cobertura>: <nome>} (preferências da conta). O aviso no celular passa a
      respeitar isso quando o Pedro rodar sql/proposta-2026-11-17-coberturas.sql (antes, só o app respeita).
      Sem limite de coberturas seguidas.
   2. Fim da cobertura: a página mostra "Acompanha até: <fim>" (campo "fim" do feed, escrito pelos robôs); depois do
      fim, o selo "Cobertura encerrada" (que já existia) e "Acompanhou até: <fim>"; encerrada não manda mais aviso (os
      robôs não põem atualização nela) e a página diz isso no lugar do interruptor. */

function cb183Mudas(){const m=PREF.cobSemAviso;return m&&typeof m==="object"&&!Array.isArray(m)?m:{}}
function cb183Avisa(pid){return !cb183Mudas()[pid]}
function cb183Liga(pid,on){const p=pautaById(pid);const m=PREF.cobSemAviso&&typeof PREF.cobSemAviso==="object"?PREF.cobSemAviso:(PREF.cobSemAviso={});
  if(on)delete m[pid];else m[pid]=(p&&temaDe(p))||pid;salvarPrefs();uso(on?"cob_avisos_on":"cob_avisos_off")}
/* deixar de seguir (ou voltar a seguir) recomeça com os avisos ligados */
{const _cs183=cobSegue;cobSegue=function(tema){const r=_cs183.apply(this,arguments);try{const k=norm(tema),m=PREF.cobSemAviso;
    if(m&&typeof m==="object")Object.keys(m).forEach(pid=>{const p=pautaById(pid);if(norm(m[pid])===k||(p&&norm(temaDe(p))===k))delete m[pid]})}catch(e){}return r}}

/* Atividade e bolinha: sem os avisos das coberturas desligadas */

/* página da cobertura: fim, encerrada e o interruptor de avisos */
function cb183SwHTML(p){const on=cb183Avisa(p.id);
  return `<div class="cb183-av"><span><b>Avisos de novidades</b><small>${on?"No celular e na Atividade, a cada novidade":"Desligados. A cobertura continua no seu feed"}</small></span><button type="button" class="cb183-sw${on?" on":""}" role="switch" aria-checked="${on}" aria-label="Avisos de novidades de ${esc(temaDe(p))}" data-cb183sw="${esc(p.id)}"><i></i></button></div>`}
function cb183Pinta(pid){const box=document.querySelector(`.sheet .pc[data-pc="${CSS.escape(pid)}"]`);const p=pautaById(pid);if(!box||!p)return;
  box.querySelectorAll(".cb183-fim,.cb183-av,.cb183-enc").forEach(x=>x.remove());
  const enc=p.status==="encerrada";let fim=typeof p.fim==="string"?p.fim.trim():"";
  /* 20/11 (testador): "Acompanha até: Encerra quando o Inep publica…" — o fim escrito como frase vira só o complemento */
  const fq=/^(?:encerra|termina|acaba)(?:-se)?\s+(?:quando|com|após|depois de|na|no|em)\s+/i.exec(fim);
  let rot=enc?"Acompanhou até":"Acompanha até";
  if(fq){const resto=fim.slice(fq[0].length);rot=enc?"Terminou":"Termina";fim=/^(quando|com|após|depois de)\s/i.test(fq[0].split(/\s+/)[1]+" ")?fq[0].split(/\s+/).slice(1).join(" ")+resto:resto;fim=fim.charAt(0).toLowerCase()+fim.slice(1)}
  else if(/^acompanha at[ée]:?\s*/i.test(fim))fim=fim.replace(/^acompanha at[ée]:?\s*/i,"");
  const m=box.querySelector(".pc-m");
  if(m&&fim)m.insertAdjacentHTML("afterend",`<p class="cb183-fim${enc?" enc":""}">${rot}${fq?"":":"} <b>${esc(fim)}</b></p>`);
  const a=box.querySelector(".pc-a");if(!a||!seguido(p))return;
  a.insertAdjacentHTML("afterend",enc?`<p class="cb183-enc hint">Cobertura encerrada: não há mais avisos. Se o assunto continuar, ele vira uma cobertura nova.</p>`:cb183SwHTML(p))}

document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;const b=t.closest("[data-cb183sw]");if(!b)return;e.stopPropagation();
  const pid=b.dataset.cb183sw,p=pautaById(pid);if(!p)return;const on=!cb183Avisa(pid);cb183Liga(pid,on);cb183Pinta(pid);try{atDot();if(typeof nt124Pinta==="function")nt124Pinta()}catch(er){}
  const tema=temaDe(p);toast(on?`Avisos de “${tema}” ligados`:`Avisos de “${tema}” desligados. Ela continua no seu feed.`,on?"":"Desfazer",on?null:()=>{cb183Liga(pid,true);cb183Pinta(pid);try{atDot()}catch(er){}})},true);

/* Perfil › "Coberturas que sigo": marca as que estão com avisos desligados (tocar no nome abre a página, com o interruptor) */
{const _as183=mt158AbreSeguidas;mt158AbreSeguidas=function(){const r=_as183.apply(this,arguments);try{const m=cb183Mudas();
    document.querySelectorAll(".mt158-cl .mt158-cn[data-cobpag]").forEach(b=>{if(!m[b.dataset.cobpag])return;const s=b.parentNode&&b.parentNode.querySelector("small");
      if(s&&!s.querySelector(".cb183-mudo"))s.insertAdjacentHTML("beforeend",` · <span class="cb183-mudo">avisos desligados</span>`)})}catch(e){}return r}}
