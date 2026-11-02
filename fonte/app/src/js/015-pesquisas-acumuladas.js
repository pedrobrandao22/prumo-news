/* ---------- pesquisas acumuladas ---------- */
function graficoPesquisas(){
  const ps=(FEED.pesquisas_2t||[]).filter(x=>x&&x.data&&!isNaN(+x.flavio)&&!isNaN(+x.lula));if(!ps.length)return "";
  const datas=[...new Set(ps.map(x=>x.data))].sort();const W=360,H=200,x0=34,x1=W-12,y0=H-26,y1=14,mn=40,mx=60;
  const X=d=>datas.length===1?(x0+x1)/2:x0+(x1-x0)*datas.indexOf(d)/(datas.length-1);const Y=v=>y0-(y0-y1)*(v-mn)/(mx-mn);
  const inst=[...new Set(ps.map(x=>x.instituto))];
  let s="";[40,45,50,55,60].forEach(v=>{s+=`<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v===50?"#8a939c":"#e2e5e2"}" stroke-width="1" ${v===50?'stroke-dasharray="4 3"':""}/><text x="${x0-6}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="#59606a" font-family="var(--f-mono)">${v}%</text>`});
  datas.forEach(d=>{const [y,m,dd]=String(d).split("-");s+=`<text x="${X(d)}" y="${H-8}" font-size="10" text-anchor="middle" fill="#59606a" font-family="var(--f-mono)">${esc(dd)}/${esc(m)}</text>`});
  const media=(cand)=>datas.map(d=>{const v=ps.filter(x=>x.data===d).map(x=>+x[cand]).filter(n=>!isNaN(n));return v.length?[d,v.reduce((a,b)=>a+b,0)/v.length]:null}).filter(Boolean);
  [["flavio","var(--right)"],["lula","var(--left)"]].forEach(([c,col])=>{
    ps.forEach(x=>{s+=`<circle cx="${X(x.data)+(inst.indexOf(x.instituto)-(inst.length-1)/2)*5}" cy="${Y(+x[c])}" r="3.2" fill="${col}" opacity=".35"/>`});
    const m=media(c);if(m.length>1)s+=`<path d="M${m.map(([d,v])=>X(d).toFixed(1)+" "+Y(v).toFixed(1)).join(" L")}" fill="none" stroke="${col}" stroke-width="2.5"/>`;
    const l=m[m.length-1];if(l)s+=`<circle cx="${X(l[0])}" cy="${Y(l[1])}" r="5" fill="${col}"/><text x="${Math.min(X(l[0])+8,x1-30)}" y="${Y(l[1])+(c==="flavio"?-8:14)}" font-size="11" font-weight="700" fill="${col}" font-family="var(--f-mono)">${l[1].toFixed(1).replace(".",",")}</text>`;
  });
  const ult=datas[datas.length-1];
  return `<span class="lbl">Pesquisas do 2º turno · votos válidos</span><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Média das pesquisas de 2º turno por dia" style="width:100%;height:auto;display:block">${s}</svg><div class="spec"><div class="lg"><span><i style="background:var(--right)"></i>Flávio</span><span><i style="background:var(--left)"></i>Lula</span><span>Pontos claros: cada instituto · linha: média do dia</span></div></div><ul class="enq">${ps.filter(x=>x.data===ult).map(x=>`<li><b>${esc(x.instituto)}</b>Flávio ${esc(String(x.flavio).replace(".",","))}% × Lula ${esc(String(x.lula).replace(".",","))}%</li>`).join("")}</ul><p class="hint">O Prumo guarda cada pesquisa nova e refaz o gráfico a cada rodada.</p>`;
}

