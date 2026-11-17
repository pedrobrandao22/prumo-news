// Coberturas, fase 1 (17/11, decisão do Pedro): quem segue pode desligar os avisos de uma cobertura (interruptor na página
// da cobertura; some da Atividade e da bolinha, continua no feed; religar é fácil); a página mostra "Acompanha até: <fim>"
// e "Encerrada"; o SQL proposto (sql/proposta-2026-11-17-coberturas.sql) faz o banco não enfileirar o aviso no celular.
// Portas 9030.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const BASE = 'http://localhost:9030/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 9030); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const prop = fs.readFileSync(path.join(__dirname, '..', 'sql', 'proposta-2026-11-17-coberturas.sql'), 'utf8');
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  const uid = await ev(A, () => S.uid);
  await A.evaluate(() => atLedSalva({ _t0: Date.now() - 864e5, _b: 1 }));

  // uma cobertura com fim e atualização recente; outra que o Pedro não segue
  const [pid, outra] = await ev(A, () => { const ps = FEED.pautas.filter(p => p.tipo !== 'pontual' && temaDe(p) && !p.enquete);
    const p = ps[0], q = ps.find(x => norm(temaDe(x)) !== norm(temaDe(p)));
    p.fim = 'Aprovação e promulgação da PEC'; p.status = 'ativa';
    p.atualizacoes = [{ hora: new Date(Date.now() + 1000).toISOString(), texto: 'Relator apresentou novo parecer' }];
    q.fim = 'Final do campeonato'; return [p.id, q.id] });

  // 1. sem seguir: mostra o fim, sem interruptor
  await ev(A, id => abrirPagCob(id), outra); await sleep(400);
  ok(await ev(A, () => /Acompanha até:\s*Final do campeonato/.test(document.querySelector('.sheet .pc .cb183-fim')?.textContent || '')), 'página da cobertura: "Acompanha até: <fim>"');
  ok(await ev(A, () => !document.querySelector('.sheet [data-cb183sw]')), 'sem seguir: não há interruptor de avisos');
  await ev(A, () => closeLayer()); await sleep(300);

  // 2. segue: a novidade avisa (Atividade e bolinha); na página, o interruptor aparece ligado
  await ev(A, id => cobSegue(temaDe(pautaById(id)), true), pid); await sleep(1200);
  ok(await ev(A, id => atItens().some(x => x.acao === 'cob' && x.pid === id), pid), 'com avisos ligados: a novidade aparece na Atividade');
  ok(await ev(A, () => nt124Contagem().por.coberturas >= 1), 'e conta na bolinha', await ev(A, () => nt124Contagem()));
  await ev(A, id => cobSegue(temaDe(pautaById(id)), false), pid);
  await ev(A, id => abrirPagCob(id), pid); await sleep(400);
  ok(await ev(A, () => !document.querySelector('.sheet [data-cb183sw]')), 'sem seguir: sem interruptor');
  await clk(A, '.sheet [data-cobseg]'); await sleep(500);
  ok(await ev(A, id => seguido(pautaById(id)), pid), 'Seguir cobertura pela página');
  ok(await ev(A, () => document.querySelector('.sheet [data-cb183sw]')?.getAttribute('aria-checked') === 'true'), 'seguindo: "Avisos de novidades" aparece ligado');
  await U.foto(A, 'coberturas-f1-ligado');

  // 3. desliga: some da Atividade e da bolinha, continua seguida e no feed
  await clk(A, '.sheet [data-cb183sw]'); await sleep(400);
  ok(await ev(A, () => document.querySelector('.sheet [data-cb183sw]')?.getAttribute('aria-checked') === 'false'), 'interruptor desligado');
  ok(await ev(A, id => !!(PREF.cobSemAviso || {})[id], pid), 'preferência cobSemAviso gravada');
  ok(await ev(A, id => !atItens().some(x => x.acao === 'cob' && x.pid === id), pid), 'desligada: some da Atividade');
  await ev(A, id => { const p = pautaById(id); p.atualizacoes = p.atualizacoes.concat([{ hora: new Date(Date.now() + 1000).toISOString(), texto: 'Comissão marca votação' }]) }, pid); await sleep(1200);
  ok(await ev(A, () => !(nt124Contagem().por.coberturas)), 'desligada: novidade nova não conta na bolinha', await ev(A, () => nt124Contagem()));
  ok(await ev(A, id => seguido(pautaById(id)) && !silenciado(pautaById(id)), pid), 'desligada: continua seguida e no feed');
  ok(await ev(A, () => /desligados/i.test(document.querySelector('.toast')?.textContent || '')), 'toast avisa que os avisos foram desligados');
  await U.foto(A, 'coberturas-f1-desligado');
  await A.setViewportSize({ width: 375, height: 667 }); await sleep(300); await U.foto(A, 'coberturas-f1-desligado-se'); await A.setViewportSize({ width: 390, height: 844 });
  // Perfil › Coberturas que sigo marca
  await ev(A, () => closeLayer()); await sleep(300); await ev(A, () => mt158AbreSeguidas()); await sleep(300);
  ok(await ev(A, () => /avisos desligados/.test(document.querySelector('.mt158-cl')?.textContent || '')), '"Coberturas que sigo" marca "avisos desligados"');
  await ev(A, () => closeLayer()); await sleep(300);

  // 4. o banco (com o SQL proposto) não enfileirar o aviso no celular de quem desligou
  await esperar(A, () => !MT158_PEND, null, 4000).catch(() => {}); await sleep(1800);
  const doc = (await H.sql(`select data from docs where path=$1`, ['data/users/' + uid + '/prefs']))[0];
  ok(doc && doc.data && doc.data.cobSemAviso && doc.data.cobSemAviso[pid], 'preferência chega às preferências da conta (docs)', doc && doc.data && doc.data.cobSemAviso);
  await H.db.exec(prop); await H.db.exec(prop);   // idempotente
  await H.comoUsuario(uid, () => H.db.query(`select public.push_inscrever($1,$2,$3,$4::jsonb,$5)`, ['https://fcm.googleapis.com/fcm/send/x', 'B' + 'p'.repeat(86), 'y'.repeat(22), JSON.stringify({ coberturas: true, mensagens: true }), 't']));
  const enf = id => H.sql(`select public.push_enfileirar($1,'coberturas',null,$2,'Tema: nova atualização','texto','?nt=cobertura:x') r`, [uid, 'cob:' + id]);
  await enf(pid); await enf(outra);
  let f = await H.sql(`select chave from push_fila where para=$1 and tipo='coberturas' order by id`, [uid]);
  ok(f.length === 1 && f[0].chave === 'cob:' + outra, 'SQL: aviso da cobertura desligada não entra na fila; o das outras entra', f);
  await H.sql(`select public.push_enfileirar($1,'mensagens',null,'conv:x','Bia','oi','?') r`, [uid]);
  ok((await H.sql(`select count(*)::int n from push_fila where para=$1 and tipo='mensagens'`, [uid]))[0].n === 1, 'SQL: os outros tipos de aviso não mudam');
  let e = null; try { await H.comoUsuario(uid, () => H.db.query(`select public.push_cob_desligada($1,$2)`, [uid, pid])) } catch (x) { e = x } ok(!!e, 'push_cob_desligada não é chamável pelo app');

  // 5. religar: o mesmo interruptor
  await ev(A, id => abrirPagCob(id), pid); await sleep(400);
  await clk(A, '.sheet [data-cb183sw]'); await sleep(400);
  ok(await ev(A, id => !(PREF.cobSemAviso || {})[id] && atItens().some(x => x.acao === 'cob' && x.pid === id), pid), 'religar: volta para a Atividade');
  await esperar(A, () => !MT158_PEND, null, 4000).catch(() => {}); await sleep(1800);
  await H.sql(`delete from push_fila`); await enf(pid);
  ok((await H.sql(`select count(*)::int n from push_fila where para=$1`, [uid]))[0].n === 1, 'SQL: religada, o aviso volta a entrar na fila');
  await ev(A, () => closeLayer()); await sleep(300);

  // 6. deixar de seguir e seguir de novo recomeça com avisos ligados
  await ev(A, id => { cb183Liga(id, false); cobSegue(temaDe(pautaById(id)), false); cobSegue(temaDe(pautaById(id)), true) }, pid);
  ok(await ev(A, id => !(PREF.cobSemAviso || {})[id], pid), 'deixar de seguir limpa o "avisos desligados"');

  // 7. encerrada: "Encerrada", sem interruptor
  await ev(A, id => { const p = pautaById(id); p.status = 'encerrada'; p.desfecho = 'PEC promulgada.'; abrirPagCob(id) }, pid); await sleep(400);
  ok(await ev(A, () => /Cobertura encerrada/.test(document.querySelector('.sheet .pc .pc-m')?.textContent || '') && /^Acompanhou até: Aprovação e promulgação da PEC/.test(document.querySelector('.sheet .pc .cb183-fim.enc')?.textContent || '')), 'encerrada: selo "Cobertura encerrada" e "Acompanhou até: <fim>"');
  ok(await ev(A, () => !document.querySelector('.sheet [data-cb183sw]') && /não há mais avisos/.test(document.querySelector('.sheet .cb183-enc')?.textContent || '')), 'encerrada: sem interruptor, diz que não há mais avisos');
  await U.foto(A, 'coberturas-f1-encerrada');
  // sem fim no feed (cobertura antiga): nada de linha vazia
  await ev(A, id => { const p = pautaById(id); p.status = 'ativa'; delete p.fim; closeLayer(); abrirPagCob(id) }, pid); await sleep(400);
  ok(await ev(A, () => !document.querySelector('.sheet .pc .cb183-fim')), 'sem fim: não mostra a linha');

  ok(!A._erros || !A._erros.length, 'sem erros no console', A._erros);
  await b.close();
  const R = U.resumo(); console.log(`\nRESUMO t_coberturas_f1: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
