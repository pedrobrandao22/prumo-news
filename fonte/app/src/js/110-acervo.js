/* ---------- 110: acervo de fotos no repositório, catálogo de gráficos e séries históricas ---------- */
/* Tudo aqui é opcional: sem os campos novos no feed / fotos-arquivo.json / series, o app segue como antes. */

/* ===== 1) fotos do acervo guardadas no próprio site (acervo/…webp): mesma foto, arquivo leve e local ===== */
var ACV_LOC=null,ACV_LOCK="";
function acvLocais(){const A=FOTOS_ARQ,k=(A&&A.gerado)||"";if(ACV_LOC&&ACV_LOCK===k)return ACV_LOC;const m=new Map();
  const add=f=>{if(f&&typeof f.url==="string"&&typeof f.local==="string"&&/^acervo\/[\w\/.-]+\.(?:webp|jpe?g)$/i.test(f.local)&&!/\.\./.test(f.local)){try{m.set(f.url,new URL(f.local,location.href).href)}catch(e){}}};
  try{if(A){Object.values(A.pessoas||{}).forEach(x=>(x&&Array.isArray(x.fotos)?x.fotos:[]).forEach(add));Object.values(A.assuntos||{}).forEach(x=>(x&&Array.isArray(x.fotos)?x.fotos:[]).forEach(add));Object.values(A.temas||{}).forEach(l=>Array.isArray(l)&&l.forEach(add))}}catch(e){}
  ACV_LOC=m;ACV_LOCK=k;return m}
const _acvFotoSrc=fotoSrc,_acvFotoMini=fotoMini,_acvFotoImg=fotoImg;
fotoSrc=function(u){const l=acvLocais().get(u);return l||_acvFotoSrc.apply(this,arguments)};
fotoMini=function(u){const l=acvLocais().get(u);return l||_acvFotoMini.apply(this,arguments)};
/* se o arquivo local falhar, a reserva é a miniatura da fonte (não o original pesado) */
fotoImg=function(f){const h=_acvFotoImg.apply(this,arguments);try{if(f&&acvLocais().has(f.url)){const rem=_acvFotoSrc(f.url);return h.replace(`data-orig="${escU(f.url)}"`,`data-orig="${escU(rem)}"`)}}catch(e){}return h};

/* escolha da foto de arquivo: pessoa no título (senão no subtítulo) > assunto no título (senão na tag/tema/subtítulo) > subtema > padrão da seção.
   "foto_arquivo":"tema" continua tirando o retrato (morte, prisão…). Igual a tools/paginas.py (fa_listas). */
faListas=function(p,A){const L=[],T=A.temas||{},sec=secOf(p),n=p.neutro||{},tit=String(n.titulo||""),sub=typeof p.subtitulo==="string"?p.subtitulo:"",
    extra=[p.tag,p.tema].filter(x=>typeof x==="string"&&x).join(" · ");
  const pega=l=>{if(Array.isArray(l)&&l.length&&L.indexOf(l)<0)L.push(l)};
  if(p.foto_arquivo!=="tema"){const pe=faPessoa(tit,A)||(sub?faPessoa(sub,A):null);if(pe)pega(pe.fotos)}
  const as=faAssunto(tit,A,sec)||(extra?faAssunto(extra,A,sec):null)||(sub?faAssunto(sub,A,sec):null);if(as)pega(as.fotos);
  pega(T[sec+"/"+(p.subtema||"")]);pega(T[(A.padrao||{})[sec]]);return L};

/* ===== 2) séries históricas (series/<id>.json, gravadas pelo robô dos indicadores) ===== */
var ACV_SER=(function(){try{const x=JSON.parse(localStorage.getItem("prumo-series")||"{}");return x&&typeof x==="object"?x:{}}catch(e){return {}}})(),ACV_SERT={};
function acvSerie(id){if(typeof id!=="string"||!/^[a-z0-9_]{2,30}$/.test(id))return null;
  if(!ACV_SERT[id]||Date.now()-ACV_SERT[id]>10*60e3){ACV_SERT[id]=Date.now();acvBuscaSerie(id)}
  const s=ACV_SER[id];return s&&Array.isArray(s.pontos)&&s.pontos.length?s:null}
async function acvBuscaSerie(id){try{const r=await fetch("series/"+id+".json",{cache:"no-cache"});if(!r.ok)return acvRedesenha(id);const d=await r.json();
    if(!d||!Array.isArray(d.pontos))return acvRedesenha(id);const ant=ACV_SER[id];ACV_SER[id]=d;
    try{localStorage.setItem("prumo-series",JSON.stringify(ACV_SER))}catch(e){}
    if(!ant||ant.atualizado!==d.atualizado||(ant.pontos||[]).length!==d.pontos.length)acvRedesenha(id)}catch(e){acvRedesenha(id)}}
