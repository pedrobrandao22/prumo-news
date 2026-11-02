/* ---------- Etapa 13: gráficos dos indicadores ---------- */
var GR_INFO={dolar:"Quanto custa 1 dólar em reais. Mexe com o preço de importados, de viagens e dos combustíveis.",ibovespa:"O principal índice da Bolsa brasileira: a média das ações mais negociadas.",selic:"A taxa básica de juros, definida pelo Copom do Banco Central. Pesa no custo dos empréstimos e no rendimento das aplicações.",ipca12m:"A inflação oficial acumulada em 12 meses, medida pelo IBGE. A meta do Banco Central é 3% ao ano.",desemprego:"A parcela de quem procura trabalho e não encontra (PNAD Contínua, do IBGE)."};
var GR_PP={selic:1,ipca12m:1,desemprego:1};
var GR={id:null,d:[],per:0,n:0};
var GR_MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function grNum(v,c){return Number(v).toLocaleString("pt-BR",{minimumFractionDigits:c,maximumFractionDigits:c})}
function grFmt(id,v,curto){if(id==="dolar")return "R$ "+grNum(v,2);if(id==="ibovespa")return curto?grNum(v/1000,0)+" mil":grNum(v,0);if(id==="desemprego")return grNum(v,1)+"%";if(GR_PP[id])return grNum(v,2)+"%";return grNum(v,Math.abs(v)>=1000?0:2)}
function grData(r,longo){const m=typeof r==="string"&&r.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);if(!m)return "";const mm=GR_MES[+m[2]-1]||"";if(m[3])return (+m[3])+" "+mm+(longo?" de "+m[1]:"");return longo?mm+" de "+m[1]:mm+"/"+m[1].slice(2)}
function grDados(x){const v=(Array.isArray(x&&x.serie)?x.serie:[]).map(Number);const r=Array.isArray(x&&x.rotulos)&&x.rotulos.length===v.length?x.rotulos:null;const out=[];v.forEach((n,i)=>{if(isFinite(n))out.push({v:n,r:r?String(r[i]||""):""})});return out}
function grPontos(d,X,Y,degrau){const p=[];d.forEach((o,i)=>{if(degrau&&i)p.push([X(i),Y(d[i-1].v)]);p.push([X(i),Y(o.v)])});return p}
function grSpark(x){const d=grDados(x).slice(x&&x.id==="selic"?-13:-22);if(d.length<3)return "";let mn=Math.min(...d.map(o=>o.v)),mx=Math.max(...d.map(o=>o.v));if(mx-mn<1e-9){mn-=1;mx+=1}
  const X=i=>i*100/(d.length-1),Y=v=>27-(v-mn)*23/(mx-mn);const pts=grPontos(d,X,Y,x.id==="selic").map(p=>p[0].toFixed(1)+","+p[1].toFixed(1));
  return `<svg class="gr-sp" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0,30 L${pts.join(" L")} L100,30 Z" style="fill:var(--accent);opacity:.1"/><polyline points="${pts.join(" ")}" style="fill:none;stroke:var(--accent);stroke-width:1.75;stroke-linejoin:round;stroke-linecap:round" vector-effect="non-scaling-stroke"/></svg>`}
function grVar(id,a,b){if(GR_PP[id]){const dd=b-a;if(Math.abs(dd)<0.005)return {dir:"estavel",t:"estável"};return {dir:dd>0?"sobe":"desce",t:(dd>0?"+":"−")+grNum(Math.abs(dd),2)+" ponto"+(Math.abs(dd)>=2?"s":"")}}
  if(!a)return {dir:"estavel",t:""};const pc=(b/a-1)*100;if(Math.abs(pc)<0.005)return {dir:"estavel",t:"estável"};return {dir:pc>0?"sobe":"desce",t:(pc>0?"+":"−")+grNum(Math.abs(pc),1)+"%"}}
