// QA das colunas ponta a ponta (135): Bia escreve no celular (360 px, CPU 4×) com todos os blocos, "/", colar do Word,
// foto, gráfico, rascunhos, sem internet, duas abas, sessão que cai, Voltar do Android, teclado, prévia, publicar,
// editar/histórico, agendar e série; importar .docx/.md/.html e exportar (e-mail, X, carrossel); Carla e Dani leem,
// comentam, curtem, citam e seguem a série; Bia vê os números, fixa 3 comentários e responde; bordas (vazia, só título,
// 40 mil caracteres, texto sem espaços), acessibilidade, 390/430/1280 px, escuro; e o banco só até a v12.
// Reproduz QC01–QC07 (fonte/qa/QA-COLUNAS.md). Portas 8780–8781. Capturas em qa/qa-colunas/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path'), zlib = require('zlib');
const PORTA = 8780, PORTA2 = 8781, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'qa-colunas'); fs.mkdirSync(QA, { recursive: true });
const SITE = path.join(__dirname, '..', 'site'), SERIES = path.join(U.REPO, 'series'), FOTO = path.join(U.REPO, 'icon-192.png');
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
const lateral = P => ev(P, () => ({ doc: document.documentElement.scrollWidth - innerWidth, fora: [...document.querySelectorAll('#layer *, #layer2 *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && !e.closest('.ed132-bar,.ex133-ig,.ex133-tx,.cs123-hts,.acv,.gn,.ed132-vt,.gn-svg') }).slice(0, 5).map(e => e.tagName + '.' + e.className) }));
const semLateral = async P => { const l = await lateral(P); return l.doc <= 0 && !l.fora.length };
const semNome = P => ev(P, () => [...document.querySelectorAll('#layer button, #layer2 button, #layer [role=button]')].filter(b => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent.trim() || b.title)).map(b => b.outerHTML.slice(0, 100)));
/* .docx pequeno montado aqui */
function zip(arqs) { const loc = [], cen = []; let off = 0;
  for (const a of arqs) { const nm = Buffer.from(a.nome), raw = Buffer.from(a.dados), d = zlib.deflateRawSync(raw), crc = zlib.crc32(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nm.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(d.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nm.length, 28); c.writeUInt32LE(off, 42);
    loc.push(h, nm, d); cen.push(c, nm); off += 30 + nm.length + d.length }
  const cs = cen.reduce((s, b) => s + b.length, 0), e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(arqs.length, 8); e.writeUInt16LE(arqs.length, 10); e.writeUInt32LE(cs, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...loc, ...cen, e]) }
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const DOCX = zip([{ nome: '[Content_Types].xml', dados: '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>' },
  { nome: 'word/document.xml', dados: `<?xml version="1.0" encoding="UTF-8"?><w:document ${W}><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Do docx</w:t></w:r></w:p><w:p><w:r><w:t xml:space="preserve">Parágrafo do docx com </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>negrito</w:t></w:r><w:r><w:t>.</w:t></w:r></w:p><w:p><w:r><w:t>Segundo parágrafo do docx.</w:t></w:r></w:p></w:body></w:document>` },
  { nome: 'word/styles.xml', dados: `<?xml version="1.0"?><w:styles ${W}><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style></w:styles>` }]);
/* colado do Word de verdade: negrito e itálico com "mso-bidi-font-weight:normal", listas mso, citação e imagem local */
const WORD = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta name=Generator content="Microsoft Word 15"><style><!-- p.MsoNormal{margin:0cm} --></style></head><body lang=PT-BR><!--StartFragment-->
<p class=MsoNormal style='text-align:justify'><span style='font-family:"Calibri",sans-serif'>O texto aprovado traz <b style='mso-bidi-font-weight:normal'>três mudanças</b> e uma <i style='mso-bidi-font-style:normal'>surpresa</i>.<o:p></o:p></span></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp; </span></span></span><![endif]>IVA dual<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l0 level1 lfo1'><![if !supportLists]><span style='font-family:Symbol'><span style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp; </span></span></span><![endif]>Cashback<o:p></o:p></p>
<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>1.<span style='font:7.0pt "Times New Roman"'>&nbsp; </span></span><![endif]>Primeiro passo<o:p></o:p></p>
<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><![if !supportLists]><span style='mso-list:Ignore'>2.<span style='font:7.0pt "Times New Roman"'>&nbsp; </span></span><![endif]>Segundo passo<o:p></o:p></p>
<p class=MsoQuote>Uma frase dita no plenário.<o:p></o:p></p>
<p class=MsoNormal><![if !vml]><img width=200 src="file:///C:/Users/x/image001.png"><![endif]><o:p></o:p></p><!--EndFragment--></body></html>`;
const LONGA = 'Superintendenciadoorcamentoeplanejamentodouniversoinfinito'.repeat(4), URL_L = 'https://www.exemplo.com.br/' + 'caminho-muito-longo/'.repeat(12) + '?q=1';
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); fs.cpSync(SERIES, path.join(SITE, 'series'), { recursive: true });
  srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c', 'd']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro')`, [ids.a, ids.b, ids.c, ids.d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  await H.sql(`update public.membros set perfil_aberto = true where uid = $1`, [ids.b]);
  await H.sql(`insert into public.seguidores(seguidor, seguido) values ($1,$2)`, [ids.d, ids.b]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const br = await U.navegador();
  const pronto = (P, sem13) => esperar(P, s13 => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && ED132.v12.ra !== null && ED132.v12.ve !== null && (s13 || LT134.v13 !== null), sem13, 30000);
  const abrir = async (k, o = {}) => { const p = U.erros(await (o.H || H).pagina(br, { sessao: { user: { id: (o.ids || ids)[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    if (o.cpu) { const c = await p.context().newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: o.cpu }) }
    await p.goto(o.base || BASE); await pronto(p); await sleep(400); await fecha(p);
    await ev(p, () => { window.__cb = []; Object.defineProperty(navigator, 'clipboard', { value: { write: async () => { }, writeText: async t => { window.__cb.push(t) } }, configurable: true }) });
    return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const fim = async P => { await ev(P, () => { const cp = $('#ed132-corpo'); cp.focus({ preventScroll: true }); const r = document.createRange(); r.selectNodeContents(cp); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }) };
  const html = P => ev(P, () => ed132Le().html);
  const cmd = (P, k) => ev(P, k => document.querySelector(`#layer > .ed132 [data-ed132cmd="${k}"]`).click(), k);
  const cola = (P, h, t) => ev(P, ([h, t]) => { const dt = new DataTransfer(); if (h) dt.setData('text/html', h); dt.setData('text/plain', t || ''); $('#ed132-corpo').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }, [h, t]);
  const st = P => ev(P, () => $('#layer > .ed132 .ed132-st')?.textContent || '');
  const loc = (P, re) => ev(P, re => ed132RascLe().some(r => new RegExp(re).test(r.html)), re);
  const sbFalha = (P, modo) => ev(P, m => { if (!window.__sbOk) window.__sbOk = window.__sb; window.__sb = m === 'rede' ? () => Promise.reject(new TypeError('Failed to fetch')) : j => { const o = JSON.parse(j).op; if (o.table === 'publicacoes' && o.action === 'insert') return Promise.resolve(JSON.stringify({ data: null, error: { message: 'JWT expired', code: 'PGRST301' } })); return window.__sbOk(j) } }, modo);
  const sbVolta = P => ev(P, () => { if (window.__sbOk) window.__sb = window.__sbOk });

  /* ================= 1. Bia escreve no celular (360 px, CPU 4×) ================= */
  const B = await abrir('b', { vp: { width: 360, height: 740 }, cpu: 4 });
  let t0 = Date.now(); await ev(B, () => { go('feed'); criarAbrir('post') }); await sleep(150);
  await ev(B, () => document.querySelector('#layer [data-cs123ini]').click()); await esperar(B, () => !!document.querySelector('#ed132-corpo'), null, 8000);
  const tAbre = Date.now() - t0; ok(tAbre < 3000, 'CPU 4×: o editor abre em menos de 3 s', tAbre);
  await B.fill('#ed132-tit', 'O orçamento no corredor 🎉'); await B.fill('#ed132-lin', 'O que se ouve no Congresso antes da votação');
  await fim(B); await B.keyboard.type('Toda semana eu passo pelo Congresso 😀👍🏽 e a conversa mudou. ');
  await B.keyboard.press('Control+b'); await B.keyboard.type('Isso pesa'); await B.keyboard.press('Control+b'); await B.keyboard.type(' no orçamento.');
  await B.keyboard.press('Enter'); await B.keyboard.type('/tit'); await sleep(200);
  ok(await ev(B, () => !$('#layer > .ed132 .ed132-menu').hidden), '"/" abre o menu de blocos');
  await B.keyboard.press('Enter'); await B.keyboard.type('Intertítulo ' + LONGA); await B.keyboard.press('Enter');
  await B.keyboard.type('/lista'); await sleep(150); await B.keyboard.press('Enter'); await B.keyboard.type('Item com link ' + URL_L); await B.keyboard.press('Enter'); await B.keyboard.type('Outro item'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('/cit'); await sleep(150); await B.keyboard.press('Enter'); await B.keyboard.type('A conta não fecha.'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('Parágrafo sem espaços: ' + LONGA); await B.keyboard.press('Enter');
  /* QC03: colar do Word */
  await cola(B, WORD, 'O texto aprovado traz três mudanças'); await sleep(400);
  let h = await html(B);
  ok(/<strong>três mudanças<\/strong>/.test(h) && /<em>surpresa<\/em>/.test(h), 'QC03: colar do Word mantém o negrito e o itálico (Word manda "mso-bidi-font-weight:normal")', h.slice(h.indexOf('aprovado') - 10, h.indexOf('aprovado') + 120));
  ok(/<ul><li>IVA dual<\/li><li>Cashback<\/li><\/ul><ol><li>Primeiro passo<\/li><li>Segundo passo<\/li><\/ol><blockquote><p>Uma frase dita no plenário\.<\/p><\/blockquote>/.test(h) && !/mso|style=|<o:p|file:/.test(h) && /1 imagem não foi trazida/.test(await toastTx(B)), 'colar do Word: listas, citação, nada de estilo mso e aviso da imagem local');
  await fim(B); await B.keyboard.press('Enter'); await B.keyboard.press('Enter'); await B.keyboard.type('Antes da foto.');
  const [fc] = await Promise.all([B.waitForEvent('filechooser'), cmd(B, 'foto')]); await fc.setFiles(FOTO);
  ok(await esperar(B, () => !!document.querySelector('#ed132-corpo figure[data-f] img') && !!document.querySelector('#ed132-leg'), null, 10000), 'foto sobe e pede legenda');
  await B.fill('#ed132-leg', 'Plenário em dia de votação'); await B.fill('#ed132-cred', 'Foto: Bia Souza'); await ev(B, () => document.querySelector('[data-ed132figok]').click()); await sleep(200);
  await cmd(B, 'graf'); await esperar(B, () => !!document.querySelector('[data-ed132gs]'), null, 8000); await ev(B, () => document.querySelector('[data-ed132gs]').click()); await sleep(300);
  await B.keyboard.type('Último parágrafo, depois do gráfico.');
  h = await html(B);
  ok(/<h2>Intertítulo /.test(h) && /<figure data-f=/.test(h) && /<figure data-g=/.test(h) && /<\/ul><blockquote><p>A conta não fecha\.<\/p><\/blockquote><p>Parágrafo sem espaços/.test(h) && /<strong>Isso pesa<\/strong>/.test(h) && /<\/blockquote><p>Antes da foto/.test(h), 'QC05: todos os blocos no HTML; "/" funciona na linha logo depois de uma lista', h.slice(h.indexOf('</ul>'), h.indexOf('</ul>') + 120));
  await sleep(2600);
  ok(/salvo/i.test(await st(B)) && await loc(B, 'Último parágrafo'), 'salva sozinho ("Rascunho salvo")', await st(B));
  ok(await semLateral(B), '360 px: editor sem rolagem lateral (palavra sem espaços e link longo)', await lateral(B));
  ok(!(await semNome(B)).length, 'acessibilidade: botões do editor com rótulo', await semNome(B));
  ok(await ev(B, () => { const b = document.querySelector('#layer [data-ed132cmd="b"]'); b.focus(); const s = getComputedStyle(b); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 }), 'acessibilidade: foco visível na barra');
  /* teclado do celular: a barra fica acima dele */
  const kb = await ev(B, () => { const vv = visualViewport, h0 = innerHeight; Object.defineProperty(vv, 'height', { value: h0 - 300, configurable: true }); vv.dispatchEvent(new Event('resize')); const r = $('#layer > .ed132 .ed132-bar').getBoundingClientRect(); delete vv.height; Object.defineProperty(vv, 'height', { get: () => h0, configurable: true }); return { b: r.bottom, lim: h0 - 300 } });
  ok(kb.b <= kb.lim + 1, 'teclado aberto: a barra de formatação fica acima do teclado', kb); await ev(B, () => visualViewport.dispatchEvent(new Event('resize')));
  /* prévia */
  await ev(B, () => document.querySelector('[data-ed132modo="ver"]').click()); await sleep(400);
  ok(await ev(B, () => !!$('#layer > .ed132 .ed132-ver .cs123-corpo h2')) && await semLateral(B), 'ver como leitor sem rolagem lateral (intertítulo e lista com palavras enormes)', await lateral(B));
  await shot(B, '01-previa-360');
  await ev(B, () => document.querySelector('[data-ed132pva="feed"]').click()); await sleep(300); ok(await semLateral(B), 'prévia do cartão do Feed sem rolagem lateral');
  await ev(B, () => document.querySelector('[data-ed132modo="ed"]').click()); await sleep(200);
  const rid1 = await ev(B, () => ED132.E.rid);

  /* ================= 2. fechar/reabrir, vários rascunhos, Voltar do Android ================= */
  await B.reload(); await pronto(B); await sleep(300); await fecha(B);
  await ev(B, () => ed132Hub()); await sleep(600);
  ok(/O orçamento no corredor/.test(await ev(B, () => $('#layer > .ed132-hubr').textContent)), 'reabrir o app: o rascunho está em Minhas colunas');
  await ev(B, () => document.querySelector('[data-ed132nova]').click()); await sleep(300);
  await B.fill('#ed132-tit', 'Segundo rascunho'); await fim(B); await B.keyboard.type('Texto do segundo rascunho, ainda no começo.');
  /* link aberto + Voltar: fecha só a folha */
  await B.keyboard.press('Control+k'); await sleep(300); await B.goBack(); await sleep(500);
  ok(await ev(B, () => !$('#layer2')?.innerHTML && !!$('#layer > .ed132')), 'Voltar com a folha do link aberta: fecha só a folha');
  await B.goBack(); await sleep(800);
  ok(await ev(B, () => !$('#layer').innerHTML && !ED132.E && /index\.html/.test(location.href) && ed132RascLe().some(r => r.tit === 'Segundo rascunho' && /começo/.test(r.html))), 'Voltar do Android no editor: fecha sem sair do app e guarda o texto');
  await ev(B, () => ed132Hub()); await sleep(500);
  ok(await ev(B, () => document.querySelectorAll('#layer > .ed132-hubr [data-ed132rx]').length) === 2, 'Minhas colunas: 2 rascunhos');
  await ev(B, rid => document.querySelector(`[data-ed132rabre="${rid}"]`).click(), rid1); await sleep(500);
  ok(await ev(B, () => /três mudanças/.test($('#ed132-corpo').innerHTML) && !!$('#ed132-corpo figure[data-f] img')), 'continuar o rascunho: texto e foto voltam');

  /* ================= 3. sem internet no meio da edição ================= */
  await sbFalha(B, 'rede'); await fim(B); await B.keyboard.type(' Escrito sem internet.'); await sleep(2800);
  ok(/neste aparelho/.test(await st(B)) && await loc(B, 'sem internet'), 'sem internet: "Salvo neste aparelho" e o texto guardado no aparelho', await st(B));
  await sbVolta(B); await fim(B); await B.keyboard.type(' Voltou.'); await sleep(2800);
  ok(/Rascunho salvo/.test(await st(B)) && /sem internet\. Voltou/.test((await H.sql(`select dados from public.coluna_rascunhos where rid=$1`, [rid1]))[0].dados.html), 'internet de volta: o rascunho sobe para o banco');

  /* ================= 4. QC01: duas abas no mesmo rascunho ================= */
  const B2 = U.erros(await B.context().newPage(), 'B2'); await B2.goto(BASE); await pronto(B2); await sleep(300); await fecha(B2);
  await ev(B2, rid => ed132Abre(ed132DoRasc(ed132RascLe().find(r => r.rid === rid))), rid1); await sleep(400);
  await fim(B); await B.keyboard.type(' NOVO DA ABA UM.'); await sleep(2800);
  ok(await esperar(B2, () => /NOVO DA ABA UM/.test($('#ed132-corpo')?.innerHTML || ''), null, 3000), 'QC01: a outra aba (sem mudança) passa a mostrar o texto novo');
  await ev(B2, () => document.dispatchEvent(new Event('visibilitychange'))); await ev(B2, () => closeLayer()); await sleep(800);
  const dbr = (await H.sql(`select dados from public.coluna_rascunhos where rid=$1`, [rid1]))[0].dados.html;
  ok(await loc(B, 'NOVO DA ABA UM') && /NOVO DA ABA UM/.test(dbr), 'QC01: fechar a aba parada não apaga o texto novo (aparelho e banco)');
  /* sem mudança, abrir e fechar não "rejuvenesce" o rascunho */
  const at0 = await ev(B2, rid => ed132RascLe().find(r => r.rid === rid).at, rid1);
  await ev(B2, rid => ed132Abre(ed132DoRasc(ed132RascLe().find(r => r.rid === rid))), rid1); await sleep(300); await ev(B2, () => closeLayer()); await sleep(300);
  ok(await ev(B2, rid => ed132RascLe().find(r => r.rid === rid).at, rid1) === at0, 'abrir e fechar sem mudar nada não muda a data do rascunho');
  await B2.close();

  /* ================= 5. QC02: a sessão cai no meio da edição ================= */
  const uidB = ids.b; await ev(B, () => window.__sbClient.auth.signOut()); await sleep(1500);
  ok(/sessão terminou/.test(await toastTx(B)), 'QC02: aviso quando a sessão termina com o editor aberto', await toastTx(B));
  if (await ev(B, () => !!$('#ed132-corpo'))) { await fim(B); await B.keyboard.type(' DEPOIS DA SESSAO.'); await sleep(2600) }
  await ev(B, () => { try { closeLayer() } catch (e) { } }); await sleep(300);
  ok(await ev(B, () => !localStorage.getItem('prumo-ed132-rasc:null') && !localStorage.getItem('prumo-ed132-rasc:')), 'QC02: nada vai para a gaveta sem dono');
  await ev(B, u => localStorage.setItem('sb-fake-session', JSON.stringify({ user: { id: u, email: 'b@x' } })), uidB); await B.reload(); await pronto(B); await sleep(300); await fecha(B);
  ok(await loc(B, 'DEPOIS DA SESSAO'), 'QC02: entrar de novo: o texto escrito depois da queda está no rascunho');

  /* ================= 6. bordas no editor ================= */
  await ev(B, () => ed132Abre(ed132Novo({}))); await sleep(300);
  const tentaPub = async () => { await semToast(B); await ev(B, () => { document.querySelector('[data-ed132painel]').click(); document.querySelector('[data-ed132pub]').click(); document.querySelector('[data-ed132ppx]')?.click() }); await sleep(300) };
  await tentaPub();
  ok(/Dê um título/.test(await toastTx(B)), 'coluna vazia: "Dê um título à coluna."'); await semToast(B);
  await B.fill('#ed132-tit', 'Só título'); await tentaPub();
  ok(/Escreva o texto/.test(await toastTx(B)), 'só título: "Escreva o texto da coluna antes de publicar."'); await semToast(B);
  await fim(B); await cola(B, Array.from({ length: 180 }, (_, i) => `<p>Parágrafo ${i} ` + 'palavra '.repeat(26) + '</p>').join('')); await sleep(600);
  ok(await esperar(B, () => /passou do limite de 40\.000/.test($('[data-ed132cont]').textContent), null, 3000), 'QC07: 40 mil caracteres: a contagem avisa que passou do limite', await ev(B, () => $('[data-ed132cont]').textContent));
  await tentaPub();
  ok(/passou de 40\.000/.test(await toastTx(B)), 'acima de 40 mil: Publicar recusa com o motivo');
  await ev(B, () => { ed132RascTira(ED132.E.rid); ED132.E.salvou = false }); await fecha(B); await ev(B, () => { ed132RascGrava(ed132RascLe().filter(r => r.tit !== 'Só título')) });

  /* ================= 7. publicar (sessão expirada, depois de verdade) ================= */
  await ev(B, () => ed132Hub()); await sleep(400); await ev(B, rid => document.querySelector(`[data-ed132rabre="${rid}"]`).click(), rid1); await sleep(500);
  await ev(B, () => document.querySelector('[data-ed132painel]').click()); await sleep(400);
  await B.fill('#ed132-ser', 'Bastidores'); await B.fill('#ed132-num', '1'); await B.fill('#ed132-tags', '#Orçamento #Congresso');
  const pt = await ev(B, () => { const b = document.querySelector('[data-ed132pt]'); if (b) b.click(); return b ? b.dataset.ed132pt : null });
  await sbFalha(B, 'jwt'); await ev(B, () => document.querySelector('[data-ed132pub]').click()); await sleep(600);
  ok(/sessão expirou/.test(await toastTx(B)) && await ev(B, () => !!ED132.E), 'QC04: publicar com a sessão expirada diz para entrar de novo e o texto fica', await toastTx(B));
  await sbVolta(B); await semToast(B);
  t0 = Date.now(); await ev(B, () => document.querySelector('[data-ed132pub]').click()); await esperar(B, () => !ED132.E, null, 10000);
  const tPub = Date.now() - t0; ok(tPub < 3000 && /Coluna publicada/.test(await toastTx(B)), 'CPU 4×: publicar leva menos de 3 s', tPub);
  const [c1] = await H.sql(`select id, publico, estilo, corpo, texto from public.publicacoes where autor=$1 and estilo->'coluna'->>'tit' like 'O orçamento%'`, [ids.b]);
  ok(c1 && c1.publico === 'amigos' && c1.estilo.coluna.serie === 'Bastidores' && (!pt || c1.estilo.coluna.pautas.length === 1) && /três mudanças/.test(c1.corpo) && /#Orçamento/.test(JSON.stringify(c1)), 'publicada para amigos com série, hashtags e assunto ligado', c1 && [c1.publico, c1.estilo, pt, (c1.corpo || '').slice(0, 300)]);
  ok(!(await ev(B, () => ed132RascLe().some(r => /O orçamento/.test(r.tit)))), 'o rascunho publicado sai de Minhas colunas');
  /* editar → "editado"; histórico e restaurar */
  await sleep(2200);
  await ev(B, id => ed132Edita(id), c1.id); await sleep(400); await fim(B); await B.keyboard.type(' Acréscimo depois de publicar.');
  await ev(B, () => document.querySelector('[data-ed132salva]').click()); await esperar(B, () => !ED132.E, null, 8000);
  await ev(B, id => cs123Abrir(id), c1.id); await sleep(400);
  ok(/editado em/.test(await ev(B, () => $('#layer .cs123-by small').textContent)), 'editar depois: a página mostra "editado em …"');
  await fecha(B); await ev(B, id => ed132Edita(id), c1.id); await sleep(300); await ev(B, () => ed132Historico()); await sleep(600);
  await ev(B, () => document.querySelector('[data-ed132vr]').click()); await sleep(300);
  ok(await ev(B, () => !/Acréscimo depois/.test(ed132Le().html)), 'histórico: restaurar a versão anterior põe o texto antigo no editor');
  await ev(B, () => document.querySelector('[data-ed132salva]').click()); await esperar(B, () => !ED132.E, null, 8000);
  ok(!/Acréscimo depois/.test((await H.sql(`select corpo from publicacoes where id=$1`, [c1.id]))[0].corpo), 'restaurar + Salvar: a coluna volta ao texto anterior');

  /* ================= 8. agendar e série ================= */
  const escreve = async (tit, n, o = {}) => { await fecha(B); await ev(B, () => ed132Abre(ed132Novo({}))); await sleep(300); await B.fill('#ed132-tit', tit); await fim(B);
    await B.keyboard.type(`Texto da coluna ${tit}, com o bastante para passar de quarenta caracteres.`); await ev(B, () => document.querySelector('[data-ed132painel]').click()); await sleep(300);
    if (n) { await B.fill('#ed132-ser', 'Bastidores'); await B.fill('#ed132-num', String(n)) }
    if (o.seg) await ev(B, () => document.querySelector('[data-ed132pubv="seguidores"]').click());
    if (o.ag) { await ev(B, () => document.querySelector('[data-ed132qv="ag"]').click()); await sleep(200);
      await ev(B, () => { const p = ed132SpPartes(Date.now() + 10 * 60e3), d = $('#ed132-qd'), hh = $('#ed132-qh'); d.value = p.d; hh.value = p.h; d.dispatchEvent(new Event('input', { bubbles: true })); hh.dispatchEvent(new Event('input', { bubbles: true })) }) }
    await ev(B, () => document.querySelector('[data-ed132pub]').click()); await esperar(B, () => !ED132.E, null, 10000); await sleep(300);
    return (await H.sql(`select id from publicacoes where estilo->'coluna'->>'tit'=$1`, [tit]))[0].id };
  const c2 = await escreve('Bastidores dois', 2, { ag: true });
  ok(/agendada/.test(await toastTx(B)) && await ev(B, () => ED132.agend.length === 1), 'agendar para daqui a pouco: só a autora vê (Minhas colunas)');
  const c3 = await escreve('Bastidores três', 3);
  const C = await abrir('c', { vp: { width: 430, height: 900 } });
  ok(!(await como('c', `select id from publicacoes where id=$1`, [c2])).length && await ev(C, id => !pubDe(id), c2), 'Carla não vê a coluna agendada antes da hora (banco e app)');
  await H.sql(`update publicacoes set publicar_em = now() - interval '1 second', at = (extract(epoch from now())*1000)::bigint where id=$1`, [c2]);
  await recarrega(C); ok(await ev(C, id => !!pubDe(id), c2), 'chegou a hora: Carla vê a coluna');
  await ev(C, id => cs123Abrir(id), c2); await sleep(500);
  ok(await ev(C, () => /Anterior/.test($('#layer .ed132-nav').textContent) && /Próxima/.test($('#layer .ed132-nav').textContent) && /3 colunas/.test($('#layer .ed132-nav').textContent)), 'série de 3: anterior e próxima');
  await fecha(C);

  /* ================= 9. importar e exportar ================= */
  await ev(B, () => ed132Abre(ed132Novo({}))); await sleep(300);
  const importa = async (nome, buf) => { await ev(B, () => document.querySelector('[data-ex133imp]').click()); await sleep(200);
    const [f] = await Promise.all([B.waitForEvent('filechooser'), ev(B, () => document.querySelector('[data-ex133arq]').click())]); await f.setFiles({ name: nome, mimeType: 'application/octet-stream', buffer: buf });
    await esperar(B, () => !!document.querySelector('[data-ex133vai]'), null, 6000); const v = await ev(B, () => $('[data-ex133vai]').textContent); await ev(B, () => document.querySelector('[data-ex133ap="sub"]').click()); await sleep(400); return v };
  let v = await importa('coluna.docx', DOCX); h = await html(B);
  ok(/2 parágrafos/.test(v) && await ev(B, () => $('#ed132-tit').value) === 'Do docx' && /<strong>negrito<\/strong>/.test(h), 'importar .docx (título, negrito)', [v, h]);
  v = await importa('coluna.md', Buffer.from('# Do md\n\nTexto **forte** do md.\n\n- a\n- b\n')); h = await html(B);
  ok(/<strong>forte<\/strong>/.test(h) && /<ul><li>a<\/li><li>b<\/li><\/ul>/.test(h), 'importar .md', h);
  v = await importa('coluna.html', Buffer.from('<h1>Do html</h1><p onclick="x()">Texto <b>forte</b> <script>window.__mau=1</script></p>')); h = await html(B);
  ok(/<strong>forte<\/strong>/.test(h) && !/script|onclick/.test(h) && await ev(B, () => window.__mau === undefined), 'importar .html limpo', h);
  await ev(B, () => { ed132RascTira(ED132.E.rid); ED132.E.salvou = false }); await fecha(B);
  /* exportar a coluna publicada (com intertítulo sem espaços) */
  const ex = await ev(B, id => { const F = ex133DaPub(id); const mail = ex133Email(F, true), fio = ex133Fio(F); return { mail, fio, li: ex133Li(F).t.length, md: ex133Md(F) } }, c1.id);
  ok(!/<script|\son\w+=|javascript:/i.test(ex.mail) && /três mudanças/.test(ex.mail) && /publicado originalmente no Prumo/.test(ex.mail), 'e-mail: conteúdo certo e nada de script', ex.mail.slice(0, 200));
  ok(ex.fio.length > 2 && ex.fio.every(p => p.length <= 280), 'QC05: X: todos os posts do fio com até 280 caracteres (intertítulo sem espaços)', ex.fio.map(p => p.length));
  const fio2 = await ev(B, () => ex133Fio({ tit: 'Título', linha: '', nome: 'Bia Souza', html: '<h2>' + 'Intertitulosemespacos'.repeat(20) + '</h2><p>Um parágrafo curto.</p><h3>' + 'x'.repeat(600) + '</h3>' }));
  ok(fio2.every(p => p.length <= 280) && fio2.join('').replace(/\d+\/\d+ /g, '').indexOf('Intertitulosemespacos'.repeat(5)) >= 0, 'QC06: X: intertítulo mais longo que um post é quebrado (nada passa de 280)', fio2.map(p => p.length));
  ok(ex.li <= 3000 && /^# O orçamento/.test(ex.md), 'LinkedIn até 3.000 e Markdown com o título');
  await ev(B, id => cs123Abrir(id), c1.id); await sleep(400); await ev(B, () => document.querySelector('#layer [data-ex133exp]').click()); await sleep(300);
  await ev(B, () => document.querySelector('[data-ex133d="ig"]').click()); ok(await esperar(B, () => (EX133.igb || []).filter(Boolean).length >= 3, null, 15000), 'Instagram: o carrossel gera as imagens');
  ok(!(await semNome(B)).length, 'acessibilidade: folha de exportar com rótulos', await semNome(B)); await fecha(B);

  /* ================= 10. Carla e Dani leem, comentam, curtem, citam, seguem ================= */
  const c4 = await escreve('Para seguidores também', 4, { seg: true });
  const D = await abrir('d', { vp: { width: 1280, height: 800 }, dark: true });
  ok(!(await ev(D, id => !!pubDe(id), c1.id)) && await ev(D, id => !!pubDe(id), c4), 'Dani (só segue) não vê a coluna para amigos e vê a para seguidores');
  await recarrega(C); await ev(C, () => { go('feed'); FILTRO = 'tudo'; renderPosts(); for (let i = 0; i < 10; i++) try { carregarMais(true) } catch (e) { } });
  await esperar(C, id => !!document.querySelector(`#v-feed button[data-cs123ler="${id}"]`), c4, 6000);
  await ev(C, id => document.querySelector(`#v-feed button[data-cs123ler="${id}"]`).click(), c4); await sleep(1500);
  ok(await semLateral(C), '430 px: Carla lê sem rolagem lateral'); await shot(C, '02-carla-430');
  await ev(C, () => document.querySelector('#layer .cs123-fim [data-a="like"]').click()); await sleep(400);
  for (const t of ['Muito bom, Bia', 'Faltou falar das emendas']) { await ev(C, id => openComments('u:' + id), c4); await sleep(300); await C.fill('#ctext', t); await ev(C, () => document.querySelector('#cform .sendc').click()); await sleep(700); await ev(C, () => closeLayer()); await sleep(200) }
  await ev(C, () => document.querySelector('#layer [data-lt134asss="Bastidores"]').click()); await sleep(500);
  await ev(C, () => { const p = document.querySelector('#layer .cs123-corpo p'); const r = document.createRange(); r.setStart(p.firstChild, 0); r.setEnd(p.firstChild, 30); const s = getSelection(); s.removeAllRanges(); s.addRange(r) });
  await esperar(C, () => !!document.querySelector('#layer .lt134-bar [data-lt134cit]'), null, 3000); await ev(C, () => document.querySelector('[data-lt134cit]').click()); await sleep(400);
  await C.fill('#lt134-ct', 'Trecho bom'); await ev(C, () => document.querySelector('[data-lt134pub]').click()); await sleep(1000); await fecha(C);
  await ev(D, () => { go('feed'); FILTRO = 'tudo'; renderPosts() }); await ev(D, u => abrirPerfil(u), ids.b);
  await esperar(D, id => !!document.querySelector(`#layer .pfv [data-cs123ler="${id}"]`), c4, 6000); await ev(D, id => document.querySelector(`#layer .pfv [data-cs123ler="${id}"]`).click(), c4); await sleep(1500);
  ok(await semLateral(D) && await ev(D, () => { const n = c => { const k = document.createElement('canvas').getContext('2d'); k.fillStyle = c; k.fillRect(0, 0, 1, 1); const d = k.getImageData(0, 0, 1, 1).data; return d[0] + d[1] + d[2] }; return n(getComputedStyle($('#layer .cs123-ler')).backgroundColor) < 200 }), 'desktop 1280 escuro: Dani lê pelo perfil');
  await ev(D, id => openComments('u:' + id), c4); await sleep(300); await D.fill('#ctext', 'Comentário da Dani'); await ev(D, () => document.querySelector('#cform .sendc').click()); await sleep(700); await fecha(D);
  const lt = await H.sql(`select leitor, origem from coluna_leituras where pub=$1 order by origem`, [c4]);
  ok(lt.length === 2 && lt.map(r => r.origem).join(',') === 'feed,perfil', 'leituras registradas com origens diferentes (Feed e perfil)', lt);
  ok((await H.sql(`select 1 from coluna_assinaturas where leitor=$1 and serie='Bastidores'`, [ids.c])).length === 1, 'Carla segue a série');
  /* Bia: números (sem nomes de quem só leu), fixa 3 comentários e responde */
  await recarrega(B); await ev(B, id => cs123Abrir(id), c4); await sleep(500); await ev(B, () => document.querySelector('#layer .lt134-lb').click());
  await esperar(B, () => !!document.querySelector('#lt134-np .lt134-k'), null, 6000);
  const pn = await ev(B, () => ({ l: $('#lt134-np [data-lt134v="leituras"]').textContent, tx: $('#lt134-np').textContent }));
  ok(pn.l === '2' && /Curtiram: Carla Mendes/.test(pn.tx) && /Comentaram: .*Dani Rocha/.test(pn.tx) && !/Pedro/.test(pn.tx), 'números: 2 leituras; nomes só de quem curtiu/comentou', pn.tx.slice(0, 300));
  ok(!(await semNome(B)).length && await semLateral(B), 'painel de números: rótulos e sem rolagem lateral (360 px)'); await shot(B, '03-numeros-360'); await ev(B, () => closeLayer());
  await ev(B, id => openComments('u:' + id), c4); await sleep(500);
  for (const t of ['Muito bom', 'Faltou falar', 'Comentário da Dani']) { await ev(B, t => [...document.querySelectorAll('#cbox .clist > li')].find(li => li.textContent.indexOf(t) >= 0).querySelector('[data-lt134fix]').click(), t); await sleep(600) }
  await B.fill('#ctext', '@Carla Mendes obrigada!'); await ev(B, () => document.querySelector('#cform .sendc').click()); await sleep(800);
  ok((await H.sql(`select count(*)::int n from coluna_destaques where pub=$1`, [c4]))[0].n === 3 && await ev(B, () => [...document.querySelectorAll('#cbox .clist > li')].some(li => /obrigada/.test(li.textContent) && li.querySelector('.lt134-au'))), 'Bia fixa 3 comentários e responde com o selo "Autora"');
  await fecha(B);

  /* ================= 11. 390 px escuro e desktop: editor ================= */
  const BD = await abrir('b', { dark: true, n: 'd', base: BASE2 });
  await ev(BD, () => ed132Abre(ed132Novo({ tit: 'Escuro', html: '<p>Texto no escuro.</p>' }))); await sleep(400);
  ok(await ev(BD, () => { const n = c => { const k = document.createElement('canvas').getContext('2d'); k.fillStyle = c; k.fillRect(0, 0, 1, 1); const d = k.getImageData(0, 0, 1, 1).data; return d[0] + d[1] + d[2] }; return n(getComputedStyle($('#layer > .ed132')).backgroundColor) < 200 && n(getComputedStyle($('#ed132-corpo')).color) > 450 }) && await semLateral(BD), '390 px escuro: editor escuro e legível'); await shot(BD, '04-editor-escuro'); await ev(BD, () => { ED132.E.salvou = false; ED132.E = null }); await fecha(BD);
  const BW = await abrir('b', { vp: { width: 1280, height: 800 }, n: 'w', base: BASE2 });
  await ev(BW, id => ed132Edita(id), c1.id); await sleep(500);
  ok(await semLateral(BW) && await ev(BW, () => $('#layer > .ed132 .ed132-in').getBoundingClientRect().width <= 760), 'desktop 1280: editor centrado, sem rolagem lateral'); await shot(BW, '05-editor-desktop'); await fecha(BW);

  /* ================= 12. banco só até a v12 (produção hoje) ================= */
  const H2 = await require('../harness').criar({ sql: __dirname + '/../sql/prumo-supabase.antes-v13.sql' });
  const i2 = {}; for (const k of ['b', 'c']) i2[k] = await H2.criarConta(k + '@x', '123456');
  await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Bia Souza','membro'),($2,'Carla Mendes','membro')`, [i2.b, i2.c]);
  await H2.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [i2.b, i2.c]);
  const SB = await abrir('b', { H: H2, ids: i2, base: BASE2, n: 'v12' }), SC = await abrir('c', { H: H2, ids: i2, base: BASE2, n: 'v12' });
  ok(await ev(SB, () => LT134.v13 === false && ED132.v12.ag === true), 'só v12: o app detecta (agendar ligado, leitores desligado)');
  await ev(SB, () => ed132Abre(ed132Novo({}))); await sleep(300); await SB.fill('#ed132-tit', 'Coluna na produção de hoje'); await fim(SB);
  await SB.keyboard.type('Texto da coluna escrita com o banco só até a v12, com bastante coisa.'); await sleep(2600);
  ok(/Rascunho salvo/.test(await st(SB)), 'só v12: rascunho salvo no banco');
  await ev(SB, () => document.querySelector('[data-ed132painel]').click()); await sleep(300); await ev(SB, () => document.querySelector('[data-ed132pub]').click()); await esperar(SB, () => !ED132.E, null, 8000);
  const [s1] = await H2.sql(`select id from publicacoes`);
  await recarrega(SC); await ev(SC, id => cs123Abrir(id), s1.id); await sleep(1500); await ev(SC, () => $('#layer .cs123-sc').scrollTop = 1e5); await sleep(300); await fecha(SC);
  await ev(SB, () => ed132Hub()); await sleep(600);
  ok(await ev(SB, () => !/mais lidas/.test($('#layer').textContent)) && !H2.log.some(x => /coluna_leitura|coluna_numeros|coluna_mais_lidas/.test(x.op)), 'só v12: sem "mais lidas" e sem chamar as funções da v13');
  await fecha(SB); await recarrega(SB); await ev(SB, id => cs123Abrir(id), s1.id); await sleep(400);
  ok(await ev(SB, () => !document.querySelector('#layer .lt134-lb') && !!document.querySelector('#layer [data-ex133exp]')), 'só v12: página da coluna sem "Leitores", com "Exportar"'); await fecha(SB);

  for (const Pg of [B, C, D, BD, BW, SB, SC]) ok(!(Pg._erros || []).length, 'sem erros no console', Pg._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_qa_colunas: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
