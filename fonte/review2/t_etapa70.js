// Etapa 70: arquivo de stories, destaques no perfil, editar legenda e fixar
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8778/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8778); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  // Pedro: 3 stories (2 vencidos há 3 dias), 4 posts
  const ids = await ev(A, async () => { const out = [];
    for (let i = 1; i <= 3; i++) { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: 'Story ' + i, fotos: [], estilo: { v: 2, fundo: i, itens: [{ t: 'texto', x: .5, y: .5, tx: 'Story ' + i, f: 'forte', cor: '#ffffff', an: 'surgir' }] } }).select('id'); out.push(r.data[0].id) }
    for (let i = 1; i <= 4; i++) { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Post ' + i, fotos: [], estilo: { v: 2 } }).select('id'); out.push(r.data[0].id) }
    return out });
  await H.sql(`update publicacoes set expira = expira - 4*86400000, at = at - 4*86400000 where texto in ('Story 1','Story 2')`);
  await ev(A, () => { go('feed'); pubCarregar() }); await sleep(1500);
  ok(await ev(A, () => V5.on === true), 'SQL v5 detectado');
  // arquivo
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(800);
  await clk(A, '[data-arquivo]'); await sleep(1500);
  ok(await ev(A, () => document.querySelectorAll('#layer .arq-grade .pf-t').length === 3 && !!document.querySelector('#layer .arq-ativo')), 'arquivo mostra os 3 stories (1 ainda no ar)');
  await A.screenshot({ path: SH + 'd70-arquivo.png' });
  await clk(A, '#layer [data-arqi="2"]'); await sleep(1200);
  ok(await ev(A, () => !!document.querySelector('#layer .story') && /Story 1/.test(ST.itens[ST.i].texto)), 'tocar abre o story vencido');
  await clk(A, '#layer [data-usdest]'); await sleep(500); await clk(A, '#layer2 [data-destnovo]'); await sleep(1200);
  ok(await ev(A, () => document.querySelectorAll('[data-destsel][aria-pressed=true]').length === 1), 'Destacar → Novo destaque já marca este story');
  await clk(A, `[data-destsel="${ids[1]}"]`); await sleep(100); await A.fill('#dest-nome', 'Viagem'); await clk(A, '[data-destcriar]'); await sleep(1500);
  ok(await ev(A, () => (DEST[S.uid] || []).length === 1 && DEST[S.uid][0].itens.length === 2 && DEST[S.uid][0].nome === 'Viagem'), 'destaque "Viagem" com 2 stories');
  await ev(A, () => { closeLayer(); closeLayer() }); await sleep(300);
  // editar e fixar
  await ev(A, () => { go('feed'); renderPosts(); scrollTo(0, 0) }); await sleep(900);
  const p2 = ids[4];
  await ev(A, id => { garantirPost('u:' + id); document.getElementById('p-u:' + id)?.scrollIntoView(); document.querySelector(`[data-umenu="${id}"]`).click() }, p2); await sleep(400);
  await clk(A, '[data-ueditar]'); await sleep(400); await A.fill('#ed-leg', 'Post 2 editado'); await clk(A, '[data-uedok]'); await sleep(1000);
  ok(await ev(A, id => pubDe(id).texto === 'Post 2 editado' && /editado/.test(document.getElementById('p-u:' + id).textContent), p2), 'editar legenda');
  for (const id of [ids[3], ids[4], ids[5]]) { await ev(A, id => { garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, id); await sleep(300); await clk(A, '[data-ufixar]'); await sleep(800) }
  await ev(A, id => { garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, ids[6]); await sleep(300); await ev(A, () => { window.__T = []; const t = toast; toast = function (m) { window.__T.push(m); return t.apply(this, arguments) } }); await clk(A, '[data-ufixar]'); await sleep(800);
  ok(await ev(A, () => window.__T.some(m => /3 posts fixados/.test(m))), 'no máximo 3 fixados');
  const sqlFix = await H.sql(`select count(*)::int n from publicacoes where fixado is not null`); ok(sqlFix[0].n === 3, "servidor tem 3 fixados", sqlFix);
  await ev(A, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(1200);
  const ordem = await ev(A, () => [...document.querySelectorAll('#v-me .vn-pl > .post')].map(e => e.id.replace(/^p-u:/, '')));
  ok(ordem.length > 3 && [ids[3], ids[4], ids[5]].every(id => ordem.slice(0, 3).includes(id)), 'perfil: os 3 fixados primeiro', ordem);
  ok(await ev(A, () => !!document.querySelector('#v-me .pf-dests [data-pfdest]') && /Viagem/.test(document.querySelector('#v-me .pf-dests').textContent)), 'fileira de destaques no perfil');
  await A.screenshot({ path: SH + 'd70-perfil.png' });
  // B vê o destaque (stories vencidos) no perfil do Pedro
  await ev(B, () => { go('feed'); pubCarregar() }); await sleep(1500);
  await ev(B, u => abrirPerfil(u), await ev(A, () => S.uid)); await sleep(2000);
  ok(await ev(B, () => !!document.querySelector('#layer .pf-dests [data-pfdest]')), 'Bia vê o destaque no perfil do Pedro');
  await clk(B, '#layer [data-pfdest]'); await sleep(1500);
  ok(await ev(B, () => !!document.querySelector('#layer .story') && ST.itens.length === 2 && /Viagem/.test(document.querySelector('#layer .sg-who').textContent)), 'Bia assiste aos 2 stories vencidos do destaque');
  await B.screenshot({ path: SH + 'd70-destB.png' });
  const nB = await ev(B, async () => { const r = await SB.from('publicacoes').select('id').eq('tipo', 'story'); return (r.data || []).length });
  ok(nB === 3, 'Bia lê só o story no ar + os 2 do destaque (os outros vencidos continuam escondidos)', nB);
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa70: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