function grGrande(id,d){const W=340,H=210,pl=50,pr=58,pt=18,pb=26,cw=W-pl-pr,ch=H-pt-pb;const vs=d.map(o=>o.v);const vmn=Math.min(...vs),vmx=Math.max(...vs);
  let mn=vmn,mx=vmx;if(mx-mn<1e-9){mn-=Math.abs(mn)*.05||1;mx+=Math.abs(mx)*.05||1}const pad=(mx-mn)*.14;mn-=pad;mx+=pad;
  const X=i=>pl+(d.length<2?cw:i*cw/(d.length-1)),Y=v=>pt+(mx-v)*ch/(mx-mn);const g="grg"+(++GR.n);GR.X=X;GR.Y=Y;GR.pl=pl;GR.cw=cw;GR.W=W;
  const pts=grPontos(d,X,Y,id==="selic").map(p=>p[0].toFixed(1)+","+p[1].toFixed(1));const base=(pt+ch).toFixed(1);
  const niveis=vmx-vmn<1e-9?[vmx]:[vmx,(vmx+vmn)/2,vmn];
  let h=`<svg class="gr-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico: ${esc(grFmt(id,d[0].v))} a ${esc(grFmt(id,d[d.length-1].v))}" tabindex="0"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.24"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></linearGradient></defs>`;
  niveis.forEach(v=>{const y=Y(v).toFixed(1);h+=`<line x1="${pl}" x2="${pl+cw}" y1="${y}" y2="${y}" class="gr-gl"/><text x="0" y="${(Y(v)+3.5).toFixed(1)}" class="gr-yl">${esc(grFmt(id,v,true))}</text>`});
  h+=`<line x1="${pl}" x2="${pl+cw}" y1="${base}" y2="${base}" class="gr-base"/>`;
  h+=`<path d="M${X(0).toFixed(1)},${base} L${pts.join(" L")} L${X(d.length-1).toFixed(1)},${base} Z" style="fill:url(#${g})"/><polyline points="${pts.join(" ")}" class="gr-ln"/>`;
  const L=d[d.length-1],lx=X(d.length-1),ly=Y(L.v);
  h+=`<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="5" class="gr-dot"/><text x="${(lx+9).toFixed(1)}" y="${(ly+4).toFixed(1)}" class="gr-ult">${esc(grFmt(id,L.v,true))}</text>`;
  if(d[0].r){const xs=[0,Math.round((d.length-1)/2),d.length-1];xs.forEach((i,k)=>{h+=`<text x="${X(i).toFixed(1)}" y="${H-7}" class="gr-xl" text-anchor="${k===0?"start":k===2?"end":"middle"}">${esc(grData(d[i].r))}</text>`})}
  h+=`<g class="gr-x" style="display:none"><line y1="${pt-6}" y2="${base}" class="gr-xh"/><circle r="5.5" class="gr-xd"/></g></svg>`;return h}
function grRo(i){const d=GR.d,o=d[i];if(!o)return "";const ult=i===d.length-1;return `<b>${esc(grFmt(GR.id,o.v))}</b><span>${o.r?esc(grData(o.r,true)):""}${ult?(o.r?" · ":"")+"último dado":""}</span>`}
function grLigar(){const box=document.querySelector(".gr-box");if(!box)return;const sv=box.querySelector(".gr-svg"),ro=box.querySelector(".gr-ro"),gx=box.querySelector(".gr-x");if(!sv||!gx)return;
  const ln=gx.querySelector("line"),dt=gx.querySelector("circle");let cur=-1;
  const mostra=i=>{const d=GR.d;i=Math.max(0,Math.min(d.length-1,i));if(i===cur)return;cur=i;const x=GR.X(i).toFixed(1);ln.setAttribute("x1",x);ln.setAttribute("x2",x);dt.setAttribute("cx",x);dt.setAttribute("cy",GR.Y(d[i].v).toFixed(1));gx.style.display="";ro.innerHTML=grRo(i)};
  const solta=()=>{cur=-1;gx.style.display="none";ro.innerHTML=grRo(GR.d.length-1)};
  const idx=e=>{const r=sv.getBoundingClientRect();const fx=(e.clientX-r.left)/r.width*GR.W;return Math.round((fx-GR.pl)/GR.cw*(GR.d.length-1))};
  sv.addEventListener("pointerdown",e=>mostra(idx(e)));sv.addEventListener("pointermove",e=>{if(e.pointerType==="mouse"||e.buttons||e.pressure)mostra(idx(e))});
  sv.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse")solta()});
  sv.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();mostra((cur<0?GR.d.length-1:cur)+(e.key==="ArrowLeft"?-1:1))}else if(e.key==="Escape"&&cur>=0){e.stopPropagation();solta()}});
  sv.addEventListener("blur",solta)}
