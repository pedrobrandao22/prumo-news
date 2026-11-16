// Buscar (154, 15/11): × igual a x, título acima do corpo, cartão da cobertura e do Entenda, Agora, pessoas/posts,
// "nada encontrado" com frase e sugestões, "Assuntos desta edição" sem "tema: título" nem "Outros", "Buscar na edição"
// do Criar (Selic no número em destaque, aviso quando nada) e Adicionar amigos sem se contradizer. Portas 8600–8601.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8600/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const busca = async (p, q) => { await p.fill('#bvq', q); await sleep(350) };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8600); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();

  // ===== visitante
  const V = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'V');
  await V.goto(BASE); await esperar(V, () => !!FEED && (FEED.pautas || []).length > 0, null, 10000);
  await ev(V, () => { /* dados de teste em cima da edição de teste */
    const P = (id, o) => Object.assign({ id, secao: 'politica', subtema: 'Congresso', tag: 'Teste', hora: new Date().toISOString() }, o);
    FEED.pautas.push(P('t-6x1', { tema: 'Fim da escala 6×1', subtema: 'STF e Judiciário', neutro: { titulo: 'Fux leva a 6×1 ao plenário físico', texto: 'O ministro decidiu.' } }));
    FEED.pautas.push(P('t-motta', { tema: 'PL e Motta', neutro: { titulo: 'PL não decide sobre Motta', texto: 'O partido citou a eleição de 2026 de passagem.' } }));
    FEED.pautas.push(P('t-lula', { tema: 'Eleição 2026', secao: 'politica', hora: '2026-10-27T10:00:00-03:00', neutro: { titulo: 'Lula é reeleito com 51,79%', texto: 'Resultado do segundo turno.' } }));
    FEED.pautas.push(P('t-semsub', { secao: 'mundo', subtema: '', tema: 'COP31 na Turquia', neutro: { titulo: 'COP31 na Turquia discute metas', texto: 'Clima.' } }));
    FEED.explicadores['Guerra na Ucrânia'] = { titulo: 'Entenda a guerra na Ucrânia', texto: 'A Rússia invadiu a Ucrânia em fevereiro de 2022.' };
    FEED.explicadores['Escala 6x1'] = FEED.explicadores['Escala 6x1'] || { titulo: 'O que muda com o fim da escala 6x1', texto: 'Seis dias de trabalho.' };
    const cm = FEED.pautas.find(p => p.id === 'caso-master'); if (cm) { cm.titulos = [{ titulo: 'Primeira', hora: '2026-11-10T10:00:00-03:00' }, { titulo: 'Segunda', hora: '2026-11-14T10:00:00-03:00' }]; cm.inicio = '2026-11-01T10:00:00-03:00' }
    const sp = new Date(Date.now() - 3 * 3600e3 - 20 * 6e4), dd = n => String(n).padStart(2, '0');
    const hora = `${dd(sp.getUTCDate())}/${dd(sp.getUTCMonth() + 1)} ${dd(sp.getUTCHours())}h${dd(sp.getUTCMinutes())}`;
    NOVID_AG = { gerado: new Date().toISOString(), novos: [{ assunto: 'Como foi a volta de Ronaldinho Gaúcho aos gramados, aos 46 anos', relevante: true, n_fontes: 3, secao: 'esportes', manchetes: [{ titulo: 'Como foi a volta de Ronaldinho Gaúcho aos gramados, aos 46 anos', hora }] }] };
    bu154Vocab.v = null; go('busca') });
  await sleep(400);

  // 1. 6x1 com a letra x
  await busca(V, '6x1');
  ok(await ev(V, () => !!document.querySelector('#bvres .sres [data-busca="t-6x1"]') && !!document.querySelector('#bvres .sres [data-busca="pec-6x1-senado"]')), '"6x1" acha a notícia escrita com × e a com x');
  ok(await ev(V, () => !!document.querySelector('#bvres .bu154-cards [data-explica="Escala 6x1"]')), '"6x1": cartão do Entenda "Escala 6x1" no topo');
  ok(await ev(V, () => !/Nada encontrado/.test(document.querySelector('#bvres').textContent)), '"6x1" não diz "Nada encontrado"');
  await busca(V, '6×1'); ok(await ev(V, () => !!document.querySelector('#bvres [data-busca="t-6x1"]')), '"6×1" (com o sinal) também acha');

  // 2. título acima do corpo, com o trecho
  await busca(V, 'eleição');
  const ord = await ev(V, () => [...document.querySelectorAll('#bvres .sres [data-busca]')].map(b => b.dataset.busca));
  ok(ord.indexOf('t-lula') >= 0 && ord.indexOf('t-motta') > ord.indexOf('t-lula'), '"eleição": a notícia com a palavra no assunto vem antes da que só cita no corpo', ord.slice(0, 5));
  ok(await ev(V, () => { const b = document.querySelector('#bvres [data-busca="t-motta"]'); return !!b && /eleição/i.test((b.querySelector('em.trecho') || {}).textContent || '') && !!b.querySelector('em.trecho mark') }), 'só no corpo: mostra o trecho com a palavra marcada');
  ok(await ev(V, () => { const s = document.querySelector('#bvres [data-busca="t-lula"]'); return s && /esta edição/.test(s.textContent) }), 'linha de baixo: seção · subtema · esta edição');

  // 3. cartão da cobertura pelo nome
  await busca(V, 'Caso Master');
  const cob = await ev(V, () => { const c = document.querySelector('#bvres .bu154-cards .bu154-card [data-cobpag="caso-master"]'); return { c: !!c, prim: document.querySelector('#bvres > *')?.className, seg: !!document.querySelector('#bvres [data-bu154seg="caso-master"]') } });
  ok(cob.c && cob.prim === 'bu154-cards' && cob.seg, '"Caso Master": cartão da cobertura no topo, com Seguir', cob);
  await U.foto(V, 'busca154-cobertura');
  await clk(V, '#bvres [data-bu154seg="caso-master"]'); await sleep(300);
  ok(await ev(V, () => seguido(pautaById('caso-master')) && /Seguindo/.test(document.querySelector('#bvres [data-bu154seg="caso-master"]').textContent) && VIEW === 'busca' && !$('#layer').innerHTML), 'Seguir no cartão segue a cobertura e fica na Busca');
  await clk(V, '#bvres .bu154-card [data-cobpag="caso-master"]'); await sleep(400);
  ok(await ev(V, () => !!document.querySelector('#layer .pc')), 'tocar no cartão abre a página da cobertura'); await ev(V, () => closeLayer()); await sleep(300);

  // 4. Entenda pelo nome
  await busca(V, 'Ucrânia');
  ok(await ev(V, () => !!document.querySelector('#bvres .bu154-cards [data-explica="Guerra na Ucrânia"]')), '"Ucrânia": cartão "Entenda" no topo');

  // 5. Agora
  await busca(V, 'ronaldinho');
  ok(await ev(V, () => { const a = document.querySelector('#bvres .bu154-ag [data-bu154ag]'); return !!a && /ainda em apuração/.test(a.textContent) && /Ronaldinho/.test(a.textContent) }), '"ronaldinho": acha o assunto do Agora com o selo "ainda em apuração"');
  await clk(V, '#bvres [data-bu154ag]'); await sleep(400);
  ok(await ev(V, () => /Agora/.test(document.querySelector('#layer').textContent)), 'tocar abre a folha do Agora'); await ev(V, () => closeLayer()); await sleep(300);

  // 6. nada encontrado: frase, você quis dizer, sugestões
  await busca(V, 'xyzabcw');
  ok(await ev(V, () => { const n = document.querySelector('#bvres .bu154-nada'); return !!n && /Nada encontrado para “xyzabcw”/.test(n.textContent) && /A busca olha/.test(n.textContent) && n.querySelectorAll('[data-bu154q]').length >= 2 }), 'nada: frase que explica e sugestões de assuntos');
  await U.foto(V, 'busca154-nada');
  const sug = await ev(V, () => document.querySelector('#bvres .bu154-sug [data-bu154q]').dataset.bu154q);
  await clk(V, '#bvres .bu154-sug [data-bu154q]'); await sleep(350);
  ok(await ev(V, s => $('#bvq').value === s && !document.querySelector('#bvres .bu154-nada'), sug), 'tocar numa sugestão busca por ela');
  await busca(V, 'Caso Mastr');
  ok(await ev(V, () => /Mostrando resultados para “caso master”/i.test(document.querySelector('#bvres').textContent) && !!document.querySelector('#bvres [data-busca="caso-master"]')), 'erro de digitação ("Caso Mastr"): mostra o resultado da palavra mais parecida');
  ok(await ev(V, () => $('#bvq').placeholder === 'Buscar notícia ou assunto'), 'sem conta, o campo não promete achar nomes');

  // 7. Assuntos desta edição
  await busca(V, '');
  const as = await ev(V, () => { const s = [...document.querySelectorAll('#bvres .bv-sec')].find(x => /Assuntos desta edição/.test(x.textContent)); const its = [...s.querySelectorAll('.bv-it')];
    return { outros: [...s.querySelectorAll('.bv-sub')].some(x => x.textContent === 'Outros'), dois: its.some(b => { const p = pautaById(b.dataset.busca || b.dataset.cobpag); const tm = p && temaDe(p); return !!tm && b.textContent.trim().indexOf(tm + ': ') === 0 }), kick: its.filter(b => b.querySelector('.bu154-it small')).length,
      cop: (() => { const b = s.querySelector('[data-busca="t-semsub"],[data-cobpag="t-semsub"]'); return b && !b.querySelector('small') })() } });
  ok(!as.outros && !as.dois && as.kick > 0, '"Assuntos desta edição": nome da cobertura em linha pequena, sem "tema: título" e sem "Outros"', as);
  ok(as.cop, 'não repete o nome da cobertura quando o título já começa com ele', as);
  await U.foto(V, 'busca154-assuntos');
  ok(!V._erros.length, 'visitante sem erros ' + V._erros.join('|'));
  await V.close();

  // ===== membro
  const A = U.erros(await H.pagina(b, { viewport: { width: 375, height: 667 } }), 'A');
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  if (!(await A.$('#lcod'))) { await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(A, '#avisoconta [data-entrar]'); await clk(A, '[data-laba="criar"]') }
  await A.fill('#lnome', 'Claude Teste'); await A.fill('#lemail', 'c@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]');
  await esperar(A, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await A.$('.sheet')) { await ev(A, () => closeLayer()); await sleep(250) }
  await esperar(A, () => PUB.on === true, null, 8000);
  await ev(A, () => { PUB.itens.push({ id: 'tpost1', autor: S.uid, tipo: 'post', texto: 'Minha opinião sobre a reforma zebrapost do Senado', at: Date.now() - 6e4, fotos: [], estilo: {} });
    PUB.itens.push({ id: 'tcol1', autor: S.uid, tipo: 'post', texto: '', at: Date.now() - 5e4, fotos: [], estilo: { coluna: { tit: 'Por que a zebracol importa', linha: 'Uma coluna de teste', corpo: '<p>Texto.</p>' } } }); go('busca') });
  await sleep(400);
  await busca(A, 'claude');
  ok(await ev(A, () => { const p = document.querySelector('#bvres .bu154-pe [data-bu154pf]'); return !!p && p.dataset.bu154pf === S.uid && /Claude Teste/.test(p.textContent) && /Você/.test(p.textContent) }), '"claude": acha a pessoa (a própria conta) em "Pessoas"');
  ok(await ev(A, () => $('#bvq').placeholder === 'Buscar notícia, nome ou assunto'), 'com conta, o campo promete nomes');
  await busca(A, 'zebrapost');
  ok(await ev(A, () => !!document.querySelector('#bvres .bu154-po [data-bu154post="tpost1"]') && !/Nada encontrado/.test(document.querySelector('#bvres').textContent)), 'acha o post pelo texto');
  await clk(A, '#bvres [data-bu154post="tpost1"]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv')), 'tocar no post abre a publicação'); await ev(A, () => closeLayer()); await sleep(300);
  await busca(A, 'zebracol');
  ok(await ev(A, () => !!document.querySelector('#bvres .bu154-po [data-cs123ler="tcol1"]')), 'acha a coluna pelo título');
  await U.foto(A, 'busca154-coluna');
  await ev(A, () => { PUB.itens = PUB.itens.filter(x => x.id !== 'tpost1' && x.id !== 'tcol1') });

  // ===== Criar › Notícia › Buscar na edição
  await ev(A, () => go('feed')); await sleep(300);
  await ev(A, () => cn102Comeca('nt')); await esperar(A, () => !!document.querySelector('#layer .cn102-ntl #ce-lq'), null, 4000);
  const temSelic = await ev(A, () => [...document.querySelectorAll('#layer .cn102-ntl .ce-lis li')].some(li => /selic/i.test(li.textContent + ' ' + JSON.stringify(pautaById((li.querySelector('button') || {}).getAttribute?.('data-edpnt') || '') || {}).slice(0, 4000))));
  await A.fill('#ce-lq', 'Selic'); await sleep(200);
  const vis = await ev(A, () => [...document.querySelectorAll('#layer .cn102-ntl .ce-lis li')].filter(l => !l.hidden && !l.classList.contains('bu154-ntnada')).length);
  ok(!temSelic || vis > 0, '"Selic" na lista do Criar acha a notícia (título, subtítulo, número em destaque ou cobertura)', { temSelic, vis });
  await A.fill('#ce-lq', 'xyzabcw'); await sleep(200);
  ok(await ev(A, () => { const n = document.querySelector('#layer .bu154-ntnada'); return n && !n.hidden && /Nenhuma notícia desta edição com “xyzabcw”/.test(n.textContent) }), 'nada na lista do Criar: aparece uma frase, não fica em branco');
  await U.foto(A, 'busca154-criar-nada');
  await A.fill('#ce-lq', ''); await sleep(150);
  ok(await ev(A, () => document.querySelector('#layer .bu154-ntnada').hidden && [...document.querySelectorAll('#layer .cn102-ntl .ce-lis li')].filter(l => !l.hidden).length > 3), 'campo vazio mostra a lista toda');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

  // ===== Adicionar amigos
  await ev(A, () => abrirAddAmigos()); await esperar(A, () => !!document.querySelector('#pform #pq'));
  await A.fill('#pq', 'Maria'); await sleep(200);
  ok(await ev(A, () => { const e = document.querySelector('#pbox .bu154-amg'); return !!e && /Nenhuma sugestão com “Maria”/.test(e.textContent) && /nome completo/.test(e.textContent) && !!e.querySelector('[data-convidar]') }), 'digitando sem achar: explica o nome completo e oferece "Convidar alguém"');
  await clk(A, '#pbusca'); await esperar(A, () => /nome exato/.test(document.querySelector('#pbox').textContent), null, 4000);
  ok(await ev(A, () => { const bx = document.querySelector('#pbox'); return /Ninguém no Prumo com o nome exato “Maria”/.test(bx.textContent) && !!bx.querySelector('.bu154-amgh [data-convidar]') && !bx.querySelector('.empty') }), 'Procurar sem achar: uma mensagem só, com "Convidar alguém"');
  await ev(A, () => { S.membros['00000000-0000-4000-8000-0000000000b1'] = { nome: 'Bia Augusto' }; S.comuns['00000000-0000-4000-8000-0000000000b1'] = 1; S._reAmg && S._reAmg() });
  await A.fill('#pq', 'Bia'); await sleep(150); await clk(A, '#pbusca'); await esperar(A, () => /nome exato/.test(document.querySelector('#pbox').textContent), null, 4000);
  const bia = await ev(A, () => { const bx = document.querySelector('#pbox'); return { t: bx.textContent, li: bx.querySelectorAll('ul.amgl li').length } });
  ok(bia.li === 1 && /As sugestões com “Bia” estão abaixo/.test(bia.t) && !/Ninguém no Prumo com o nome exato “Bia”\./.test(bia.t), '"Bia" com a Bia Augusto nas sugestões: não diz que não há ninguém', bia);
  await U.foto(A, 'busca154-amigos');
  ok(!A._erros.length, 'membro sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_busca_1511: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
