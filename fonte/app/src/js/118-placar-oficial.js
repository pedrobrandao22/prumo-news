/* ---------- 118: placar oficial automático (oficiais.json, gravado pelo robô de dados públicos, sem IA) ----------
   Quando o plenário da Câmara ou do Senado vota uma proposição que é pauta do Prumo, o robô (tools/oficiais.py) grava em
   oficiais.json a votação com o "placar" pronto (números oficiais da API de cada Casa). O app lê esse arquivo sozinho e:
   - na matéria, mostra o bloco "Placar oficial" (o mesmo gráfico placar_votacao do 110), com o crédito "Fonte: Senado
     Federal, 19h42" e, quando há mais de um turno, a troca "1º turno · 2º turno" (abre no último);
   - no Feed, uma linha curta no cartão da notícia ("Senado aprovou · 62 a 9"), que abre a matéria.
   Ligação com a pauta: o pid do robô com confiança "numero" (a proposição citada na pauta); com "palavras", só se o número
   da proposição (ex. "PEC 18/2025" ou #PEC18) estiver no texto, no contexto ou nas hashtags da pauta.
   Se a pauta já tem um placar_votacao escrito pela rodada para a mesma votação, vale o da rodada (sem repetir).
   oficiais.json é pequeno: vem da rede sem cache (como o indicadores.json), nunca segura a primeira tela, e a última cópia
   boa (só as votações) fica no aparelho. Arquivo ausente ou estranho: nada aparece e nada quebra. Nomes com o prefixo po118. */
var PO118=(function(){try{const x=JSON.parse(localStorage.getItem("prumo-placar")||"null");return x&&Array.isArray(x.v)?x:null}catch(e){return null}})(),PO118_T=0;
const PO118_CASA={camara:{n:"Câmara",tot:513,site:"Câmara"},senado:{n:"Senado",tot:81,site:"Senado"}};
const PO118_FEED_H=48; /* a linha no Feed vale por 48 h depois da votação; na matéria, enquanto o robô mantiver a votação */
const po118Int=x=>Number.isInteger(x)&&x>=0;

