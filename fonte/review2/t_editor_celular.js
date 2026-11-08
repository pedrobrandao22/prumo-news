// Editor de coluna no celular de verdade (138): iPhone (WebKit, ou Chromium com o aparelho "iPhone 13" quando o WebKit
// não está instalado) e Android ("Pixel 7"). O teclado é simulado: no iPhone, um visualViewport falso com ~55% da altura
// (e offsetTop quando o Safari "puxa" a tela), sem encolher a página, como o Safari faz; no Android a página encolhe
// (interactive-widget=resizes-content). Confere: barra dentro da área visível; linha digitada à vista depois de 40 linhas;
// menu Inserir fecha tocando fora, rolando, com Esc, apagando o "/", trocando de linha e no ×; Backspace/Enter nos blocos;
// composição (acento) não dispara atalho; tocar na barra não tira o foco; salvar ao esconder e ao voltar.
// Portas 8786–8787. Capturas em qa/editor-celular/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const { devices } = require('playwright');
const PORTA = 8786, PORTA2 = 8787, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'editor-celular'); fs.mkdirSync(QA, { recursive: true });
const SITE = path.join(__dirname, '..', 'site'), SERIES = path.join(U.REPO, 'series');
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const html = P => ev(P, () => ed132Le().html);
/* visualViewport falso (como o do Safari do iPhone: o teclado não encolhe a página) */
const FAKE_VV = () => {
  const alvo = new EventTarget(), st = { h: null, t: 0 };
  const vv = { get height() { return st.h === null ? innerHeight : st.h }, get width() { return innerWidth }, get offsetTop() { return st.t }, get offsetLeft() { return 0 },
    get pageTop() { return scrollY + st.t }, get pageLeft() { return 0 }, get scale() { return 1 }, onresize: null, onscroll: null,
    addEventListener: (...a) => alvo.addEventListener(...a), removeEventListener: (...a) => alvo.removeEventListener(...a), dispatchEvent: e => alvo.dispatchEvent(e) };
  try { Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true }) } catch (e) { }
  window.__kb = (fr, top) => { st.h = fr ? Math.round(innerHeight * fr) : null; st.t = top || 0; alvo.dispatchEvent(new Event('resize')); alvo.dispatchEvent(new Event('scroll')) };
};
/* desenho do teclado do iPhone por cima da parte que ele cobre (só para as capturas) */
const teclado = (P, on) => ev(P, on => { document.getElementById('kb-fake')?.remove(); if (!on) return; const v = visualViewport, top = v.offsetTop + v.height; if (innerHeight - top < 40) return;
  const d = document.createElement('div'); d.id = 'kb-fake'; d.style.cssText = `position:fixed;left:0;right:0;top:${top}px;bottom:0;z-index:99999;pointer-events:none;background:#d1d3d9;font:15px -apple-system,system-ui,sans-serif;color:#333`;
  const lin = l => `<div style="display:flex;gap:5px;justify-content:center;margin:10px 4px 0">${[...l].map(c => `<span style="flex:0 0 31px;height:40px;border-radius:6px;background:#fff;display:grid;place-items:center;box-shadow:0 1px 0 #888">${c}</span>`).join('')}</div>`;
  d.innerHTML = `<div style="height:44px;display:flex;align-items:center;gap:22px;padding:0 18px;background:#f4f4f6;border-bottom:1px solid #c8c8cc;font-size:20px;color:#007aff"><span>⌃</span><span>⌄</span><span style="margin-left:auto">✓</span></div>${lin('qwertyuiop')}${lin('asdfghjkl')}${lin('zxcvbnm')}`;
  document.body.appendChild(d) }, on);
/* números da tela: área visível, barra, cabeçalho, linha do cursor, menu */
const est = P => ev(P, () => { const el = $('#layer > .ed132'), v = visualViewport, R = e => e ? e.getBoundingClientRect() : null; const b = R(el.querySelector('.ed132-bar')), h = R(el.querySelector('.ed132-h')), m = el.querySelector('.ed132-menu');
  const s = getSelection(); let c = null; try { c = mb138CaretRect(s) } catch (e) { } const mr = m && !m.hidden ? R(m) : null;
  return { vt: Math.round(v.offsetTop), vb: Math.round(v.offsetTop + v.height), elT: Math.round(R(el).top), elB: Math.round(R(el).bottom), barT: Math.round(b.top), barB: Math.round(b.bottom), hdT: Math.round(h.top), hdB: Math.round(h.bottom),
    cT: c ? Math.round(c.top) : null, cB: c ? Math.round(c.bottom) : null, menu: !!mr, mT: mr ? Math.round(mr.top) : null, mB: mr ? Math.round(mr.bottom) : null, foco: document.activeElement && document.activeElement.id, kb: el.classList.contains('cr137-kb') } });
