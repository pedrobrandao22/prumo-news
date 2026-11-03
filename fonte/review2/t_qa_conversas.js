// QA de Conversas (02/11): curtida/reação em mensagem direta, cartões, teclado, resposta, denúncia, ex-amigo, conta excluída, escuro
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8908, BASE = `http://localhost:${PORTA}/index.html`;
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(A) { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
async function toque(p, sel, ms = 50) { const h = await p.$(sel); await h.scrollIntoViewIfNeeded(); const b = await h.boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2; const c = p._cdp || (p._cdp = await p.context().newCDPSession(p)); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await sleep(ms); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }) }
async function doisToques(p, sel) { await toque(p, sel, 40); await sleep(90); await toque(p, sel, 40) }
const pilulas = p => ev(p, () => [...document.querySelectorAll('.dm-rx')].map(r => { const b = r.getBoundingClientRect(), c = r.closest('.dm-c').getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), dentro: b.left >= c.left - 1 && b.right <= c.right + 1 } }));
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b, { dark: true }), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await esperar(A, u => S.amigos.has(u), uidB);
  // Pedro manda duas mensagens e uma notícia
  await ev(A, u => { go('msgs'); abrirConversa(u) }, uidB); await sleep(500);
  for (const t of ['Oi Bia, tudo bem?', 'Viu a PEC?']) { await A.fill('#mtext', t); await clk(A, '#mform .send'); await sleep(500) }
  const pid = await ev(A, () => FEED.pautas[0].id);
  await ev(A, async ([u, p]) => { await dmEnviar(u, { texto: '', pid: p, snap: snapById(p) }) }, [uidB, pid]); await sleep(1200);
  // Bia: dois toques na última mensagem de texto do Pedro e na própria resposta
  await ev(B, u => { go('msgs'); abrirConversa(u) }, uidA); await sleep(900);
  const mPec = await ev(B, () => [...document.querySelectorAll('.dm-m.theirs')].find(m => /PEC/.test(m.textContent)).dataset.mid);
  await doisToques(B, `[data-mid="${mPec}"] .bub`); await sleep(1300);
  await B.fill('#mtext', 'Vi sim'); await clk(B, '#mform .send'); await sleep(1200);
  const mVi = await ev(B, () => [...document.querySelectorAll('.dm-m.mine')].pop().dataset.mid);
  await doisToques(B, `[data-mid="${mVi}"] .bub`); await sleep(1300);
  const pB = await pilulas(B);
  ok(pB.length === 2 && pB.every(x => x.w < 70 && x.h < 34 && x.dentro), 'curtida em mensagem (recebida e enviada): pílula pequena sob o balão, não um bloco branco por cima', JSON.stringify(pB));
  ok(await ev(B, () => { const c = document.querySelector('.dm-card'); if (!c) return false; const cs = getComputedStyle(c); return cs.paddingTop === '0px' && c.getBoundingClientRect().width <= 241 }), 'cartão de notícia no último balão do grupo sem o estilo da lista de Últimas');
  ok(await ev(B, () => { const b = document.querySelector('.dm-m.mine .bub:not(.bub-emo)'); return getComputedStyle(b).color === 'rgb(15, 21, 34)' }), 'modo escuro: texto das suas mensagens legível (escuro sobre o azul claro)');
  await B.screenshot({ path: SH + 'qa-conv-reacoes-B.png' });
  // Pedro: lista, pílula, quem reagiu, tirar
  await ev(A, () => { THREAD = null; go('msgs') }); await sleep(800);
  const prev = await ev(A, () => document.querySelector('.dm-lista .dm-row .dm-pv').textContent);
  ok(/^Reagiu ❤️ à própria mensagem: “Vi sim”$/.test(prev), 'prévia diz que ela reagiu à própria mensagem e qual', prev);
  ok(await ev(A, () => getComputedStyle(document.querySelector('.dm-lista .dm-t')).whiteSpace === 'pre'), 'espaço antes do "· agora" na lista');
  await ev(A, u => abrirConversa(u), uidB); await sleep(900);
  const pA = await pilulas(A); ok(pA.length === 2 && pA.every(x => x.w < 70 && x.dentro), 'Pedro vê as duas curtidas como pílulas', JSON.stringify(pA));
  await A.screenshot({ path: SH + 'qa-conv-reacoes-A.png' });
  await doisToques(A, `[data-mid="${mPec}"] .bub`).catch(() => { }); await sleep(100);
  await ev(A, id => dmReagir(id, '😂'), mVi); await sleep(1300);
  await ev(A, () => document.querySelector('.dm-rx').click()); await sleep(400);
  ok(await ev(A, () => /Reações/.test(document.querySelector('.sheet')?.textContent || '') && document.querySelectorAll('.dm104-rl li').length >= 1), 'tocar na pílula mostra quem reagiu');
  const tira = await ev(A, () => !!document.querySelector('[data-dm104tira]'));
  if (tira) { await ev(A, () => document.querySelector('[data-dm104tira]').click()); await sleep(1300) }
  ok(tira && (await H.sql(`select count(*)::int n from mensagens where de='${uidA}' and tipo='reacao_msg'`))[0].n <= 1, '“Toque para tirar” tira a sua reação');
  // reação em mensagem ainda sem id do servidor: ignorada, sem reação órfã
  await ev(A, () => dmReagir('tmp123abc', '❤️')); await sleep(600);
  ok((await H.sql(`select count(*)::int n from mensagens where tipo='reacao_msg' and snap->>'ref' like 'tmp%'`))[0].n === 0, 'reagir a mensagem ainda enviando não cria reação órfã');
  // notícia abre por cima da conversa e o voltar traz de volta
  await clk(A, '.dm-card'); await sleep(900);
  ok(await ev(A, () => !!document.querySelector('#layer .mat') && VIEW === 'msgs' && !!THREAD && /Conversas/.test(document.querySelector('#layer .mat-v')?.textContent || '')), 'notícia da conversa abre a matéria por cima (‹ Conversas)');
  await ev(A, () => history.back()); await sleep(800);
  ok(await ev(A, () => !document.querySelector('#layer').innerHTML && VIEW === 'msgs' && !!THREAD && !!document.querySelector('#mform')), 'voltar devolve para a conversa');
  // resposta: a barra não cobre a última mensagem; citação leva à original
  await ev(A, () => scrollTo(0, 1e6)); await ev(A, id => dmResponder(id), mVi); await sleep(500);
  ok(await ev(A, () => { const l = [...document.querySelectorAll('.dm-m')].pop().getBoundingClientRect(), c = document.querySelector('.composer').getBoundingClientRect(); return l.bottom <= c.top + 1 }), 'barra "Respondendo a…" não cobre a última mensagem');
  await A.fill('#mtext', 'Que bom'); await clk(A, '#mform .send'); await sleep(1000);
  await ev(A, () => scrollTo(0, 0)); await ev(A, () => [...document.querySelectorAll('.dm-m div.dm-q')].pop().click()); await sleep(900);
  ok(await ev(A, id => { const r = document.querySelector(`[data-mid="${id}"]`).getBoundingClientRect(); return r.top > 50 && r.bottom < innerHeight - 60 }, mVi), 'tocar na citação leva à mensagem original');
  // teclado aberto: a caixa sobe e a última mensagem fica acima dela
  await ev(A, () => { document.activeElement && document.activeElement.blur(); scrollTo(0, 0) }); await sleep(200); await ev(A, () => { document.documentElement.style.setProperty('--kb', '300px'); document.querySelector('#mtext').focus() }); await sleep(700);
  ok(await ev(A, () => { const c = document.querySelector('.composer').getBoundingClientRect(), l = [...document.querySelectorAll('.dm-m')].pop().getBoundingClientRect(); return Math.abs(innerHeight - c.bottom - 300) < 2 && l.bottom <= c.top + 1 }), 'teclado aberto: caixa de mensagem acima do teclado e conversa rolada até o fim', await ev(A, () => { const c = document.querySelector('.composer').getBoundingClientRect(), l = [...document.querySelectorAll('.dm-m')].pop().getBoundingClientRect(); return [innerHeight, c.top, c.bottom, l.bottom, scrollY, document.documentElement.scrollHeight, document.activeElement.id] }));
  await A.screenshot({ path: SH + 'qa-conv-teclado.png' });
  await ev(A, () => { document.documentElement.style.setProperty('--kb', '0px'); document.activeElement.blur() });
  // denunciar mensagem recebida
  await ev(A, id => dmAcoes(id), mVi); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('[data-dm104den]')), 'segurar mensagem recebida tem "Denunciar mensagem"');
  await ev(A, () => document.querySelector('[data-dm104den]').click()); await sleep(500);
  ok(await ev(A, () => /A mensagem de Bia Souza/.test(document.querySelector('.sheet p')?.textContent || '')), 'tela de denúncia fala da mensagem');
  await ev(A, () => document.querySelector('#dok').click()); await sleep(1000);
  ok((await H.sql(`select tipo, texto from denuncias`)).some(d => d.tipo === 'mensagem' && d.texto === 'Vi sim'), 'denúncia gravada com o texto da mensagem');
  // enviar para vários: escolhido tem ✓
  await ev(A, p => openSend(p), pid); await sleep(400);
  ok(await ev(A, () => getComputedStyle(document.querySelector('#pick [aria-pressed="true"] .dm-ck'), '::after').content !== 'none'), 'enviar: amigo escolhido mostra ✓');
  await ev(A, () => closeLayer()); await sleep(300);
  // mensagem antiga mostra a data com mês
  ok(await ev(A, () => /^\d+ de [a-z]{3}, \d\dh\d\d$/.test(dmQuando(Date.now() - 9 * 864e5))), 'mensagem de mais de uma semana: "23 de out, 23h39"', await ev(A, () => dmQuando(Date.now() - 9 * 864e5)));
  // ex-amigo: pedir amizade pela conversa; aceitar pela conversa
  await ev(A, u => desfazerAmizade(u), uidB); await sleep(2000);
  await ev(B, u => { THREAD = null; go('msgs'); abrirConversa(u) }, uidA); await sleep(1200);
  ok(await ev(B, () => !!document.querySelector('.dm-comp [data-pedir]')), 'conversa com ex-amigo tem "Pedir amizade"');
  await ev(B, () => document.querySelector('.dm-comp [data-pedir]').click()); await sleep(2000);
  await ev(A, u => { THREAD = null; go('msgs'); abrirConversa(u) }, uidB); await sleep(1500);
  ok(await ev(A, () => !!document.querySelector('.dm-comp [data-aceitar]') && /pediu para ser seu amigo/.test(document.querySelector('.dm-comp').textContent)), 'quem recebeu o pedido aceita pela conversa');
  await ev(A, () => document.querySelector('.dm-comp [data-aceitar]').click()); await sleep(2000);
  ok(await ev(A, u => S.amigos.has(u) && !!document.querySelector('#mform'), uidB), 'aceitou: a caixa de mensagem volta');
  // conta excluída: avatar neutro
  await ev(B, async () => { await excluirConta() }); await sleep(2500);
  await ev(A, () => { THREAD = null; go('msgs') }); await sleep(1200);
  ok(await ev(A, () => { const a = document.querySelector('.dm-lista .av'); return /Conta excluída/.test(document.querySelector('.dm-lista').textContent) && a.classList.contains('dm104-exc') && !a.textContent }), 'conta excluída: avatar neutro, sem letra');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_qa_conversas: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
