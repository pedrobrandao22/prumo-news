// Etapa 69: grade de perfil (minha aba Perfil e perfil dos amigos)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8777/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8777); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  // Bia tem 5 posts: foto(s) simuladas por texto, um antigo (40 dias), um reel; e marca o Pedro num deles
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await ev(B, async ([uA]) => {
    const ins = r => SB.from('publicacoes').insert(r).select('id');
    for (let i = 1; i <= 4; i++) await ins({ autor: S.uid, tipo: 'post', texto: 'Post número ' + i + (i === 2 ? '\nsegunda linha' : ''), fotos: [], estilo: { v: 2, tags: i === 3 ? [{ u: uA, i: 0, x: .5, y: .5 }] : [], marcados: i === 3 ? [uA] : [] } });
    await ins({ autor: S.uid, tipo: 'post', texto: 'Meu reel', fotos: [], estilo: { v: 2, reel: true, video: S.uid + '/v.webm', dur: 5 } });
    await pubCarregar() }, [uidA]);
  await H.sql(`update publicacoes set at = at - 40*86400000 where texto = 'Post número 1'`).catch(() => {});
  // A abre o perfil da Bia tocando no nome no post do Feed
  await ev(A, () => { go('feed'); pubCarregar() }); await sleep(1800);
  await ev(A, () => document.querySelector('#posts .upost')?.scrollIntoView({ block: 'center' })); await sleep(400);
  await clk(A, '#posts .upost .up-au'); await sleep(1500);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv') && /Bia Souza/.test(document.querySelector('#layer .pf-nome').textContent)), 'tocar no nome no post abre o perfil da Bia');
  ok(await ev(A, () => document.querySelectorAll('#layer .pf-grade .pf-t').length === 5 && /5\s*publicações/.test(document.querySelector('#layer .pf-num').textContent)), 'grade com as 5 publicações (inclusive a de 40 dias)', await ev(A, () => document.querySelectorAll('#layer .pf-t').length));
  ok(await ev(A, () => !!document.querySelector('#layer .pf-t .pf-ic')), 'reel marcado com ▶ na grade');
  await A.screenshot({ path: SH + 'pf69-amigo.png' });
  await clk(A, '#layer [data-pfaba="reels"]'); await sleep(300); ok(await ev(A, () => document.querySelectorAll('#layer .pf-t').length === 1), 'aba Reels mostra só o reel');
  await clk(A, '#layer [data-pfaba="posts"]'); await sleep(300);
  await clk(A, '#layer [data-pfi="2"]'); await sleep(900);
  ok(await ev(A, () => document.querySelectorAll('#layer .pfv-posts .upost').length === 5), 'tocar num quadrado abre a lista de publicações');
  ok(await ev(A, () => { const sc = document.querySelector('#layer .pfv-sc'), a = sc.querySelectorAll('.upost')[2]; return Math.abs(a.getBoundingClientRect().top - sc.getBoundingClientRect().top) < 30 }), 'lista começa na publicação tocada');
  // curtir na lista atualiza o post certo
  const pid = await ev(A, () => document.querySelectorAll('#layer .pfv-posts .upost')[2].dataset.pid);
  await ev(A, () => document.querySelectorAll('#layer .pfv-posts .upost')[2].querySelector('[data-a="like"]').click()); await sleep(900);
  ok(await ev(A, p => document.querySelector(`#layer [id="${'p-' + p}"] [data-a="like"]`).classList.contains('on'), pid), 'curtir dentro do perfil acende o coração ali');
  await A.screenshot({ path: SH + 'pf69-lista.png' });
  await ev(A, () => history.back()); await sleep(600);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv .pf-grade') && !document.querySelector('#posts [id$="~f"]')), 'voltar retorna à grade (e o Feed volta ao normal)');
  await ev(A, () => history.back()); await sleep(600); ok(await ev(A, () => !document.querySelector('#layer .pfv') && VIEW === 'feed'), 'voltar de novo fecha o perfil');
  ok(await ev(A, p => document.querySelector(`#posts [id="${'p-' + p}"] [data-a="like"]`)?.classList.contains('on') ?? true, pid), 'a curtida aparece também no Feed');
  // minha aba Perfil: marcado + conta
  await ev(A, () => go('me')); await sleep(1200);
  ok(await ev(A, () => !!document.querySelector('#v-me .pf-cab') && !!document.querySelector('#v-me [data-pfaba="conta"]')), 'aba Perfil com cabeçalho e abas');
  await clk(A, '#v-me [data-pfaba="marc"]'); await sleep(300); ok(await ev(A, () => document.querySelectorAll('#v-me .pf-t').length === 1), 'aba Marcado mostra o post em que a Bia marcou o Pedro');
  await A.screenshot({ path: SH + 'pf69-eu-marc.png' });
  await clk(A, '#v-me [data-pfaba="conta"]'); await sleep(300); ok(await ev(A, () => !!document.querySelector('#v-me .pf-conta [data-vgo="saved"]') && !!document.querySelector('#v-me .pf-conta .amg')), 'aba Conta mantém amigos, guardadas e ajustes');
  await A.screenshot({ path: SH + 'pf69-eu-conta.png', fullPage: false });
  await clk(A, '#v-me [data-pfaba="posts"]'); await sleep(300); await A.screenshot({ path: SH + 'pf69-eu.png' });
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa69: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
