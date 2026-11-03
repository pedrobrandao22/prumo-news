// Fase 2 do visual novo (113), atrás da chave VN_FASE2 (?fase2=1 / localStorage "prumo-fase2"), só com o visual novo ligado.
// 1. Fio (2 a 5 partes, estilo.fio, sem SQL): criar, ler no Feed (fechado e aberto), camada com o fio inteiro, hashtag em outra parte, editar.
// 2. Capítulos na matéria: só as seções que existem, tocar rola até a seção, o capítulo atual fica marcado.
// 3. Prateleiras no Feed: a cada ~6 itens, no máximo 3, 4 a 6 notícias cada, sem repetir a lista principal.
// 4. Contexto do Prumo sob o post de um amigo: só o texto neutro, nunca quando o post já mostra o cartão da notícia.
// Desligada (padrão), nada disso aparece. Portas 8960–8969. Capturas 390x844 em qa/fase2/.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const fs = require('fs'), path = require('path');
const PORTA = 8961, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'fase2'); fs.mkdirSync(QA, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function flags(P) { await P.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim', 'visual']) localStorage.setItem('prumo-teste-' + k, '1'); if (localStorage.getItem('prumo-visual') === null) localStorage.setItem('prumo-visual', 'novo') } catch (e) { } }) }
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1000); await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300) }
async function convite(A) { await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const ins = (P, rows) => ev(P, async rows => { const ids = []; for (const r of rows) { const q = await SB.from('publicacoes').insert({ autor: S.uid, ...r }).select('id'); ids.push(q.data && q.data[0] && q.data[0].id) } await pubCarregar(); return ids }, rows);
const feed = (P, tudo) => ev(P, async tudo => { if (document.querySelector('#layer').innerHTML) closeLayer(); await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); if (tudo) for (let i = 0; i < 8; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) }, !!tudo);
const recarrega = async (P, url) => { if (url) await P.goto(url); else await P.reload(); await esperar(P, () => typeof S !== 'undefined' && S.membro && PUB.on === true, null, 12000); await sleep(1200); await ev(P, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }) };
const marcas = P => ev(P, () => ({ on: typeof VN_FASE2 !== 'undefined' && VN_FASE2, cls: document.documentElement.classList.contains('fs2'), sh: document.querySelectorAll('#posts .fs2-sh').length, fio: document.querySelectorAll('.fs2-fio').length, ctx: document.querySelectorAll('.fs2-ctx').length }));
const semRolagem = P => ev(P, () => { const s = document.scrollingElement; const m = document.querySelector('#layer .mat'); return { pg: s.scrollWidth - innerWidth, mat: m ? m.scrollWidth - m.clientWidth : 0 } });
async function foto(P, nome) { await sleep(300); await P.screenshot({ path: path.join(QA, nome + '.png') }) }
(async () => {
  // feed do dia (com pontos neutros, linha fina e perguntas), com a hora de agora
  const f = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')); const d = new Date(Date.now() - 12 * 60000);
  const sp = new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00'; f.atualizado_em = sp; if (f.edicao) f.edicao = f.edicao.replace(/\d{2}h\d{2}/, sp.slice(11, 13) + 'h' + sp.slice(14, 16));
  fs.writeFileSync(path.join(__dirname, '..', 'site', 'feed.json'), JSON.stringify(f));
  const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  for (const P of [A, B]) await flags(P);
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' });
  for (const P of [A, B]) { await ev(P, () => go('feed')); await esperar(P, () => PUB.on === true, null, 8000) }
  const uidA = await ev(A, () => S.uid);

  // escolhe as pautas: uma para a hashtag (com pontos neutros), outra para o anexo
  const pk = await ev(A, () => { const ps = FEED.pautas.filter(p => htDaPauta(p).length && (p.neutro.pontos || []).length); const p1 = ps[0], p2 = ps.find(p => p !== p1) || FEED.pautas[1];
    return { ht: p1.id, tag: htDaPauta(p1)[0], ponto: p1.neutro.pontos[0], dir: p1.direita && p1.direita.texto || '', esq: p1.esquerda && p1.esquerda.texto || '', anexo: p2.id } });
  const now = Date.now();
  const [pHt, pAnexo, pEnq] = await ins(B, [
    { tipo: 'post', at: now - 20 * 60e3, texto: `Vale acompanhar ${pk.tag} esta semana.`, fotos: [], estilo: { v: 2 } },
    { tipo: 'post', at: now - 19 * 60e3, texto: 'Olha esta.', fotos: [], pid: pk.anexo, estilo: { v: 2 } },
    { tipo: 'post', at: now - 18 * 60e3, texto: 'O que vocês acham?', fotos: [], pid: pk.anexo, estilo: { v: 2, cn: { v: 1, k: 'enq', tit: 'Passa no Senado?', o: ['Sim', 'Não'] } } }]);
  const [pFioBia] = await ins(B, [{ tipo: 'post', at: now - 15 * 60e3, texto: 'Três pontos sobre os juros.', fotos: [], estilo: { v: 2, fio: ['Segundo: o crédito encarece.', 'Terceiro: #Copom decide amanhã.'] } }]);

  // ===== 0. chave desligada (padrão): nada da fase 2, mesmo com um fio no banco
  await feed(A, true); await sleep(600);
  let m = await marcas(A);
  ok(!m.on && !m.cls && !m.sh && !m.fio && !m.ctx, 'desligada por padrão: sem prateleira, fio, contexto nem a classe fs2', JSON.stringify(m));
  ok(await ev(A, (id) => { const e = document.getElementById('p-u:' + id); return !!e && /Três pontos/.test(e.textContent) && !/Segundo: o crédito/.test(e.textContent) }, pFioBia), 'desligada: o fio aparece como o post de hoje (só a parte 1)');
  await ev(A, id => abrirMateria(id), pk.anexo); await sleep(500);
  ok(await ev(A, () => !document.querySelector('.fs2-cap') && !document.querySelector('.fs2-faq')), 'desligada: matéria sem "Nesta matéria" e sem perguntas novas');
  await ev(A, () => closeLayer()); await sleep(200);
  await ev(A, () => { cn102AbreInicio('') }); await sleep(400); await clk(A, '[data-edsotexto]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('#ce-leg') && !document.querySelector('[data-f113mais]')), 'desligada: o criador não tem "Adicionar parte"');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false; go('feed') }); await sleep(300);

  // ===== 1. ligar por ?fase2=1: guarda no aparelho e some do endereço; ?fase2=0 desliga
  await recarrega(A, BASE + '?fase2=1');
  const u = await ev(A, () => ({ on: VN_FASE2, ls: localStorage.getItem('prumo-fase2'), q: location.search, cls: document.documentElement.classList.contains('fs2') }));
  ok(u.on && u.ls === '1' && u.q === '' && u.cls, '?fase2=1 liga, guarda "prumo-fase2" e tira o parâmetro do endereço', JSON.stringify(u));
  await recarrega(A); ok(await ev(A, () => VN_FASE2), 'continua ligada depois de recarregar');
  await ev(B, () => localStorage.setItem('prumo-fase2', '1')); await recarrega(B);
  const E = U.erros(await H.pagina(b), 'E'); await E.addInitScript(() => { try { for (const k of ['foco', 'semreels', 'capa', 'anim', 'visual']) localStorage.setItem('prumo-teste-' + k, '1'); localStorage.setItem('prumo-visual', 'atual') } catch (e) { } });
  await E.goto(BASE + '?fase2=1'); await sleep(1500);
  ok(await ev(E, () => !VN_FASE2 && !document.documentElement.classList.contains('fs2') && localStorage.getItem('prumo-fase2') === null), 'sem o visual novo, ?fase2=1 não liga nada');

  // ===== 2. Fio: Pedro cria um fio de 3 partes pelo criador
  await ev(A, () => { cn102AbreInicio('') }); await sleep(400); await clk(A, '[data-edsotexto]'); await sleep(300);
  await A.fill('#ce-leg', 'Fio sobre a PEC da Segurança: o que está em jogo.'); await sleep(100);
  ok(await ev(A, () => !!document.querySelector('[data-f113mais]')), 'post de texto: aparece "Adicionar parte"');
  await clk(A, '[data-f113mais]'); await sleep(200);
  await A.fill('[data-f113parte="0"]', 'Se a emenda passar, a PEC volta à Câmara. @Bia Souza, você viu?'); await clk(A, '[data-f113mais]'); await sleep(200);
  await A.fill('[data-f113parte="1"]', 'O governo diz ter votos. #Senado decide hoje.'); await sleep(200);
  const ed = await ev(A, () => ({ n: document.querySelectorAll('[data-f113parte]').length, t1: document.querySelector('#ce-leg').value, n1: (document.querySelector('.fs2-ed-n1') || {}).textContent, mais: !!document.querySelector('[data-f113mais]') }));
  ok(ed.n === 2 && /PEC da Segurança/.test(ed.t1) && ed.n1 === '1/3' && ed.mais, 'criador: parte 1 + duas partes numeradas (1/3), dá para pôr mais', JSON.stringify(ed));
  await ev(A, () => document.querySelector('#ce-leg').blur()); await foto(A, 'compor-fio');
  for (let i = 0; i < 2; i++) { await clk(A, "[data-f113mais]"); await sleep(120) }
  ok(await ev(A, () => document.querySelectorAll('[data-f113parte]').length === 4 && !document.querySelector('[data-f113mais]')), 'no máximo 5 partes: o botão some na quinta');
  await clk(A, '[data-f113tira="3"]'); await sleep(120); await clk(A, '[data-f113tira="2"]'); await sleep(150);
  ok(await ev(A, () => document.querySelectorAll('[data-f113parte]').length === 2 && /Câmara/.test(document.querySelector('[data-f113parte="0"]').value)), 'tirar parte mantém o que já foi escrito');
  await clk(A, '[data-edpubpo]'); await esperar(A, () => !document.querySelector('#layer .ce'), null, 8000); await sleep(800);
  const row = (await H.sql(`select id, texto, estilo from publicacoes where autor = $1 order by at desc limit 1`, [uidA]))[0];
  ok(row && /^Fio sobre a PEC/.test(row.texto) && Array.isArray(row.estilo.fio) && row.estilo.fio.length === 2 && /#Senado/.test(row.estilo.fio[1]), 'publicado: texto = parte 1 e estilo.fio = partes 2 e 3 (sem SQL novo)', JSON.stringify(row && row.estilo));
  const pFio = row.id;
  // Opinião/Análise também tem; Relato não
  await ev(A, () => cn102Comeca('ana')); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('[data-f113mais]')), 'Opinião/Análise: tem "Adicionar parte"');
  await ev(A, () => cn102Comeca('enq')); await sleep(400);
  ok(await ev(A, () => !document.querySelector('[data-f113mais]')), 'Pergunta: sem "Adicionar parte"');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false; go('feed') }); await sleep(300);

  // ===== 3. Bia lê o fio no Feed: fechado, aberto, hashtag na parte 3, camada com o fio inteiro
  await feed(B, true); await sleep(800);
  const fb = await ev(B, id => { const e = document.getElementById('p-u:' + id); if (!e) return null; const f = e.querySelector('.fs2-fio'); return { k: (f.querySelector('.fs2-fio-k') || {}).textContent, hid: f.querySelector('.fs2-fio-l').hidden, b: f.querySelector('[data-f113ver]').textContent, ex: f.querySelector('[data-f113ver]').getAttribute('aria-expanded'), n1: (e.querySelector('.fs2-n1') || {}).textContent } }, pFio);
  ok(fb && fb.k === 'Fio · 3 partes' && fb.hid && fb.b === 'Ler o fio' && fb.ex === 'false' && /1\/3/.test(fb.n1 || ''), 'Feed: parte 1 com "Fio · 3 partes" e "Ler o fio" (fechado)', JSON.stringify(fb));
  await ev(B, id => { const e = document.getElementById('p-u:' + id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 70) }, pFio); await foto(B, 'fio-fechado');
  await clk(B, `[id="p-u:${pFio}"] [data-f113ver]`); await sleep(300);
  const fa = await ev(B, id => { const e = document.getElementById('p-u:' + id), f = e.querySelector('.fs2-fio'); return { hid: f.querySelector('.fs2-fio-l').hidden, ex: f.querySelector('[data-f113ver]').getAttribute('aria-expanded'), ns: [...f.querySelectorAll('.fs2-n')].map(x => x.textContent), ht: [...f.querySelectorAll('.ht-a')].map(x => x.dataset.ht), men: /Bia Souza/.test(f.textContent), rule: getComputedStyle(f.querySelector('.fs2-fio-l')).borderLeftWidth } }, pFio);
  ok(!fa.hid && fa.ex === 'true' && fa.ns.join() === '2/3,3/3' && fa.rule === '1px', '"Ler o fio" abre as partes 2/3 e 3/3 ali mesmo, ligadas por um fio fino', JSON.stringify(fa));
  ok(fa.ht.includes('#Senado') && fa.men, 'hashtag e @ funcionam nas outras partes', JSON.stringify(fa));
  await foto(B, 'fio-aberto');
  ok(await ev(B, () => htPostsCom(htChave('#Senado')).length >= 1 && htPostsCom(htChave('#Copom')).some(x => /Três pontos/.test(x.texto))), 'página da hashtag encontra o fio pela hashtag de uma parte (e devolve o post original)');
  await ev(B, id => vn112AbrePub(id), pFio); await sleep(500);
  ok(await ev(B, () => { const f = document.querySelector('#layer .pfv .fs2-fio'); return !!f && f.classList.contains('on') && !f.querySelector('.fs2-fio-l').hidden }), 'aberto numa camada, o post mostra o fio inteiro');
  await ev(B, () => closeLayer()); await sleep(300);

  // ===== 4. Pedro edita o fio: muda a parte 2 e tira a 3
  await feed(A); await sleep(400);
  await clk(A, `[data-umenu="${pFio}"]`); await sleep(300); await clk(A, `[data-ueditar="${pFio}"]`); await sleep(500);
  const es = await ev(A, () => ({ n: document.querySelectorAll('#fs2-edb [data-f113eparte]').length, v: (document.querySelector('[data-f113eparte="0"]') || {}).value }));
  ok(es.n === 2 && /Câmara/.test(es.v), 'Editar legenda mostra as partes do fio', JSON.stringify(es));
  await A.fill('[data-f113eparte="0"]', 'Se a emenda passar, a PEC volta à Câmara (corrigido).'); await clk(A, '[data-f113etira="1"]'); await sleep(150);
  await clk(A, '[data-uedok]'); await sleep(1200);
  const row2 = (await H.sql(`select estilo from publicacoes where id = $1`, [pFio]))[0];
  ok(row2 && row2.estilo.fio.length === 1 && /corrigido/.test(row2.estilo.fio[0]) && row2.estilo.v === 2, 'editar grava as partes (estilo.fio) e mantém o resto do estilo', JSON.stringify(row2 && row2.estilo));
  await feed(B, true); await sleep(500);
  ok(await ev(B, id => { const e = document.getElementById('p-u:' + id); return e && e.querySelector('.fs2-fio-k').textContent === 'Fio · 2 partes' }, pFio), 'Bia vê o fio editado (2 partes)');

  // ===== 5. Capítulos na matéria
  const alvo = await ev(A, () => { const tem = p => ({ vis: (p.visuais || []).some(v => ['grafico', 'numeros', 'pesquisas'].includes(v.tipo)), tl: (p.visuais || []).some(v => v.tipo === 'linha_do_tempo' && (v.itens || []).length >= 2), vem: !!p.proximo, faq: (p.faq || []).some(q => q && q.p) });
    const l = FEED.pautas.map(p => ({ id: p.id, t: tem(p) })); const n = x => Object.values(x.t).filter(Boolean).length; l.sort((a, b) => n(b) - n(a)); return { cheia: l[0], pouca: l.find(x => n(x) === 1) || l[l.length - 1] } });
  await ev(A, id => abrirMateria(id), alvo.cheia.id); await sleep(600);
  const cp = await ev(A, () => { const n = document.querySelector('#layer .fs2-cap'); return n && { rot: [...n.querySelectorAll('[data-f113cap]')].map(b => b.textContent.replace(/^\d+/, '')), cur: (n.querySelector('[aria-current="true"]') || {}).textContent, k: n.getAttribute('aria-label'), alvos: [...n.querySelectorAll('[data-f113cap]')].map(b => !!document.getElementById(b.getAttribute('aria-controls'))), sticky: getComputedStyle(n).position, h: n.getBoundingClientRect().height,
    tem: { vis: !!document.querySelector('#layer .mat-vis'), tl: !!document.querySelector('#layer .mat-tl'), vem: [...document.querySelectorAll('#layer .cpx-c b')].some(b => /^O que vem agora/.test(b.textContent)), faq: !!document.querySelector('#layer .fs2-faq') } } });
  const esperado = await ev(A, () => { const c = document.querySelector('#layer .mat-c'), l = [[c.querySelector('.mat-30') || c.querySelector('.mat-p'), 'O que aconteceu'], [c.querySelector('.mat-vis'), 'VIS'], [c.querySelector('.mat-tl'), 'Linha do tempo'], [[...c.querySelectorAll('.cpx-c')].find(e => /^O que vem agora/.test((e.querySelector('b') || {}).textContent || '')), 'O que vem agora'], [c.querySelector('.fs2-faq'), 'Perguntas']].filter(x => x[0]);
    l.sort((x, y) => x[0].compareDocumentPosition(y[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1); return l.map(x => x[1]) });
  if (cp) esperado.forEach((r, i) => { if (r === 'VIS') esperado[i] = cp.rot.find(x => /números|gráfico|pesquisas/.test(x)) });
  ok(cp && cp.k === 'Nesta matéria' && cp.rot.join('|') === esperado.join('|') && cp.alvos.every(Boolean) && cp.rot.length >= 3, '"Nesta matéria" lista só as seções que a matéria tem, na ordem', JSON.stringify({ cp, esperado, alvo: alvo.cheia }));
  ok(cp.cur && /O que aconteceu/.test(cp.cur) && cp.sticky === 'sticky' && cp.h >= 40 && cp.h <= 56, 'começa marcado no primeiro capítulo; o índice gruda embaixo do topo (≥ 40px de toque)', JSON.stringify(cp));
  ok(cp.tem.faq === !!alvo.cheia.t.faq, 'Perguntas aparecem na matéria quando a pauta tem faq', JSON.stringify(alvo.cheia.t));
  await foto(A, 'materia-capitulos-topo');
  const k = cp.rot.length - 2;
  await clk(A, `[data-f113cap="${k}"]`); await sleep(1100);
  const vai = await ev(A, k => { const m = document.querySelector('#layer .mat'), el = document.getElementById('fs2c-' + k), nav = m.querySelector('.fs2-cap'); const top = el.getBoundingClientRect().top - m.getBoundingClientRect().top, fundo = nav.getBoundingClientRect().bottom - m.getBoundingClientRect().top;
    return { top: Math.round(top), fundo: Math.round(fundo), cur: (nav.querySelector('[aria-current="true"]') || {}).dataset?.f113cap, st: m.scrollTop } }, k);
  ok(vai.st > 100 && vai.top >= vai.fundo - 2 && vai.top <= vai.fundo + 30 && vai.cur === String(k), 'tocar num capítulo rola a matéria até ele, logo abaixo do índice, e marca o capítulo', JSON.stringify(vai));
  await foto(A, 'materia-capitulos-rolada');
  await ev(A, () => { const m = document.querySelector('#layer .mat'); m.scrollTop = m.scrollHeight }); await sleep(700);
  const fim = await ev(A, () => (document.querySelector('#layer .fs2-cap [aria-current="true"]') || {}).dataset?.f113cap);
  ok(fim === String(cp.rot.length - 1), 'rolando até o fim, o último capítulo fica marcado (IntersectionObserver)', fim);
  await ev(A, () => { const m = document.querySelector('#layer .mat'); m.scrollTop = 0 }); await sleep(600);
  ok(await ev(A, () => (document.querySelector('#layer .fs2-cap [aria-current="true"]') || {}).dataset?.f113cap === '0'), 'voltando ao topo, marca de novo o primeiro');
  await ev(A, () => closeLayer()); await sleep(300);
  await ev(A, id => abrirMateria(id), alvo.pouca.id); await sleep(500);
  const cp2 = await ev(A, () => { const n = document.querySelector('#layer .fs2-cap'); return { n: n ? n.querySelectorAll('[data-f113cap]').length : 0 } });
  ok(cp2.n === 2, 'matéria com uma seção além do texto: índice com 2 capítulos (sem inventar seção)', JSON.stringify({ cp2, t: alvo.pouca.t }));
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== 6. Prateleiras
  await feed(A, true); await sleep(800);
  const sh = await ev(A, () => { const filhos = [...document.querySelectorAll('#posts > *')]; const shs = [...document.querySelectorAll('#posts > .fs2-sh')];
    const naLista = new Set([...document.querySelectorAll('#posts > article[id^="p-"]')].map(e => e.id.slice(2)));
    return { n: shs.length, it: shs.map(s => s.querySelectorAll('.fs2-mc').length), tit: shs.map(s => s.querySelector('h3').textContent), ids: shs.flatMap(s => [...s.querySelectorAll('[data-f113mc]')].map(b => b.dataset.f113mc)),
      dup: shs.flatMap(s => [...s.querySelectorAll('[data-f113mc]')].map(b => b.dataset.f113mc)).filter(id => naLista.has(id)), antes: shs.map(s => filhos.slice(0, filhos.indexOf(s)).filter(e => e.matches('article.post')).length),
      lbl: shs.map(s => !!document.getElementById(s.getAttribute('aria-labelledby'))), snap: shs[0] ? getComputedStyle(shs[0].querySelector('.fs2-sh-l')).scrollSnapType : '', pad: shs[0] ? getComputedStyle(shs[0].querySelector('.fs2-sh-l')).paddingLeft : '' } });
  ok(sh.n >= 1 && sh.n <= 3 && sh.it.every(n => n >= 4 && n <= 6), 'Feed: de 1 a 3 prateleiras, cada uma com 4 a 6 notícias', JSON.stringify(sh));
  ok(!sh.dup.length && new Set(sh.ids).size === sh.ids.length, 'prateleiras sem repetir a lista principal nem umas às outras', JSON.stringify(sh.dup));
  ok(sh.antes.every((n, i) => n >= 5 + 5 * i), 'a primeira prateleira vem depois de ~6 itens', JSON.stringify(sh.antes));
  ok(sh.lbl.every(Boolean) && /x/.test(sh.snap) && sh.pad === '16px' && sh.tit.every(t => /^(Mais de|Por seguir)/.test(t)), 'rolagem com encaixe, alinhada ao recuo de 16px, com título acessível', JSON.stringify(sh));
  const fbsh = await ev(A, () => { const ord = (FEED.pautas || []); const s = document.querySelector('#posts > .fs2-sh'); const r = s.getBoundingClientRect(); scrollTo(0, r.top + scrollY - 80); return s.dataset.f113sh });
  await foto(A, 'prateleira');
  // "Ver no Feed" de uma notícia da prateleira: ela volta para a lista
  const pid0 = sh.ids[0];
  ok(await ev(A, id => garantirPost(id) && !!document.getElementById('p-' + id) && ![...document.querySelectorAll('[data-f113mc]')].some(b => b.dataset.f113mc === id), pid0), '"Ver no Feed" de uma notícia da prateleira devolve a notícia à lista (sem duplicar)');
  ok(await ev(A, () => { FILTRO = 'economia'; renderPosts(); const n = document.querySelectorAll('#posts .fs2-sh').length; FILTRO = 'tudo'; renderPosts(); return n === 0 }), 'com filtro de editoria, sem prateleiras');
  ok(await ev(A, () => { const p = FEED.pautas.find(p => secOf(p) === 'economia' && htDaPauta(p).length); if (!p) return true; const t = htDaPauta(p)[0]; htSegue(t, true); const l = f113Temas(); htSegue(t, false); return l[0].k === 'ht:' + htChave(t) && /^Por seguir #/.test(l[0].nome) }), 'hashtag seguida vem primeiro nos temas ("Por seguir #…")');
  ok(await ev(A, () => { const em = document.querySelector('#emdia'); return !em || !/Faltam \d+ notícias/.test(em.textContent) || +em.textContent.match(/Faltam (\d+)/)[1] === listaFeed().filter(p => !lidaAtual(p)).length }), 'a contagem "Faltam N notícias" não muda com as prateleiras');

  // ===== 7. Contexto do Prumo
  await feed(A, true); await sleep(600);
  const cx = await ev(A, ([a, b2, c]) => { const box = id => { const e = document.getElementById('p-u:' + id); return e ? [...e.querySelectorAll('.fs2-ctx')].map(x => ({ t: x.querySelector('.fs2-ctx-t').textContent, k: x.querySelector('.fs2-ctx-k').textContent, b: (x.querySelector('[data-capmat]') || {}).dataset?.capmat, btx: (x.querySelector('[data-capmat]') || {}).textContent })) : null };
    return { ht: box(a), anexo: box(b2), enq: box(c) } }, [pHt, pAnexo, pEnq]);
  ok(cx.ht && cx.ht.length === 1 && cx.ht[0].t === pk.ponto && /Contexto do Prumo/.test(cx.ht[0].k) && cx.ht[0].b === pk.ht && cx.ht[0].btx === 'Ler a matéria ›', 'post com a hashtag da pauta: "Contexto do Prumo" com o 1º ponto neutro e "Ler a matéria ›"', JSON.stringify({ cx: cx.ht, pk }));
  ok(cx.ht[0].t !== pk.dir && cx.ht[0].t !== pk.esq && !(pk.dir && pk.dir.indexOf(cx.ht[0].t) >= 0) && !(pk.esq && pk.esq.indexOf(cx.ht[0].t) >= 0), 'só o texto neutro (nada das versões de direita ou esquerda)');
  ok(cx.anexo && cx.anexo.length === 0, 'post que já mostra o cartão da notícia: sem caixa de contexto', JSON.stringify(cx.anexo));
  ok(cx.enq && cx.enq.length === 1 && cx.enq[0].b === pk.anexo, 'Pergunta sobre uma notícia (sem o cartão inteiro): uma caixa só', JSON.stringify(cx.enq));
  ok(await ev(A, id => { const e = document.getElementById('p-u:' + id); return e && !e.querySelector('.fs2-ctx') }, pFio), 'post do próprio Pedro: sem caixa');
  ok(await ev(A, () => { const l = FEED.pautas.map(p => p.id); return [...document.querySelectorAll('.fs2-ctx')].every(x => l.includes(x.dataset.f113ctx) && x.closest('.post').querySelectorAll('.fs2-ctx').length === 1) }), 'no máximo uma caixa por post');
  await ev(A, id => { const e = document.getElementById('p-u:' + id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 70) }, pHt); await foto(A, 'contexto');
  await clk(A, `[id="p-u:${pHt}"] .fs2-ctx [data-capmat]`); await sleep(500);
  ok(await ev(A, id => typeof MAT_PID !== 'undefined' && MAT_PID === id && !!document.querySelector('#layer .mat'), pk.ht), '"Ler a matéria ›" abre a matéria da pauta');
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== 8. larguras 360 e 430: sem rolagem para o lado (Feed com prateleira, matéria com índice)
  for (const w of [360, 430]) { await A.setViewportSize({ width: w, height: 800 }); await feed(A, true); await sleep(500);
    const s1 = await semRolagem(A); await ev(A, id => abrirMateria(id), alvo.cheia.id); await sleep(500); const s2 = await semRolagem(A);
    const cab = await ev(A, () => { const n = document.querySelector('#layer .fs2-cap'); const r = n.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 });
    ok(s1.pg <= 0 && s2.pg <= 0 && s2.mat <= 0 && cab, `${w}px: sem rolagem para o lado no Feed e na matéria`, JSON.stringify({ s1, s2, cab }));
    await ev(A, () => closeLayer()); await sleep(200) }
  await A.setViewportSize({ width: 390, height: 844 });

  // ===== 9. modo escuro (2 capturas)
  await A.emulateMedia({ colorScheme: 'dark' }); await feed(A, true); await sleep(500);
  const dk = await ev(A, id => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 }; const x = document.querySelector('#p-u\\:' + id + ' .fs2-ctx');
    const e = document.getElementById('p-u:' + id); scrollTo(0, e.getBoundingClientRect().top + scrollY - 70);
    return { bg: lum(getComputedStyle(document.body).backgroundColor), box: lum(getComputedStyle(x).backgroundColor), tx: lum(getComputedStyle(x.querySelector('.fs2-ctx-t')).color) } }, pHt);
  ok(dk.bg < .2 && dk.box < .3 && dk.tx > .7, 'modo escuro: caixa de contexto escura com texto claro', JSON.stringify(dk));
  await foto(A, 'escuro-contexto');
  await ev(A, id => abrirMateria(id), alvo.cheia.id); await sleep(500);
  const dk2 = await ev(A, () => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 }; const n = document.querySelector('#layer .fs2-cap'), b = n.querySelector('[aria-current="true"]'); return { nav: lum(getComputedStyle(n).backgroundColor), cur: lum(getComputedStyle(b).color) } });
  ok(dk2.nav < .25 && dk2.cur > .7, 'modo escuro: índice da matéria escuro com o capítulo atual claro', JSON.stringify(dk2));
  await clk(A, '[data-f113cap="1"]'); await sleep(1000); await foto(A, 'escuro-materia');
  await ev(A, () => closeLayer()); await A.emulateMedia({ colorScheme: 'light' });

  // ===== 10. ?fase2=0 desliga
  await recarrega(A, BASE + '?fase2=0'); await feed(A, true); await sleep(500); m = await marcas(A);
  ok(!m.on && !m.cls && !m.sh && !m.fio && !m.ctx && await ev(A, () => localStorage.getItem('prumo-fase2') === null && location.search === ''), '?fase2=0 desliga e tira o parâmetro', JSON.stringify(m));

  const errs = [A, B, E].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console', JSON.stringify(errs.slice(0, 5)));
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1) });
