// Matéria e coberturas (158, 15/11 noite): "Quem noticiou" sem veículo nas duas listas e com o espectro da tabela do Prumo;
// cobertura com um nome só; seguir no fim da matéria com um toque; "Coberturas que sigo" no Perfil; seguir grava na hora;
// link de notícia que saiu da edição; faixa "Nesta matéria"; atualizações repetidas; agenda; celular deitado; iPhone SE;
// letra grande na linha do tempo. Portas 8641 (site) e 8642 (sem nada).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const fs = require('fs'); const path = require('path');
const BASE = 'http://localhost:8641/index.html';
const ev = (p, fn, a) => p.evaluate(fn, a);
const MPAG = path.join(__dirname, '..', 'site', 'm');
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post,.cpi').length > 0, null, 8000);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await p.$eval('#avisoconta [data-entrar]', e => e.click()); await p.$eval('[data-laba="criar"]', e => e.click()) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await p.$eval('#lform [type=submit]', e => e.click());
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
/* uma notícia de teste com tudo o que os achados pedem */
const PREPARA = () => {
  const p = FEED.pautas.find(x => x.tipo !== 'pontual') || FEED.pautas[0]; const id = p.id;
  p.tema = 'Caso Master'; p.tag = 'STF'; p.subtema = 'STF e Judiciário'; p.tipo = 'cobertura';
  p.inicio = new Date(Date.now() - 5 * 86400e3).toISOString(); p.titulos = [{ hora: p.inicio, titulo: 'Começo' }, { hora: new Date().toISOString(), titulo: 'Agora' }];
  p.fontes = ['cnn', 'Brasil de Fato', 'CNN Brasil', 'Carta Capital', 'folha', 'Mix Vale'];
  p.links = [{ fonte: 'CNN Brasil', url: 'https://example.com/a', titulo: 'a' }, { fonte: 'Brasil 247', url: 'https://example.com/b', titulo: 'b' }];
  p.enquadramentos = [{ fonte: 'Brasil de Fato', descricao: 'Liga o afastamento aos delegados.' }];
  p.checagem = { status: 'divergencia', texto: 'O Tempo e o Congresso em Foco trazem datas diferentes. As fontes são atribuídas cada número.' };
  Object.assign(FEED.fontes, { 'Brasil de Fato': 'Brasil de Fato', 'CNN Brasil': 'CNN Brasil', 'Carta Capital': 'Carta Capital', folha: 'folha', 'Mix Vale': 'Mix Vale', 'Brasil 247': 'Brasil 247' });
  Object.assign(FEED.espectro, { 'Brasil de Fato': 'centro', 'CNN Brasil': 'centro', 'Carta Capital': 'centro', folha: 'centro', 'Mix Vale': 'centro', 'Brasil 247': 'centro' });
  const t = Date.now();
  p.atualizacoes = [{ hora: new Date(t - 3 * 3600e3).toISOString(), texto: 'Os portões abrem às 12h e fecham às 13h; a prova vai das 13h30 às 18h30, com permanência mínima até as 15h30 e documento com foto.' },
    { hora: new Date(t - 1 * 3600e3).toISOString(), texto: 'Os portões abrem às 12h e fecham às 13h; a prova vai das 13h30 às 18h30, com permanência mínima de duas horas e documento com foto.' },
    { hora: new Date(t - 2 * 3600e3).toISOString(), texto: 'O Senado ouve o ministro na quarta sobre a operação da PF.' }];
  p.visuais = [{ tipo: 'linha_do_tempo', titulo: 'Como o caso andou', itens: [{ quando: '10/11', texto: 'Primeiro passo do caso' }, { quando: '12/11', texto: 'Segundo passo do caso' }] }];
  FEED.dormentes = [{ id: 'mt158-dorm', secao: 'economia', subtema: 'Seu dinheiro', tema: 'Ataque hacker ao Tesouro', tag: 'Cibersegurança', titulo: 'Tesouro admite acesso indevido', resumo: 'Uma frase.', inicio: '2026-11-13T00:12:00-03:00', ultima: '2026-11-13T06:53:00-03:00', status: 'encerrada' }];
  return id };
