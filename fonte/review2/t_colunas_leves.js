// Feed sem o texto longo das colunas (146, 13/11): a lista de publicações vem sem publicacoes.corpo; o cartão usa a chamada
// e os minutos guardados no aparelho (busca o corpo só da coluna nunca vista) e ler/editar buscam o texto antes de abrir. Porta 8999.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const path = require('path');
const { montarPasta, PROD } = require('./_qc_comum');
let srv = null;
(async () => {
  montarPasta('xcl'); srv = U.servir('xcl', 8999); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const par = 'O orçamento de 2027 chega ao Congresso com uma conta que não fecha sem cortes. ' + 'Cada bancada protege a sua emenda e o governo tenta segurar o gasto obrigatório. '.repeat(14);
  const corpo = [par, par, par, par].join('\n\n');
  await H.comoUsuario(ids.b, () => H.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,'[]',$3,'amigos',$4)`, [ids.b, 'A conta do orçamento\n\nO que está em jogo', { v: 2, coluna: { v: 1, tit: 'A conta do orçamento', linha: 'O que está em jogo' } }, corpo]));
  await H.comoUsuario(ids.b, () => H.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico) values ($1,'post',$2,'[]',$3,'amigos')`, [ids.b, 'Post comum da Bia', { v: 2, fundo: 2 }]));
  const br = await U.navegador();
  const abre = async (uid, email) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } }, viewport: { width: 390, height: 800 }, ctx: { deviceScaleFactor: 2, isMobile: true, hasTouch: true } }), email);
    await p.addInitScript(PROD); await p.goto('http://localhost:8999/index.html'); await esperar(p, () => typeof VIEW !== 'undefined' && S.membro && PUB.on === true && PUB.carregou, null, 20000);
    await p.evaluate(() => { go('feed'); scrollTo(0, 0) }); return p };
  const P = await abre(ids.a, 'a@x');
  const col = () => P.evaluate(() => { const x = PUB.itens.find(y => y.estilo && y.estilo.coluna); const n = PUB.itens.find(y => y.texto === 'Post comum da Bia'); const el = x && document.querySelector(`.cs123-card[data-cs123ler="${x.id}"]`);
    return x && { id: x.id, temCorpo: typeof x.corpo === 'string', comumSemCorpo: !!n && !('corpo' in n), tz: el && (el.querySelector('.cs123-x') || {}).textContent || '', min: el && (el.querySelector('.cs123-min') || {}).textContent || '' } });
  ok(await esperar(P, () => !!document.querySelector('.cs123-card .cs123-x'), null, 10000), 'cartão da coluna com a chamada no Feed');
  let c = await col();
  ok(c && c.comumSemCorpo, 'a lista do Feed vem sem o texto longo (post comum nem traz o campo)', c);
  ok(c && /^O orçamento de 2027/.test(c.tz) && c.min === '4 min de leitura', 'coluna nunca vista: busca o texto uma vez e acerta chamada e minutos', c);
  // recarrega: a chamada vem do aparelho e o texto longo não é baixado
  await P.reload(); await esperar(P, () => typeof VIEW !== 'undefined' && S.membro && PUB.on === true && PUB.carregou, null, 20000); await P.evaluate(() => { go('feed'); scrollTo(0, 0) });
  await esperar(P, () => !!document.querySelector('.cs123-card'), null, 10000); await sleep(800);
  c = await col();
  ok(c && !c.temCorpo && /^O orçamento de 2027/.test(c.tz) && c.min === '4 min de leitura', 'depois de recarregar: cartão completo sem baixar o texto de novo', c);
  // ler a coluna busca o texto antes de abrir
  await P.evaluate(id => cs123Abrir(id), c.id);
  ok(await esperar(P, () => (document.querySelectorAll('#layer .cs123-corpo p').length >= 4), null, 8000), 'ler a coluna: o texto inteiro abre');
  await P.evaluate(() => closeLayer());
  // a autora edita depois de recarregar: o editor vem com o texto
  const B = await abre(ids.b, 'b@x');
  await B.evaluate(id => ed132Edita(id), c.id);
  ok(await esperar(B, () => /O orçamento de 2027/.test((document.querySelector('#ed132-corpo') || {}).innerHTML || ''), null, 8000), 'editar a coluna: o editor abre com o texto');
  ok(P._erros.length === 0 && B._erros.length === 0, 'sem erros', [P._erros, B._erros]);
  await br.close(); srv.kill(); require('fs').rmSync(path.join(__dirname, '..', 'xcl'), { recursive: true, force: true });
  const R = U.resumo(); console.log(`RESUMO t_colunas_leves: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
