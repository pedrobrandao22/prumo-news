/* ---------- 116: revisão C da leitura (03/11) ----------
   C01 aviso "Uma rodada pode ter falhado" que ficava na Capa depois que o rodadas.json chegava dizendo que as rodadas rodaram (sem novidade).
   C03 Busca: sigla curta (PL, PT, PEC, STF) não acha mais "plano", "aplicativo", "expectativa"; termo de até 3 letras casa no começo da palavra.
   C05 linha do tempo da matéria: datas como "Dom (8/11)", "1º/11" e "01/10/2026" também contam para marcar o que ainda vai acontecer
       (antes só "dd/mm"), e "14/10" / "01/10/2026" aparecem como "14 de out" (o mesmo jeito das outras linhas do tempo). */

/* ===== C03: casamento de termos da Busca ===== */
function rc116Termos(q){return String(q||"").trim().split(/\s+/).filter(Boolean).map(w=>{const n=norm(w);
  /* só letras e números: sigla escrita em maiúsculas (PL, PT, PEC, STF, PIB) casa a palavra inteira; termo de até 3 letras, o começo da palavra;
     o resto (e o que tem pontuação, como "13,75%" ou "R$") em qualquer lugar, como antes */
  if(!/^[a-z0-9]+$/.test(n))return {n,re:null};const sig=n.length>=2&&n.length<=5&&/^[A-ZÀ-Ý0-9]+$/.test(w)&&/[A-ZÀ-Ý]/.test(w);
  return {n,re:sig||n.length<=3?new RegExp("(^|[^a-z0-9])"+n+(sig?"(?![a-z0-9])":"")):null}}).filter(t=>t.n)}
function rc116Hit(q){const ts=rc116Termos(q);return t=>{const s=norm(t);return ts.every(x=>x.re?x.re.test(s):s.includes(x.n))}}

/* ===== C01: aviso de atraso da Capa some quando o rodadas.json mostra rodada recente ===== */
function rc116AvisoCapa(){try{const c=document.getElementById("v-capa");if(!c)return;const av=c.querySelectorAll(".late:not(.offl)");if(!av.length)return;
  if(estadoRadar().ok)av.forEach(e=>e.remove())}catch(e){}}
{const _cr116=carregarRodadas;carregarRodadas=async function(){const r=await _cr116.apply(this,arguments);rc116AvisoCapa();return r}}
{const _rc116=renderCapa;renderCapa=function(){const r=_rc116.apply(this,arguments);rc116AvisoCapa();return r}}

/* ===== C05: datas da linha do tempo ===== */
function rc116Data(q,hoje){const s=String(q||"");const m=s.match(/(?:^|[^\d])(\d{1,2})º?\/(\d{1,2})(?:\/(\d{4}))?(?!\d)/);if(!m)return null;const d=+m[1],mm=+m[2];if(!d||d>31||!mm||mm>12)return null;
  let y=m[3]?+m[3]:+hoje.slice(0,4);if(!m[3]){const hm=+hoje.slice(5,7);if(hm>=11&&mm<=2)y++;else if(hm<=2&&mm>=11)y--}
  return {iso:`${y}-${String(mm).padStart(2,"0")}-${String(d).padStart(2,"0")}`,so:/^\s*\d{1,2}º?\/\d{1,2}(?:\/\d{4})?\s*$/.test(s)}}
{const _mt116=matTempo;matTempo=function(p){const h=_mt116.apply(this,arguments);if(!h)return h;try{const tp=document.createElement("template");tp.innerHTML=h;
  const hj=hojeSP(),ano=hj.slice(0,4),lis=[...tp.content.querySelectorAll(".mat-tl li")];if(!lis.length)return h;let mudou=false;
  lis.forEach(li=>{const t=li.querySelector("time");if(!t)return;const d=rc116Data(t.textContent,hj);if(!d)return;
    if(d.iso>hj&&!li.classList.contains("fut")){li.classList.add("fut");mudou=true}
    if(d.so){const tx=dataCurta(d.iso)+(d.iso.slice(0,4)!==ano?" de "+d.iso.slice(0,4):"");if(tx&&tx!==t.textContent){t.textContent=tx;mudou=true}}
    if(!t.hasAttribute("datetime")){t.setAttribute("datetime",d.iso);mudou=true}});
  if(!mudou)return h;
  /* o ponto atual é o último que já aconteceu */
  lis.forEach(li=>li.classList.remove("ult"));{let vf=false;lis.forEach(li=>{const tm=li.querySelector("time");if(li.classList.contains("fut"))vf=true;else if(vf&&tm&&!tm.getAttribute("datetime"))li.classList.add("fut")})}/* rótulo sem data ("Depois") depois de um ponto futuro também é futuro */const pas=lis.filter(li=>!li.classList.contains("fut"));(pas.length?pas[pas.length-1]:null)?.classList.add("ult");
  return tp.innerHTML}catch(e){return h}}}
