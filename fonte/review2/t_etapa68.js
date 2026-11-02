// Etapa 68: curtidas, comentários e votos das publicações ficam na tabela protegida
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8776/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const convite = async P => { await ev(P, () => go('me')); await sleep(300); await clk(P, '[data-convidar]'); await sleep(150); await clk(P, '[data-gerarconvite]'); await esperar(P, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(P, () => document.querySelector('#cvurl').value); await ev(P, () => closeLayer()); await sleep(200); return l };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8776); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await criar(C, { url: await convite(A), nome: 'Carlos Lima', email: 'c@x.com' }); const uidC = await ev(C, () => S.uid);
  await esperar(A, u => S.amigos.has(u[0]) && S.amigos.has(u[1]), [uidB, uidC]);
  // Bia posta (um normal, um sem comentários) e um story com enquete para os Melhores amigos (só Pedro)
  const ids = await ev(B, async uA => {
    const a = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Post aberto', fotos: [], estilo: { v: 2 } }).select('id');
    const b2 = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Sem comentários', fotos: [], estilo: { v: 2, semCom: true } }).select('id');
    await SB.from('melhores_amigos').insert({ dono: S.uid, amigo: uA });
    const c = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', publico: 'proximos', texto: 's', fotos: [], estilo: { v: 2, itens: [{ t: 'enq', x: .5, y: .5, q: 'Sim?', o: ['Sim', 'Não'] }] } }).select('id');
    await pubCarregar(); return { p: a.data[0].id, sc: b2.data[0].id, st: c.data[0].id } }, await ev(A, () => S.uid));
  await ev(A, () => { go('feed'); pubCarregar() }); await sleep(1800);
  ok(await ev(A, () => PS.on === true), 'tabela de reações ligada');
  // Pedro curte, comenta e vota
  await ev(A, async ids => { await toggleLike('u:' + ids.p); openComments('u:' + ids.p) }, ids); await sleep(400);
  await A.fill('#ctext', 'Comentário secreto do Pedro'); await ev(A, () => document.querySelector('#cform').requestSubmit()); await sleep(1500); await ev(A, () => closeLayer());
  await ev(A, async ids => votar('us:' + ids.st, 0), ids); await sleep(1200);
  const docs = await ev(C, async uA => { const r = await SB.from('docs').select('*').limit(500); return JSON.stringify(r.data || []) }, await ev(A, () => S.uid));
  ok(!/Comentário secreto/.test(docs) && !docs.includes(ids.p) && !docs.includes(ids.st), 'nada da curtida, do comentário e do voto fica nos documentos que o Carlos lê');
  const rc = await ev(C, async () => { const r = await SB.from('pub_reacoes').select('*'); return r.data || [] });
  ok(rc.length === 0, 'Carlos (não é amigo da Bia) não lê nenhuma reação', rc);
  const rb = await ev(B, async () => { await psCarregar(); const r = await SB.from('pub_reacoes').select('*'); return r.data || [] });
  ok(rb.length === 3, 'Bia vê a curtida, o comentário e o voto', rb.length);
  ok(await ev(B, id => { const s = socialOf('u:' + id); return s.likes.length === 1 && s.cm.length === 1 && /secreto/.test(s.cm[0].texto) }, ids.p), 'post da Bia mostra 1 curtida e 1 comentário');
  // comentário em post com comentários desativados: o servidor recusa
  const sc = await ev(A, async id => { const r = await SB.from('pub_reacoes').insert({ pub: id, uid: S.uid, tipo: 'comentario', chave: 'x1', valor: { texto: 'forçado' } }); return r.error ? 'erro' : 'ok' }, ids.sc);
  ok(sc === 'erro', 'comentários desativados valem no servidor');
  // descurtir e apagar comentário
  await ev(A, async id => { await toggleLike('u:' + id) }, ids.p); await sleep(800);
  ok(await ev(A, async id => { const r = await SB.from('pub_reacoes').select('*').eq('pub', id).eq('tipo', 'curtida'); return (r.data || []).length === 0 && !socialOf('u:' + id).likes.length }, ids.p), 'descurtir apaga da tabela');
  // dados antigos (no documento) migram
  await ev(A, async id => { await gravarMapa('curtidas/' + S.uid, 'itens', 'x', null); await _gm68base('curtidas/' + S.uid, 'itens', 'u:' + id, { at: Date.now() }) }, ids.sc); await sleep(800);
  await A.reload(); await esperar(A, () => S.membro && S.amigosOk, null, 8000); await ev(A, () => { go('feed'); pubCarregar() }); await sleep(3000);
  ok(await ev(A, async id => { const r = await SB.from('pub_reacoes').select('*').eq('pub', id).eq('tipo', 'curtida'); const d = ((S.raw.curtidas || {})[S.uid] || {})['u:' + id]; return (r.data || []).length === 1 && !d }, ids.sc), 'curtida antiga sai do documento e vai para a tabela');
  ok(!A._erros.length && !B._erros.length && !C._erros.length, 'sem erros ' + A._erros.concat(B._erros, C._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa68: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
