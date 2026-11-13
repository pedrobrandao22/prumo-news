// Revisão B (Feed, Giro e criação) no estado de produção: visual novo com o cartão A + fase 2 + foco + sem reels. Correções do 115.
// B01 avatar do Giro de amigo não cobre o nome · B02 notícia citada por amigo não vai para prateleira · B03 Contexto do Prumo uma vez por notícia
// B05 hora no cabeçalho com selo em 360px · B06 dica sobre a prévia do cartão
// B07 "modo Livre" no aviso da câmera · B08 figurinha nova abaixo do cartão de texto. Portas 8724–8725. Capturas em qa/revisao-b/depois/.
const path = require('path'), fs = require('fs');
const R = require('./_rb_cena'); const { ev, sleep, esperar, U, clk } = R; const { ok } = U;
const PORTA = 8724;
const QA = path.join(__dirname, '..', 'qa', 'revisao-b', 'depois'); fs.mkdirSync(QA, { recursive: true });
const foto = async (P, n) => { await sleep(300); await P.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await P.screenshot({ path: path.join(QA, n + '.png') }) };
const tudo = P => ev(P, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 12; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
(async () => {
  const c = await R.cena(PORTA); const { A, B, pk } = c;
  ok(await ev(A, () => VN_FASE2 && FOCO_LIGADO), 'estado de produção: cartão A, fase 2, foco, sem reels');
  await tudo(A); await sleep(700);

  // ===== B02: notícia citada por amigo fora das prateleiras
  const b2 = await ev(A, () => { const prat = [...document.querySelectorAll('#posts .fs2-sh [data-f113mc]')].map(b => b.dataset.f113mc);
    const cit = new Set(); pubVisiveis().forEach(x => { if (x.tipo !== 'post') return; if (x.pid) cit.add(x.pid); const r = vn112Rp(x); if (r && r.k === 'pauta') cit.add(r.id) });
    const main = [...document.querySelectorAll('#posts > .post')].map(e => e.dataset.pid);
    return { prat: prat.length, sh: document.querySelectorAll('#posts .fs2-sh').length, dup: prat.filter(id => cit.has(id)), dupMain: prat.filter(id => main.includes(id)) } });
  ok(b2.sh >= 1 && b2.prat >= 4, 'B02: as prateleiras continuam aparecendo', JSON.stringify(b2));
  ok(!b2.dup.length && !b2.dupMain.length, 'B02: nenhuma notícia da prateleira é a que um amigo citou ou que já está no Feed', JSON.stringify(b2));
  ok(await ev(A, id => !document.querySelector(`.fs2-sh [data-f113mc="${id}"]`), pk.l[5]), 'B02: a notícia repostada pela Bia não está numa prateleira');

  // ===== B03 / B04: Contexto do Prumo
  const b3 = await ev(A, () => { const l = [...document.querySelectorAll('#posts .fs2-ctx')].map(c => { const p = c.closest('.post'); let a = p.previousElementSibling; while (a && !a.matches('.post,.fs2-sh')) a = a.previousElementSibling; return { id: c.dataset.f113ctx, colado: !!a && a.id === 'p-' + c.dataset.f113ctx, chip: [...p.querySelectorAll('[data-capmat]')].some(e => !e.closest('.fs2-ctx') && e.dataset.capmat === c.dataset.f113ctx) } });
    return { l, ids: l.map(x => x.id) } });
  ok(b3.l.length >= 1, 'B03: o Contexto do Prumo continua aparecendo', JSON.stringify(b3));
  ok(new Set(b3.ids).size === b3.ids.length, 'B03: uma caixa de contexto por notícia no Feed', JSON.stringify(b3.ids));
  ok(!b3.l.some(x => x.colado), 'B03: sem contexto logo abaixo do cartão da mesma notícia', JSON.stringify(b3.l));
  // B04 fica como a fase 2 decidiu (t_fase2): a Pergunta sobre uma notícia mantém a caixa de contexto
  ok(await ev(A, () => { const p = [...document.querySelectorAll('#posts .upost')].find(e => /Passa no Senado/.test(e.textContent)); return !!p && p.querySelectorAll('.fs2-ctx').length === 1 }), 'B04 (sem mudança): a Pergunta sobre uma notícia mantém uma caixa de contexto');
  // a fase 2 segue: o contexto ainda aparece no post de hashtag (o primeiro)
  ok(await ev(A, () => [...document.querySelectorAll('#posts .upost')].some(e => /Vale acompanhar|Três pontos/.test(e.textContent) && e.querySelector('.fs2-ctx'))), 'B03: o primeiro post com a hashtag da notícia mantém o contexto');
  // depois de carregar mais e redesenhar, continua sem repetir
  await ev(A, () => { renderPosts(true); for (let i = 0; i < 12; i++) try { carregarMais(true) } catch (e) { } }); await sleep(300);
  ok(await ev(A, () => { const ids = [...document.querySelectorAll('#posts .fs2-ctx')].map(c => c.dataset.f113ctx); return ids.length && new Set(ids).size === ids.length }), 'B03: redesenhar o Feed não repete o contexto');
  await ev(A, () => { const c = document.querySelector('#posts .fs2-ctx'); scrollTo(0, c.closest('.post').getBoundingClientRect().top + scrollY - 70) }); await foto(A, 'feed-contexto-390');

  // ===== B01 e B05 em 360, 390 e 430
  for (const w of [360, 390, 430]) {
    await A.setViewportSize({ width: w, height: 800 }); await sleep(250); await ev(A, () => { renderSecs(); renderPosts(); for (let i = 0; i < 12; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) }); await sleep(500);
    const t = await ev(A, () => [...document.querySelectorAll('#secs .vn-tl-u, #secs .vn-tl-eu')].map(tl => { const av = tl.querySelector('.vn-tl-av'), k = tl.querySelector('.vn-tl-tx small'); if (!av || !k) return null; return { av: Math.round(av.getBoundingClientRect().bottom), k: Math.round(k.getBoundingClientRect().top), b: (tl.querySelector('.vn-tl-tx b') || {}).textContent } }).filter(Boolean));
    ok(t.length >= 2 && t.every(x => x.k >= x.av), `B01 (${w}px): o avatar do Giro não cobre o nome`, JSON.stringify(t));
    const h = await ev(A, () => { const p = [...document.querySelectorAll('#posts .upost')].find(e => e.querySelector('.cn102-lb-enq')); const s = p && p.querySelector('.ph .ph-sub'); const ph = p && p.querySelector('.ph'); return s ? { sw: s.scrollWidth, cw: s.clientWidth, tx: s.textContent, ph: ph.scrollWidth - ph.clientWidth } : null });
    ok(h && h.sw <= h.cw && h.ph <= 1, `B05 (${w}px): a hora do post com selo aparece inteira`, JSON.stringify(h));
    ok(await ev(A, () => document.scrollingElement.scrollWidth <= innerWidth), `${w}px: sem rolagem para o lado no Feed`);
    if (w === 360) { await foto(A, 'giro-360'); await ev(A, () => { const p = [...document.querySelectorAll('#posts .upost')].find(e => e.querySelector('.cn102-lb-enq')); scrollTo(0, p.getBoundingClientRect().top + scrollY - 70) }); await foto(A, 'pergunta-360') }
  }
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(200);

  // ===== B07: aviso da câmera fala do modo Livre
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) closeLayer(); scrollTo(0, 0) }); await sleep(300);
  await clk(A, '#b-criar'); await sleep(700);
  await ev(A, () => { const b = [...document.querySelectorAll('#layer [data-edmodo]')].find(b => /GIRO/i.test(b.textContent)); b && b.click() }); await sleep(900);
  const av = await ev(A, () => document.querySelector('#layer').innerText);
  ok(/modo Livre/.test(av) && !/modo Criar/.test(av), 'B07: "Câmera indisponível" indica o modo Livre (o nome do botão)', av.slice(0, 200));
  // ===== B06: cartão de texto: a dica não aparece por cima da prévia
  await clk(A, '[data-fc105txt]'); await sleep(900);
  ok(await ev(A, () => { const d = document.querySelector('#layer .ce-dica'); return !d || getComputedStyle(d).display === 'none' }), 'B06: com o cartão de texto aberto, sem a dica "Toque para escrever" sobre a prévia');
  await A.fill('#fc105-tit', 'Juros altos por mais tempo'); await A.fill('#fc105-tx', 'Com a Selic alta, o crédito fica caro e o investimento espera.'); await sleep(400);
  await foto(A, 'cartao-texto');
  await clk(A, '[data-fc105csok]'); await sleep(900);
  // ===== B08: figurinha nova abaixo do cartão
  await clk(A, '[data-edfig]'); await sleep(600);
  await ev(A, () => { const b = [...document.querySelectorAll('[data-edfig]')].find(b => /Enquete/i.test(b.textContent)); b.click() }); await sleep(700);
  await A.fill('#ce-eq', 'O BC corta em dezembro?'); await A.fill('#fe-o0', 'Sim'); await A.fill('#fe-o1', 'Não');
  await ev(A, () => { const b = [...document.querySelectorAll('#layer button')].find(b => /Concluído/.test(b.textContent)); b.click() }); await sleep(700);
  const e8 = await ev(A, () => ED.st.els.filter(e => e.t === 'enq').map(e => e.y));
  ok(e8.length === 1 && e8[0] >= .7, 'B08: no cartão de texto a enquete entra abaixo do texto', JSON.stringify(e8));
  await foto(A, 'cartao-enquete');
  const n0 = await ev(A, () => PUB.itens.filter(x => x.tipo === 'story' && x.autor === S.uid).length);
  await ev(A, () => { const b = [...document.querySelectorAll('[data-edpubst]')].find(b => /Seu giro/.test(b.textContent)); b.click() });
  ok(await esperar(A, n => PUB.itens.filter(x => x.tipo === 'story' && x.autor === S.uid).length === n + 1, n0, 20000), 'B08: o giro com cartão e enquete é publicado');
  const st = await ev(A, () => { const s = PUB.itens.find(x => x.tipo === 'story' && x.autor === S.uid); return { f: s.fotos.length, y: (s.estilo.itens || []).find(i => i.t === 'enq')?.y } });
  ok(st.f === 1 && st.y >= .7, 'B08: a enquete fica salva abaixo do texto (a figurinha permanece)', JSON.stringify(st));
  // sem cartão (fundo comum), o lugar padrão continua o de antes
  await ev(A, () => { if (document.querySelector('#layer').innerHTML) { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false } }); await sleep(300);
  ok(await ev(A, () => { const e = fg2Novo('enq'); return Math.abs(e.y - .46) < .001 }), 'B08: sem cartão de texto, a figurinha nova entra no meio como antes');

  // ===== Bia vê o giro do Pedro: a enquete não cobre o título
  await ev(B, async () => { await pubCarregar(); if (document.querySelector('#layer').innerHTML) closeLayer(); go('feed'); renderSecs(); scrollTo(0, 0) }); await sleep(600);
  await clk(B, `#secs [data-ustory="${c.uidA}"]`); await sleep(1200);
  ok(await ev(B, () => { const q = document.querySelector('#layer .us2-its [data-usvoto]'); const box = document.querySelector('#layer .us2-ov'); if (!q || !box) return false; const r = box.getBoundingClientRect(); return (q.getBoundingClientRect().top - r.top) / r.height > .55 }), 'B08: no giro publicado a enquete aparece abaixo do texto');
  await foto(B, 'giro-cartao-enquete');
  await ev(B, () => closeLayer()); await sleep(200);

  const errs = [A, B].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console', JSON.stringify(errs.slice(0, 5)));
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`);
  await c.b.close(); c.srv.kill(); process.exit(r.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); process.exit(1) });
