// Corretor 17/11 noite (172): foto de paisagem de Goiânia no Fies sai do acervo; letra grande no iPhone SE deixa a fileira
// de ações só com ícones quando "Comentar"/"Repostar" seriam cortados; Perfil vazio com "Minhas colunas" e "Coberturas
// que sigo" lado a lado e "Nova publicação" acima da barra de baixo. Portas 8763–8764.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8763, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const GOI = 'https://upload.wikimedia.org/wikipedia/commons/8/88/Vista_de_Goi%C3%A2nia_a_partir_da_Faculdade_de_Ci%C3%AAncias_e_Tecnologia%2C_Campus_Aparecida_de_Goi%C3%A2nia%2C_Universidade_Federal_de_Goi%C3%A1s%2C_maio_de_2025_%2813%29.jpg';
const REI = 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Reitoria_da_Universidade_Federal_de_Goi%C3%A1s.jpg';
const acts = p => ev(p, () => [...document.querySelectorAll('#v-feed .post .acts')].filter(a => a.offsetParent).slice(0, 4).map(a => ({
  ic: a.classList.contains('fc172-ic'), corta: [...a.querySelectorAll(':scope>.act>span')].some(s => s.offsetWidth && s.scrollWidth > s.clientWidth + 1),
  sai: [...a.querySelectorAll(':scope>.act')].some(b => b.offsetWidth && b.getBoundingClientRect().right > innerWidth), rot: [...a.querySelectorAll(':scope>.act>span')].filter(s => s.offsetWidth).map(s => s.textContent.trim()).join('|'),
  aria: [...a.querySelectorAll(':scope>.act')].map(b => b.getAttribute('aria-label')).join('|') })));
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800); const br = await U.navegador();
  // 1 e 2: sem conta, iPhone SE
  const ctx = await br.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await ctx.route(/^https:\/\/upload\.wikimedia\.org\//, r => r.abort());
  const p = U.erros(await ctx.newPage(), 'se'); await p.goto(BASE);
  await esperar(p, () => document.querySelectorAll('.post').length > 0, null, 15000); await sleep(500);
  const b = await ev(p, ([g, r]) => ({ goi: ft157Bloq({ url: g }), rei: ft157Bloq({ url: r }) }), [GOI, REI]);
  ok(b.goi, 'a "Vista de Goiânia a partir da Faculdade" (paisagem no Fies) está bloqueada', b);
  ok(!b.rei, 'a Reitoria da UFG continua liberada', b);
  await ev(p, () => { try { closeLayer() } catch (e) {} go('feed') }); await sleep(900);
  const a1 = await acts(p);
  ok(a1.length && a1.every(x => !x.ic && !x.corta && /Comentar/.test(x.rot)), 'letra normal no iPhone SE: "Comentar" e "Repostar" inteiros, com nome', a1);
  await ev(p, () => { PREF.fonte = 1.4; aplicarFonte() }); await sleep(700);
  const a2 = await acts(p);
  ok(a2.length && a2.every(x => !x.corta && !x.sai), 'letra no máximo no iPhone SE: nenhum rótulo cortado ("Come…") e a fileira cabe', a2);
  ok(a2.every(x => /Comentar/.test(x.aria) && /Repostar/.test(x.aria)), 'os botões continuam com nome para o leitor de tela', a2[0]);
  await U.foto(p, 'c172-letra-grande-se');
  await ev(p, () => { PREF.fonte = 1; aplicarFonte() }); await sleep(700);
  const a3 = await acts(p);
  ok(a3.every(x => !x.ic && /Comentar/.test(x.rot)), 'voltar a letra ao normal devolve os nomes', a3);
  ok(!p._erros.length, 'sem erros no console (sem conta)', p._erros);
  // 3: Perfil vazio com os dois cartões
  const H = await require('../harness').criar();
  const A = U.erros(await H.pagina(br, { viewport: { width: 390, height: 664 } }), 'A');
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  if (!(await A.$('#lcod'))) { await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(A, '#avisoconta [data-entrar]'); await clk(A, '[data-laba="criar"]') }
  await A.fill('#lnome', 'Pedro Brandão'); await A.fill('#lemail', 'a@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]');
  await esperar(A, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await A.$('.sheet')) { await ev(A, () => closeLayer()); await sleep(250) }
  await ev(A, () => { PREF.seguindo = Object.assign({}, PREF.seguindo, { 'ajuste fiscal': 'Ajuste fiscal', 'cop30': 'COP30' }); try { savePref() } catch (e) {} go('me'); scrollTo(0, 0) }); await sleep(600);
  const pf = await ev(A, () => { const d = document.querySelector('#v-me .fc172-dupla'), bt = document.querySelector('#v-me .pf-vz [data-criarde="post"]'), n = document.querySelector('.nav');
    const cs = d ? [...d.querySelectorAll('.pf-cols')].map(x => x.getBoundingClientRect()) : [];
    return { dupla: !!d, n: cs.length, mesma: cs.length === 2 && Math.abs(cs[0].top - cs[1].top) < 2, nomes: d ? d.textContent.replace(/\s+/g, ' ').trim() : '',
      b: bt ? Math.round(bt.getBoundingClientRect().bottom) : null, nav: n ? Math.round(n.getBoundingClientRect().top) : null } });
  ok(pf.dupla && pf.mesma && /Minhas colunas/.test(pf.nomes) && /Coberturas que sigo/.test(pf.nomes), '"Minhas colunas" e "Coberturas que sigo" lado a lado no Perfil', pf);
  ok(pf.b != null && pf.b <= pf.nav - 4, '"Nova publicação" do Perfil vazio inteiro acima da barra de baixo, sem rolar (com os dois cartões)', pf);
  await U.foto(A, 'c172-perfil-vazio');
  await clk(A, '#v-me [data-mt158cobs]'); await sleep(400);
  ok(await ev(A, () => /Coberturas que sigo/.test((document.querySelector('#layer') || {}).textContent || '')), 'tocar em "Coberturas que sigo" abre a lista');
  await ev(A, () => closeLayer()); await sleep(250);
  await clk(A, '#v-me [data-cp152cols]'); await sleep(400);
  ok(await ev(A, () => /Minhas colunas/.test((document.querySelector('#layer') || {}).textContent || '')), 'tocar em "Minhas colunas" abre a lista');
  ok(!A._erros.length, 'sem erros no console (Perfil)', A._erros);
  await br.close(); srv.kill();
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_1711b: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('ERRO', e); process.exit(1) });
