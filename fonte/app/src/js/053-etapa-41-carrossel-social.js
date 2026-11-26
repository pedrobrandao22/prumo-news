/* ---------- Etapa 41: carrossel social ---------- */
/* 19/11: forma longa antes da curta e fim de palavra ("R$ 350 milhões" virava "R$ 350 mil" + "hões") */
var SS_NUM=/(R\$\s?\d[\d.,]*(?:\s?(?:milhões|milhão|mil|mi|bilhões|bilhão|bi|trilhões|trilhão|tri)(?![A-Za-zÀ-ÿ]))?|US\$\s?\d[\d.,]*(?:\s?(?:milhões|milhão|mil|mi|bilhões|bilhão|bi|trilhões|trilhão|tri)(?![A-Za-zÀ-ÿ]))?|\d[\d.,]*\s?%|\d{1,3}(?:\.\d{3})+(?:,\d+)?(?:\s?(?:pontos|votos|mil))?|\d[\d,]*\s?(?:mil|milhões|bilhões|votos|pontos|anos|dias|vezes|cadeiras|mortos|feridos|deputados|senadores)\b)/i;
function ssNumero(t){const m=SS_NUM.exec(t||"");if(!m||m.index>70)return null;const resto=String(t).slice(m.index+m[0].length);
  /* faixa ou número composto ("30% a 34%", "17 anos, 1 mês", "1.700 a 2.000"): não separa, senão o destaque engana */
  if(/^\s*(?:[,–—-]|(?:a|até|e|ou)\s+(?:R\$\s?|US\$\s?)?\d)/i.test(resto))return null;return m[1].trim().replace(/[.,;:]+$/,"")}
function ssFrasesSociais(p,L){const so=L==="neutro"&&Array.isArray(p.social)?p.social.map(x=>typeof x==="string"?x:(x&&x.texto)||"").filter(x=>x.trim()&&!(p.proximo&&/^\s*e agora\b/i.test(x))):[];  /* 20/11: "E agora?" já vem no cartão do proximo */
  return (so.length>=2?so:pontosDe(p,L)).slice(0,5)}
function ssPessoa(p,usadas){const A=FOTOS_ARQ;if(!A)return null;const n=p.neutro||{};/* só quem está no TÍTULO (14/11: Trump aparecia na notícia dos voos por estar no 1º ponto) */const t=String(versao(p,lente()).titulo||n.titulo||"");
  const a=faPessoa(ft187SemGoverno(t),A);/* 19/11: "Governo Trump" não é a pessoa do fato */if(!a||!Array.isArray(a.fotos))return null;const nome=Object.keys(A.pessoas||{}).find(k=>A.pessoas[k]===a)||"";
  const f=a.fotos.filter(faValida).find(x=>!usadas.has(faNome(x.url)));if(!f||!nome)return null;usadas.add(faNome(f.url));
  return {nome,desc:(FEED.pessoas||{})[nome]||"",f}}
function ssFotoAssunto(p,usadas){const A=FOTOS_ARQ;if(!A)return null;try{for(const l of faListas(p,A))for(const f of l)if(faValida(f)&&!usadas.has(faNome(f.url))){usadas.add(faNome(f.url));return f}}catch(e){}return null}
/* ===== 26/11 (Pedro): carrossel sob medida =====
   Antes: um molde só, com um quadro por frase ("O essencial", depois vários "E mais" de uma linha), 7,7 quadros por notícia em
   média e até 11; e um quadro "Quem é" para gente que todo mundo conhece, que perguntava e não respondia.
   Agora o carrossel se monta pelo que a notícia TEM e pelo tamanho dela (ssPeso):
   - curta  (notícia pontual, sem peso): foto · o essencial · fecho;
   - média  (tem contexto, texto longo, cobertura com várias atualizações ou mais de um visual): + contexto e até 2 visuais;
   - grande (manchete, destaque da Capa ou prioridade alta com conteúdo): + o que mudou, todos os visuais, perguntas e
             respostas e uma segunda foto.
   Regras fixas: nenhum quadro com uma frase solta (os 3 pontos vão juntos); nada de "E mais"; cada quadro tem um nome que
   diz o que traz; o fecho junta "E agora?" e o botão da matéria; "Quem é" só de quem é o assunto, não é nome conhecido
   (retratos curados) e tem descrição de verdade, e vira uma linha dentro de "O essencial", já com a resposta. */
