// Etapa 22: contagem anônima sem conta; Capa atualiza na hora com edição nova
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8806); await sleep(700);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase-uso.sql' });
  const br = await U.navegador();
  const p = U.erros(await H.pagina(br, {}), 'a');
  await p.context().addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1'); window.__evTeste = 1 });
  await p.goto('http://localhost:8806/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cpi'), null, 10000);
  await p.evaluate(() => abrirMateria(FEED.capa.manchete)); await sleep(5500);
  const r0 = await H.sql(`select tipo, count(*)::int n from public.eventos group by tipo`); const rows = r0.rows || r0;
  ok(rows.some(x => x.tipo === 'abrir') && rows.some(x => x.tipo === 'materia'), 'sem conta: aberturas e matérias contadas (anônimo)', rows);
  await p.evaluate(() => history.back()); await sleep(400);
  // edição nova com a Capa aberta e no topo: a manchete muda na hora
  const novo = await p.evaluate(() => { const f = JSON.parse(JSON.stringify(FEED)); const m = f.pautas.find(x => x.id === f.capa.manchete); m.neutro.titulo = 'Manchete nova de teste'; m.subtitulo = 'Sub novo'; f.atualizado_em = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00'; window.scrollTo(0, 0); aplicarNovo(f); return document.querySelector('#v-capa .cpi-man .cp-t').textContent });
  ok(/Manchete nova de teste/.test(novo), 'Capa mostra a edição nova na hora', novo);
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa22: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
