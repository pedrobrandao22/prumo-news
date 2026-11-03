// QA stories (02/11): regressões dos bugs achados andando pelo app como usuário (ver qa/BUGS.md)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORT = 8920, BASE = `http://localhost:${PORT}/index.html`;
const SH = __dirname + '/../shots-qa-stories/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const shot = async (p, nome) => { await sleep(250); await p.screenshot({ path: SH + nome + '.png' }) };
const CDP = new Map(); async function cdp(p) { if (!CDP.has(p)) CDP.set(p, await p.context().newCDPSession(p)); return CDP.get(p) }
async function swipe(p, x0, y0, x1, y1, n = 10, ms = 16) { const c = await cdp(p); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= n; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }] }); await sleep(ms) }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
const rect = (p, sel) => ev(p, s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2 } }, sel);
const tapSel = async (p, sel) => { const r = await rect(p, sel); if (!r) throw new Error('sem ' + sel); await p.touchscreen.tap(r.cx, r.cy) };
const fechaTudo = p => ev(p, () => { for (let i = 0; i < 5 && ($('#layer2').innerHTML || $('#layer').innerHTML); i++) closeLayer() });
const sec = p => ev(p, () => ST && ST.sec && document.querySelector('#layer .story') ? ST.sec : null);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const chip = async (p, k) => { await clk(p, '.ce-top [data-edfig]'); await sleep(300); await clk(p, `.ce-fig [data-edfig="${k}"]`); await sleep(350) };
async function publica(p, pub = 'amigos') { const n0 = await ev(p, () => pubStoriesDe(S.uid).length); await clk(p, `[data-edpubst='${pub}']`); await esperar(p, n => !ED && !PQ.atual && pubStoriesDe(S.uid).length >= n + 1, n0, 20000); await sleep(400) }
async function storyTexto(p, txt, figs) { await ev(p, () => criarAbrir('story')); await sleep(700); await tapSel(p, '[data-edcriar]'); await sleep(500); await p.keyboard.type(txt); await tapSel(p, '[data-edtxok]'); await sleep(300); if (figs) await figs(p); await publica(p) }

