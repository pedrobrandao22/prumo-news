// Etapa 62: post completo (grade numerada, intensidade, girar/endireitar, ajustes, marcas, alt, comentários/curtidas, rascunho)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8772/index.html'; const F1 = __dirname + '/etapa13/foto.jpg', F2 = __dirname + '/../qa2/f2.jpg', F3 = __dirname + '/../qa2/f3.jpg';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
const SH = __dirname + '/../review3/var/';
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
const slide = (p, k, v) => ev(p, ([k, v]) => { const r = document.querySelector(`[data-edaj2="${k}"]`); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })) }, [k, v]);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8772); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A'), B = U.erros(await H.pagina(b), 'B');
  await criar(A, { nome: 'Pedro', email: 'a@x.com' });
  await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await clk(A, '[data-gerarconvite]'); await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || ''));
  const link = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer());
  await criar(B, { url: link, nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid); await esperar(A, u => S.amigos.has(u), uidB);
  await ev(A, () => go('feed')); await esperar(A, () => PUB.on === true, null, 8000); await sleep(400);
  // grade numerada
  await clk(A, '#b-criar'); await sleep(300); await A.setInputFiles('#ce-pfile', [F1, F2, F3]); await esperar(A, () => ED.po.fotos.length === 3, null, 5000); await sleep(300);
  ok(await ev(A, () => ED.po.multi && [...document.querySelectorAll('.ce-num.on')].map(x => x.textContent).join() === '1,2,3'), '3 fotos escolhidas aparecem numeradas 1, 2, 3');
  await clk(A, '[data-edrolo="2"]'); await sleep(150); await clk(A, '[data-edrolo="2"]'); await sleep(150); await clk(A, '[data-edrolo="0"]'); await sleep(150); await clk(A, '[data-edrolo="0"]'); await sleep(150); await clk(A, '[data-edrolo="2"]'); await sleep(150); await clk(A, '[data-edrolo="0"]'); await sleep(200);
  ok(await ev(A, () => ED.po.fotos.map(f => ED.po.rolo.indexOf(f)).join() === '1,2,0'), 'tirar e repor muda a ordem (2, 3, 1)');
  await A.screenshot({ path: SH + 'po62-grade.png' });
  await clk(A, '[data-edav]'); await sleep(300);
  // intensidade
  await clk(A, '[data-edflt="aden"]'); await sleep(150); await clk(A, '[data-edflt="aden"]'); await sleep(200);
  ok(await ev(A, () => !!document.querySelector('.ce-fi [data-edaj2="fi"]')), 'tocar de novo no filtro abre a intensidade');
  await slide(A, 'fi', 40); await clk(A, '[data-edfiok]'); await sleep(150);
  // ajustes
  await clk(A, '[data-edaba="editar"]'); await sleep(200); await clk(A, '[data-edgira]'); await sleep(200); await slide(A, 'str', 8);
  for (const [k, v] of [['h', 30], ['sh', -20], ['fd', 40], ['v', 60], ['n', 50]]) await slide(A, k, v); await sleep(300);
  ok(await ev(A, () => { const f = ED.po.fotos[ED.po.cur]; return f.fi === 40 && f.rot === 1 && f.str === 8 && f.aj.v === 60 && f.aj.n === 50 && !!f.rimg }), 'intensidade 40, girar 90°, endireitar 8°, realce, sombras, esmaecer, vinheta e nitidez');
  await A.screenshot({ path: SH + 'po62-editar.png' });
  await clk(A, '[data-edav]'); await sleep(300);
  // detalhes: marcar na foto, avançado
  await A.fill('#ce-leg', 'Fim de semana'); await clk(A, '[data-edtags]'); await sleep(300);
  { const r = await ev(A, () => { const b = document.querySelector('#ce-tgb').getBoundingClientRect(); return { x: b.x + b.width * .3, y: b.y + b.height * .4 } }); await A.mouse.click(r.x, r.y) } await sleep(300); await clk(A, '[data-edtagu]'); await sleep(300); await clk(A, '[data-edtagok]'); await sleep(200);
  await clk(A, '[data-edavanc]'); await sleep(200); await clk(A, '[data-edsw="semCurt"]'); await clk(A, '[data-edsw="semCom"]'); await A.fill('[data-edalt="0"]', 'Praia ao pôr do sol'); await sleep(100);
  await A.screenshot({ path: SH + 'po62-det.png' });
  // fechar → salvar rascunho → reabrir
  await clk(A, '[data-edvolta]'); await sleep(200); await clk(A, '[data-edvolta]'); await sleep(200); await clk(A, '[data-edfechar]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('.ce-sair [data-edrsalva]')), 'fechar pergunta se quer salvar rascunho');
  await clk(A, '[data-edrsalva]'); await sleep(800); ok(await ev(A, () => !ED && !document.querySelector('#layer .ce')), 'rascunho salvo e criador fechado');
  await clk(A, '#b-criar'); await sleep(600); ok(await ev(A, () => /Rascunhos \(1\)/.test(document.querySelector('[data-edrascs]')?.textContent || '')), 'criador mostra Rascunhos (1)');
  await clk(A, '[data-edrascs]'); await sleep(300); await clk(A, '[data-edrasc]'); await sleep(1200);
  ok(await ev(A, () => { const P = ED.po; return P.fotos.length === 3 && P.texto === 'Fim de semana' && P.tags.length === 1 && P.semCom && P.semCurt && P.fotos[0].alt === 'Praia ao pôr do sol' && P.fotos.some(f => f.rot === 1 && f.fi === 40 && f.aj.v === 60) }), 'rascunho volta com fotos, edição, legenda, marcas e opções');
  await clk(A, '[data-edav]'); await sleep(300); await clk(A, '[data-edav]'); await sleep(300); await clk(A, '[data-edpubpo]'); await esperar(A, () => !ED, null, 15000); await sleep(800);
  ok(await ev(A, async () => { const x = PUB.itens.find(y => y.tipo === 'post'); return x && x.fotos.length === 3 && x.estilo.tags.length === 1 && x.estilo.semCom && (await rascLista()).length === 0 }), 'post publicado e rascunho apagado');
  // B vê
  await ev(B, () => go('feed')); await sleep(300); await ev(B, () => pubCarregar()); await sleep(1500);
  await ev(B, () => document.querySelector('#posts .upost').scrollIntoView({ block: 'start' })); await sleep(500);
  ok(await ev(B, () => { const p = document.querySelector('#posts .upost'); return p.classList.contains('sem-com') && p.classList.contains('sem-curt') && p.querySelector('img.up-img').alt === 'Praia ao pôr do sol' && !!p.querySelector('[data-uptags]') }), 'Feed: sem comentários, curtidas ocultas, texto alternativo e ícone de marcas');
  await clk(B, '#posts .upost [data-uptags]'); await sleep(300); ok(await ev(B, () => document.querySelector('#posts .upost').classList.contains('tags-on') && /Bia Souza/.test(document.querySelector('.up-tg').textContent)), 'tocar no ícone mostra quem está marcado');
  await B.screenshot({ path: SH + 'po62-feedB.png' });
  ok(await ev(B, () => S.msgsIn.some(m => m.tipo === 'mencao' && m.snap && m.snap.upub)), 'marcada recebe aviso nas Conversas');
  ok(!A._erros.length && !B._erros.length, 'sem erros ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa62: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
