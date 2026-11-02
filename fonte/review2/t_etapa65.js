// Etapa 65: amigo mal-intencionado grava dados pela API; o app de quem vê não executa nada nem quebra
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8774/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8774); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  const XSS = '"><img src=x onerror="window.__pwn=(window.__pwn||0)+1">';
  // B (atacante) grava direto pela API
  const r = await ev(B, async ([XSS, uidA]) => {
    const u = S.uid, out = {}; const futuro = Date.now() + 400 * 864e5;
    out.s1 = await SB.from('publicacoes').insert({ autor: u, tipo: 'story', at: futuro, expira: futuro + 86400000, texto: 'x', fotos: [u + '/a.jpg'], estilo: { v: 2, fundo: -3.7, itens: [
      { t: 'enq', x: '1;' + XSS, y: .5, s: XSS, r: XSS, q: XSS, o: [XSS, { a: 1 }] }, { t: 'texto', x: .5, y: .3, tx: XSS, f: XSS, cor: 'red;background:url(javascript:1)', al: XSS, an: XSS, tam: 'NaN', fd: 9 },
      { t: 'link', url: 'javascript:alert(1)', tit: XSS, x: .5, y: .8 }, { t: 'cont', ate: 'Infinity', q: XSS }, { t: 'bomba', x: 1 }, null, 'oi', { t: 'quiz', q: 1, o: 'abc', c: 99 }] } }).select('id');
    out.s2 = await SB.from('publicacoes').insert({ autor: u, tipo: 'post', texto: XSS, fotos: [u + '/b.jpg'], estilo: { v: 2, ar: XSS, arv: 'x', tags: [{ u: XSS, x: XSS, y: 2, i: 'q' }], alt: [XSS], local: XSS, marcados: 'oi' } }).select('id');
    out.alheia = await SB.from('publicacoes').insert({ autor: u, tipo: 'post', texto: 'roubo', fotos: [uidA + '/c.jpg'] }).select('id');
    out.video = await SB.from('publicacoes').insert({ autor: u, tipo: 'story', texto: 'v', fotos: [u + '/d.jpg'], estilo: { v: 2, video: uidA + '/v.mp4', dur: 'abc', itens: [] } }).select('id');
    // reação maliciosa numa mensagem
    const m = await SB.from('mensagens').insert({ de: u, para: uidA, texto: 'oi', tipo: '' }).select('id');
    out.reac = await SB.from('mensagens').insert({ de: u, para: uidA, texto: XSS, tipo: 'reacao_msg', snap: { ref: m.data && m.data[0] && m.data[0].id } }).select('id');
    const q = await SB.from('publicacoes').select('at,expira,tipo').eq('autor', u).eq('tipo', 'story'); out.datas = q.data;
    return JSON.parse(JSON.stringify(out)) }, [XSS, uidA]);
  ok(!r.s1.error && !r.s2.error, 'linhas maliciosas gravadas (para testar o app)', r);
  ok(!!r.alheia.error, 'servidor recusa foto da pasta de outra pessoa', r.alheia);
  ok(!!r.video.error, 'servidor recusa vídeo da pasta de outra pessoa', r.video);
  ok(r.datas.every(d => d.at < Date.now() + 60e3 && d.expira - d.at === 86400000), 'servidor fixa a data e o fim do story (sem story eterno)', r.datas);
  // A vê tudo
  await ev(A, () => go('feed')); await sleep(300); await ev(A, () => pubCarregar()); await sleep(1500);
  await ev(A, () => document.querySelector('#posts .upost')?.scrollIntoView()); await sleep(500);
  await ev(A, () => scrollTo(0, 0)); await sleep(200); await clk(A, '#secs [data-ustory]'); await sleep(1500);
  ok(await ev(A, () => !!document.querySelector('#layer .story')), 'story malicioso abre sem quebrar');
  await A.screenshot({ path: __dirname + '/../review3/var/sec65-story.png' });
  await ev(A, () => go('msgs')); await sleep(600); await ev(A, () => { const t = document.querySelector('[data-thread]'); t && t.click() }); await sleep(800);
  ok(await ev(A, () => !window.__pwn), 'nenhum script executou (story, post, reação de mensagem)', await ev(A, () => window.__pwn));
  ok(await ev(A, () => !document.querySelector('img[src="x"]')), 'nenhuma imagem injetada no HTML');
  ok(!A._erros.length, 'sem erros na tela de quem vê ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa65: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
