process.env.PRUMO_FORMATOS_TODOS = '1';  // testa os formatos escondidos em 17/11 (FT182_ESCONDE), religados só no teste
// Feed, segunda rodada (167, 16/11 noite): círculos do topo sem repetir o 1º cartão e sem etiqueta cortada, fileira parada ao
// fechar o giro; "✓ seguindo" inteiro; sem vão embaixo da cobertura; véu escuro no giro com foto; comentário guardado sem
// internet aparece na conversa; retorno pula linha no celular; responder sem "@Nome" repetido; "curtir" sem conta; rodapé
// com a conferência e a próxima atualização; letra grande nos comandos; barra de baixo opaca; voltar refaz o caminho das abas.
// Portas 8720 e 8721. Fotos em shots/feed-r2-*.png (iPhone 13 e iPhone SE).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8720, BASE = 'http://localhost:' + PORTA + '/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const comentarios = p => ev(p, () => [...document.querySelectorAll('#cbox .clist > li')].map(li => ({ c: li.className, t: li.innerText })));
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 }, ctx: { deviceScaleFactor: 2, isMobile: true, hasTouch: true } }), 'A'); const ctx = A.context();
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('feed')); await esperar(A, () => document.querySelectorAll('#posts .post.vn-cn').length > 2, null, 8000); await sleep(1200);
  await U.foto(A, 'feed-r2-topo-13');

  // 1. círculo Últimas não repete o 1º cartão (mesmo quando a 1ª das Últimas é a notícia do 1º cartão)
  const ult = await ev(A, () => { const its = igLista('_ult').itens; const u0 = its[0]; const p0 = pautaById(u0.pid);
    const sv = LOTE.lista; LOTE.lista = [p0].concat(sv.filter(x => x !== p0)); try { ULT_VISTOS.clear && 0; renderSecs() } finally { }
    const t = (document.querySelector('#secs [data-ultimas] .vn-tl-tx b') || {}).textContent || ''; const r = { n: its.length, t, u0: u0.txt || '', ex: _vp156Ult(), p0: p0.id, igual: fd156Norm(t).slice(0, 30) === fd156Norm(u0.txt || '').slice(0, 30) };
    LOTE.lista = sv; renderSecs(); return r });
  ok(ult.n < 2 || (ult.ex !== ult.p0 && !ult.igual), 'Últimas: o círculo mostra outra notícia quando a primeira é o 1º cartão', ult);
  // Em 5 min: a miniatura não é a do 1º cartão
  ok(await ev(A, () => { FD156_EXCL = new Set([fd156Id(igLista('_5min').ps[0].id)]); try { const r = vn112Primeira('_5min'); return igLista('_5min').ps.length < 2 || !FD156_EXCL.has(fd156Id(r.p.id)) } finally { FD156_EXCL = null } }), 'Em 5 min: miniatura de outra notícia quando a primeira já está no topo');

  // 2. círculos sem a etiqueta desenhada no canto
  const et = await ev(A, () => { const d = document.createElement('div'); d.innerHTML = '<span class="vn-tl"><svg viewBox="0 0 400 240"><rect class="ii" x="16" y="12" width="120" height="20" rx="10"/><text class="t ic" x="70" y="26">VIAGEM DE LULA</text><text class="t ii" x="196" y="62">45 a 31</text></svg></span>'; fd167SemEtiqueta(d);
    return { teste: d.querySelectorAll('text').length === 1 && !d.querySelector('rect'), app: [...document.querySelectorAll('#secs .vn-tl svg text.t')].filter(t => +t.getAttribute('y') <= 34).length } });
  ok(et.teste && et.app === 0, 'círculos: ilustração sem a etiqueta do canto', et);

  // 3. fechar o giro não rola a fileira do topo
  await ev(A, () => { const s = document.getElementById('secs'); s.scrollLeft = 0 }); await sleep(200);
  await clk(A, '#secs [data-ultimas]'); await esperar(A, () => !!document.querySelector('#layer .story'), null, 4000); await sleep(600);
  await ev(A, () => igFechar ? igFechar() : closeLayer()); await sleep(900);
  ok(await ev(A, () => !document.querySelector('#layer .story') && document.getElementById('secs').scrollLeft < 4), 'fechar Últimas: a fileira fica onde estava', await ev(A, () => document.getElementById('secs').scrollLeft));
  await ev(A, () => { document.getElementById('secs').scrollLeft = 140 }); await sleep(300); const x0 = await ev(A, () => document.getElementById('secs').scrollLeft);  // a fileira encaixa nos círculos
  await ev(A, () => { const b = document.querySelectorAll('#secs [data-sec-story]')[1]; b.click() }); await esperar(A, () => !!document.querySelector('#layer .story'), null, 4000); await sleep(500);
  await ev(A, () => closeLayer()); await sleep(900);
  ok(x0 > 20 && await ev(A, x => Math.abs(document.getElementById('secs').scrollLeft - x) < 4, x0), 'fechar o giro da editoria: a fileira fica onde estava', [x0, await ev(A, () => document.getElementById('secs').scrollLeft)]);

  // 4. giro com foto: véu escuro forte atrás do título
  ok(await ev(A, () => { const d = document.createElement('div'); d.className = 'story sg com-foto'; d.innerHTML = '<div class="sg-sh"></div>'; document.body.appendChild(d); const g = getComputedStyle(d.firstChild).backgroundImage; d.remove(); return /0\.7\) 40%/.test(g) && /0\.86\) 52%/.test(g) }), 'giro com foto: véu escuro da metade para baixo');

  // 5. "✓ seguindo" inteiro e sem vão embaixo da cobertura
  const seg = await ev(A, () => { const el = document.querySelector('#posts .post.vn-cn'); const p = pautaById(el.dataset.pid); PREF.seguindo = PREF.seguindo || {}; PREF.seguindo[norm(temaDe(p))] = temaDe(p); renderPosts(); scrollTo(0, 0);
    const e2 = document.getElementById('p-' + p.id); const s = e2 && e2.querySelector('.fd167-seg'); return { tem: !!s, tx: s && s.textContent, st: e2 && (e2.querySelector('.fd156-st') || {}).textContent, id: p.id } });
  ok(seg.tem && /✓ seguindo$/.test(seg.tx) && !/seguindo/.test(seg.st || ''), 'cartão de assunto seguido: "✓ seguindo" separado do subtema', seg);
  await A.setViewportSize({ width: 320, height: 568 }); await sleep(400);
  const se = await ev(A, id => { const e = document.getElementById('p-' + id); const s = e.querySelector('.fd167-seg'), hr = e.querySelector('.ph-sub .vn-hr'), mb = e.querySelector('.ph .more-btn');
    const a = s.getBoundingClientRect(); return { inteira: s.scrollWidth <= s.clientWidth + 1 && a.width > 30, dir: Math.round((hr || s).getBoundingClientRect().right), mb: Math.round(mb.getBoundingClientRect().left) } }, seg.id);
  ok(se.inteira && se.dir <= se.mb, 'iPhone SE: "✓ seguindo" e a hora inteiros, antes do "•••"', se);
  await ev(A, id => document.getElementById('p-' + id).scrollIntoView({ block: 'start' }), seg.id); await sleep(300); await U.foto(A, 'feed-r2-seguindo-se');
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(300);
  const vao = await ev(A, () => { const c = [...document.querySelectorAll('#posts .post.vn-cn .cobbar')].find(x => x.offsetHeight); if (!c) return null; const p = c.closest('.post'); return Math.round(p.getBoundingClientRect().bottom - c.getBoundingClientRect().bottom) });
  ok(vao === null || vao <= 12, 'linha da cobertura sem vão embaixo', vao);
  await ev(A, () => { delete PREF.seguindo[Object.keys(PREF.seguindo)[0]]; renderPosts(); const c = [...document.querySelectorAll('#posts .post.vn-cn .cobbar')].find(x => x.offsetHeight); if (c) { c.scrollIntoView({ block: 'center' }) } }); await sleep(400); await U.foto(A, 'feed-r2-cobertura-13');
  await ev(A, () => scrollTo(0, 0)); await sleep(300);

  // 6. retorno pula linha no celular; as quebras aparecem no comentário
  const pid = await ev(A, () => document.querySelector('#posts .post.vn-cn').dataset.pid);
  await clk(A, `[id="p-${pid}"] .acts [data-a="cmt"]`); await sleep(600);
  await A.type('#ctext', 'Linha um'); await A.keyboard.press('Enter'); await A.type('#ctext', 'Linha dois'); await sleep(300);
  ok(await ev(A, () => document.getElementById('ctext').value === 'Linha um\nLinha dois' && !socialOf(FD156_PID).cm.length), 'retorno pula linha e não publica', await ev(A, () => document.getElementById('ctext').value));
  await clk(A, '#cform .sendc'); await sleep(900);
  ok(await ev(A, () => { const li = document.querySelector('#cbox .clist > li'); return li && /Linha um\nLinha dois/.test(li.querySelector(':scope>div>span').innerText) }), 'comentário mostra a quebra de linha', await comentarios(A));

  // 7. responder: "Respondendo a Pedro" acima do campo, sem "@Pedro" no texto nem na resposta
  await clk(A, '#cbox [data-resp]'); await sleep(300);
  const rb = await ev(A, () => ({ barra: (document.getElementById('fd167-rb') || {}).textContent || '', v: document.getElementById('ctext').value }));
  ok(/Respondendo a Pedro/.test(rb.barra) && rb.v === '', 'Responder: aviso "Respondendo a Pedro" e campo sem "@Pedro"', rb);
  await A.type('#ctext', 'concordo'); await clk(A, '#cform .sendc'); await sleep(1100);
  const rp = await ev(A, () => { const c = socialOf(FD156_PID).cm.find(x => /concordo/.test(x.texto)); const li = document.querySelector('#cbox .clist li.fd156-resp'); return { gravado: c && c.texto, li: li && li.innerText, barra: !!document.getElementById('fd167-rb') } });
  ok(rp.gravado === '@Pedro concordo' && rp.li && /respondendo a Pedro/.test(rp.li) && !/@Pedro/.test(rp.li) && !rp.barra, 'resposta fica agrupada embaixo e o nome aparece uma vez como "respondendo a"', rp);
  await U.foto(A, 'feed-r2-comentarios-13');

  // 8. sem internet: o comentário guardado aparece na conversa até ir
  await ctx.setOffline(true);
  await ev(A, () => { window.__gm167 = gravarMapa; gravarMapa = () => Promise.reject(new Error('Failed to fetch')) });
  await A.fill('#ctext', 'Escrito sem internet'); await clk(A, '#cform .sendc'); await sleep(900);
  let pend = await ev(A, () => { const li = document.querySelector('#cbox li.fd167-pend'); return { li: li && li.innerText, q: JSON.parse(localStorage.getItem('fd156cq') || '[]').length, v: document.getElementById('ctext').value } });
  ok(pend.q === 1 && pend.v === '' && /Escrito sem internet/.test(pend.li || '') && /Enviando quando a internet voltar/.test(pend.li || '') && /Cancelar/.test(pend.li || ''), 'sem internet: o comentário fica na conversa com "Enviando quando a internet voltar · Cancelar"', pend);
  await sleep(3500);
  ok(await ev(A, () => !!document.querySelector('#cbox li.fd167-pend')), 'o pendente continua na conversa depois que o aviso some');
  await U.foto(A, 'feed-r2-pendente-13');
  await clk(A, '#cbox [data-fd167cx]'); await sleep(400);
  pend = await ev(A, () => ({ li: !!document.querySelector('#cbox li.fd167-pend'), q: JSON.parse(localStorage.getItem('fd156cq') || '[]').length, v: document.getElementById('ctext').value }));
  ok(!pend.li && pend.q === 0 && pend.v === 'Escrito sem internet', 'Cancelar tira da conversa e devolve o texto para a caixa', pend);
  await clk(A, '#cform .sendc'); await sleep(800);
  ok(await ev(A, () => !!document.querySelector('#cbox li.fd167-pend')), 'enviar de novo sem internet: volta para a conversa como pendente');
  await ev(A, () => { gravarMapa = window.__gm167 }); await ctx.setOffline(false);
  ok(await esperar(A, () => !document.querySelector('#cbox li.fd167-pend') && JSON.parse(localStorage.getItem('fd156cq') || '[]').length === 0 && [...document.querySelectorAll('#cbox .clist > li')].some(li => /Escrito sem internet/.test(li.innerText)), null, 8000), 'internet volta: o pendente vira comentário publicado', await comentarios(A));
  await ev(A, () => closeLayer()); await sleep(400);

  // 9. rodapé: hora da conferência e a próxima atualização, sem a lista de horários
  const rod = await ev(A, async () => { for (let i = 0; i < 40 && document.getElementById('mais'); i++) { carregarMais(true); await new Promise(r => setTimeout(r, 30)) }
    const at = Date.parse(FEED.atualizado_em); const d = new Date(at + 2 * 3600e3); const f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(d).replace(':', 'h');
    S.rodadas = { dia: hojeSP(), itens: { [f]: { tipo: 'rapida', status: 'sem_mudancas', publicou: false } } }; fd167Rodape(); return { t: (document.querySelector('#extra .foot p') || {}).textContent || '', f } });
  ok(/^Atualizado .+\. Conferido às \d{1,2}h\d{2}, sem novidades\. Próxima atualização/.test(rod.t) && !/9h48, 11h48/.test(rod.t), 'rodapé: "Atualizado…", "Conferido às …, sem novidades" e a próxima atualização', rod);
  ok(await ev(A, () => { S.rodadas = {}; fd167Rodape(); const t = document.querySelector('#extra .foot p').textContent; return /^Atualizado .+\. Próxima atualização/.test(t) && !/Conferido/.test(t) }), 'rodapé sem rodada conferida depois: só a hora e a próxima');
  ok(await ev(A, () => { const b = (window.BREVES || [])[0]; if (!b) return true; b.hora = new Date(Date.now() - 2 * 3600e3).toISOString(); fd167BreveHora(); return /· há 2 h$/.test(document.querySelector('#extra .brv li span').textContent) }), 'Outras notícias: a breve mostra a hora quando a rodada manda');
  await ev(A, () => scrollTo(0, 0)); await sleep(300);

  // 10. barra de baixo quase opaca
  ok(await ev(A, () => { const bg = getComputedStyle(document.querySelector('.nav')).backgroundColor; const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(bg); return !m || +m[1] >= .9 }), 'barra de baixo com fundo quase opaco', await ev(A, () => getComputedStyle(document.querySelector('.nav')).backgroundColor));

  // 11. letra grande: comandos e barra de baixo crescem (até 1,2×) e cabem no iPhone SE
  const fz = async () => ev(A, () => ({ nav: parseFloat(getComputedStyle(document.querySelector('.nav button')).fontSize), act: parseFloat(getComputedStyle(document.querySelector('#posts .acts .act')).fontSize),
    cabe: [...document.querySelectorAll('.nav button .lbl')].every(l => l.scrollWidth <= l.parentNode.clientWidth + 1) }));
  const f0 = await fz(); await ev(A, () => { PREF.fonte = 1.4; aplicarFonte() }); await sleep(300); const f1 = await fz();
  ok(f1.nav > f0.nav && f1.nav <= f0.nav * 1.21 && f1.act > f0.act && f1.cabe, 'letra grande: barra de baixo e "Comentar" maiores', [f0, f1]);
  await A.setViewportSize({ width: 320, height: 568 }); await sleep(400); const f2 = await fz();
  ok(f2.nav > f0.nav && f2.cabe, 'letra grande no iPhone SE: nomes da barra maiores e inteiros', f2);
  await U.foto(A, 'feed-r2-letra-grande-se');
  await ev(A, () => { PREF.fonte = 1; aplicarFonte() }); await A.setViewportSize({ width: 390, height: 844 }); await sleep(300);

  // 12. voltar do celular refaz o caminho das abas (raiz = Feed nos testes)
  await ev(A, () => { scrollTo(0, 1600) }); await sleep(300); const y0 = await ev(A, () => scrollY);
  await clk(A, '.nav [data-v="msgs"]'); await sleep(400); await clk(A, '.nav [data-v="busca"]'); await sleep(400); await clk(A, '.nav [data-v="me"]'); await sleep(500);
  await ev(A, () => history.back()); await sleep(700); const v1 = await ev(A, () => VIEW);
  await ev(A, () => history.back()); await sleep(700); const v2 = await ev(A, () => VIEW);
  await ev(A, () => history.back()); await sleep(900); const v3 = await ev(A, () => ({ v: VIEW, y: scrollY }));
  ok(v1 === 'busca' && v2 === 'msgs' && v3.v === 'feed' && Math.abs(v3.y - y0) < 80, 'voltar: Perfil → Buscar → Conversas → Feed na mesma altura', [v1, v2, v3, y0]);
  // tocar na aba anterior conta como voltar (não empilha ida e volta)
  await clk(A, '.nav [data-v="msgs"]'); await sleep(300); await clk(A, '.nav [data-v="me"]'); await sleep(300); await clk(A, '.nav [data-v="msgs"]'); await sleep(400);
  await ev(A, () => history.back()); await sleep(700);
  ok(await ev(A, () => VIEW === 'feed'), 'Conversas → Perfil → Conversas e voltar: cai no Feed', await ev(A, () => VIEW));

  // 13. sem conta, Capa como raiz (como no celular): "curtir" e o caminho Capa > Conversas > Feed > Perfil
  const B = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 }, ctx: { deviceScaleFactor: 2, isMobile: true, hasTouch: true } }), 'B');
  await B.goto(BASE); await ev(B, () => { localStorage.setItem('prumo-teste-capa', '1'); try { sessionStorage.removeItem('prumo-aviso') } catch (e) {} }); await B.goto(BASE + '?x=1');
  await esperar(B, () => VIEW === 'capa' && RAIZ === 'capa', null, 8000); await sleep(800);
  await clk(B, '.nav [data-v="msgs"]'); await sleep(400); await clk(B, '.nav [data-v="feed"]'); await esperar(B, () => document.querySelectorAll('#posts .post').length > 2, null, 8000); await sleep(800);
  const sc = await ev(B, () => ({ av: (document.querySelector('#avisoconta>span') || {}).textContent || '', like: (document.querySelector('#posts .acts [data-a="like"]') || {}).getAttribute?.('aria-label') }));
  ok(/Entre para curtir, comentar e conversar/.test(sc.av) && sc.like === 'Curtir', 'sem conta: "Entre para curtir…" e botão "Curtir"', sc);
  await U.foto(B, 'feed-r2-sem-conta-13');
  await ev(B, () => scrollTo(0, 1800)); await sleep(400); const yb = await ev(B, () => scrollY);
  await clk(B, '.nav [data-v="me"]'); await sleep(500);
  await ev(B, () => history.back()); await sleep(800); const w1 = await ev(B, () => ({ v: VIEW, y: scrollY }));
  await ev(B, () => history.back()); await sleep(700); const w2 = await ev(B, () => VIEW);
  await ev(B, () => history.back()); await sleep(700); const w3 = await ev(B, () => ({ v: VIEW, url: location.href }));
  ok(w1.v === 'feed' && Math.abs(w1.y - yb) < 80 && w2 === 'msgs' && w3.v === 'capa' && /index\.html/.test(w3.url), 'voltar: Perfil → Feed na mesma altura → Conversas → Capa, sem sair do site', [w1, yb, w2, w3]);

  // 14. iPhone SE: topo e comentários
  await A.setViewportSize({ width: 320, height: 568 }); await ev(A, () => { go('feed'); scrollTo(0, 0) }); await sleep(600); await U.foto(A, 'feed-r2-topo-se');
  await clk(A, '#posts .post.vn-cn .acts [data-a="cmt"]'); await sleep(600); await U.foto(A, 'feed-r2-comentar-se'); await ev(A, () => closeLayer());

  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_feed_r2: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
