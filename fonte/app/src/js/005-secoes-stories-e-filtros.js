/* ---------- seções (stories) e filtros ---------- */
function ringSvg(sec,flags){const n=flags.length,R=30,c=2*Math.PI*R,gap=n>1?6:0,seg=(c-gap*n)/n;let s="";for(let i=0;i<n;i++){s+=`<circle cx="33" cy="33" r="${R}" fill="none" stroke="${flags[i]?"var(--line)":secCor(sec)}" stroke-width="3.2" stroke-dasharray="${seg.toFixed(2)} ${(c-seg).toFixed(2)}" stroke-dashoffset="${(-(i*(seg+gap))).toFixed(2)}" transform="rotate(-90 33 33)"/>`}return `<svg class="ring" viewBox="0 0 66 66" aria-hidden="true">${s}</svg>`}
function secsStory(){const L=SECS().filter(s=>pautasDa(s.id).length);return L.map((s,i)=>({s,i,all:pautasDa(s.id).every(p=>SEEN.has(seenKey(p)))})).sort((a,b)=>a.all-b.all||a.i-b.i).map(x=>x.s)}
function renderSecs(){
  $("#secs").innerHTML=secsStory().map(s=>{const ps=pautasDa(s.id);if(!ps.length)return "";const flags=ps.map(p=>SEEN.has(seenKey(p)));const first=ps.find(p=>!SEEN.has(seenKey(p)))||ps[0];
    const nn=flags.filter(f=>!f).length;
    return `<button type="button" class="sb" data-sec-story="${esc(s.id)}" aria-label="${esc(s.nome)}: ${ps.length} notícias${nn?", "+nn+" não vistas":""}"><span class="wrap">${ringSvg(s.id,flags)}<span class="face paper" data-sec="${esc(s.id)}">${svgOf(first.imagem)}${faceFoto(first)}</span>${nn?`<span class="ncount" style="background:${secCor(s.id)}">${nn}</span>`:""}</span><b>${esc(s.nome)}</b></button>`}).join("");
  const fl=$("#filters");fl.hidden=true;fl.innerHTML="";const bf=$("#b-filtro");if(bf)bf.setAttribute("aria-pressed",String(FILTRO!=="tudo"));
}

