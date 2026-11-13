// Criação (dev 1): publicar em segundo plano, movimento, tela mais limpa, correções
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8910/index.html'; const F1 = __dirname + '/etapa13/foto.jpg', F2 = __dirname + '/../qa2/f2.jpg', VID = __dirname + '/teste.webm';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../shots-ig1/'; require('fs').mkdirSync(SH, { recursive: true });
const shot = (p, n) => p.screenshot({ path: SH + n + '.png' });
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const centro = (p, sel) => ev(p, s => { const e = document.querySelector(s).getBoundingClientRect(); return { x: e.x + e.width / 2, y: e.y + e.height / 2 } }, sel);
// deixa o envio lento (e opcionalmente falhar) para dar tempo de ver o progresso
const lento = (p, ms, falhas) => ev(p, ([ms, falhas]) => { window.__lentoMs = ms; window.__falhas = falhas || 0; if (!window.__lentoOn) { window.__lentoOn = 1; const o = pubSobe; pubSobe = async function () { await new Promise(r => setTimeout(r, window.__lentoMs)); if (window.__falhas > 0) { window.__falhas--; throw new Error('rede') } return o.apply(this, arguments) } } }, [ms, falhas]);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8910); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await A.context().grantPermissions(['camera'], { origin: 'http://localhost:8910' });
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await ev(A, () => pubCarregar()); await sleep(800);

  // ===== story: tela limpa, texto, figurinhas =====
  await ev(A, () => scrollTo(0, 0)); await clk(A, '#secs [data-meustory] .up-mais'); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer .ce .ce-modos')), 'câmera: seletor POST/STORY aparece');
  await clk(A, '[data-edgal]'); await A.setInputFiles('#ce-file', F1); await esperar(A, () => ED && ED.tela === 'edit', null, 5000); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#layer .ce .ce-modos')), 'depois de escolher a foto: seletor de modo some');
  await shot(A, '01-story-editor-limpo');
  // texto com botões rápidos
  await clk(A, '[data-edtexto]'); await sleep(250); await A.fill('#ce-txa', 'Bom dia, família!');
  ok(await ev(A, () => !!document.querySelector('.ce-tx [data-edtxal] svg') && /centro/.test(document.querySelector('.ce-tx [data-edtxal]').getAttribute('aria-label'))), 'texto: botão de alinhamento com ícone');
  await clk(A, '.ce-tx [data-edtxal]'); await sleep(60);
  ok(await ev(A, () => ED.st.tx.al === 'e' && !!document.querySelector('.ce-tx [data-edtxal] svg') && /esquerda/.test(document.querySelector('.ce-txlbl.on')?.textContent || '')), 'alinhamento troca para a esquerda (ícone e rótulo)');
  await clk(A, '.ce-tx [data-edtxal]'); await clk(A, '.ce-tx [data-edtxal]'); await clk(A, '.ce-tx [data-edtxfd]'); await sleep(60);
  ok(await ev(A, () => ED.st.tx.al === 'c' && ED.st.tx.fd === 1 && document.querySelector('.ce-tx [data-edtxfd]').dataset.fd === '1' && /sólido/.test(document.querySelector('.ce-txlbl.on')?.textContent || '')), 'fundo do texto: sólido');
  await clk(A, '.ce-tx [data-edtxfd]'); await sleep(60); ok(await ev(A, () => ED.st.tx.fd === 2 && /translúcido/i.test(document.querySelector('.ce-txlbl').textContent)), 'fundo do texto: translúcido');
  await shot(A, '02-texto-botoes-rapidos');
  // teclado do iPhone (--kb)
  const cores0 = await ev(A, () => document.querySelector('.ce-tx .ce-cores').getBoundingClientRect().bottom);
  await ev(A, () => document.documentElement.style.setProperty('--kb', '300px')); await sleep(80);
  const cores1 = await ev(A, () => document.querySelector('.ce-tx .ce-cores').getBoundingClientRect().bottom);
  ok(cores1 <= 844 - 295 && cores0 > 800, 'com teclado (--kb) as cores e fontes sobem acima dele ' + cores0 + '→' + cores1);
  await shot(A, '03-texto-com-teclado-kb');
  await ev(A, () => document.documentElement.style.setProperty('--kb', '0px'));
  await clk(A, '[data-edtxok]'); await sleep(200);
  // figurinhas em cascata
  for (let i = 0; i < 3; i++) { await clk(A, '.ce-top [data-edfig]'); await sleep(150); await clk(A, '.ce-fig [data-edfig="hora"]'); await sleep(150) }
  const pos = await ev(A, () => ED.st.els.filter(e => e.t === 'hora').map(e => [e.x, e.y]));
  ok(pos.length === 3 && new Set(pos.map(p => p.join())).size === 3 && pos.every((p, i) => pos.every((q, j) => i === j || Math.abs(p[0] - q[0]) > .05 || Math.abs(p[1] - q[1]) > .05)), 'figurinhas novas não nascem empilhadas ' + JSON.stringify(pos));
  await shot(A, '04-figurinhas-em-cascata');
  // toast no topo com o editor aberto
  await ev(A, () => toast('Teste de aviso')); await sleep(80);
  ok(await ev(A, () => { const t = document.querySelector('.toast').getBoundingClientRect(), p = document.querySelector('[data-edpubst="amigos"]').getBoundingClientRect(); return t.top < 140 && t.bottom < p.top }), 'aviso aparece no topo, longe dos botões de baixo');
  await shot(A, '05-aviso-no-topo');
  // arrastar: barras somem, lixeira
  { const r = await centro(A, '#ce-els .ce-el:last-child'); const lx = await ev(A, () => { const c = document.querySelector('#ce-cv').getBoundingClientRect(); return { x: c.x + c.width / 2, y: c.y + c.height * .93 } });
    await A.mouse.move(r.x, r.y); await A.mouse.down(); await A.mouse.move(r.x + 20, r.y + 30, { steps: 4 }); await sleep(80);
    ok(await ev(A, () => document.querySelector('#layer .ce').dataset.arr === '1' && getComputedStyle(document.querySelector('#layer .ce > .ce-top')).opacity === '0' && getComputedStyle(document.querySelector('#layer .ce > .ce-bot')).pointerEvents === 'none' && !document.querySelector('#ce-lixo').hidden), 'arrastando: barras de cima e de baixo somem, só a lixeira fica');
    await shot(A, '06-arrastando-sem-barras');
    await A.mouse.move(lx.x, lx.y, { steps: 6 }); await sleep(80);
    ok(await ev(A, () => document.querySelector('#ce-lixo').classList.contains('on') && !!document.querySelector('#ce-els .ce-el.ce-nolixo')), 'sobre a lixeira: ela cresce e o item encolhe');
    await shot(A, '07-sobre-a-lixeira');
    await A.mouse.up(); await sleep(120);
    ok(await ev(A, () => !document.querySelector('#layer .ce').dataset.arr && getComputedStyle(document.querySelector('#layer .ce > .ce-top')).opacity === '1' && ED.st.els.filter(e => e.t === 'hora').length === 2), 'soltou na lixeira: item apagado e barras de volta') }

  // ===== publicar story em segundo plano =====
  await lento(A, 1200, 0);
  const n0 = await ev(A, () => pubStoriesDe(S.uid).length);
  await clk(A, "[data-edpubst='amigos']"); await sleep(150);
  ok(await ev(A, () => !document.querySelector('#layer .ce') && !!PQ.atual && PQ.atual.tipo === 'story' && !!ED && ED.env), 'publicar story: o editor fecha na hora e o envio segue');
  ok(await ev(A, () => !!document.querySelector('#secs [data-meustory] .ig-r.pq-on')), 'anel de progresso no "Seu story"');
  await sleep(500); await A.screenshot({ path: SH + '08-story-anel-publicando.png', clip: { x: 0, y: 0, width: 390, height: 260 } });
  // não publica duas vezes, não abre outro editor no meio
  await ev(A, () => { edPublicaStory('amigos'); criarAbrir('story') }); await sleep(100);
  ok(await ev(A, () => PQ.jobs.length === 1 && !document.querySelector('#layer .ce') && /Espere/.test(document.querySelector('.toast')?.textContent || '')), 'sem publicação dupla; o editor não reabre durante o envio');
  ok(await ev(A, () => getComputedStyle(document.querySelector('.toast')).bottom !== 'auto' || document.querySelector('.toast').getBoundingClientRect().top > 400), 'sem editor, o aviso volta para baixo');
  // dá para navegar enquanto envia
  await ev(A, () => go('me')); await sleep(200); await ev(A, () => go('feed')); await sleep(200);
  await esperar(A, () => !ED && !PQ.atual, null, 15000); await sleep(400);
  ok(await ev(A, n => pubStoriesDe(S.uid).length === n + 1 && !document.querySelector('#secs .ig-r.pq-on'), n0), 'story publicado; o anel some');
  ok(await ev(A, () => { const x = pubStoriesDe(S.uid).slice(-1)[0]; return x.fotos.length === 1 && /Bom dia/.test(x.texto) }), 'story publicado com a foto e o texto');

  // ===== post em segundo plano, com faixa "Publicando…" =====
  await lento(A, 900, 0);
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-edpgal]'); await A.setInputFiles('#ce-pfile', [F1, F2]); await esperar(A, () => ED.po.fotos.length === 2, null, 5000); await sleep(200);
  ok(await ev(A, () => !!document.querySelector('#layer .ce .ce-modos')), 'post: seletor continua na tela da galeria');
  await clk(A, '[data-edav]'); await sleep(250); await clk(A, '[data-edav]'); await sleep(250); await A.fill('#ce-leg', 'Domingo no parque');
  await clk(A, '[data-edpubpo]'); await sleep(120);
  ok(await ev(A, () => !document.querySelector('#layer .ce') && PQ.atual && PQ.atual.tipo === 'post'), 'publicar post: o editor fecha na hora');
  await esperar(A, () => !!document.querySelector('#pq .pq-row .pq-bar'), null, 2000);
  ok(await ev(A, () => { const r = document.querySelector('#pq .pq-row'); return /Publicando/.test(r.textContent) && /blob:|data:/.test(r.querySelector('.pq-th').style.backgroundImage) && document.querySelector('#pq').compareDocumentPosition(document.querySelector('#posts')) & 4 }), 'faixa "Publicando…" com a miniatura no topo do Feed');
  await sleep(700); await A.screenshot({ path: SH + '09-post-publicando-faixa.png', clip: { x: 0, y: 0, width: 390, height: 360 } });
  await esperar(A, () => !ED && !PQ.atual, null, 15000);
  ok(await ev(A, () => /Publicado/.test(document.querySelector('#pq .pq-row')?.textContent || '')), 'ao terminar: "Publicado"');
  await esperar(A, () => !document.querySelector('#pq .pq-row'), null, 3000); await sleep(300);
  ok(await ev(A, () => { const x = PUB.itens.find(y => y.tipo === 'post' && y.texto === 'Domingo no parque'); return x && x.fotos.length === 2 && document.querySelector('#pq').hidden }), 'post publicado e a faixa some');
  await A.screenshot({ path: SH + '10-post-no-feed.png', clip: { x: 0, y: 0, width: 390, height: 600 } });

  // ===== falha: tentar de novo =====
  await lento(A, 300, 1);
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '[data-edpgal]'); await A.setInputFiles('#ce-pfile', F2); await esperar(A, () => ED.po.fotos.length === 1, null, 5000);
  await clk(A, '[data-edav]'); await sleep(200); await clk(A, '[data-edav]'); await sleep(200); await A.fill('#ce-leg', 'Segunda tentativa'); await clk(A, '[data-edpubpo]');
  await esperar(A, () => !!document.querySelector('#pq .pq-row.erro'), null, 8000); await sleep(400);
  ok(await ev(A, async () => !ED && !PQ.atual && /Não foi publicado/.test(document.querySelector('#pq .pq-row.erro').textContent) && !!document.querySelector('[data-pqtenta]') && !!document.querySelector('[data-pqdesc]') && (await rascLista()).length === 1), 'falhou: "Não foi publicado · Tentar de novo / Descartar" (e fica nos rascunhos)');
  await A.screenshot({ path: SH + '11-post-falhou.png', clip: { x: 0, y: 0, width: 390, height: 360 } });
  await clk(A, '[data-pqtenta]'); await sleep(100);
  ok(await ev(A, () => !!PQ.atual && /Publicando/.test(document.querySelector('#pq .pq-row').textContent)), 'tentar de novo: volta a publicar com o que foi guardado');
  await esperar(A, () => !ED && !PQ.atual, null, 10000); await sleep(600);
  ok(await ev(A, async () => PUB.itens.filter(y => y.texto === 'Segunda tentativa').length === 1 && (await rascLista()).length === 0), 'publicado uma vez só e o rascunho é apagado');

  // ===== falha de story: descartar =====
  await lento(A, 200, 1);
  await ev(A, () => criarAbrir('story')); await sleep(300); await clk(A, '[data-edcriar]'); await sleep(200); await A.fill('#ce-txa', 'Vai falhar'); await clk(A, '[data-edtxok]'); await sleep(150);
  await clk(A, "[data-edpubst='amigos']"); await esperar(A, () => !!document.querySelector('#pq .pq-row.erro'), null, 8000); await sleep(200);
  ok(await ev(A, () => !!document.querySelector('#secs [data-meustory] .ig-r.pq-erro')), 'story que falhou: aviso no "Seu story" e na faixa');
  await A.screenshot({ path: SH + '12-story-falhou.png', clip: { x: 0, y: 0, width: 390, height: 330 } });
  await clk(A, '[data-pqdesc]'); await sleep(200);
  ok(await ev(A, () => !document.querySelector('#pq .pq-row') && !document.querySelector('#secs .ig-r.pq-erro') && !PQ.jobs.length), 'descartar tira o aviso');

  await lento(A, 0, 0);

  // ===== movimento (com animações ligadas) =====
  await ev(A, () => localStorage.setItem('prumo-teste-anim', '1'));
  await ev(A, () => criarAbrir('story')); await sleep(60);
  ok(await ev(A, () => document.documentElement.classList.contains('ce-anim') && document.querySelector('#layer .ce').dataset.anim === 'entra' && /ceEntra/.test(getComputedStyle(document.querySelector('#layer .ce')).animationName)), 'editor abre deslizando');
  await sleep(400); await clk(A, '[data-edcriar]'); await sleep(300); await A.fill('#ce-txa', 'Oi'); await clk(A, '[data-edtxok]'); await sleep(30);
  ok(await ev(A, () => !!document.querySelector('#ce-els .ce-el.ce-pop')), 'texto novo entra com um "pop"');
  await sleep(300); await clk(A, '.ce-top [data-edfig]'); await sleep(30);
  ok(await ev(A, () => /ceSobe|sheetIn/.test(getComputedStyle(document.querySelector('.ce-figp')).animationName)), 'bandeja de figurinhas sobe deslizando');
  await sleep(300); await clk(A, '.ce-fig [data-edemo]'); await sleep(30);
  ok(await ev(A, () => !!document.querySelector('#ce-els .ce-el.ce-pop')), 'figurinha nova entra com um "pop"');
  await sleep(400); await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer() }); await sleep(40);
  ok(await ev(A, () => !!document.querySelector('body > .ce.ce-sai') && !document.querySelector('#layer .ce')), 'editor fecha deslizando para baixo');
  await sleep(400); ok(await ev(A, () => !document.querySelector('.ce.ce-sai')), 'a cópia que sai é removida');
  await ev(A, () => localStorage.removeItem('prumo-teste-anim'));
  await ev(A, () => criarAbrir('story')); await sleep(60);
  ok(await ev(A, () => !document.documentElement.classList.contains('ce-anim')), 'sem animações sob teste/movimento reduzido');
  await ev(A, () => { ED = null; closeLayer._ok = true; closeLayer() }); await sleep(100);

  // B vê o que foi publicado
  await ev(B, () => pubCarregar()); await sleep(1500);
  ok(await ev(B, () => PUB.itens.filter(x => x.autor !== S.uid && x.tipo === 'post').length === 2), 'Bia recebe os 2 posts');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_ig_publicar: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
