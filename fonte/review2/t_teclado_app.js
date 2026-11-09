// Teclado do celular em todas as telas com campo de texto (139): iPhone (Chromium com o aparelho "iPhone 13" e um
// visualViewport falso com ~55% da altura, que não encolhe a página, como o Safari; também com offsetTop, quando o Safari
// "puxa" a tela) e Android ("Pixel 7", a página encolhe). Em cada tela: o campo e a linha digitada ficam à vista e não
// cobertos; o botão de enviar/publicar fica à vista; fonte ≥ 16 px (sem zoom do iPhone); a página de baixo não rola;
// ao fechar o teclado tudo volta ao lugar. Portas 8788–8789. Capturas em qa/teclado-app/ (ANTES=1 grava como "antes-").
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const { devices } = require('playwright');
const PORTA = 8788, PORTA2 = 8789, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'teclado-app'); fs.mkdirSync(QA, { recursive: true });
const ANTES = !!process.env.ANTES, PFX = ANTES ? 'antes-' : 'depois-';
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { try { document.activeElement && document.activeElement.blur && document.activeElement.blur() } catch (e) { } let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 8) { closeLayer._ok = true; try { closeLayer() } catch (e) { $('#layer2') && ($('#layer2').innerHTML = ''); $('#layer').innerHTML = '' } closeLayer._ok = false } try { ED = null } catch (e) { } try { ED132.E = null } catch (e) { } });
/* visualViewport falso (o do Safari do iPhone: o teclado não encolhe a página) */
const FAKE_VV = () => {
  const alvo = new EventTarget(), st = { h: null, t: 0 };
  const vv = { get height() { return st.h === null ? innerHeight : st.h }, get width() { return innerWidth }, get offsetTop() { return st.t }, get offsetLeft() { return 0 },
    get pageTop() { return scrollY + st.t }, get pageLeft() { return 0 }, get scale() { return 1 }, onresize: null, onscroll: null,
    addEventListener: (...a) => alvo.addEventListener(...a), removeEventListener: (...a) => alvo.removeEventListener(...a), dispatchEvent: e => alvo.dispatchEvent(e) };
  try { Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true }) } catch (e) { }
  window.__kb = (fr, top) => { st.h = fr ? Math.round(innerHeight * fr) : null; st.t = top || 0; alvo.dispatchEvent(new Event('resize')); alvo.dispatchEvent(new Event('scroll')) };
};
/* medidas: posição do cursor (linha digitada) no campo, por espelho para input/textarea e por Range no contenteditable */
const MEDE = () => {
  window.__tcCaret = f => {
    if (f.isContentEditable) { const s = getSelection(); if (!s.rangeCount) return null; const r = s.getRangeAt(0).cloneRange(); r.collapse(false); let b = r.getClientRects()[0]; if (!b || !b.height) { const n = r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentNode; b = n.getBoundingClientRect(); return { x: b.left + 6, top: b.bottom - 24, bottom: b.bottom } } return { x: b.left, top: b.top, bottom: b.bottom } }
    const cs = getComputedStyle(f), fr = f.getBoundingClientRect();
    if (f.tagName === 'INPUT') return { x: Math.min(fr.right - 4, fr.left + 12), top: fr.top + fr.height / 2 - 8, bottom: fr.top + fr.height / 2 + 8 };
    const m = document.createElement('div'); for (const k of ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent', 'tabSize']) m.style[k] = cs[k];
    m.style.position = 'absolute'; m.style.visibility = 'hidden'; m.style.whiteSpace = 'pre-wrap'; m.style.overflowWrap = 'break-word'; m.style.top = '0'; m.style.left = '-9999px'; m.style.borderStyle = 'solid';
    m.textContent = f.value.slice(0, f.selectionEnd); const sp = document.createElement('span'); sp.textContent = '​'; m.appendChild(sp); document.body.appendChild(m);
    const y = sp.offsetTop - f.scrollTop, h = sp.offsetHeight || parseFloat(cs.lineHeight) || 20; m.remove();
    return { x: fr.left + 14, top: fr.top + y, bottom: fr.top + y + h };
  };
  window.__tcMede = (campo, botao) => {
    const v = visualViewport, vt = v.offsetTop, vb = v.offsetTop + v.height, f = document.querySelector(campo); if (!f) return { erro: 'sem campo ' + campo };
    const fr = f.getBoundingClientRect(), c = __tcCaret(f), dentro = (el, x, y) => { const e = document.elementFromPoint(x, y); return !!e && (e === el || el.contains(e) || (e.closest && e.closest('label') === el.closest('label') && !!el.closest('label'))) };
    const cy = c ? (c.top + c.bottom) / 2 : null, cx = c ? Math.max(fr.left + 2, Math.min(fr.right - 2, c.x)) : null;
    const r = { vt: Math.round(vt), vb: Math.round(vb), cT: c && Math.round(c.top), cB: c && Math.round(c.bottom), fT: Math.round(fr.top), fB: Math.round(fr.bottom), fs: parseFloat(getComputedStyle(f).fontSize), foco: document.activeElement === f || f.contains(document.activeElement), sy: Math.round(scrollY) };
    r.linha = !!c && c.top >= vt - 1 && c.bottom <= vb + 1 && dentro(f, cx, cy);
    if (botao) { const b = typeof botao === 'string' ? document.querySelector(botao) : null; if (!b) r.botao = false; else { const br = b.getBoundingClientRect(), x = br.left + br.width / 2, y = br.top + br.height / 2; r.bT = Math.round(br.top); r.bB = Math.round(br.bottom); r.botao = br.height > 0 && br.top >= vt - 1 && br.bottom <= vb + 1 && dentro(b, x, y) } }
    return r;
  };
};
/* desenho do teclado do iPhone (só para as capturas) */
const teclado = (P, on) => ev(P, on => { document.getElementById('kb-fake')?.remove(); if (!on) return; const v = visualViewport, top = v.offsetTop + v.height; if (innerHeight - top < 40) return;
  const d = document.createElement('div'); d.id = 'kb-fake'; d.style.cssText = `position:fixed;left:0;right:0;top:${top}px;bottom:0;z-index:99999;pointer-events:none;background:#d1d3d9;font:15px -apple-system,system-ui,sans-serif;color:#333`;
  const lin = l => `<div style="display:flex;gap:5px;justify-content:center;margin:10px 4px 0">${[...l].map(c => `<span style="flex:0 0 31px;height:40px;border-radius:6px;background:#fff;display:grid;place-items:center;box-shadow:0 1px 0 #888">${c}</span>`).join('')}</div>`;
  d.innerHTML = `<div style="height:44px;display:flex;align-items:center;gap:22px;padding:0 18px;background:#f4f4f6;border-bottom:1px solid #c8c8cc;font-size:20px;color:#007aff"><span>⌃</span><span>⌄</span><span style="margin-left:auto">✓</span></div>${lin('qwertyuiop')}${lin('asdfghjkl')}${lin('zxcvbnm')}`;
  document.body.appendChild(d) }, on);
const toque = async (P, sel) => { const r = await ev(P, s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } }, sel); if (!r) return false; await P.touchscreen.tap(r.x, r.y); await sleep(150); return true };
/* caixa do contêiner fixo do campo (folha, tela) para conferir que volta ao lugar */
const caixa = (P, campo) => ev(P, c => { const f = document.querySelector(c); if (!f) return null; let e = f; while (e && e !== document.body) { const p = getComputedStyle(e).position; if (p === 'fixed') break; e = e.parentElement } const s = f.closest('.sheet') || e; const r = s.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), h: Math.round(r.height) } }, campo);

