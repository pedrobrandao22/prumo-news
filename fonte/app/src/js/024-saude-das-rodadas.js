/* ---------- saúde das rodadas ---------- */
if(window.visualViewport){const vv=visualViewport,kb=()=>{const off=Math.max(0,window.innerHeight-vv.height-vv.offsetTop);document.documentElement.style.setProperty("--kb",off+"px")};vv.addEventListener("resize",kb);vv.addEventListener("scroll",kb)}
const hojeSP=()=>_FDSP.format(new Date());
function atrasoMin(){if(!FEED?.atualizado_em)return null;return Math.round((Date.now()-new Date(FEED.atualizado_em).getTime())/6e4)}
var _FH24=null;function horaSP(){_FH24=_FH24||new Intl.DateTimeFormat("en-US",{hour:"numeric",hour12:false,timeZone:"America/Sao_Paulo"});return +_FH24.format(new Date())}
function estadoRadar(){const a=atrasoMin();if(a==null)return {ok:true,txt:""};const h=horaSP();const ativo=h>=8&&h<=23;
  if(ativo&&a>150&&rodadaRecenteMin()>300)return {ok:false,txt:`Sem atualização há ${Math.floor(a/60)} h ${a%60} min. Uma rodada pode ter falhado.`};
  return {ok:true,txt:`Atualizado ${quando(FEED.atualizado_em)}.`}}
function saudeHTML(){
  const e=estadoRadar();const r=S.rodadas||{};const it=Object.entries(r.itens||{}).sort((a,b)=>b[0].localeCompare(a[0]));
  const ok=it.filter(([,x])=>x.status==="ok").length,fal=it.filter(([,x])=>x.status&&x.status!=="ok"&&x.status!=="sem_mudancas").length,sem=it.filter(([,x])=>x.status==="sem_mudancas").length;
  return `<div class="card health"><b>Saúde do Prumo</b><button type="button" class="st ${e.ok?"ok":"bad"}" data-rodadas><i></i>${esc(e.txt||"Sem informação ainda.")}<span class="chev">›</span></button>
    ${it.length?`<p class="hint">Hoje: ${esc(ok)} ${ok===1?"rodada publicada":"rodadas publicadas"}${sem?`, ${sem} sem novidade`:""}${fal?`, <b style="color:var(--hot)">${fal} com problema</b>`:""}.</p><ul class="secpref">${it.slice(0,8).map(([h,x])=>`<li style="flex-direction:column;align-items:flex-start;gap:1px"><b style="font-size:14px">${esc(h)} · ${x.tipo==="completa"?"Rodada completa":x.tipo==="virada"?"Virada da meia-noite":"Rodada rápida"} · ${x.status==="ok"?"publicada":x.status==="sem_mudancas"?"sem novidade":"problema"}</b><span class="hint">${x.pautas!=null?esc(x.pautas)+" notícias · ":""}${x.mudancas!=null?esc(x.mudancas)+" mudanças · ":""}${x.checagem?esc(x.checagem):""}${x.nota?" · "+esc(x.nota):""}</span></li>`).join("")}</ul>`:`<p class="hint">O registro das rodadas aparece aqui a partir da próxima atualização.</p>`}</div>`;
}
var OFFLINE=false;
function avisoAtraso(){if(OFFLINE&&FEED)return `<div class="late gut offl"><span>Sem conexão. Mostrando a edição das ${esc(hhmm(FEED.atualizado_em))}.</span><button type="button" data-retry>Tentar de novo</button></div>`;const e=estadoRadar();return e.ok?"":`<div class="late gut">${esc(e.txt)}</div>`}

