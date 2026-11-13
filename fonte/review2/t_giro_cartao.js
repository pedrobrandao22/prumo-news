// Giro de amigo com cartão de texto (opinião/análise/relato/citação), 12/11: a imagem do cartão já traz o texto, então a
// miniatura na bandeja não põe o título por cima (antes embaralhava). Giro de texto simples continua com o título. Porta 8997.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const path = require('path');
const { montarPasta, PROD } = require('./_qc_comum');
let srv = null;
(async () => {
  montarPasta('xg1'); srv = U.servir('xg1', 8997); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Caio Lima','membro')`, [ids.a, ids.b, ids.c]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  const exp = Date.now() + 20 * 3600e3;
  await H.comoUsuario(ids.b, () => H.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,expira) values ($1,'story',$2,$3,$4,'amigos',$5)`, [ids.b, 'Opinião de Bia Souza: O orçamento não fecha: e cada bancada protege o seu', JSON.stringify([ids.b + '/cartao.jpg']), { v: 2 }, exp]));
  await H.comoUsuario(ids.c, () => H.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,expira) values ($1,'story',$2,'[]',$3,'amigos',$4)`, [ids.c, 'Hoje o debate foi morno demais', { v: 2, fundo: 3 }, exp]));
  const br = await U.navegador();
  const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids.a, email: 'a@x' } }, viewport: { width: 390, height: 800 }, ctx: { deviceScaleFactor: 2, isMobile: true, hasTouch: true } }), 'Pedro');
  await p.addInitScript(PROD); await p.goto('http://localhost:8997/index.html');
  await esperar(p, () => typeof VIEW !== 'undefined' && S.membro && PUB.on === true, null, 20000);
  await p.evaluate(() => { go('feed'); scrollTo(0, 0) });
  const lido = u => p.evaluate(u => { const b = document.querySelector(`#secs [data-ustory="${u}"]`); if (!b) return null; const t = b.querySelector('.vn-tl-tx'); return { tem: !!t, tit: t && t.querySelector('b') ? t.querySelector('b').textContent : '', img: !!b.querySelector('.vn-tl-bg img') } }, u);
  ok(await esperar(p, u => !!document.querySelector(`#secs [data-ustory="${u}"] .vn-tl`), ids.b, 10000), 'giro da Bia na bandeja');
  const b = await lido(ids.b), c = await lido(ids.c);
  ok(b && b.tem && !b.tit, 'cartão de texto: miniatura sem título por cima (a imagem já traz o texto)', b);
  ok(c && c.tit === 'Hoje o debate foi morno demais', 'giro de texto simples: título continua na miniatura', c);
  ok(p._erros.length === 0, 'sem erros', p._erros);
  await br.close(); srv.kill(); require('fs').rmSync(path.join(__dirname, '..', 'xg1'), { recursive: true, force: true });
  const R = U.resumo(); console.log(`RESUMO t_giro_cartao: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
