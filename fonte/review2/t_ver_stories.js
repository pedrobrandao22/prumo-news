// Ver stories (rodada 2): bandeja, ordem congelada, cabeçalho ⋯, segurar, resposta com reações, enviar, Atividade do seu story
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORT = 8951, BASE = `http://localhost:${PORT}/index.html`;
const SH = __dirname + '/../shots-ig5/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const shot = async (p, nome, o) => { await sleep(250); await p.screenshot({ path: SH + nome + '.png', ...(o || {}) }) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const CDP = new Map();
async function cdp(p) { if (!CDP.has(p)) CDP.set(p, await p.context().newCDPSession(p)); return CDP.get(p) }
async function swipe(p, x0, y0, x1, y1, n = 10, ms = 16) { const c = await cdp(p); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= n; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n }] }); await sleep(ms) }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
const tap = (p, x, y) => p.touchscreen.tap(x, y);
const rect = (p, sel) => ev(p, s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, cx: b.x + b.width / 2, cy: b.y + b.height / 2 } }, sel);
const fechaTudo = p => ev(p, () => { for (let i = 0; i < 4 && ($('#layer2').innerHTML || $('#layer').innerHTML); i++) closeLayer() });

(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORT); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const ctx = o => H.pagina(b, o);
  const A = U.erros(await ctx(), 'A'), B = U.erros(await ctx(), 'B'), C = U.erros(await ctx(), 'C');
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  const convite = async P => { await ev(P, () => go('me')); await sleep(300); await clk(P, '[data-convidar]'); await sleep(150); await clk(P, '[data-gerarconvite]'); await esperar(P, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(P, () => document.querySelector('#cvurl').value); await ev(P, () => closeLayer()); return l };
  const link = await convite(A);
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  const linkB = await convite(B);
  await criar(C, { url: linkB, nome: 'Carla Mendes', email: 'c@x.com' }); const uidC = await ev(C, () => S.uid); await esperar(B, u => S.amigos.has(u), uidC);
  const uidA = await ev(A, () => S.uid);
  for (const p of [A, B, C]) { await ev(p, () => go('feed')); await esperar(p, () => PUB.on === true, null, 8000) }

  // Pedro: story com foto + story com enquete/quiz/slider para os Melhores amigos (Bia)
  const ids = await ev(A, async uB => {
    const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 960); gr.addColorStop(0, '#2c6e9b'); gr.addColorStop(1, '#f2a65a'); g.fillStyle = gr; g.fillRect(0, 0, 540, 960);
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(270, 600, 90, 0, 7); g.fill(); g.fillStyle = '#1d4e6e'; g.fillRect(0, 690, 540, 270); g.fillStyle = '#fff'; g.font = 'bold 54px sans-serif'; g.textAlign = 'center'; g.fillText('Fim de tarde', 270, 300);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', .85)); const path = await pubSobe(blob);
    await SB.from('melhores_amigos').insert({ dono: S.uid, amigo: uB }); await maCarregar();
    const now = Date.now();
    const r1 = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now - 60000, expira: now + 864e5, texto: 'Fim de tarde', fotos: [path], estilo: { v: 2, itens: [] }, publico: 'amigos' }).select('id');
    const r2 = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now - 30000, expira: now + 864e5, texto: '', fotos: [], publico: 'proximos',
      estilo: { v: 2, itens: [{ t: 'enq', q: 'Onde vamos no domingo?', o: ['Praia', 'Serra'], x: .5, y: .3, s: 1, r: 0 }, { t: 'slid', q: 'Quanto você ama domingo?', emo: '😍', x: .5, y: .62, s: .9, r: 0 }] } }).select('id');
    if (r1.error || r2.error) return { erro: (r1.error || r2.error).message }; return { s1: r1.data[0].id, s2: r2.data[0].id } }, uidB);
  ok(ids && ids.s1 && ids.s2, 'Pedro publicou 2 stories (um para Melhores amigos)', JSON.stringify(ids));
  await ev(C, async () => { const now = Date.now(); await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', at: now, expira: now + 864e5, texto: 'Oi gente! Primeira vez aqui', fotos: [], estilo: { fundo: 4 }, publico: 'amigos' }) });

  // ===== Bia: bandeja =====
  await ev(B, () => { go('feed'); pubCarregar() }); await esperar(B, () => document.querySelectorAll('#secs [data-ustory]').length === 2, null, 8000); await ev(B, () => scrollTo(0, 0)); await sleep(400);
  const tray = await ev(B, () => { const it = [...document.querySelectorAll('#secs .ig-s')].slice(0, 4); const ys = it.map(e => Math.round(e.querySelector(':scope > b').getBoundingClientRect().top));
    const m = document.querySelector('#secs [data-meustory] .up-mais'), mr = m.getBoundingClientRect(), r = document.querySelector('#secs [data-meustory] .ig-r').getBoundingClientRect();
    const bgs = [...document.querySelectorAll('#secs [data-ustory] .ig-r')].map(e => ({ ma: e.classList.contains('ma'), bg: getComputedStyle(e).backgroundImage, cor: getComputedStyle(e).backgroundColor }));
    return { ys, pos: getComputedStyle(m).position, mr: [mr.x - r.x, mr.y - r.y, mr.width], centro: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).closest('[data-criarde]') ? 'mais' : 'anel', esq: document.elementFromPoint(r.x + 12, r.y + r.height / 2 + 10).closest('[data-criarde]') ? 'mais' : 'anel', bgs, ordem: [...document.querySelectorAll('#secs [data-ustory] > b')].map(e => e.textContent) } });
  ok(new Set(tray.ys).size === 1, 'rótulos alinhados (Seu story na mesma linha dos outros)', JSON.stringify(tray.ys));
  ok(tray.pos === 'absolute' && tray.centro === 'anel' && tray.esq === 'anel', 'o + fica fora do fluxo e não cobre o anel', JSON.stringify(tray));
  ok(tray.bgs.some(x => x.ma) && tray.bgs.some(x => !x.ma), 'giro dos Melhores amigos marcado (classe ma) ao lado de um giro comum', JSON.stringify(tray.bgs));
  await shot(B, 'v01-bandeja', { clip: { x: 0, y: 0, width: 390, height: 200 } });
  // anel girando (forçado, para a foto)
  await ev(B, () => document.querySelector('#secs [data-ustory] .ig-r').classList.add('vs98-carrega')); await shot(B, 'v02-bandeja-carregando', { clip: { x: 0, y: 0, width: 390, height: 200 } });
  await ev(B, () => document.querySelector('#secs [data-ustory] .ig-r').classList.remove('vs98-carrega'));

  // ===== Bug 1: abrir a Carla e tocar à direita vai para o Pedro (não pula) =====
  ok(tray.ordem[0] === 'Carla', 'Carla é a primeira da bandeja', tray.ordem.join(','));
  await ev(B, () => { PREF.storyAuto = true });
  const rc = await rect(B, '#secs [data-ustory] .ig-r'); await tap(B, rc.cx, rc.cy); await esperar(B, () => !!document.querySelector('#layer .story.sg-user'), null, 5000); await sleep(500);
  ok(await ev(B, () => /Carla/.test(document.querySelector('#layer .sg-who b').textContent)), 'tocar no anel abre o story da Carla');
  ok(await ev(B, () => getComputedStyle(document.querySelector('.nav')).visibility === 'hidden' || document.querySelector('#layer .story').getBoundingClientRect().height >= innerHeight - 1), 'story cobre a tela (barra de abas por baixo)');
  const hdr = await ev(B, () => { const s = document.querySelector('#layer .story .s-hb'); const a = s.querySelector('[data-sauto]'); return { auto: !!a && getComputedStyle(a).display !== 'none', menu: !!s.querySelector('[data-vs98menu]'), n: [...s.querySelectorAll('button')].filter(x => getComputedStyle(x).display !== 'none').length } });
  ok(!hdr.auto && hdr.menu && hdr.n === 2, 'cabeçalho: sem pausar/continuar, só ⋯ e ✕', JSON.stringify(hdr));
  ok(await ev(B, () => !!document.querySelector('#layer .us-f [data-vs98env]') && !!document.querySelector('#layer .us-f [data-uscurtir]')), 'rodapé do amigo: ♥ e enviar');
  await shot(B, 'v03-story-carla');
  await tap(B, 350, 420); await sleep(900);
  const dep = await ev(B, () => ({ quem: document.querySelector('#layer .sg-who b')?.textContent, sec: ST.sec }));
  ok(/Pedro/.test(dep.quem || ''), 'depois da Carla vem o Pedro (a ordem não muda ao marcar como visto)', JSON.stringify(dep));
  // MA: cabeçalho numa linha
  const posMA = await ev(B, () => { if (ST.itens[ST.i].publico !== 'proximos') storyGo(1); return true }); await sleep(800);
  const ma = await ev(B, () => { const w = document.querySelector('#layer .sg-who'), b = w.querySelector('b'), p = w.querySelector('.us-ma'); return { pub: ST.itens[ST.i].publico, hb: b.getBoundingClientRect().height, hw: w.getBoundingClientRect().height, sel: !!p, ph: p && p.getBoundingClientRect().height, dy: p && Math.abs((p.getBoundingClientRect().top + p.getBoundingClientRect().height / 2) - (b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2)) } });
  ok(ma.pub === 'proximos' && ma.sel && ma.hb < 24 && ma.hw < 26 && ma.ph <= 20 && ma.dy < 4, 'Melhores amigos: nome, hora e selo verde numa linha', JSON.stringify(ma));
  await shot(B, 'v04-story-pedro-ma');
  // segurar: não encolhe, esconde a interface
  const c = await cdp(B); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 700 }] }); await sleep(500);
  const hold = await ev(B, () => { const s = document.querySelector('#layer .story'); return { cls: s.classList.contains('segurando'), tf: getComputedStyle(s).transform, op: getComputedStyle(s.querySelector('.us-f')).opacity, timer: !!ST.timer } });
  await shot(B, 'v05-story-segurando'); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(400);
  ok(hold.cls && (hold.tf === 'none' || hold.tf === 'matrix(1, 0, 0, 1, 0, 0)') && hold.op === '0' && !hold.timer, 'segurar: pausa e esconde a interface, sem encolher', JSON.stringify(hold));
  ok(await ev(B, () => !!document.querySelector('#layer .story.sg-user') && /Pedro/.test(document.querySelector('#layer .sg-who b').textContent)), 'soltar não avança nem fecha');
  // votar na enquete
  await ev(B, () => document.querySelector('#layer [data-usvoto][data-i="0"]')?.click()); await sleep(900);
  ok(await ev(B, id => meuVoto('us:' + id) === 0, ids.s2), 'Bia votou "Praia"');
  // curtir
  await ev(B, () => document.querySelector('#layer [data-uscurtir]').click()); await sleep(700);
  // resposta: foco escurece e mostra 8 reações
  const ip = await rect(B, '#layer .us-rp input'); await tap(B, ip.cx, ip.cy); await sleep(500);
  const foco = await ev(B, () => { const r = document.querySelector('#layer .vs98-reac'); return { dig: document.querySelector('#layer .story').classList.contains('digitando'), n: r.querySelectorAll('button').length, tot: VS98_EMOS.length, vis: getComputedStyle(r).visibility, dim: getComputedStyle(document.querySelector('#layer .vs98-dim')).opacity, timer: !!ST.timer } });
  ok(foco.dig && foco.n === foco.tot && foco.tot === 5 && foco.vis === 'visible' && foco.dim === '1' && !foco.timer, 'foco na resposta: escurece, pausa e mostra as reações (5 com o foco, 105)', JSON.stringify(foco));
  await shot(B, 'v06-resposta-reacoes');
  const em = await rect(B, '#layer .vs98-reac button:nth-child(3)'); await tap(B, em.cx, em.cy); await sleep(1200);
  const msgs = await H.sql(`select tipo, texto, snap from mensagens where de='${uidB}' and para='${uidA}' order by at`);
  ok(msgs.some(m => m.tipo === 'resp_story' && m.texto === '🤔' && m.snap && m.snap.story && m.snap.story.id === ids.s2), 'reação 🤔 enviada como resposta ao story', JSON.stringify(msgs.map(m => m.tipo + ':' + m.texto)));
  ok(msgs.some(m => m.tipo === 'curtiu_story'), 'curtida enviada');
  ok(await ev(B, () => !document.querySelector('#layer .story').classList.contains('digitando')), 'depois de reagir, a reação some e o story volta');
  // deslizar para cima foca a resposta
  await ev(B, () => { PREF.storyAuto = false; ST.i = 0; drawStory() }); await sleep(500);
  await swipe(B, 200, 600, 205, 380, 10, 16); await sleep(500);
  ok(await ev(B, () => document.activeElement && document.activeElement.matches('#layer .us-rp input')), 'deslizar para cima abre a resposta');
  await ev(B, () => document.activeElement.blur()); await sleep(400);
  // enviar o story
  await ev(B, () => document.querySelector('#layer [data-vs98env]').click()); await sleep(500);
  ok(await ev(B, () => /Enviar (story|giro)/.test(document.querySelector('#layer2 .sheet')?.textContent || '') && !!document.querySelector('#layer2 [data-pick]')), 'enviar abre a lista de amigos');
  await ev(B, () => document.querySelector('#layer2 [data-pick]').click()); await ev(B, () => document.querySelector('#layer2 #sform').requestSubmit()); await sleep(900);
  const env = await H.sql(`select pid from mensagens where de='${uidB}' and pid like 'u:%'`);
  ok(env.length === 1 && env[0].pid === 'u:' + ids.s1, 'story enviado para a amiga', JSON.stringify(env));
  // menu ⋯
  await ev(B, () => document.querySelector('#layer .story [data-vs98menu]').click()); await sleep(400);
  const mn = await ev(B, () => document.querySelector('#layer2 .sheet').textContent);
  ok(/Denunciar/.test(mn) && /Passar sozinho/.test(mn) && /Mandar mensagem/.test(mn), 'menu ⋯: mensagem, passar sozinho e denunciar', mn);
  await shot(B, 'v07-menu-amigo');
  await ev(B, () => document.querySelector('#layer2 [data-vs98auto]').click()); await sleep(400);
  ok(await ev(B, () => PREF.storyAuto === true && !!document.querySelector('#layer .bars b') && !document.querySelector('#layer2').innerHTML), '"Passar sozinho" liga de novo pelo menu');
  await ev(B, () => document.querySelector('#layer .story [data-vs98menu]').click()); await sleep(300); await ev(B, () => document.querySelector('#layer2 [data-denp]').click()); await sleep(400);
  ok(await ev(B, () => /Denunciar/.test(document.querySelector('#layer2 .sheet')?.textContent || '') && !!document.querySelector('#layer2 #dok')), 'Denunciar abre o fluxo de denúncia');
  await fechaTudo(B); await sleep(400);
  // escuro
  await B.emulateMedia({ colorScheme: 'dark' }); await ev(B, () => { go('feed'); scrollTo(0, 0) }); await sleep(400); await shot(B, 'v08-bandeja-escuro', { clip: { x: 0, y: 0, width: 390, height: 200 } }); await B.emulateMedia({ colorScheme: 'light' });
  // com animações: anel gira enquanto prepara, depois a transição (sem a barra de abas por cima)
  await ev(B, () => { localStorage.setItem('prumo-teste-anim', '1'); go('feed'); scrollTo(0, 0) }); await sleep(400);
  const r2 = await rect(B, '#secs [data-ustory] .ig-r'); await tap(B, r2.cx, r2.cy); await sleep(90);
  const gir = await ev(B, () => !!document.querySelector('#secs .ig-r.vs98-carrega')); await B.screenshot({ path: SH + 'v12-abrindo-anel.png', clip: { x: 0, y: 0, width: 390, height: 200 } });
  await sleep(330); await B.screenshot({ path: SH + 'v13-abrindo-transicao.png' }); await sleep(900);
  ok(gir && await ev(B, () => !!document.querySelector('#layer .story.sg-user') && !document.querySelector('#secs .vs98-carrega')), 'com animação: anel gira e depois o story abre');
  await fechaTudo(B); await ev(B, () => localStorage.removeItem('prumo-teste-anim')); await sleep(400);

  // ===== Pedro: o próprio story =====
  await ev(A, () => { go('feed'); pubCarregar(); scrollTo(0, 0) }); await sleep(1500); await ev(A, () => { PREF.storyAuto = false; renderSecs() }); await sleep(200);
  const ra = await rect(A, '#secs [data-meustory] .ig-r'); await tap(A, ra.cx - 10, ra.cy + 8); await sleep(900);
  ok(await ev(A, () => !!document.querySelector('#layer .story.sg-user') && !document.querySelector('#layer .ce')), 'tocar no próprio anel abre o seu story (não a câmera)');
  await ev(A, () => { ST.i = 1; drawStory() }); await sleep(1200);
  const rod = await ev(A, () => { const f = document.querySelector('#layer .us-f'); const bs = [...f.querySelectorAll('.vs98-ic')]; return { txt: document.querySelector('[data-usvistos] span')?.textContent, labels: bs.map(x => x.querySelector('small').textContent), hs: bs.map(x => Math.round(x.querySelector('small').getBoundingClientRect().height)), av: f.querySelectorAll('.vs98-avs .av').length, lbh: Math.round(f.querySelector('.vs98-lb small').getBoundingClientRect().height), fh: Math.round(f.getBoundingClientRect().height) } });
  ok(/Visto por 1/.test(rod.txt) && rod.av === 1, 'Atividade: pilha de rostos e "Visto por 1"', JSON.stringify(rod));
  ok(rod.labels.join(',') === 'Pôr numa coleção,Enviar,Mais' && rod.hs.every(h => h < 18) && rod.lbh < 18, 'rodapé do seu giro: Pôr numa coleção, Enviar e Mais, sem quebrar linha', JSON.stringify(rod));
  await shot(A, 'v09-proprio-story');
  await ev(A, () => document.querySelector('#layer [data-usvistos]').click()); await esperar(A, () => !!document.querySelector('#layer2 .vs98-vl'), null, 5000).catch(() => { }); await sleep(300);
  const at = await ev(A, () => { const li = document.querySelector('#layer2 .vs98-v'); return { titulo: document.querySelector('#layer2 .sh-h').textContent, nome: li?.querySelector('b')?.textContent, cor: !!li?.querySelector('.vs98-cor'), ch: [...(li?.querySelectorAll('.vs98-ch') || [])].map(e => e.textContent), em: li?.querySelector('.vs98-em')?.textContent, dm: li?.querySelector('[data-conversa]')?.dataset.conversa, res: document.querySelector('#layer2 .vs98-res')?.textContent } });
  ok(/Atividade/.test(at.titulo) && /Bia/.test(at.nome || '') && at.cor && at.ch.some(t => /Praia/.test(t)) && at.em === '🤔' && at.dm === uidB, 'Atividade: quem viu, curtida, voto, reação e atalho para responder', JSON.stringify(at));
  await shot(A, 'v10-atividade');
  await ev(A, () => document.querySelector('#layer2 [data-conversa]').click()); await sleep(900);
  ok(await ev(A, u => !document.querySelector('#layer .story') && THREAD === u, uidB), 'responder abre a conversa com a Bia');
  await fechaTudo(A); await ev(A, () => go('feed')); await sleep(300);
  // Mais do seu story
  await ev(A, () => igAbrirUser(S.uid)); await sleep(900); await ev(A, () => document.querySelector('#layer .us-f [data-vs98menu]').click()); await sleep(400);
  const mm = await ev(A, () => document.querySelector('#layer2 .sheet').textContent);
  ok(/Criar outro giro/.test(mm) && /Apagar este giro/.test(mm), 'Mais: criar outro e apagar', mm);
  await shot(A, 'v11-mais-proprio');
  await ev(A, () => document.querySelector('#layer2 [data-vs98apagar]').click()); await sleep(200); await ev(A, () => document.querySelector('#layer2 [data-vs98apagar]').click()); await sleep(1200);
  ok((await H.sql(`select id from publicacoes where tipo='story' and autor='${uidA}'`)).length === 1, 'apagar (dois toques) tira o story');
  await fechaTudo(A); await sleep(300);
  // deslizar para cima no próprio story abre a Atividade
  await ev(A, () => igAbrirUser(S.uid)); await sleep(900); await swipe(A, 200, 600, 205, 380, 10, 16); await sleep(1000);
  ok(await ev(A, () => /Atividade/.test(document.querySelector('#layer2 .sh-h')?.textContent || '')), 'deslizar para cima no seu story abre a Atividade');
  await fechaTudo(A);

  { const er = A._erros.concat(B._erros, C._erros).filter(e => !/Ignored attempt to cancel a touch/.test(e)); ok(!er.length, 'sem erros ' + er.join('|')) }
  const R = U.resumo(); console.log(`\nRESUMO t_ver_stories: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
