/* ---------- 120: testes A (abertura e leitura em condições de produção, 03/11) ----------
   Achados em fonte/qa/TESTES-A.md. Nomes com o prefixo ta120. A casca da abertura (TA01) fica em 120-testes-a-abertura.js.
   TA02  matéria aberta antes do detalhe: quando o detalhe chega, a matéria é redesenhada e voltava ao topo. Agora fica onde a
         pessoa estava lendo.
   TA03  detalhe que não chega (rede caiu depois do leve): a matéria ficava com o esqueleto piscando para sempre. Agora diz que
         falta a conexão, com "Tentar de novo"; a internet voltando, completa sozinha (como já fazia).
   TA04  linha do placar oficial no Feed: quando o oficiais.json chegava com a pessoa na Capa (o normal), o Feed já desenhado
         ficava sem a linha. Agora a linha entra ao abrir o Feed.
   TA05  robô do leve atrasado ou parado: o aparelho com a versão do leve achava que estava em dia e não via a edição nova do
         feed.json. O rodadas.json (que sai no mesmo commit do feed.json) diz quando a última rodada publicou; se foi bem depois
         da edição na tela, o app confere uma vez no feed.json.
   TA06  "1 min de leitura" antes do detalhe (contava só o que o leve tem): fica escondido até o texto chegar. */
var TA120={k:"",feed:false};

/* TA02 + TA05: depois que o detalhe entra (fl119Encaixar → fl119Depois) */
{const _d120=fl119Depois;fl119Depois=function(){const m=document.querySelector("#layer .mat"),y=m?m.scrollTop:0,pid=typeof MAT_PID!=="undefined"?MAT_PID:null;
  const r=_d120.apply(this,arguments);
  try{const n=document.querySelector("#layer .mat");if(n&&y>0&&MAT_PID===pid){n.scrollTop=y;requestAnimationFrame(()=>{if(n.isConnected&&n.scrollTop<y-2)n.scrollTop=y})}}catch(e){}
  setTimeout(ta120Atraso,0);return r}}

/* TA03: o detalhe falhou → aviso no lugar do esqueleto */
function ta120Falhou(){document.querySelectorAll("#layer .fl119-sk").forEach(s=>{s.outerHTML=`<div class="ta120-det" role="status"><p>Sem conexão: o resto da matéria aparece assim que a internet voltar.</p><button type="button" class="btn ta120-det-b" data-ta120det>Tentar de novo</button></div>`})}
{const _c120=fl119Completar;fl119Completar=function(){const pr=_c120.apply(this,arguments);
  if(FL119.parcial&&pr&&pr.then)pr.then(()=>{if(FL119.parcial)ta120Falhou()});return pr}}
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-ta120det]");if(!b)return;e.stopPropagation();
  const box=b.closest(".ta120-det");if(box)box.outerHTML=`<div class="cp-sk fl119-sk" role="status" aria-label="Carregando o resto da matéria"><i style="height:14px;width:92%"></i><i style="height:14px;width:84%"></i><i style="height:14px;width:60%"></i></div>`;
  fl119Completar()},true);

/* TA06: tempo de leitura só com o texto */
{const _am120=abrirMateria;abrirMateria=function(){const r=_am120.apply(this,arguments);
  try{if(FL119.parcial)document.querySelectorAll("#layer .mat-meta span").forEach(s=>{if(/min de leitura/.test(s.textContent))s.classList.add("ta120-esp")})}catch(e){}return r}}

/* TA04: a linha do placar oficial confere ao abrir o Feed */
{const _go120=go;go=function(v){const r=_go120.apply(this,arguments);if(v==="feed"&&typeof po118NoFeed==="function")try{po118NoFeed()}catch(e){}return r}}

/* TA05: a última rodada que publicou (rodadas.json, horário de São Paulo) */
function ta120Rodada(){const r=S.rodadas;if(!r||typeof r!=="object"||!r.itens||typeof r.dia!=="string")return 0;let t=0;
  for(const k of Object.keys(r.itens)){const v=r.itens[k];if(!v||v.publicou!==true)continue;const m=/^(\d{2})h(\d{2})$/.exec(k);if(!m)continue;
    const x=Date.parse(`${r.dia}T${m[1]}:${m[2]}:00-03:00`);if(isFinite(x)&&x>t)t=x}
  return t}
function ta120Atraso(){try{if(!FEED||FL119.parcial||OFFLINE||TA120.feed)return;const v=FL119.v.get(FEED);if(!v)return;  // edição que não veio do leve: o caminho normal já confere
  const tr=ta120Rodada(),ta=Date.parse(FEED.atualizado_em||"");if(!tr||!isFinite(ta)||tr<=ta+10*60000)return;
  const k=v+"|"+tr;if(TA120.k===k)return;TA120.k=k;TA120.feed=true;CHK_T=0;
  Promise.resolve(checarFeed(false)).catch(()=>{}).then(()=>{TA120.feed=false})}catch(e){TA120.feed=false}}
{const _o120=fl119Obter;fl119Obter=async function(){if(TA120.feed){const r=await fetch("feed.json",{cache:"no-cache"});if(!r.ok)throw 0;return {f:await r.json()}}return _o120.apply(this,arguments)}}
{const _cr120=carregarRodadas;carregarRodadas=async function(){const r=await _cr120.apply(this,arguments);ta120Atraso();return r}}
