// Exploração visual (antes/depois): node review2/_foco_explora.js <prefixo> <foco 0|1>
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8941/index.html'; const PAIS = __dirname + '/ig3/paisagem.jpg';
const PRE = process.env.FOCO_PRE || 'antes', FOCO = process.env.FOCO_ON === '1';
const SH = __dirname + '/../qa/foco/'; require('fs').mkdirSync(SH, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const shot = async (p, nome) => { await sleep(350); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: SH + PRE + '-' + nome + '.png' }) };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const fecha = p => ev(p, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8941); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  for (const P of [A, B]) await P.addInitScript(f => { localStorage.setItem('prumo-teste-semreels', '1'); if (f) localStorage.setItem('prumo-teste-foco', '1') }, FOCO);
  await criar(A, { nome: 'Pedro Brandão', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(800);
  await shot(A, '01-feed');
  // story: câmera
  await ev(A, () => criarAbrir('story')); await sleep(900); await shot(A, '02-story-camera');
  // Criar (texto)
  await clk(A, '[data-edcriar]'); await sleep(500); await shot(A, '03-story-criar-texto');
  await A.keyboard.type('Câmara aprova reforma tributária em segundo turno'); await sleep(200); await shot(A, '04-story-texto-digitando');
  await ev(A, () => edTextoOk()); await sleep(300); await shot(A, '05-story-texto-pronto');
  await clk(A, '.ce-top [data-edfig]'); await sleep(500); await shot(A, '06-story-bandeja');
  await ev(A, () => { const c = document.querySelector('.ce-fig .fg2-chips,.ce-fig'); const s = document.querySelector('.ce-fig .ce-figp,.ce-fig > div'); if (s) s.scrollTop = 9999 }); await sleep(200); await shot(A, '07-story-bandeja-fim');
  await ev(A, () => document.querySelector('.ce-fig')?.remove());
  // desenho
  if (await A.$('#layer [data-edcaneta]')) { await clk(A, '#layer [data-edcaneta]'); await sleep(400); await shot(A, '08-story-desenho'); await ev(A, () => document.querySelector('[data-edcnok]')?.click()); await sleep(200) }
  await fecha(A); await sleep(300);
  // Layout
  await ev(A, () => criarAbrir('story')); await sleep(700);
  if (await A.$('[data-edlayout]')) { await clk(A, '[data-edlayout]'); await sleep(500); await shot(A, '09-story-layout') }
  await fecha(A); await sleep(300);
  // post: começo
  await ev(A, () => criarAbrir('post')); await sleep(700); await shot(A, '10-post-inicio');
  await clk(A, '[data-cn102ini="rel"]').catch(() => {}); await sleep(500); await shot(A, '11-post-relato');
  await fecha(A); await sleep(300);
  await ev(A, () => criarAbrir('post')); await sleep(500); await clk(A, '[data-cn102ini="ana"]'); await sleep(500); await shot(A, '12-post-analise');
  await fecha(A); await sleep(300);
  // matéria aberta
  await ev(A, () => { const p = ordenadas(visiveis())[0]; abrirMateria(p.id) }).catch(() => {}); await sleep(700); await shot(A, '13-materia');
  await ev(A, () => closeLayer()); await sleep(300);
  // B publica um story com texto, A vê
  await ev(B, () => go('feed')); await esperar(B, () => PUB.on === true, null, 8000);
  await ev(B, () => criarAbrir('story')); await sleep(600); await clk(B, '[data-edcriar]'); await sleep(300); await B.keyboard.type('Fila enorme no posto da Av. Brasil hoje cedo'); await ev(B, () => edTextoOk()); await sleep(200);
  const n0 = await ev(B, () => PUB.itens.length); await clk(B, '[data-edpubst="amigos"]').catch(() => ev(B, () => document.querySelector('[data-edpubst],[data-edenviar]')?.click())); await esperar(B, n => !ED && !PQ.atual && PUB.itens.length > n, n0, 20000); await sleep(600);
  await ev(A, () => pubCarregar()); await sleep(1500); await ev(A, () => go('feed')); await sleep(500); await shot(A, '14-feed-com-story');
  await ev(A, () => document.querySelector('#secs [data-ustory],#secs .st-b,#secs button')?.click()); await sleep(1200); await shot(A, '15-ver-story');
  await ev(A, () => closeLayer()); await sleep(300);
  // sua semana
  await ev(A, () => { try { semAbrir() } catch (e) { console.log('DBG sem ' + e.message) } }); await sleep(800); await shot(A, '16-sua-semana');
  await ev(A, () => closeLayer()); await sleep(300);
  await ev(A, () => go('me')); await sleep(700); await shot(A, '17-perfil');
  await ev(A, () => go('capa')); await sleep(700); await shot(A, '18-capa');
  console.log('erros A', A._erros.join(' | '), 'B', B._erros.join(' | '));
  await b.close(); srv.kill(); process.exit(0);
})().catch(e => { console.error(e); process.exit(1) });
