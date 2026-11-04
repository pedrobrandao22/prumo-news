// Testes B (03/11): amigos, posts, Giro e conversas usando o app como Pedro (admin, dois aparelhos), Bia, Carla e Dani,
// no estado de produção (foco, visual novo com o cartão A, sem reels e fase 2). Correções em js/121 + css/36; detalhes em qa/TESTES-B.md.
// Portas 8738–8739. Capturas em qa/testes-b/depois/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8738, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'testes-b', 'depois'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const foto = async (p, n) => { await sleep(300); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
let srv = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c', 'd']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro')`, [ids.a, ids.b, ids.c, ids.d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita'),($4,$1,'aceita')`, [ids.a, ids.b, ids.c, ids.d]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V8 !== 'undefined' && V8.on === true, null, 15000); await sleep(600); await fecha(p); return p };
  const A = await abrir('a'), A2 = await abrir('a', { n: '2', dark: true, vp: { width: 360, height: 760 } }), B = await abrir('b'), C = await abrir('c'), D = await abrir('d');
  ok(await ev(A, () => document.documentElement.classList.contains('vn') && VN112_CT === 'a' && VN_FASE2 && FOCO_LIGADO && !REELS_LIGADO && typeof tb121Voto === 'function'), 'estado de produção (cartão A, fase 2, foco, sem reels) e o 121 carregado');
  const ins = (P, r) => ev(P, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], ...r }).select('id'); await pubCarregar(); return q.data[0].id }, r);
  const feed = P => ev(P, async () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 12; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
  const pinta = P => ev(P, () => { const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const g = cv.getContext('2d');
    PUB.itens.forEach(x => x.fotos.forEach((f, i) => { g.fillStyle = ['#2f7d5b', '#36589a', '#a3562a'][i % 3]; g.fillRect(0, 0, 800, 600); g.fillStyle = '#fff'; g.font = '700 64px sans-serif'; g.textAlign = 'center'; g.fillText('Foto ' + (i + 1), 400, 320); PUB.urls[f] = { u: cv.toDataURL('image/jpeg', .7), exp: Date.now() + 9e9 } })) });
  const mostra = async (P, id, n) => { await ev(P, id => { const e = document.getElementById('p-u:' + id); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - 70) }, id); await sleep(250); await foto(P, n) };
  const atividade = async P => { await ev(P, async () => { AT.t = 0; await atCarregar(); abrirAtividade() }); await sleep(900); return ev(P, () => [...document.querySelectorAll('#layer .pfv-at li')].map(l => (l.querySelector('.at-tx') || l).textContent.replace(/\s+/g, ' ').trim())) };
  const now = Date.now(); const fp = (u, n, k) => Array.from({ length: n }, (_, i) => `${u}/${k}-${i}.jpg`);
  const pk = await ev(A, () => ordenadas(visiveis()).map(p => p.id));
  const P = {};
  P.ana = await ins(B, { at: now - 80 * 60e3, texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro. #Copom', estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo', fu: 'bcb.gov.br' } } });
  P.rel3 = await ins(B, { at: now - 70 * 60e3, texto: 'Fila no posto\n\nTrês fotos da fila. #Eleição', fotos: fp(ids.b, 3, 'b'), estilo: { v: 2, local: 'Tijuca', cn: { v: 1, k: 'rel', tit: 'Fila no posto' } } });
  P.fio = await ins(B, { at: now - 60 * 60e3, texto: 'Três pontos sobre o assunto do dia.', estilo: { v: 2, fio: ['Segundo: o crédito encarece.', 'Terceiro: #Copom decide amanhã.'] } });
  P.enq = await ins(B, { at: now - 58 * 60e3, texto: 'Vocês acham que passa?', pid: pk[3], estilo: { v: 2, cn: { v: 1, k: 'enq', tit: 'Passa no Senado?', o: ['Sim', 'Não'] } } });
  P.ped = await ins(A, { at: now - 50 * 60e3, texto: 'Minha opinião: o Senado aprova com folga. #Senado', estilo: { v: 2 } });
  P.rpC = await ins(C, { at: now - 45 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.ana } } });
  P.qRel = await ins(C, { at: now - 44 * 60e3, texto: 'Que fila!', estilo: { v: 2, rp: { k: 'pub', id: P.rel3 } } });
  P.rFio = await ins(C, { at: now - 43 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.fio } } });
  P.qEnq = await ins(C, { at: now - 42 * 60e3, texto: 'Votem!', estilo: { v: 2, rp: { k: 'pub', id: P.enq } } });
  P.rpEnq = await ins(D, { at: now - 41 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.ped } } });
  P.qq = await ins(A, { at: now - 40 * 60e3, texto: 'Repost do repost', estilo: { v: 2, rp: { k: 'pub', id: P.qRel } } });
  P.st = await ins(B, { tipo: 'story', at: now - 30 * 60e3, expira: now + 20 * 3600e3, texto: 'Texto do giro', estilo: { v: 2, fundo: 3, itens: [{ t: 'enq', q: 'Vai passar?', o: ['Sim', 'Não'], x: .5, y: .7, s: 1, r: 0 }] } });
  for (const X of [A, A2, B, C, D]) { await pinta(X); await feed(X) } await sleep(600);

  /* ---------- TB01 + TB04: Pedro vota na enquete do giro da Bia, responde e curte ---------- */
  await ev(A, u => document.querySelector(`#secs [data-ustory="${u}"]`).click(), ids.b); await sleep(1200);
  await ev(A, () => document.querySelector('#layer [data-usvoto]').click()); await sleep(900);
  await A.fill('#layer .us-rp input', 'Acho que passa!'); await ev(A, () => document.querySelector('#layer .us-rp').requestSubmit()); await sleep(1000);
  await ev(A, () => document.querySelector('#layer [data-uscurtir]').click()); await sleep(1000); await fecha(A);
  ok(+(await H.sql(`select count(*) n from pub_reacoes where pub=$1 and uid=$2 and tipo='voto'`, [P.st, ids.a]))[0].n === 1, 'TB01: o voto do Pedro na enquete do giro ficou gravado');
  const atB = await atividade(B); await foto(B, 'tb01-atividade-bia');
  ok(atB.some(t => /^Pedro Brandão votou na enquete do seu giro/.test(t)), 'TB01: Atividade da Bia: "Pedro votou na enquete do seu giro"', JSON.stringify(atB));
  ok(atB.some(t => /^Pedro Brandão respondeu ao seu giro: “Acho que passa!”/.test(t)) && !atB.some(t => /^Pedro Brandão respondeu ao seu giro(?!:)/.test(t)), 'TB01: a resposta aparece uma vez (com o texto) e o voto não vira "respondeu ao seu giro"', JSON.stringify(atB));
  ok(await ev(B, () => { const it = atItens(); const v = it.find(x => /^voto:/.test(x.k)); return !!v && v.us.length === 1 }), 'TB01: o item de voto tem um avatar só');
  // a regra antiga continua para giro com outras figurinhas (quiz/slider): "respondeu"
  ok(await ev(B, u => { const r0 = AT.rows, p0 = AT.pubs; try { AT.rows = [{ tipo: 'voto', pub: 'zz1', uid: u, at: Date.now(), chave: 'k1' }]; AT.pubs = { zz1: { id: 'zz1', tipo: 'story', autor: S.uid, estilo: { itens: [{ t: 'quiz' }] }, fotos: [] } };
    const it = atItens().find(x => x.pub === 'zz1'); return it && /<\/b> respondeu ao seu story/.test(it.txt) } finally { AT.rows = r0; AT.pubs = p0 } }, ids.a), 'TB01: giro com quiz continua "respondeu ao seu giro"');
  await fecha(B);
  // TB04: conversas
  await ev(B, () => { THREAD = null; go('msgs') }); await sleep(600);
  const lista = await ev(B, () => [...document.querySelectorAll('#v-msgs .dm-row, #v-msgs [data-conversa]')].map(e => e.textContent.replace(/\s+/g, ' ')).join(' | '));
  ok(/Curtiu seu giro/.test(lista) && !/story/i.test(lista), 'TB04: lista de Conversas da Bia: "Curtiu seu giro" (sem "story")', lista);
  await ev(B, u => abrirConversa(u), ids.a); await sleep(900);
  const thB = await ev(B, () => [...document.querySelectorAll('#v-msgs .dm-lb, #v-msgs .dm-ev, #v-msgs .dm-q small, #v-msgs .dm-uh small, #v-msgs .ca100-stl')].map(e => e.textContent));
  ok(thB.some(t => /Respondeu ao seu giro/.test(t)) && thB.some(t => /[Cc]urtiu seu giro/.test(t)) && !thB.some(t => /story/i.test(t)), 'TB04: conversa da Bia: "Respondeu ao seu giro", "curtiu seu giro"', JSON.stringify(thB));
  await foto(B, 'tb04-conversa-bia');
  await ev(A, u => abrirConversa(u), ids.b); await sleep(900);
  const thA = await ev(A, () => [...document.querySelectorAll('#v-msgs .dm-lb, #v-msgs .dm-ev, #v-msgs .dm-q small, #v-msgs .dm-uh small, #v-msgs .ca100-stl')].map(e => e.textContent));
  ok(thA.some(t => /Você respondeu ao giro de Bia Souza/.test(t)) && thA.some(t => /Você curtiu o giro de Bia Souza/.test(t)) && !thA.some(t => /story/i.test(t)), 'TB04: conversa do Pedro: "Você respondeu ao giro de Bia", "Você curtiu o giro de Bia"', JSON.stringify(thA));
  ok(await ev(A, () => [...document.querySelectorAll('#v-msgs .bub')].some(b => b.textContent === 'Acho que passa!')), 'TB04: o texto da resposta continua igual');
  // menção no giro
  await ev(B, async ([u, id]) => { await dmEnviar(u, { texto: 'Mencionou você no story', pid: 'u:' + id, snap: { titulo: 'Story de ' + nomeDe(S.uid), upub: id, story: true }, tipo: 'mencao' }, true) }, [ids.a, P.st]); await sleep(900);
  await ev(A, u => { THREAD = null; abrirConversa(u) }, ids.b); await sleep(900);
  const thA2 = await ev(A, () => [...document.querySelectorAll('#v-msgs .dm-lb, #v-msgs .dm-uh small')].map(e => e.textContent));
  ok(thA2.includes('Mencionou você no giro') && thA2.includes('Giro'), 'TB04: menção: "Mencionou você no giro" e o cartão diz "Giro"', JSON.stringify(thA2));
  ok(await ev(A, () => dmPrevia(S.msgsIn.find(m => m.tipo === 'mencao')) === 'Mencionou você no giro'), 'TB04: prévia da menção: "Mencionou você no giro"');
  await foto(A, 'tb04-conversa-pedro');
  await ev(A, () => { THREAD = null; go('feed') });

  /* ---------- TB02: bloquear tira a pessoa da Atividade ---------- */
  await ev(D, pid => openComments(pid), 'u:' + P.ped); await sleep(400); await D.fill('#ctext', 'Concordo, Pedro.'); await ev(D, () => document.querySelector('#cform .sendc').click()); await sleep(1000); await fecha(D);
  await ev(B, pid => openComments(pid), 'u:' + P.ped); await sleep(400); await B.fill('#ctext', 'Discordo.'); await ev(B, () => document.querySelector('#cform .sendc').click()); await sleep(1000); await fecha(B);
  let atA = await atividade(A);
  ok(atA.some(t => /Dani Rocha comentou/.test(t)), 'TB02: antes de bloquear, o comentário da Dani está na Atividade', JSON.stringify(atA));
  await fecha(A); await ev(A, async u => { await bloquear(u, true) }, ids.d); await sleep(1000);
  atA = await atividade(A);
  ok(!atA.some(t => /Dani/.test(t)) && atA.some(t => /Bia Souza comentou: “Discordo/.test(t)), 'TB02: depois de bloquear, nada da Dani na Atividade (o resto continua)', JSON.stringify(atA));
  ok(await ev(A, u => { const r0 = AT.rows; try { AT.rows = r0.concat([{ tipo: 'curtida', pub: Object.keys(AT.pubs)[0], uid: u, at: Date.now() }]); const it = atItens().filter(x => x.us && x.us.includes(u)); return it.length === 0 } finally { AT.rows = r0 } }, ids.d), 'TB02: curtida de quem foi bloqueado também some');
  await fecha(A);

  /* ---------- TB03: ações inteiras em 360px nos posts desenhados fora da tela ---------- */
  // curtidas e reposts para ter números nas ações
  await ev(A2, async () => { await pubCarregar(); renderPosts(); for (let i = 0; i < 12; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) }); await sleep(800);
  const cortes = await ev(A2, async () => { const out = []; const ps = [...document.querySelectorAll('#posts > .post.vn-ca')];
    for (const p of ps) { p.scrollIntoView({ block: 'center' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); await new Promise(r => setTimeout(r, 40));
      const sp = [...p.querySelectorAll('.acts>.act>span')].filter(s => s.offsetWidth); const c = sp.filter(s => s.scrollWidth > s.clientWidth + 1).map(s => s.textContent);
      const cnt = [...p.querySelectorAll('.acts .cnt')].map(c => c.textContent).join(''); if (c.length) { const ac = p.querySelector('.acts'); out.push({ id: p.id, c, cnt, ak: ac.className, w: ac.clientWidth, sw: ac.scrollWidth, pc: p.className, kids: [...ac.children].map(k => k.className + '|' + (k.dataset.a || '') + '|' + k.textContent.trim() + ':' + k.offsetWidth + ':' + getComputedStyle(k).order + ':' + getComputedStyle(k).display), ml: getComputedStyle(ac).marginLeft, pw: p.clientWidth, anc: (() => { const o = []; let e = ac; while (e && e !== p.parentElement) { const cs = getComputedStyle(e); o.push(e.className.slice(0, 30) + ':' + e.clientWidth + ':' + cs.paddingLeft + '/' + cs.paddingRight + ':' + cs.marginLeft + '/' + cs.marginRight); e = e.parentElement } return o })() }) } }
    return { n: ps.length, out } });
  if (cortes.out.length) console.log('DBG cortes', JSON.stringify(cortes.out));
  ok(cortes.n > 10 && cortes.out.length === 0, `TB03 (360px, escuro): nenhum "Comentar"/"Repostar" cortado em ${cortes.n} cartões`, JSON.stringify(cortes.out.slice(0, 4)));
  await mostra(A2, P.enq, 'tb03-pergunta-360-escuro');

  /* ---------- TB05: fonte dentro do cartão da análise ---------- */
  await feed(A); await sleep(500);
  const f5 = await ev(A, id => { const a = document.getElementById('p-u:' + id); const f = a && a.querySelector('.cn102-fonte'); const acts = a && a.querySelector('.acts');
    return f && { dentro: !!f.closest('.cn102-cd'), antes: !!(f.compareDocumentPosition(acts) & Node.DOCUMENT_POSITION_FOLLOWING), n: a.querySelectorAll('.cn102-fonte').length, tx: f.textContent } }, P.ana);
  ok(f5 && f5.dentro && f5.antes && f5.n === 1 && /bcb\.gov\.br/.test(f5.tx), 'TB05: "Fonte: bcb.gov.br" dentro do cartão da análise, antes das ações', JSON.stringify(f5));
  await mostra(A, P.ana, 'tb05-analise-fonte');
  ok(await ev(A, () => { const a = [...document.querySelectorAll('#posts .ac117-rel')]; return a.length >= 1 && a.every(r => !r.querySelector('.tb121-fonte')) }), 'TB05: o relato continua com a fonte no lugar dele (117)');

  /* ---------- TB09 / TB10: cartão citado ---------- */
  const q9 = await ev(A, id => { const a = document.getElementById('p-u:' + id); return a && [...a.querySelectorAll('.vn-q .vn-q-k')].map(e => e.textContent) }, P.rFio);
  ok(q9 && q9.includes('Fio · 3 partes'), 'TB09: repost de fio: "Fio · 3 partes" no cartão citado', JSON.stringify(q9));
  const q10 = await ev(A, id => { const a = document.getElementById('p-u:' + id); return a && [...a.querySelectorAll('.vn-q .vn-q-k')].map(e => e.textContent.trim()) }, P.qq);
  ok(q10 && q10.includes('citando Bia Souza'), 'TB10: citação de citação: "citando Bia Souza"', JSON.stringify(q10));
  const q10b = await ev(A, id => { const a = document.getElementById('p-u:' + id); return a && [...a.querySelectorAll('.vn-q .vn-q-k')].map(e => e.textContent.trim()) }, P.qRel);
  ok(q10b && q10b.includes('Relato') && !q10b.some(t => /citando|Fio/.test(t)), 'TB10: citação simples do relato continua só com "Relato"', JSON.stringify(q10b));
  await mostra(A, P.rFio, 'tb09-repost-fio'); await mostra(A, P.qq, 'tb10-citacao-de-citacao');
  // a Dani (não é amiga da Bia) reposta o post do Pedro: o cartão não revela nada a mais
  await feed(D); await sleep(400);
  ok(await ev(D, id => { const a = document.getElementById('p-u:' + id); return !a || !/Bia|Carla/.test(a.textContent) }, P.rpEnq), 'privacidade: repost da Dani do post do Pedro não mostra amigos dela que ela não conhece');

  /* ---------- TB07: post arquivado pelo próprio autor no repost de amiga ---------- */
  await feed(B); await ev(B, id => { const e = document.getElementById('p-u:' + id); e.scrollIntoView(); e.querySelector('[data-umenu]').click() }, P.ana); await sleep(500);
  await ev(B, () => document.querySelector('.sheet [data-u8arq]').click()); await sleep(1500);
  ok(+(await H.sql(`select count(*) n from publicacoes where id=$1 and arquivado`, [P.ana]))[0].n === 1, 'TB07: análise arquivada');
  await feed(B); await sleep(600);
  const q7 = await ev(B, id => { const a = document.getElementById('p-u:' + id); return a ? (a.querySelector('.vn-q0') || {}).textContent || a.textContent : '' }, P.rpC);
  ok(/Você arquivou esta publicação/.test(q7) && !/não está entre os seus amigos/.test(q7), 'TB07: no Feed da Bia, o repost da Carla diz "Você arquivou esta publicação"', q7);
  await mostra(B, P.rpC, 'tb07-repost-arquivado-autora');
  await ev(C, () => { VN112_Q.clear() }); await feed(C); await sleep(900);
  const q7c = await ev(C, id => { const a = document.getElementById('p-u:' + id); return a ? a.textContent : '' }, P.rpC);
  ok(/Publicação indisponível/.test(q7c) && !/Você arquivou/.test(q7c), 'TB07: a Carla continua vendo "Publicação indisponível"', q7c.slice(0, 200));

  /* ---------- 4x CPU: desenhar o Feed e rolar até o fim sem travadas longas ---------- */
  { const cdp = await A.context().newCDPSession(A); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const m = await ev(A, async () => { const lt = []; const po = new PerformanceObserver(l => l.getEntries().forEach(e => lt.push(Math.round(e.duration)))); try { po.observe({ type: 'longtask', buffered: false }) } catch (e) { }
      const t0 = performance.now(); renderPosts(); for (let i = 0; i < 12; i++) try { carregarMais(true) } catch (e) { } const tr = Math.round(performance.now() - t0);
      let fr = 0, run = true; const conta = () => { fr++; if (run) requestAnimationFrame(conta) }; requestAnimationFrame(conta);
      const t1 = performance.now(); const H = document.scrollingElement.scrollHeight; for (let y = 0; y < H; y += 260) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)) }
      run = false; const ts = performance.now() - t1; po.disconnect(); return { render: tr, fps: Math.round(fr / ts * 1000), maxLt: Math.max(0, ...lt), nLt: lt.length } });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); console.log('DBG cpu4', JSON.stringify(m));
    ok(m.render < 5000 && m.maxLt < 5000 && m.fps >= 20, 'CPU 4x: Feed desenhado e rolado até o fim (medida; trava só se passar de 5 s)', JSON.stringify(m)); }
  await feed(A); await sleep(300);

  /* ---------- larguras, tema e erros ---------- */
  for (const w of [360, 390, 430]) { await A.setViewportSize({ width: w, height: 844 }); await sleep(300);
    ok(await ev(A, () => document.scrollingElement.scrollWidth <= innerWidth), `${w}px: sem rolagem para o lado no Feed`) }
  await A.setViewportSize({ width: 390, height: 844 });
  const errs = [A, A2, B, C, D].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console', JSON.stringify(errs.slice(0, 5)));
  const r = U.resumo(); r.RES.filter(x => /^FAIL/.test(x)).forEach(x => console.log(x.slice(0, 700))); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); if (srv) srv.kill(); process.exit(1) });
