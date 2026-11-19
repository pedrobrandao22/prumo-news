// Corretor 18/11 tarde (190): na tela "Notícia" o botão "Giro" fechava tudo e o comentário sumia (criação de giros escondida
// desde 17/11). Agora o botão não aparece, "Publicar" fica sozinho e largo, e nada fecha se o caminho antigo for chamado. Porta 9141.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:9141/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 9141); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000);

  // 1. "O que você acha?" (notícia já escolhida): só "Publicar", sem "Giro"
  const pid = await ev(A, () => (FEED.pautas || []).find(p => p && p.id)?.id);
  await ev(A, (p) => { cn102Comeca('nt', { pid: p }) }, pid); await sleep(600);
  ok(await ev(A, () => !!document.querySelector('#ce-leg')), 'O que você acha?: formulário da notícia aberto');
  ok(await ev(A, () => !document.querySelector('#layer [data-cn102nst]')), 'sem o botão "Giro" na tela Notícia');
  ok(await ev(A, () => { const b = document.querySelector('#layer .cn102-share [data-edpubpo]'), s = document.querySelector('#layer .cn102-share');
    return !!b && !!s && b.getBoundingClientRect().width >= s.getBoundingClientRect().width - 40 }), '"Publicar" sozinho e largo');
  await A.fill('#ce-leg', 'Meu comentário sobre a notícia'); await sleep(200);
  ok(await ev(A, () => !document.querySelector('#layer [data-cn102nst]')), 'escrever não traz o "Giro" de volta');
  // 2. caminho antigo chamado direto: nada fecha e o texto continua
  await ev(A, () => cn102PostParaStory()); await sleep(500);
  ok(await ev(A, () => document.querySelector('#ce-leg')?.value === 'Meu comentário sobre a notícia'), 'chamar o caminho antigo do giro não fecha nem apaga o comentário');
  // 3. + > Notícia > escolher: também sem "Giro"
  await ev(A, () => document.querySelector('#layer .ce-ph [data-edvolta]')?.click()); await sleep(500);
  await clk(A, '[data-cp152ax="nt"]'); await sleep(600);
  await ev(A, () => document.querySelector('#layer > .cp152 [data-fc164nt]')?.click()); await sleep(400);
  // 19/11: a notícia entra na própria caixa (não há mais a tela com "Giro" no caminho)
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152 .cr155-nt') && !document.querySelector('#layer [data-cn102nst]')), '+ > Notícia: fica na caixa, sem o botão "Giro"');
  ok(await ev(A, () => document.getElementById('b-criar')?.getAttribute('aria-label') !== 'Criar post ou giro'), 'o "+" do topo não fala mais em giro para o leitor de tela');
  await U.foto(A, 'corretor-1811b-sem-giro');
  // 4. com os formatos religados (só nos testes), o botão volta
  await ev(A, () => { cn102Comeca('nt', { pid: FEED.pautas[0].id }); FT182_ESCONDE = []; try { edDesenha() } catch (e) {} }); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer [data-cn102nst]')), 'com giro religado, o botão volta (código guardado)');
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1811b: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
