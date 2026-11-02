// Teste social com usuários reais em páginas abertas ao mesmo tempo (Postgres real com RLS via harness).
// A = fundador (Pedro); B = convidada por A (Ana); C = convidado por B (Caio); D = login sem convite que depois entra com convite de A (Dani).
const U = require('./t_util');
const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8768/index.html';
const P1 = 'pec-6x1-senado', P2 = 'debate-band';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function foto2(p, nome) { // claro e escuro
  await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
  await U.foto(p, nome + '-claro');
  await p.evaluate(() => document.documentElement.setAttribute('data-aparencia', 'escuro'));
  await U.foto(p, nome + '-escuro');
  await p.evaluate(() => { const t = PREF.tema || 'auto'; if (t === 'auto') document.documentElement.removeAttribute('data-aparencia'); else document.documentElement.setAttribute('data-aparencia', t) });
}
async function criarViaUI(p, { url, cod, nome, email }) {
  await p.goto(url || BASE);
  await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  if (cod != null) await p.fill('#lcod', cod);
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456');
  await clk(p, '#lform [type=submit]');
  const r = await esperar(p, () => S.membro && S.amigosOk, null, 8000);
  if (await esperar(p, () => /Bem-vindo ao Prumo/.test(document.querySelector('.sheet')?.textContent || ''), null, 3000)) { p._bv = true; await p.evaluate(() => closeLayer()); await sleep(250) }
  return r;
}
async function irPara(p, v) { if (v === 'saved' || v === 'play') await p.evaluate(x => go(x), v); else await clk(p, '#t-' + v); await sleep(250) }
async function fecha(p) { if (await p.$('#layer .sheet, #layer2 .sheet')) { await p.evaluate(() => closeLayer()); await sleep(200) } }

