/* ---------- 159: Capa (15/11, noite) — achados do testador. Nomes com o prefixo ca159. ----------
   1. Ibovespa/dólar: pregão com variação muito forte ganha marca no gráfico e uma linha "num só pregão" (os saltos de
      05/10 e 26/10/2026 são de verdade, dias seguintes ao 1º e ao 2º turno; a PTAX do BC mostra o mesmo).
   2. IPCA 12m e desemprego: o cartão diz com o que compara ("+0,05 vs set"); o gráfico repete a comparação do mês no alto.
      Selic, IPCA e desemprego com seta em cor neutra (cair não é "ruim" nem "bom" por si).
   3. Selic: mostra a última reunião do Copom e o que ela decidiu ("mantida · Copom, 4 nov"); seta só quando ela mudou a taxa.
   4. Botão da balança: no alto da Capa fica no cabeçalho (não cobre a manchete); ao rolar volta a flutuar.
   5. "Edição da manhã/noite" vira "Atualizada às 9h12".
   6. Chamada que anuncia evento com data/hora já passada (escrita antes dele) sai das seções da Capa.
   7. "Para acompanhar": cada cobertura com uma linha do que mudou por último.
   8. "Ver a seção" abre o Feed já na lista da editoria; "Ver tudo ✕" vira "Todas as editorias ✕".
   9. A aba Capa não fica mais com a bolinha do Quiz do dia (o cartão do quiz continua no fim da Capa).
  10. Atividade: sino no lugar do losango, com o número de novidades. */

/* ===== 1. saltos num pregão ===== */
var CA159_LIM={ibovespa:.05,dolar:.035};
var CA159_MESL=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function ca159Saltos(id,d){const lim=CA159_LIM[id];if(!lim||!Array.isArray(d))return [];const out=[];
  for(let i=1;i<d.length;i++){const a=d[i-1].v,b=d[i].v;if(a&&isFinite(a)&&isFinite(b)&&Math.abs(b/a-1)>lim)out.push({i,pc:(b/a-1)*100,a,b,r:d[i].r})}
  return out.sort((x,y)=>Math.abs(y.pc)-Math.abs(x.pc)).slice(0,2).sort((x,y)=>x.i-y.i)}
function ca159SaltosHTML(id,sal){if(!sal.length)return "";
  const um=s=>`<b class="${s.pc>0?"sobe":"desce"}">${s.pc>0?"+":"−"}${grNum(Math.abs(s.pc),1)}%</b> em ${esc(s.r?grData(s.r,true):"")} <span>(de ${esc(grFmt(id,s.a))} para ${esc(grFmt(id,s.b))})</span>`;
  return `<p class="ca159-salto">${sal.length>1?"Variações fortes num só pregão":"Variação forte num só pregão"}: ${sal.map(um).join("; ")}.</p>`}
function ca159MarcaSaltos(id){const box=document.querySelector(".gr .gr-box");if(!box)return;const sv=box.querySelector(".gr-svg"),gx=sv&&sv.querySelector(".gr-x");
  const sal=ca159Saltos(id,GR.d);if(!sal.length||!sv||!gx||typeof GR.X!=="function")return;
  gx.insertAdjacentHTML("beforebegin",sal.map(s=>`<circle class="ca159-sp" cx="${GR.X(s.i).toFixed(1)}" cy="${GR.Y(s.b).toFixed(1)}" r="5.5"/>`).join(""));
  if(!box.parentNode.querySelector(".ca159-salto"))box.insertAdjacentHTML("afterend",ca159SaltosHTML(id,sal))}

/* ===== 2 e 3. cartões e cabeçalho do gráfico (Selic, IPCA, desemprego) ===== */
var CA159_COPOM=["2025-01-29","2025-03-19","2025-05-07","2025-06-18","2025-07-30","2025-09-17","2025-11-05","2025-12-10",
  "2026-01-28","2026-03-18","2026-04-29","2026-06-17","2026-08-05","2026-09-16","2026-11-04","2026-12-09","2027-01-27"];
function ca159Copoms(){const s=new Set(CA159_COPOM);try{((FEED&&FEED.calendario)||[]).forEach(c=>{if(c&&/copom/i.test(String(c.tipo||"")+" "+String(c.texto||""))){const d=String(c.ate||c.data||"").slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(d))s.add(d)}})}catch(e){}return [...s].sort()}
/* a decisão sai no fim da tarde do 2º dia da reunião */
function ca159UltCopom(){const hj=hojeSP(),m=minAgoraSP();return ca159Copoms().filter(d=>d<hj||(d===hj&&m>=19*60)).pop()||""}
function ca159DiaMes(d,longo){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(d||"");if(!m)return "";return (+m[3])+" "+(longo?"de "+CA159_MESL[+m[2]-1]:GR_MES[+m[2]-1])}
/* {dir, t (texto curto), d (data da reunião)} ou null sem dado */
function ca159Selic(x){const ult=ca159UltCopom(),desde=String((x&&x.data)||"").slice(0,10);if(!ult||!/^\d{4}-\d{2}-\d{2}$/.test(desde))return null;
  /* a taxa nova vale a partir do dia seguinte à reunião: reunião no dia em que ela começou ou depois = manteve */
  if(ult>=desde)return {dir:"estavel",t:"mantida",d:ult};
  const s=(Array.isArray(x.serie)?x.serie:[]).map(Number).filter(isFinite);if(s.length<2)return null;const v=s[s.length-1];let a=null;
  for(let i=s.length-2;i>=0;i--)if(Math.abs(s[i]-v)>1e-9){a=s[i];break}if(a==null)return {dir:"estavel",t:"mantida",d:ult};
  return {dir:v>a?"sobe":"desce",t:(v>a?"+":"−")+grNum(Math.abs(v-a),2),d:ult}}
