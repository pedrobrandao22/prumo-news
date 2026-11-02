// Etapa 8: indicadores.json automático
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(__dirname + '/feed-etapa2.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  const dia = n => new Date(Date.now() - 3 * 3600e3 + n * 864e5).toISOString().slice(0, 10);
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  f.indicadores = { itens: [{ id: 'dolar', nome: 'Dólar', valor: 'R$ 5,07', variacao: '-0,28%', dir: 'desce', data: dia(-1) }, { id: 'ibovespa', nome: 'Ibovespa', valor: '139.000', dir: 'sobe', data: dia(0) }, { id: 'selic', nome: 'Selic', valor: '14,25%', dir: 'estavel', data: dia(-40) }] };
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  fs.writeFileSync(__dirname + '/../site/indicadores.json', JSON.stringify({ atualizado: iso(Date.now()), itens: [
    { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,31', variacao: '+0,50%', dir: 'sobe', data: dia(0), serie: [5.2, 5.25, 5.31] },
    { id: 'ibovespa', nome: 'Ibovespa', valor: '100.000', dir: 'desce', data: dia(-2) },
    { id: 'selic', nome: 'Selic', valor: '13,75%', dir: 'desce', data: dia(-10) },
    { id: 'desemprego', nome: 'Desemprego', valor: '5,3%', dir: 'desce', data: dia(-20) }] }));
  const srv = U.servir('site', 8785); await sleep(800);
  const br = await U.navegador(); const p = U.erros(await br.newPage({ viewport: { width: 390, height: 844 } }), 'ind');
  await p.goto('http://localhost:8785/index.html'); await esperar(p, () => document.querySelectorAll('.post').length > 2, null, 10000); await sleep(1200);
  const it = await p.evaluate(() => indItens().map(x => x.id + '=' + x.valor).join(' '));
  ok(it === 'dolar=R$ 5,31 ibovespa=100.000 selic=13,75% desemprego=5,3%', 'junta: o automático vale onde existe, na ordem', it);
  await p.evaluate(() => go('capa')); await sleep(400);
  ok(await p.evaluate(() => /5,31/.test(document.querySelector('#v-capa').textContent) && /Desemprego/.test(document.querySelector('#v-capa').textContent)), 'capa mostra o automático');
  await p.evaluate(() => { go('feed'); FILTRO = 'economia'; renderPosts() }); await sleep(300);
  ok(await p.evaluate(() => /5,31/.test(document.querySelector('#posts').textContent)), 'Economia mostra o automático');
  await p.reload(); await sleep(300);
  ok(await p.evaluate(() => /5,31/.test(JSON.stringify(indItens()))), 'guardado no aparelho para a próxima abertura');
  // aviso de atraso: feed de 4 h, mas uma rodada registrada há pouco (sem novidade) => sem aviso
  const ra = await p.evaluate(() => { FEED.atualizado_em = new Date(Date.now() - 4 * 3600e3).toISOString(); const h = hojeSP(); const m = minAgoraSP() - 20; S.rodadas = { dia: h, itens: { [Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0')]: { tipo: 'rapida', status: 'sem_mudancas' } } }; const a = horaSP(); return { com: estadoRadar().ok, ativo: a >= 8 && a <= 23, mm: m } });
  if (ra.mm > 0) ok(ra.com === true, "rodada recente sem novidade: sem aviso de atraso", ra);
  const r2 = await p.evaluate(() => { S.rodadas = { dia: '2000-01-01', itens: {} }; const a = horaSP(); return { ok: estadoRadar().ok, ativo: a >= 8 && a <= 23 } });
  ok(r2.ativo ? r2.ok === false : r2.ok === true, 'sem rodada recente: aviso volta (no horário ativo)', r2);
  fs.unlinkSync(__dirname + '/../site/indicadores.json');
  ok(!p._erros.length, 'sem erros ' + p._erros.join('|'));
  const p2 = U.erros(await br.newPage(), 'sem'); await p2.goto('http://localhost:8785/index.html'); await esperar(p2, () => document.querySelectorAll('.post').length > 2, null, 10000); await sleep(800);
  ok(await p2.evaluate(() => indItens().length === 3) && !p2._erros.filter(e => !/404/.test(e)).length, 'sem indicadores.json: usa só o do feed', p2._erros);
  const r = U.resumo(); console.log(`\nRESUMO t_etapa8: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
