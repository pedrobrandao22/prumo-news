// Passada geral no Safari (WebKit, o motor do iPhone) — 09/11. Roda no GitHub, onde o WebKit está instalado; nesta
// máquina, sem WebKit, cai no Chromium com o aparelho "iPhone 13" (vale como passada geral, não como Safari).
// Visitante e membros, claro e escuro: Capa, matéria, Feed inteiro, Busca, hashtag, Em 5 min, Quiz, Giro, Conversas,
// comentários, perfil, Ajustes, Administração, leitura de coluna, abrir a criação (post, giro, coluna) e fechar.
// Em cada tela: nenhum erro de JavaScript e nada saindo da tela na horizontal. Portas 8996. Capturas em qa/safari/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const { devices } = require('playwright');
const { montarPasta, PROD, VAZA } = require('./_qc_comum');
const PORTA = 8996, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'safari'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while ((document.querySelector('#layer2')?.innerHTML || document.querySelector('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } try { ED132.E = null } catch (e) { } });
const foto = (p, n) => p.screenshot({ path: path.join(QA, n + '.png') });
const CORPO = Array.from({ length: 8 }, (_, i) => `<p>Parágrafo ${i + 1}: o orçamento chega ao Congresso com uma conta que não fecha, e cada bancada tenta proteger o seu pedaço.</p>`).join('');
let srv = null;
(async () => {
  const { F } = montarPasta('sf143t'); srv = U.servir('sf143t', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const pk = (F.pautas || []).map(x => x.id);
  const col = (await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,'[]',$3,'amigos',$4) returning id`,
    [ids.b, 'O orçamento no corredor\n\nO que se ouve no Congresso', { v: 2, coluna: { v: 1, f: 'h', tit: 'O orçamento no corredor', linha: 'O que se ouve no Congresso', min: 2 } }, CORPO]))[0].id;
  const post = (await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico) values ($1,'post','Alguém mais achou o debate morno? #Debate','[]',$2,'amigos') returning id`, [ids.b, { v: 2 }]))[0].id;
  await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,expira) values ($1,'story','Texto do giro','[]',$2,'amigos',$3)`, [ids.b, { v: 2, fundo: 3 }, Date.now() + 20 * 3600e3]).catch(() => null);
  await como('b', `insert into public.mensagens(de,para,texto) values ($1,$2,'Oi Pedro, viu a matéria da PEC?')`, [ids.b, ids.a]);

  let brW = null; try { brW = await require('playwright').webkit.launch() } catch (e) { brW = null }
  const br = brW || await U.navegador();
  console.log('iPhone em: ' + (brW ? 'WebKit' : 'Chromium com o aparelho "iPhone 13" (WebKit não está instalado aqui)'));
  const d = devices['iPhone 13'];
  const abrir = async (k, o = {}) => {
    const ctx = brW ? { deviceScaleFactor: 2, hasTouch: true, userAgent: d.userAgent } : { deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: d.userAgent };
    const p = U.erros(await H.pagina(br, { sessao: k ? { user: { id: ids[k], email: k + '@x' } } : undefined, dark: o.dark, viewport: d.viewport, ctx }), (k || 'V') + (o.dark ? '-escuro' : ''));
    await p.addInitScript(PROD);
    await p.goto(BASE);
    await esperar(p, () => typeof VIEW !== 'undefined' && VIEW === 'capa' && !!document.querySelector('#v-capa .cpi'), null, 20000);
    if (k) await esperar(p, () => S.membro && S.amigosOk && PUB.on === true, null, 20000);
    await esperar(p, () => typeof FL119 !== 'undefined' && !FL119.parcial, null, 12000);
    await sleep(700); await fecha(p); return p };
  const tela = async (P, nome, fn, arg, espera = 800) => {
    const n0 = P._erros.length;
    try { await ev(P, fn, arg) } catch (e) { P._erros.push('abrir ' + nome + ': ' + e.message) }
    await sleep(espera);
    const vz = await ev(P, VAZA).catch(() => ({ sw: 0, W: 1, out: [] }));
    ok(P._erros.length === n0, `${P._nome}: ${nome} sem erros`, P._erros.slice(n0));
    ok(vz.sw <= vz.W && !vz.out.length, `${P._nome}: ${nome} sem nada saindo da tela`, vz);
    return vz };

  // ===== visitante, claro e escuro
  for (const dark of [false, true]) {
    const V = await abrir(null, { dark }); V._nome = 'visitante' + (dark ? ' escuro' : '');
    await tela(V, 'Capa', () => { go('capa'); scrollTo(0, 0) }); await foto(V, 'capa' + (dark ? '-escuro' : ''));
    const alvo = pk.find(Boolean);
    await tela(V, 'matéria', id => abrirMateria(id), alvo, 1000); await foto(V, 'materia' + (dark ? '-escuro' : ''));
    await ev(V, () => { const m = document.querySelector('#layer .mat'); if (m) m.scrollTop = m.scrollHeight }); await sleep(400);
    ok(V._erros.length === 0, `${V._nome}: matéria rolada até o fim`, V._erros); await fecha(V);
    await tela(V, 'Feed', () => { go('feed'); scrollTo(0, 0) });
    for (let i = 0; i < 10; i++) { await ev(V, () => scrollBy(0, 1400)); await sleep(150) }
    await ev(V, () => { for (let i = 0; i < 20; i++) try { carregarMais(true) } catch (e) { } }); await sleep(500);
    await tela(V, 'Feed rolado', () => 0, null, 200);
    await tela(V, 'Busca', () => { scrollTo(0, 0); go('busca'); const i = document.querySelector('#v-busca input'); if (i) { i.value = 'senado'; i.dispatchEvent(new Event('input', { bubbles: true })) } });
    await tela(V, 'hashtag', () => abrirHashtag('Senado')); await fecha(V);
    await tela(V, 'Em 5 min', () => abrir5min()); await fecha(V);
    await tela(V, 'Quiz', () => abrirQuiz()); await fecha(V);
    await V.context().close();
  }

  // ===== Pedro (admin), claro e escuro
  for (const dark of [false, true]) {
    const A = await abrir('a', { dark }); A._nome = 'Pedro' + (dark ? ' escuro' : '');
    await tela(A, 'Feed', () => { go('feed'); scrollTo(0, 0) });
    ok(await esperar(A, id => { try { carregarMais(true) } catch (e) { } return !!document.getElementById('p-u:' + id) }, post, 8000), `${A._nome}: post da Bia no Feed`);
    await tela(A, 'comentários', id => openComments('u:' + id), post); await foto(A, 'comentarios' + (dark ? '-escuro' : '')); await fecha(A);
    await tela(A, 'coluna da Bia', id => cs123Abrir(id), col, 1200); await foto(A, 'coluna' + (dark ? '-escuro' : ''));
    await ev(A, () => { const s = document.querySelector('#layer .cs123-sc'); if (s) { s.scrollTop = s.scrollHeight; s.dispatchEvent(new Event('scroll')) } }); await sleep(400); await fecha(A);
    await tela(A, 'Conversas', () => go('msgs'));
    await tela(A, 'conversa com a Bia', u => abrirConversa(u), ids.b); await foto(A, 'conversa' + (dark ? '-escuro' : '')); await fecha(A);
    await tela(A, 'perfil da Bia', u => abrirPerfil(u), ids.b); await fecha(A);
    await tela(A, 'meu perfil', () => go('me'));
    await tela(A, 'Ajustes', () => abrirAjustes()); await fecha(A);
    await tela(A, 'Administração', () => abrirAdmin(), null, 1000);
    const nAb = await ev(A, () => document.querySelectorAll('.sheet [data-admaba]').length);
    for (let i = 0; i < nAb; i++) { await ev(A, i => document.querySelectorAll('.sheet [data-admaba]')[i].click(), i); await sleep(500) }
    ok(nAb >= 5 && A._erros.length === 0, `${A._nome}: Administração, ${nAb} abas sem erros`, A._erros); await fecha(A);
    await tela(A, 'criar post', () => { go('feed'); criarAbrir('post') }, null, 600); await foto(A, 'criar-post' + (dark ? '-escuro' : '')); await fecha(A);
    await tela(A, 'criar giro', () => criarAbrir('story'), null, 600); await fecha(A);
    await tela(A, 'criar coluna', () => { criarAbrir('post'); const b = document.querySelector('#layer [data-cs123ini]'); if (b) b.click() }, null, 700);
    if (await ev(A, () => !!document.querySelector('#layer [data-ed132nova]'))) await tela(A, 'coluna nova', () => document.querySelector('#layer [data-ed132nova]').click(), null, 600);
    await foto(A, 'criar-coluna' + (dark ? '-escuro' : '')); await fecha(A);
    await tela(A, 'Capa de novo', () => { go('capa'); scrollTo(0, 0) });
    ok(A._erros.length === 0, `${A._nome}: sem erros no fim`, A._erros);
    await A.context().close();
  }
  if (brW) await brW.close(); else await br.close(); srv.kill();
  fs.rmSync(path.join(__dirname, '..', 'sf143t'), { recursive: true, force: true });
  const R = U.resumo(); console.log(`RESUMO t_safari_geral: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
