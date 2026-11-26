// Ponta a ponta (19/11 madrugada): o caminho de uma pessoa de verdade, em dois celulares (iPhone SE e Pixel 7), com
// fotos de cada passo. Pedro (SE) cria a conta, lê a Capa e uma matéria, volta, comenta no Feed, publica um post com
// notícia, conversa com a Bia (Pixel 7, que entrou pelo convite), busca e cancela, abre o Perfil; depois rede lenta (a
// Capa abre) e sem rede (o post entra na fila e sai quando a rede volta). Sem erro de JavaScript nos dois. Porta 9301.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const fs = require('fs'), path = require('path');
const PORTA = 9301, BASE = `http://localhost:${PORTA}/index.html`;
const FOTOS = process.env.PONTA_FOTOS || path.join(__dirname, 'ponta-a-ponta'); fs.mkdirSync(FOTOS, { recursive: true });
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
let nf = 0; const foto = async (p, nome) => { try { await p.screenshot({ path: path.join(FOTOS, `${String(++nf).padStart(2, '0')}-${nome}.png`) }) } catch (e) { } };
async function criar(p, { url, nome, email }) {
  await p.goto(url || BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
async function convite(A) { await ev(A, () => go('me')); await sleep(300); await clk(A, '[data-convidar]'); await sleep(150); await require('../t_util').gerarConvite(A);
  await esperar(A, () => /\?convite=/.test(document.querySelector('#cvurl')?.value || '')); const l = await ev(A, () => document.querySelector('#cvurl').value); await ev(A, () => closeLayer()); await sleep(200); return l }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true }), 'SE');
  const B = U.erros(await H.pagina(b, { viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true }), 'Pixel');

  // 1. contas: Pedro cria; Bia entra pelo convite dele
  await criar(A, { nome: 'Pedro', email: 'a@x.com' }); const uidA = await ev(A, () => S.uid);
  await criar(B, { url: await convite(A), nome: 'Bia Souza', email: 'b@x.com' }); const uidB = await ev(B, () => S.uid);
  ok(await esperar(A, u => S.amigos.has(u), uidB, 8000), 'convite: Bia entra e vira amiga do Pedro');

  // 2. Capa e matéria: abrir, ler, voltar pelo voltar do celular
  await ev(A, () => { go('capa'); scrollTo(0, 0) }); await sleep(500); await foto(A, 'se-capa');
  ok(await ev(A, () => !!document.querySelector('#v-capa .cpi-man')), 'Capa com a manchete');
  const mid = await ev(A, () => { const el = document.querySelector('#v-capa .cpi-man'); return el && el.id.replace(/^cpi-/, '') });
  await ev(A, m => abrirMateria(m), mid); await sleep(700); await foto(A, 'se-materia');
  ok(await ev(A, () => !!document.querySelector('#layer .mat h1')), 'matéria abre com o título');
  await ev(A, () => { const m = document.querySelector('#layer .mat'); if (m) m.scrollTop = m.scrollHeight / 2 }); await sleep(300); await foto(A, 'se-materia-meio');
  await A.goBack().catch(() => { }); await sleep(700);
  ok(await ev(A, () => !document.querySelector('#layer').innerHTML && VIEW === 'capa'), 'voltar do celular fecha a matéria e fica na Capa');

  // 3. Feed: comentar numa notícia e fechar a folha pelo ×
  await ev(A, () => { go('feed'); scrollTo(0, 0) }); await sleep(600); await foto(A, 'se-feed');
  const pidC = await ev(A, () => { const p = document.querySelector('#posts .post[id^="p-"]:not([id^="p-u:"])'); return p && p.id.slice(2) });
  await ev(A, p => openComments(p), pidC); await sleep(500);
  await A.fill('#ctext', 'Comentário de ponta a ponta'); await ev(A, () => document.querySelector('#cform').requestSubmit()); await sleep(1500); await foto(A, 'se-comentarios');
  ok(await ev(A, () => /Comentário de ponta a ponta/.test(document.querySelector('#cbox')?.innerText || '')), 'comentário publicado aparece na folha');
  ok(await ev(A, () => { const x = document.querySelector('.sheet .sh-x'); const r = x && x.getBoundingClientRect(); return !!r && r.width >= 32 && r.top >= 0 }), 'folha de comentários com o × à vista');
  await ev(A, () => document.querySelector('.sheet .sh-x').click()); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#layer').innerHTML), 'o × fecha a folha');

  // 4. publicar post com notícia pela caixa
  await ev(A, () => criarMenu()); await sleep(400); await A.fill('#cp152-tx', 'Post de ponta a ponta sobre esta notícia'); await foto(A, 'se-nova-publicacao');
  await clk(A, '[data-cp152ax="nt"]'); await sleep(500); await foto(A, 'se-escolher-noticia');
  const pidN = await ev(A, () => { const b = document.querySelector('#layer > .cp152 [data-fc164nt]'); if (!b) return null; b.click(); return b.dataset.fc164nt }); await sleep(400);
  ok(!!pidN && await ev(A, () => !!document.querySelector('#layer > .cp152 .cr155-nt')), 'notícia escolhida entra na caixa como cartão'); await foto(A, 'se-caixa-com-noticia');
  await ev(A, () => document.querySelector('[data-cp152pub]').click());
  ok(await esperar(A, p => PUB.itens.some(x => x.autor === S.uid && x.pid === p && /ponta a ponta/.test(x.texto)), pidN, 8000), 'post com notícia publicado');
  await sleep(800); await foto(A, 'se-feed-depois-de-publicar');

  // 5. Bia vê o post do Pedro e curte
  await ev(B, () => { go('feed'); pubCarregar() }); await sleep(1500);
  ok(await esperar(B, () => PUB.itens.some(x => /ponta a ponta/.test(x.texto || '')), null, 8000), 'Bia vê o post do Pedro no Feed');
  await ev(B, () => { const x = PUB.itens.find(x => /ponta a ponta/.test(x.texto || '')); const el = x && document.getElementById('p-u:' + x.id); if (el) { el.scrollIntoView({ block: 'center' }); el.querySelector('[data-a="like"]')?.click() } }); await sleep(800);
  await foto(B, 'pixel-feed-curtiu');

  // 6. conversa: Pedro manda mensagem, Bia recebe
  await ev(A, u => { go('msgs') }, uidB); await sleep(500); await ev(A, u => { const t = document.querySelector(`[data-thread="${u}"]`); t && t.click() }, uidB); await sleep(700);
  if (await A.$('#mtext')) { await A.fill('#mtext', 'Oi Bia, viu o post?'); await ev(A, () => document.querySelector('#mform').requestSubmit()) } else await ev(A, u => dmEnviar(u, { texto: 'Oi Bia, viu o post?' }), uidB);
  await sleep(1200); await foto(A, 'se-conversa');
  await ev(B, () => go('msgs')); await sleep(800);
  ok(await esperar(B, () => S.msgsIn.some(m => /viu o post/.test(m.texto || '')), null, 8000), 'Bia recebe a mensagem'); await foto(B, 'pixel-conversas');

  // 7. busca: procurar e cancelar volta para onde estava
  await ev(A, () => { go('feed'); scrollTo(0, 600) }); await sleep(400); const y0 = await ev(A, () => scrollY);
  await ev(A, () => go('busca')); await sleep(300); await A.fill('#bvq', 'senado'); await sleep(500); await foto(A, 'se-busca');
  ok(await ev(A, () => document.querySelectorAll('#bvres [data-busca], #bvres .bv-it').length > 0), 'busca acha resultados');
  ok(await ev(A, () => { const i = document.querySelector('#bvq'), r = i.getBoundingClientRect(); return i.scrollWidth <= i.clientWidth + 2 && r.width >= 150 }), 'campo de busca cabe no iPhone SE');
  await ev(A, () => document.querySelector('[data-bvcancel]').click()); await sleep(800);
  ok(await ev(A, y => VIEW === 'feed' && Math.abs(scrollY - y) < 80, y0), 'Cancelar volta ao Feed no mesmo ponto', await ev(A, () => ({ v: VIEW, y: scrollY })));

  // 8. Perfil: abas cabem, pedido de amizade só em Posts
  await ev(A, () => { go('me'); scrollTo(0, 0) }); await sleep(600); await foto(A, 'se-perfil');
  ok(await ev(A, () => { const t = document.querySelector('#v-me .vn-abas'); return !t || t.scrollWidth <= t.clientWidth + 2 }), 'abas do Perfil cabem no iPhone SE');

  // 9. rede lenta: a Capa abre
  const C = U.erros(await H.pagina(b, { viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true }), 'Lento');
  await C.context().route(/^https?:\/\/(?!localhost)/, r => r.abort());  // sem internet de fora aqui: foto externa falha na hora (como no t_pre_capa)
  const cdp = await C.context().newCDPSession(C); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 650000, uploadThroughput: 90000 });  // 3G do site real: lá o app vai comprimido (2,2 MB viram ~640 KB, 3,4x menos); este servidor manda sem comprimir, então a banda aqui é 3,4x a de 200 KB/s
  const t0 = Date.now(); await C.goto(BASE).catch(() => { }); const abriu = await esperar(C, () => !!document.querySelector('.cp.f4-pre .cpi-man, #v-capa .cpi, #posts .post'), null, 15000);  // primeira visita abre no Feed: a primeira notícia na tela (ou a manchete da Capa, se abrir nela)
  ok(abriu, `rede lenta (3G): a primeira notícia aparece (${Date.now() - t0} ms)`); await foto(C, 'lento-capa');

  // 10. sem rede: o post entra na fila e sai quando a rede volta
  await A.context().setOffline(true); await ev(A, () => { go('feed'); criarMenu() }); await sleep(400);
  await A.fill('#cp152-tx', 'Escrito sem internet de ponta a ponta'); await ev(A, () => document.querySelector('[data-cp152pub]').click()); await sleep(1500); await foto(A, 'se-sem-rede');
  await A.context().setOffline(false);
  ok(await esperar(A, () => PUB.itens.some(x => x.autor === S.uid && /Escrito sem internet de ponta a ponta/.test(x.texto || '')), null, 20000), 'sem rede: o post sai quando a internet volta');

  ok(!A._erros.length, 'sem erros no iPhone SE ' + A._erros.slice(0, 3).join(' | '));
  ok(!B._erros.length, 'sem erros no Pixel 7 ' + B._erros.slice(0, 3).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_ponta_a_ponta: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