function ssPeso(p){try{let s=0;const n=p.neutro||{},C=(typeof FEED!=="undefined"&&FEED&&FEED.capa)||{};
  if((p.prioridade||0)>=70||C.manchete===p.id||(Array.isArray(C.destaques)&&C.destaques.indexOf(p.id)>=0))s+=2;
  if(p.tipo==="cobertura"&&(p.atualizacoes||[]).length>=3)s++;
  if(String(n.texto||"").length>=600)s++;
  if(String(p.contexto||"").length>=200)s++;
  if((p.visuais||[]).length>=2)s++;
  return s>=3?"grande":s>=1?"media":"curta"}catch(e){return "media"}}
/* corta o texto no fim de uma frase, até n letras */
function ssCorta(t,n){t=String(t||"").replace(/\s+/g," ").trim();if(t.length<=n)return t;const fr=t.match(/[^.!?]+[.!?]+(?=\s|$)/g)||[];let o="";
  for(const f of fr){if((o+f).length>n)break;o+=f}o=o.trim();return o.length>=60?o:t.slice(0,n-1).replace(/\s+\S*$/,"")+"…"}
/* "Quem é": só quem está no título, não é nome conhecido e tem descrição de verdade */
function ssQuem(p){try{const A=FOTOS_ARQ;if(!A)return null;const t=String(versao(p,lente()).titulo||(p.neutro||{}).titulo||"");
  const a=faPessoa(ft187SemGoverno(t),A);if(!a||a.grupo==="curado")return null;const nome=Object.keys(A.pessoas||{}).find(k=>A.pessoas[k]===a)||"";
  const d=String((FEED.pessoas||{})[nome]||"").trim();if(!nome||d.length<25)return null;return {nome,desc:d}}catch(e){return null}}
function ssPontoHTML(t){const num=ssNumero(t);let h=marcarTermos(t);
  if(num){const e=esc(num),i=h.indexOf(e);if(i>=0)h=h.slice(0,i)+`<b class="ss-nn">${e}</b>`+h.slice(i+e.length)}return h}