function acvRedesenha(id){document.querySelectorAll(`[data-acvserie="${id}"]`).forEach(el=>{try{const v=JSON.parse(el.getAttribute("data-acvv")||"null");if(!v)return;
  v.__tentou=1;const h=acvGrafico(v);if(h===""){el.remove();return}if(!h)return;const t=document.createElement("div");t.innerHTML=h;if(t.firstElementChild)el.replaceWith(t.firstElementChild)}catch(e){}})}
function acvPeriodo(s,v){let pts=s.pontos.filter(x=>Array.isArray(x)&&x.length===2&&typeof x[0]==="string"&&isFinite(Number(x[1]))).map(x=>[x[0],Number(x[1])]);if(!pts.length)return [];
  const ult=pts[pts.length-1][0],dt=d=>new Date((d.length===7?d+"-01":d)+"T12:00:00Z");
  if(typeof v.desde==="string"&&v.desde)pts=pts.filter(x=>x[0]>=v.desde);
  if(typeof v.ate==="string"&&v.ate)pts=pts.filter(x=>x[0]<=v.ate+"~");
  if(!v.desde){const per=typeof v.periodo==="string"?v.periodo:(s.freq==="diaria"?"12m":"24m"),m=/^(\d{1,3})(d|m|a)$/.exec(per);
    if(m){const n=+m[1],ini=dt(ult);if(m[2]==="d")ini.setUTCDate(ini.getUTCDate()-n);else ini.setUTCMonth(ini.getUTCMonth()-(m[2]==="a"?12*n:n));
      const lim=ini.toISOString().slice(0,s.freq==="mensal"||ult.length===7?7:10);pts=pts.filter(x=>x[0]>lim)}}
  if(pts.length>90){const k=Math.ceil(pts.length/90),out=[];pts.forEach((x,i)=>{if(i%k===0||i===pts.length-1)out.push(x)});pts=out}
  return pts}
const ACV_MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function acvRotData(d,longo){const m=/^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d);if(!m)return d;const mes=ACV_MES[+m[2]-1]||m[2];
  return m[3]&&!longo?`${+m[3]}/${mes}`:`${mes}/${m[1].slice(2)}`}
function acvDeSerie(v){const s=acvSerie(v.serie);if(!s)return null;const pts=acvPeriodo(s,v);if(pts.length<2)return null;
  const longo=pts.length>2&&(new Date(pts[pts.length-1][0].slice(0,10))-new Date(pts[0][0].slice(0,10)))>150*864e5;
  return {...v,titulo:v.titulo||s.nome,unidade:v.unidade!=null?v.unidade:s.unidade,casas:Number.isInteger(v.casas)?v.casas:s.casas,
    fonte:v.fonte||s.fonte,itens:pts.map(x=>({rotulo:acvRotData(x[0],longo),valor:x[1]})),
    __at:s.atualizado?String(s.atualizado).slice(0,10):""}}

/* ===== 3) catálogo de gráficos (visual {tipo:"grafico", forma, …}: ver tools/manual.md) ===== */
const ACV_FORMAS=["linha","area","barras_empilhadas","rosca","placar_votacao","mapa_uf","antes_depois","faixa_meta","ranking","pesquisa","contagem"];
var ACV_N=0;
function acvTrata(v){return !!(v&&v.tipo!=="numeros"&&ACV_FORMAS.indexOf(v.forma)>=0&&!(v.forma==="linha"&&!v.serie))}
function acvCasas(v,vals){return Number.isInteger(v.casas)?Math.max(0,Math.min(2,v.casas)):(vals.every(x=>Number.isInteger(x))?0:1)}
function acvItens(v){return (Array.isArray(v.itens)?v.itens:[]).filter(i=>i&&typeof i.rotulo==="string"&&i.rotulo.trim()&&typeof i.valor==="number"&&isFinite(i.valor)).map(i=>({r:i.rotulo,v:i.valor,on:!!i.destaque,m:typeof i.margem==="number"?i.margem:null}))}
function acvCab(v,un){const u=v.unidade&&v.unidade!=="%"&&un?` <em class="gn-u">em ${esc(v.unidade)}</em>`:"";return `<span class="lbl">${esc(v.titulo||"Em gráfico")}${u}</span>`}
function acvPe(v,extra){const f=v.fonte?`Fonte: ${esc(v.fonte)}${v.__at?` · atualizado em ${esc(dataCurta(v.__at))}`:""}`:"";
  return `${extra||""}${v.nota?`<p class="gn-nota">${esc(v.nota)}</p>`:""}${f?`<p class="hint">${f}</p>`:""}`}
