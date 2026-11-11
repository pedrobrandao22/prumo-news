/* Melhoria contínua 11/11/2026 (144): gráfico de linha (graficoNoticia, inclusive o do acervo) —
   o rótulo do último valor fica acima e à esquerda do ponto final; quando a linha desce até esse ponto, ela atravessava o número.
   Agora, se a linha passa pelo rótulo, ele vai para baixo do ponto (se couber acima dos rótulos do eixo); senão, sobe até sair da linha; fica a posição que a linha (e a base) menos cruza. */
function mc1111Pts(s){return String(s||"").trim().split(/\s+/).map(q=>q.split(",").map(Number)).filter(q=>q.length===2&&isFinite(q[0])&&isFinite(q[1]))}
/* quantas amostras da linha caem dentro da caixa [x0,x1]×[y0,y1] */
function mc1111Toques(pts,x0,x1,y0,y1){let n=0;for(let i=0;i<pts.length-1;i++){const [a,b]=pts[i],[c,d]=pts[i+1];if(Math.max(a,c)<x0-1||Math.min(a,c)>x1+1)continue;
  for(let s=0;s<=24;s++){const x=a+(c-a)*s/24,y=b+(d-b)*s/24;if(x>=x0-1&&x<=x1+1&&y>=y0-1&&y<=y1+1)n++}}return n}
function mc1111Ajusta(html){if(typeof html!=="string"||html.indexOf("gr-ln")<0||html.indexOf("gn-v")<0)return html;
  try{const tp=document.createElement("template");tp.innerHTML=html;let mudou=false;
    tp.content.querySelectorAll("svg").forEach(svg=>{const pl=svg.querySelector("polyline.gr-ln");if(!pl)return;const pts=mc1111Pts(pl.getAttribute("points"));if(pts.length<2)return;
      const [xn,yn]=pts[pts.length-1];const t=[...svg.querySelectorAll("text.gn-v")].find(e=>e.getAttribute("text-anchor")==="end"&&Math.abs(Number(e.getAttribute("x"))-xn)<.6);if(!t)return;
      const vb=(svg.getAttribute("viewBox")||"").split(/\s+/).map(Number),H=vb[3]||170,w=Math.max(8,(t.textContent||"").length*6.6),dy=Number(t.getAttribute("dy"))||0;
      const caixa=ly=>mc1111Toques(pts,xn-w,xn,ly+dy-11,ly+dy+3);
      const bases=[...svg.querySelectorAll("line.gr-base")].map(l=>Number(l.getAttribute("y1"))).filter(isFinite);
      const outros=[...svg.querySelectorAll("text.gn-v")].filter(e=>e!==t).map(e=>{const x=Number(e.getAttribute("x")),y=Number(e.getAttribute("y"))+(Number(e.getAttribute("dy"))||0),ww=(e.textContent||"").length*6.6,a=e.getAttribute("text-anchor");
        const x0=a==="end"?x-ww:a==="middle"?x-ww/2:x;return [x0,x0+ww,y-11,y+3]});
      const nota=ly=>{const y0=ly+dy-11,y1=ly+dy+3;if(y0<2||ly+dy>H-17)return Infinity;
        return caixa(ly)+(bases.some(b=>b>=y0&&b<=y1)?6:0)+(outros.some(o=>o[0]<xn&&o[1]>xn-w&&o[2]<y1&&o[3]>y0)?50:0)};
      const cima=yn-9,tc=caixa(cima);if(!tc)return;
      let topo=yn;pts.forEach(([x,y],i)=>{if(x>=xn-w-1)topo=Math.min(topo,y);const q=pts[i+1];if(q&&q[0]>=xn-w-1&&x<xn-w-1)topo=Math.min(topo,y+(q[1]-y)*(xn-w-1-x)/(q[0]-x))});
      const cands=[[yn+19,"baixo"],[topo-5,"acima"]];let melhor=null,mn=tc;
      cands.forEach(([ly,nm])=>{const n=nota(ly);if(n<mn){mn=n;melhor=[ly,nm]}});
      if(melhor){t.setAttribute("y",melhor[0].toFixed(1));t.setAttribute("data-mc1111",melhor[1]);mudou=true}});
    return mudou?tp.innerHTML:html}catch(e){return html}}
const _mc1111GraficoNoticia=graficoNoticia;
graficoNoticia=function(v){return mc1111Ajusta(_mc1111GraficoNoticia.apply(this,arguments))};
/* o gráfico do acervo também é redesenhado sem passar por graficoNoticia (série que chega depois, editor de coluna) */
if(typeof acvLinha==="function"){const _mc1111AcvLinha=acvLinha;acvLinha=function(){return mc1111Ajusta(_mc1111AcvLinha.apply(this,arguments))}}

/* Linha do tempo: em novembro/dezembro, "23/02" sem ano era lido como fevereiro do ano que vem (próximo passo, tracejado),
   mesmo quando os itens seguintes da lista já aconteceram (ex.: 2019 → 23/02 → 09/2026 → 27/10). A linha do tempo vem em ordem:
   se algum item depois dele já passou, o "dd/mm" é deste ano. */
function mc1111Tempo(p){const vs=Array.isArray(p&&p.visuais)?p.visuais:[];const k=vs.findIndex(v=>v&&v.tipo==="linha_do_tempo"&&Array.isArray(v.itens));if(k<0||typeof rc116Data!=="function")return p;
  const hj=hojeSP(),hm=+hj.slice(5,7),ano=hj.slice(0,4);if(hm<11)return p;const its=vs[k].itens;let mudou=false;
  const novos=its.map((it,i)=>{const q=it&&typeof it.quando==="string"?it.quando:"";const m=q.match(/^\s*(\d{1,2})º?\/(\d{1,2})\s*$/);if(!m||+m[2]>2)return it;
    const d=rc116Data(q,hj);if(!d||d.iso<=hj)return it;
    const depois=its.slice(i+1).some(o=>{const x=o&&typeof o.quando==="string"?rc116Data(o.quando,hj):null;return x&&x.iso<=hj});if(!depois)return it;
    mudou=true;return Object.assign({},it,{quando:`${m[1]}/${m[2]}/${ano}`})});
  if(!mudou)return p;const nv=vs.slice();nv[k]=Object.assign({},vs[k],{itens:novos});return Object.assign({},p,{visuais:nv})}
{const _mc1111MatTempo=matTempo;matTempo=function(p){try{p=mc1111Tempo(p)}catch(e){}return _mc1111MatTempo.call(this,p)}}