let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  /* iPhone no WebKit (motor do Safari) quando existir nesta máquina (no GitHub existe); senão Chromium com o aparelho */
  let brW = null; try { brW = await require('playwright').webkit.launch() } catch (e) { brW = null }
  const br = await U.navegador();
  console.log('iPhone em: ' + (brW ? 'WebKit' : 'Chromium com o aparelho "iPhone 13" (WebKit não está instalado aqui)'));
  const abrir = async (k, o) => { const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = devices[o.dev];
    const p = U.erros(await H.pagina(o.dev === 'iPhone 13' && brW ? brW : br, { sessao: { user: { id: ids[k], email: k + '@x' } }, viewport, ctx: { deviceScaleFactor: Math.min(2, deviceScaleFactor), isMobile, hasTouch, userAgent } }), o.n);
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    if (o.vv) await p.addInitScript(FAKE_VV); await p.addInitScript(MEDE);
    await p.goto(o.base); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && FEED && FEED.pautas, null, 20000); await sleep(500); await fecha(p); return p };

  /* Pedro publica um story de texto (para a Bia responder) */
  const I = await abrir('b', { dev: 'iPhone 13', vv: true, n: 'IPHONE', base: BASE });
  {
    const PA = await abrir('a', { dev: 'Pixel 7', n: 'A0', base: BASE2 });
    await ev(PA, async () => { const now = Date.now(); await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now, expira: now + 864e5, texto: 'Bom dia, gente', fotos: [], estilo: { fundo: 4 }, publico: 'amigos' }) });
    await PA.close();
  }
  await ev(I, () => typeof pubCarregar === 'function' && pubCarregar()); await sleep(800);
  ok(await ev(I, () => matchMedia('(pointer:coarse)').matches && typeof __kb === 'function'), 'iPhone simulado: toque e visualViewport falso');
  if (!ANTES) ok(await ev(I, () => typeof tc139Vv === 'function'), '139 carregado');
  const pid = await ev(I, () => FEED.pautas[0].id);

  /* telas: como abrir, campo, botão de enviar/publicar, texto (várias linhas quando o campo aceita) */
  const L5 = 'Primeira linha do texto escrita no celular\nSegunda linha, o teclado aberto\nTerceira linha\nQuarta linha\nQuinta linha, ainda à vista';
  const TELAS = [
    { k: 'comentarios', nome: 'Comentários (folha)', abre: P => ev(P, id => openComments(id), pid), campo: '#ctext', botao: '#cform .sendc', texto: L5, shot: 1, manter: 1 },
    { k: 'responder', nome: 'Comentários: responder a um comentário', abre: async P => { await ev(P, id => openComments(id), pid); await sleep(300); await P.fill('#ctext', 'Comentário para responder'); await ev(P, () => $('#cform').requestSubmit()); await sleep(900); await ev(P, () => document.querySelector('#layer [data-resp]')?.click()) }, campo: '#ctext', botao: '#cform .sendc', texto: 'Respondendo\ncom duas linhas' },
    { k: 'conversa', nome: 'Conversa (mensagem direta)', abre: async P => { await ev(P, u => { go('msgs'); abrirConversa(u) }, ids.a); await sleep(500) }, campo: '#mtext', botao: '#mform .send', texto: 'Mensagem bem comprida, como no WhatsApp, para ver se a caixa fica acima do teclado', shot: 1, pagina: true, manter: 1 },
    { k: 'busca-conversas', nome: 'Conversas: pesquisar', abre: async P => { await ev(P, () => { THREAD = null; go('msgs') }); await sleep(500) }, campo: '#dmq', texto: 'Pedro', pagina: true },
    { k: 'post-texto', nome: 'Criar post: só texto', abre: async P => { await ev(P, () => criarAbrir('post')); await sleep(400); await ev(P, () => document.querySelector('#layer [data-edsotexto]').click()); await sleep(400) }, campo: '#ce-leg', botao: '#layer [data-edpubpo]', texto: L5 + '\nSexta linha\nSétima linha\nOitava linha', shot: 1 },
    { k: 'post-analise', nome: 'Criar post: Minha análise (texto)', abre: async P => { await ev(P, () => criarAbrir('post')); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cn102ini="ana"]').click()); await sleep(400) }, campo: '#ce-leg', botao: '#layer [data-edpubpo]', texto: L5 + '\nSexta linha\nSétima linha\nOitava linha' },
    { k: 'post-analise-fonte', nome: 'Criar post: Minha análise (fonte, último campo)', abre: async P => { await ev(P, () => criarAbrir('post')); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cn102ini="ana"]').click()); await sleep(400) }, campo: '#cn102-fu', botao: '#layer [data-edpubpo]', texto: 'https://www.bcb.gov.br' },
    { k: 'post-deperto', nome: 'Criar post: De perto', abre: async P => { await ev(P, () => { criarAbrir('post'); CN102_SEMGAL = 1 }); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cn102ini="rel"]').click()); await sleep(400); await ev(P, () => { CN102_SEMGAL = 0; document.querySelector('#cn102-file')?.remove() }) }, campo: '#ce-leg', botao: '#layer [data-edpubpo]', texto: L5, shot: 1 },
    { k: 'post-enquete', nome: 'Criar post: enquete (opção)', abre: async P => { await ev(P, () => criarAbrir('post')); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cn102ini="enq"]').click()); await sleep(400) }, campo: '#layer [data-cn102o="1"]', botao: '#layer [data-edpubpo]', texto: 'Segunda opção' },
    { k: 'post-noticia', nome: 'Criar post: comentar notícia', abre: async P => { await ev(P, id => cn102Comeca('nt', { pid: id }), pid); await sleep(500) }, campo: '#ce-leg', botao: '#layer [data-edpubpo]', texto: L5 },
    { k: 'story-texto', nome: 'Criar story: texto sobre a imagem', abre: async P => { await ev(P, () => criarAbrir('story')); await sleep(400); await ev(P, () => document.querySelector('#layer [data-edcriar]')?.click()); await sleep(500); await ev(P, () => { if (!$('#ce-txa')) edTexto(null) }); await sleep(300) }, campo: '#ce-txa', botao: '#layer [data-edtxok]', texto: 'Texto do story\ncom três linhas\nsobre a imagem', shot: 1, story: true },
    { k: 'giro-comentar', nome: 'Giro (story de notícia): comentar', abre: async P => { await ev(P, () => { PREF.storyAuto = false; openSecStory(secsStory()[0].id) }); await sleep(800) }, campo: '#layer .sg-rp input', botao: '#layer .sg-rp button', texto: 'Comentário pelo story', story: true, shot: 1 },
    { k: 'story-responder', nome: 'Story de amigo: responder', abre: async P => { await ev(P, () => { PREF.storyAuto = false; go('feed') }); await sleep(400); await ev(P, () => document.querySelector('#secs [data-ustory]')?.click()); await sleep(900) }, campo: '#layer .us-f input', botao: '#layer .us-f input ~ button, #layer .us-f [data-vs98env]', texto: 'Que bom!', story: true },
    { k: 'enviar', nome: 'Enviar notícia a amigos (mensagem)', abre: P => ev(P, id => openSend(id), pid), campo: '#stext', texto: 'Olha isso' },
    { k: 'nome', nome: 'Perfil: mudar meu nome', abre: P => ev(P, () => abrirNome()), campo: '#ntext', botao: '#nform button', texto: ' Souza' },
    { k: 'nota', nome: 'Minha nota', abre: P => ev(P, id => abrirNota(id), pid), campo: '#nota', botao: '#nsave', texto: L5 },
    { k: 'erro', nome: 'Avisar erro', abre: P => ev(P, id => abrirErro(id), pid), campo: '#etext', botao: '#layer .sheet .btn, #layer .sheet [type=submit]', texto: L5 },
    { k: 'login', nome: 'Entrar / criar conta (senha, último campo)', abre: P => ev(P, () => abrirLogin('criar')), campo: '#lsenha', botao: '#lform [type=submit]', texto: '123456' },
    { k: 'busca', nome: 'Busca', abre: async P => { await ev(P, () => go('busca')); await sleep(400) }, campo: '#bvq', texto: 'Selic', pagina: true },
  ];

  const roda = async (P, T, kbOn, kbOff, n) => {
    await fecha(P); await ev(P, () => { go('feed') }); await sleep(250); await ev(P, () => scrollTo(0, 400)); await sleep(150);
    try { await T.abre(P) } catch (e) { ok(false, `${n} · ${T.nome}: abrir`, String(e).slice(0, 200)); return }
    await sleep(350);
    if (!(await ev(P, c => !!document.querySelector(c), T.campo))) { ok(false, `${n} · ${T.nome}: campo ${T.campo} na tela`); return }
    const y0 = await ev(P, () => scrollY), cx0 = await caixa(P, T.campo);
    /* foca como o dedo faz (o toque no iPhone foca e abre o teclado) */
    await ev(P, c => { const f = document.querySelector(c); f.focus(); try { if (f.setSelectionRange) f.setSelectionRange(f.value.length, f.value.length) } catch (e) { } }, T.campo);
    await kbOn(); await sleep(500);
    const linhas = T.texto.split('\n');
    for (let i = 0; i < linhas.length; i++) { if (i) { if (await ev(P, c => document.querySelector(c).tagName === 'TEXTAREA', T.campo)) await ev(P, c => { const f = document.querySelector(c); const a = f.selectionStart; f.setRangeText('\n', a, f.selectionEnd, 'end'); f.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertLineBreak' })) }, T.campo); else await P.keyboard.insertText(' ') } await P.keyboard.insertText(linhas[i]); await sleep(60) }
    await sleep(350);
    const m = await ev(P, ([c, b]) => __tcMede(c, b), [T.campo, T.botao || null]);
    ok(m.foco && m.linha, `${n} · ${T.nome}: campo com o foco e a linha digitada à vista, acima do teclado e sem nada por cima`, m);
    if (T.fundo !== false && !process.env.ANTES) ok(await ev(P, () => { const e = document.querySelector('.tc139-vv'); return !e || /rgb/.test(getComputedStyle(e).boxShadow) }), `${n} · ${T.nome}: a tela estende o fundo para baixo do teclado (nada da página aparece atrás)`);
    if (T.botao) ok(m.botao, `${n} · ${T.nome}: botão de enviar/publicar à vista acima do teclado`, m);
    ok(m.fs >= 16, `${n} · ${T.nome}: fonte do campo ≥ 16 px (o iPhone não dá zoom)`, m.fs);
    if (!T.pagina) ok(Math.abs(m.sy - y0) <= 2, `${n} · ${T.nome}: a página de baixo não rolou`, { y0, sy: m.sy });
    if (T.shot && n === 'iPhone') { await teclado(P, true); await semToast(P); await sleep(80); await P.screenshot({ path: path.join(QA, PFX + T.k + '.png') }); await teclado(P, false) }
    if (!T.pagina && !ANTES) ok(await ev(P, () => document.documentElement.classList.contains('tc139-trava') === (matchMedia('(pointer:coarse)').matches && document.documentElement.classList.contains('tc139-kb'))), `${n} · ${T.nome}: com o teclado aberto a página de baixo fica travada`);
    if (T.manter) { await toque(P, T.botao); await sleep(500); ok(await ev(P, c => !!document.querySelector(c) && document.activeElement === document.querySelector(c), T.campo), `${n} · ${T.nome}: tocar em enviar não fecha o teclado (o campo continua com o foco)`) }
    await kbOff(); await sleep(450);
    const cx1 = await caixa(P, T.campo);
    if (!T.pagina) ok(cx0 && cx1 && Math.abs(cx1.b - cx0.b) <= 4 && cx1.t >= cx0.t - 4 - Math.max(0, cx1.h - cx0.h), `${n} · ${T.nome}: teclado fechado, volta ao lugar`, { cx0, cx1 });
    R.push({ n, k: T.k, m });
  };
  const R = [];
  /* ================= iPhone ================= */
  for (const T of TELAS) await roda(I, T, () => ev(I, () => __kb(.55, 0)), () => ev(I, () => __kb(0)), 'iPhone');
  /* Safari "puxando" a tela (offsetTop) nas folhas principais */
  for (const k of ['comentarios', 'post-texto', 'post-deperto', 'story-texto', 'giro-comentar', 'login']) await roda(I, { ...TELAS.find(t => t.k === k), shot: 0 }, () => ev(I, () => __kb(.55, 120)), () => ev(I, () => __kb(0)), 'iPhone puxado');
  /* ================= Android ================= */
  const A = await abrir('b', { dev: 'Pixel 7', n: 'ANDROID', base: BASE2 }); const h0 = await ev(A, () => innerHeight);
  for (const T of TELAS) await roda(A, T, () => A.setViewportSize({ width: 412, height: Math.round(h0 * .55) }), () => A.setViewportSize({ width: 412, height: h0 }), 'Android');

  for (const P of [I, A]) ok(!(P._erros || []).length, 'sem erros no console', P._erros);
  fs.writeFileSync(path.join(QA, PFX + 'medidas.json'), JSON.stringify(R, null, 1));
  const RS = U.resumo(); console.log(`\nRESUMO t_teclado_app: ${RS.OKS} ok, ${RS.FALHAS} falhas`);
  await br.close(); if (brW) await brW.close(); srv.kill(); srv2.kill(); process.exit(RS.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
