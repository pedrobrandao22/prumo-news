// Editor de colunas (132, fase 1): escrever com cada bloco, colar HTML sujo, rascunho que salva sozinho e abre em outro
// aparelho (v12), ver como leitor, publicar, editar, histórico de versões, agendar (outra pessoa só vê na hora), série
// com anterior/próxima, contagem de palavras, 360/390 px, modo escuro, sem erros; e o app com o banco SEM a v12.
// Portas 8794–8795. Capturas em qa/editor-coluna/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8794, PORTA2 = 8795, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'editor-coluna'); fs.mkdirSync(QA, { recursive: true });
const SITE = path.join(__dirname, '..', 'site'), SERIES = path.join(U.REPO, 'series'), FOTO = path.join(U.REPO, 'icon-192.png');
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
const semLateral = P => ev(P, () => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#layer > .ed132 *, #layer .cs123-ler *')].every(e => { const r = e.getBoundingClientRect(); return !r.width || r.right <= innerWidth + 1 || e.closest('.ed132-bar,.ed132-vt,.cs123-hts,.acv,.gn') }));
const PAR1 = 'Toda semana eu passo pelo Congresso e a conversa nos corredores mudou bastante nos últimos meses, com o orçamento no centro.';
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); fs.cpSync(SERIES, path.join(SITE, 'series'), { recursive: true });
  srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro')`, [ids.a, ids.b, ids.c]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && ED132.v12.ra !== null && ED132.v12.ve !== null, null, 20000); await sleep(400); await fecha(p); return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const feed = async P => { await fecha(P); await recarrega(P); await ev(P, () => { FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) }); await sleep(400) };
  const novaColuna = async P => { await fecha(P); await ev(P, () => { go('feed'); criarAbrir('post') }); await sleep(400); await ev(P, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(400) };
  const corpo = async P => { await P.click('#ed132-corpo'); await ev(P, () => { const cp = $('#ed132-corpo'); const r = document.createRange(); r.selectNodeContents(cp); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) }) };
  const html = P => ev(P, () => ed132Le().html);
  const cmd = (P, k) => ev(P, k => document.querySelector(`#layer > .ed132 [data-ed132cmd="${k}"]`).click(), k);

  const B = await abrir('b'), A = await abrir('a');
  ok(await ev(B, () => V9.on === true && ED132.v12.ag === true && ED132.v12.ra === true && ED132.v12.ve === true), 'v12 detectada (agendar, rascunhos no banco e versões)');

  /* ================= 1. escrever com cada bloco ================= */
  await novaColuna(B);
  ok(await ev(B, () => !!document.querySelector('#layer > .ed132 #ed132-corpo[contenteditable="true"]') && !document.querySelector('#layer > .cs123-ed')), 'o cartão "Escrever coluna" abre o editor novo (tela cheia)');
  await B.fill('#ed132-tit', 'O orçamento de 2027 no corredor'); await B.fill('#ed132-lin', 'O que se ouve no Congresso antes da votação');
  await corpo(B); await B.keyboard.type(PAR1 + ' ');
  await B.keyboard.press('Control+b'); await B.keyboard.type('Isso pesa'); await B.keyboard.press('Control+b'); await B.keyboard.type(' e '); await B.keyboard.press('Control+i'); await B.keyboard.type('muito'); await B.keyboard.press('Control+i'); await B.keyboard.type('.');
  await B.keyboard.press('Enter'); await B.keyboard.type('/tit'); await sleep(150);
  ok(await ev(B, () => { const m = $('#layer > .ed132 .ed132-menu'); return !m.hidden && /Título/.test(m.textContent) }), '"/" no começo da linha abre o menu de blocos (filtrado: "tit")');
  await B.keyboard.press('Enter'); await B.keyboard.type('O que dizem os deputados'); await B.keyboard.press('Enter');
  await B.keyboard.type('/subt'); await sleep(100); await B.keyboard.press('Enter'); await B.keyboard.type('Nos bastidores'); await B.keyboard.press('Enter');
  await B.keyboard.type('/cit'); await sleep(100); await B.keyboard.press('Enter'); await B.keyboard.type('A conta não fecha sem cortar emendas.'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('Depois da citação, o texto segue normal.'); await B.keyboard.press('Enter');
  await B.keyboard.type('/lista'); await sleep(100); await B.keyboard.press('Enter'); await B.keyboard.type('Emendas de bancada'); await B.keyboard.press('Enter'); await B.keyboard.type('Piso da saúde'); await B.keyboard.press('Enter'); await B.keyboard.press('Enter');
  await B.keyboard.type('Os dados do Tesouro estão em '); await B.keyboard.press('Control+k'); await sleep(300);
  await B.fill('#ed132-url', 'www.tesourotransparente.gov.br'); await B.fill('#ed132-urlt', 'Tesouro Transparente'); await ev(B, () => document.querySelector('[data-ed132linkok]').click()); await sleep(200);
  await B.keyboard.type('. Último parágrafo antes do separador.');
  await cmd(B, 'hr'); await sleep(100); await B.keyboard.type('Depois do separador vem a foto.');
  const [fc] = await Promise.all([B.waitForEvent('filechooser'), cmd(B, 'foto')]); await fc.setFiles(FOTO);
  ok(await esperar(B, () => !!document.querySelector('#ed132-corpo figure[data-f] img') && !!document.querySelector('#ed132-leg'), null, 8000), 'foto: sobe, entra no texto e pede legenda e crédito');
  await B.fill('#ed132-leg', 'Plenário em dia de votação'); await B.fill('#ed132-cred', 'Foto: Bia Souza'); await ev(B, () => document.querySelector('[data-ed132figok]').click()); await sleep(200);
  await cmd(B, 'graf'); await esperar(B, () => !!document.querySelector('[data-ed132gs]'), null, 6000);
  await ev(B, () => document.querySelector('[data-ed132gs="selic"][data-ed132gp="5a"]').click()); await sleep(300);
  await B.keyboard.type('Fim da coluna, com o gráfico da Selic logo acima.');
  let h = await html(B);
  ok(/<strong>Isso pesa<\/strong>/.test(h) && /<em>muito<\/em>/.test(h), 'negrito e itálico (Ctrl+B, Ctrl+I)', h.slice(0, 300));
  ok(/<h2>O que dizem os deputados<\/h2>/.test(h) && /<h3>Nos bastidores<\/h3>/.test(h), 'título (H2) e subtítulo (H3) pelo "/"');
  ok(/<blockquote><p>A conta não fecha sem cortar emendas\.<\/p><\/blockquote><p>Depois da citação/.test(h), 'citação, e Enter na linha vazia sai da citação', h.slice(h.indexOf('<h3>'), h.indexOf('<h3>') + 600));
  ok(/<ul><li>Emendas de bancada<\/li><li>Piso da saúde<\/li><\/ul>/.test(h), 'lista');
  ok(/<a href="https:\/\/www\.tesourotransparente\.gov\.br\/">Tesouro Transparente<\/a>/.test(h), 'link (Ctrl+K), com https');
  ok(/<hr>/.test(h) && new RegExp(`<figure data-f="${ids.b}/[^"]+\\.jpg"><figcaption>Plenário em dia de votação<small>Foto: Bia Souza</small></figcaption></figure>`).test(h), 'separador e foto com legenda e crédito', h.match(/<figure[^]*?<\/figure>/g));
  ok(/<figure data-g="selic" data-p="5a"><\/figure>/.test(h) && await esperar(B, () => !!document.querySelector('#ed132-corpo figure[data-g] .gn'), null, 6000), 'gráfico do acervo (Selic, 5 anos) no texto');
  /* contagem ao vivo */
  await sleep(300); const n1 = await ev(B, () => +document.querySelector('[data-ed132cont]').dataset.n), n1b = await ev(B, () => ed132Palavras(ed132Plano(ed132Le().html)));
  await B.keyboard.type(' Mais cinco palavras aqui agora.'); await sleep(400); const n2 = await ev(B, () => +document.querySelector('[data-ed132cont]').dataset.n);
  ok(n1 > 60 && n1 === n1b && n2 === n1 + 5 && /min de leitura/.test(await ev(B, () => document.querySelector('[data-ed132cont]').textContent)), 'contagem de palavras e tempo de leitura ao vivo', [n1, n1b, n2]);
  await ev(B, () => $('#layer > .ed132 .ed132-sc').scrollTop = 0); await shot(B, '01-editor');
  ok(await semLateral(B), '390 px: editor sem rolagem lateral');

  /* ================= 2. colar HTML sujo (Google Docs / Word) ================= */
  await B.keyboard.press('Enter');
  await ev(B, () => { const dt = new DataTransfer(); dt.setData('text/html', '<meta charset="utf-8"><b style="font-weight:normal" id="docs-internal-guid-1"><p dir="ltr" style="color:red"><span style="font-weight:700">Colado forte</span> e <span style="font-style:italic">inclinado</span> <a href="javascript:alert(1)" onclick="window.__sujo=1">perigoso</a></p><script>window.__sujo=2</script><img src="x" onerror="window.__sujo=3"><style>body{display:none}</style><h1 onmouseover="x()">Título colado</h1></b>');
    dt.setData('text/plain', 'Colado forte e inclinado perigoso'); $('#ed132-corpo').dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })) }); await sleep(400);
  const cola = await ev(B, () => ({ ed: $('#ed132-corpo').innerHTML, sujo: window.__sujo, h: ed132Le().html, vis: getComputedStyle(document.body).display }));
  ok(!/<script|onerror|onclick|onmouseover|javascript:|<style|style=/i.test(cola.ed) && !/<img(?![^>]*blob:|[^>]*data:)/.test(cola.ed.replace(/<figure[^]*?<\/figure>/g, '')) && cola.sujo === undefined && cola.vis !== 'none', 'colar: script, style, imagem de fora, on* e javascript: saem', cola.ed.slice(-400));
  ok(/<strong>Colado forte<\/strong> e <em>inclinado<\/em> perigoso/.test(cola.h) && /<h2>Título colado<\/h2>/.test(cola.h), 'colar: fica só negrito, itálico e título (Google Docs)', cola.h.slice(-300));

  /* ================= 3. rascunho: salva sozinho, reabre e abre em outro aparelho ================= */
  await sleep(2600);
  const rl = await ev(B, () => ed132RascLe()), rdb = await H.sql(`select rid, dados from public.coluna_rascunhos where autor=$1`, [ids.b]);
  ok(rl.length === 1 && rl[0].tit === 'O orçamento de 2027 no corredor' && rl[0].pal > 60 && /<h2>/.test(rl[0].html), 'rascunho salvo sozinho no aparelho (título, palavras, texto)');
  ok(rdb.length === 1 && rdb[0].rid === rl[0].rid && rdb[0].dados.tit === 'O orçamento de 2027 no corredor', 'rascunho salvo também no banco (v12)');
  ok(/salvo/i.test(await ev(B, () => $('#layer > .ed132 .ed132-st').textContent)), 'cabeçalho mostra "Rascunho salvo"');
  ok(!(await como('a', `select rid from public.coluna_rascunhos`)).length, 'banco: o Pedro não lê o rascunho da Bia');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132x]').click()); await sleep(600);
  ok(await ev(B, () => !$('#layer').innerHTML), 'fechar o editor (×) fecha e guarda');
  await ev(B, () => { go('feed'); criarAbrir('post') }); await sleep(400);
  ok(/1 rascunho guardado/.test(await ev(B, () => $('#layer [data-cs123ini]')?.textContent || '')), 'cartão: "Escrever coluna · 1 rascunho guardado"');
  await ev(B, () => document.querySelector('#layer [data-cs123ini]').click()); await sleep(500);
  const hub = await ev(B, () => $('#layer > .ed132-hubr')?.textContent || '');
  ok(/Minhas colunas/.test(hub) && /O orçamento de 2027 no corredor/.test(hub) && /palavras/.test(hub) && /qualquer aparelho/.test(hub), '"Minhas colunas": rascunho com título, data e palavras', hub.slice(0, 200));
  await shot(B, '02-minhas-colunas');
  await ev(B, () => document.querySelector('#layer [data-ed132rabre]').click()); await sleep(600);
  ok(await ev(B, () => $('#ed132-tit').value === 'O orçamento de 2027 no corredor' && !!$('#ed132-corpo figure[data-f] img') && !!$('#ed132-corpo h2') && !!$('#ed132-corpo blockquote')), 'continuar o rascunho: título, foto, blocos');
  await fecha(B);
  /* outro aparelho (sem nada guardado no aparelho) */
  const B2 = await abrir('b', { n: '2' }); await ev(B2, () => { localStorage.removeItem('prumo-ed132-rasc:' + S.uid) });
  await ev(B2, () => ed132Hub()); await esperar(B2, () => /O orçamento de 2027/.test($('#layer > .ed132-hubr')?.textContent || ''), null, 6000);
  ok(/O orçamento de 2027 no corredor/.test(await ev(B2, () => $('#layer > .ed132-hubr').textContent)), 'outro aparelho: o rascunho aparece (veio do banco)');
  await ev(B2, () => document.querySelector('#layer [data-ed132rabre]').click()); await sleep(800);
  ok(await esperar(B2, () => $('#ed132-tit')?.value === 'O orçamento de 2027 no corredor' && !!$('#ed132-corpo figure[data-f] img'), null, 5000), 'outro aparelho: abre com a foto');
  await fecha(B2); await B2.close();

  /* ================= 4. ver como leitor ================= */
  await ev(B, () => document.querySelector('#layer > .ed132-hubr [data-ed132rabre]') || ed132Hub()); await sleep(300);
  if (!(await ev(B, () => !!document.querySelector('#layer > .ed132')))) { await ev(B, () => { const d = ed132RascLe()[0]; ed132Abre(ed132DoRasc(d)) }); await sleep(500) }
  await ev(B, () => document.querySelector('[data-ed132modo="ver"]').click()); await sleep(400);
  const pv = await ev(B, () => { const v = $('#layer > .ed132 .ed132-ver'); return { h1: v.querySelector('.cs123-art h1')?.textContent, h2: !!v.querySelector('.cs123-corpo h2'), img: !!v.querySelector('.ed132-ff img'), cap: v.querySelector('.ed132-ff figcaption')?.textContent, g: !!v.querySelector('.ed132-fg'), ed: !$('#layer > .ed132 .ed132-sc').hidden } });
  ok(pv.h1 === 'O orçamento de 2027 no corredor' && pv.h2 && pv.img && /Foto: Bia Souza/.test(pv.cap || '') && pv.g && !pv.ed, 'ver como leitor: a página da coluna com blocos, foto e gráfico', pv);
  await shot(B, '03-ver-pagina');
  await ev(B, () => document.querySelector('[data-ed132pva="feed"]').click()); await sleep(300);
  ok(await ev(B, () => { const c = $('#layer > .ed132 .ed132-pvf .cs123-card'); return !!c && /O orçamento de 2027/.test(c.textContent) && /Ler a coluna/.test(c.textContent) && /Toda semana eu passo/.test(c.querySelector('.cs123-x')?.textContent || '') }), 'ver como leitor: o cartão do Feed com a chamada do 1º parágrafo');
  await shot(B, '04-ver-feed');
  await ev(B, () => document.querySelector('[data-ed132modo="ed"]').click()); await sleep(200);

  /* ================= 5. publicar (com série, hashtags e assunto do dia) ================= */
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(400);
  ok(await ev(B, () => !!$('#layer > .ed132 .ed132-pp') && /Toda semana eu passo/.test($('#ed132-cham').placeholder) && !!document.querySelector('[data-ed132qv="ag"]') && !!$('#layer > .ed132 .ed132-pp .ed132-pvf .cs123-card')), 'antes de publicar: chamada sugerida, agendar e prévia do cartão');
  const nPts = await ev(B, () => document.querySelectorAll('[data-ed132pt]').length);
  ok(nPts === 3, 'sugere 3 assuntos do dia', nPts);
  await B.fill('#ed132-ser', 'Bastidores de Brasília'); await B.fill('#ed132-num', '1'); await B.fill('#ed132-tags', '#Orçamento economia');
  const pt0 = await ev(B, () => { const b = document.querySelector('[data-ed132pt]'); b.click(); return { id: b.dataset.ed132pt, t: b.dataset.t } });
  await sleep(200); await ev(B, () => $('#layer .ed132-pps').scrollTop = 0); await shot(B, '05-antes-de-publicar');
  ok(await semLateral(B), '390 px: "Antes de publicar" sem rolagem lateral');
  ok(await ev(B, () => /Coluna 1 · Bastidores de Brasília/.test($('#layer .ed132-pp .ed132-pvf .cs123-k').textContent)), 'prévia do cartão mostra a série e o número');
  await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1500);
  const [p1] = await H.sql(`select id,texto,estilo,corpo,fotos,publicar_em,at from public.publicacoes where autor=$1 and estilo->'coluna' is not null order by at desc limit 1`, [ids.b]);
  ok(!!p1 && p1.estilo.coluna.f === 'h' && p1.estilo.coluna.serie === 'Bastidores de Brasília' && p1.estilo.coluna.n === 1 && p1.estilo.coluna.capa === false && p1.publicar_em === null, 'publicada: HTML, série e número, sem capa', p1 && p1.estilo);
  ok(/<h2>O que dizem os deputados<\/h2>/.test(p1.corpo) && p1.fotos.length === 1 && p1.corpo.indexOf(p1.fotos[0]) > 0 && /#Orçamento #economia$/.test(p1.texto), 'publicada: texto com blocos, a foto do texto na lista de fotos, hashtags', p1.fotos);
  ok(p1.estilo.coluna.pautas && p1.estilo.coluna.pautas[0].id === pt0.id, 'publicada: o assunto do dia ligado');
  ok((await H.sql(`select count(*)::int n from public.coluna_versoes where pub=$1`, [p1.id]))[0].n === 1, 'histórico: a publicação guardou a 1ª versão');
  ok(await ev(B, () => !$('#layer').innerHTML && ed132RascLe().length === 0) && !(await H.sql(`select 1 from public.coluna_rascunhos where autor=$1`, [ids.b])).length, 'publicar fecha o editor e tira o rascunho (aparelho e banco)');

  /* o Pedro vê no Feed e lê */
  await feed(A); const card = await ev(A, id => { const e = document.querySelector(`#posts [id="p-u:${id}"]`); return e ? { k: e.querySelector('.cs123-k')?.textContent, x: e.querySelector('.cs123-x')?.textContent } : null }, p1.id);
  ok(!!card && card.k === 'Coluna 1 · Bastidores de Brasília' && /Toda semana eu passo/.test(card.x || ''), 'Feed do Pedro: o cartão com a série e a chamada', card);
  await ev(A, id => cs123Abrir(id), p1.id); await sleep(800);
  const ler = await ev(A, () => { const r = $('#layer .cs123-ler'); return { h2: r.querySelector('.cs123-corpo h2')?.textContent, q: !!r.querySelector('.cs123-corpo blockquote'), ul: r.querySelectorAll('.cs123-corpo ul li').length, a: r.querySelector('.cs123-corpo a.cs123-a')?.getAttribute('target'), img: !!r.querySelector('.ed132-ff img'), cap: r.querySelector('.ed132-ff figcaption')?.textContent, hr: !!r.querySelector('.ed132-hr'), nav: r.querySelector('.ed132-nav')?.textContent, pt: r.querySelector('.ed132-pts')?.textContent, ht: r.querySelector('.cs123-hts')?.textContent } });
  ok(ler.h2 === 'O que dizem os deputados' && ler.q && ler.ul === 2 && ler.a === '_blank' && ler.img && /Foto: Bia Souza/.test(ler.cap) && ler.hr, 'página da coluna (Pedro): blocos, link, foto com crédito e separador', ler);
  ok(await esperar(A, () => !!document.querySelector('#layer .cs123-ler .ed132-fg .gn'), null, 6000), 'página da coluna: o gráfico do acervo aparece');
  ok(/Bastidores de Brasília/.test(ler.nav || '') && /Primeira coluna da série/.test(ler.nav || '') && ler.pt && ler.pt.indexOf(pt0.t.slice(0, 20)) >= 0 && /#Orçamento/.test(ler.ht || ''), 'página da coluna: série, assunto do dia e hashtags', ler);
  await shot(A, '06-leitura'); await fecha(A);

  /* ================= 6. editar e 7. histórico ================= */
  await sleep(2500); await recarrega(B);
  const menu = async (P, id) => { await fecha(P); await ev(P, id => { const b = document.createElement('button'); b.dataset.umenu = id; b.hidden = true; document.body.appendChild(b); b.click(); b.remove() }, id); await sleep(300) };
  await menu(B, p1.id); await ev(B, id => document.querySelector(`.sheet [data-mc1104ed="${id}"]`).click(), p1.id);
  ok(await esperar(B, () => !!document.querySelector('#layer > .ed132 #ed132-corpo h2') && $('#layer > .ed132 .ed132-ht b').textContent === 'Editar coluna'), '"Editar a coluna" abre o editor novo, preenchido');
  ok(await ev(B, () => !!$('#ed132-corpo figure[data-f] img') && !!document.querySelector('#layer > .ed132 [data-ed132salva]')), 'editar: a foto aparece e o botão é "Salvar"');
  await B.fill('#ed132-tit', 'O orçamento de 2027, visto do corredor'); await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132salva]').click()); await sleep(1200);
  let [r1] = await H.sql(`select estilo,texto,editado,at from public.publicacoes where id=$1`, [p1.id]);
  ok(r1.estilo.coluna.tit === 'O orçamento de 2027, visto do corredor' && r1.estilo.coluna.serie === 'Bastidores de Brasília' && +r1.editado > 0 && /Coluna atualizada/.test(await toastTx(B)), 'editar: salva o título, mantém a série, marca "editado"', r1.estilo.coluna);
  ok((await H.sql(`select count(*)::int n from public.coluna_versoes where pub=$1`, [p1.id]))[0].n === 2, 'histórico: a edição guardou a 2ª versão');
  await recarrega(A); await ev(A, id => cs123Abrir(id), p1.id); await sleep(500);
  ok(/editado em/.test(await ev(A, () => $('#layer .cs123-ler .cs123-by').textContent)), 'página da coluna: "editado em" com a data');
  await fecha(A);
  await menu(B, p1.id); await ev(B, id => document.querySelector(`.sheet [data-mc1104ed="${id}"]`).click(), p1.id); await sleep(500);
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132mais]').click()); await sleep(300);
  ok(await ev(B, () => !!document.querySelector('.sheet [data-ed132hist]')), 'editar › "…": "Histórico de versões"');
  await ev(B, () => document.querySelector('.sheet [data-ed132hist]').click()); await esperar(B, () => !!document.querySelector('.sheet .ed132-vl'), null, 5000);
  ok(await ev(B, () => document.querySelectorAll('.sheet .ed132-vl li').length === 2 && document.querySelectorAll('.sheet [data-ed132vr]').length === 1), 'histórico: 2 versões, a anterior com "Restaurar"');
  await shot(B, '07-historico');
  await ev(B, () => document.querySelector('.sheet [data-ed132vr]').click()); await sleep(400);
  ok(await ev(B, () => $('#ed132-tit').value === 'O orçamento de 2027 no corredor' && !!$('#ed132-corpo h2')), 'restaurar: a versão anterior volta ao editor');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132salva]').click()); await sleep(1200);
  [r1] = await H.sql(`select estilo from public.publicacoes where id=$1`, [p1.id]);
  ok(r1.estilo.coluna.tit === 'O orçamento de 2027 no corredor' && (await H.sql(`select count(*)::int n from public.coluna_versoes where pub=$1`, [p1.id]))[0].n === 3, 'restaurar e salvar: o título antigo volta (3ª versão)');
  ok(!(await como('a', `select id from public.coluna_versoes`)).length, 'banco: o Pedro não vê as versões da Bia');
  const hk = await como('a', `update public.publicacoes set publicar_em=now()+interval '1 day' where id=$1 returning id`, [p1.id]).catch(e => []);
  ok(!hk.length, 'banco: o Pedro não agenda a coluna da Bia');

  /* ================= 8. série: anterior e próxima ================= */
  const col2 = { v: 2, coluna: { v: 1, f: 'h', tit: 'Bastidores: a semana do Senado', linha: '', min: 1, capa: false, serie: 'Bastidores de Brasília', n: 2 } };
  const [p2] = await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,'[]',$3,'amigos',$4) returning id`, [ids.b, 'Bastidores: a semana do Senado', col2, '<p>Texto da segunda coluna da série, com bastante coisa para contar sobre o Senado nesta semana.</p>']);
  await recarrega(A); await ev(A, id => cs123Abrir(id), p1.id); await sleep(500);
  ok(await ev(A, id => { const b = document.querySelector('#layer .ed132-nav .ed132-na-p'); return !!b && b.dataset.cs123ler === id && /Coluna 2/.test(b.textContent) && /a semana do Senado/.test(b.textContent) && !document.querySelector('#layer .ed132-nav .ed132-na-a') }, p2.id), 'série: a coluna 1 leva à próxima (coluna 2)');
  await ev(A, () => document.querySelector('#layer .ed132-nav .ed132-na-p').click()); await sleep(600);
  ok(await ev(A, id => { const b = document.querySelector('#layer .ed132-nav .ed132-na-a'); return /a semana do Senado/.test($('#layer .cs123-ler h1').textContent) && !!b && /Coluna 1/.test(b.textContent) }, p1.id), 'série: a coluna 2 abre e leva à anterior');
  await shot(A, '08-serie'); await fecha(A);

  /* ================= 9. agendar ================= */
  await novaColuna(B);
  if (await ev(B, () => !!document.querySelector('#layer > .ed132-hubr'))) { await ev(B, () => document.querySelector('[data-ed132nova]').click()); await sleep(400) }
  await B.fill('#ed132-tit', 'Coluna para amanhã cedo'); await corpo(B); await B.keyboard.type('Texto da coluna agendada, que só deve aparecer para os outros na hora marcada pela autora.');
  await ev(B, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(300);
  await ev(B, () => document.querySelector('[data-ed132qv="ag"]').click()); await sleep(300);
  ok(await ev(B, () => !!$('#ed132-qd') && !!$('#ed132-qh') && /^Agendar para /.test(document.querySelector('#layer .ed132-pp [data-ed132pub]').textContent)), 'agendar: dia e hora (horário de Brasília) e botão "Agendar para …"');
  await B.fill('#ed132-qd', await ev(B, () => ed132SpPartes(Date.now() + 864e5).d)); await B.fill('#ed132-qh', '08:00');
  await shot(B, '09-agendar');
  await ev(B, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1200);
  const [pa] = await H.sql(`select id,publicar_em,agenda_aviso,at from public.publicacoes where autor=$1 and estilo->'coluna'->>'tit'='Coluna para amanhã cedo'`, [ids.b]);
  const esperado = await ev(B, () => ed132DeSp(ed132SpPartes(Date.now() + 864e5).d, '08:00'));
  ok(!!pa && pa.agenda_aviso === true && new Date(pa.publicar_em).getTime() === esperado && +pa.at === esperado, 'agendada no banco: publicar_em às 8h de Brasília e a hora do post é a de publicação', pa);
  ok(/agendada para/.test(await toastTx(B)) && await ev(B, id => !pubDe(id) && ED132.agend.some(x => x.id === id), pa.id), 'agendada: aviso, fora do Feed da autora, em "Minhas colunas"');
  ok(!(await como('a', `select id from public.publicacoes where id=$1`, [pa.id])).length, 'banco: o Pedro não vê a coluna agendada');
  await feed(A); ok(await ev(A, id => !pubDe(id) && !document.querySelector(`#posts [id="p-u:${id}"]`), pa.id), 'Feed do Pedro: a agendada não aparece');
  await recarrega(B); await ev(B, () => ed132Hub()); await sleep(500);
  ok(await ev(B, () => /Agendadas/.test($('#layer > .ed132-hubr').textContent) && /Coluna para amanhã cedo/.test($('#layer > .ed132-hubr').textContent) && !!document.querySelector('[data-ed132agja]') && !!document.querySelector('[data-ed132agx]') && !!document.querySelector('[data-ed132agedit]')), '"Minhas colunas": agendada com editar, publicar agora e cancelar');
  await shot(B, '10-agendadas');
  /* editar a agendada: o editor mostra "Coluna agendada" */
  await ev(B, () => document.querySelector('[data-ed132agedit]').click()); await sleep(500);
  ok(await ev(B, () => /Coluna agendada/.test($('#layer > .ed132 .ed132-ht').textContent) && /Agendada para/.test($('#layer > .ed132 .ed132-st').textContent)), 'editar a agendada: "Coluna agendada · Agendada para …"');
  await fecha(B);
  /* a hora chega (ajusta publicar_em no banco) */
  await H.sql(`update public.publicacoes set publicar_em = now() - interval '1 minute' where id=$1`, [pa.id]);
  ok((await H.sql(`select public.colunas_agendadas_avisar() n`))[0].n >= 0, 'função do pg_cron roda (avisos das que venceram)');
  await feed(A); ok(await ev(A, id => !!pubDe(id) && !!document.querySelector(`#posts [id="p-u:${id}"]`), pa.id), 'depois da hora: o Pedro vê a coluna no Feed');
  await recarrega(B); ok(await ev(B, id => !!pubDe(id) && !ED132.agend.some(x => x.id === id), pa.id), 'depois da hora: a coluna sai de "Agendadas" da autora');
  /* publicar agora e cancelar */
  const colA = t => ({ v: 2, coluna: { v: 1, f: 'h', tit: t, linha: '', min: 1, capa: false } });
  const [pj] = await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo,publicar_em) values ($1,'post','Publicar já','[]',$2,'amigos','<p>Texto suficiente para a coluna que vai sair agora mesmo, antes da hora.</p>',now()+interval '2 days') returning id`, [ids.b, colA('Publicar já')]);
  const [pc] = await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo,publicar_em) values ($1,'post','Vou desistir','[]',$2,'amigos','<p>Texto suficiente para a coluna que a autora vai cancelar e guardar como rascunho.</p>',now()+interval '3 days') returning id`, [ids.b, colA('Vou desistir')]);
  await recarrega(B); await ev(B, () => ed132Hub()); await sleep(400);
  await ev(B, id => document.querySelector(`[data-ed132agja="${id}"]`).click(), pj.id); await sleep(800);
  ok((await H.sql(`select publicar_em <= now() as ja from public.publicacoes where id=$1`, [pj.id]))[0].ja === true && (await como('a', `select id from public.publicacoes where id=$1`, [pj.id])).length === 1, '"Publicar agora": sai na hora e o Pedro já vê');
  await ev(B, id => document.querySelector(`[data-ed132agx="${id}"]`).click(), pc.id); await sleep(150); await ev(B, id => document.querySelector(`[data-ed132agx="${id}"]`).click(), pc.id); await sleep(900);
  ok(!(await H.sql(`select 1 from public.publicacoes where id=$1`, [pc.id])).length && await ev(B, () => ed132RascLe().some(r => r.tit === 'Vou desistir')), '"Cancelar": a agendada sai e volta para os rascunhos');
  await fecha(B);

  /* ================= 10. 360 px, escuro ================= */
  const P3 = await abrir('b', { vp: { width: 360, height: 740 }, n: '360' });
  await ev(P3, async () => { await ed132Sinc(); const d = ed132RascLe().find(r => r.tit === 'Vou desistir'); ed132Abre(ed132DoRasc(d)) }); await sleep(500);
  ok(await semLateral(P3), '360 px: editor sem rolagem lateral'); await shot(P3, '11-editor-360');
  await ev(P3, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(300);
  ok(await semLateral(P3), '360 px: "Antes de publicar" sem rolagem lateral'); await fecha(P3);
  await ev(P3, id => cs123Abrir(id), p1.id); await sleep(500); ok(await semLateral(P3), '360 px: página da coluna sem rolagem lateral'); await fecha(P3);
  const BD = await abrir('b', { dark: true, n: 'd' });
  await ev(BD, async () => { await ed132Sinc(); const d = ed132RascLe()[0]; ed132Abre(ed132DoRasc(d)) }); await sleep(500);
  const esc = await ev(BD, () => { const c = getComputedStyle($('#layer > .ed132')).backgroundColor.match(/\d+/g).map(Number), t = getComputedStyle($('#ed132-tit')).color.match(/\d+/g).map(Number); return { fundo: c[0] + c[1] + c[2], texto: t[0] + t[1] + t[2] } });
  ok(esc.fundo < 200 && esc.texto > 450, 'modo escuro: fundo escuro e texto claro no editor', esc); await shot(BD, '12-editor-escuro');
  await ev(BD, () => document.querySelector('[data-ed132modo="ver"]').click()); await sleep(300); await shot(BD, '13-ver-escuro');

  /* ================= 11. app com o banco SEM a v12 ================= */
  const H2 = await require('../harness').criar({ sql: __dirname + '/../sql/prumo-supabase.antes-v12.sql' });
  const i2 = {}; for (const k of ['a', 'b']) i2[k] = await H2.criarConta(k + '@y', '123456');
  await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [i2.a, i2.b]);
  await H2.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [i2.a, i2.b]);
  const abrir2 = async k => { const p = U.erros(await H2.pagina(br, { sessao: { user: { id: i2[k], email: k + '@y' } } }), k.toUpperCase() + 'sem');
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE2); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && V9.on !== null && ED132.v12.ag !== null && ED132.v12.ra !== null && ED132.v12.ve !== null, null, 20000); await sleep(400); await fecha(p); return p };
  const S2 = await abrir2('b');
  ok(await ev(S2, () => ED132.v12.ag === false && ED132.v12.ra === false && ED132.v12.ve === false), 'sem a v12: o app detecta (sem agendar, sem rascunhos no banco, sem versões)');
  await novaColuna(S2); await S2.fill('#ed132-tit', 'Coluna sem a v12'); await corpo(S2); await S2.keyboard.type('Texto da coluna escrita com o banco antigo, que precisa funcionar do mesmo jeito para a autora.');
  await S2.keyboard.press('Enter'); await S2.keyboard.type('/tit'); await S2.keyboard.press('Enter'); await S2.keyboard.type('Um intertítulo'); await sleep(2600);
  ok(await ev(S2, () => ed132RascLe().length === 1 && /neste aparelho/.test($('#layer > .ed132 .ed132-st').textContent)), 'sem a v12: rascunho só no aparelho ("Salvo neste aparelho")');
  await ev(S2, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(300);
  ok(await ev(S2, () => !document.querySelector('[data-ed132qv]') && !$('#ed132-qd')), 'sem a v12: "Agendar" não aparece');
  await ev(S2, () => document.querySelector('#layer .ed132-pp [data-ed132pub]').click()); await sleep(1200);
  const [s1] = await H2.sql(`select id,estilo,corpo from public.publicacoes where autor=$1`, [i2.b]);
  ok(!!s1 && s1.estilo.coluna.f === 'h' && /<h2>Um intertítulo<\/h2>/.test(s1.corpo), 'sem a v12: publica a coluna em HTML');
  const SA = await abrir2('a'); await recarrega(SA); await ev(SA, id => cs123Abrir(id), s1.id); await sleep(500);
  ok(await ev(SA, () => $('#layer .cs123-ler .cs123-corpo h2')?.textContent === 'Um intertítulo'), 'sem a v12: o Pedro lê a coluna');
  await recarrega(S2); await menu(S2, s1.id); await ev(S2, id => document.querySelector(`.sheet [data-mc1104ed="${id}"]`).click(), s1.id); await sleep(500);
  await ev(S2, () => document.querySelector('#layer > .ed132 [data-ed132mais]').click()); await sleep(300);
  ok(await ev(S2, () => !document.querySelector('.sheet [data-ed132hist]') && !!document.querySelector('.sheet [data-ed132hub]')), 'sem a v12: sem "Histórico de versões"');
  await fecha(S2); await ev(S2, id => ed132Edita(id), s1.id); await sleep(400);
  await S2.fill('#ed132-tit', 'Coluna sem a v12, revista'); await ev(S2, () => document.querySelector('#layer > .ed132 [data-ed132salva]').click()); await sleep(1000);
  ok((await H2.sql(`select estilo from public.publicacoes where id=$1`, [s1.id]))[0].estilo.coluna.tit === 'Coluna sem a v12, revista', 'sem a v12: editar o título funciona');

  for (const P of [A, B, P3, BD, S2, SA]) ok(!(P._erros || []).length, 'sem erros no console', P._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_editor_coluna: ${R.OKS} ok, ${R.FALHAS} falhas`);
  fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true });
  await br.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { fs.rmSync(path.join(SITE, 'series'), { recursive: true, force: true }); srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
