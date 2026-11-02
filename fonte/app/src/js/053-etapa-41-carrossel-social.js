/* ---------- Etapa 41: carrossel social ---------- */
var SS_NUM=/(R\$\s?\d[\d.,]*(?:\s?(?:mil|mi|milhão|milhões|bi|bilhão|bilhões|tri))?|US\$\s?\d[\d.,]*(?:\s?(?:mil|mi|bi|milhões|bilhões))?|\d[\d.,]*\s?%|\d{1,3}(?:\.\d{3})+(?:,\d+)?(?:\s?(?:pontos|votos|mil))?|\d[\d,]*\s?(?:mil|milhões|bilhões|votos|pontos|anos|dias|vezes|cadeiras|mortos|feridos|deputados|senadores)\b)/i;
function ssNumero(t){const m=SS_NUM.exec(t||"");if(!m||m.index>70)return null;const resto=String(t).slice(m.index+m[0].length);
  /* faixa ou número composto ("30% a 34%", "17 anos, 1 mês", "1.700 a 2.000"): não separa, senão o destaque engana */
  if(/^\s*(?:[,–—-]|(?:a|até|e|ou)\s+(?:R\$\s?|US\$\s?)?\d)/i.test(resto))return null;return m[1].trim().replace(/[.,;:]+$/,"")}
function ssFrasesSociais(p,L){const so=L==="neutro"&&Array.isArray(p.social)?p.social.map(x=>typeof x==="string"?x:(x&&x.texto)||"").filter(x=>x.trim()):[];
  return (so.length>=2?so:pontosDe(p,L)).slice(0,5)}
function ssPessoa(p,usadas){const A=FOTOS_ARQ;if(!A)return null;const n=p.neutro||{},t=[n.titulo,p.subtitulo,(n.pontos||[])[0]].join(" ");
  const a=faPessoa(t,A);if(!a||!Array.isArray(a.fotos))return null;const nome=Object.keys(A.pessoas||{}).find(k=>A.pessoas[k]===a)||"";
  const f=a.fotos.filter(faValida).find(x=>!usadas.has(faNome(x.url)));if(!f||!nome)return null;usadas.add(faNome(f.url));
  return {nome,desc:(FEED.pessoas||{})[nome]||"",f}}
function ssFotoAssunto(p,usadas){const A=FOTOS_ARQ;if(!A)return null;try{for(const l of faListas(p,A))for(const f of l)if(faValida(f)&&!usadas.has(faNome(f.url))){usadas.add(faNome(f.url));return f}}catch(e){}return null}
function slidesSociais(p){try{
  const L=lente(),v=versao(p,L),sec=secOf(p),cor=secCor(sec),out=[],usadas=new Set();
  const base=slides(p);const capa=base[0]&&/class="cover/.test(base[0])?base[0]:null;
  const fc=fotoDe(p);if(fc)usadas.add(faNome(fc.url));
  if(capa)out.push(capa);else out.push(`<div class="sl ss ss-abre" style="--c:${cor}"><span class="ss-k">${esc(capaChapeu(p))}</span><h3 class="ss-h">${esc(v.titulo)}</h3></div>`);
  const fr=ssFrasesSociais(p,L);
  const pessoa=ssPessoa(p,usadas);
  fr.forEach((t0,i)=>{const num=ssNumero(t0);let t=t0;
    if(num&&t0.indexOf(num)===0){let r=t0.slice(num.length).replace(/^\s+/,"");if(r[0]===":"){r=r.slice(1).trim();r=r.charAt(0).toUpperCase()+r.slice(1)}if(r.length>8)t=r}
    out.push(`<div class="sl ss ss-fato${num?" com-n":""}" style="--c:${cor}"><span class="ss-k">${i===0?"O essencial":"E mais"}</span>${num?`<b class="ss-n">${esc(num)}</b>`:""}<p class="ss-t">${marcarTermos(t)}</p><span class="ss-i">${i+1}/${fr.length}</span></div>`);
    if(i===0&&pessoa)out.push(`<div class="sl ss ss-foto"><img src="${escU(fotoSrc(pessoa.f.url))}" alt="${esc(pessoa.nome)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.sl').classList.add('sem-foto')"><div class="ss-fl"><span class="ss-k">Quem é</span><b>${esc(pessoa.nome)}</b>${pessoa.desc?`<p>${esc(pessoa.desc)}</p>`:""}</div>${credHTML(pessoa.f.credito||"Foto de arquivo: Wikimedia Commons","fcv-c")}</div>`)});
  const vis=(p.visuais||[]).map(x=>({...x,secao:sec}));
  const gr=vis.find(x=>x.tipo==="grafico"&&visualHTML(x)),tl=vis.find(x=>x.tipo==="linha_do_tempo"&&visualHTML(x)),nu=vis.find(x=>x.tipo==="numeros"&&visualHTML(x));
  [gr,nu].filter(Boolean).forEach(x=>out.push(`<div class="sl txs ss-vis">${visualHTML(x)}</div>`));
  if(p.direita&&p.esquerda&&p.direita.titulo&&p.esquerda.titulo)out.push(`<div class="sl ss ss-lados"><span class="ss-k">Como cada lado conta</span><div class="ss-lado r"><em>Direita</em><b>${esc(p.direita.titulo)}</b></div><div class="ss-lado l"><em>Esquerda</em><b>${esc(p.esquerda.titulo)}</b></div></div>`);
  if(tl)out.push(`<div class="sl txs ss-vis">${visualHTML({...tl,itens:(tl.itens||[]).slice(-5)})}</div>`);
  const prox=p.proximo||p.por_que;if(prox){const fa=ssFotoAssunto(p,usadas);
    out.push(`<div class="sl ss ss-prox${fa?" com-foto":""}" style="--c:${cor}">${fa?`<img src="${escU(fotoSrc(fa.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.sl').classList.remove('com-foto');this.remove()">`:""}<div class="ss-pb"><span class="ss-k">${p.proximo?"E agora?":"Por que importa"}</span><p class="ss-t">${marcarTermos(prox)}</p></div></div>`)}
  if(p.enquete&&(p.enquete.opcoes||[]).length)out.push(`<div class="sl ss ss-enq"><div class="pollbox" data-poll></div></div>`);
  out.push(`<div class="sl ss ss-fim" style="--c:${cor}"><span class="ss-k">Quer o quadro completo?</span><p class="ss-t">${esc(capaSub(p,L,"")||v.titulo)}</p><button type="button" class="ss-cta" data-capmat="${esc(p.id)}">Ler a matéria completa <i aria-hidden="true">›</i></button><span class="ss-f">${esc(coberturaTxt(p))}</span></div>`);
  return out.slice(0,10)}catch(e){return p.tipo==="pontual"?cobPontualSlides(p):slides(p)}}
/* páginas desenhadas: se a letra não couber, diminui um pouco (sem quebrar a página) */
function ssCaber(t){t.querySelectorAll(".ss").forEach(sl=>{let k=1;sl.style.setProperty("--ssk","1");for(let n=0;n<8&&sl.scrollHeight>sl.clientHeight+1;n++){k-=.07;sl.style.setProperty("--ssk",k.toFixed(2))}})}
{const _ft41=fitTrack;fitTrack=function(t){const r=_ft41.apply(this,arguments);if(t&&t.closest&&t.closest(".post")){const go=()=>ssCaber(t);if(document.fonts&&document.fonts.status!=="loaded")document.fonts.ready.then(go);else go()}return r}}

