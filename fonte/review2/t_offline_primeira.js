// Primeira visita que fecha o app antes do detalhe chegar (147, 13/11): o detalhe começa a baixar junto com a Capa, o leve
// fica guardado até a edição inteira ir para o aparelho e, abrindo sem internet sem edição guardada, a Capa sai do leve.
// Serve uma cópia do site com a edição real do repositório (pasta fl147t/, apagada no fim). Porta 8736.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path'); const cp = require('child_process');
const DIR = path.join(__dirname, '..', 'fl147t'), BASE = 'http://localhost:8736/';
const JPG = fs.readFileSync(path.join(__dirname, 'etapa13', 'foto.jpg'));
(async () => {
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = new Date(Date.now() - 12 * 60000 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
  fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F)); cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]);
  const srv = U.servir('fl147t', 8736); await sleep(900);
  const H = await require('../harness').criar(); const b = await U.navegador();
  async function abrir(o = {}) {
    const p = U.erros(await H.pagina(b), o.nome || 'P'); const ctx = p.context(); const det = [];
    await ctx.route(u => !/^localhost$|^127\./.test(u.hostname) && /\.(jpe?g|png|webp|gif)$/i.test(u.pathname), r => r.fulfill({ body: JPG, contentType: 'image/jpeg' }));
    await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-teste-tour', '1'); localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
    p.on('request', r => { if (/feed-det\//.test(r.url())) det.push(Date.now()) });
    if (o.prender) await ctx.route('**/feed-det/*.json', () => { });  // nunca responde: o app "fecha" antes do detalhe
    await p.goto(BASE + 'index.html'); return { p, ctx, det };
  }
  const capaOk = p => esperar(p, () => typeof VIEW !== 'undefined' && VIEW === 'capa' && !!document.querySelector('#v-capa .cpi'), null, 15000);
  const ls = (p, k) => p.evaluate(k => { try { return localStorage.getItem(k) } catch (e) { return null } }, k);

  // 1. visita normal: o detalhe é pedido junto com a Capa, e o leve guardado sai quando a edição inteira é guardada
  const A = await abrir({ nome: 'A' });
  ok(await capaOk(A.p), 'Capa aparece');
  ok(await esperar(A.p, () => typeof FL119 !== 'undefined' && !FL119.parcial && !!localStorage.getItem('radar-feed'), null, 15000), 'detalhe chega e a edição inteira vai para o aparelho');
  ok(A.det.length === 1, 'o detalhe é pedido uma vez só', A.det.length);
  ok(!(await ls(A.p, 'prumo-fl-leve')), 'com a edição inteira guardada, o leve guardado sai');
  await A.ctx.close();

  // 2. detalhe nunca chega: o leve fica guardado; reabrindo sem internet, a Capa sai do leve (antes: "Não consegui carregar")
  const B = await abrir({ nome: 'B', prender: true });
  ok(await capaOk(B.p), 'Capa com o detalhe preso');
  await sleep(2500); ok(B.det.length === 1, 'o detalhe é pedido uma vez só (o download que começou com a Capa é o mesmo que o app usa)', B.det.length);
  const leve = await ls(B.p, 'prumo-fl-leve');
  ok(!!leve && /^\{"_leve"/.test(leve) && !(await ls(B.p, 'radar-feed')), 'sem o detalhe, o leve fica guardado no aparelho');
  // service worker registrado à mão (como no t_feed_leve), para a página abrir sem internet
  await B.p.evaluate(async () => { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready }); await B.p.goto(BASE + 'index.html'); await capaOk(B.p); await sleep(1500);
  ok(!(await B.p.evaluate(() => localStorage.getItem('radar-feed'))), 'ainda sem a edição inteira no aparelho');
  await B.ctx.unroute('**/feed-det/*.json'); await B.ctx.setOffline(true); const B2 = B.p; await B2.goto(BASE + 'index.html').catch(e => console.log('nav', e.message));
  ok(await capaOk(B2), 'sem internet e sem edição guardada: a Capa abre com o leve guardado');
  ok(await B2.evaluate(() => !/Não consegui carregar as notícias/.test(document.body.textContent) && typeof OFFLINE !== 'undefined' && OFFLINE === true), 'sem o aviso de erro, e o app sabe que está sem internet');
  await B.ctx.setOffline(false);
  await B2.evaluate(() => dispatchEvent(new Event('online')));
  ok(await esperar(B2, () => !FL119.parcial && FEED.pautas.some(x => x.neutro && x.neutro.texto), null, 15000), 'a conexão volta: o detalhe chega e a edição se completa', await B2.evaluate(() => ({ parcial: !!FL119.parcial, prom: !!FL119.prom, pre: !!FL147.pre, temTexto: FEED && FEED.pautas.some(x => x.neutro && x.neutro.texto), on: navigator.onLine })));
  ok([...B2._erros].filter(e => !/Failed to fetch|NetworkError|ERR_INTERNET|net::/i.test(String(e))).length === 0, 'sem erros', B2._erros);
  await b.close(); srv.kill(); fs.rmSync(DIR, { recursive: true, force: true });
  const R = U.resumo(); console.log(`RESUMO t_offline_primeira: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { fs.rmSync(DIR, { recursive: true, force: true }) } catch (_) { } process.exit(2) });
