// Sem sessão (com config) e sem config: lê o feed, aviso com Entrar, gostar abre o login, sem erros.
const U = require('./t_util');
async function foto2(p, n) { await U.foto(p, n + '-claro'); await p.evaluate(() => document.documentElement.setAttribute('data-aparencia', 'escuro')); await U.foto(p, n + '-escuro'); await p.evaluate(() => document.documentElement.removeAttribute('data-aparencia')) }
(async () => {
  U.feedFresco('site'); U.feedFresco('site-semconfig');
  const s1 = U.servir('site', 8768), s2 = U.servir('site-semconfig', 8769);
  await U.sleep(800);
  const H = await require('./harness').criar();
  const b = await U.navegador();
  for (const [nome, url, fake] of [['com config', 'http://localhost:8768/index.html', true], ['sem config', 'http://localhost:8769/index.html', true], ['sem config e sem CDN', 'http://localhost:8769/index.html', false]]) {
    let page;
    if (fake) page = await H.pagina(b);
    else { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); await ctx.route('**/supabase.js', r => r.abort()); page = await ctx.newPage() }
    U.erros(page, nome);
    await page.goto(url);
    U.ok(await U.esperar(page, () => document.querySelectorAll('.post').length > 0), nome + ': feed carregou');
    U.ok(await U.esperar(page, () => /Você está só lendo/.test(document.querySelector('#avisoconta')?.textContent || '')), nome + ': aviso "Você está só lendo"');
    U.ok(await page.$('#avisoconta [data-entrar]') != null, nome + ': aviso tem botão Entrar');
    await page.click('.post [data-a="like"]');
    U.ok(await U.esperar(page, () => !!document.querySelector('#lform')), nome + ': gostar abre o login');
    U.ok(await page.$eval('.sheet', e => /Entrar no Prumo/.test(e.textContent)), nome + ': janela de login');
    if (nome === 'com config') await foto2(page, 'login');
    // tenta entrar
    await page.fill('#lemail', 'ninguem@x.com'); await page.fill('#lsenha', '123456'); await page.click('#lform [type=submit]');
    await U.sleep(500);
    const err = await page.$eval('#lerro', e => e.hidden ? '' : e.textContent).catch(() => '');
    U.ok(nome === 'com config' ? /E-mail ou senha errados/.test(err) : /não está disponível/.test(err), nome + ': erro de login em português', err);
    // aba criar conta
    await page.click('[data-laba="criar"]');
    U.ok(await U.esperar(page, () => !!document.querySelector('#lcod')), nome + ': aba Criar conta');
    await page.fill('#lnome', 'X'); await page.fill('#lemail', 'x@x.com'); await page.fill('#lsenha', '123'); await page.click('#lform [type=submit]');
    await U.sleep(200);
    U.ok(/pelo menos 6/.test(await page.$eval('#lerro', e => e.textContent)), nome + ': senha curta');
    if (nome === 'com config') await foto2(page, 'criar-conta');
    await page.click('[data-laba="entrar"]'); await page.click('[data-esqueci]');
    U.ok(await page.$eval('#lesq', e => !e.hidden && /redefine a sua senha/.test(e.textContent)), nome + ': esqueci a senha');
    await page.click('[data-close]');
    // abas sem conta
    for (const v of ['capa', 'msgs', 'busca', 'saved', 'play', 'me']) { if (v === 'saved' || v === 'play') await page.evaluate(x => go(x), v); else await page.click('#t-' + v); await U.sleep(150) }
    U.ok(await page.$eval('#v-me', e => /Você está só lendo/.test(e.textContent)), nome + ': Perfil sem conta');
    await page.click('[data-privacidade]');
    U.ok(await U.esperar(page, () => /Supabase/.test(document.querySelector('.sheet')?.textContent || '')), nome + ': política de privacidade');
    if (nome === 'com config') await foto2(page, 'privacidade');
    await page.click('[data-close]');
    await page.click('#t-feed'); await U.sleep(200);
    // abre um story e uma enquete sem conta
    await page.click('[data-sec-story]'); await U.sleep(300); await page.keyboard.press('Escape'); await U.sleep(200);
    const ult = await page.evaluate(() => { const r = document.getElementById('tkrun'); return r ? r.style.transform : '' }); await U.sleep(600);
    const ult2 = await page.evaluate(() => { const r = document.getElementById('tkrun'); return r ? r.style.transform : '' });
    U.ok(ult && ult !== ult2, nome + ': faixa Últimas correndo', [ult, ult2]);
    U.ok(page._erros.length === 0, nome + ': sem erros de JS', page._erros);
  }
  // supabase-js de verdade (2.117.2, do node_modules), servidor inalcançável: abre só leitura, login dá erro em português
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    await ctx.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'application/javascript', path: __dirname + '/node_modules/@supabase/supabase-js/dist/umd/supabase.js' }));
    await ctx.route('https://teste.supabase.co/**', r => r.abort());
    const p = U.erros(await ctx.newPage(), 'supabase real'); p._erros = [];
    await p.goto('http://localhost:8768/index.html');
    U.ok(await U.esperar(p, () => typeof SB !== 'undefined' && SB && /Você está só lendo/.test(document.querySelector('#avisoconta')?.textContent || ''), null, 8000), 'supabase real: cliente criado e aviso de leitura');
    await p.click('#avisoconta [data-entrar]'); await p.fill('#lemail', 'a@x.com'); await p.fill('#lsenha', '123456'); await p.click('#lform [type=submit]');
    U.ok(await U.esperar(p, () => /Sem conexão|Não deu certo/.test(document.querySelector('#lerro')?.textContent || ''), null, 15000), 'supabase real: falha de rede vira mensagem em português', await p.$eval('#lerro', e => e.textContent).catch(() => ''));
    const errs = p._erros.filter(x => !/teste\.supabase\.co|ERR_FAILED|Failed to fetch/.test(x));
    U.ok(errs.length === 0, 'supabase real: sem erros de JS', errs);
    await ctx.close();
  }
  // convite pela URL sem sessão abre direto "Criar conta" com o código e limpa o parâmetro
  const p = U.erros(await H.pagina(b), 'convite');
  await p.goto('http://localhost:8768/index.html?convite=abcd2345');
  U.ok(await U.esperar(p, () => document.querySelector('#lcod')?.value === 'ABCD2345'), 'link de convite abre Criar conta com o código');
  U.ok(await p.evaluate(() => !location.search.includes('convite')), 'parâmetro convite some da URL');
  U.ok(p._erros.length === 0, 'convite: sem erros de JS', p._erros);
  const r = U.resumo(); console.log(`\nRESUMO t_leitura: ${r.OKS} ok, ${r.FALHAS} falhas`);
  await b.close(); s1.kill(); s2.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