(async () => {
  U.feedFresco('site');
  const srv = U.servir('site', 8768); await sleep(800);
  const H = await require('./harness').criar(); { const _pg = H.pagina; H.pagina = async (...a) => { const p = await _pg(...a); await p.context().addInitScript(() => { try { localStorage.setItem('prumo-pf-aba', 'conta') } catch (e) { } }); return p } }
  const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');

  // ---------------- contas
  ok(await criarViaUI(A, { nome: 'Pedro', email: 'a@x.com', cod: '' }), 'A cria conta como fundador (sem convite)');
  ok(A._bv, 'A vê a janela de boas-vindas');
  const uidA = await ev(A, () => S.uid);
  await irPara(A, 'me');
  await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]');
  ok(await esperar(A, () => /\?convite=[A-Z2-9]{8}$/.test(document.querySelector('#cvurl')?.value || '')), 'A gera link de convite');
  await foto2(A, 'convite');
  const linkB = await ev(A, () => document.querySelector('#cvurl').value);
  await fecha(A);
  ok(await criarViaUI(B, { url: linkB, nome: 'Ana', email: 'b@x.com' }), 'B cria conta pelo link de convite (código preenchido)');
  const uidB = await ev(B, () => S.uid);
  ok(await esperar(B, u => S.amigos.has(u), uidA), 'B já é amiga de A');
  ok(await esperar(A, u => S.amigos.has(u), uidB), 'A vê B como amiga (tempo real)');
  const codC = await ev(B, () => S.db.rpc('criar_convite'));
  ok(await criarViaUI(C, { url: BASE + '?convite=' + codC, nome: 'Caio', email: 'c@x.com' }), 'C cria conta com convite de B');
  const uidC = await ev(C, () => S.uid);
  ok(await ev(C, ([a, b]) => S.amigos.has(b) && !S.amigos.has(a), [uidA, uidB]), 'C é amigo de B e não de A');

  // ---------------- "Falta só o convite"
  const uidD = await H.criarConta('d@x.com', '123456');
  const D = U.erros(await H.pagina(b, { sessao: { user: { id: uidD, email: 'd@x.com' } } }), 'D');
  await D.goto(BASE);
  ok(await esperar(D, () => /Falta só o convite/.test(document.querySelector('.sheet')?.textContent || '')), 'login sem membro abre "Falta só o convite"');
  await D.fill('#fcod', 'ZZZZ9999'); await D.fill('#fnome', 'Dani'); await clk(D, '#fform [type=submit]');
  ok(await esperar(D, () => /Convite inválido ou já usado/.test(document.querySelector('#ferro')?.textContent || '')), 'convite errado: mensagem em português');
  await foto2(D, 'falta-convite');
  await clk(D, '[data-sair]');
  ok(await esperar(D, () => !S.uid && /Você está só lendo/.test(document.querySelector('#avisoconta')?.textContent || '')), 'D sai: volta o aviso de leitura');
  await clk(D, '#avisoconta [data-entrar]'); await D.fill('#lemail', 'd@x.com'); await D.fill('#lsenha', 'errada'); await clk(D, '#lform [type=submit]');
  ok(await esperar(D, () => /E-mail ou senha errados/.test(document.querySelector('#lerro')?.textContent || '')), 'senha errada: mensagem em português');
  await D.fill('#lsenha', '123456'); await clk(D, '#lform [type=submit]');
  ok(await esperar(D, () => S.uid && !S.membro && /Falta só o convite/.test(document.querySelector('.sheet')?.textContent || '')), 'D entra de novo e cai em "Falta só o convite"');
  const codD = await ev(A, () => S.db.rpc('criar_convite'));
  await D.fill('#fcod', codD.toLowerCase()); await D.fill('#fnome', 'Dani'); await clk(D, '#fform [type=submit]');
  ok(await esperar(D, () => S.membro && S.amigosOk && S.amigos.size === 1), 'D usa convite de A e vira membro, amigo de A');
  ok(await esperar(A, () => S.amigos.size === 2), 'A agora tem 2 amigos');

  // ---------------- B sai e entra
  await irPara(B, 'me'); await clk(B, '[data-sair]');
  ok(await esperar(B, () => !S.uid && !!document.querySelector('#avisoconta')), 'B sai');
  ok(await ev(B, () => /Você está só lendo/.test(document.querySelector('#v-me').textContent)), 'Perfil de B mostra "só lendo" depois de sair');
  await clk(B, '#avisoconta [data-entrar]'); await B.fill('#lemail', 'b@x.com'); await B.fill('#lsenha', '123456'); await clk(B, '#lform [type=submit]');
  ok(await esperar(B, u => S.membro && S.amigos.has(u), uidA), 'B entra de novo e recupera amigos');

  // ---------------- A gosta, vota, comenta e lê P1
  for (const p of [A, B, C, D]) { await irPara(p, 'feed'); await ev(p, pid => garantirPost(pid), P1) }
  await clk(A, `#p-${P1} [data-a="like"]`);
  await clk(A, `#p-${P1} [data-voto="0"]`);
  await clk(A, `#p-${P1} .addc`); await A.fill('#ctext', 'Acho que passa hoje.'); await clk(A, '#cform .sendc'); await fecha(A);
  await ev(A, pid => marcarLida(pid), P1);
  ok(await esperar(B, pid => /^[^l]*gostou · comentou/.test(document.querySelector(`#p-${pid} [data-otr]`)?.textContent || ''), P1), 'B vê o chip "gostou · comentou" de A (sem "leu")');
  ok(await esperar(B, pid => /Pedro gostou/.test(document.querySelector(`#p-${pid} [data-likes]`)?.textContent || ''), P1), 'B vê "Pedro gostou"');
  ok(await esperar(B, pid => /Pedro já votou\. Vote para ver\./.test(document.querySelector(`#p-${pid} [data-poll]`)?.textContent || ''), P1), 'B vê dica da enquete "Pedro já votou"');
  ok(await esperar(B, pid => /Acho que passa hoje/.test(document.querySelector(`#p-${pid} [data-cmts]`)?.textContent || ''), P1), 'B vê o comentário de A');
  await sleep(600);
  ok(await ev(C, ([pid, a]) => !socialOf(pid).likes.length && !socialOf(pid).cm.length && !Object.keys(votosDe(pid)).length && !leram(pid).length && !(a in S.raw.curtidas) && !(a in S.leituras) && !document.querySelector(`#p-${pid} [data-otr]`).textContent && !document.querySelector(`#p-${pid} [data-likes]`).textContent, [P1, uidA]), 'C NÃO vê nada de A (nem no banco nem na tela)');
  ok(await ev(C, a => !S._cmtDocs.some(([u]) => u === a), uidA), 'C não recebe o documento de comentários de A');
  await clk(B, `#p-${P1} [data-voto="1"]`);
  ok(await esperar(B, pid => { const t = document.querySelector(`#p-${pid} [data-poll]`).textContent; return /Pedro/.test(t) && /você/.test(t) }, P1), 'B votou e vê o nome de A na opção dele');
  await foto2(B, 'enquete-b');
  await clk(B, `#p-${P1} [data-like-none]`).catch(() => { });
  await clk(B, `#p-${P1} [data-a="like"]`); await clk(D, `#p-${P1} [data-a="like"]`);
  await ev(D, pid => { marcarLida(pid); clearTimeout(leituraTimer); return enviarLeituras() }, P1);
  // mudança de conteúdo num documento que já existe (2ª curtida, descurtir)
  await ev(A, pid => garantirPost(pid), P2); await ev(B, pid => garantirPost(pid), P2);
  await clk(A, `#p-${P2} [data-a="like"]`);
  ok(await esperar(B, pid => /Pedro gostou/.test(document.querySelector(`#p-${pid} [data-likes]`)?.textContent || ''), P2), 'B vê a 2ª curtida de A (mesmo documento, outro item)');
  await clk(A, `#p-${P2} [data-a="like"]`);
  ok(await esperar(B, pid => !document.querySelector(`#p-${pid} [data-likes]`).textContent, P2), 'A descurte: some para B');
  ok(await esperar(A, pid => /Você e mais 2 gostaram/.test(document.querySelector(`#p-${pid} [data-likes]`)?.textContent || ''), P1), 'A vê "Você e mais 2 gostaram"');
  ok(await esperar(A, pid => /2 amigos/.test(document.querySelector(`#p-${pid} [data-otr]`)?.textContent || '') && document.querySelectorAll(`#p-${pid} [data-otr] .avs .av`).length === 2, P1), 'A vê chip com 2 avatares e "2 amigos"');
  ok(await esperar(A, pid => /Dani ainda não votou/.test(document.querySelector(`#p-${pid} [data-poll]`)?.textContent || ''), P1), 'A vê "Dani ainda não votou" ');
  await ev(A, pid => document.getElementById('p-' + pid).scrollIntoView({ block: 'start' }), P1); await A.evaluate(() => window.scrollBy(0, -120));
  await foto2(A, 'post-chip-amigos');
  await ev(A, pid => document.querySelector(`#p-${pid} [data-poll]`).scrollIntoView({ block: 'center' }), P1);
  await foto2(A, 'enquete-a');
  await clk(A, `#p-${P1} [data-otr] .otr`);
  ok(await esperar(A, () => /Amigos nesta notícia/.test(document.querySelector('.sheet')?.textContent || '') && document.querySelectorAll('.sheet .clist li').length === 2), 'tocar no chip abre "Amigos nesta notícia"');
  await foto2(A, 'amigos-na-noticia'); await fecha(A);
  await clk(A, `#p-${P1} [data-likes]`);
  ok(await esperar(A, () => document.querySelectorAll('.sheet .clist li').length === 3), '"Quem gostou" lista você + 2 amigos'); await fecha(A);
  ok(await ev(A, p => !document.querySelector(`#p-${p} [data-cutucar]`), P1), 'sem botão Cutucar');
  // filtros de amigos
  await clk(A, '#b-filtro');
  ok(await esperar(A, () => !/Lidas por amigos/.test(document.querySelector('.sheet')?.textContent || '') && /Amigos gostaram/.test(document.querySelector('.sheet')?.textContent || '')), 'filtro "Amigos gostaram" (sem "Lidas por amigos")');
  await clk(A, '.sheet [data-filtro="_gostou"]');
  ok(await esperar(A, pid => document.querySelectorAll('#posts .post').length === 1 && !!document.getElementById('p-' + pid), P1), 'filtro "Amigos gostaram" mostra só P1');
  await clk(A, '[data-filtro="tudo"]');
  await clk(C, '#b-filtro');
  ok(await esperar(C, () => /Amigos gostaram/.test(document.querySelector('.sheet')?.textContent || '')), 'C (tem a amiga B) vê os filtros de amigos'); await fecha(C);
  await clk(C, '#b-filtro'); await clk(C, '.sheet [data-filtro="_gostou"]');
  ok(await esperar(C, pid => !!document.getElementById('p-' + pid) && document.querySelectorAll('#posts .post').length === 1, P1), 'C: "Amigos gostaram" mostra P1 (B gostou)');
  ok(await ev(C, pid => { const t = document.querySelector(`#p-${pid} [data-otr]`).textContent; return /gostou/.test(t) && !/comentou/.test(t) && /Ana gostou/.test(document.querySelector(`#p-${pid} [data-likes]`).textContent) }, P1), 'C vê só a atividade de B em P1 (sem o comentário/leitura de A)');
  await clk(C, '[data-filtro="tudo"]');

  // ---------------- mensagens A <-> B
  await irPara(A, 'msgs');
  ok(await esperar(A, () => /Nenhuma conversa ainda/.test(document.querySelector('#v-msgs').textContent)), 'A (2 amigos, sem conversas) vê "Nenhuma conversa ainda"');
  await clk(A, '#v-msgs [data-novaconv]');
  ok(await esperar(A, () => document.querySelectorAll('.sheet [data-conversa]').length === 2), '"Nova conversa" lista os 2 amigos');
  await clk(A, `.sheet [data-conversa="${uidB}"]`);
  await A.fill('#mtext', 'Oi Ana, viu a PEC?'); await clk(A, '#mform .send');
  ok(await esperar(B, () => S.msgsIn.some(m => m.texto === 'Oi Ana, viu a PEC?') && !document.querySelector('#badge').hidden), 'B recebe a mensagem e o contador aparece');
  await irPara(B, 'msgs');
  ok(await esperar(B, () => document.querySelectorAll('#v-msgs .dm-lista li').length === 1 && !!document.querySelector('#v-msgs .dm-row.un')), 'B (2 amigos) vê a lista com a conversa não lida');
  await clk(B, `#v-msgs [data-thread="${uidA}"]`);
  ok(await esperar(B, () => /Oi Ana, viu a PEC/.test(document.querySelector('#v-msgs .thread')?.textContent || '')), 'B abre a conversa com A');
  await B.fill('#mtext', 'Vi sim!'); await clk(B, '#mform .send');
  ok(await esperar(A, () => /Vi sim!/.test(document.querySelector('#v-msgs .thread')?.textContent || '')), 'A vê a resposta em tempo real');
  await foto2(A, 'conversa');
  // enviar notícia
  await irPara(A, 'feed'); await ev(A, pid => garantirPost(pid), P1); await clk(A, `#p-${P1} [data-a="send"]`);
  ok(await esperar(A, () => document.querySelectorAll('.sheet [data-pick]').length === 2), 'Enviar: escolher entre os amigos');
  await clk(A, `.sheet [data-pick="${uidB}"]`); await clk(A, '#sbtn');
  ok(await esperar(B, pid => S.msgsIn.some(m => m.pid === pid && !m.tipo), P1), 'B recebe a notícia enviada');

  // ---------------- tempo real com as 3 páginas abertas: janela de comentários aberta em B e D recebe o de A
  for (const p of [B, D]) { await irPara(p, 'feed'); await ev(p, pid => garantirPost(pid), P1); await clk(p, `#p-${P1} [data-a="cmt"]`) }
  await ev(A, pid => garantirPost(pid), P1); await irPara(A, 'feed'); await ev(A, pid => garantirPost(pid), P1);
  const t0 = Date.now(); await clk(A, `#p-${P1} .addc`); await A.fill('#ctext', 'Comentário ao vivo'); await clk(A, '#cform .sendc'); await fecha(A);
  const vB = await esperar(B, () => /Comentário ao vivo/.test(document.querySelector('#cbox')?.textContent || ''));
  const vD = await esperar(D, () => /Comentário ao vivo/.test(document.querySelector('#cbox')?.textContent || ''));
  ok(vB && vD, 'comentário de A aparece ao vivo nas janelas abertas de B e D (' + (Date.now() - t0) + ' ms)');
  ok(await ev(C, () => !/Comentário ao vivo/.test(document.body.textContent)), 'e não aparece para C');
  // comentar pelo story vira comentário da notícia no Feed
  await ev(A, pid => { closeLayer(); const p = pautaById(pid); ST = { sec: secOf(p), ordem: secsStory().map(s => s.id) }; igSet(secOf(p), 0); ST.i = stPs().findIndex(x => x.id === pid); drawStory() }, P1); await sleep(400);
  await A.fill('#layer .sg-rp input', 'Respondi pelo story'); await A.evaluate(() => document.querySelector('#layer .sg-rp .sg-rp-b').click()); await sleep(300);
  ok(await esperar(B, pid => /Respondi pelo story/.test(document.querySelector(`#p-${pid} [data-cmts]`)?.textContent || '') || (S.cmts[pid] || []).some(c => /Respondi pelo story/.test(c.texto)), P1), 'resposta no story vira comentário da notícia, visto por B no Feed');
  await ev(A, () => closeLayer()); await sleep(200);
  await fecha(B); await fecha(D);
  // ---------------- B e C: desfaz, bloqueio, pedido e aceite
  await irPara(B, 'msgs'); await sleep(200);
  if (await B.$('[data-back]')) await clk(B, '[data-back]');
  await clk(B, '#v-msgs [data-novaconv]'); await clk(B, `.sheet [data-conversa="${uidC}"]`);
  await clk(B, '.icbtn[data-thmenu]'); await clk(B, '[data-desfazer]');
  ok(await esperar(B, () => /Desfazer amizade\?/.test(document.querySelector('.sheet')?.textContent || '')), 'confirmação de desfazer amizade');
  await clk(B, '[data-desfazerok]');
  ok(await esperar(B, c => !S.amigos.has(c), uidC) && await esperar(C, b => !S.amigos.has(b), uidB), 'amizade B-C desfeita dos dois lados');
  const env = await ev(B, async c => { try { await S.db.collection('mensagens').add({ de: S.uid, para: c, at: Date.now(), texto: 'x', lida: false }); return 'ENVIOU' } catch (e) { return e.code } }, uidC);
  ok(env === 'permission_denied', 'B NÃO consegue mandar mensagem para C sem amizade', env);
  await irPara(B, 'me'); await clk(B, '[data-addamigos]');
  ok(await esperar(B, c => !!document.querySelector(`.sheet [data-pedir="${c}"]`), uidC), 'Adicionar amigos lista C com "Pedir amizade"');
  await clk(B, `.sheet [data-pedir="${uidC}"]`);
  ok(await esperar(B, c => !!document.querySelector(`#pbox [data-cancelar="${c}"]`), uidC), 'botão vira "Cancelar pedido"');
  await foto2(B, 'adicionar-amigos'); await fecha(B);
  ok(await esperar(C, () => S.pedidosIn.length === 1 && !document.querySelector('#mbadge').hidden), 'C recebe o pedido (ponto no Perfil)');
  await irPara(C, 'me');
  ok(await esperar(C, b => !!document.querySelector(`#v-me [data-aceitar="${b}"]`), uidB), 'Perfil de C mostra o pedido com Aceitar/Recusar');
  await foto2(C, 'perfil-pedido');
  await clk(C, `#v-me [data-aceitar="${uidB}"]`);
  { const t0 = Date.now(); const okk = await esperar(B, c => S.amigos.has(c), uidC, 15000); ok(okk, 'C aceita: B vê C como amigo', { ms: Date.now() - t0, amigosB: await ev(B, () => [...S.amigos]), getB: await ev(B, async () => (await S.db.collection('amizades').get()).docs.map(d => d.data().status + ':' + (d.data().de === S.uid ? 'eu->' : '->eu'))), dbIgual: await ev(B, () => typeof DBG !== 'undefined'), pedC: await ev(C, () => [S.pedidosIn, [...S.amigos]]), log: H.log.slice(-8) }); console.log('tempo até B ver C:', Date.now() - t0) }
  const env2 = await ev(B, async c => { try { await S.db.collection('mensagens').add({ de: S.uid, para: c, at: Date.now(), texto: 'De novo amigos', lida: false }); return 'ENVIOU' } catch (e) { return e.code } }, uidC);
  ok(env2 === 'ENVIOU', 'depois da amizade, B manda para C', env2);
  ok(await esperar(C, () => S.msgsIn.some(m => m.texto === 'De novo amigos')), 'C recebe');
  await irPara(A, 'me');
  ok(await esperar(A, () => /2\s*amigos/.test(document.querySelector('#v-me .pf-num')?.textContent || '')), 'Perfil de A: "2 amigos"');
  await foto2(A, 'perfil-amigos');
  ok(await ev(A, () => /Conta/.test(document.querySelector('#v-me').textContent) && /a@x\.com/.test(document.querySelector('#v-me').textContent)), 'card Conta com e-mail');

  // ---------------- sem lista a dois
  await irPara(A, 'feed'); await ev(A, pid => garantirPost(pid), P2);
  await clk(A, `#p-${P2} [data-a="menu"]`);
  ok(await esperar(A, () => /Guardar com uma nota/.test(document.querySelector('.sheet')?.textContent || '') && !/lista com/.test(document.querySelector('.sheet')?.textContent || '')), 'menu sem "Pôr numa lista com…"');
  await fecha(A);
  await irPara(B, 'saved');
  ok(await ev(B, () => !document.querySelector('[data-abag="nossa"]')), 'Guardadas sem a aba "Com amigos"');


  // ---------------- "Junto?" e quiz
  for (const p of [A, B]) { await irPara(p, 'feed'); await ev(p, () => { PREF.agendaFechada = false; renderChgBox() }) }
  ok(await ev(A, () => !document.querySelector('[data-juntos]')), 'agenda sem "Junto?"');
  // quiz pela tela
  await irPara(A, 'play'); await clk(A, '[data-quiz]');
  for (let i = 0; i < 3; i++) { await esperar(A, () => !!document.querySelector('[data-qr]:not([disabled])')); await clk(A, '[data-qr="0"]'); await clk(A, '#qnext') }
  ok(await esperar(A, () => /Você acertou/.test(document.querySelector('.sheet')?.textContent || '')), 'A termina o quiz');
  await fecha(A);
  await sleep(800);
  ok(await ev(B, () => !/Pedro/.test(placarQuiz())), 'placar do quiz de B não mostra A (cada um vê o seu)');
  ok(await ev(A, () => /Você/.test(placarQuiz())), 'A vê o próprio resultado');
  ok(await ev(C, () => !/Pedro/.test(placarQuiz())), 'C não vê o quiz de A');
  await irPara(B, 'play'); await foto2(B, 'interagir-placar');

  // ---------------- erros apontados (status vem do arquivo)
  await irPara(A, 'feed'); await ev(A, pid => garantirPost(pid), P1); await clk(A, `#p-${P1} [data-a="menu"]`); await clk(A, '.sheet [data-erro]');
  await A.fill('#etext', 'O placar foi outro'); await clk(A, '#esend');
  ok(await esperar(A, () => S.erros.length === 1), 'A aponta um erro');
  const idErro = await ev(A, () => S.erros[0].id);
  require('fs').writeFileSync(__dirname + '/site/erros-respostas.json', JSON.stringify({ [idErro]: { status: 'corrigido', resposta: 'Ajustado na rodada das 9h.' } }));
  await ev(A, () => { ERRT = 0 }); await irPara(A, 'me');
  ok(await esperar(A, () => /Corrigido · Ajustado na rodada/.test(document.querySelector('#v-me').textContent)), 'status do erro vem de erros-respostas.json');
  await clk(A, '#v-me [data-rodadas]');
  ok(await esperar(A, () => /Rodada completa · publicada/.test(document.querySelector('.sheet')?.textContent || '')), 'Atualizações lê rodadas.json');
  await fecha(A);

  // ---------------- mudar nome
  await clk(A, '#v-me [data-a="nome"]'); await A.fill('#ntext', 'Pedro B.'); await clk(A, '#nform .send');
  ok(await esperar(B, a => S.membros[a]?.nome === 'Pedro B.', uidA), 'nome novo de A chega para B');

  // ---------------- nome repetido
  await irPara(D, 'me'); await clk(D, '#v-me [data-a="nome"]'); await D.fill('#ntext', '  pedro b. '); await clk(D, '#nform .send');
  ok(await esperar(D, () => /Já tem alguém com esse nome no Prumo\. Use outro\./.test(document.querySelector('.toast')?.textContent || '')), 'mudar nome para um já usado: mensagem amigável');
  ok(await esperar(D, () => S.membros[S.uid]?.nome === 'Dani'), 'e o nome de D volta para Dani');
  const E = U.erros(await H.pagina(b), 'E'); const codE = await ev(A, () => S.db.rpc('criar_convite'));
  await criarViaUI(E, { url: BASE + '?convite=' + codE, nome: 'ANA', email: 'e@x.com' });
  ok(await esperar(E, () => /Já tem alguém com esse nome no Prumo/.test(document.querySelector('#ferro')?.textContent || '')), 'criar conta com nome já usado: mensagem amigável e chance de trocar');
  await E.fill('#fnome', 'Eva'); await clk(E, '#fform [type=submit]');
  ok(await esperar(E, () => S.membro), 'com outro nome, entra');

  // ---------------- excluir conta de C
  await irPara(C, 'me'); await clk(C, '[data-excluir]');
  ok(await esperar(C, () => /Não tem volta/.test(document.querySelector('.sheet')?.textContent || '')), 'janela de excluir conta');
  await foto2(C, 'excluir-conta');
  await Promise.all([C.waitForNavigation({ timeout: 8000 }).catch(() => { }), clk(C, '[data-excluirok]')]);
  ok(await esperar(C, () => !S.uid && /Sua conta foi excluída/.test(document.querySelector('.toast')?.textContent || '')), 'C excluiu a conta e voltou como leitor');
  const sobra = await H.sql(`select (select count(*) from public.docs where owner=$1 or path like '%'||$1||'%')::int d,(select count(*) from public.mensagens where de=$1 or para=$1)::int m,(select count(*) from public.membros where uid=$1)::int mb,(select count(*) from public.amizades where de=$1 or para=$1)::int am,(select count(*) from auth.users where id=$1)::int u`, [uidC]);
  ok(sobra[0].d === 0 && sobra[0].am === 0 && sobra[0].u === 0, 'banco sem os dados de C (login, documentos, amizades)', sobra[0]);
  ok(await esperar(B, c => !S.amigos.has(c) && (!S.membros[c] || S.membros[c].nome === 'Conta excluída'), uidC, 8000), 'B: C vira "Conta excluída" e sai dos amigos');

  // ---------------- extras: 1 amigo, notícia antiga na lista, convite com sessão de membro
  await irPara(D, 'msgs');
  ok(await esperar(D, a => document.querySelector('#v-msgs').dataset.thr === '' && !!document.querySelector(`#v-msgs [data-thread="${a}"]`), uidA), 'D (1 amigo) abre a caixa de entrada com A');
  await A.goto(BASE + '?convite=QQQQ2222');
  ok(await esperar(A, () => S.membro && S.amigosOk) && await ev(A, () => !document.querySelector('#layer .sheet') && !location.search), 'membro logado abrindo link de convite: ignora');

  // ---------------- fim
  for (const [n, p] of [['A', A], ['B', B], ['C', C], ['D', D], ['E', E]]) ok(p._erros.length === 0, 'sem erros de JS em ' + n, p._erros);
  const errosBanco = H.log.filter(x => x.err).map(x => x.op + ' ' + x.err);
  { const i = H.log.findIndex(x => /permission denied for table/.test(x.err || '')); if (i >= 0) console.log('ANTES DO 1º anon:', JSON.stringify(H.log.slice(Math.max(0, i - 12), i + 2))) }
  console.log('erros do banco (esperados: os testes de bloqueio):', errosBanco);
  const rr = U.resumo(); console.log(`\nRESUMO t_social: ${rr.OKS} ok, ${rr.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(rr.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
