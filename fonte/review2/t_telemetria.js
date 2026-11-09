// 142 + sql v15: registro de erros e contagem de uso anônimos. No banco (PGlite): anon envia mas não lê; membro comum não
// lê o painel; admin lê, resolve e limpa; limites (20 lotes/aparelho/dia, tamanho, nomes); limpeza do texto; erro que volta
// reabre; aviso de erro frequente (>5 aparelhos em 1 h). No app: erro JS agrupado (2 iguais = 1 grupo com 2),
// unhandledrejection, service worker, falha do Supabase; o que vai no fio (sem texto digitado, uid, e-mail, sessão);
// limite por aparelho; lote no pagehide (keepalive); quem não entrou também envia; painel Administração › App (Erros e Uso,
// resolver, limpeza, aviso na Atividade); desligar em Ajustes para de enviar; sem a v15 não quebra nem envia; a telemetria
// só começa depois da Capa. Portas 8774–8775.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8774, PORTA2 = 8775, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const v15 = ler('sql/publicacoes-v15.sql');
  ok(!/\(\?<[=!]/.test(ler('app/src/js/142-telemetria.js')) && !/sb_secret|service_role/.test(ler('app/src/js/142-telemetria.js')), '142: sem lookbehind e sem chave secreta');
  ok(ler('prumo-supabase.sql') === ler('sql/prumo-supabase.antes-v15.sql') + '\n' + v15, 'prumo-supabase.sql = antes-v15 + v15');
  // v15 roda depois da v14 e pode rodar de novo
  const tmp = path.join(raiz, 'review3', 'var', 'sqlv15.sql'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, [ler('sql/prumo-supabase.antes-v15.sql'), v15, v15].join('\n'));
  const H = await require('../harness').criar({ sql: tmp });
  const EM = { a: 'pedro@exemplo.com', b: 'bia@exemplo.com' }, ids = {};
  for (const k of Object.keys(EM)) ids[k] = await H.criarConta(EM[k], '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  const como = (k, q, p) => H.comoUsuario(k ? ids[k] : null, () => H.db.query(q, p || [])).then(r => r.rows);
  const erro = async (k, q, p) => { try { await como(k, q, p); return null } catch (e) { return (e.code || '') + ' ' + e.message } };
  const reg = (ap, lote) => H.naFila(null, { kind: 'rpc', name: 'tl142_registrar', args: { p_aparelho: ap, p_lote: JSON.stringify(lote) } }).then(r => { if (r.error) throw new Error(r.error.message); return r.data });
  const apX = n => ('aparelho' + n + 'x'.repeat(20)).slice(0, 24);
  const E1 = { t: 'js', m: 'Cannot read properties of undefined (reading \'x\')', l: 'index.html:153:100', f: 'renderCapa', n: 1, v: 'aaaaaaaaaaaa', p: 'ios', b: 'safari', bv: 17, i: 1, w: 390, s: 'capa', a: ['c:a.like', 'go:feed'] };

  /* ================= 1. banco ================= */
  ok((await como(null, `select public.tl142_ligado() r`))[0].r === true, 'anon: tl142_ligado() (detecção da v15)');
  let r = await reg(apX(1), { erros: [E1, E1], uso: [{ e: 'tela_capa', n: 2, p: 'ios' }] });
  ok(r.ok === true && r.erros === 2 && r.uso === 1, 'anon: envia um lote', r);
  let g = await H.sql(`select * from tl_erros`);
  ok(g.length === 1 && +g[0].contagem === 2 && g[0].aparelhos === 1 && g[0].plataformas.ios === 2 && g[0].detalhe.s === 'capa' && g[0].detalhe.a.join() === 'c:a.like,go:feed', 'banco: 2 iguais = 1 grupo com contagem 2 e 1 aparelho', g[0]);
  ok(!/aparelho1/.test(JSON.stringify(await H.sql(`select * from tl_erros_aparelhos`))) && !/aparelho1/.test(JSON.stringify(await H.sql(`select * from tl_envios`))), 'banco: o número do aparelho só fica como resumo (md5)');
  for (const t of ['tl_erros', 'tl_erros_aparelhos', 'tl_envios', 'tl_uso']) ok(!!(await erro(null, `select * from public.${t}`)) && !!(await erro('b', `select * from public.${t}`)) && !!(await erro('a', `select * from public.${t}`)), `${t}: ninguém lê direto (anon, membro e nem o admin, só pelas funções)`);
  ok(!!(await erro(null, `insert into public.tl_uso(dia,evento,plataforma,n) values (current_date,'x','ios',1)`)), 'anon: não grava direto na tabela');
  for (const f of ['tl142_admin_erros()', 'tl142_admin_uso(30)', 'tl142_limpar()', 'tl142_alertas()', 'tl142_resolver(1,true)']) {
    ok(!!(await erro(null, `select public.${f}`)), `anon: não chama ${f}`);
    ok(/42501/.test(await erro('b', `select public.${f}`) || ''), `membro comum: ${f} recusado (42501)`);
  }
  const L = (await como('a', `select public.tl142_admin_erros() j`))[0].j;
  ok(L.length === 1 && L[0].mensagem === E1.m && L[0].aparelhos === 1 && L[0].aparelhos_1h === 1 && !('assinatura' in L[0]), 'admin: lê a lista agrupada', L[0]);
  const U1 = (await como('a', `select public.tl142_admin_uso(30) j`))[0].j;
  ok(U1.length === 1 && U1[0].evento === 'tela_capa' && +U1[0].n === 2 && U1[0].plataforma === 'ios', 'admin: lê os contadores de uso', U1);
  // limpeza do texto no banco, campos estranhos e tamanho
  r = await reg(apX(2), { erros: [{ t: 'js', m: 'falhou para bia@exemplo.com id ' + ids.b + ' em https://x.com/a?b=1 com "texto da pessoa aqui" 98765', l: 'index.html:1:1<script>', f: 'f(x)' }, { t: 'outro', m: 'x' }],
    uso: [{ e: 'Nome Inválido', n: 1 }, { e: 'busca', n: 99999 }, { e: 'busca', n: 3, p: 'marte', d: '1999-01-01' }] });
  g = await H.sql(`select mensagem, local, funcao from tl_erros where mensagem like 'falhou%'`);
  ok(r.erros === 1 && g.length === 1 && g[0].mensagem === 'falhou para <email> id <id> em <url> com "…" <n>' && g[0].local === 'index.html:1:1<script>'.replace(/[^A-Za-z0-9_./:<>-]/g, '') && g[0].funcao === 'fx', 'banco: limpa e-mail, id, endereço, texto entre aspas e números longos; tipo desconhecido fora', g[0]);
  const ub = await H.sql(`select plataforma, n, dia = (now() at time zone 'America/Sao_Paulo')::date as hoje from tl_uso where evento='busca'`);
  ok(r.uso === 1 && ub.length === 1 && ub[0].plataforma === 'outro' && +ub[0].n === 3 && ub[0].hoje, 'banco: nome de evento inválido e contagem absurda ignorados; dia antigo vira hoje', ub);
  ok((await reg(apX(3), { erros: [{ t: 'js', m: 'x'.repeat(17000) }] })).motivo === 'tamanho' && (await reg('curto', { uso: [] })).motivo === 'aparelho', 'banco: lote grande demais e aparelho inválido recusados');
  // limite por aparelho por dia
  for (let i = 0; i < 18; i++) await reg(apX(1), { uso: [{ e: 'materia', n: 1, p: 'ios' }] });  // já mandou 2 (1 + o de cima não; só apX(1): 1) → total 19
  r = await reg(apX(1), { uso: [{ e: 'materia', n: 1, p: 'ios' }] }); const r21 = await reg(apX(1), { uso: [{ e: 'materia', n: 1, p: 'ios' }] });
  ok(r.ok === true && r21.ok === false && r21.motivo === 'limite' && +(await H.sql(`select sum(n) s from tl_uso where evento='materia'`))[0].s === 19, 'banco: no máximo 20 lotes por aparelho por dia (o 21º é recusado)', [r, r21]);
  // erro frequente: mais de 5 aparelhos na última hora
  const E2 = { t: 'promessa', m: 'falha frequente de teste', l: '', f: '', v: 'bbbbbbbbbbbb', p: 'android' };
  for (let i = 10; i < 15; i++) await reg(apX(i), { erros: [E2] });
  ok((await H.sql(`select alerta_em from tl_erros where mensagem=$1`, [E2.m]))[0].alerta_em === null, 'aviso: com 5 aparelhos ainda não');
  await reg(apX(15), { erros: [E2] });
  const al = (await como('a', `select public.tl142_alertas() j`))[0].j;
  ok(al.length === 1 && al[0].mensagem === E2.m && al[0].alerta_n === 6, 'aviso: 6 aparelhos em 1 hora marca o erro e o admin vê em tl142_alertas()', al);
  // resolver e reabrir
  const idE2 = (await H.sql(`select id from tl_erros where mensagem=$1`, [E2.m]))[0].id;
  await como('a', `select public.tl142_resolver($1, true)`, [idE2]);
  ok((await como('a', `select public.tl142_alertas() j`))[0].j.length === 0, 'resolvido: sai dos avisos');
  await reg(apX(16), { erros: [E2] });
  ok((await H.sql(`select resolvido_em is not null r from tl_erros where id=$1`, [idE2]))[0].r === true, 'resolvido: o mesmo erro da MESMA versão (aparelho ainda não atualizado) não reabre');
  await reg(apX(16), { erros: [{ ...E2, v: 'cccccccccccc' }] });
  let x = (await H.sql(`select resolvido_em, reaberto, ultima_versao from tl_erros where id=$1`, [idE2]))[0];
  ok(x.resolvido_em === null && x.reaberto === true && x.ultima_versao === 'cccccccccccc', 'resolvido: voltou numa versão nova, reabre ("voltou")', x);
  // limpeza
  await como('a', `select public.tl142_resolver($1, true)`, [idE2]);
  await H.sql(`update tl_erros set resolvido_em = now() - interval '61 days' where id=$1`, [idE2]);
  await H.sql(`insert into tl_uso(dia,evento,plataforma,n) values ((now() at time zone 'America/Sao_Paulo')::date - 182, 'velho', 'ios', 5), ((now() at time zone 'America/Sao_Paulo')::date - 179, 'quase', 'ios', 5)`);
  const lp = (await como('a', `select public.tl142_limpar() j`))[0].j;
  ok(lp.erros === 1 && lp.uso === 1 && (await H.sql(`select count(*)::int n from tl_erros where id=$1`, [idE2]))[0].n === 0 && (await H.sql(`select evento from tl_uso where evento in ('velho','quase')`)).map(z => z.evento).join() === 'quase',
    'limpeza: erros resolvidos há mais de 60 dias e contadores com mais de 180 dias saem', lp);
  const anonF = await H.sql(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'tl142%' and has_function_privilege('anon', p.oid, 'execute') order by 1`);
  ok(anonF.map(z => z.proname).join() === 'tl142_ligado,tl142_registrar', 'anon: só tl142_ligado e tl142_registrar', anonF);
  const sd = await H.sql(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'tl142%' and p.proname <> 'tl142_limpa' and (not p.prosecdef or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'))`);
  ok(sd.length === 0, 'funções: security definer com search_path', sd);
  await H.db.exec(`delete from tl_erros; delete from tl_uso; delete from tl_envios`);

  /* ================= 2. o app ================= */
  const br = await U.navegador();
  const REQ = [];  // o que sai no fio para o Supabase (rpc tl142_*)
  const liga = async (ctx, HH) => ctx.route('https://teste.supabase.co/rest/v1/**', async rt => {
    const q = rt.request(), u = new URL(q.url()), nome = (u.pathname.match(/\/rpc\/([a-z0-9_]+)$/) || [])[1];
    if (u.pathname.indexOf('/rpc/tl142_') < 0) { if (rt.request().url().indexOf('falha500') > 0) return rt.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'XX000', message: 'boom no servidor' }) }); return rt.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function' }) }) }
    const corpo = q.postData() || '{}', h = q.headers(); REQ.push({ nome, corpo, h, t: Date.now(), pag: HH.nome });
    const res = await HH.H.naFila(null, { kind: 'rpc', name: nome, args: JSON.parse(corpo) });
    if (res.error) return rt.fulfill({ status: /does not exist|42883/.test(res.error.message + res.error.code) ? 404 : 400, contentType: 'application/json', body: JSON.stringify({ code: /does not exist|42883/.test(res.error.message + res.error.code) ? 'PGRST202' : res.error.code, message: res.error.message }) });
    return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(res.data) });
  });
  const abrir = async (k, o = {}) => {
    const HH = o.HH || { H, nome: k || 'anon' };
    const p = U.erros(await (o.HH ? o.HH.H : H).pagina(br, k ? { sessao: { user: { id: (o.ids || ids)[k], email: EM[k] } } } : {}), (k || 'anon').toUpperCase() + (o.n || ''));
    await liga(p.context(), HH);
    await p.addInitScript(() => { window.__tl142Teste = 1; window.__tl142Ciclo = 1200; window.__fetchLog = [];
      const f = window.fetch; window.fetch = function (i, o) { try { const u = typeof i === 'string' ? i : i.url; if (/rpc\/tl142_/.test(u)) window.__fetchLog.push({ u, keep: !!(o && o.keepalive), cred: o && o.credentials }) } catch (e) { } return f.apply(this, arguments) };
      const iv = setInterval(() => { if (document.querySelector('#v-capa .cpi,#posts > :not(.skel)')) { window.__capaT = Date.now(); clearInterval(iv) } }, 15) });
    await p.goto(o.base || BASE);
    await esperar(p, () => !!document.querySelector('#v-capa .cpi,#posts > :not(.skel)') && typeof TL142 !== 'undefined', null, 20000);
    if (k) await esperar(p, () => S.membro && S.amigosOk, null, 20000);
    return p };
  const doBanco = async () => H.sql(`select * from tl_erros order by id`);
  const corpos = pag => REQ.filter(q => q.nome === 'tl142_registrar' && (!pag || q.pag === pag)).map(q => q.corpo);

  /* --- quem não entrou: abertura, erros e o que vai no fio --- */
  const P = await abrir(null);
  ok(await esperar(P, () => TL142.v15 === true, null, 15000), 'anon: detectou a v15 (depois da Capa)');
  const t1 = REQ.find(q => q.pag === 'anon');
  ok(!!t1 && t1.nome === 'tl142_ligado' && t1.t >= (await ev(P, () => window.__capaT)), 'abertura: a primeira chamada da telemetria só sai depois da primeira tela (Capa/Feed) desenhada', [t1 && t1.t, await ev(P, () => window.__capaT)]);
  ok(await ev(P, () => TL142.custo < 25), 'abertura: o 142 custa menos de 25 ms para carregar (só instala ouvintes)', await ev(P, () => TL142.custo));
  // texto digitado num campo + erro que traz esse texto
  await ev(P, () => { go('busca') }); await sleep(300);
  await ev(P, () => { const i = document.createElement('input'); i.id = 'tl142campo'; document.body.appendChild(i); i.value = 'meu segredo digitado' });
  await ev(P, () => { for (let i = 0; i < 2; i++) setTimeout(function tl142Falha() { throw new Error('Falha de teste com meu segredo digitado e 1234567 para pedro@exemplo.com') }, 10) });
  await ev(P, () => { Promise.reject(new Error('Promessa de teste sem catch')) });
  await sleep(200);
  ok(await esperar(P, () => window.__fetchLog.some(x => /registrar/.test(x.u)), null, 8000), 'lote: sai sozinho (ciclo curto no teste; 30 s no app)');
  await sleep(500);
  let G = await doBanco();
  const gJs = G.find(z => z.tipo === 'js' && /Falha de teste/.test(z.mensagem));
  ok(!!gJs && +gJs.contagem === 2 && gJs.aparelhos === 1 && gJs.funcao === 'tl142Falha', 'erro JS: 2 iguais viram 1 grupo com 2 (com a função)', G.map(z => [z.tipo, z.mensagem, z.contagem, z.funcao]));
  ok(!!gJs && gJs.mensagem === 'Error: Falha de teste com <texto> e <n> para <email>', 'erro JS: o texto do campo, o número e o e-mail saem da mensagem', gJs && gJs.mensagem);
  const gPr = G.find(z => z.tipo === 'promessa');
  ok(!!gPr && /Promessa de teste sem catch/.test(gPr.mensagem), 'unhandledrejection registrado', gPr);
  ok(!!gJs && gJs.detalhe.s && /^busca/.test(gJs.detalhe.s) && Array.isArray(gJs.detalhe.a) && gJs.detalhe.a.includes('go:busca') && ['desktop', 'ios', 'android', 'outro'].includes(gJs.detalhe.p) && gJs.detalhe.w === 390 && /^[0-9a-f]{12}$/.test(gJs.ultima_versao),
    'retrato: tela, últimas ações, plataforma, largura e versão', gJs && gJs.detalhe);
  let fio = corpos('anon').join('\n');
  ok(fio && fio.indexOf('segredo') < 0 && fio.indexOf('pedro@') < 0 && fio.indexOf('1234567') < 0 && !/"uid"|user_id|"email"/.test(fio), 'no fio: nada do que foi digitado, nem e-mail, nem número longo, nem uid', fio.slice(0, 400));
  const hh = REQ.find(q => q.nome === 'tl142_registrar').h;
  ok(hh.apikey === 'sb_publishable_teste123' && hh.authorization === 'Bearer sb_publishable_teste123' && !hh.cookie, 'no fio: sem a sessão da pessoa (só a chave publicável) e sem cookie', hh);
  ok(await ev(P, () => window.__fetchLog.every(x => x.cred === 'omit')), 'no fio: credentials "omit"');
  // service worker e Supabase com falha
  await ev(P, () => navigator.serviceWorker && navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { prumo: 'tl142-erro', m: 'sw quebrou no cache', l: 'sw.js:42' } })));
  await ev(P, async u => { try { await fetch('https://teste.supabase.co/rest/v1/falha500?select=*&autor=eq.' + u) } catch (e) { } try { await fetch('https://teste.supabase.co/rest/v1/rpc/nao_existe', { method: 'POST' }) } catch (e) { } }, ids.b);
  await sleep(2600);
  G = await doBanco();
  const gSw = G.find(z => z.tipo === 'sw'), gSb = G.filter(z => z.tipo === 'supabase');
  ok(!!gSw && gSw.mensagem === 'sw quebrou no cache' && gSw.local === 'sw.js:42', 'service worker: o erro que ele manda vira registro', gSw);
  ok(gSb.length === 1 && gSb[0].mensagem === 'HTTP 500 GET /rest/v1/falha500 XX000: boom no servidor' && JSON.stringify(gSb[0]).indexOf(ids.b) < 0, 'Supabase: 500 registrado sem a consulta (sem uid); 404 de função que não existe (detecção) não conta', gSb.map(z => z.mensagem));
  // limite por aparelho no app
  const nAntes = corpos('anon').length;
  await ev(P, () => { localStorage.setItem('prumo-tl142-env', JSON.stringify({ d: tl142Dia(), n: 20 })); setTimeout(() => { throw new Error('depois do limite') }, 5) });
  await sleep(2800); await ev(P, () => dispatchEvent(new Event('pagehide')));
  await sleep(500);
  ok(corpos('anon').length === nAntes && (await doBanco()).every(z => !/depois do limite/.test(z.mensagem)), 'limite: com 20 lotes no dia o aparelho para de mandar');
  // lote no pagehide (só contagens: o ciclo não manda; o pagehide manda com keepalive)
  await ev(P, () => { localStorage.setItem('prumo-tl142-env', JSON.stringify({ d: tl142Dia(), n: 0 })); TL142.ultEnvio = Date.now(); window.__fetchLog = []; TL142.fila = {}; go('feed') });
  await sleep(2700);
  const antesPh = corpos('anon').length;
  ok(await ev(P, () => window.__fetchLog.length === 0), 'contagens sozinhas: não saem a cada ciclo (esperam 5 min ou a saída)');
  await ev(P, () => dispatchEvent(new Event('pagehide'))); await sleep(800);
  const ph = corpos('anon').slice(antesPh).map(c => JSON.parse(c));
  ok(ph.length === 1 && ph[0].p_lote.uso.some(u => u.e === 'tela_feed') && await ev(P, () => window.__fetchLog.length === 1 && window.__fetchLog[0].keep === true), 'pagehide: manda o lote com fetch keepalive', [ph, await ev(P, () => window.__fetchLog)]);
  const uf = await H.sql(`select n from tl_uso where evento='tela_feed'`);
  ok(uf.length === 1 && +uf[0].n >= 1, 'uso: contagem diária anônima no banco (tela_feed)');
  // desligar em Ajustes
  await ev(P, () => abrirAjustes()); await sleep(300);
  ok(await ev(P, () => /O Prumo registra erros e contagens de uso anônimas para melhorar o app/.test($('#layer').textContent) && document.querySelector('[data-tl142sw]').getAttribute('aria-checked') === 'true'), 'Ajustes: texto de privacidade com a opção ligada por padrão');
  await ev(P, () => document.querySelector('[data-tl142sw]').click()); await sleep(200);
  ok(await ev(P, () => tl142Desligado() && !localStorage.getItem('prumo-tl142-ap') && document.querySelector('[data-tl142sw]').getAttribute('aria-checked') === 'false'), 'desligar: grava neste aparelho e apaga o número aleatório');
  const nOff = corpos('anon').length;
  await ev(P, () => { setTimeout(() => { throw new Error('com tudo desligado') }, 5); uso('materia'); go('capa') }); await sleep(2800);
  await ev(P, () => dispatchEvent(new Event('pagehide'))); await sleep(600);
  ok(corpos('anon').length === nOff && await ev(P, () => !Object.keys(TL142.fila).length && !Object.keys(TL142.uso).length), 'desligado: não junta nem manda nada');
  await ev(P, () => abrirPrivacidade()); await sleep(200);
  ok(await ev(P, () => /Registro de erros e uso/.test($('#layer').textContent) && /Ajustes do app › Privacidade/.test($('#layer').textContent)), 'Política de privacidade: explica o registro e como desligar');
  await P.context().close();

  /* --- membro comum e administrador (painel) --- */
  await H.db.exec(`delete from tl_erros; delete from tl_envios`);
  for (let i = 20; i < 26; i++) await reg(apX(i), { erros: [{ t: 'js', m: 'erro frequente no Feed', l: 'index.html:153:9', f: 'renderPosts', v: 'dddddddddddd', p: 'android', s: 'feed', a: ['c:pfaba.posts', 'go:feed'] }] });
  await H.sql(`insert into tl_uso(dia,evento,plataforma,n) values ((now() at time zone 'America/Sao_Paulo')::date - 200, 'antigo', 'ios', 5), ((now() at time zone 'America/Sao_Paulo')::date, 'coluna_exportar', 'ios', 1), ((now() at time zone 'America/Sao_Paulo')::date, 'tela_capa', 'android', 40)`);
  const B = await abrir('b');
  ok(await ev(B, () => !document.querySelector('#v-me [data-admin]')) && /42501|administrador/.test(JSON.stringify(await ev(B, async () => (await SB.rpc('tl142_admin_erros')).error))), 'membro comum: sem Administração e o painel recusado no banco');
  await B.context().close();
  const A = await abrir('a');
  await ev(A, () => { go('me') }); await sleep(300);
  ok(await esperar(A, () => TL142.v15 === true && TL142.alertas.length === 1, null, 12000), 'admin: o app busca os avisos de erro frequente');
  ok(await ev(A, () => atItens().some(x => x.acao === 'tl142' && /Erro novo frequente no app/.test(x.txt) && /6 aparelhos/.test(x.txt)) && nt124Contagem().ativ >= 1), 'aviso discreto na Atividade (conta nas bolinhas do 124)');
  await ev(A, () => abrirAdmin()); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('.segs [data-admaba="app"]')), 'Administração: aba "App"');
  await ev(A, () => document.querySelector('[data-admaba="app"]').click());
  ok(await esperar(A, () => !!document.querySelector('#admbox .tl142-l li'), null, 6000), 'painel Erros: lista agrupada');
  ok((await H.sql(`select count(*)::int n from tl_uso where evento='antigo'`))[0].n === 0, 'limpeza: rodou ao abrir o painel');
  const li = await ev(A, () => document.querySelector('#admbox .tl142-l li').textContent);
  ok(/erro frequente no Feed/.test(li) && /6 vezes/.test(li) && /6 aparelhos/.test(li) && /versão dddddddddddd/.test(li) && /Android 6/.test(li) && /frequente/i.test(li), 'painel: mensagem, vezes, aparelhos, versão e plataforma', li);
  await ev(A, () => document.querySelector('#admbox [data-tl142det]').click()); await sleep(150);
  ok(await ev(A, () => /Últimas ações/.test($('#admbox .tl142-det').textContent) && /pfaba\.posts/.test($('#admbox .tl142-det').textContent) && /renderPosts/.test($('#admbox .tl142-det').textContent)), 'painel: Detalhes com local, função e últimas ações');
  // erro novo nesta versão em destaque
  const vA = await ev(A, () => APP_VERSAO); await H.sql(`delete from tl_envios`);
  await reg(apX(40), { erros: [{ t: 'js', m: 'erro desta versão', l: 'index.html:1:1', v: vA, p: 'ios' }] });
  await ev(A, () => tl142Carrega()); await sleep(500);
  ok(await ev(A, () => { const l = document.querySelector('#admbox .tl142-l li'); return l.classList.contains('novo') && /erro desta versão/.test(l.textContent) && /novo nesta versão/.test(l.textContent) }), 'painel: erro novo desde a última versão vem primeiro, em destaque');
  await ev(A, () => document.querySelector('#admbox [data-tl142res][data-on="1"]').click()); await sleep(700);
  ok((await H.sql(`select resolvido_em is not null r from tl_erros where mensagem='erro desta versão'`))[0].r === true && await ev(A, () => /Resolvidos \(1\)/.test($('#admbox').textContent)), 'painel: marcar como resolvido');
  await ev(A, () => document.querySelector('[data-tl142aba="uso"]').click()); await sleep(200);
  const tu = await ev(A, () => $('#admbox').textContent);
  ok(/Telas e ações/.test(tu) && /Abrir a Capa/.test(tu) && /Por plataforma/.test(tu) && /Android/.test(tu) && /O que quase ninguém usa/.test(tu) && /Colunas: exportar/.test(tu) && !!(await ev(A, () => document.querySelectorAll('#admbox .tl142-dias i').length === 30)), 'painel Uso: 30 dias por dia, por tela/ação, por plataforma e "o que quase ninguém usa"', tu.slice(0, 300));
  ok(await ev(A, () => document.documentElement.scrollWidth <= innerWidth), '390 px: painel sem rolagem lateral');
  await A.screenshot({ path: path.join(U.SHOTS, 't_telemetria-uso.png') });
  // o aviso abre o painel
  await fecha(A); await ev(A, () => { const x = atItens().find(y => y.acao === 'tl142'); atAcao(x) }); await sleep(900);
  ok(await ev(A, () => S._admAba === 'app' && !!document.querySelector('#admbox .tl142-det')), 'tocar no aviso abre Administração › App no erro');
  ok(A._erros.length === 0, 'admin: sem erros na página', A._erros);
  await A.context().close();

  /* --- app sem a v15: não quebra nem envia --- */
  const H2 = await require('../harness').criar({ sql: path.join(raiz, 'sql', 'prumo-supabase.antes-v15.sql') });
  const ids2 = { a: await H2.criarConta(EM.a, '123456') }; await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin')`, [ids2.a]);
  const n0 = REQ.length;
  const Z = await abrir('a', { HH: { H: H2, nome: 'semv15' }, ids: ids2, base: BASE2, n: '-semv15' });
  ok(await esperar(Z, () => TL142.v15 === false, null, 15000), 'sem v15: detecta');
  await ev(Z, () => { setTimeout(() => { throw new Error('erro sem v15') }, 5); uso('materia'); go('feed') }); await sleep(2500);
  await ev(Z, () => dispatchEvent(new Event('pagehide'))); await sleep(500);
  const zr = REQ.slice(n0).filter(q => q.pag === 'semv15');
  ok(zr.length === 1 && zr[0].nome === 'tl142_ligado' && await ev(Z, () => !Object.keys(TL142.fila).length && !Object.keys(TL142.uso).length), 'sem v15: só a detecção; nada é juntado nem enviado', zr.map(q => q.nome));
  await ev(Z, () => { abrirAdmin('app') }); await sleep(800);
  ok(await ev(Z, () => /publicacoes-v15\.sql/.test($('#admbox').textContent)), 'sem v15: o painel explica o que rodar');
  ok(Z._erros.filter(e => !/erro sem v15/.test(e)).length === 0, 'sem v15: sem erros', Z._erros);
  await Z.context().close();

  await br.close();
  const R = U.resumo(); console.log(`\nRESUMO t_telemetria: ${R.OKS} ok, ${R.FALHAS} falhas`);
  srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill(); srv2 && srv2.kill() } catch (x) { } process.exit(2) });