/* comparação com o mês anterior: {dir, t ("+0,05"), mes ("set")} */
function ca159Mes(x){const s=(Array.isArray(x&&x.serie)?x.serie:[]).map(Number),r=Array.isArray(x&&x.rotulos)?x.rotulos:[];if(s.length<2||!isFinite(s[s.length-1])||!isFinite(s[s.length-2]))return null;
  const c=x.id==="desemprego"?1:2,dd=s[s.length-1]-s[s.length-2],m=/^\d{4}-(\d{2})/.exec(String(r[r.length-2]||""));const mi=m?+m[1]-1:-1;
  if(Math.abs(dd)<Math.pow(10,-c)/2)return {dir:"estavel",t:"igual",mi};return {dir:dd>0?"sobe":"desce",t:(dd>0?"+":"−")+grNum(Math.abs(dd),c),mi}}
var CA159_SETA={sobe:"▲",desce:"▼",estavel:"="};
{const _it159=indTile;indTile=function(x){let h=_it159.apply(this,arguments);try{if(!x||!GR_PP[x.id])return h;let em=null,dt=null;
    if(x.id==="selic"){const s=ca159Selic(x);if(s){em=`<em class="${s.dir} ca159-neu">${CA159_SETA[s.dir]} ${esc(s.t)}</em>`;dt="Copom, "+ca159DiaMes(s.d)}}
    else if(!x.variacao){const m=ca159Mes(x);if(m)em=`<em class="${m.dir} ca159-neu">${CA159_SETA[m.dir]} ${esc(m.t)}${m.mi>=0?` <small>vs ${esc(GR_MES[m.mi])}</small>`:""}</em>`}
    if(em)h=h.replace(/<em class="[a-z]+">[^<]*<\/em>/,em);else h=h.replace(/<em class="([a-z]+)">/,'<em class="$1 ca159-neu">');
    if(dt)h=h.replace(/<small class="ind-d">[^<]*<\/small>/,`<small class="ind-d">${esc(dt)}</small>`);
    if(x.id==="selic"&&em){const s=ca159Selic(x);h=h.replace(/aria-label="([^"]*)\. Ver gráfico"/,`aria-label="$1, ${s.t==="mantida"?"mantida":"mudou ("+s.t+" ponto)"} na reunião do Copom de ${esc(ca159DiaMes(s.d,true))}. Ver gráfico"`)}}catch(e){}return h}}
{const _ag159=abrirGrafico;abrirGrafico=function(id){const r=_ag159.apply(this,arguments);try{const g=document.querySelector(".gr");if(g&&GR.id===id){
    if(GR_PP[id]){g.querySelectorAll(".gr-per-t em").forEach(e=>e.classList.add("ca159-neu"));
      const hd=g.querySelector(".gr-hd"),x=indItens().find(o=>o&&o.id===id);
      if(hd&&x&&!hd.querySelector("em")){let em="";
        if(id==="selic"){const s=ca159Selic(x);if(s)em=`<em class="${s.dir} ca159-neu">${CA159_SETA[s.dir]} ${s.t==="mantida"?"mantida":esc(s.t)+" ponto"} <small>na reunião do Copom de ${esc(ca159DiaMes(s.d,true))}</small></em>`}
        else{const m=ca159Mes(x);if(m)em=`<em class="${m.dir} ca159-neu">${CA159_SETA[m.dir]} ${m.t==="igual"?"igual":esc(m.t)+" ponto"} <small>${m.mi>=0?(m.t==="igual"?"a ":"vs ")+esc(CA159_MESL[m.mi]):"vs o mês anterior"}</small></em>`}
        if(em)hd.insertAdjacentHTML("beforeend",em)}}
    else{ca159MarcaSaltos(id);const x=indItens().find(o=>o&&o.id===id),f=g.querySelector(".gr-fonte");
      /* dólar: valor do dia = cotação comercial; linha do gráfico = PTAX (uma fonte só, ver tools/indicadores.py) */
      if(x&&f&&typeof x.fonte_serie==="string"&&x.fonte_serie&&!f.dataset.ca159){f.dataset.ca159="1";f.textContent=f.textContent.replace(/^Fonte: ([^·]+?)( ·|$)/,(m0,a,b)=>`Fonte: ${a} (valor do dia); gráfico: ${x.fonte_serie}${b}`)}}}}catch(e){}return r}}

/* ===== 4. botão da balança no cabeçalho enquanto a Capa está no alto ===== */
function ca159Lp(){const no=VIEW==="capa"&&scrollY<40&&!!document.querySelector("#v-capa .cp-top");if(document.getElementById("lpm"))return;document.documentElement.classList.toggle("ca159-lp-topo",no)}
addEventListener("scroll",ca159Lp,{passive:true});

/* ===== 6. chamada de evento que já passou ===== */
function ca159DiaSP(iso){const d=new Date(iso);if(isNaN(d))return "";try{return _FDSP.format(d)}catch(e){return ""}}
/* {ini, fim} (ms) do evento citado no título, a partir do dia em que ele foi escrito; null se não cita data */
function ca159Evento(txt,ref){const t=String(txt||""),rd=ca159DiaSP(ref);if(!rd)return null;
  let dia=0,mes=0,m=/(?:^|[^\wÀ-ú])(segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?\s*\((\d{1,2})\)/i.exec(t);
  if(m)dia=+m[2];else{m=/(?:^|[^\wÀ-ú])(?:em|no dia|dia|até|para|no|na)\s+(\d{1,2})\/(\d{1,2})(?![\d\/])/i.exec(t);if(m){dia=+m[1];mes=+m[2]}}
  if(!dia||dia>31||mes>12)return null;let [y,mo,dd]=rd.split("-").map(Number);
  if(mes){if(mes<mo-6)y++;else if(mes>mo+6)y--;mo=mes}else if(dia<dd-15){mo++;if(mo>12){mo=1;y++}}else if(dia>dd+15){mo--;if(mo<1){mo=12;y--}}
  const pad=n=>String(n).padStart(2,"0"),h=/(?:^|\s)às\s+(\d{1,2})h(\d{2})?/i.exec(t),dia0=`${y}-${pad(mo)}-${pad(dia)}`;
  if(h&&+h[1]<24){const ini=Date.parse(`${dia0}T${pad(+h[1])}:${h[2]||"00"}:00-03:00`);return isNaN(ini)?null:{ini,fim:ini+3*3600e3,hora:1}}
  const ini=Date.parse(`${dia0}T00:00:00-03:00`);return isNaN(ini)?null:{ini,fim:ini+864e5,hora:0}}
/* ===== 10. Atividade: sino com número ===== */
var CA159_SINO=`<svg class="ico ca159-sino" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/></svg>`;
function ca159Sino(){document.querySelectorAll(".at-b").forEach(b=>{const s=b.querySelector("svg");if(s&&!s.classList.contains("ca159-sino"))s.outerHTML=CA159_SINO});
  let n=0;try{n=S.uid&&S.membro?atNovas():0}catch(e){}
  document.querySelectorAll(".at-b").forEach(b=>{const d=b.querySelector(".at-dot");if(d){d.textContent=n?(n>9?"9+":String(n)):"";d.classList.toggle("ca159-n",!!n)}
    b.setAttribute("aria-label","Atividade"+(n?`: ${n} ${n===1?"novidade":"novidades"}`:""))})}

/* ===== 8. "Ver a seção": Feed já na lista da editoria ===== */
function ca159NaLista(n){const s=document.querySelector("#v-feed .sech");if(VIEW!=="feed"||FILTRO==="tudo")return;
  if(!s){if(n<40)setTimeout(()=>ca159NaLista(n+1),50);return}
  const top=document.querySelector(".top");const tb=top?Math.max(0,top.getBoundingClientRect().bottom):0;
  const y=scrollY+s.getBoundingClientRect().top-tb-6;if(y>8)window.scrollTo(0,y)}
document.addEventListener("click",e=>{const t=e.target;if(t&&t.closest&&t.closest("[data-capasec]"))setTimeout(()=>ca159NaLista(0),0)},true);
function ca159VerTudo(){document.querySelectorAll(".vertudo").forEach(b=>{if(b.dataset.ca159)return;b.dataset.ca159="1";const col=typeof FILTRO!=="undefined"&&FILTRO==="_colunas";b.textContent=col?"Ver o Feed todo ✕":"Todas as editorias ✕";b.setAttribute("aria-label",col?"Sair do filtro de colunas e ver o Feed todo":"Tirar o filtro e ver todas as editorias")})}

/* ===== 9. sem bolinha do quiz na aba Capa ===== */
{const _up159=updatePlayBadge;updatePlayBadge=function(){const r=_up159.apply(this,arguments);const b=$("#pbadge");if(b){b.hidden=true;b.removeAttribute("aria-label")}return r}}
try{updatePlayBadge();ca159Sino()}catch(e){}
