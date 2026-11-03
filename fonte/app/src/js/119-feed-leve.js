/* ---------- abertura leve: a Capa sai do feed-leve.json; o detalhe (texto, links, gráficos…) chega logo depois ---------- */
/* O robô "Feed leve" (tools/feed_leve.py) divide o feed.json em feed-leve.json + feed-det/<v>.json; leve + detalhe = feed.json.
   Fica no primeiro bloco de scripts (logo depois da carga): loadFeed já usa estas funções na abertura.
   - Sem edição guardada no aparelho e abrindo na Capa: desenha a Capa só com o leve; o detalhe vem depois do primeiro
     desenho (ou na hora, se a pessoa abrir uma matéria) e entra nas mesmas pautas; o Feed é desenhado depois, com tudo.
   - Com edição guardada: o leve diz a versão; se é a mesma, não baixa mais nada. Se mudou, junta leve + detalhe.
   - Leve ausente, inválido, mais velho que a edição guardada, ou detalhe de outra versão: volta ao feed.json, como antes. */
var FL119={parcial:null,prom:null,v:new WeakMap(),passa:null};
function fl119Ler(txt){if(typeof txt!=="string")return null;
  const m=txt.slice(0,300).match(/^\{"_leve":\{"formato":1,"v":"([0-9a-f]{12})","det":"(feed-det\/[0-9a-f]{12}\.json)","atualizado_em":("(?:[^"\\]|\\.)*"|null)\}/);
  if(!m||m[2]!=="feed-det/"+m[1]+".json")return null;let at=null;try{at=JSON.parse(m[3])}catch(e){return null}return {txt,v:m[1],det:m[2],atualizado_em:at}}
/* o pedido da pré-carga (000) é usado uma vez; depois, um pedido novo */
function fl119LevePedido(){let p=typeof FL119_PRE!=="undefined"?FL119_PRE:null;FL119_PRE=null;
  if(!p)p=fetch("feed-leve.json",{cache:"no-cache"}).then(r=>r.ok?r.text():null);return Promise.resolve(p).catch(()=>null).then(fl119Ler)}
function fl119Tem(o,k){return Object.prototype.hasOwnProperty.call(o,k)}
/* leve + detalhe → o feed.json inteiro (com a ordem original das chaves); qualquer coisa estranha → erro (e o app usa o feed.json) */
function fl119Montar(j,d){const meta=j&&j._leve;
  if(!meta||!d||d.formato!==1||d.v!==meta.v||!Array.isArray(d.ordem)||!d.topo||typeof d.topo!=="object"||!Array.isArray(d.pautas))throw new Error("fl119 versão");
  const ps=j.pautas;if(Array.isArray(ps)&&ps.length!==d.pautas.length)throw new Error("fl119 pautas");
  const out={},nao=k=>{if(k==="__proto__")throw new Error("fl119 chave")};
  for(const k of d.ordem){nao(k);
    if(k==="pautas"&&Array.isArray(ps))out.pautas=ps.map((p,i)=>{const x=d.pautas[i];if(!x)return p;
      if(!p||typeof p!=="object"||p.id!==x.id||!Array.isArray(x.ordem))throw new Error("fl119 ordem");const q={};
      for(const c of x.ordem){nao(c);if(c==="neutro"&&x.neutro){const n=p.neutro||{},nd=x.neutro,o={};for(const a of nd.ordem){nao(a);if(fl119Tem(nd.campos,a))o[a]=nd.campos[a];else if(fl119Tem(n,a))o[a]=n[a];else throw new Error("fl119 neutro")}q.neutro=o}
        else if(fl119Tem(x.campos,c))q[c]=x.campos[c];else if(fl119Tem(p,c))q[c]=p[c];else throw new Error("fl119 campo")}return q});
    else if(fl119Tem(d.topo,k))out[k]=d.topo[k];else if(fl119Tem(j,k))out[k]=j[k];else throw new Error("fl119 topo")}
  return out}
async function fl119Juntar(L){const r=await fetch(L.det);if(!r.ok)throw new Error("fl119 det "+r.status);const d=await r.json();
  const f=fl119Montar(JSON.parse(L.txt),d);FL119.v.set(f,L.v);return f}
/* a edição que vale agora: {igual} (a mesma que já está na tela), {leve} (desenhar a Capa já) ou {f} (o feed inteiro) */
async function fl119Obter(atual,podeLeve){
  const L=await fl119LevePedido();
  if(L){const vAtual=atual&&FL119.v.get(atual);
    if(vAtual&&vAtual===L.v)return {igual:true};
    const velho=atual&&Date.parse(L.atualizado_em||"")<Date.parse(atual.atualizado_em||"");  // o robô ainda não refez o leve
    if(!velho){
      if(podeLeve){try{const j=JSON.parse(L.txt);if(j&&typeof j==="object"&&Array.isArray(j.pautas)&&j._leve&&j._leve.v===L.v)return {leve:L,j}}catch(e){}}
      try{return {f:await fl119Juntar(L)}}catch(e){}}}
  const r=await feedPedido();if(!r.ok)throw 0;return {f:await r.json()}}
/* a mesma edição? (pela versão, sem comparar o texto inteiro, quando dá) */
function fl119Igual(atual,x){if(x.igual)return true;if(!atual)return false;const ig=feedTxt(x.f)===JSON.stringify(atual);
  if(ig){const v=FL119.v.get(x.f);if(v)FL119.v.set(atual,v)}return ig}
/* guarda a edição no aparelho com a versão dela ("prumo-fl-v" diz de que versão é o "radar-feed") */
function fl119Guardar(f){try{localStorage.removeItem("prumo-fl-v")}catch(e){}
  let ok=false;try{localStorage.setItem("radar-feed",JSON.stringify(f));ok=true}catch(e){}
  const v=FL119.v.get(f);if(ok&&v)try{localStorage.setItem("prumo-fl-v",v)}catch(e){}}
function fl119Conhecida(cached){if(!cached||typeof cached!=="object")return;try{const v=localStorage.getItem("prumo-fl-v");if(v&&/^[0-9a-f]{12}$/.test(v))FL119.v.set(cached,v)}catch(e){}}
function fl119Parcial(){return !!FL119.parcial}
/* primeira abertura: a Capa só com o leve (o Feed fica para depois do detalhe) */
function fl119Pintar(x){const f=x.j;delete f._leve;FL119.parcial={L:x.leve,at:f.atualizado_em,ids:(f.pautas||[]).map(p=>p&&p.id).join("|")};
  const rf=renderFeed;renderFeed=function(){if(VIEW!=="feed"){if(VIEW==="capa"){try{renderCapa()}catch(e){}}if(typeof FEED_ADIADO!=="undefined")FEED_ADIADO=true;return}return rf.apply(this,arguments)};
  try{prepararFeed(f)}finally{renderFeed=rf}
  const ir=()=>requestAnimationFrame(()=>setTimeout(()=>{const f2=()=>fl119Completar();window.requestIdleCallback?requestIdleCallback(f2,{timeout:1200}):setTimeout(f2,200)},0));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ir,{once:true});else ir()}
/* busca o detalhe (uma vez; de novo se falhou) e encaixa nas pautas da tela */
function fl119Completar(){if(!FL119.parcial)return Promise.resolve();if(FL119.prom)return FL119.prom;const P=FL119.parcial;
  FL119.prom=(async()=>{let f;try{f=await fl119Juntar(P.L)}catch(e){const r=await fetch("feed.json",{cache:"no-cache"});if(!r.ok)throw 0;f=await r.json()}
    if(FL119.parcial===P)fl119Encaixar(f)})().catch(()=>{}).then(()=>{FL119.prom=null});
  return FL119.prom}
function fl119Encaixar(full){const P=FL119.parcial;FL119.parcial=null;const v=FL119.v.get(full);
  const mesma=FEED&&full&&full.atualizado_em===P.at&&Array.isArray(full.pautas)&&full.pautas.map(p=>p&&p.id).join("|")===P.ids;
  if(!mesma){prepararFeed(full);fl119Guardar(full);fl119Depois();return}  // o feed.json já era outra edição: desenha tudo de novo
  const s=sanear(full)||full;const ant=new Map((FEED.pautas||[]).map(p=>[p.id,p]));
  s.pautas=(s.pautas||[]).map(p=>{const o=ant.get(p.id);if(!o)return p;Object.keys(o).forEach(k=>delete o[k]);return Object.assign(o,p)});
  Object.keys(FEED).forEach(k=>delete FEED[k]);Object.assign(FEED,s);if(v)FL119.v.set(FEED,v);fl119Guardar(FEED);
  if(typeof FEED_ADIADO!=="undefined"&&typeof RF_REAL==="function"){
    if(VIEW==="feed"){FEED_ADIADO=false;try{RF_REAL()}catch(e){}}
    else{FEED_ADIADO=true;const f=()=>{if(FEED_ADIADO&&VIEW!=="feed"){FEED_ADIADO=false;try{RF_REAL()}catch(e){}}};window.requestIdleCallback?requestIdleCallback(f,{timeout:3000}):setTimeout(f,1200)}}
  fl119Depois()}
/* o que estava aberto com o leve se completa: matéria e busca */
function fl119Depois(){try{if(typeof MAT_PID!=="undefined"&&MAT_PID&&document.querySelector("#layer .mat")&&!(($("#layer2")||{}).innerHTML))abrirMateria(MAT_PID,true)}catch(e){}
  ["bvq","btext"].forEach(id=>{const i=document.getElementById(id);if(i&&i.value.trim().length>=2)i.dispatchEvent(new Event("input"))})}
/* matéria aberta antes do detalhe: mostra o que já tem e um sinal discreto de que o resto está chegando */
{const _am119=abrirMateria;abrirMateria=function(pid){const r=_am119.apply(this,arguments);
  if(FL119.parcial){fl119Completar();const m=document.querySelector("#layer .mat .mat-p");if(m&&!m.querySelector(".fl119-sk"))m.insertAdjacentHTML("beforeend",`<div class="cp-sk fl119-sk" role="status" aria-label="Carregando o resto da matéria"><i style="height:14px;width:92%"></i><i style="height:14px;width:84%"></i><i style="height:14px;width:60%"></i></div>`)}
  return r}}
/* outras telas que dependem do detalhe (página da cobertura, fontes, seção, explicador…): esperam o detalhe (até 4 s) */
const FL119_ESPERA="[data-cobpag],[data-cpfontes],[data-cobfontes],[data-capasec],[data-explica],[data-dorm],[data-matshare],[data-sec-story],[data-1mshare]";
document.addEventListener("click",e=>{if(!FL119.parcial)return;const t=e.target&&e.target.closest&&e.target.closest(FL119_ESPERA);if(!t||FL119.passa===t)return;
  e.stopImmediatePropagation();e.preventDefault();
  Promise.race([fl119Completar(),new Promise(ok=>setTimeout(ok,4000))]).then(()=>{if(!document.contains(t))return;FL119.passa=t;try{t.click()}finally{FL119.passa=null}})},true);
/* buscar antes do detalhe: pede o detalhe (e a busca refaz sozinha quando ele chega) */
document.addEventListener("input",e=>{if(FL119.parcial&&e.target&&(e.target.id==="bvq"||e.target.id==="btext"))fl119Completar()},true);
addEventListener("online",()=>{if(FL119.parcial)fl119Completar()});
