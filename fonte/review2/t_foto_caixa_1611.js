// Foto dentro da caixa de criar (164, 16/11): escolher a foto volta para a caixa em miniatura, com o texto; tocar na miniatura
// abre o corte/ajuste e Concluir (ou ×) volta; tirar a foto; Publicar sai com texto e fotos. Porta 8680.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8680/index.html', FOTO = __dirname + '/etapa13/foto.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const escolhe = async (A, fotos) => { const [fch] = await Promise.all([A.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(A, '#layer > .cp152 [data-cp152ax="foto"]')]); if (fch) await fch.setFiles(fotos); return !!fch };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8680); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000);
  await ev(A, () => criarMenu()); await sleep(400);
  await A.fill('#cp152-tx', 'Fim de tarde no Aterro');
  ok(await escolhe(A, [FOTO]), 'Foto abre a galeria no mesmo toque');
  ok(await esperar(A, () => document.querySelectorAll('#layer > .cp152 .fc164 img').length === 1, null, 5000), 'a foto volta para a caixa em miniatura');
  ok(await ev(A, () => document.getElementById('cp152-tx').value === 'Fim de tarde no Aterro' && !document.querySelector('[data-cp152pub]').disabled), 'o texto continua na caixa e Publicar está ligado');
  ok(await ev(A, () => { const i = document.querySelector('#layer .fc164 img'); return i.naturalWidth > 0 || /^(blob|data):/.test(i.src) }), 'a miniatura mostra a foto');
  await U.foto(A, 'foto-caixa-1611-miniatura');
  // mais uma foto pelo "+"
  const [f2] = await Promise.all([A.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), clk(A, '#layer > .cp152 .fc164-mais')]);
  ok(!!f2, '"+" ao lado das miniaturas abre a galeria'); if (f2) await f2.setFiles([FOTO]);
  ok(await esperar(A, () => document.querySelectorAll('#layer > .cp152 .fc164 img').length === 2, null, 5000), 'a foto nova se junta à outra e volta para a caixa');
  // tocar na miniatura: corte/ajuste; × volta sem perder nada
  await clk(A, '#layer > .cp152 [data-fc164ed="1"]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer .ce.ce-post') && /Fotos do post/.test(document.querySelector('#layer .ce-ph b').textContent) && ED.po.cur === 1), 'tocar na miniatura abre o corte daquela foto');
  await clk(A, '#layer .ce [data-edar]'); await sleep(150); await clk(A, '#layer .ce [data-edav]'); await sleep(300);
  ok(await ev(A, () => /Concluir/.test(document.querySelector('#layer .ce [data-edav]').textContent)), 'na tela de filtros o botão é Concluir');
  await clk(A, '#layer .ce [data-edflt="clarendon"]'); await sleep(200); await clk(A, '#layer .ce [data-edav]'); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && document.getElementById('cp152-tx').value === 'Fim de tarde no Aterro' && CP152.ed.po.fotos[1].f === 'clarendon'), 'Concluir volta para a caixa com o texto e o filtro');
  // tirar uma foto
  await clk(A, '#layer > .cp152 [data-fc164x="0"]'); await sleep(300);
  ok(await ev(A, () => document.querySelectorAll('#layer > .cp152 .fc164 img').length === 1), 'o × tira a foto da caixa');
  await U.foto(A, 'foto-caixa-1611-depois');
  // publicar
  await clk(A, '#layer > .cp152 [data-cp152pub]');
  ok(await esperar(A, () => PUB.itens.some(x => x.tipo === 'post' && x.fotos.length === 1 && /Fim de tarde no Aterro/.test(x.texto || '')), null, 9000), 'Publicar sai com o texto e a foto');
  ok(await ev(A, () => !document.querySelector('#layer > .cp152') && CP152.ed === null), 'depois de publicar a caixa fecha e as fotos não ficam guardadas');
  await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#layer .fc164')), 'caixa nova começa sem fotos');
  // desistir na galeria volta para a caixa com o texto
  await A.fill('#cp152-tx', 'Outro'); await escolhe(A, []); await sleep(300); await ev(A, () => { const f = document.getElementById('ce-pfile'); f && f.dispatchEvent(new Event('cancel')) }); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && document.getElementById('cp152-tx').value === 'Outro'), 'desistir da galeria volta para a caixa com o texto');
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_foto_caixa_1611: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
