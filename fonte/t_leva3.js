// Leva 3: amigos de amigos + busca exata, cota de convites, bloquear, denunciar, painel do admin, suspensão, conta excluída.
const U = require('./t_util');
const { ok, sleep, esperar } = U;
const fs = require('fs');
const BASE = 'http://localhost:8773/index.html';
const P1 = 'pec-6x1-senado';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const DIR = __dirname + '/review2/leva3'; fs.mkdirSync(DIR, { recursive: true });
const foto = async (p, n) => { await sleep(350); await p.screenshot({ path: `${DIR}/${n}.png` }) };
async function fecha(p) { if (await p.$('#layer .sheet, #layer2 .sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }

(async () => {
  U.feedFresco('site');
  const srv = U.servir('site', 8773); await sleep(800);
  const H = await require('./harness').criar(); { const _pg = H.pagina; H.pagina = async (...a) => { const p = await _pg(...a); await p.context().addInitScript(() => { try { localStorage.setItem('prumo-pf-aba', 'conta') } catch (e) { } }); return p } }
  const nomes = ['Pedro', 'Ana', 'Caio', 'Dani', 'Edu Lima'];
  const uids = [];
  for (let i = 0; i < nomes.length; i++) uids.push(await H.criarConta(`u${i}@x.com`, '123456'));
  for (let i = 0; i < nomes.length; i++) await H.sql(`insert into public.membros(uid,nome,convidado_por,papel) values ($1,$2,$3,$4)`, [uids[i], nomes[i], i ? uids[0] : null, i ? 'membro' : 'admin']);
  const amg = async (a, b) => H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [uids[a], uids[b]]);
  await amg(0, 1); await amg(0, 2); await amg(1, 3);
  // Edu e Dani foram "convidados" por Pedro na simulação; para Caio, Dani não é amigo de amigo (Ana é)
  const b = await U.navegador();
  const pg = async i => { const p = U.erros(await H.pagina(b, { sessao: { user: { id: uids[i], email: `u${i}@x.com` } } }), nomes[i]); await p.goto(BASE); return p };
  const P = await pg(0), C = await pg(2), A = await pg(1);
  for (const p of [P, C, A]) ok(await esperar(p, () => S.membro && S.amigosOk, null, 10000), 'abre logado');

  // ---------- quem Caio enxerga
  ok(await esperar(C, ([a, d, e]) => !!S.membros[a] && !S.membros[d] && !S.membros[e], [uids[1], uids[3], uids[4]]), 'Caio vê Ana (amiga de amigo), não vê Dani nem Edu');
  await clk(C, '#t-me'); await sleep(200); await clk(C, '[data-addamigos]');
  ok(await esperar(C, a => !!document.querySelector(`#pbox [data-pedir="${a}"]`) && /1 amigo em comum/.test(document.querySelector('#pbox').textContent), uids[1]), 'Adicionar amigos: Ana com "1 amigo em comum"');
  await C.fill('#pq', 'Edu'); await clk(C, '#pbusca');
  ok(await esperar(C, () => /Ninguém no Prumo com o nome exato/.test(document.querySelector('#pbox').textContent)), 'nome incompleto: avisa que não achou');
  await C.fill('#pq', 'edu lima'); await clk(C, '#pbusca');
  ok(await esperar(C, e => !!document.querySelector(`#pbox [data-pedir="${e}"]`), uids[4]), 'nome completo acha o Edu');
  await foto(C, '01-adicionar-amigos');
  await clk(C, `#pbox [data-pedir="${uids[4]}"]`);
  ok(await esperar(C, e => S.pedidosOut.includes(e), uids[4]), 'pedido para Edu enviado');
  await fecha(C);

  // ---------- convites: cota de 3
  await sleep(600); await clk(C, '[data-convidar]'); await sleep(500);
  ok(await esperar(C, () => /ainda pode convidar 3 pessoas/.test(document.querySelector('#cvcota')?.textContent || '')), 'Caio pode convidar 3 pessoas');
  for (let i = 0; i < 3; i++) { await clk(C, '[data-gerarconvite]'); await esperar(C, () => !!document.querySelector('#cvurl')); await sleep(300); if (i < 2) await ev(C, () => { S._cvlink = null; document.querySelector('#cvbox').innerHTML = '<button type="button" class="btn" data-gerarconvite>Gerar convite</button>' }) }
  ok(await esperar(C, () => /convites acabaram/.test(document.querySelector('#cvcota')?.textContent || '') && document.querySelectorAll('#cvmeus [data-revogar]').length === 3), 'depois de 3: "Seus convites acabaram" e 3 convites em aberto');
  await foto(C, '02-convites');
  await clk(C, '#cvmeus [data-revogar]');
  ok(await esperar(C, () => document.querySelectorAll('#cvmeus [data-revogar]').length === 2 && /ainda pode convidar 1 pessoa/.test(document.querySelector('#cvcota').textContent)), 'cancelar um convite devolve 1');
  await fecha(C);

  // ---------- denunciar comentário (Ana comenta, Caio... não é amigo de Ana; Pedro é)
  await ev(A, p => garantirPost(p), P1);
  await ev(A, p => openComments(p), P1); await A.fill('#ctext', 'Comentário grosseiro'); await clk(A, '#cform .sendc'); await fecha(A);
  await clk(P, '#t-feed'); await sleep(200); await ev(P, p => garantirPost(p), P1);
  ok(await esperar(P, p => socialOf(p).cm.some(c => c.texto === 'Comentário grosseiro'), P1), 'Pedro vê o comentário da Ana');
  await ev(P, p => openComments(p), P1);
  ok(await esperar(P, () => !!document.querySelector('.sheet [data-denc]')), 'comentário de outra pessoa tem "Denunciar"');
  await clk(P, '.sheet [data-denc]'); await P.fill('#dmot', 'ofensivo'); await foto(P, '03-denunciar');
  await clk(P, '#dok');
  ok(await esperar(P, () => /Denúncia enviada/.test(document.querySelector('.toast')?.textContent || '')), 'denúncia enviada');

  // ---------- painel do admin
  await clk(P, '#t-me'); await sleep(300);
  ok(await ev(P, () => !!document.querySelector('[data-admin]')), 'Pedro (admin) vê "Administração" no Perfil');
  ok(await ev(C, () => { renderMe(); return !document.querySelector('[data-admin]') }), 'Caio não vê "Administração"');
  await clk(P, '[data-admin]');
  ok(await esperar(P, () => document.querySelectorAll('#admbox .adml li').length === 5 && /u2@x\.com/.test(document.querySelector('#admbox').textContent)), 'aba Pessoas: 5 pessoas com e-mail');
  await foto(P, '04-admin-pessoas');
  await clk(P, `[data-admcota="${uids[2]}"]`);
  ok(await esperar(P, () => /convites 0\/4/.test([...document.querySelectorAll('#admbox li')].find(l => /Caio/.test(l.textContent))?.textContent || '')), '+1 convite para Caio (0 usados/4)');
  await clk(P, '[data-admaba="convites"]');
  ok(await esperar(P, () => /Em aberto \(2\)/.test(document.querySelector('#admbox').textContent)), 'aba Convites: 2 em aberto');
  await clk(P, '[data-admaba="denuncias"]');
  ok(await esperar(P, () => /Comentário grosseiro/.test(document.querySelector('#admbox').textContent)), 'aba Denúncias mostra o texto denunciado');
  await foto(P, '05-admin-denuncias');
  await clk(P, '[data-admapag]'); await clk(P, '[data-admapag]');
  ok(await esperar(A, p => !socialOf(p).cm.some(c => c.texto === 'Comentário grosseiro'), P1), 'admin apaga: some para a Ana também');
  ok(await esperar(P, () => /resolvida/.test(document.querySelector('#admbox').textContent)), 'denúncia marcada como resolvida');
  await fecha(P);

  // ---------- bloquear: Caio bloqueia Pedro? não; Ana bloqueia Pedro pela conversa
  await ev(A, a => abrirConversa(a), uids[0]); await sleep(300);
  await clk(A, '.icbtn[data-thmenu]');
  ok(await esperar(A, () => /Bloquear Pedro/.test(document.querySelector('.sheet')?.textContent || '') && /Denunciar Pedro/.test(document.querySelector('.sheet').textContent)), 'menu da conversa: Bloquear e Denunciar');
  await clk(A, '[data-bloquear]'); await clk(A, '[data-bloquearok]');
  await ev(P, () => S.db.atualizar());
  ok(await esperar(A, p => !S.amigos.has(p), uids[0]) && await esperar(P, a => !S.amigos.has(a), uids[1], 8000), 'bloqueio desfaz a amizade dos dois lados');
  const r = await ev(P, async a => { try { await S.db.rpc('pedir_amizade', { p_uid: a }); return 'PEDIU' } catch (e) { return 'negado' } }, uids[1]);
  ok(r === 'negado', 'Pedro não consegue pedir amizade a Ana');
  await clk(A, '#t-me'); await sleep(200); await clk(A, '[data-bloqueados]');
  ok(await esperar(A, p => !!document.querySelector(`[data-desbloq="${p}"]`) && /Pedro/.test(document.querySelector('.sheet').textContent), uids[0]), 'Pessoas bloqueadas lista Pedro');
  await clk(A, '[data-desbloq]');
  ok(await esperar(A, () => /Ninguém bloqueado/.test(document.querySelector('.sheet')?.textContent || '')), 'desbloquear');
  await fecha(A);

  // ---------- suspensão
  await ev(P, c => S.db.rpc('admin_suspender', { p_uid: c, p_suspender: true }), uids[2]);
  await C.reload();
  ok(await esperar(C, () => /Conta suspensa/.test(document.querySelector('.sheet')?.textContent || ''), null, 10000), 'Caio suspenso vê "Conta suspensa"');
  await foto(C, '06-suspensa');
  await ev(P, c => S.db.rpc('admin_suspender', { p_uid: c, p_suspender: false }), uids[2]);

  // ---------- conta excluída: conversa fica com o outro lado
  const D = await pg(3);
  await esperar(D, () => S.membro && S.amigosOk, null, 10000);
  await ev(D, a => S.db.collection('mensagens').add({ de: S.uid, para: a, at: Date.now(), texto: 'Tchau, Ana', lida: false }), uids[1]);
  await esperar(A, () => S.msgsIn.some(m => m.texto === 'Tchau, Ana'));
  await ev(D, () => excluirConta());
  await sleep(1500);
  await A.reload(); await esperar(A, () => S.membro && S.amigosOk, null, 10000);
  await clk(A, '#t-msgs'); await sleep(400);
  ok(await esperar(A, d => /Conta excluída/.test(document.querySelector('#v-msgs').textContent), uids[3]), 'na lista de conversas aparece "Conta excluída"');
  await ev(A, d => { THREAD = d; renderMsgs() }, uids[3]);
  ok(await esperar(A, () => /Tchau, Ana/.test(document.querySelector('#v-msgs').textContent) && /Esta conta foi excluída/.test(document.querySelector('#v-msgs').textContent)), 'conversa antiga continua, só para leitura');
  await foto(A, '07-conta-excluida');

  for (const p of [P, C, A]) ok(!p._erros.length, 'sem erros de JS: ' + p._erros.join(' | '));
  const res = U.resumo(); console.log(`\nRESUMO t_leva3: ${res.OKS} ok, ${res.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(res.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
