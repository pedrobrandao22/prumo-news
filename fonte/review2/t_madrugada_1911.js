// Madrugada 19/11 (achados do testador): Curtir sem internet marca na hora e o 2º toque desfaz; barras do gráfico
// proporcionais (108 × 116); "só do centro" só quando todos os veículos têm classificação; a troca "Destaques" →
// "Coleções" não entra nas ilustrações; "Tentar de novo" sem quebra. Porta 9302.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9302, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true }), 'Pixel');
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  if (!(await A.$('#lcod'))) { await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await A.$eval('#avisoconta [data-entrar]', e => e.click()); await A.$eval('[data-laba="criar"]', e => e.click()) }
  await A.fill('#lnome', 'Teste'); await A.fill('#lemail', 't@x.com'); await A.fill('#lsenha', '123456'); await A.$eval('#lform [type=submit]', e => e.click());
  await esperar(A, () => S.membro, null, 8000); await sleep(600); if (await A.$('.sheet')) { await ev(A, () => closeLayer()); await sleep(250) }
  await ev(A, () => { go('feed'); scrollTo(0, 0) }); await sleep(600);
  const pid = await ev(A, () => { const p = document.querySelector('#posts .post[id^="p-"]:not([id^="p-u:"])'); return p && p.id.slice(2) });
  const est = () => ev(A, p => { const b = document.querySelector(`[id="p-${p}"] [data-a="like"]`); return { on: b.getAttribute('aria-pressed') === 'true' || b.classList.contains('on'), t: [...document.querySelectorAll('.toast,#toast')].map(e => e.textContent).join(' ') } }, pid);
  const toca = () => ev(A, p => { const b = document.querySelector(`[id="p-${p}"] [data-a="like"]`); b.scrollIntoView({ block: 'center' }); b.click() }, pid);
  await A.context().setOffline(true); await toca(); await sleep(500); let e1 = await est();
  ok(e1.on && /curtida vai ser enviada/.test(e1.t) && !/Gostei/.test(e1.t), 'sem internet: Curtir marca o losango na hora e o aviso fala em curtida', e1);
  await toca(); await sleep(500); const e2 = await est(); ok(!e2.on, 'sem internet: o 2º toque desfaz', e2);
  await toca(); await sleep(300); await A.context().setOffline(false);
  ok(await esperar(A, p => socialOf(p).likes.includes(S.uid), pid, 12000), 'internet de volta: a curtida é enviada');
  // barras
  const w = await ev(A, () => { const d = document.createElement('div'); d.style.width = '340px'; d.innerHTML = `<div class="gn"><ul class="gn-b">${[93.3, 94.2, 100, 50].map(v => `<li><span class="gn-r">x</span><span class="gn-t"><i style="width:${v}%"></i><b>US$ 108,0 bi</b></span></li>`).join('')}</ul></div>`; document.body.appendChild(d);
    const r = [...d.querySelectorAll('.gn-t i')].map(i => Math.round(i.getBoundingClientRect().width)); d.remove(); return r });
  ok(w[2] > w[0] && w[1] >= w[0] && w[3] < w[0] && Math.abs(w[3] * 2 - w[2]) <= 3, 'gráfico de barras: barras proporcionais aos valores', w);
  // quem noticiou
  const ln = await ev(A, () => { const p = FEED.pautas.find(p => { try { const l = mt158Lista(p); return l.length >= 3 && l.every(v => mt158Esp(v.k)) } catch (e) { return false } }); if (!p) return null;
    const o = mt158Esp; const l = mt158Lista(p); let i = 0; mt158Esp = k => (k === l[0].k ? null : 'centro'); const r = ft182Linha(p); mt158Esp = o; return { r, n: l.length } });
  ok(!ln || (!/só do centro/.test(ln.r) && new RegExp(`${ln.n - 1} do centro, 1 sem classificação`).test(ln.r)), 'quem noticiou: com veículo sem classificação, não diz "só do centro"', ln);
  // Coleções fora das ilustrações
  const cl = await ev(A, () => { const d = document.createElement('div'); d.innerHTML = `<svg class="ill"><text>Destaques</text></svg><span class="tst">Destaques</span>`; document.body.appendChild(d); vn112Nomes(d); const r = { svg: d.querySelector('text').textContent, sp: d.querySelector('.tst').textContent }; d.remove(); return r });
  ok(cl.svg === 'Destaques', 'ilustração da notícia mantém "Destaques"', cl);
  // aviso sem conexão
  const tn = await ev(A, () => { const d = document.createElement('div'); d.style.width = '360px'; d.innerHTML = `<div class="late gut offl"><span>Sem conexão. Mostrando a edição das 21h50.</span><button type="button" data-retry>Tentar de novo</button></div>`; document.body.appendChild(d); const bt = d.querySelector('[data-retry]'), h = bt.getBoundingClientRect().height, lh = parseFloat(getComputedStyle(bt).lineHeight) || 20; d.remove(); return { h, lh } });
  ok(tn.h < tn.lh * 1.8, '"Tentar de novo" numa linha só', tn);
  // matéria aberta por link na 1ª visita: sem ilustração antes da foto de arquivo (o site de teste não tem o
  // fotos-arquivo.json: aqui ele vem do repositório, 3 s atrasado)
  const FA = require('path').join(__dirname, '..', '..', 'fotos-arquivo.json');
  const ctx = async atraso => { const C = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
    await C.route(/fotos-arquivo\.json/, async r => { if (atraso) await sleep(atraso); r.fulfill({ path: FA, contentType: 'application/json' }) }); return C };
  const C0 = await ctx(0), P0 = await C0.newPage(); await P0.goto(BASE); await esperar(P0, () => !!FOTOS_ARQ && document.querySelectorAll('.post').length > 0, null, 15000);
  const mid = await P0.evaluate(() => { const p = FEED.pautas.find(p => { try { return !(p.imagem && p.imagem.url) && fotoDe(p) } catch (e) { return false } }); return p && p.id }); await C0.close();
  if (mid) { const C = await ctx(3000); const P = await C.newPage(); U.erros(P, 'Link');
    await P.goto(BASE + '#m=' + mid); await esperar(P, () => !!document.querySelector('#layer .mat-arte'), null, 15000);
    const a1 = await P.evaluate(() => { const a = document.querySelector('#layer .mat-arte'), s = a.querySelector('.paper:not(.foto) svg'); return { foto: !!a.querySelector('.foto'), svgVis: s ? getComputedStyle(s).visibility : null, fn: typeof mt202Espera, cls: a.className, sem: document.documentElement.classList.contains('ab141-sem-arq'), parc: !!(typeof FL119 !== 'undefined' && FL119.parcial), mp: MAT_PID } });
    ok(a1.foto || a1.svgVis === 'hidden', 'link na 1ª visita: a ilustração não aparece antes da foto de arquivo', a1);
    ok(await esperar(P, () => !!document.querySelector('#layer .mat-arte .foto'), null, 12000), 'link na 1ª visita: a foto de arquivo entra na matéria aberta', await P.evaluate(() => document.querySelector('#layer .mat-arte').innerHTML.slice(0, 120)));
    await C.close() } else console.log('  (sem notícia com foto de arquivo no feed de hoje)');
  // rede lenta, 1ª visita: tocar em Buscar antes de o app ficar pronto não se perde, e o guia não abre por cima
  { const C = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }); await C.addInitScript(() => { try { localStorage.setItem('prumo-teste-tourvis', '1') } catch (e) { } });
    await C.route(/^https?:\/\/(?!localhost)/, r => r.abort()); const P = await C.newPage(); U.erros(P, 'Lento');
    const cdp = await C.newCDPSession(P); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 150000, uploadThroughput: 90000 });
    P.goto(BASE).catch(() => { }); const pre = await esperar(P, () => !!document.querySelector('.nav [data-v="busca"]') && !window.__prumoPronto, null, 20000);
    if (pre) { await P.evaluate(() => document.querySelector('.nav [data-v="busca"]').click()); const tc = await P.evaluate(() => !!document.querySelector('.toque-cedo-b'));
      ok(tc, 'rede lenta: o toque antes de o app ficar pronto deixa o botão marcado');
      ok(await esperar(P, () => window.__prumoPronto && VIEW === 'busca', null, 60000), 'rede lenta: o app abre a Busca quando fica pronto');
      await sleep(3500); ok(await P.evaluate(() => !document.querySelector('#layer').innerHTML && !document.querySelector('.toque-cedo-b')), 'rede lenta: quem já tocou não recebe o guia por cima') }
    else console.log('  (a página carregou antes de dar para tocar)');
    await C.close() }
  ok(!A._erros.length, 'sem erros ' + A._erros.slice(0, 3).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_madrugada_1911: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
