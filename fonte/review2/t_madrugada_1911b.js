// Madrugada 19/11, 2ª leva de achados do testador: apagar o post e fechar o app logo depois não deixa o post publicado
// (a próxima abertura apaga); "Acabou de sair" não separa a notícia do comentário colado nela; episódio de podcast não
// vira "Acabou de sair"; rótulos das editorias legíveis na escolha da notícia; rascunho reaberto sem "Rascunho" duas
// vezes; foto deitada fica deitada no post. Porta 9303.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9303, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), 'i13');
  await A.goto(BASE); await esperar(A, () => document.querySelectorAll('.post').length > 0);
  if (!(await A.$('#lcod'))) { await esperar(A, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(A, '#avisoconta [data-entrar]'); await clk(A, '[data-laba="criar"]') }
  await A.fill('#lnome', 'Teste'); await A.fill('#lemail', 't@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]');
  await esperar(A, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await A.$('.sheet')) { await ev(A, () => closeLayer()); await sleep(250) }

  // 1. apagar e recarregar logo: o post não volta
  await ev(A, () => { go('feed'); criarMenu() }); await sleep(400); await A.fill('#cp152-tx', 'Post para apagar já'); await ev(A, () => document.querySelector('[data-cp152pub]').click());
  ok(await esperar(A, () => PUB.itens.some(x => x.autor === S.uid && /para apagar já/.test(x.texto || '')), null, 8000), 'post publicado');
  const id = await ev(A, () => PUB.itens.find(x => /para apagar já/.test(x.texto || '')).id);
  await ev(A, i => pubApagar(i), id); await sleep(300);
  ok(await ev(A, i => !PUB.itens.some(x => x.id === i) && /apagar-pendente/.test(Object.keys(localStorage).join(' ')) && localStorage.getItem('prumo-apagar-pendente').includes(i), id), 'apagar: some na hora e fica guardado no aparelho');
  await A.route('**/rest/v1/publicacoes*', r => r.request().method() === 'DELETE' ? r.abort() : r.continue()).catch(() => { });  // o pedido do fechamento não chega
  await A.reload(); await esperar(A, () => S.membro && PUB.carregou, null, 12000); await A.unroute('**/rest/v1/publicacoes*').catch(() => { });
  await sleep(1500);
  ok(await ev(A, i => !PUB.itens.some(x => x.id === i), id), 'reabriu logo: o post apagado não reaparece');
  await ev(A, () => { PUB.carregando = false; return pubCarregar() }); await sleep(1500);
  ok(await esperar(A, i => !(localStorage.getItem('prumo-apagar-pendente') || '').includes(i), id, 8000), 'reabriu: o app apaga de verdade e limpa o pendente');
  const n = await H.sql ? await H.sql('select count(*)::int as n from publicacoes where id=$1', [id]).then(r => r[0].n).catch(() => null) : null;
  ok(n === null || n === 0, 'o post saiu do banco', n);

  // 2. "Acabou de sair" não entra entre a notícia e o comentário colado nela
  const ac = await ev(A, () => { go('feed'); FILTRO = 'tudo'; const box = document.getElementById('posts'); const f = box.querySelector(':scope > .post'); if (!f) return null;
    const j = document.createElement('article'); j.className = 'post fc107-junto'; j.id = 'teste-junto'; f.after(j);
    const d = new Date(Date.now() - 20 * 60e3), sp = new Date(d.getTime() - 3 * 3600e3), h = `${String(sp.getUTCDate()).padStart(2, '0')}/${String(sp.getUTCMonth() + 1).padStart(2, '0')} ${String(sp.getUTCHours()).padStart(2, '0')}h${String(sp.getUTCMinutes()).padStart(2, '0')}`;
    const ant = typeof NOVID_AG !== 'undefined' ? NOVID_AG : null;
    NOVID_AG = { gerado: new Date().toISOString(), novos: [
      { assunto: 'Governo anuncia novo programa de crédito para pequenas empresas', relevante: true, n_fontes: 3, secao: 'economia', manchetes: [{ titulo: 'Governo anuncia novo programa de crédito para pequenas empresas', veiculo: 'g1', hora: h }, { titulo: 'Programa de crédito para pequenas empresas é lançado', veiculo: 'CNN Brasil', hora: h }] },
      { assunto: 'O encontro inédito de Trump, Putin e Xi Jinping, e o que o Brasil ganha com isso - O Assunto #1849', relevante: true, n_fontes: 2, secao: 'mundo', manchetes: [{ titulo: 'O encontro inédito de Trump, Putin e Xi Jinping, e o que o Brasil ganha com isso - O Assunto #1849', veiculo: 'g1', hora: h }, { titulo: 'Podcast: o encontro de Trump, Putin e Xi', veiculo: 'CNN Brasil', hora: h }] }] };
    ac208Feed(); const blk = box.querySelector(':scope > .ac208'); const r = { prev: blk && blk.previousElementSibling && blk.previousElementSibling.id, txt: blk ? blk.innerText : '' };
    blk && blk.remove(); j.remove(); NOVID_AG = ant; return r });
  ok(ac && ac.prev === 'teste-junto', '"Acabou de sair" entra depois do comentário colado na notícia', ac);
  ok(ac && /crédito/.test(ac.txt) && !/O Assunto|#1849/.test(ac.txt), 'episódio de podcast não vira "Acabou de sair"', ac && ac.txt);

  // 3. rótulos das editorias legíveis na escolha da notícia
  await ev(A, () => { closeLayer(); criarMenu() }); await sleep(400); await clk(A, '[data-cp152ax="nt"]'); await sleep(600);
  const ct = await ev(A, () => { const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number).slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2] };
    let fundo = 'rgb(255,255,255)'; const s = document.querySelector('#layer .ce-lis small'); if (!s) return null; for (let e = s; e; e = e.parentElement) { const bg = getComputedStyle(e).backgroundColor; if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { fundo = bg; break } }
    const a = lum(getComputedStyle(s).color), c = lum(fundo); return { r: +((Math.max(a, c) + .05) / (Math.min(a, c) + .05)).toFixed(2), cor: getComputedStyle(s).color, fundo } });
  ok(ct && ct.r >= 4.5, 'escolher notícia: editoria com contraste de pelo menos 4,5:1', ct);
  await ev(A, () => closeLayer()); await sleep(300);

  // 4. rascunho reaberto: o topo não repete "Rascunho"
  const hd = await ev(A, () => { try { const d = { rid: 'r-teste', tit: 'Meu rascunho', linha: '', cham: '', html: '<p>Texto</p>', tags: '' }; ed132Abre(ed132DoRasc(d)) } catch (e) { return 'erro ' + e.message } return null });
  await sleep(500);
  const tp = await ev(A, () => { const b = document.querySelector('#layer .ed132-ht b'), s = document.querySelector('#layer .ed132-st'); return b ? [b.textContent, s && s.textContent] : null });
  ok(hd === null && tp && !(tp[0] === 'Rascunho' && /^Rascunho/.test(tp[1] || '')) && tp[0] === 'Continuar coluna', 'rascunho reaberto: topo "Continuar coluna", sem "Rascunho" duas vezes', { hd, tp });
  await ev(A, () => closeLayer()); await sleep(300);

  // 5. foto deitada fica deitada
  const ar = await ev(A, () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 900; const P = { fotos: [{ img: c }], ar: '4:5' }; ed206ArAuto(P); const deit = P.ar;
    const c2 = document.createElement('canvas'); c2.width = 900; c2.height = 1200; const Q = { fotos: [{ img: c2 }], ar: '4:5' }; ed206ArAuto(Q); const pe = Q.ar;
    const R = { fotos: [{ img: c }], ar: '1:1', arEsc: true }; ed206ArAuto(R); return { deit, pe, esc: R.ar, k: edAR(deit, c) } });
  ok(ar.deit === 'orig' && ar.pe === '4:5' && ar.esc === '1:1' && Math.abs(ar.k - 4 / 3) < .01, 'foto deitada: o post fica no formato da foto (a escolha da pessoa vale)', ar);

  ok(!A._erros.length, 'sem erros de JavaScript ' + A._erros.slice(0, 3).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_madrugada_1911b: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