function slidesSociais(p){try{
  const L=lente(),v=versao(p,L),sec=secOf(p),cor=secCor(sec),out=[],usadas=new Set(),peso=ssPeso(p);
  const base=slides(p);const capa=base[0]&&/class="cover/.test(base[0])?base[0]:null;
  const fc=fotoDe(p);if(fc)usadas.add(faNome(fc.url));
  if(capa)out.push(capa);else out.push(`<div class="sl ss ss-abre" style="--c:${cor}"><span class="ss-k">${esc(capaChapeu(p))}</span><h3 class="ss-h">${esc(v.titulo)}</h3></div>`);
  /* 1. o essencial: os pontos juntos, num quadro só */
  let pts=pontosDe(p,L).filter(x=>String(x||"").trim()).slice(0,3);if(pts.length<2)pts=ssFrasesSociais(p,L).slice(0,3);
  const quem=ssQuem(p);
  if(pts.length)out.push(`<div class="sl ss ss-fato ss-pts" style="--c:${cor}"><span class="ss-k">O essencial</span><ul class="ss-ul">${pts.map(t=>`<li>${ssPontoHTML(t)}</li>`).join("")}</ul>${quem?`<p class="ss-quem"><b>Quem é ${esc(quem.nome)}:</b> ${esc(quem.desc)}</p>`:""}</div>`);
  /* 2. contexto (média e grande); na grande, com a segunda foto quando o texto é curto o bastante para ir sobre ela */
  const ctx=peso!=="curta"&&String(p.contexto||"").length>=120?ssCorta(p.contexto,380):"";
  if(ctx){const fa=peso==="grande"&&ctx.length<=210?ssFotoAssunto(p,usadas):null;
    out.push(fa?`<div class="sl ss ss-prox com-foto ss-ctx" style="--c:${cor}"><img src="${escU(fotoSrc(fa.url))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.sl').classList.remove('com-foto');this.remove()"><div class="ss-pb"><span class="ss-k">Contexto</span><p class="ss-t ss-tm">${marcarTermos(ctx)}</p></div></div>`
      :`<div class="sl ss ss-fato ss-ctx" style="--c:${cor}"><span class="ss-k">Contexto</span><p class="ss-p">${marcarTermos(ctx)}</p></div>`)}
  /* 3. o que mudou (grande, cobertura com 2+ atualizações): as 3 mais recentes */
  const at=(p.atualizacoes||[]).filter(u=>u&&u.texto);
  if(peso==="grande"&&at.length>=2)out.push(`<div class="sl ss ss-fato ss-atu" style="--c:${cor}"><span class="ss-k">O que mudou</span><ul class="ss-ul">${at.slice(-3).reverse().map(u=>{let q="";try{q=quando(u.hora)}catch(e){}return `<li>${q?`<em>${esc(q)}</em>`:""}${marcarTermos(ssCorta(u.texto,150))}</li>`}).join("")}</ul></div>`);
  /* 4. visuais: gráfico, números, como cada lado conta, linha do tempo — 1 na curta, 2 na média, todos na grande */
  const vis=(p.visuais||[]).map(x=>({...x,secao:sec}));const vs=[];
  const gr=vis.filter(x=>x.tipo==="grafico"&&visualHTML(x)),nu=vis.find(x=>x.tipo==="numeros"&&visualHTML(x)),tl=vis.find(x=>x.tipo==="linha_do_tempo"&&visualHTML(x));
  gr.slice(0,peso==="grande"?2:1).forEach(x=>vs.push(`<div class="sl txs ss-vis">${visualHTML(x)}</div>`));
  if(nu)vs.push(`<div class="sl txs ss-vis">${visualHTML(nu)}</div>`);
  if(p.direita&&p.esquerda&&p.direita.titulo&&p.esquerda.titulo)vs.push(`<div class="sl ss ss-lados"><span class="ss-k">Como cada lado conta</span><div class="ss-lado r"><em>Direita</em><b>${esc(p.direita.titulo)}</b></div><div class="ss-lado l"><em>Esquerda</em><b>${esc(p.esquerda.titulo)}</b></div></div>`);
  if(tl)vs.push(`<div class="sl txs ss-vis">${visualHTML({...tl,itens:(tl.itens||[]).slice(-4)})}</div>`);
  vs.slice(0,peso==="grande"?5:peso==="media"?2:1).forEach(h=>out.push(h));
  /* 5. perguntas e respostas (grande) */
  const fq=(Array.isArray(p.faq)?p.faq:[]).filter(x=>x&&x.p&&x.r);
  if(peso==="grande"&&fq.length)out.push(`<div class="sl ss ss-fato ss-faq" style="--c:${cor}"><span class="ss-k">Perguntas e respostas</span><dl class="ss-dl">${fq.slice(0,2).map(x=>`<dt>${esc(x.p)}</dt><dd>${marcarTermos(ssCorta(x.r,170))}</dd>`).join("")}</dl></div>`);
  if(p.enquete&&(p.enquete.opcoes||[]).length)out.push(`<div class="sl ss ss-enq"><div class="pollbox" data-poll></div></div>`);
  /* 6. fecho: o que vem agora (ou por que importa) junto do botão da matéria */
  const prox=p.proximo||p.por_que;
  out.push(`<div class="sl ss ss-fim" style="--c:${cor}"><span class="ss-k">${p.proximo?"E agora?":p.por_que?"Por que importa":"Quer o quadro completo?"}</span><p class="ss-ft">${prox?marcarTermos(ssCorta(prox,260)):esc(capaSub(p,L,"")||v.titulo)}</p><button type="button" class="ss-cta" data-capmat="${esc(p.id)}">Ler a matéria completa <i aria-hidden="true">›</i></button><span class="ss-f">${esc(coberturaTxt(p))}</span></div>`);
  return out}catch(e){return p.tipo==="pontual"?cobPontualSlides(p):slides(p)}}
/* páginas desenhadas: se a letra não couber, diminui um pouco (sem quebrar a página) */
function ssCaber(t){t.querySelectorAll(".ss").forEach(sl=>{let k=1;sl.style.setProperty("--ssk","1");for(let n=0;n<8&&sl.scrollHeight>sl.clientHeight+1;n++){k-=.07;sl.style.setProperty("--ssk",k.toFixed(2))}})}