(async () => {
  U.feedFresco('site'); fs.mkdirSync(MPAG, { recursive: true });
  fs.writeFileSync(path.join(MPAG, 'mt158-velha.html'), '<!doctype html><html><head><meta property="og:title" content="Chuva derruba barragem na Bahia"><meta property="og:description" content="Alertas venceram; Bahia teve barragem derrubada. (Foto de arquivo: Fulano/Wikimedia Commons (Public domain))"><meta property="og:image" content="https://example.com/x.jpg"><script>location.replace("/#m=mt158-velha")</script></head><body></body></html>');
  const srv = U.servir('site', 8641); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  try {
    const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
    await A.goto(BASE); await esperar(A, () => FEED && FEED.pautas && FEED.pautas.length > 0, null, 8000); await sleep(800);
    await ev(A, () => { try { closeLayer() } catch (e) {} });
    const pid = await ev(A, PREPARA);

    // 1. Quem noticiou
    await ev(A, id => abrirCobertura(id), pid); await sleep(300);
    const q = await ev(A, () => { const sh = document.querySelector('.sheet'); const lis = [...sh.querySelectorAll('.cvl li')].map(l => ({ n: l.querySelector('b').textContent, e: (l.querySelector('.cv-e') || {}).textContent || '' }));
      const fora = [...sh.querySelectorAll('h4')].find(h => /Não encontramos/.test(h.textContent)); return { lis, fora: fora ? fora.nextElementSibling.textContent : '', box: sh.querySelector('.cv-box').textContent } });
    const nomes = q.lis.map(x => x.n), esp = Object.fromEntries(q.lis.map(x => [x.n, x.e]));
    ok(nomes.filter(n => n === 'CNN Brasil').length === 1, '"cnn" e "CNN Brasil" viram uma linha só', nomes.join('|'));
    ok(!/CNN Brasil/.test(q.fora), 'CNN Brasil não aparece em "Não encontramos em"', q.fora);
    ok(esp['Brasil de Fato'] === 'Mais à esquerda' && esp['CartaCapital'] === 'Mais à esquerda' && esp['Brasil 247'] === 'Mais à esquerda', 'Brasil de Fato, CartaCapital e Brasil 247 à esquerda', JSON.stringify(esp));
    ok(esp['Mix Vale'] === '', 'veículo fora da tabela fica sem etiqueta (não cai em "Centro")', JSON.stringify(esp));
    ok(nomes.includes('O Tempo') && nomes.includes('Congresso em Foco'), 'quem o quadro de divergências cita entra em "Noticiaram"', nomes.join('|'));
    ok(nomes.includes('Folha') && !nomes.includes('folha'), '"folha" aparece como "Folha"');
    ok(!/atribuídas cada número/.test(q.box) && /Cada número está atribuído à sua fonte/.test(q.box), 'frase quebrada do quadro corrigida', q.box);
    ok(await ev(A, () => { const p = FEED.pautas[0]; const h = espectroHTML({ fontes: ['cnn', 'CNN Brasil', 'Mix Vale', 'jp'] }); return /Centro: 1/.test(h) && /Mais à direita: 1/.test(h) }), 'barra "Quem cobriu" conta cada veículo uma vez e ignora os sem classificação');
    await U.foto(A, 'materia1511-quem'); await ev(A, () => closeLayer()); await sleep(200);

    // 2. cobertura com o nome dela
    await ev(A, id => abrirPagCob(id), pid); await sleep(300);
    ok(await ev(A, () => document.querySelector('.sheet .sh-h').firstChild.nodeValue === 'Caso Master'), 'folha da cobertura com o título "Caso Master" (não "STF")', await ev(A, () => document.querySelector('.sheet .sh-h').textContent));
    ok(await ev(A, () => /Cobertura desde/.test(document.querySelector('.sheet .pc-m').textContent) && !/Acompanhando desde/.test(document.querySelector('.sheet').textContent)), '"Cobertura desde" no lugar de "Acompanhando desde"');
    ok(await ev(A, () => document.querySelectorAll('.sheet .pct li').length >= 1 && ![...document.querySelectorAll('.sheet .pct li span')].some(s => /permanência mínima até as 15h30/.test(s.textContent))), 'linha do tempo da cobertura sem a atualização repetida');
    await ev(A, () => closeLayer()); await sleep(200);
    await ev(A, () => abrirDormente('mt158-dorm')); await sleep(300);
    ok(await ev(A, () => document.querySelector('.sheet .sh-h').firstChild.nodeValue === 'Ataque hacker ao Tesouro' && /^de 13\/11$/.test([...document.querySelectorAll('.sheet .pc-m span')].pop().textContent)), 'cobertura anterior: nome dela no título e "de 13/11" (não "13/11 a 13/11")');
    await ev(A, () => closeLayer()); await sleep(200);

    // 3. matéria: atualizações, seguir com um toque, letra grande
    await ev(A, id => abrirMateria(id), pid); await sleep(800);
    ok(await ev(A, () => document.querySelectorAll('#layer .cpx-up li').length === 2), 'atualizações quase iguais viram uma só (3 → 2)', await ev(A, () => document.querySelectorAll('#layer .cpx-up li').length));
    ok(await ev(A, () => /duas horas/.test(document.querySelector('#layer .cpx-up').textContent)), 'fica a atualização mais nova');
    const sb = '#layer [data-mt158seg]';
    ok(await ev(A, s => !!document.querySelector(s) && /Seguir a cobertura “Caso Master”/.test(document.querySelector(s).textContent), sb), 'fim da matéria: "Seguir a cobertura “Caso Master”"');
    await A.$eval(sb, e => { e.scrollIntoView({ block: 'center' }); e.click() }); await sleep(300);
    ok(await ev(A, s => seguido(pautaById(document.querySelector(s).dataset.mt158seg)) && /Seguindo “Caso Master” ✓/.test(document.querySelector(s).textContent) && document.querySelector(s).getAttribute('aria-pressed') === 'true', sb), 'um toque segue e o botão vira "Seguindo ✓"');
    await U.foto(A, 'materia1511-seguindo');
    ok(await ev(A, () => /Coberturas que eu sigo/.test(ajustesHTML()) && !/Temas que eu sigo/.test(ajustesHTML())), 'Ajustes do app: "Coberturas que eu sigo"');
    await ev(A, () => { PREF.fonte = 1.4; aplicarFonte() }); await sleep(200);
    const tl = await ev(A, () => { const s = document.querySelector('#layer .mat-tl span'); return s ? parseFloat(getComputedStyle(s).fontSize) : 0 });
    ok(tl === 0 || tl > 20, 'letra grande também aumenta a linha do tempo', tl);
    await ev(A, () => { PREF.fonte = 1; aplicarFonte() });
    // faixa "Nesta matéria": a aba marcada fica inteira à vista
    const fx = await ev(A, () => { const nav = document.querySelector('#layer .fs2-cap'); if (!nav) return null; const bs = nav.querySelectorAll('[data-f113cap]'); const i = bs.length - 1; f113CapMarca(nav, i); return i });
    if (fx != null) { await sleep(700); ok(await ev(A, i => { const l = document.querySelector('#layer .fs2-cap-l'), b = l.querySelector(`[data-f113cap="${i}"]`); const lr = l.getBoundingClientRect(), br = b.getBoundingClientRect(); return br.left >= lr.left - 1 && br.right <= lr.right + 1 }, fx), '"Nesta matéria": a aba marcada fica inteira na faixa') }
    await ev(A, () => closeLayer()); await sleep(300);

    // 4. agenda: a matéria diz que é a cobertura ligada ao evento
    await ev(A, id => { const hj = hojeSP(); FEED.agenda = [{ data: hj, hora: '', texto: 'Banco Central divulga o Boletim Focus', secao: 'economia', pid: id }]; go('capa'); renderCapa() }, pid); await sleep(500);
    const ag = await A.$('#v-capa .cp-l [data-capair]:not([disabled])');
    const agb = await ev(A, () => { const b = [...document.querySelectorAll('#v-capa .cp-l [data-capair]')].find(x => /Focus/.test(x.textContent)); if (b) { b.scrollIntoView({ block: 'center' }) } return !!b });
    if (agb) { await ev(A, () => [...document.querySelectorAll('#v-capa .cp-l [data-capair]')].find(x => /Focus/.test(x.textContent)).click()); await sleep(800);
      ok(await ev(A, () => /Boletim Focus/.test((document.querySelector('#layer .mt158-ag') || {}).textContent || '') && /Caso Master/.test(document.querySelector('#layer .mt158-ag').textContent)), 'agenda: a matéria abre dizendo o evento e a cobertura ligada');
      await U.foto(A, 'materia1511-agenda'); await ev(A, () => closeLayer()); await sleep(300) }
    else ok(false, 'agenda com o evento na Capa');

    // 5. conta: seguir grava na hora e "Coberturas que sigo" no Perfil
    const B = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'B');
    await criar(B, { nome: 'Bia', email: 'bia@x.com' });
    const pidB = await ev(B, PREPARA);
    await ev(B, id => abrirMateria(id), pidB); await sleep(600);
    await B.$eval('#layer [data-mt158seg]', e => { e.scrollIntoView({ block: 'center' }); e.click() });
    ok(await esperar(B, async () => { const g = await S.db.doc(`data/users/${S.uid}/prefs`).get(); return g.exists && !!((g.data() || {}).seguindo || {})['caso master'] }, null, 900), 'seguir vai para a conta na hora (antes de 1 s)');
    await ev(B, () => closeLayer()); await sleep(300); await ev(B, () => go('me')); await sleep(800);
    ok(await ev(B, () => !!document.querySelector('#v-me [data-mt158cobs]') && /1 cobertura/.test(document.querySelector('#v-me [data-mt158cobs]').textContent)), 'Perfil: "Coberturas que sigo · 1 cobertura"');
    await U.foto(B, 'materia1511-perfil');
    await B.$eval('#v-me [data-mt158cobs]', e => e.click()); await sleep(400);
    ok(await ev(B, () => /Caso Master/.test(document.querySelector('.sheet .mt158-cl').textContent)), 'a lista mostra a cobertura seguida');
    await B.$eval('.sheet [data-mt158des]', e => e.click());
    ok(await esperar(B, async () => { const g = await S.db.doc(`data/users/${S.uid}/prefs`).get(); return g.exists && !((g.data() || {}).seguindo || {})['caso master'] }, null, 900), 'deixar de seguir também grava na hora');
    ok(await ev(B, () => !Object.keys(PREF.seguindo || {}).length && /ainda não segue/.test(document.querySelector('.sheet').textContent)), 'a lista fica vazia');
    await ev(B, () => closeLayer());

    // 6. link de notícia que saiu da edição
    const C = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'C');
    await C.goto(BASE + '#m=mt158-velha');
    ok(await esperar(C, () => /Notícia de outra edição/.test((document.querySelector('.sheet') || {}).textContent || '') && /Chuva derruba barragem/.test(document.querySelector('.sheet').textContent), null, 7000), 'link velho: cartão com o título da notícia, sem esperar 8 s');
    ok(await ev(C, () => !/Foto de arquivo/.test(document.querySelector('.sheet').textContent) && !!document.querySelector('.sheet [data-mt158hoje]')), 'cartão com o resumo (sem o crédito) e "Ver as notícias de hoje"');
    await U.foto(C, 'materia1511-link-velho');
    await C.$eval('.sheet [data-mt158hoje]', e => e.click()); await sleep(400);
    ok(await ev(C, () => !document.querySelector('#layer').innerHTML && VIEW === 'capa'), '"Ver as notícias de hoje" fecha e mostra a Capa');
    const C2 = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'C2'); await C2.goto(BASE + '#m=nao-existe-158');
    ok(await esperar(C2, () => /Notícia não encontrada/.test((document.querySelector('.sheet') || {}).textContent || ''), null, 10000), 'link para notícia que não existe: avisa', await ev(C2, () => [typeof LINK_PID !== 'undefined' && LINK_PID, (document.querySelector('#layer') || {}).innerHTML?.slice(0, 120)].join(' ')));

    // 7. iPhone SE: editoria inteira no topo; celular deitado: foto até ~45% e barra baixa
    const D = U.erros(await H.pagina(b, { viewport: { width: 375, height: 667 } }), 'D');
    await D.goto(BASE); await esperar(D, () => FEED && FEED.pautas && FEED.pautas.length > 0, null, 8000); await sleep(500); await ev(D, () => { try { closeLayer() } catch (e) {} });
    const ks = await ev(D, () => FEED.pautas.slice(0, 12).map(p => { abrirMateria(p.id); const k = document.querySelector('#layer .mat-k'); const r = { t: k.textContent, ok: k.scrollWidth <= k.clientWidth + 1 && k.scrollHeight <= k.clientHeight + 1 }; closeLayer(); return r }));
    ok(ks.every(x => x.ok), 'iPhone SE: editoria do topo da matéria sem corte', ks.filter(x => !x.ok).map(x => x.t).join('|'));
    await D.setViewportSize({ width: 844, height: 390 }); await ev(D, () => { go('capa') }); await sleep(500);
    ok(await ev(D, () => { const n = document.querySelector('.nav-in'); return n.getBoundingClientRect().height <= 46 }), 'deitado: barra de baixo compacta');
    await ev(D, () => abrirMateria(FEED.pautas[0].id)); await sleep(500);
    ok(await ev(D, () => { const a = document.querySelector('#layer .mat-arte .art'); return a.getBoundingClientRect().height <= innerHeight * .46 }), 'deitado: foto da matéria com até ~45% da altura');
    await U.foto(D, 'materia1511-deitado');
    for (const [n, P] of [['A', A], ['B', B], ['C', C], ['D', D]]) ok(!P._erros.length, 'sem erros ' + n + ' ' + P._erros.join('|'));
  } finally {
    try { fs.unlinkSync(path.join(MPAG, 'mt158-velha.html')) } catch (e) {}
    await b.close(); srv.kill();
  }
  const R = U.resumo(); console.log(`\nRESUMO t_materia_1511: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
