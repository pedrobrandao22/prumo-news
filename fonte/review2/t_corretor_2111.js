// Corretor 21/11 (madrugada). Feed com o dólar da reserva velha do feed.json (R$ 5,02 de "quinta (22)") quando se vai ao
// Feed: o teste de 20/11 (t_corretor_2011b) apagava o feed-leve.json, e o site real abre pelo leve + detalhe (119). Aqui o
// site abre como o real (leve + detalhe, reserva de 22/10 no feed) em vários tempos de chegada do indicadores.json e do
// detalhe, e com edição guardada no aparelho; o Feed (cartões do topo e lista) nunca mostra R$ 5,02. Porta 9431.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const PORTA = 9431, BASE = `http://localhost:${PORTA}/index.html`, SITE = path.join(__dirname, '..', 'site');
(async () => {
  const f = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8'));
  const sp = new Date(Date.now() - 12 * 60000 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00'; f.atualizado_em = sp;
  // reserva velha (como estava até 20/11 13h50): dólar R$ 5,02 de 22/10, Ibovespa 205.260
  f.indicadores.itens.forEach(x => { if (x.id === 'dolar') Object.assign(x, { valor: 'R$ 5,02', variacao: '-0,06%', data: '2026-10-22' });
    if (x.id === 'ibovespa') Object.assign(x, { valor: '205.260', variacao: '-0,60%', data: '2026-10-22' }) });
  // cartão do dólar com título fixo: o título do dia muda (24/11: "Dólar cai a {dolar}…") e o histórico de títulos traz
  // "…fecha a R$ 5,93" escrito à mão, que não vem do indicadores.json; o teste confere só o número que vem dele
  { const pd = f.pautas.find(p => JSON.stringify(p.neutro || {}).includes('{dolar}')) || f.pautas.find(p => JSON.stringify(p).includes('{dolar}')) || f.pautas[f.pautas.length - 1];
    if (pd) { pd.neutro = Object.assign(pd.neutro || {}, { titulo: 'Dólar fecha a {dolar} na {dolar.dia}' }); delete pd.titulos } }
  fs.writeFileSync(path.join(SITE, 'feed.json'), JSON.stringify(f));
  try { fs.rmSync(path.join(SITE, 'feed-det'), { recursive: true, force: true }) } catch (e) {}
  execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(SITE, 'feed.json'), '--saida', SITE]);
  ok(fs.existsSync(path.join(SITE, 'feed-leve.json')), 'site com feed-leve.json, como o real');
  const IND = fs.readFileSync(path.join(U.REPO, 'indicadores.json'), 'utf8'); const dolar = JSON.parse(IND).itens.find(x => x.id === 'dolar').valor;
  U.servir('site', PORTA); await sleep(800); const b = await U.navegador();
  const CENAS = [
    // [nome, atraso do indicadores, atraso do detalhe, espera antes de tocar em Feed, edição guardada]
    ['indicadores em 2,5 s, Feed logo', 2500, 0, 0, false],
    ['indicadores antes, Feed 4 s depois', 200, 0, 4000, false],
    ['indicadores antes do detalhe (detalhe em 3 s), Feed em 1 s', 200, 3000, 1000, false],
    ['detalhe antes, indicadores em 5 s, Feed em 1 s', 5000, 0, 1000, false],
    ['volta ao site (edição e indicadores guardados), Feed em 1 s', 1500, 0, 1000, true],
  ];
  for (const [nome, atrInd, atrDet, espera, guardada] of CENAS) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    await ctx.route(/indicadores\.json/, async r => { await sleep(atrInd); r.fulfill({ status: 200, contentType: 'application/json', body: IND }) });
    if (atrDet) await ctx.route(/feed-det\//, async r => { await sleep(atrDet); r.continue() });
    const P = U.erros(await ctx.newPage(), 'P');
    if (guardada) {  // primeira visita completa, depois volta
      await P.goto(BASE); await esperar(P, () => window.FEED && FEED.pautas && typeof IND_AUTO !== 'undefined' && IND_AUTO, null, 15000); await sleep(1500);
      await P.evaluate(() => { try { localStorage.removeItem('prumo-guia') } catch (e) {} }); await P.goto(BASE);
    } else await P.goto(BASE);
    await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#t-feed'), null, 15000);
    if (espera) await sleep(espera);
    await P.evaluate(() => { try { localStorage.removeItem('prumo-guia') } catch (e) {} document.querySelector('#t-feed').click() });
    await sleep(Math.max(atrInd, atrDet) + 2500);
    let txt = await P.evaluate(() => (document.querySelector('#v-feed') || document.body).innerText);
    const topo = await P.evaluate(() => (document.querySelector('#secs') || {}).innerText || '');
    for (let i = 0; i < 25 && !/Dólar fecha a R\$ [\d,]+ na /.test(txt); i++) { await P.evaluate(() => window.scrollBy(0, 700)); await sleep(200); txt += await P.evaluate(() => (document.querySelector('#v-feed') || document.body).innerText) }
    const m = /Dólar fecha a (R\$ [\d,]+) na /.exec(txt);
    ok(m && m[1] === dolar, `${nome}: cartão do dólar no Feed com ${dolar}`, m && m[0]);
    ok(!/R\$ 5,02|205\.260|quinta \(22\)/.test(txt + topo), `${nome}: nada da reserva velha (R$ 5,02, 205.260, quinta (22)) no Feed`,
      (/.{0,80}(R\$ 5,02|205\.260|quinta \(22\)).{0,40}/.exec(txt + topo) || [''])[0]);
    ok(!P._erros.length, `${nome}: sem erros na página ` + P._erros.join('|'));
    await ctx.close();
  }
  await b.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