/* ===== 1) dados: só votações com placar válido ===== */
function po118Limpa(j){if(!j||typeof j!=="object"||!Array.isArray(j.eventos))return null;const out=[];
  j.eventos.forEach(e=>{try{if(!e||e.tipo!=="votacao"||typeof e.pid!=="string"||!e.pid)return;const pl=e.placar;if(!pl||typeof pl!=="object")return;
    const c=PO118_CASA[pl.casa];if(!c)return;const t=Date.parse(pl.quando||e.quando);if(!isFinite(t))return;
    const modo=["nominal","simbolica","sem_placar"].includes(pl.modo)?pl.modo:"";if(!modo)return;
    const res=pl.resultado==="aprovado"||pl.resultado==="rejeitado"?pl.resultado:null;
    let sim=null,nao=null,abst=null;
    if(modo==="nominal"){if(!po118Int(pl.sim)||!po118Int(pl.nao))return;sim=pl.sim;nao=pl.nao;abst=po118Int(pl.abst)?pl.abst:0;if(sim+nao+abst>c.tot)return}
    else if(!res)return;
    const s=v=>typeof v==="string"?v.slice(0,160):"";
    out.push({id:s(e.id),pid:e.pid,conf:s(e.confianca),props:(Array.isArray(e.proposicoes)?e.proposicoes:[]).filter(x=>typeof x==="string").slice(0,6),
      casa:pl.casa,prop:s(pl.proposicao),turno:/^[12]º$/.test(pl.turno||"")?pl.turno:"",modo,res,sim,nao,abst,
      minimo:Number.isInteger(pl.minimo)&&pl.minimo>0&&pl.minimo<=c.tot?pl.minimo:0,regra:s(pl.regra),t,exata:pl.hora_exata===true,
      fonte:s(pl.fonte)||(pl.casa==="senado"?"Senado Federal":"Câmara dos Deputados"),url:/^https:\/\/[\w.-]+\.leg\.br\//.test(pl.url||"")?String(pl.url).slice(0,300):""})}catch(_){}});
  return {g:String(j.gerado||""),v:out}}
async function po118Carrega(forca){if(!forca&&Date.now()-PO118_T<60000)return;PO118_T=Date.now();
  try{const r=await fetch("oficiais.json",{cache:"no-cache"});if(!r.ok)return;const d=po118Limpa(await r.json());if(!d)return;
    const mudou=JSON.stringify(d.v)!==JSON.stringify(PO118?PO118.v:null);PO118=d;try{localStorage.setItem("prumo-placar",JSON.stringify(d))}catch(e){}
    if(mudou)po118Aplica()}catch(e){}}

/* ===== 2) ligação com a pauta ===== */
/* "PEC 18/2025" aparece na pauta? Aceita "PEC 18/2025", "PEC nº 18, de 2025", "PEC 18" (ano, se vier, tem de bater) e a hashtag #PEC18 */
function po118Cita(p,prop){const m=/^([A-Z]{2,4}) (\d{1,6})\/(\d{4})$/.exec(prop||"");if(!m)return false;
  const sig=m[1]==="MPV"?"(?:mpv|mp)":m[1].toLowerCase(),d=m[2],num=d.length>3?d.slice(0,-3)+"\\.?"+d.slice(-3):d;
  const n=p.neutro||{},ups=(Array.isArray(p.atualizacoes)?p.atualizacoes:[]).map(u=>u&&u.texto),hs=Array.isArray(p.hashtags)?p.hashtags:[];
  const tx=norm([p.tag,p.tema,n.titulo,p.subtitulo,n.texto,p.contexto,p.proximo,...(Array.isArray(n.pontos)?n.pontos:[]),...ups].filter(x=>typeof x==="string").join(" \n "));
  const re=new RegExp(`\\b${sig}\\s*(?:n[o°º.]*\\s*)?${num}(?!\\d|\\.\\d)(?:\\s*(?:/|,?\\s*de\\s+)(\\d{4}))?`,"g");let x;
  while((x=re.exec(tx)))if(!x[1]||x[1]===m[3])return true;
  const ht=new RegExp(`^#?${sig}_?${d}(?:_?${m[3]})?$`);return hs.some(h=>typeof h==="string"&&ht.test(norm(h).replace(/[\s.\/-]/g,"")))}
function po118Liga(e,p){if(e.pid!==p.id)return false;if(e.conf==="numero"||e.conf==="id")return true;
  if(e.conf==="palavras")return (e.prop?[e.prop]:[]).concat(e.props).some(x=>po118Cita(p,x));return false}
const po118TN=t=>t==="2º"?2:t==="1º"?1:0;
/* as votações da pauta: a da última votação (mesma Casa e mesma proposição), em ordem (1º turno, 2º turno…) */
function po118Da(p){if(!PO118||!p)return null;const l=PO118.v.filter(e=>po118Liga(e,p));if(!l.length)return null;
  l.sort((a,b)=>a.t-b.t||po118TN(a.turno)-po118TN(b.turno)||(a.id<b.id?-1:1));const u=l[l.length-1];
  /* mesmo turno votado de novo (ex.: votação refeita): fica a mais recente */
  const m=new Map();l.filter(e=>e.casa===u.casa&&(e.prop||"")===(u.prop||"")).forEach(e=>{const k=e.turno||e.id;m.delete(k);m.set(k,e)});return [...m.values()]}
/* a rodada já desenhou este placar? (mesma Casa e os mesmos Sim/Não, ou o mesmo turno no título) */
function po118DaRodada(p,e){const vs=(Array.isArray(p.visuais)?p.visuais:[]).filter(v=>v&&v.tipo==="grafico"&&v.forma==="placar_votacao"&&v.casa===e.casa);
  return vs.some(v=>{const its=Array.isArray(v.itens)?v.itens:[],val=r=>{const i=its.find(x=>x&&typeof x.rotulo==="string"&&r.test(norm(x.rotulo)));return i?i.valor:null};
    if(e.sim!=null&&val(/^sim/)===e.sim&&val(/^nao/)===e.nao)return true;
    return !!(e.turno&&typeof v.titulo==="string"&&norm(v.titulo).indexOf(norm(e.turno+" turno"))>=0)})}

/* ===== 3) desenho ===== */
function po118Hora(e){const d=new Date(e.t-3*3600e3),dia=`${d.getUTCDate()}/${d.getUTCMonth()+1}`,hh=`${String(d.getUTCHours()).padStart(2,"0")}h${String(d.getUTCMinutes()).padStart(2,"0")}`;
  const hj=d.toISOString().slice(0,10)===hojeSP();return e.exata?(hj?hh:`${dia}, ${hh}`):(hj?"hoje":dia)}
function po118Credito(e){return `${e.fonte}, ${po118Hora(e)}`}
function po118Verbo(e){return e.res==="aprovado"?"aprovou":e.res==="rejeitado"?"rejeitou":"votou"}
function po118Rotulo(e,i){return e.turno?`${e.turno} turno`:`${i+1}ª votação`}
function po118Grafico(e){const c=PO118_CASA[e.casa],tit=(e.prop||"Votação")+" no "+(e.casa==="senado"?"Senado":"plenário da Câmara")+(e.turno?` · ${e.turno} turno`:"");
  if(e.modo==="nominal"){const its=[{rotulo:"Sim",valor:e.sim},{rotulo:"Não",valor:e.nao}];if(e.abst)its.push({rotulo:"Abstenção",valor:e.abst});
    let h="";try{h=graficoNoticia({tipo:"grafico",forma:"placar_votacao",casa:e.casa,titulo:tit,minimo:e.minimo||undefined,resultado:e.res||undefined,fonte:po118Credito(e),itens:its})}catch(_){h=""}
    if(h)return h}
  const res=e.res==="aprovado"?`<span class="acv-res ok">Aprovado</span>`:e.res==="rejeitado"?`<span class="acv-res no">Rejeitado</span>`:"";
  const tx=e.modo==="simbolica"?"Votação simbólica: os votos não são registrados um a um no painel, por isso não há placar.":`O ${c.site} registrou o resultado; o número de votos ainda não está nos dados abertos do ${c.site}.`;
  return `<div class="gn acv po118-simb"><span class="lbl">${esc(tit)}</span>${res}<p class="po118-simb-t">${esc(tx)}</p><p class="hint">Fonte: ${esc(po118Credito(e))}</p></div>`}
function po118Pe(e){const c=PO118_CASA[e.casa];const r=e.regra?`Para aprovar: ${esc(e.regra)}.`:"";
  return `<p class="po118-pe">${r}${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">Ver no site do ${c.site} ›</a>`:""}</p>`}
function po118Corpo(l,i){const e=l[i];return po118Grafico(e)+po118Pe(e)}
function po118MatHTML(p){const l=po118Da(p);if(!l||!l.length)return "";const i=l.length-1;if(po118DaRodada(p,l[i]))return "";
  const sw=l.length>1?`<div class="po118-sw" role="group" aria-label="Escolher a votação">${l.map((e,k)=>`<button type="button" data-po118t="${k}" aria-pressed="${k===i}">${esc(po118Rotulo(e,k))}</button>`).join("")}</div>`:"";
  return `<section class="mat-vis po118" data-po118="${esc(p.id)}" aria-label="Placar oficial"><div class="po118-cab"><span class="po118-k"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18a8 8 0 0 1 16 0"/><path d="M12 18l4-5"/></svg>Placar oficial</span><span class="po118-auto">atualizado sozinho</span></div>${sw}<div class="po118-g" aria-live="polite">${po118Corpo(l,i)}</div></section>`}
function po118LinhaHTML(p){const l=po118Da(p);if(!l||!l.length)return "";const e=l[l.length-1];if(Date.now()-e.t>PO118_FEED_H*3600e3)return "";const c=PO118_CASA[e.casa];
  const num=e.modo==="nominal"?`${e.sim} a ${e.nao}`:e.modo==="simbolica"?"votação simbólica":"";
  const al=`Placar oficial: ${c.n} ${po118Verbo(e)}${e.turno?` em ${e.turno} turno`:""}${num?", "+num:""}. Abrir a matéria`;
  return `<button type="button" class="po118-ln" data-capmat="${esc(p.id)}" aria-label="${esc(al)}"><i class="po118-ln-${e.res==="rejeitado"?"no":e.res?"ok":"x"}" aria-hidden="true"></i><b>${esc(c.n)} ${po118Verbo(e)}</b>${num?`<span class="po118-sep" aria-hidden="true"> · </span><span class="po118-n">${esc(num)}</span>`:""}${e.turno?`<span class="po118-sep" aria-hidden="true"> · </span><span class="po118-tu">${esc(e.turno)} turno</span>`:""}<span class="po118-ir" aria-hidden="true"> ›</span></button>`}

/* ===== 4) onde entra ===== */
/* matéria: antes dos outros gráficos (é a parte "Os números" da matéria) */
{const _mv118=matVisuais;matVisuais=function(p){const o=_mv118.apply(this,arguments);let h="";try{h=po118MatHTML(p)}catch(e){h=""}return h+o}}
/* capítulos (fase 2): o bloco ganha o nome certo */
function po118Caps(){const m=$("#layer .mat");if(!m)return;const b=m.querySelector(".po118.fs2-alvo");if(!b||!b.id)return;const bt=m.querySelector(`.fs2-cap-b[aria-controls="${b.id}"]`);if(!bt)return;
  const t=[...bt.childNodes].filter(n=>n.nodeType===3).pop();if(t)t.textContent="Placar oficial"}
if(typeof f113Caps==="function"){const _fc118=f113Caps;f113Caps=function(){const r=_fc118.apply(this,arguments);try{po118Caps()}catch(e){}return r}}
/* matéria já aberta quando os dados chegam: põe, troca ou tira o bloco no lugar */
function po118NaMateria(){const m=$("#layer .mat"),c=m&&m.querySelector(".mat-c");if(!c||typeof MAT_PID==="undefined")return;const p=pautaById(MAT_PID);if(!p)return;
  const h=po118MatHTML(p),old=c.querySelector(".po118");if(!h&&!old)return;
  if(old&&h){const t=document.createElement("div");t.innerHTML=h;const nv=t.firstElementChild;if(old.id){nv.id=old.id;nv.className=old.className;nv.tabIndex=-1}old.replaceWith(nv);return}
  if(old){old.remove()}else{const ref=c.querySelector(".mat-vis");if(ref)ref.insertAdjacentHTML("beforebegin",h);else{const a=c.querySelector(".mat-cor,.mat-p");if(!a)return;a.insertAdjacentHTML("afterend",h)}}
  try{if(typeof f113Caps==="function"&&typeof VN_FASE2!=="undefined"&&VN_FASE2)f113Caps()}catch(e){}}
/* Feed: a linha curta no cartão da notícia (no cartão A, logo abaixo da manchete) */
function po118NoFeed(root){const box=root||document.getElementById("posts");if(!box||!PO118)return;
  box.querySelectorAll(".post[id^='p-']").forEach(a=>{const id=a.id.slice(2),p=pautaById(id);const old=a.querySelector(":scope>.po118-ln");
    if(!p||a.classList.contains("upost")){if(old)old.remove();return}
    let h="";try{h=po118LinhaHTML(p)}catch(e){h=""}
    if(old){if(!h)old.remove();else if(old.outerHTML!==h)old.outerHTML=h;return}if(!h)return;
    const tit=a.querySelector(":scope>.vn-tit"),car=a.querySelector(":scope>.car");
    if(tit)tit.insertAdjacentHTML("afterend",h);else if(car)car.insertAdjacentHTML("beforebegin",h);else a.insertAdjacentHTML("beforeend",h)})}
function po118Aplica(){try{if(typeof VIEW!=="undefined"&&VIEW==="feed")po118NoFeed()}catch(e){}try{po118NaMateria()}catch(e){}}
{const _rp118=renderPosts;renderPosts=function(){const r=_rp118.apply(this,arguments);try{po118NoFeed()}catch(e){}return r}}
{const _cm118=carregarMais;carregarMais=function(){const r=_cm118.apply(this,arguments);try{po118NoFeed()}catch(e){}return r}}
/* troca de turno */
document.addEventListener("click",e=>{const b=e.target&&e.target.closest&&e.target.closest("[data-po118t]");if(!b)return;const s=b.closest(".po118");if(!s)return;e.stopPropagation();
  const p=pautaById(s.dataset.po118),l=po118Da(p),i=+b.dataset.po118t;if(!l||!l[i])return;
  s.querySelectorAll("[data-po118t]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));const g=s.querySelector(".po118-g");if(g)g.innerHTML=po118Corpo(l,i);try{uso("placar_turno")}catch(_){}});
/* busca: junto com a conferência do feed (a cada 10 min, ao voltar ao app, ao puxar para atualizar) e logo depois da abertura */
(function(){const ant=checarFeed;checarFeed=function(){po118Carrega();return ant.apply(this,arguments)}})();
setTimeout(()=>po118Carrega(),700);