const menuAberto = P => ev(P, () => { const m = $('#layer > .ed132 .ed132-menu'); return !!(m && !m.hidden) });
const toque = async (P, sel) => { const r = await ev(P, s => { const e = typeof s === 'string' ? document.querySelector(s) : null; if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } }, sel); if (!r) return false; await P.touchscreen.tap(r.x, r.y); await sleep(120); return true };
/* põe o cursor no começo/fim do bloco n (seletor) */
const cursor = (P, sel, fim) => ev(P, ([sel, fim]) => { const cp = $('#ed132-corpo'); cp.focus(); const e = cp.querySelector(sel); const r = document.createRange(); r.selectNodeContents(e); r.collapse(!fim); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }, [sel, fim]);
const corpo = (P, h) => ev(P, h => { const cp = $('#ed132-corpo'); cp.innerHTML = h; ed132Mudou(); cr137Marca() }, h);
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); fs.cpSync(SERIES, path.join(SITE, 'series'), { recursive: true });
  srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  /* WebKit quando existir nesta máquina; senão Chromium com o aparelho do iPhone */
  let brW = null; try { brW = await require('playwright').webkit.launch() } catch (e) { brW = null }
  const br = await U.navegador();
  console.log('iPhone em: ' + (brW ? 'WebKit' : 'Chromium com o aparelho "iPhone 13" (WebKit não está instalado aqui)'));
  const abrir = async (k, o) => { const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = devices[o.dev];
    const p = U.erros(await H.pagina(o.br, { sessao: { user: { id: ids[k], email: k + '@x' } }, viewport, ctx: { deviceScaleFactor: Math.min(2, deviceScaleFactor), isMobile, hasTouch, userAgent } }), o.n);
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    if (o.vv) await p.addInitScript(FAKE_VV);
    await p.goto(o.base); await esperar(p, () => typeof S !== 'undefined' && S.membro && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && ED132.v12.ra !== null, null, 20000); await sleep(400); await fecha(p); return p };
  const novaColuna = async P => { await fecha(P); await ev(P, () => { go('feed'); criarAbrir('post') }); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(450);
    if (await ev(P, () => !!$('#layer > .ed132-hubr'))) { await ev(P, () => document.querySelector('#layer [data-ed132nova]').click()); await sleep(400) } };

  /* ================= iPhone ================= */
  const I = await abrir('b', { br: brW || br, dev: 'iPhone 13', vv: true, n: 'IPHONE', base: BASE });
  ok(await ev(I, () => typeof mb138Vv === 'function' && typeof __kb === 'function' && matchMedia('(pointer:coarse)').matches), '138 carregado; toque e visualViewport simulado');
  await ev(I, () => go('feed')); await sleep(400); await ev(I, () => scrollTo(0, 300)); await sleep(100); const y0 = await ev(I, () => scrollY);
  await ev(I, () => criarAbrir('post')); await sleep(400); await ev(I, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(450);
  ok(await ev(I, () => document.documentElement.classList.contains('mb138-on') && getComputedStyle(document.documentElement).overflow === 'hidden'), 'editor aberto: a página por baixo fica travada');
  await I.fill('#ed132-tit', 'Escrevendo no iPhone'); await toque(I, '#ed132-corpo'); await ev(I, () => { const cp = $('#ed132-corpo'); cp.focus(); ed132CaretFim(cp.lastElementChild || cp) });
  /* teclado abre: 55% da altura */
  await ev(I, () => __kb(.55, 0)); await sleep(450);
  let e = await est(I);
  ok(e.kb && e.elT === e.vt && e.elB === e.vb && e.barB <= e.vb && e.barT >= e.hdB && e.hdT >= e.vt, 'teclado aberto: o editor ocupa só a área visível e a barra é a última faixa dela (acima da barra ^ v ✓ e do teclado)', e);
  ok(await ev(I, () => parseFloat(getComputedStyle($('#layer > .ed132 .ed132-bar')).paddingBottom) <= 8), 'teclado aberto: a barra perde a folga do fim da tela (safe-area), que ficava sobrando em cima do teclado');
  /* 40 linhas: a linha digitada fica sempre à vista */
  let pior = null;
  for (let i = 1; i <= 40; i++) { await I.keyboard.insertText(`Linha ${i} do texto, escrita no celular para ver se a tela acompanha.`); await I.keyboard.press('Enter'); if (i % 8 === 0) { await sleep(120); const x = await est(I); if (!(x.cB <= x.barT - 8 && x.cT >= x.hdB)) pior = pior || { i, ...x } } }
  await I.keyboard.insertText('Última linha, ainda à vista'); await sleep(200); e = await est(I);
  ok(!pior && e.cB <= e.barT - 12 && e.cT >= e.hdB, 'depois de 40 linhas: a linha em que se escreve fica à vista, com folga acima da barra (bug 2 e 3 do Pedro)', pior || e);
  ok(await ev(I, () => { const sc = $('#layer > .ed132 .ed132-sc'); return sc.scrollHeight - sc.scrollTop - sc.clientHeight >= 100 }), 'espaço extra no fim do texto: a última linha pode subir acima do teclado');
  await teclado(I, true); await semToast(I); await sleep(100); await I.screenshot({ path: path.join(QA, '01-escrevendo-fim.png') }); await teclado(I, false);
  /* o Safari "puxa" a tela (offsetTop): o editor acompanha */
  await ev(I, () => __kb(.55, 140)); await sleep(450); e = await est(I);
  ok(e.elT === 140 && e.elB === e.vb && e.cB <= e.barT - 8 && e.cT >= e.hdB, 'Safari puxando a tela (offsetTop 140): editor, barra e linha do cursor continuam na área visível', e);
  await ev(I, () => __kb(.55, 0)); await sleep(300);
  /* Enter e colar no fim também acompanham */
  await I.keyboard.press('Enter'); await ev(I, () => { const dt = new DataTransfer(); dt.setData('text/plain', 'Colado 1\nColado 2\nColado 3\nColado 4\nColado 5\nColado 6'); $('#ed132-corpo').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }); await sleep(250);
  e = await est(I); ok(e.cB <= e.barT - 8 && e.cT >= e.hdB, 'colar várias linhas no fim: a linha do cursor continua à vista', e);

  /* ================= menu Inserir ================= */
  await I.keyboard.press('Enter'); await I.keyboard.type('/'); await sleep(200);
  e = await est(I);
  ok(e.menu && e.mB <= e.barT + 1 && e.mT >= e.hdB && e.cB <= e.mT, 'menu "/": folha compacta logo acima da barra, sem cobrir a linha atual', e);
  ok(await ev(I, () => { const x = $('#layer > .ed132 .ed132-menu [data-mb138mx]'); const r = x && x.getBoundingClientRect(); return !!r && r.width >= 32 && r.top >= 0 }), 'menu: botão × de fechar à vista');
  ok(await ev(I, () => $('#layer > .ed132 .ed132-menu').querySelectorAll('[data-ed132bl]').length) === 9 && await ev(I, () => { const m = $('#layer > .ed132 .ed132-menu'); return m.scrollHeight <= m.clientHeight + 2 }), 'menu: as 9 opções cabem sem rolar (grade 3×3)');
  await teclado(I, true); await semToast(I); await sleep(100); await I.screenshot({ path: path.join(QA, '02-menu-inserir.png') }); await teclado(I, false);
  /* tocar no texto (fora do menu) fecha — o bug 1 do Pedro */
  const outro = await ev(I, () => { const ps = [...$('#ed132-corpo').querySelectorAll('p')]; const m = $('#layer > .ed132 .ed132-menu').getBoundingClientRect(), hd = $('#layer > .ed132 .ed132-h').getBoundingClientRect(); const p = ps.reverse().find(p => { const r = p.getBoundingClientRect(); return Math.min(r.bottom, m.top) - Math.max(r.top, hd.bottom) >= 14 && !/^\//.test(p.textContent) }); const r = p.getBoundingClientRect(); return { x: r.left + 20, y: (Math.min(r.bottom, m.top) + Math.max(r.top, hd.bottom)) / 2 } });
  await I.touchscreen.tap(outro.x, outro.y); await sleep(200);
  ok(!(await menuAberto(I)), 'menu: tocar no texto, fora do menu, fecha (antes ficava aberto até escolher algo)');
  /* voltar à linha do "/" e digitar não reabre */
  await cursor(I, '#ed132-corpo > p:last-child', true); await I.keyboard.type('x'); await sleep(150);
  ok(!(await menuAberto(I)), 'menu fechado na mão: continuar digitando na mesma linha não reabre');
  await I.keyboard.press('Backspace'); await I.keyboard.press('Backspace'); await sleep(100);
  /* Esc */
  await I.keyboard.type('/'); await sleep(150); ok(await menuAberto(I), '"/" abre de novo');
  await I.keyboard.press('Escape'); await sleep(150);
  ok(!(await menuAberto(I)) && await ev(I, () => !!$('#layer > .ed132')), 'menu: Esc fecha o menu e não o editor');
  await I.keyboard.press('Backspace'); await sleep(80);
  /* apagar o "/" */
  await I.keyboard.type('/'); await sleep(150); await I.keyboard.press('Backspace'); await sleep(150);
  ok(!(await menuAberto(I)), 'menu: apagar o "/" fecha');
  /* filtro e nada a filtrar */
  await I.keyboard.type('/fot'); await sleep(150);
  ok(await ev(I, () => [...$('#layer > .ed132 .ed132-menu').querySelectorAll('[data-ed132bl]')].map(b => b.dataset.ed132bl).join()) === 'foto', 'menu: filtra pelo que se digita depois do "/" (como no Notion)');
  await I.keyboard.type('xyz'); await sleep(150);
  ok(!(await menuAberto(I)), 'menu: digitar algo que não filtra nenhuma opção fecha');
  await ev(I, () => { const b = ed132Topo(); b.innerHTML = '<br>'; ed132CaretFim(b) });
  /* trocar de linha */
  await I.keyboard.type('/'); await sleep(150); await I.keyboard.press('ArrowUp'); await ev(I, () => { const ps = $('#ed132-corpo').querySelectorAll('p'); const p = ps[ps.length - 3]; const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }); await sleep(200);
  ok(!(await menuAberto(I)), 'menu: trocar de linha fecha');
  await cursor(I, '#ed132-corpo > p:last-child', true); await ev(I, () => { const b = ed132Topo(); b.innerHTML = '<br>'; ed132CaretFim(b) });
  /* "+" da barra: abre, rolar fecha; abre e o próprio "+" fecha; × fecha; digitar fecha */
  await toque(I, '#layer > .ed132 .cr137-bmais'); ok(await menuAberto(I), '"+" da barra abre o menu');
  await ev(I, () => { const sc = $('#layer > .ed132 .ed132-sc'); sc.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true })); sc.scrollTop -= 200 }); await sleep(350);
  ok(!(await menuAberto(I)), 'menu: rolar o texto fecha');
  await toque(I, '#layer > .ed132 .cr137-bmais'); await toque(I, '#layer > .ed132 .cr137-bmais');
  ok(!(await menuAberto(I)), 'menu: tocar no "+" de novo fecha');
  await toque(I, '#layer > .ed132 .cr137-bmais'); await toque(I, '#layer > .ed132 .ed132-menu [data-mb138mx]');
  ok(!(await menuAberto(I)) && await ev(I, () => document.activeElement.id) === 'ed132-corpo', 'menu: o × fecha e o texto continua com o foco (teclado não fecha)');
  await toque(I, '#layer > .ed132 .cr137-bmais'); await I.keyboard.type('a'); await sleep(150);
  ok(!(await menuAberto(I)), 'menu aberto pelo "+": continuar digitando fecha');
  await toque(I, '#layer > .ed132 .cr137-bmais'); await toque(I, '#layer > .ed132 .ed132-menu [data-ed132bl="h2"]'); await I.keyboard.type('Intertítulo pelo menu'); await sleep(100);
  ok(/<h2>aIntertítulo pelo menu<\/h2>|<h2>Intertítulo pelo menu<\/h2>/.test(await html(I)) && !(await menuAberto(I)), 'menu: escolher uma opção funciona e fecha');
  /* a barra não tira o foco */
  await I.keyboard.press('Enter'); await I.keyboard.type('negrito aqui'); await ev(I, () => { const t = ed132Topo().firstChild; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 8); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }); await sleep(150);
  await teclado(I, true); await semToast(I); await I.screenshot({ path: path.join(QA, '03-barra-selecao.png') }); await teclado(I, false);
  await toque(I, '#layer > .ed132 .ed132-bar [data-ed132cmd="b"]');
  ok(await ev(I, () => document.activeElement.id) === 'ed132-corpo' && /<strong>negrito ?<\/strong> ?aqui/.test(await html(I)), 'tocar no negrito da barra: aplica e o foco continua no texto (o teclado não fecha)');

  /* ================= Backspace e Enter nos blocos ================= */
  await corpo(I, '<p>Antes</p><h2>Título</h2><p>Depois</p>'); await cursor(I, 'h2', false); await I.keyboard.press('Backspace'); await sleep(80);
  ok(/<p>Antes<\/p><p>Título<\/p><p>Depois<\/p>/.test(await html(I)), 'Backspace no começo do título volta a parágrafo (como no Notion)', await html(I));
  await corpo(I, '<p>Antes</p><h3>Sub</h3>'); await cursor(I, 'h3', false); await I.keyboard.press('Backspace'); await sleep(80);
  ok(/<p>Sub<\/p>$/.test(await html(I)), 'Backspace no começo do subtítulo volta a parágrafo');
  await corpo(I, '<p>Antes</p><blockquote><p>Uma fala</p></blockquote>'); await cursor(I, 'blockquote p', false); await I.keyboard.press('Backspace'); await sleep(80);
  ok(/^<p>Antes<\/p><p>Uma fala<\/p>$/.test(await html(I)), 'Backspace no começo da citação volta a parágrafo', await html(I));
  await corpo(I, '<p>Antes</p><ul><li>Um</li><li>Dois</li><li>Três</li></ul>'); await cursor(I, 'li:nth-child(2)', false); await I.keyboard.press('Backspace'); await sleep(80);
  ok(/<ul><li>Um<\/li><\/ul><p>Dois<\/p><ul><li>Três<\/li><\/ul>/.test(await html(I)), 'Backspace no começo de um item de lista vira parágrafo (a lista se divide)', await html(I));
  await corpo(I, '<ol><li>Um</li><li>Dois</li></ol>'); await cursor(I, 'li:nth-child(2)', true); await I.keyboard.press('Enter'); await sleep(60); await I.keyboard.press('Enter'); await sleep(60); await I.keyboard.type('Fora da lista');
  ok(/<ol><li>Um<\/li><li>Dois<\/li><\/ol><p>Fora da lista<\/p>/.test(await html(I)), 'Enter em item vazio sai da lista', await html(I));
  await corpo(I, '<h2>Título</h2>'); await cursor(I, 'h2', true); await I.keyboard.press('Enter'); await I.keyboard.type('Parágrafo');
  ok(/^<h2>Título<\/h2><p>Parágrafo<\/p>$/.test(await html(I)), 'Enter no fim do título abre parágrafo', await html(I));
  await ev(I, () => document.querySelector('#layer [data-ed132cmd="undo"]').click()); await sleep(80);
  ok(!/Parágrafo/.test(await html(I)), 'desfazer continua funcionando depois dessas regras');

  /* ================= acentos, ditado e autocorreção (composição) ================= */
  await corpo(I, '<p><br></p>'); await cursor(I, 'p', true);
  await ev(I, () => $('#ed132-corpo').dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' })));
  await I.keyboard.insertText('## '); await ev(I, () => $('#ed132-corpo').dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: '## ' })));
  await ev(I, () => $('#ed132-corpo').dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '## ' }))); await sleep(80);
  ok(/^<p>##(?: |&nbsp;)?<\/p>$/.test(await html(I)) && await ev(I, () => ed132Topo().tagName === 'P' && /^##/.test(ed132Topo().textContent)), 'durante a composição o atalho "## " não dispara (não quebra acento nem sugestão do teclado)', await html(I));
  await corpo(I, '<p><br></p>'); await cursor(I, 'p', true); await I.keyboard.type('## Depois'); await sleep(60);
  ok(/^<h2>Depois<\/h2>$/.test(await html(I)), 'fora da composição o atalho volta a funcionar');
  if (!brW) {
    const cdp = await I.context().newCDPSession(I); await corpo(I, '<p><br></p>'); await cursor(I, 'p', true); await I.keyboard.type('Caf');
    await cdp.send('Input.imeSetComposition', { text: '´', selectionStart: 1, selectionEnd: 1 }); await sleep(30); await cdp.send('Input.imeSetComposition', { text: 'é', selectionStart: 1, selectionEnd: 1 }); await sleep(30);
    await cdp.send('Input.insertText', { text: 'é' }); await sleep(30); await I.keyboard.type(' com *ação*'); await sleep(80);
    ok(/^<p>Café com <em>ação<\/em><\/p>$/.test(await html(I)), 'acento composto (´ + e) entra certo e o itálico depois funciona', await html(I));
  }

  /* ================= espaço extra, Antes de publicar, salvar ao sair ================= */
  await corpo(I, '<p>Um parágrafo só.</p>'); await ev(I, () => { document.activeElement.blur(); getSelection().removeAllRanges() });
  const xy = await ev(I, () => { const r = $('#ed132-corpo').getBoundingClientRect(), b = $('#layer > .ed132 .ed132-bar').getBoundingClientRect(); return { x: 200, y: Math.min(r.bottom + 30, b.top - 10) } });
  await I.touchscreen.tap(xy.x, xy.y); await sleep(150);
  ok(await ev(I, () => document.activeElement.id === 'ed132-corpo' && getSelection().anchorNode && $('#ed132-corpo').lastElementChild.contains(getSelection().anchorNode)), 'tocar no espaço abaixo do texto põe o cursor no fim');
  await ev(I, () => __kb(0)); await sleep(200);
  await ev(I, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400);
  ok(await ev(I, () => [...document.querySelectorAll('#layer > .ed132 .ed132-pp input:not([type=radio]), #layer > .ed132 .ed132-pp textarea')].every(x => parseFloat(getComputedStyle(x).fontSize) >= 16)), '"Antes de publicar": campos com 16 px (o iPhone não dá zoom ao tocar)');
  await ev(I, () => document.querySelector('#layer > .ed132 [data-ed132ppx]').click()); await sleep(200);
  await corpo(I, '<p>Texto que não pode se perder ao sair do app.</p>');
  await ev(I, () => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; delete document.visibilityState });
  ok(await ev(I, () => /não pode se perder/.test(localStorage.getItem('prumo-ed132-rasc:' + S.uid) || '')), 'app escondido (iPhone troca de app): o rascunho fica salvo no aparelho');
  await ev(I, () => history.back()); await sleep(700);
  ok(await ev(I, () => !$('#layer > .ed132') && !document.documentElement.classList.contains('mb138-on')), 'voltar (gesto do iPhone / botão do Android): fecha o editor e destrava a página');
  ok(await ev(I, y => Math.abs(scrollY - y) <= 2, y0), 'ao fechar, o Feed volta para onde estava');
  ok(await ev(I, () => ed132RascLe().some(r => /não pode se perder/.test(r.html))), 'voltar não perde o texto (fica em Minhas colunas)');

  /* ================= Android ================= */
  const A = await abrir('a', { br, dev: 'Pixel 7', n: 'ANDROID', base: BASE2 });
  const h0 = await ev(A, () => innerHeight);
  await novaColuna(A); await A.fill('#ed132-tit', 'Escrevendo no Android'); await toque(A, '#ed132-corpo'); await ev(A, () => { const cp = $('#ed132-corpo'); cp.focus(); ed132CaretFim(cp.lastElementChild || cp) });
  await A.setViewportSize({ width: 412, height: Math.round(h0 * .55) }); await sleep(450);
  for (let i = 1; i <= 40; i++) { await A.keyboard.insertText(`Linha ${i} no Android, com o teclado aberto.`); await A.keyboard.press('Enter') } await A.keyboard.insertText('Fim'); await sleep(250);
  e = await est(A);
  ok(e.kb && e.barB <= e.vb && e.cB <= e.barT - 8 && e.cT >= e.hdB, 'Android (página encolhe com o teclado): barra no fim da área visível, modo foco e linha digitada à vista depois de 40 linhas', e);
  await A.keyboard.press('Enter'); await A.keyboard.type('/'); await sleep(200); e = await est(A);
  ok(e.menu && e.cB <= e.mT && e.mB <= e.barT + 1, 'Android: menu "/" acima da barra sem cobrir a linha', e);
  await semToast(A); await A.screenshot({ path: path.join(QA, '04-android-menu.png') });
  await A.keyboard.press('Backspace'); await sleep(100); ok(!(await menuAberto(A)), 'Android: apagar o "/" fecha o menu');
  await A.setViewportSize({ width: 412, height: h0 }); await sleep(300);
  ok(!(await ev(A, () => $('#layer > .ed132').classList.contains('cr137-kb'))), 'Android: teclado fechado, sai do modo foco');

  for (const P of [I, A]) ok(!(P._erros || []).length, 'sem erros no console', P._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_editor_celular: ${R.OKS} ok, ${R.FALHAS} falhas`);
  fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true });
  await br.close(); if (brW) await brW.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true }); srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
