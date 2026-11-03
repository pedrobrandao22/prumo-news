// Cenário comum do "visual novo" (112): Pedro (A) e Bia (B), amigos, com as flags de produção; posts, comentário de notícia, story.
// Usado por t_visual_novo.js e pelas capturas do comparativo (_vn_capturas.js).
const U = require('../t_util'); const { sleep, esperar } = U;
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const FOTO = __dirname + '/etapa13/foto.jpg';
async function flags(P, vn, extra) { await P.addInitScript(([vn, extra]) => { try { for (const k of ['foco', 'semreels', 'capa', 'anim']) localStorage.setItem('prumo-teste-' + k, '1'); if (vn) localStorage.setItem('prumo-teste-visual', '1'); if (extra) extra.forEach(([k, v]) => localStorage.setItem(k, v)) } catch (e) { } }, [vn, extra || null]) }
async function criar(p, BASE, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => !!document.querySelector('[data-entrar],#lnome'), null, 10000); await sleep(600);
  if (!(await p.$('#lnome:visible'))) { await ev(p, () => document.querySelector('[data-entrar]').click()); await sleep(400); if (await p.$('[data-laba="criar"]')) await ev(p, () => document.querySelector('[data-laba="criar"]').click()); await sleep(300) }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(1000); await ev(p, () => { if (document.querySelector('#layer').innerHTML) closeLayer() }); await sleep(300) }
async function convite(A) { await ev(A, () => go('me')); await sleep(400); await clk(A, '[data-convidar]'); await sleep(200); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); return l }
const ins = (P, rows) => ev(P, async rows => { const ids = []; for (const r of rows) { const q = await SB.from('publicacoes').insert({ autor: S.uid, ...r }).select('id'); ids.push(q.data && q.data[0] && q.data[0].id) } await pubCarregar(); return ids }, rows);
async function cenario(PORTA, o = {}) {
  const BASE = `http://localhost:${PORTA}/index.html`;
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const vp = o.viewport || { width: 390, height: 844 };
  const A = U.erros(await H.pagina(b, { viewport: vp, dark: !!o.escuro }), 'A'), B = U.erros(await H.pagina(b, { viewport: vp, dark: !!o.escuro }), 'B');
  for (const P of [A, B]) await flags(P, o.vn, o.extra);
  await criar(A, BASE, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await criar(B, BASE, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' });
  const uidA = await ev(A, () => S.uid), uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB, 8000);
  for (const P of [A, B]) { await ev(P, () => go('feed')); await esperar(P, () => PUB.on === true, null, 8000) }
  const ids = await ev(A, () => { const { man, dest } = capaEscolha(); const l = ordenadas(visiveis()).map(p => p.id); return { m: man.id, d: (dest || []).map(p => p.id), outra: l.find(x => x !== man.id && !(dest || []).some(p => p.id === x)) } });
  const now = Date.now();
  if (!o.vazio) {
    await ins(B, [{ tipo: 'post', at: now - 40 * 60e3, texto: 'Acho que vai ser decidido no detalhe, e o Senado ainda pode mudar tudo.', fotos: [], pid: ids.m, estilo: { v: 2, cn: { v: 1, k: 'nt' } } },
      { tipo: 'post', at: now - 30 * 60e3, texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro e o investimento espera.', fotos: [], estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo', fu: 'bcb.gov.br' } } },
      { tipo: 'story', at: now - 10 * 60e3, expira: now + 20 * 3600e3, texto: 'Notícia', fotos: [], pid: ids.m, estilo: { v: 2, fundo: 13, itens: [{ t: 'nt', pid: ids.m, x: .5, y: .5, s: 1, r: 0 }] } }]);
    await ins(A, [{ tipo: 'post', at: now - 20 * 60e3, texto: 'Fila no posto desde cedo. Organização boa, mas faltam senhas.', fotos: [], estilo: { v: 2 } }]);
  }
  for (const P of [A, B]) await ev(P, async () => { await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); scrollTo(0, 0) });
  await sleep(800);
  return { H, b, A, B, srv, uidA, uidB, ids, BASE, ins, now };
}
module.exports = { cenario, clk, ev, sleep, esperar, U, ins, FOTO };