(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORT); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  for (const p of [A, B, C]) await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  const convite = async P => { await ev(P, () => go('me')); await sleep(300); await clk(P, '[data-convidar]'); await sleep(150); await clk(P, '[data-gerarconvite]'); await esperar(P, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(P, () => document.querySelector('#cvurl').value); await ev(P, () => closeLayer()); return l };
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await criar(C, { url: await convite(B), nome: 'Carla Mendes', email: 'c@x.com' }); const uidC = await ev(C, () => S.uid); await esperar(B, u => S.amigos.has(u), uidC);
  const uidA = await ev(A, () => S.uid);
  for (const p of [A, B, C]) { await ev(p, () => go('feed')); await esperar(p, () => PUB.on === true, null, 8000) }

  // Pedro: texto + enquete + quiz; texto + contagem; Melhores amigos (Bia) e depois um story para todos
  await storyTexto(A, 'Bom dia, família!', async p => {
    await chip(p, 'enq'); await p.fill('#ce-eq', 'Vamos ao parque domingo?'); await p.fill('#fe-o0', 'Sim'); await p.fill('#fe-o1', 'Não'); await clk(p, '[data-edfok]'); await sleep(300);
    await chip(p, 'quiz'); await p.fill('#fq', 'Capital do Paraná?'); await p.fill('#fo0', 'Londrina'); await p.fill('#fo1', 'Curitiba'); await clk(p, '[data-fqc="1"]'); await clk(p, '[data-edfok]'); await sleep(300) });
  await ev(A, () => criarAbrir('story')); await sleep(700); await tapSel(A, '[data-edcriar]'); await sleep(500); await A.keyboard.type('Agenda'); await tapSel(A, '[data-edtxok]'); await sleep(300);
  await chip(A, 'cont'); await A.fill('#fq', 'Aniversário da vó'); await ev(A, () => { const d = new Date(Date.now() + 3 * 864e5); const i = document.querySelector('#fd'); i.value = d.toISOString().slice(0, 10); i.dispatchEvent(new Event('change', { bubbles: true })) }); await clk(A, '[data-edfok]'); await sleep(300);
  // S02: no editor a contagem já reserva o espaço do "Lembrar"
  const contEd = await ev(A, () => { const n = document.querySelector('#ce-els .fg-cont'); return { h: n.getBoundingClientRect().height, after: getComputedStyle(n, '::after').content } });
  ok(/Lembrar/.test(contEd.after), 'S02 contagem no editor mostra o "Lembrar" (reserva o espaço que os amigos veem)', JSON.stringify(contEd));
  await publica(A);
  await ev(A, async u => { await SB.from('melhores_amigos').insert({ dono: S.uid, amigo: u }); await maCarregar() }, uidB);
  await ev(A, async () => { const now = Date.now(); await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now + 1000, expira: now + 864e5, texto: 'Só os íntimos', fotos: [], estilo: { fundo: 2 }, publico: 'proximos' }); await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now + 2000, expira: now + 864e5, texto: 'Para todos', fotos: [], estilo: { fundo: 3 }, publico: 'amigos' }) });
  await ev(C, async () => { const now = Date.now(); await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now, expira: now + 864e5, texto: 'Oi da Carla', fotos: [], estilo: { fundo: 4 }, publico: 'amigos' }) });

  // ===== Bia
  await ev(B, () => { go('feed'); pubCarregar(); PREF.storyAuto = false; scrollTo(0, 0) }); await esperar(B, () => document.querySelectorAll('#secs [data-ustory]').length === 2, null, 8000); await sleep(400);
  // S12: anel verde mesmo com um story "para todos" depois do dos Melhores amigos
  ok(await ev(B, u => !!document.querySelector(`#secs [data-ustory="${u}"] .ig-r.ma`), uidA), 'S12 anel verde: há story dos Melhores amigos não visto (mesmo não sendo o último)');
  const ordem = await ev(B, () => [...document.querySelectorAll('#secs [data-ustory]')].map(b => b.dataset.ustory));
  // S03: abrir o 1º, voltar, abrir o 1º de novo (já visto) e avançar → vai para o 2º da bandeja (não pula para o Em 5 min)
  await tapSel(B, `#secs [data-ustory="${ordem[0]}"] .ig-r`); await esperar(B, () => !!document.querySelector('#layer .story'), null, 5000); await sleep(600);
  await ev(B, () => history.back()); await sleep(900);
  await tapSel(B, `#secs [data-ustory="${ordem[0]}"] .ig-r`); await esperar(B, () => !!document.querySelector('#layer .story'), null, 5000); await sleep(600);
  await ev(B, () => { ST.i = ST.itens.length - 1; drawStory() }); await sleep(300); await B.touchscreen.tap(350, 420); await sleep(900);
  ok(await sec(B) === '_u:' + ordem[1], 'S03 story já visto reaberto: avançar vai para o próximo da bandeja', JSON.stringify([await sec(B), ordem]));
  // S01: enquete do Pedro do mesmo tamanho do editor (sem pílula dentro da pílula)
  await fechaTudo(B); await sleep(400); await ev(B, u => igAbrirUser(u), uidA); await sleep(1000); await ev(B, () => { ST.i = 0; drawStory() }); await sleep(700);
  const enq = await ev(B, () => { const bt = document.querySelector('#layer .us-enq .ce-eo button'), sp = bt.querySelector('span'); const cs = getComputedStyle(sp); return { h: bt.getBoundingClientRect().height, pad: cs.paddingTop, bg: cs.backgroundColor } });
  ok(enq.h < 48 && enq.pad === '0px' && /rgba\(0, 0, 0, 0\)|transparent/.test(enq.bg), 'S01 opção da enquete no story publicado sem pílula dupla (altura normal)', JSON.stringify(enq));
  await shot(B, 'qa01-enquete');
  // S11 (lado da Bia): responde o quiz
  await tapSel(B, '#layer [data-usquiz][data-i="1"]'); await sleep(800);
  // S05: teclado aberto (iPhone): a barra de resposta sobe
  await tapSel(B, '#layer .us-rp input'); await sleep(400); await ev(B, () => document.documentElement.style.setProperty('--kb', '300px')); await sleep(200);
  const kb = await ev(B, () => Math.round(innerHeight - document.querySelector('#layer .us-f').getBoundingClientRect().bottom));
  ok(kb >= 295, 'S05 com o teclado aberto, a barra de resposta do story sobe junto', kb);
  await shot(B, 'qa02-resposta-teclado');
  await ev(B, () => { document.documentElement.style.removeProperty('--kb'); document.activeElement.blur() }); await sleep(300);
  // reage com 😂 para testar a conversa depois
  await tapSel(B, '#layer .us-rp input'); await sleep(400); await tapSel(B, '#layer .vs98-reac button:nth-child(1)'); await sleep(1000);
  await fechaTudo(B); await sleep(400);
  // S04: deslizar a partir do "Em 5 min" vai para "Últimas" (a Agenda é o fim do Em 5 min)
  await ev(B, () => scrollTo(0, 0)); await tapSel(B, '#secs [data-5min] .ig-r'); await esperar(B, () => ST && ST.sec === '_5min' && !!document.querySelector('#layer .story'), null, 5000); await sleep(600);
  const temAg = await ev(B, () => agPaginas().length > 0);
  await swipe(B, 330, 420, 40, 420, 10, 16); await sleep(1000);
  ok(!temAg || await sec(B) === '_ult', 'S04 deslizar no Em 5 min vai para Últimas (não para a Agenda)', JSON.stringify([temAg, await sec(B)]));
  await swipe(B, 40, 420, 330, 420, 10, 16); await sleep(1000);
  ok(await sec(B) === '_5min' || await sec(B) === '_ag', 'S04 deslizar de volta em Últimas volta para o Em 5 min', await sec(B));
  await fechaTudo(B); await sleep(400);
  // S09: story aberto pelo perfil do Pedro → voltar volta ao perfil
  await ev(B, u => abrirPerfil(u), uidA); await sleep(1200); await tapSel(B, '#layer [data-pfstory]'); await esperar(B, () => !!document.querySelector('#layer .story'), null, 5000); await sleep(700);
  await ev(B, () => history.back()); await sleep(1300);
  ok(await ev(B, u => !document.querySelector('#layer .story') && !!document.querySelector(`#layer [data-pfstory="${u}"]`), uidA), 'S09 story aberto pelo perfil: voltar volta para o perfil');
  await fechaTudo(B); await sleep(400);

  // ===== Pedro
  await ev(A, () => { go('feed'); pubCarregar(); PREF.storyAuto = false }); await sleep(1500);
  // S11: quiz no próprio story mostra quantas responderam
  await ev(A, () => igAbrirUser(S.uid)); await sleep(1000); await ev(A, () => { ST.i = 0; drawStory() }); await sleep(700);
  ok(await ev(A, () => /1 resposta/.test(document.querySelector('#layer .fg-quiz .fg-qn')?.textContent || '')), 'S11 quiz no seu story: "1 resposta"');
  await fechaTudo(A); await sleep(400);
  // S06: conversa com a Bia: miniatura da última mensagem do mesmo tamanho das outras e sem estilo da lista de Últimas
  await ev(A, u => abrirConversa(u), uidB); await sleep(1500);
  const th = await ev(A, () => [...document.querySelectorAll('#v-msgs .ca100-st')].map(b => Math.round(b.getBoundingClientRect().width)));
  ok(th.length >= 1 && th.every(w => w === 104), 'S06 miniaturas de story na conversa todas com 104px (inclusive a última mensagem)', JSON.stringify(th));
  ok(await ev(A, () => { const m = [...document.querySelectorAll('#v-msgs .dm-m.ult button')]; return m.every(b => getComputedStyle(b).paddingTop !== '12px') }), 'S06 botões da última mensagem não pegam o estilo da lista de Últimas');
  await shot(A, 'qa03-conversa');
  await ev(A, () => go('feed')); await sleep(300);
  // S07 + S10: Arquivo — miniatura com a figurinha viva; abrir story e voltar volta para o Arquivo
  await ev(A, () => abrirArquivo()); await esperar(A, () => document.querySelectorAll('#layer [data-arqi]').length >= 2, null, 6000); await sleep(400);
  ok(await ev(A, () => [...document.querySelectorAll('#layer [data-arqi] .ar104')].some(e => /Vamos ao parque|Capital/.test(e.textContent))), 'S10 Arquivo: miniatura mostra a figurinha viva (enquete)');
  await shot(A, 'qa04-arquivo');
  await tapSel(A, '#layer [data-arqi="0"]'); await esperar(A, () => !!document.querySelector('#layer .story'), null, 5000); await sleep(600);
  await ev(A, () => history.back()); await sleep(1300);
  ok(await ev(A, () => !document.querySelector('#layer .story') && !!document.querySelector('#layer .pfv-arq')), 'S07 story aberto pelo Arquivo: voltar volta para o Arquivo');
  await fechaTudo(A); await sleep(300);
  // S08: 360px — galeria do editor não fica espremida
  await A.setViewportSize({ width: 360, height: 740 }); await ev(A, () => criarAbrir('story')); await sleep(700); await tapSel(A, '[data-edcriar]'); await sleep(400); await A.keyboard.type('Oi'); await tapSel(A, '[data-edtxok]'); await sleep(300);
  const g = await rect(A, '.ce-bot .ce-gal');
  ok(g && g.w >= 40 && Math.abs(g.w - g.h) < 6, 'S08 360px: botão da galeria quadrado no editor do story', JSON.stringify(g));
  await shot(A, 'qa05-editor-360');

  ok(!A._erros.length && !B._erros.length && !C._erros.length, 'sem erros ' + A._erros.concat(B._erros, C._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_qa_stories: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
