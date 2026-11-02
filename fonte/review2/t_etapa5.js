// Etapa 5: esportes (dados fictícios só para o teste)
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(__dirname + '/feed-etapa2.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  const dia = n => new Date(Date.now() - 3 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  f.pautas.find(p => p.id === 'brasileirao-31-rodada-lideres').times = ['Time A', 'Time B'];
  f.esportes = {
    competicoes: [
      { id: 'brasileirao', nome: 'Brasileirão Série A', subtema: 'Brasileirão', fase: '31ª rodada', destaque: true, tabela_ate: 'após a 30ª rodada', tabela: [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ pos: i, time: 'Time ' + 'ABCDEFGH'[i - 1], pts: 70 - i * 3, j: 30, v: 20 - i, sg: 20 - i * 2 })) },
      { id: 'libertadores', nome: 'Libertadores', subtema: 'Libertadores', fase: 'Semifinal', chave: [{ fase: 'Semifinal', confrontos: [{ a: 'Time A', b: 'Rival X', ida: '0 a 0', volta: '' }] }] }],
    jogos: [
      { id: 'j1', comp: 'brasileirao', data: dia(0), hora: '19h', a: 'Time A', b: 'Time C', estado: 'ao_vivo', ga: 1, gb: 0, atualizado: iso(Date.now() - 20 * 60e3) },
      { id: 'j2', comp: 'brasileirao', data: dia(0), hora: '21h30', a: 'Time B', b: 'Time D', estado: 'agendado', local: 'Allianz', tv: 'Globo' },
      { id: 'j3', comp: 'libertadores', data: dia(3), hora: '21h30', a: 'Time A', b: 'Rival X', estado: 'agendado', fase: 'Semifinal, volta' },
      { id: 'j4', comp: 'brasileirao', data: dia(-4), hora: '16h', a: 'Time E', b: 'Time A', estado: 'encerrado', ga: 1, gb: 2 },
      { id: 'j5', comp: 'brasileirao', data: dia(-7), hora: '16h', a: 'Time A', b: 'Time F', estado: 'encerrado', ga: 1, gb: 1 },
      { id: 'j6', comp: 'libertadores', data: dia(-2), hora: '21h30', a: 'Rival X', b: 'Time A', estado: 'encerrado', ga: 0, gb: 0, pid: 'estudiantes-flamengo-semi-libertadores' }]
  };
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8782); await sleep(800);
  const br = await U.navegador(); const D = __dirname + '/etapa5/';
  for (const dark of [false, true]) {
    const n = dark ? 'e' : 'c';
    const p = U.erros(await br.newPage({ viewport: { width: 390, height: 844 }, colorScheme: dark ? 'dark' : 'light' }), n);
    await p.goto('http://localhost:8782/index.html'); await esperar(p, () => document.querySelectorAll('.post').length > 2, null, 10000); await sleep(400);
    await p.evaluate(() => { FILTRO = 'esportes'; renderPosts(); window.scrollTo(0, 0) }); await sleep(400);
    ok(await p.evaluate(() => !!document.querySelector('[data-escolhertime]') && /Jogos de hoje/.test(document.querySelector('.esp').textContent) && !!document.querySelector('.jg .m.v') && document.querySelectorAll('.tab tbody tr').length === 6), n + ': esportes: escolher time, jogos de hoje (ao vivo) e tabela do destaque');
    await p.screenshot({ path: D + n + '1-esportes.png' });
    await p.evaluate(() => document.querySelector('[data-escolhertime]').click()); await sleep(300);
    ok(await p.evaluate(() => document.querySelectorAll('.tpick button').length >= 8), n + ': lista de times');
    await p.evaluate(() => [...document.querySelectorAll('.tpick button')].find(b => b.dataset.meutime === 'Time A').click()); await sleep(400);
    ok(await p.evaluate(() => PREF.meuTime === 'Time A' && /1º · 67 pts/.test(document.querySelector('.esp-mt').textContent) && document.querySelectorAll('.esp-mt .vde i').length === 3 && /Próximo jogo|Jogando agora/.test(document.querySelector('.esp-mt').textContent) && /Notícias/.test(document.querySelector('.esp-mt').textContent)), n + ': Meu time: posição, V/E/D, próximo jogo, notícias');
    ok(await p.evaluate(() => !!document.querySelector('.tab tr.meu')), n + ': meu time destacado na tabela');
    await p.screenshot({ path: D + n + '2-meu-time.png' });
    await p.evaluate(() => document.querySelector('[data-comp="libertadores"]').click()); await sleep(400);
    ok(await p.evaluate(() => /Libertadores/.test(document.querySelector('.sheet').textContent) && !!document.querySelector('[data-compaba="chave"]')), n + ': página do campeonato com chave');
    await p.evaluate(() => document.querySelector('[data-compaba="chave"]').click()); await sleep(200);
    ok(await p.evaluate(() => /Rival X/.test(document.querySelector('#compbox').textContent)), n + ': chave');
    await p.screenshot({ path: D + n + '3-campeonato.png' });
    await p.evaluate(() => closeLayer()); await sleep(200);
    await p.evaluate(() => document.querySelector('.tab [data-time="Time C"]').click()); await sleep(300);
    ok(await p.evaluate(() => /3º no Brasileirão/.test(document.querySelector('.sheet').textContent)), n + ': página do time');
    await p.screenshot({ path: D + n + '4-time.png' });
    await p.evaluate(() => closeLayer()); await sleep(200);
    await p.evaluate(() => document.querySelector('[data-secsub="Libertadores"]').click()); await sleep(300);
    ok(await p.evaluate(() => /Próximos jogos/.test(document.querySelector('.esp').textContent) && /Resultados/.test(document.querySelector('.esp').textContent) && !document.querySelector('.esp-mt')), n + ': chip Libertadores mostra jogos do campeonato');
    await p.screenshot({ path: D + n + '5-libertadores.png' });
    ok(!p._erros.length, n + ': sem erros ' + p._erros.join('|'));
    await p.close();
  }
  // reabrir já filtrado em esportes (sessionStorage) não pode quebrar
  const q = U.erros(await br.newPage({ viewport: { width: 390, height: 844 } }), 'reabre');
  await q.goto('http://localhost:8782/index.html'); await esperar(q, () => !!FEED, null, 10000);
  await q.evaluate(() => { FILTRO = 'esportes'; ssSet('radar-filtro', 'esportes'); renderPosts() }); await q.reload(); await sleep(1500);
  ok(await q.evaluate(() => FILTRO === 'esportes' && !!document.querySelector('.esp')) && !q._erros.length, 'reabrir em Esportes: sem erros ' + q._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa5: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
