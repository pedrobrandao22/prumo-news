// Etapa 16: link de matéria; compartilhar; faixa Agora; Feed adiado; glossário na matéria; eventos e painel de uso
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  const P = f.pautas.find(p => p.secao === 'economia') || f.pautas[1];
  f.glossario = Object.assign({}, f.glossario, { 'Copom': 'Comitê do Banco Central que define a Selic.' });
  P.neutro.texto = 'O Copom decidiu manter a taxa. ' + P.neutro.texto;
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  // novidades: 2 assuntos novos recentes + 1 pauta com novidade
  const hh = ms => { const d = new Date(ms - 3 * 3600e3); const p = n => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}h${p(d.getUTCMinutes())}` };
  const pe = f.pautas.find(p => p.secao === 'politica');
  const nov = { gerado: new Date().toISOString(), novos: [
    { assunto: 'STF forma maioria para manter prisão de ex-ministro; veja como votou cada um', secao: 'politica', n_fontes: 4, relevante: true, manchetes: [{ veiculo: 'x', titulo: 't', hora: hh(Date.now() - 20 * 6e4) }] },
    { assunto: 'Chuva forte alaga ruas no centro de Belo Horizonte', secao: 'brasil', n_fontes: 2, relevante: false, manchetes: [{ veiculo: 'x', titulo: 't', hora: hh(Date.now() - 50 * 6e4) }] },
    { assunto: 'Assunto velho de ontem', secao: 'brasil', n_fontes: 5, relevante: true, manchetes: [{ veiculo: 'x', titulo: 't', hora: hh(Date.now() - 9 * 3600e3) }] }],
    em_pautas: { [pe.id]: { n_fontes: 3, manchetes: [{ veiculo: 'x', titulo: 't', hora: hh(Date.now() - 10 * 6e4) }] } } };
  fs.writeFileSync(S0 + 'novidades.json', JSON.stringify(nov));
  const srv = U.servir('site', 8796); await sleep(800);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase-uso.sql' });
  const uid = await H.criarConta('pedro@x.com', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin')`, [uid]);
  const br = await U.navegador(); const D = __dirname + '/etapa16/';
  const BASE = 'http://localhost:8796/';
  // ---------- link da matéria (#m=) abre a matéria; Feed adiado
  let p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email: 'pedro@x.com' } } }), 'a');
  await p.context().addInitScript(() => { localStorage.setItem('prumo-teste-capa', '1'); window.__evTeste = 1 });
  await p.goto(BASE + 'index.html#m=' + P.id);
  ok(await esperar(p, id => MAT_PID === id && !!document.querySelector('#layer .mat'), P.id, 10000), 'link #m= abre direto a matéria');
  ok(await p.evaluate(() => !/#m=/.test(location.href)), 'o endereço fica limpo depois de abrir');
  ok(await p.evaluate(() => !!document.querySelector('#layer .mat .mat-p .gl[data-k="Copom"]')), 'glossário: termo marcado no texto da matéria');
  await p.evaluate(() => document.querySelector('#layer .mat .mat-p .gl').click()); await sleep(400);
  ok(await p.evaluate(() => !!document.querySelector('#layer2 .sheet') && /Banco Central/.test(document.querySelector('#layer2 .sheet').textContent)), 'tocar no termo abre a explicação por cima da matéria');
  await p.evaluate(() => history.back()); await sleep(300);
  // compartilhar: link da matéria
  await p.evaluate(() => { window.__comp = null; navigator.share = d => { window.__comp = d; return Promise.resolve() } });
  await p.evaluate(() => document.querySelector('#layer .mat [data-matshare]').click()); await sleep(200); await p.evaluate(() => document.querySelector('.sheet [data-envmais]').click()); await sleep(200);
  const comp = await p.evaluate(() => window.__comp);
  ok(comp && comp.url === BASE + 'm/' + encodeURIComponent(comp.url.split('/m/')[1].replace('.html', '')) + '.html' && comp.url.endsWith('/m/' + P.id + '.html') && !/Leia em/.test(comp.text || ''), 'Compartilhar manda o link da matéria (sem "Leia em")', comp);
  await p.evaluate(() => history.back()); await sleep(400);
  // Feed adiado até ser usado
  const fa = await p.evaluate(() => ({ ad: typeof FEED_ADIADO !== 'undefined', posts: document.querySelectorAll('#v-feed .post').length }));
  await p.evaluate(() => go('feed')); await sleep(400);
  ok(await p.evaluate(() => document.querySelectorAll('#v-feed .post').length > 0 && !FEED_ADIADO), 'Feed aparece ao abrir a aba (desenho adiado na abertura)', fa);
  await p.evaluate(() => go('capa')); await sleep(400);
  // ---------- faixa Agora
  await p.evaluate(() => carregarAgora()); await sleep(600);
  const ag = await p.evaluate(() => { const b = document.querySelector('#v-capa .cp-agora'); if (!b) return null; const l = [...b.querySelectorAll('.ag-i')].map(x => x.textContent); return { itens: l.slice(0, l.length / 2), anda: getComputedStyle(b.querySelector('.ag-run')).animationName } });
  ok(ag && ag.itens.length === 3 && ag.anda === 'tk' && !ag.itens.some(t => /veja|velho/i.test(t)) && ag.itens.some(t => /STF forma maioria/.test(t)), 'Agora: só assuntos recentes, sem "veja", sem contagem de veículos', ag);
  await p.screenshot({ path: D + 'agora.png' });
  await p.evaluate(() => document.querySelector('.cp-agora [data-agora]').click()); await sleep(400);
  ok(await p.evaluate(() => document.querySelectorAll('#layer .ag-l li').length === 3 && !!document.querySelector('#layer [data-agpid]')), 'tocar abre a lista; assunto que já é pauta leva à matéria');
  await p.screenshot({ path: D + 'agora-lista.png' });
  await p.evaluate(() => document.querySelector('#layer [data-agpid]').click()); await sleep(600);
  ok(await p.evaluate(id => MAT_PID === id && !!document.querySelector('#layer .mat'), pe.id), 'abre a matéria da pauta');
  await p.evaluate(() => history.back()); await sleep(400);
  // ---------- eventos e painel de uso
  ok(await esperar(p, () => S.db && S.membro, null, 10000), 'logado (admin)');
  await p.evaluate(() => { evento('materia', 'x1', 'economia'); return enviarEventos() }); await sleep(2500);
  const n0 = await H.sql(`select tipo, count(*)::int n from public.eventos group by tipo order by tipo`); const n = n0.rows || n0;
  ok(n.some(r => r.tipo === 'materia' && r.n >= 2) && n.some(r => r.tipo === 'link') && n.some(r => r.tipo === 'compartilhar'), 'eventos anônimos gravados (link, matéria, compartilhar)', n);
  const z0 = await H.sql(`select count(*)::int n from public.eventos where sessao is null or length(sessao) < 6`); ok((z0.rows || z0)[0].n === 0, 'sem uid/nome nos eventos');
  await H.sql(`insert into public.eventos(sessao,tipo,pid,secao,origem,criado_em) select 'aparelho'||(g%5), case when g%3=0 then 'abrir' else 'materia' end, $1, 'politica', 'app', now()-((g%6)||' days')::interval - ((g%14)||' hours')::interval from generate_series(1,80) g`, [pe.id]);
  await p.evaluate(() => abrirAdmin('uso')); await sleep(900);
  const pu = await p.evaluate(() => { const b = document.querySelector('#admbox'); return { k: b.querySelectorAll('.uso-k div').length, dias: b.querySelectorAll('.uso-b li').length, horas: b.querySelectorAll('.uso-h i').length, top: b.querySelectorAll('.uso-t li').length, txt: b.textContent.slice(0, 200) } });
  ok(pu.k === 4 && pu.dias >= 5 && pu.horas === 24 && pu.top >= 1, 'Administração › Uso mostra números, dias, horários e mais lidas', pu);
  await p.screenshot({ path: D + 'uso.png' });
  await p.evaluate(() => document.querySelector('[data-usodias="7"]').click()); await sleep(800);
  ok(await p.evaluate(() => USO_DIAS === 7 && !!document.querySelector('.uso-k')), 'troca o período');
  // membro comum não lê o painel
  const uid2 = await H.criarConta('ana@x.com', '123456'); await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Ana','membro')`, [uid2]);
  const q = U.erros(await H.pagina(br, { sessao: { user: { id: uid2, email: 'ana@x.com' } } }), 'b'); await q.goto(BASE + 'index.html'); await esperar(q, () => S.db && S.membro, null, 10000);
  ok(await q.evaluate(async () => { try { await S.db.rpc('admin_painel', { p_dias: 7 }); return false } catch (e) { return true } }), 'membro comum não lê o painel');
  ok(!p._erros.filter(e => !/ERR_|404|net::|supabase|fonts/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa16: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'novidades.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
