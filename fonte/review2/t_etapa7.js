// Etapa 7: revisão geral
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(__dirname + '/feed-etapa2.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  const dia = n => new Date(Date.now() - 3 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  // campos com tipo errado não podem derrubar telas
  f.indicadores = { itens: 'quebrado' }; f.taxonomia = { politica: 5, economia: ['Mercados'] }; f.mudancas = { titulo: 'x', itens: 'oops' };
  f.esportes = { competicoes: [{ id: 'brasileirao', nome: 'Brasileirão', subtema: 'Brasileirão', tabela: 'x', chave: [{ fase: 'F', confrontos: null }] }],
    jogos: [{ id: 'j1', comp: 'brasileirao', data: dia(-2), hora: '16h', a: 'Flamengo', b: 'Palmeiras', estado: 'encerrado', ga: '10', gb: '2' }] };
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8784); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin')`, [a]);
  const br = await U.navegador(); const D = __dirname + '/etapa7/';
  const P = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'Pedro');
  await P.goto('http://localhost:8784/index.html'); await esperar(P, () => document.querySelectorAll('.post').length > 2 && S.membro, null, 10000); await sleep(500);
  ok(await P.evaluate(() => capaFrase('Primeira frase. Segunda frase bem maior que vai cortar. Terceira.', 30) === 'Primeira frase.'), 'capaFrase sem lookbehind');
  ok(!/\(\?<=/.test(fs.readFileSync(__dirname + '/../site/index.html', 'utf8')), 'nenhum lookbehind no app (iOS antigo)');
  await P.click('#t-capa'); await sleep(400);
  ok(await P.evaluate(() => VIEW === 'capa' && document.querySelector('#v-capa').children.length > 0), 'capa abre com indicadores/mudanças quebrados');
  await P.evaluate(() => { go('feed'); FILTRO = 'economia'; renderPosts() }); await sleep(300);
  ok(await P.evaluate(() => document.querySelectorAll('#posts .post').length > 0), 'Economia abre com indicadores quebrados');
  await P.evaluate(() => { FILTRO = 'esportes'; renderPosts() }); await sleep(300);
  ok(await P.evaluate(() => document.querySelectorAll('#posts .post').length > 0), 'Esportes abre com tabela/chave quebradas');
  ok(await P.evaluate(() => espVDE('Flamengo').join('') === 'V' && espVDE('Palmeiras').join('') === 'D'), 'placar em texto "10" x "2" é vitória (comparação numérica)');
  await P.evaluate(() => { FILTRO = 'tudo'; renderPosts(); window.scrollTo(0, 0) }); await sleep(200);
  // aba de abertura: abrir notícia pela capa não muda
  await P.click('#t-capa'); await sleep(300);
  await P.evaluate(() => { document.querySelector('#v-capa [data-capair]').click() }); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'capa' && !!document.querySelector('#layer .mat') && localStorage.getItem('prumo-aba') === 'capa'), 'abrir notícia da capa (Últimas) abre a matéria e não troca a aba de abertura (etapa 20)');
  await P.evaluate(() => history.back()); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'capa'), 'voltar volta para a capa');
  // Ver a seção pela capa e voltar
  await P.evaluate(() => document.querySelector('[data-capasec]').click()); await sleep(400);
  ok(await P.evaluate(() => VIEW === 'feed' && FILTRO !== 'tudo'), 'Ver a seção abre a seção');
  await P.evaluate(() => history.back()); await sleep(500);
  ok(await P.evaluate(() => FILTRO === 'tudo'), 'voltar depois de Ver a seção volta para Tudo');
  // Perfil → Guardadas → voltar = Perfil
  await P.evaluate(() => { FILTRO = 'tudo'; renderPosts(); go('feed') }); await sleep(200);
  await P.click('#t-me'); await sleep(300);
  await P.evaluate(() => go('saved')); await sleep(300);
  await P.evaluate(() => history.back()); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'me'), 'voltar das Guardadas volta ao Perfil');
  await P.evaluate(() => history.back()); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'feed'), 'voltar de novo vai ao feed');
  await P.click('#t-me'); await sleep(300); await P.evaluate(() => go('play')); await sleep(300);
  await P.click('#t-feed'); await sleep(500);
  ok(await P.evaluate(() => VIEW === 'feed' && SUBV === 0 && VST === 0), 'barra a partir do Quiz limpa o histórico');
  // Meus temas: abrir notícia que não segue mostra a prévia, sem trocar de aba
  await P.click('#t-capa'); await sleep(300);
  await P.evaluate(() => { PREF.seguindo = {}; PREF.feedModo = 'seguindo'; renderPosts() });
  await P.evaluate(() => openSnap(FEED.pautas[0].id)); await sleep(400);
  ok(await P.evaluate(() => VIEW === 'capa' && /Meus temas/.test(document.querySelector('.sheet')?.textContent || '')), 'Meus temas: notícia fora do filtro abre em folha e explica');
  await P.screenshot({ path: D + '1-meus-temas.png' });
  await P.evaluate(() => { closeLayer(); PREF.feedModo = 'voce'; go('feed'); renderPosts() }); await sleep(300);
  // seguir cobertura não volta o feed ao começo
  await P.evaluate(() => { for (let i = 0; i < 4; i++) maisPosts && maisPosts() }).catch(() => {});
  await P.evaluate(() => window.scrollTo(0, 2500)); await sleep(400);
  const y0 = await P.evaluate(() => scrollY);
  await P.evaluate(() => { const p = FEED.pautas.find(x => x.tipo !== 'pontual'); abrirPagCob(p.id) }); await sleep(300);
  await P.evaluate(() => document.querySelector('[data-cobseg]').click()); await sleep(400);
  await P.evaluate(() => closeLayer()); await sleep(300);
  ok(await P.evaluate(y => Math.abs(scrollY - y) < 40, y0), 'Seguir cobertura mantém a posição do feed (medido depois de fechar; com a janela aberta o fundo fica travado)', y0);
  await P.evaluate(() => closeLayer()); await sleep(200);
  // filtro de subtema que sumiu
  await P.evaluate(() => { FILTRO = 'politica'; SECF = { sec: 'politica', sub: 'Não existe mais', uf: '' }; renderPosts() }); await sleep(200);
  ok(await P.evaluate(() => document.querySelectorAll('#posts .post').length > 0 && SECF.sub === ''), 'subtema que sumiu não deixa a seção vazia');
  await P.evaluate(() => { FILTRO = 'tudo'; renderPosts(); window.scrollTo(0, 0) });
  // pílula também na capa
  await P.evaluate(() => { mostrarPilula(3); go('capa') }); await sleep(200);
  ok(await P.evaluate(() => !document.querySelector('#pilula')), 'sem pílula de novidades (a edição entra sozinha no topo)');
  await P.evaluate(() => { go('busca'); document.querySelector('#pilula')?.remove(); NOVO = null }); await sleep(200);
  // segurar o dedo 1,2 s: o clique que sobra não abre nem fecha nada
  await P.evaluate(() => go('capa')); await sleep(300);
  const box = await P.evaluate(() => { const b = document.querySelector('.cp-dest>button') || document.querySelector('#v-capa [data-capair]'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + 40, y: r.y + 20 } });
  await P.mouse.move(box.x, box.y); await P.mouse.down(); await sleep(1200); await P.mouse.up(); await sleep(400);
  ok(await P.evaluate(() => !!document.querySelector('.sheet .pv') && VIEW === 'capa'), 'segurar 1,2 s: prévia continua aberta e não pula para o feed');
  await P.evaluate(() => closeLayer()); await sleep(300);
  await P.evaluate(() => document.querySelector('#v-capa [data-capair]').click()); await sleep(400);
  ok(await P.evaluate(() => !!document.querySelector('#layer .mat')), 'toque normal depois funciona (abre a matéria)');
  ok(!P._erros.length, 'sem erros ' + P._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa7: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