function abrirGrafico(id,per){const it=indItens().filter(x=>x&&x.nome&&x.valor),x=it.find(o=>o.id===id);if(!x)return;const tudo=grDados(x);
  const diario=id==="dolar"||id==="ibovespa"||/^\d{4}-\d{2}-\d{2}$/.test((tudo[0]||{}).r||"");
  const ops=(diario?[[22,"1 mês"],[66,"3 meses"]]:[[13,"12 meses"],[25,"2 anos"]]).filter((o,k)=>k===0||tudo.length>ops0(diario)+2);
  function ops0(dd){return dd?22:13}
  const chips=ops.length>1;const full=chips?ops[ops.length-1][0]:tudo.length;per=chips?(ops.some(o=>o[0]===per)?per:full):tudo.length;
  const d=tudo.slice(-per);GR.id=id;GR.d=d;GR.per=per;
  const seta={sobe:"▲",desce:"▼",estavel:"▬"};
  let h=`<div class="gr"><div class="gr-hd"><b class="gr-v">${esc(x.valor)}</b>${x.variacao?`<em class="${esc(x.dir||"estavel")}">${seta[x.dir]||""} ${esc(x.variacao)} <small>no dia</small></em>`:""}</div>`;
  if(d.length>=3){const nome=chips?(ops.find(o=>o[0]===per)||ops[ops.length-1])[1]:(diario?d.length+" pregões":(d.length-1)+" meses");const vv=grVar(id,d[0].v,d[d.length-1].v);
    if(vv.t)h+=`<p class="gr-per-t"><em class="${vv.dir}">${seta[vv.dir]} ${esc(vv.t)}</em> em ${esc(nome)}${d[0].r?` <span>desde ${esc(grData(d[0].r,true))}</span>`:""}</p>`;
    h+=`<div class="gr-box"><div class="gr-ro" aria-live="polite">${grRo(d.length-1)}</div>${grGrande(id,d)}</div>`;
    if(chips)h+=`<div class="gr-pers" role="group" aria-label="Período">${ops.map(o=>`<button type="button" data-grper="${o[0]}" aria-pressed="${o[0]===per}">${esc(o[1])}</button>`).join("")}</div>`}
  if(GR_INFO[id])h+=`<p class="gr-info">${esc(GR_INFO[id])}</p>`;
  if(d.length>=3)h+=`<details class="gr-tab"><summary>Ver os números</summary><table><thead><tr><th>${d[0].r?(diario?"Dia":"Mês"):"Ponto"}</th><th>Valor</th></tr></thead><tbody>${d.slice(-12).reverse().map((o,k)=>`<tr><td>${o.r?esc(grData(o.r,true)):(d.length-k)}</td><td>${esc(grFmt(id,o.v))}</td></tr>`).join("")}</tbody></table></details>`;
  const outros=it.filter(o=>o.id&&o.id!==id);if(outros.length)h+=`<div class="gr-outros">${outros.map(indTile).join("")}</div>`;
  h+=`<p class="gr-fonte">Fonte: ${esc(x.fonte||"—")}${x.data?` · dado de ${esc(grData(x.data,true))}`:""}</p></div>`;
  const aberto=document.querySelector(".gr"),cx=aberto&&aberto.closest(".sh-b"),y=cx?cx.scrollTop:0;
  sheet(x.nome,h);grLigar();if(aberto&&per!==undefined){const b=document.querySelector(".gr")?.closest(".sh-b");if(b)b.scrollTop=y}uso("grafico")}

