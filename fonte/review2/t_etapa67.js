// Etapa 66/67: convite para quem já é membro, menções só para quem vê o post, links nas Conversas,
// marcas seguem a foto, corte do Reels com a duração real, voto da enquete travado
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8775/index.html'; const F1 = __dirname + '/etapa13/foto.jpg', F2 = __dirname + '/../qa2/f2.jpg', F3 = __dirname + '/../qa2/f3.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const convite = async P => { await ev(P, () => go('me')); await sleep(300); await clk(P, '[data-convidar]'); await sleep(150); await clk(P, '[data-gerarconvite]'); await esperar(P, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(P, () => document.querySelector('#cvurl').value); await ev(P, () => closeLayer()); await sleep(200); return l };
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8775); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B'), C = U.erros(await H.pagina(b), 'C');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  await criar(C, { url: await convite(A), nome: 'Carlos Lima', email: 'c@x.com' }); const uidC = await ev(C, () => S.uid);
  await esperar(A, u => S.amigos.has(u[0]) && S.amigos.has(u[1]), [uidB, uidC]);
  // menção: Bia posta; Pedro comenta citando Carlos (que não vê o post da Bia)
  await ev(B, async () => { await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Meu post', fotos: [], estilo: { v: 2 } }); await pubCarregar() });
  await ev(A, () => go('feed')); await sleep(300); await ev(A, () => pubCarregar()); await sleep(1500);
  const pid = await ev(A, () => 'u:' + PUB.itens.find(x => x.tipo === 'post').id);
  ok(await ev(A, () => { const s = mencionados('Oi @Carlos Lima e @Carlos'); return s.length === 1 }), '"@Carlos Lima" não marca também outro "Carlos"');
  await ev(A, p => { window.__T = []; const t = toast; toast = function (m) { window.__T.push(m); return t.apply(this, arguments) }; openComments(p) }, pid); await sleep(400);
  await A.fill('#ctext', 'Olha isso @Carlos Lima'); await ev(A, () => document.querySelector('#cform').requestSubmit()); await sleep(2500);
  ok(await ev(A, () => window.__T.some(m => /Carlos não consegue abrir este post/.test(m))), 'menção a quem não vê o post: avisa e não manda', await ev(A, () => window.__T));
  await ev(C, () => go('msgs')); await sleep(800); ok(await ev(C, () => !S.msgsIn.some(m => m.tipo === 'mencao')), 'Carlos não recebe a menção (nem o texto do comentário)');
  await ev(A, () => closeLayer()); await sleep(300);
  // convite aberto por quem já é membro: Bia abre o link do Carlos
  const lc = await convite(C); await B.goto(lc); await esperar(B, () => S.membro && S.amigosOk, null, 8000); await sleep(3500);
  ok(await ev(B, u => S.amigos.has(u), uidC), 'Bia (já membro) abre o convite do Carlos e viram amigos');
  // links nas Conversas
  await ev(A, u => dmEnviar(u, { texto: 'veja https://www.gov.br/tse?a=1&b=2. ok' }), uidB); await sleep(1200);
  await ev(B, () => go('msgs')); await sleep(600); await ev(B, () => { const t = document.querySelector('[data-thread]'); t && t.click() }); await sleep(900);
  ok(await ev(B, () => { const a = document.querySelector('.thread a.dm-link, a.dm-link'); return a && a.href === 'https://www.gov.br/tse?a=1&b=2' && a.target === '_blank' }), 'link na mensagem vira tocável (sem o ponto final)');
  // marcas seguem a foto
  await ev(A, () => { go('feed'); scrollTo(0, 0) }); await sleep(300); await clk(A, '#b-criar'); await sleep(300); await A.setInputFiles('#ce-pfile', [F1, F2, F3]); await esperar(A, () => ED.po.fotos.length === 3, null, 5000);
  await ev(A, u => { const P = ED.po; P.tags = [{ u, i: 1, f: P.fotos[1], x: .5, y: .5 }]; P.fotos.splice(0, 1); P.cur = 0; edDesenha() }, uidB); await sleep(200);
  await clk(A, '[data-edav]'); await sleep(300); await clk(A, '[data-edav]'); await sleep(300); await clk(A, '[data-edpubpo]'); await esperar(A, () => !ED, null, 15000); await sleep(600);
  ok(await ev(A, u => { const x = PUB.itens.find(y => y.tipo === 'post' && y.autor === S.uid && y.fotos.length === 2); return x && x.estilo.tags.length === 1 && x.estilo.tags[0].i === 0 && x.estilo.tags[0].u === u }, uidB), 'marca da foto 2 vai junto quando a foto 1 sai');
  ok(!A._erros.length && !B._erros.length && !C._erros.length, 'sem erros ' + A._erros.concat(B._erros, C._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa67: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