function acvBox(v,forma,miolo,extra){return `<div class="gn acv acv-${forma}">${acvCab(v,["linha","area","faixa_meta","barras_empilhadas"].includes(forma))}${miolo}${acvPe(v,extra)}</div>`}
function acvRotulo(v,its,c){return its.map(i=>`${i.r}: ${gnNum(i.v,v.unidade,c)}`).join("; ")}
function acvGrafico(v){if(!acvTrata(v))return null;
  if(v.serie&&["linha","area","faixa_meta"].includes(v.forma)){const d=acvDeSerie(v);
    if(!d){if(v.__tentou&&!acvSerie(v.serie))return "";return `<div class="gn acv acv-carrega" data-acvserie="${esc(v.serie)}" data-acvv="${esc(JSON.stringify(v))}">${acvCab(v,0)}<div class="acv-sk" aria-label="Carregando o gráfico"></div></div>`}
    v=d}
  try{const f=ACV_DESENHO[v.forma];return f?f(v):""}catch(e){return ""}}
const ACV_DESENHO={
  linha:v=>acvLinha(v,false),area:v=>acvLinha(v,true),faixa_meta:v=>acvLinha(v,false,v.meta),
  ranking(v){let its=acvItens(v);if(its.length<2)return "";const asc=v.ordem==="asc";its=its.slice().sort((a,b)=>asc?a.v-b.v:b.v-a.v).slice(0,10);
    const c=acvCasas(v,its.map(i=>i.v)),mx=Math.max(...its.map(i=>Math.abs(i.v)))||1;
    return acvBox(v,"ranking",`<ol class="acv-rk" aria-label="${esc((v.titulo||"Ranking")+": "+acvRotulo(v,its,c))}">${its.map((i,k)=>`<li class="${i.on?"on":""}"><span class="acv-rk-n">${k+1}º</span><span class="acv-rk-r">${esc(i.r)}</span><b>${esc(gnNum(i.v,v.unidade,c))}</b><i style="width:${Math.max(2,Math.abs(i.v)*100/mx).toFixed(1)}%"></i></li>`).join("")}</ol>`)},
  rosca(v){const its=acvItens(v).filter(i=>i.v>=0).slice(0,6),tot=its.reduce((a,i)=>a+i.v,0);if(its.length<2||tot<=0)return "";
    const c=acvCasas(v,its.map(i=>i.v)),R=54,C=2*Math.PI*R;let ac=0,arcs="";
    its.forEach((i,k)=>{const fr=i.v/tot,len=Math.max(0,fr*C-(its.length>1?1.5:0));arcs+=`<circle class="acv-c${k+1}" cx="70" cy="70" r="${R}" fill="none" stroke-width="22" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-ac).toFixed(2)}" transform="rotate(-90 70 70)"><title>${esc(i.r)}: ${esc(gnNum(i.v,v.unidade,c))}</title></circle>`;ac+=fr*C});
    const cen=v.centro!=null&&String(v.centro).trim()?String(v.centro).slice(0,12):v.unidade==="%"?"":gnNum(tot,v.unidade,c);
    const pct=x=>(x*100/tot).toLocaleString("pt-BR",{maximumFractionDigits:1})+"%";
    return acvBox(v,"rosca",`<div class="acv-ro"><svg class="gn-svg acv-ro-s" viewBox="0 0 140 140" role="img" aria-label="${esc((v.titulo||"Composição")+": "+its.map(i=>i.r+" "+pct(i.v)).join("; "))}">${arcs}${cen?`<text x="70" y="${v.centro_rotulo?72:77}" text-anchor="middle" class="acv-ro-t">${esc(cen)}</text>`:""}${v.centro_rotulo?`<text x="70" y="88" text-anchor="middle" class="acv-ro-u">${esc(String(v.centro_rotulo).slice(0,16))}</text>`:""}</svg>
      <ul class="acv-leg">${its.map((i,k)=>`<li class="${i.on?"on":""}"><i class="acv-b${k+1}"></i><span>${esc(i.r)}</span><b>${esc(pct(i.v))}</b>${v.unidade==="%"?"":`<small>${esc(gnNum(i.v,v.unidade,c))}</small>`}</li>`).join("")}</ul></div>`)},
  barras_empilhadas(v){const sr=(Array.isArray(v.series)?v.series:[]).filter(x=>typeof x==="string").slice(0,4);if(sr.length<2)return "";
    const its=(Array.isArray(v.itens)?v.itens:[]).filter(i=>i&&typeof i.rotulo==="string"&&Array.isArray(i.valores)&&i.valores.length===sr.length&&i.valores.every(x=>typeof x==="number"&&x>=0)).slice(0,8);if(its.length<1)return "";
    const pc=v.modo==="percentual",tots=its.map(i=>i.valores.reduce((a,b)=>a+b,0)),mx=Math.max(...tots)||1,c=acvCasas(v,its.flatMap(i=>i.valores));
    return acvBox(v,"barras_empilhadas",`<ul class="acv-leg acv-leg-h">${sr.map((s,k)=>`<li><i class="acv-b${k+1}"></i><span>${esc(s)}</span></li>`).join("")}</ul>
      <ul class="acv-em">${its.map((i,j)=>{const t=tots[j]||1,w=pc?100:t*100/mx;return `<li aria-label="${esc(i.rotulo+": "+sr.map((s,k)=>s+" "+gnNum(i.valores[k],v.unidade,c)).join(", "))}"><span class="gn-r">${esc(i.rotulo)}</span><span class="acv-em-t" style="width:${Math.max(4,w).toFixed(1)}%">${i.valores.map((x,k)=>{const p=x*100/t;return p>0?`<i class="acv-b${k+1}" style="width:${p.toFixed(2)}%" title="${esc(sr[k]+": "+gnNum(x,v.unidade,c))}">${p>=14?`<b>${esc(pc?Math.round(p)+"%":grNum(x,c))}</b>`:""}</i>`:""}).join("")}</span></li>`}).join("")}</ul>`)},
  antes_depois(v){const its=acvItens(v).slice(0,2);if(its.length<2)return "";const [a,b]=its,c=acvCasas(v,[a.v,b.v]),u=v.unidade||"";
    let dif="";if(u==="%"){const d=b.v-a.v;dif=(d>0?"+":d<0?"−":"")+grNum(Math.abs(d),Math.max(c,1))+" p.p."}else if(a.v){const d=(b.v/a.v-1)*100;dif=(d>0?"+":d<0?"−":"")+grNum(Math.abs(d),Math.abs(d)<10?1:0)+"%"}
    const dir=b.v>a.v?"sobe":b.v<a.v?"desce":"igual",mx=Math.max(Math.abs(a.v),Math.abs(b.v))||1;
    return acvBox(v,"antes_depois",`<div class="acv-ad" role="img" aria-label="${esc(`${a.r}: ${gnNum(a.v,u,c)}; ${b.r}: ${gnNum(b.v,u,c)}${dif?" ("+dif+")":""}`)}">
      <div class="acv-ad-c"><span>${esc(a.r)}</span><b>${esc(gnNum(a.v,u,c))}</b><i style="width:${(Math.abs(a.v)*100/mx).toFixed(1)}%"></i></div>
      <div class="acv-ad-s ${dir}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h14m-5-6 6 6-6 6"/></svg>${dif?`<em>${esc(dif)}</em>`:""}</div>
      <div class="acv-ad-c on"><span>${esc(b.r)}</span><b>${esc(gnNum(b.v,u,c))}</b><i style="width:${(Math.abs(b.v)*100/mx).toFixed(1)}%"></i></div></div>`)},
  pesquisa(v){const its=acvItens(v).slice(0,8);if(its.length<2)return "";const mg=typeof v.margem==="number"&&v.margem>0?v.margem:0,c=acvCasas(v,its.map(i=>i.v)),u=v.unidade||"%";
    const mx=Math.min(100,Math.max(...its.map(i=>i.v+(i.m!=null?i.m:mg)))*1.08)||1,W=x=>(Math.max(0,x)*100/mx).toFixed(2);
    const ord=its.slice().sort((a,b)=>b.v-a.v);let emp="";if(mg&&ord.length>1){const m1=ord[0].m!=null?ord[0].m:mg,m2=ord[1].m!=null?ord[1].m:mg;if(ord[0].v-m1<=ord[1].v+m2)emp=`<p class="acv-emp">Empate técnico entre ${esc(ord[0].r)} e ${esc(ord[1].r)}, dentro da margem de erro.</p>`}
    const meta=[v.instituto,v.data?"campo até "+dataCurta(String(v.data).slice(0,10)):"",mg?"margem de "+grNum(mg,mg%1?1:0)+" p.p.":"",v.registro?"registro "+v.registro:""].filter(Boolean).join(" · ");
    return acvBox(v,"pesquisa",`${meta?`<p class="acv-pq-m">${esc(meta)}</p>`:""}<ul class="acv-pq" aria-label="${esc((v.titulo||"Pesquisa")+": "+acvRotulo({unidade:u},its,c)+(mg?`; margem de ${mg} pontos`:""))}">${its.map(i=>{const m=i.m!=null?i.m:mg;return `<li class="${i.on?"on":""}"><span class="gn-r">${esc(i.r)}</span><span class="acv-pq-t"><i style="width:${W(i.v)}%"></i>${m?`<s style="left:${W(i.v-m)}%;width:${(W(i.v+m)-W(i.v-m)).toFixed(2)}%"></s>`:""}</span><b>${esc(gnNum(i.v,u,c))}</b></li>`}).join("")}</ul>`,emp)},
  placar_votacao(v){const CASA={camara:[513,"Câmara"],senado:[81,"Senado"],stf:[11,"STF"]}[v.casa];if(!CASA)return "";const [tot,nm]=CASA;
    const its=acvItens(v).filter(i=>i.v>=0).slice(0,4).map(i=>({...i,v:Math.round(i.v)}));if(its.length<2)return "";const soma=its.reduce((a,i)=>a+i.v,0);if(soma>tot)return "";
    const cls=r=>{const t=norm(r);return /^(sim|a favor|favor|aprova)/.test(t)?"sim":/^(nao|contra|rejeita)/.test(t)?"nao":/absten/.test(t)?"abs":""};
    let k2=0;its.forEach(i=>{i.c=cls(i.r)||("o"+(++k2))});const fora=tot-soma;
    const S=acvHemi(tot),seq=[];its.forEach(i=>{for(let j=0;j<i.v;j++)seq.push(i.c)});while(seq.length<tot)seq.push("aus");
    const rr=tot>100?2.9:tot>20?6.2:11;let h=S.map((p,j)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${rr}" class="acv-v-${seq[j]}"/>`).join("");
    const mn=Number.isInteger(v.minimo)&&v.minimo>0&&v.minimo<=tot?v.minimo:0;
    if(mn){const p=S[mn-1],a=p[2],x1=160+162*Math.cos(a),y1=166-162*Math.sin(a),x0=160+(tot>20?44:70)*Math.cos(a),y0=166-(tot>20?44:70)*Math.sin(a);h+=`<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" class="acv-min"/>`}
    const pri=its[0],res=v.resultado==="aprovado"?`<span class="acv-res ok">Aprovado</span>`:v.resultado==="rejeitado"?`<span class="acv-res no">Rejeitado</span>`:"";
    h+=`<text x="160" y="148" text-anchor="middle" class="acv-pl-n">${esc(String(pri.v))}</text><text x="160" y="164" text-anchor="middle" class="acv-pl-u">${esc(pri.r.toLowerCase())} · de ${tot}</text>`;
    const leg=its.map(i=>`<li><i class="acv-v-${i.c}"></i><span>${esc(i.r)}</span><b>${i.v}</b></li>`).join("")+(fora>0?`<li><i class="acv-v-aus"></i><span>${tot===11?"Não votaram":"Ausentes ou não votaram"}</span><b>${fora}</b></li>`:"");
    const al=`${nm}, ${tot} ${tot===11?"ministros":"cadeiras"}: `+its.map(i=>`${i.r} ${i.v}`).join(", ")+(fora>0?`, ausentes ${fora}`:"")+(mn?`. Mínimo para aprovar: ${mn}`:"")+(v.resultado?`. ${v.resultado}`:"");
    return acvBox(v,"placar_votacao",`${res}<svg class="gn-svg acv-pl" viewBox="0 0 320 176" role="img" aria-label="${esc(al)}">${h}</svg><ul class="acv-leg acv-leg-h">${leg}</ul>${mn?`<p class="acv-min-t"><i></i>${mn} votos necessários para aprovar</p>`:""}`)},
  mapa_uf(v){const its=acvItens(v).filter(i=>ACV_UF[i.r]);if(its.length<1)return "";const c=acvCasas(v,its.map(i=>i.v)),m=new Map(its.map(i=>[i.r,i]));
    const vs=its.map(i=>i.v),mn=Math.min(...vs),mx=Math.max(...vs),T=36,G=3,P=T+G;
    const tom=x=>mx>mn?0.16+0.84*(x-mn)/(mx-mn):0.75;let h="";
    Object.entries(ACV_UF).forEach(([uf,[cc,rr]])=>{const i=m.get(uf),x=cc*P,y=rr*P,t=i?tom(i.v):0;
      h+=`<g class="acv-uf${i?"":" sem"}${i&&i.on?" on":""}"><rect x="${x}" y="${y}" width="${T}" height="${T}" rx="5" ${i?`data-qc127o style="--qc127o:${(.12+t*.88).toFixed(2)};fill:color-mix(in srgb,var(--acv-mapa) ${(t*100).toFixed(0)}%,var(--card))"`:""}/><text x="${x+T/2}" y="${y+T/2+4}" text-anchor="middle" class="${t>.55?"cl":""}">${uf}</text><title>${uf}${i?": "+esc(gnNum(i.v,v.unidade,c)):": sem dado"}</title></g>`});
    const top=its.slice().sort((a,b)=>b.v-a.v),lado=top.slice(0,5).map((i,k)=>`<text x="244" y="${44+k*19}" class="acv-uf-l"><tspan class="b">${i.r}</tspan> ${esc(gnNum(i.v,v.unidade,c))}</text>`).join("");
    const gid="acvg"+(++ACV_N),esc2=x=>esc(gnNum(x,v.unidade,c));
    h+=`<text x="244" y="22" class="acv-uf-h">Maiores</text>${lado}<defs><linearGradient id="${gid}"><stop offset="0" style="stop-color:color-mix(in srgb,var(--acv-mapa) 16%,var(--card))"/><stop offset="1" style="stop-color:var(--acv-mapa)"/></linearGradient></defs><rect x="244" y="${44+5*19}" width="70" height="8" rx="4" fill="url(#${gid})"/><text x="244" y="${66+5*19}" class="acv-uf-s">${esc2(mn)}</text><text x="314" y="${66+5*19}" text-anchor="end" class="acv-uf-s">${esc2(mx)}</text>`;
    const al=(v.titulo||"Mapa por estado")+": "+top.map(i=>`${i.r} ${gnNum(i.v,v.unidade,c)}`).join("; ")+(its.length<27?`; ${27-its.length} estados sem dado`:"");
    return acvBox(v,"mapa_uf",`<svg class="gn-svg acv-mapa" viewBox="0 0 320 ${8*P}" role="img" aria-label="${esc(al)}">${h}</svg>`,its.length<27?`<p class="hint">Estados em branco: sem dado.</p>`:"")},
  contagem(v){const m=/^(\d{4}-\d{2}-\d{2})$/.exec(String(v.data||""));if(!m)return "";const hj=hojeSP(),alvo=m[1];
    const dias=Math.round((Date.parse(alvo+"T12:00:00Z")-Date.parse(hj+"T12:00:00Z"))/864e5),rot=String(v.rotulo||"").slice(0,60);
    const big=dias>0?`<b class="acv-ct-n">${dias}</b><span class="acv-ct-u">${dias===1?"dia":"dias"} ${esc(rot)}</span>`:dias===0?`<b class="acv-ct-n hoje">Hoje</b><span class="acv-ct-u">${esc(rot)}${v.hora?" · "+esc(v.hora):""}</span>`:`<b class="acv-ct-n foi">${esc(dataCurta(alvo))}</b><span class="acv-ct-u">foi em ${esc(dataCurta(alvo))}: ${esc(rot)}</span>`;
    const d0=new Date(alvo+"T12:00:00Z"),ano=d0.getUTCFullYear(),mes=d0.getUTCMonth(),pri=new Date(Date.UTC(ano,mes,1,12)).getUTCDay(),nd=new Date(Date.UTC(ano,mes+1,0,12)).getUTCDate();
    const marc=new Set((Array.isArray(v.itens)?v.itens:[]).map(i=>i&&i.data).filter(Boolean));let cal="";
    for(let i=0;i<pri;i++)cal+=`<span></span>`;
    for(let d=1;d<=nd;d++){const iso=`${ano}-${String(mes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;cal+=`<span class="${iso===alvo?"alvo":""}${iso===hj?" hj":""}${marc.has(iso)?" mc":""}${iso<hj?" pas":""}">${d}</span>`}
    const ms=(Array.isArray(v.itens)?v.itens:[]).filter(i=>i&&/^\d{4}-\d{2}-\d{2}$/.test(i.data)&&typeof i.texto==="string").slice(0,4);
    return acvBox(v,"contagem",`<div class="acv-ct" role="img" aria-label="${esc(dias>0?`Faltam ${dias} dias ${rot} (${dataCurta(alvo)})`:dias===0?`Hoje: ${rot}`:`Foi em ${dataCurta(alvo)}: ${rot}`)}"><div class="acv-ct-a">${big}<small>${esc(new Date(alvo+"T12:00:00Z").toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"}))}${v.hora?" · "+esc(v.hora):""}</small></div>
      <div class="acv-cal" aria-hidden="true"><em>${ACV_MES[mes]} ${ano}</em><div>${["D","S","T","Q","Q","S","S"].map(x=>`<span class="ds">${x}</span>`).join("")}${cal}</div></div></div>
      ${ms.length?`<ol class="acv-ct-m">${ms.map(i=>`<li class="${i.data<hj?"pas":""}"><time>${esc(dataCurta(i.data))}</time><span>${esc(i.texto)}</span></li>`).join("")}</ol>`:""}`)}
};
/* hemiciclo: cadeiras em fileiras, ordenadas da esquerda para a direita (Senado = as fileiras da ilustração "plenario") */
var ACV_HEMI={};
function acvHemi(n){if(ACV_HEMI[n])return ACV_HEMI[n];let rows;
  if(n===81)rows=[[72,11],[92,14],[112,16],[132,19],[152,21]].map(([r,k])=>[r*1.04,k]);
  else if(n<=15)rows=[[118,n]];
  else{const nr=n>300?11:n>120?8:5,r0=n>300?76:70,r1=156,rs=[];for(let i=0;i<nr;i++)rs.push(r0+(r1-r0)*i/(nr-1));const sm=rs.reduce((a,b)=>a+b,0);
    rows=rs.map(r=>[r,Math.round(n*r/sm)]);let dif=n-rows.reduce((a,x)=>a+x[1],0);for(let i=rows.length-1;dif!==0;i=(i-1+rows.length)%rows.length){rows[i][1]+=dif>0?1:-1;dif+=dif>0?-1:1}}
  const pts=[];rows.forEach(([r,k])=>{for(let i=0;i<k;i++){const a=k===1?Math.PI/2:Math.PI-(Math.PI*i/(k-1));pts.push([160+r*Math.cos(a),166-r*Math.sin(a),a])}});
  pts.sort((p,q)=>q[2]-p[2]||Math.hypot(p[0]-160,p[1]-166)-Math.hypot(q[0]-160,q[1]-166));return ACV_HEMI[n]=pts}
/* mapa em grade: cada estado um quadrado na posição aproximada (estados pequenos aparecem do mesmo tamanho) */
const ACV_UF={RR:[1,0],AP:[2,0],AM:[1,1],PA:[2,1],MA:[3,1],CE:[4,1],RN:[5,1],AC:[0,2],RO:[1,2],TO:[2,2],PI:[3,2],PE:[4,2],PB:[5,2],
  MT:[1,3],GO:[2,3],BA:[3,3],SE:[4,3],AL:[5,3],MS:[1,4],DF:[2,4],MG:[3,4],ES:[4,4],PR:[1,5],SP:[2,5],RJ:[3,5],SC:[1,6],RS:[1,7]};
/* linha, área e faixa da meta (com eixo de valores e a faixa sombreada) */
function acvLinha(v,area,meta){const its=acvItens(v).slice(-90);if(its.length<2)return "";const u=v.unidade||"",vs=its.map(i=>i.v),c=acvCasas(v,vs);
  const W=320,H=190,pl=4,pr=44,pt=16,pb=24,cw=W-pl-pr,ch=H-pt-pb;let mn=Math.min(...vs),mx=Math.max(...vs);
  const mt=meta&&typeof meta==="object"&&["centro","min","max"].every(k=>typeof meta[k]==="number")?meta:null;
  if(mt){mn=Math.min(mn,mt.min);mx=Math.max(mx,mt.max)}
  if(area&&mn>0&&mn<mx*.5)mn=0;const pd=(mx-mn||Math.abs(mx)||1)*.12;mn=area&&mn===0?0:mn-pd;mx+=pd;if(mx-mn<1e-9)mx=mn+1;
  const X=k=>pl+k*cw/(its.length-1),Y=x=>pt+(mx-x)*ch/(mx-mn),un=u==="%"?"%":"";let h="";
  const tk=acvTicks(mn,mx);tk.forEach(t=>{h+=`<line x1="${pl}" x2="${W-pr+6}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="gr-gl"/><text x="${W-2}" y="${(Y(t)+3.5).toFixed(1)}" text-anchor="end" class="gr-yl">${esc(gnNum(t,un,acvCasasTick(tk,c)))}</text>`});
  if(mt){h+=`<rect x="${pl}" y="${Y(mt.max).toFixed(1)}" width="${cw}" height="${Math.max(1,Y(mt.min)-Y(mt.max)).toFixed(1)}" class="acv-faixa"/><line x1="${pl}" x2="${pl+cw}" y1="${Y(mt.centro).toFixed(1)}" y2="${Y(mt.centro).toFixed(1)}" class="acv-meta"/>`}
  const pts=its.map((i,k)=>X(k).toFixed(1)+","+Y(i.v).toFixed(1)),base=(pt+ch).toFixed(1);
  if(area){const g="acva"+(++ACV_N);h+=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.34"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.04"/></linearGradient></defs><path d="M${X(0).toFixed(1)},${base} L${pts.join(" L")} L${X(its.length-1).toFixed(1)},${base} Z" style="fill:url(#${g})"/>`}
  h+=`<polyline points="${pts.join(" ")}" class="gr-ln"/>`;
  if(mt)its.forEach((i,k)=>{if(i.v>mt.max||i.v<mt.min)h+=`<circle cx="${X(k).toFixed(1)}" cy="${Y(i.v).toFixed(1)}" r="${its.length>30?1.8:3}" class="acv-fora"/>`});
  const n=its.length-1,ult=its[n];h+=`<circle cx="${X(n).toFixed(1)}" cy="${Y(ult.v).toFixed(1)}" r="4" class="gr-dot"/><text x="${X(n).toFixed(1)}" y="${(Y(ult.v)-9).toFixed(1)}" text-anchor="end" class="gn-v">${esc(gnNum(ult.v,un,c))}</text>`;
  its.forEach((i,k)=>{if(i.on&&k!==n)h+=`<circle cx="${X(k).toFixed(1)}" cy="${Y(i.v).toFixed(1)}" r="3.5" class="gr-dot"/><text x="${X(k).toFixed(1)}" y="${(Y(i.v)-8).toFixed(1)}" text-anchor="middle" class="gn-v">${esc(gnNum(i.v,un,c))}</text>`});
  [0,Math.round(n/2),n].filter((k,i,a)=>a.indexOf(k)===i).forEach(k=>{h+=`<text x="${X(k).toFixed(1)}" y="${H-6}" text-anchor="${k===0?"start":k===n?"end":"middle"}" class="gr-xl">${esc(its[k].r.slice(0,12))}</text>`});
  const lg=mt?`<p class="acv-meta-l"><i class="acv-faixa-i"></i>${esc(mt.rotulo||"Meta")}: ${esc(gnNum(mt.centro,u,acvCasas({},[mt.centro])))} (de ${esc(gnNum(mt.min,u==="%"?"":u,acvCasas({},[mt.min])))} a ${esc(gnNum(mt.max,u,acvCasas({},[mt.max])))})</p>`:"";
  const al=`${v.titulo||"Gráfico"}: de ${its[0].r} (${gnNum(its[0].v,u,c)}) a ${ult.r} (${gnNum(ult.v,u,c)}); mínimo ${gnNum(Math.min(...vs),u,c)}, máximo ${gnNum(Math.max(...vs),u,c)}`+(mt?`; meta ${gnNum(mt.centro,u,c)}, faixa de ${gnNum(mt.min,u,c)} a ${gnNum(mt.max,u,c)}`:"");
  return acvBox(v,meta?"faixa_meta":area?"area":"linha",`${lg}<svg class="gn-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(al)}">${h}</svg>`)}
function acvTicks(a,b){const r=b-a,p=Math.pow(10,Math.floor(Math.log10(r/3))),s=[1,2,2.5,5,10].map(x=>x*p).find(x=>r/x<=4)||p*10,out=[];for(let t=Math.ceil(a/s)*s;t<=b+1e-9;t+=s)out.push(+t.toFixed(10));return out}
function acvCasasTick(tk,c){if(tk.length<2)return c;const s=Math.abs(tk[1]-tk[0]);return s>=1?0:s>=.1?1:2}

/* ligação com o app: matéria, Feed (carrossel) e stories usam visualHTML → graficoNoticia */
const _acvGraficoNoticia=graficoNoticia;
graficoNoticia=function(v){if(acvTrata(v)){try{const h=acvGrafico(v);if(h!=null)return h}catch(e){return ""}}return _acvGraficoNoticia.apply(this,arguments)};
const _acvIgVisDe=igVisDe,_acvIgVisHTML=igVisHTML;
igVisDe=function(p){try{const g=((p&&p.visuais)||[]).find(v=>v&&v.tipo==="grafico"&&acvTrata(v)&&acvGrafico(v));if(g)return g}catch(e){}return _acvIgVisDe.apply(this,arguments)};
igVisHTML=function(v){if(v&&v.tipo==="grafico"&&acvTrata(v)){const h=acvGrafico(v);return h?`<div class="sgv-acv">${h}</div>`:""}return _acvIgVisHTML.apply(this,arguments)};
