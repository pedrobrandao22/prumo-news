/* ---------- Etapa 29 ---------- */
function faAssunto(tit,A,sec){let best=null,pos=1e9,len=0;Object.values(A.assuntos||{}).forEach(x=>{if(!x||!Array.isArray(x.chaves))return;if(Array.isArray(x.secoes)&&!x.secoes.includes(sec))return;
  x.chaves.forEach(k=>{if(typeof k!=="string"||!k)return;const i=posPalavra(tit,k);if(i>=0&&(i<pos||(i===pos&&k.length>len))){pos=i;len=k.length;best=x}})});return best}
/* foto própria que não carregou: usa uma de arquivo da mesma notícia */
function fotoReserva(img){const A=FOTOS_ARQ;if(!A||!FEED)return null;const src=img.getAttribute("src")||"",nm=faNome(src);
  const p=(FEED.pautas||[]).find(q=>q.foto&&typeof q.foto.url==="string"&&(faNome(q.foto.url)===nm||fotoSrc(q.foto.url)===src));if(!p)return null;
  const L=faListas(p,A),h=hashStr(p.id),us=new Set((FEED.pautas||[]).map(q=>{const f=q!==p&&fotoDe(q);return f?faNome(f.url):""}));
  for(const l of L){for(let j=0;j<l.length;j++){const f=l[(h+j)%l.length];if(faValida(f)&&faNome(f.url)!==nm&&!us.has(faNome(f.url)))return {url:f.url,credito:f.credito||"Foto de arquivo: Wikimedia Commons",alt:f.alt||"Foto de arquivo"}}}
  for(const l of L){for(let j=0;j<l.length;j++){const f=l[(h+j)%l.length];if(faValida(f)&&faNome(f.url)!==nm)return {url:f.url,credito:f.credito||"Foto de arquivo: Wikimedia Commons",alt:f.alt||"Foto de arquivo"}}}return null}

