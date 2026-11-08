// Criação de coluna revista (137): atalhos de markdown, desfazer/refazer, barra contextual, "+" na linha vazia, mover bloco,
// teclado do celular, indicador de salvo e contagem, "Antes de publicar" com prévia do cartão e capa, publicar com "Ver",
// "Editar" na coluna aberta, edição guardada no aparelho ("Recuperar"), Minhas colunas, agendar; 390 e 360 px com toque,
// escuro, computador; sem rolagem lateral e console limpo. Portas 8784–8785. Capturas em qa/criacao-coluna/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8784, PORTA2 = 8785, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'criacao-coluna'); fs.mkdirSync(QA, { recursive: true });
const SITE = path.join(__dirname, '..', 'site'), SERIES = path.join(U.REPO, 'series'), FOTO = path.join(U.REPO, 'icon-192.png');
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const shot = async (p, n) => { await semToast(p); await sleep(150); await p.screenshot({ path: path.join(QA, 'depois-' + n + '.png') }) };
const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
const lateral = P => ev(P, () => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#layer *, #layer2 *')].every(e => { const r = e.getBoundingClientRect(); return !r.width || r.right <= innerWidth + 1 || e.closest('.cr137-bm,.ed132-vt,.cs123-hts,.acv,.gn,.ed132-menu') }));
const html = P => ev(P, () => ed132Le().html);
const modo = P => ev(P, () => $('#layer > .ed132 .ed132-bar')?.dataset.cr137 || '');
const visivel = (P, sel) => ev(P, s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), b = $('#layer > .ed132 .ed132-bar')?.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= innerWidth + 1 && (!b || !e.closest('.ed132-bar') || r.left >= b.left - 1 && r.right <= b.right + 1) }, sel);
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); fs.cpSync(SERIES, path.join(SITE, 'series'), { recursive: true });
  srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && ED132.v12.ra !== null && ED132.v12.ve !== null, null, 20000); await sleep(400); await fecha(p); return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const novaColuna = async P => { await fecha(P); await ev(P, () => { go('feed'); criarAbrir('post') }); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(450) };
  const fim = P => ev(P, () => { const cp = $('#ed132-corpo'); cp.focus(); const u = cp.lastElementChild; const r = document.createRange(); r.selectNodeContents(u && u.tagName !== 'FIGURE' && u.tagName !== 'HR' ? u : cp); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) });

  const B = await abrir('b');
  ok(await ev(B, () => typeof cr137Vai === 'function' && ED132.v12.ag === true), '137 carregado (v12 detectada)');

  /* ================= 1. abrir: tela limpa ================= */
  await ev(B, () => { go('feed'); criarAbrir('post') }); await sleep(400);
  ok(await ev(B, () => !document.querySelector('#layer [data-cr137hub]')), 'primeira coluna: o "O que você quer publicar?" não mostra "Minhas colunas" vazio');
  await ev(B, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(450);
  const t0 = await ev(B, () => { const el = $('#layer > .ed132'), m = el.querySelector('.ed132-m').getBoundingClientRect(); return { foco: document.activeElement.id, semBar: el.classList.contains('cr137-sembar'), mH: Math.round(m.height),
    seg: [...el.querySelectorAll('[data-ed132modo]')].map(b => b.textContent).join('|'), capaH: Math.round(el.querySelector('.ed132-capa').getBoundingClientRect().height), dica: getComputedStyle(el.querySelector('.ed132-dica')).display,
    ph: $('#ed132-corpo').dataset.ph, ct: el.querySelector('.cr137-ct')?.textContent } });
  ok(t0.foco === 'ed132-tit' && t0.semBar, 'abre no título; a barra de formatação some enquanto se escreve o título', t0);
  ok(t0.mH <= 50 && t0.seg === 'Escrever|Prévia' && t0.capaH <= 40 && t0.dica === 'none', 'tela limpa: uma linha de modo (Escrever | Prévia), capa discreta, sem a dica escondida atrás da barra', t0);
  ok(/Toque em \+/.test(t0.ph) && /## título/.test(t0.ph) && /0 palavras · 1 min/.test(t0.ct || ''), 'texto de exemplo ensina o "+" e os atalhos; contagem curta', t0);
  await shot(B, '01-editor-vazio');
  await B.fill('#ed132-tit', 'Orçamento: o que muda em 2027'); await B.fill('#ed132-lin', 'Cinco pontos para entender a votação');
  await ev(B, () => { $('#ed132-tit').value = 'x'.repeat(75); $('#ed132-tit').dispatchEvent(new Event('input', { bubbles: true })) });
  ok(await ev(B, () => { const l = $('#layer > .ed132 .cr137-tl'); return !l.hidden && l.textContent === '75/90' }), 'título: contador aparece perto do limite (75/90)');
  await B.fill('#ed132-tit', 'Orçamento: o que muda em 2027'); await ev(B, () => $('#ed132-tit').dispatchEvent(new Event('input', { bubbles: true })));
  ok(await ev(B, () => $('#layer > .ed132 .cr137-tl').hidden), 'título curto: sem contador');

  /* ================= 2. atalhos de markdown ================= */
  await B.tap('#ed132-corpo'); await fim(B); await sleep(100);
  ok(!(await ev(B, () => $('#layer > .ed132').classList.contains('cr137-sembar'))) && await modo(B) === 'v', 'no texto vazio: a barra aparece no modo "linha vazia"');
  ok(await visivel(B, '#layer > .ed132 .ed132-bar [data-ed132cmd="foto"]') && await visivel(B, '#layer > .ed132 .ed132-bar [data-ed132cmd="graf"]') && await visivel(B, '#layer > .ed132 .cr137-bmais') && await visivel(B, '#layer > .ed132 .ed132-bar [data-ed132cmd="undo"]'),
    'linha vazia: foto, gráfico, "+" e desfazer à vista (sem rolar a barra)');
  ok(!(await visivel(B, '#layer > .ed132 .cr137-pl')), 'texto vazio: sem o "+" ao lado (não cobre o texto de exemplo)');
  await B.keyboard.type('O governo mandou o projeto em agosto e a votação ficou para dezembro, depois das eleições.'); await B.keyboard.press('Enter'); await sleep(120);
  ok(await visivel(B, '#layer > .ed132 .cr137-pl') && await modo(B) === 'v', 'linha vazia depois do texto: botão "+" ao lado da linha');
  await shot(B, '02-linha-vazia');
  await B.keyboard.type('## O que muda'); await sleep(80);
  let h = await html(B);
  ok(/<h2>O que muda<\/h2>/.test(h), 'atalho "## " vira título', h);
  await B.keyboard.press('Enter'); await B.keyboard.type('### Nas emendas'); await B.keyboard.press('Enter');
  await B.keyboard.type('> A conta não fecha.'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('- Saúde'); await B.keyboard.press('Enter'); await B.keyboard.type('Educação'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('1. Primeiro'); await B.keyboard.press('Enter'); await B.keyboard.type('Segundo'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('---'); await sleep(80);
  await B.keyboard.type('Isto é **muito importante** e *pouco* lembrado, _às vezes_ esquecido.');
  await sleep(300); h = await html(B);
  ok(/<h3>Nas emendas<\/h3>/.test(h), 'atalho "### " vira subtítulo', h.slice(0, 400));
  ok(/<blockquote><p>A conta não fecha\.<\/p><\/blockquote>/.test(h), 'atalho "> " vira citação (Enter na linha vazia sai)', h);
  ok(/<ul><li>Saúde<\/li><li>Educação<\/li><\/ul>/.test(h) && /<ol><li>Primeiro<\/li><li>Segundo<\/li><\/ol>/.test(h), 'atalhos "- " e "1. " viram listas', h);
  ok(/<\/ol><hr><p>Isto é/.test(h), 'atalho "---" vira separador', h.slice(h.indexOf('</ol>'), h.indexOf('</ol>') + 60));
  ok(/<strong>muito importante<\/strong> e <em>pouco<\/em> lembrado, <em>às vezes<\/em> esquecido\./.test(h), '**negrito**, *itálico* e _itálico_ ao digitar (e o texto seguinte sai normal)', h.slice(-200));
  /* desfazer logo depois do atalho volta ao texto digitado */
  await B.keyboard.press('Enter'); await B.keyboard.type('## '); await sleep(50);
  ok(await ev(B, () => !!ed132Topo() && ed132Topo().tagName === 'H2'), 'outro "## " vira título');
  await B.keyboard.press('Control+z'); await sleep(80);
  ok(await ev(B, () => { const b = ed132Topo(); return b && b.tagName === 'P' && /^##/.test(b.textContent) }), 'desfazer logo depois do atalho volta para "## " digitado (como no Notion)', await ev(B, () => ed132Topo()?.outerHTML));
  await B.keyboard.press('Control+Shift+z'); await sleep(80);
  ok(await ev(B, () => ed132Topo()?.tagName === 'H2'), 'refazer (Ctrl+Shift+Z) volta o título');
  await ev(B, () => { const b = ed132Topo(); const p = document.createElement('p'); p.innerHTML = '<br>'; b.replaceWith(p); ed132CaretFim(p); ed132Mudou(); cr137Marca() });

  /* ================= 3. desfazer e refazer (botões) ================= */
  await B.keyboard.type('Uma frase para desfazer.'); await sleep(600);
  const antesUndo = await html(B);
  ok(await ev(B, () => $('#layer [data-ed132cmd="undo"]').getAttribute('aria-disabled') === 'false'), 'botão desfazer ligado depois de escrever');
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="undo"]').click()); await sleep(100);
  ok(!/Uma frase para desfazer/.test(await html(B)), 'desfazer (botão) tira a frase');
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="redo"]').click()); await sleep(100);
  ok(await html(B) === antesUndo, 'refazer (botão) põe de volta');
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="hr"]') && ed132Cmd('hr')); await sleep(100);
  const nHr = await ev(B, () => $('#ed132-corpo').querySelectorAll('hr').length);
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="undo"]').click()); await sleep(100);
  ok(await ev(B, () => $('#ed132-corpo').querySelectorAll('hr').length) === nHr - 1 && /Uma frase para desfazer/.test(await html(B)), 'desfazer tira o separador inserido e não apaga o texto (bug antigo: Ctrl+Z apagava linhas ou deixava "*")');

  /* ================= 4. barra contextual e mover bloco ================= */
  await ev(B, () => { const p = [...$('#ed132-corpo').querySelectorAll('p')].find(x => /^O governo/.test(x.textContent)); const r = document.createRange(); r.setStart(p.firstChild, 2); r.setEnd(p.firstChild, 9); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }); await sleep(120);
  ok(await modo(B) === 's' && await visivel(B, '#layer [data-ed132cmd="b"]') && !(await visivel(B, '#layer .ed132-bar [data-ed132cmd="foto"]')), 'texto selecionado: a barra mostra só formatação (negrito, itálico, link, títulos, citação)');
  await shot(B, '03-selecao');
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="b"]').click()); await sleep(80);
  ok(/<p>O <strong>governo<\/strong> mandou/.test(await html(B)), 'negrito pela barra no texto selecionado');
  await ev(B, () => { const p = [...$('#ed132-corpo').querySelectorAll('p')].find(x => /^Isto é/.test(x.textContent)); const r = document.createRange(); r.setStart(p.firstChild, 2); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }); await sleep(120);
  ok(await modo(B) === 't' && await visivel(B, '#layer [data-ed132cmd="i"]') && !(await visivel(B, '#layer .ed132-bar [data-ed132cmd="foto"]')), 'cursor no meio do texto: formatação (foto e gráfico ficam no "+")');
  const ordem0 = await ev(B, () => [...$('#ed132-corpo').children].map(e => e.tagName));
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="mvup"]').click()); await sleep(80);
  const ordem1 = await ev(B, () => [...$('#ed132-corpo').children].map(e => e.tagName)), i0 = ordem0.indexOf('HR');
  ok(ordem1[i0] === 'P' && ordem1[i0 + 1] === 'HR' && await ev(B, () => /^Isto é/.test(ed132Topo().textContent)), 'subir o bloco: o parágrafo passa para cima do separador e o cursor vai junto', [ordem0, ordem1]);
  await ev(B, () => document.querySelector('#layer [data-ed132cmd="mvdn"]').click()); await sleep(80);
  ok(JSON.stringify(await ev(B, () => [...$('#ed132-corpo').children].map(e => e.tagName))) === JSON.stringify(ordem0), 'descer o bloco volta ao lugar');
  /* foto: sobe pelo "+" e a folha tem Subir/Descer */
  await fim(B); await B.keyboard.press('Enter'); await sleep(80);
  await ev(B, () => document.querySelector('#layer > .ed132 .cr137-pl:not([hidden])').click()); await sleep(200);
  ok(await ev(B, () => !$('#layer > .ed132 .ed132-menu').hidden && /Foto/.test($('#layer > .ed132 .ed132-menu').textContent)), '"+" da linha vazia abre os blocos');
  const [fc] = await Promise.all([B.waitForEvent('filechooser'), ev(B, () => document.querySelector('#layer > .ed132 .ed132-menu [data-ed132bl="foto"]').click())]); await fc.setFiles(FOTO);
  ok(await esperar(B, () => !!document.querySelector('#ed132-corpo figure[data-f] img') && !!document.querySelector('#layer2 [data-cr137fmv]'), null, 8000), 'foto entra no texto; a folha de legenda tem "Subir" e "Descer"');
  const acima = await ev(B, () => $('#ed132-corpo figure[data-f]').previousElementSibling.textContent);
  await B.fill('#ed132-leg', 'Plenário'); await ev(B, () => document.querySelector('#layer2 [data-cr137fmv="-1"]').click()); await sleep(200);
  ok(await ev(B, a => { const f = $('#ed132-corpo figure[data-f]'); return !!f.nextElementSibling && f.nextElementSibling.textContent === a && !$('#layer2').innerHTML }, acima), 'foto: "Subir" troca de lugar com o bloco de cima e fecha a folha');
  await ev(B, () => document.querySelector('#ed132-corpo figure[data-f] [data-ed132fig]').click()); await sleep(200);
  await B.fill('#ed132-leg', 'Plenário em dia de votação'); await ev(B, () => document.querySelector('[data-ed132figok]').click()); await sleep(150);

  /* ================= 5. teclado do celular, rolagem e indicador ================= */
  await fim(B); for (let i = 0; i < 12; i++) { await B.keyboard.press('Enter'); await B.keyboard.type('Mais uma linha de texto para encher a tela ' + i + '.') }
  const kb = await ev(B, async () => { const vv = visualViewport, h0 = innerHeight; Object.defineProperty(vv, 'height', { value: h0 - 320, configurable: true }); vv.dispatchEvent(new Event('resize')); await new Promise(r => setTimeout(r, 150));
    const el = $('#layer > .ed132'), b = el.querySelector('.ed132-bar').getBoundingClientRect(), hd = el.querySelector('.ed132-h').getBoundingClientRect(), m = getComputedStyle(el.querySelector('.ed132-m')).display;
    const s = getSelection().getRangeAt(0).getClientRects()[0] || ed132Topo().getBoundingClientRect(); const o = { bar: Math.round(b.bottom), lim: h0 - 320, head: Math.round(hd.top), m, caret: Math.round(s.bottom), barTop: Math.round(b.top), kbClass: el.classList.contains('cr137-kb') };
    delete vv.height; Object.defineProperty(vv, 'height', { get: () => h0, configurable: true }); return o });
  ok(kb.bar <= kb.lim + 1 && kb.head === 0, 'teclado aberto: a barra fica acima do teclado e o cabeçalho continua na tela', kb);
  ok(kb.m === 'none' && kb.kbClass, 'teclado aberto: a faixa Escrever/Prévia some (modo foco)', kb);
  ok(kb.caret <= kb.barTop, 'teclado aberto: a linha em que se escreve fica acima da barra', kb);
  await ev(B, () => visualViewport.dispatchEvent(new Event('resize'))); await sleep(2600);
  await shot(B, '04-escrevendo');
  ok(/Rascunho salvo/.test(await ev(B, () => $('#layer > .ed132 .ed132-st').textContent)) && /\d+ palavras · \d+ min/.test(await ev(B, () => $('#layer > .ed132 .cr137-ct').textContent)), 'indicador "Rascunho salvo" e contagem curta');
  ok(await lateral(B), '390 px: editor sem rolagem lateral');

  /* ================= 6. antes de publicar ================= */
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(450);
  const pp = await ev(B, () => [...$('#layer .ed132-pp .ed132-pps .ed132-in').children].map(s => s.classList.contains('cr137-ph') ? '|opc|' : (s.querySelector('h3')?.textContent || '').trim()));
  ok(/^Como vai aparecer no Feed$/.test(pp[0]) && /^Capa/.test(pp[1]) && /^Quem pode ler/.test(pp[2]) && /^Quando publicar/.test(pp[3]) && pp[4] === '|opc|' && /^Chamada/.test(pp[5]), 'ordem: prévia do cartão, capa, quem pode ler, quando; depois "Detalhes opcionais" (chamada, série, hashtags, assuntos)', pp);
  await B.fill('#ed132-cham', 'Uma chamada escrita pela autora.'); await sleep(150);
  ok(await ev(B, () => /Uma chamada escrita pela autora/.test($('#layer .ed132-pp .ed132-pvf .cs123-card').textContent)), 'prévia do cartão acompanha a chamada');
  const [fc2] = await Promise.all([B.waitForEvent('filechooser'), ev(B, () => document.querySelector('#layer .ed132-pp .cr137-pc [data-ed132capa]').click())]); await fc2.setFiles(FOTO);
  ok(await esperar(B, () => !!document.querySelector('#layer .ed132-pp .cr137-pc img') && !!document.querySelector('#layer .ed132-pp .ed132-pvf .cs123-capa img'), null, 8000), 'capa escolhida em "Antes de publicar" aparece na prévia do cartão');
  ok(await ev(B, () => !!document.querySelector('#layer > .ed132 .ed132-sc .ed132-cpi img')), 'a capa aparece também no editor');
  await ev(B, () => $('#layer .ed132-pps').scrollTop = 0); await shot(B, '05-antes-de-publicar');
  ok(await lateral(B), '390 px: "Antes de publicar" sem rolagem lateral');
  await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1500);
  const [p1] = await H.sql(`select id,estilo,corpo,fotos from public.publicacoes where autor=$1 and estilo->'coluna' is not null order by at desc limit 1`, [ids.b]);
  ok(!!p1 && p1.estilo.coluna.f === 'h' && p1.estilo.coluna.capa === true && p1.estilo.coluna.cham === 'Uma chamada escrita pela autora.' && /<h2>O que muda<\/h2>/.test(p1.corpo) && /<strong>muito importante<\/strong>/.test(p1.corpo) && p1.fotos.length === 2, 'publicada com capa, chamada e o texto formatado pelos atalhos', p1 && p1.estilo);
  const tt = await toastTx(B);
  ok(/Coluna publicada/.test(tt) && /Ver/.test(tt), 'aviso "Coluna publicada" com "Ver"', tt);
  await ev(B, () => document.querySelector('.toast .toast-a').click()); await sleep(600);
  ok(await ev(B, () => $('#layer .cs123-ler h1')?.textContent === 'Orçamento: o que muda em 2027'), '"Ver" abre a coluna publicada');
  ok(await ev(B, () => !!$('#layer .cs123-ler [data-cr137ed]')), 'coluna aberta: a autora tem "Editar"');
  await shot(B, '06-coluna-aberta');

  /* ================= 7. editar: cópia no aparelho, "Recuperar", salvar com "Ver" ================= */
  await ev(B, () => document.querySelector('#layer .cs123-ler [data-cr137ed]').click()); await sleep(600);
  ok(await ev(B, () => ED132.E && ED132.E.modo === 'editar' && $('#ed132-tit').value === 'Orçamento: o que muda em 2027'), '"Editar" abre o editor com a coluna');
  await fim(B); await B.keyboard.press('Enter'); await B.keyboard.type('Parágrafo novo escrito na edição.'); await sleep(1300);
  ok(/alterações não salvas/.test(await ev(B, () => $('#layer > .ed132 .ed132-st').textContent)), 'editar: cabeçalho avisa "alterações não salvas"');
  ok(await ev(B, id => /Parágrafo novo escrito na edição/.test((JSON.parse(localStorage.getItem('prumo-cr137-ed:' + S.uid) || '{}')[id] || {}).html || ''), p1.id), 'editar: as mudanças ficam guardadas no aparelho enquanto edita');
  await B.reload(); await esperar(B, () => typeof S !== 'undefined' && S.membro && PUB.on === true && ED132.v12.ag !== null, null, 20000); await sleep(600); await fecha(B);
  await ev(B, id => ed132Edita(id), p1.id); await sleep(500);
  ok(/alterações não salvas/.test(await toastTx(B)) && /Recuperar/.test(await toastTx(B)), 'app fechado no meio da edição: ao reabrir, oferece "Recuperar"', await toastTx(B));
  await ev(B, () => document.querySelector('.toast .toast-a').click()); await sleep(300);
  ok(/Parágrafo novo escrito na edição/.test(await html(B)), '"Recuperar" põe de volta o que estava sendo editado');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132salva]').click()); await sleep(1300);
  ok(/Parágrafo novo escrito na edição/.test((await H.sql(`select corpo from public.publicacoes where id=$1`, [p1.id]))[0].corpo), 'salvar grava o texto editado');
  ok(/Coluna atualizada/.test(await toastTx(B)) && /Ver/.test(await toastTx(B)) && await ev(B, id => !(JSON.parse(localStorage.getItem('prumo-cr137-ed:' + S.uid) || '{}')[id]), p1.id), 'salvar: "Coluna atualizada · Ver" e a cópia do aparelho sai');

  /* ================= 8. Minhas colunas e agendar ================= */
  await fecha(B); await ev(B, () => { ed132RascPoe({ rid: 'crsemtit', at: Date.now() - 3600e3, tit: '', linha: '', html: '<p>Começo de um texto sem título sobre a reforma tributária.</p>', pal: 9, pautas: [] }) });
  await ev(B, () => { go('feed'); criarAbrir('post') }); await sleep(400);
  ok(await ev(B, () => !!document.querySelector('#layer [data-cr137hub]')), 'quem já tem coluna: "Minhas colunas" no "O que você quer publicar?"');
  await ev(B, () => document.querySelector('#layer [data-cr137hub]').click()); await sleep(700);
  const hub = await ev(B, () => ({ tx: $('#layer > .ed132-hubr')?.textContent || '', ed: !!$('#layer > .ed132-hubr [data-cr137ed]') }));
  ok(/Começo de um texto sem título/.test(hub.tx) && hub.ed, 'Minhas colunas: rascunho sem título mostra o começo do texto; publicada com "Editar"', hub.tx.slice(0, 300));
  await shot(B, '07-minhas-colunas');
  ok(await lateral(B), '390 px: Minhas colunas sem rolagem lateral');
  await ev(B, () => document.querySelector('#layer [data-ed132nova]').click()); await sleep(400);
  await B.fill('#ed132-tit', 'Coluna agendada pelo editor novo'); await B.tap('#ed132-corpo'); await fim(B); await B.keyboard.type('Texto da coluna agendada, com mais de quarenta caracteres para poder sair.');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400);
  await ev(B, () => document.querySelector('[data-ed132qv="ag"]').click()); await sleep(250);
  ok(await ev(B, () => /^Agendar para/.test($('#layer .ed132-pp [data-ed132pub]').textContent) && [...$('#layer .ed132-pp .ed132-pps .ed132-in').children].findIndex(s => s.querySelector('.ed132-qv')) < [...$('#layer .ed132-pp .ed132-pps .ed132-in').children].findIndex(s => s.classList.contains('cr137-ph'))), 'agendar: continua antes dos detalhes opcionais depois de redesenhar; botão "Agendar para …"');
  await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1300);
  ok((await H.sql(`select publicar_em from public.publicacoes where autor=$1 and estilo->'coluna'->>'tit'='Coluna agendada pelo editor novo'`, [ids.b]))[0]?.publicar_em !== null && /agendada/.test(await toastTx(B)), 'agendar: a coluna fica agendada');

  /* ================= 9. Feed, quem lê, 360 px, escuro, computador ================= */
  const A = await abrir('a'); await recarrega(A); await ev(A, () => { FILTRO = 'tudo'; go('feed'); renderPosts() }); await sleep(400);
  ok(await ev(A, id => !!document.querySelector(`.cs123-card[data-cs123ler="${id}"]`) || !!document.querySelector(`[data-cs123ler="${id}"]`), p1.id), 'Feed do Pedro: a coluna aparece como post normal com "Ler a coluna"');
  await ev(A, id => cs123Abrir(id), p1.id); await sleep(500);
  ok(await ev(A, () => !$('#layer .cs123-ler [data-cr137ed]') && !!$('#layer .cs123-ler .cs123-corpo h2')), 'quem lê não vê "Editar"; a coluna mostra os blocos');
  const P3 = await abrir('b', { vp: { width: 360, height: 740 }, n: '360', dark: true });
  await novaColuna(P3); if (await ev(P3, () => !!$('#layer > .ed132-hubr'))) { await ev(P3, () => document.querySelector('#layer [data-ed132nova]').click()); await sleep(400) }
  await P3.fill('#ed132-tit', 'Coluna no celular pequeno'); await P3.tap('#ed132-corpo'); await fim(P3); await P3.keyboard.type('Um parágrafo no escuro.'); await P3.keyboard.press('Enter'); await sleep(150);
  ok(await visivel(P3, '#layer > .ed132 .cr137-bmais') && await visivel(P3, '#layer > .ed132 .ed132-bar [data-ed132cmd="redo"]') && await visivel(P3, '#layer > .ed132 .ed132-bar [data-ed132cmd="foto"]'), '360 px: "+", foto e refazer à vista na barra');
  ok(await ev(P3, () => { const c = getComputedStyle($('#layer > .ed132 .ed132-bar')).backgroundColor.match(/\d+/g).map(Number); return c[0] + c[1] + c[2] < 200 }), 'escuro: a barra é escura');
  ok(await lateral(P3), '360 px escuro: editor sem rolagem lateral'); await shot(P3, '08-360-escuro');
  await ev(P3, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400);
  ok(await lateral(P3), '360 px escuro: "Antes de publicar" sem rolagem lateral'); await shot(P3, '09-360-escuro-publicar');
  const D = await abrir('b', { vp: { width: 1280, height: 800 }, n: 'pc', base: BASE2 });
  await novaColuna(D); if (await ev(D, () => !!$('#layer > .ed132-hubr'))) { await ev(D, () => document.querySelector('#layer [data-ed132nova]').click()); await sleep(400) }
  await D.fill('#ed132-tit', 'No computador'); await D.click('#ed132-corpo'); await D.keyboard.type('## Intertítulo'); await D.keyboard.press('Enter'); await D.keyboard.type('Texto **forte** aqui.'); await sleep(100);
  ok(/<h2>Intertítulo<\/h2><p>Texto <strong>forte<\/strong> aqui\.<\/p>/.test(await html(D)), 'computador: atalhos de markdown', await html(D));
  await D.keyboard.press('Control+z'); await sleep(80); await D.keyboard.press('Control+y'); await sleep(80);
  ok(/<strong>forte<\/strong> aqui\./.test(await html(D)), 'computador: Ctrl+Z e Ctrl+Y');
  ok(await ev(D, () => { const b = $('#layer > .ed132 .ed132-bar').getBoundingClientRect(); return b.width < 760 && Math.abs((b.left + b.right) / 2 - innerWidth / 2) < 4 }), 'computador: barra centralizada');
  await shot(D, '10-computador');

  for (const P of [A, B, P3, D]) ok(!(P._erros || []).length, 'sem erros no console', P._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_criacao_coluna: ${R.OKS} ok, ${R.FALHAS} falhas`);
  fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true });
  await br.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true }); srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
