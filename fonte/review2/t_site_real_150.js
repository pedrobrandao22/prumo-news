// Correções do teste no site real (150, 13/11): link de notícia abrindo no Feed, visitante que toca em comentar ou em Enviar,
// convite para quem já tem conta, círculos do topo sem a mesma notícia duas vezes, botão de leitura só com ícone,
// "Atualizações de hoje" com os horários certos e sem bastidor, "Outros" fora do rótulo. Porta 8737.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const path = require('path'); const fs = require('fs');
const { montarPasta, PROD } = require('./_qc_comum');
let srv = null;
(async () => {
  const { DIR, F } = montarPasta('xsr150');
  // rodadas com bastidor, para conferir o que o leitor vê
  fs.writeFileSync(path.join(DIR, 'rodadas.json'), JSON.stringify({ dia: new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), itens: {
    '19h48': { tipo: 'rapida', status: 'ok', pautas: 33, mudancas: 2, checagem: '0 erros, 12 avisos', nota: 'Fechamento semanal do dólar e nova pauta sobre os voos nos EUA.' },
    '13h48': { tipo: 'rapida', status: 'sem_mudancas', checagem: '0 erros, 9 avisos', nota: 'Acionada por ajuste-fiscal-lula-4; as buscas não trouxeram a matéria.' } } }));
  srv = U.servir('xsr150', 8737); await sleep(800);
  const H = await require('../harness').criar();
  const br = await U.navegador();
  const BASE = 'http://localhost:8737/index.html';
  const P = F.pautas[3];
  const abre = async (o = {}) => { const p = U.erros(await H.pagina(br, Object.assign({ viewport: { width: 390, height: 800 }, ctx: { deviceScaleFactor: 1, isMobile: true, hasTouch: true } }, o.sessao ? { sessao: o.sessao } : {})), o.nome || 'v');
    await p.addInitScript(o.capa === false ? () => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1'); localStorage.setItem('prumo-teste-tour', '1') } catch (e) { } } : PROD);
    await p.goto(BASE + (o.q || '')); await esperar(p, () => typeof VIEW !== 'undefined' && FEED && FEED.pautas && INIT_FIM, null, 20000); return p };

  // 1. link de notícia com o app abrindo no Feed
  let v = await abre({ q: '#m=' + P.id, capa: false, nome: 'link' });
  ok(await esperar(v, id => { const m = document.querySelector('#layer .mat'); return !!m && FEED && !!pautaById(id) }, P.id, 10000), 'link de notícia abre a matéria mesmo quando o app abre no Feed', await v.evaluate(() => ({ VIEW, L: typeof LINK_PID !== 'undefined' ? LINK_PID : '?' })));
  await v.close();

  // 2. visitante: tocar no campo de comentário abre o entrar dizendo por quê, antes de digitar
  v = await abre({ nome: 'vis' });
  await v.evaluate(() => { go('feed'); scrollTo(0, 0) }); await sleep(800);
  await v.evaluate(() => document.querySelector('#v-feed .post [data-a="cmt"]').click()); await sleep(900);
  const campo = await v.evaluate(() => { const t = [...document.querySelectorAll('textarea,input')].find(e => e.getClientRects().length && /^Escreva um comentário/.test(e.placeholder)); if (!t) return false; t.focus(); return true });
  if (campo) { ok(await esperar(v, () => /Para comentar, entre na sua conta/.test((document.querySelector('.pc106') || {}).textContent || ''), null, 4000), 'visitante que toca em comentar: entrar com o motivo, antes de digitar') }
  else ok(await esperar(v, () => /Para comentar|Entrar no Prumo/.test(document.body.innerText), null, 3000), 'visitante que toca em comentar vai para o entrar');
  await v.evaluate(() => { closeLayer(); closeLayer() }); await sleep(500);

  // 3. visitante: Enviar numa notícia abre "Mandar notícia"
  await v.evaluate(() => document.querySelector('#v-feed .post [data-a="send"]').click());
  ok(await esperar(v, () => /Mandar notícia/.test((document.querySelector('.sheet') || {}).textContent || '') && !!document.querySelector('[data-envwa]'), null, 4000), 'visitante: Enviar abre Mandar notícia (WhatsApp, outros apps, copiar)');
  await v.evaluate(() => { closeLayer(); closeLayer() }); await sleep(400);

  // 4. círculos do topo: nenhuma notícia em dois círculos
  const circ = await v.evaluate(() => { const r = []; try { SR150_USADAS = new Set(); document.querySelectorAll('#secs [data-5min], #secs [data-sec-story]').forEach(b => { const s = b.hasAttribute('data-5min') ? '_5min' : b.dataset.secStory; const a = vn112Primeira(s); r.push(a && a.p && a.p.id) }) } finally { SR150_USADAS = null } return r.filter(Boolean) });
  ok(circ.length >= 3 && new Set(circ).size === circ.length, 'círculos do topo: cada um com uma notícia diferente', circ);
  const dest = await v.evaluate(() => [...document.querySelectorAll('#secs .sb[data-dest]')].filter(b => b.getClientRects().length).map(b => b.dataset.dest));
  ok(dest.every(d => !circ.includes(d)), 'destaques do topo não repetem a notícia de um círculo de editoria', { dest, circ });

  // 5. botão de leitura: só o ícone, 40 px
  await v.evaluate(() => { go('capa'); scrollTo(0, 0) }); await sleep(800);
  const lp = await v.evaluate(() => { const b = document.getElementById('lp'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), fs: getComputedStyle(b).fontSize } });
  ok(lp && lp.w <= 42 && lp.h >= 38 && lp.fs === '0px', 'botão Neutra só com o ícone (não cobre o fim das linhas)', lp);

  // 5b. miniaturas da Capa não pedem a foto grande da Wikimedia
  await v.evaluate(async () => { for (let y = 0; y < 6000; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } scrollTo(0, 0) });
  const th = await v.evaluate(() => [...document.querySelectorAll('#v-capa .cp-th img, #secs .vn-tl-art img')].map(i => i.getAttribute('src') || '').filter(u => /wikimedia/.test(u)));
  ok(th.every(u => !/\/960px-/.test(u)), 'miniaturas com a foto pequena da Wikimedia (330 px)', th.slice(0, 3));
  // 6. "Atualizações de hoje": horários certos e sem bastidor
  await v.evaluate(() => abrirRodadas()); await sleep(900);
  const rod = await v.evaluate(() => (document.querySelector('.sheet') || {}).innerText || '');
  ok(/9h48, 11h48, 13h48, 15h48, 17h48, 19h48 e 21h48/.test(rod) && !/10h48/.test(rod), 'horários das atualizações corretos', rod.slice(0, 200));
  ok(!/avisos|Acionada|ajuste-fiscal-lula-4|buscas/.test(rod) && /nova notícia sobre os voos/.test(rod) && /Nada mudou/.test(rod), 'registro sem bastidor para o leitor', rod.slice(0, 400));
  const prox = await v.evaluate(() => proximaRodadaTxt());
  ok(/(\d{1,2})h(48|52)/.test(prox) && !/(8|10|12|14|16|18|20|22|23)h48/.test(prox), 'próxima atualização numa hora real', prox);
  await v.evaluate(() => closeLayer());

  // 7. rótulo "Outros" vira a tag
  const out = await v.evaluate(() => { const p = FEED.pautas[0]; const ant = p.subtema; p.subtema = 'Outros'; const c = capaChapeu(p); p.subtema = ant; return { c, tag: p.tag } });
  ok(out.c !== 'Outros', 'chapéu da Capa não mostra "Outros"', out);
  ok(v._erros.length === 0, 'sem erros (visitante)', v._erros);
  await v.close();

  // 7b. guia da primeira visita para quem não tem conta (3 telas) e botão Instalar quando o navegador oferece
  const g = U.erros(await H.pagina(br, { viewport: { width: 390, height: 800 } }), 'guia');
  await g.addInitScript(() => { try { localStorage.setItem('prumo-teste-tourvis', '1'); for (const x of ['foco', 'semreels', 'visual', 'capa']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
  await g.goto(BASE); await esperar(g, () => typeof INIT_FIM !== 'undefined' && INIT_FIM && FEED, null, 20000);
  ok(await esperar(g, () => document.querySelectorAll('#layer .tour .tr-t').length === 3, null, 6000), 'primeira visita sem conta: guia com 3 telas', await g.evaluate(() => ({ n: document.querySelectorAll('#layer .tr-t').length, lay: document.querySelector('#layer').innerHTML.slice(0, 120), uid: S.uid, L: LINK_PID, V: VP99_LINK, C: CONVITE_URL, vis: localStorage.getItem('prumo-tour-visto'), wd: navigator.webdriver, f: localStorage.getItem('prumo-teste-tourvis') })));
  if (!(await g.evaluate(() => !!document.querySelector('#layer .tour')))) { console.log('DBG', await g.evaluate(() => { try { const _tt = tourTelas; tourTelas = () => sr150TelasVisitante(_tt); try { abrirTour('') } finally { tourTelas = _tt } return 'ok ' + document.querySelectorAll('#layer .tr-t').length } catch (e) { return 'erro ' + e.message } })); await g.close(); throw new Error('guia não abriu') }
  ok(await g.evaluate(() => /convite/.test(document.querySelector('#layer .tour').textContent)), 'o guia do visitante explica que curtir e comentar pedem convite');
  await g.evaluate(() => document.querySelector('[data-tourfim]').click()); await sleep(400);
  await g.reload(); await esperar(g, () => typeof INIT_FIM !== 'undefined' && INIT_FIM && FEED, null, 20000); await sleep(2500);
  ok(await g.evaluate(() => !document.querySelector('#layer .tour')), 'o guia aparece uma vez só');
  await g.evaluate(() => { const ev = new Event('beforeinstallprompt'); ev.prompt = async () => { }; ev.userChoice = Promise.resolve({ outcome: 'dismissed' }); dispatchEvent(ev); abrirTour('') }); await sleep(500);
  ok(await g.evaluate(() => !!document.querySelector('#layer .tr-t:last-child [data-sr150inst]')), 'guia: botão Instalar na tela de usar como app (quando o navegador oferece)');
  await g.evaluate(() => closeLayer()); await sleep(300);
  await g.evaluate(() => { const ev = new Event('beforeinstallprompt'); ev.prompt = async () => { window.__pediu = 1 }; ev.userChoice = Promise.resolve({ outcome: 'accepted' }); dispatchEvent(ev); go('me') }); await sleep(800);
  await g.evaluate(() => { document.querySelector('#v-me [data-vnpfaba="conta"]')?.click(); renderMe() }); await sleep(500);
  const inst = await g.evaluate(() => !!document.querySelector('[data-sr150inst]'));
  ok(inst, 'Perfil: botão Instalar o Prumo quando o navegador oferece');
  if (inst) { await g.evaluate(() => document.querySelector('[data-sr150inst]').click()); await sleep(400); ok(await g.evaluate(() => window.__pediu === 1 && !document.querySelector('[data-sr150inst]')), 'tocar em Instalar abre o pedido do navegador e o botão sai') }
  ok(g._erros.length === 0, 'sem erros (guia e instalar)', g._erros); await g.close();

  // 8. quem já tem conta e chega pelo link de convite: depois de entrar, "Usar um convite" com o código
  const uid = await H.criarConta('ja@x', '123456');
  const w = await abre({ q: '?convite=ABCD2345', sessao: { user: { id: uid, email: 'ja@x' } }, nome: 'conv' });
  ok(await esperar(w, () => { const c = document.querySelector('#fcod'); return !!c && c.value === 'ABCD2345' }, null, 8000), 'conta sem convite + link de convite: abre Usar um convite com o código', await w.evaluate(() => [...document.querySelectorAll('.sheet h2')].map(e => e.textContent)));
  ok(w._erros.length === 0, 'sem erros (convite)', w._erros);

  await br.close(); srv.kill(); fs.rmSync(DIR, { recursive: true, force: true });
  const R = U.resumo(); console.log(`RESUMO t_site_real_150: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
