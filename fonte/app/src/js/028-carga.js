/* ---------- carga ---------- */
function sanear(f){if(!f||typeof f!=="object")return null;const arr=x=>Array.isArray(x)?x.filter(y=>y&&typeof y==="object"):[];
  f.pautas=arr(f.pautas).filter(p=>p.id!=null).map(p=>{p.id=String(p.id);["atualizacoes","correcoes","links","enquadramentos","visuais"].forEach(k=>p[k]=arr(p[k]));if(!Array.isArray(p.fontes))p.fontes=[];if(!p.neutro||typeof p.neutro!=="object")p.neutro={titulo:"",texto:""};if(p.enquete&&!Array.isArray(p.enquete.opcoes))p.enquete=null;if(!Array.isArray(p.titulos))delete p.titulos;else p.titulos=arr(p.titulos);if(p.faq!=null)p.faq=arr(p.faq);if(p.etapa&&(typeof p.etapa!=="object"||!Array.isArray(p.etapa.passos)))delete p.etapa;["subtema","por_que","status","tipo","e_o_brasil"].forEach(k=>{if(p[k]!=null&&typeof p[k]!=="string")delete p[k]});if(p.servicos!=null)p.servicos=arr(p.servicos);if(p.essencial!=null&&!Array.isArray(p.essencial))delete p.essencial;return p});
  if(f.calendario!=null)f.calendario=arr(f.calendario);
  if(Array.isArray(f.secoes)){const OS=["politica","economia","brasil","mundo","esportes","educacao"];f.secoes=f.secoes.filter(x=>x&&x.id).sort((a,b)=>{const i=OS.indexOf(a.id),j=OS.indexOf(b.id);return (i<0?99:i)-(j<0?99:j)})}
  if(f.indicadores&&typeof f.indicadores==="object"&&!Array.isArray(f.indicadores))f.indicadores.itens=arr(f.indicadores.itens).map(x=>{if(!Array.isArray(x.serie))delete x.serie;return x});else delete f.indicadores;
  if(f.mudancas&&typeof f.mudancas==="object"&&!Array.isArray(f.mudancas))f.mudancas.itens=arr(f.mudancas.itens);else delete f.mudancas;
  if(f.capa&&(typeof f.capa!=="object"||Array.isArray(f.capa)))delete f.capa;else if(f.capa&&!Array.isArray(f.capa.destaques))f.capa.destaques=[];
  if(f.taxonomia&&typeof f.taxonomia==="object")for(const k in f.taxonomia){if(!Array.isArray(f.taxonomia[k]))delete f.taxonomia[k]}
  if(f.esportes!=null&&(typeof f.esportes!=="object"||Array.isArray(f.esportes)))delete f.esportes;else if(f.esportes){f.esportes.competicoes=arr(f.esportes.competicoes).map(c=>{c.tabela=arr(c.tabela);c.chave=arr(c.chave).map(x=>{x.confrontos=arr(x.confrontos);return x});return c});f.esportes.jogos=arr(f.esportes.jogos)}
  if(!Array.isArray(f.dormentes))f.dormentes=[];else f.dormentes=arr(f.dormentes).filter(d=>d.id&&d.titulo).map(d=>{d.id=String(d.id);if(d.titulos!=null)d.titulos=arr(d.titulos);return d});
  ["agenda","breves","quiz","pesquisas_2t"].forEach(k=>f[k]=arr(f[k]));if(!Array.isArray(f.secoes))f.secoes=[];return f}
function abreNaCapa(){try{return !navigator.webdriver||localStorage.getItem("prumo-teste-capa")==="1"}catch(e){return !navigator.webdriver}}
function renderFeedInicial(){if(abreNaCapa()){window.__feedAdiado=true;return}renderFeed()}
function prepararFeed(f){f=sanear(f)||f;FEED=f;document.body.classList.remove("semfeed");calcularNovidades();renderFeed();setTimeout(registrarConhecidas,4000);subEdicao();carregarRodadas()}
async function loadFeed(){
  aplicarFonte();
  const cached=lsGet("radar-feed",null);
  if(!cached)document.body.classList.add("semfeed");
  if(cached&&sanear(cached)){FEED=cached;document.body.classList.remove("semfeed");calcularNovidades();renderFeedInicial()}
  try{const r=await fetch("feed.json",{cache:"no-cache"});if(!r.ok)throw 0;const f=await r.json();
    const eraOff=OFFLINE;OFFLINE=false;
    if(!cached||JSON.stringify(f)!==JSON.stringify(cached))prepararFeed(f);else if(eraOff)renderPosts();else setTimeout(registrarConhecidas,4000);lsSet("radar-feed",f)}
  catch(e){OFFLINE=true;if(!cached)$("#posts").innerHTML=`<div class="empty"><b>Não consegui carregar as notícias</b>Verifique a conexão. O Prumo tenta de novo sozinho quando você voltar ao app.<button type="button" class="btn" data-retry style="margin-top:12px">Tentar de novo</button></div>`;else renderPosts()}
}
