// QA da leitura e da conta (02/11): Busca abre a matéria e ordena por título, Quiz/Guardadas voltam para onde vieram,
// aviso de atraso/sem conexão na Capa, "Ver a seção" volta à Capa num toque, guia termina na Capa, letra grande,
// sair volta ao topo, linha do tempo com data futura, puxar sem internet, dica do "1 minuto".
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'); const path = require('path');
const BASE = 'http://localhost:8935/index.html';
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
const ev = (p, fn, a) => p.evaluate(fn, a);
function feedReal() {  // edição real do repositório (cai no feed de teste se não houver)
  let f; try { f = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { return U.feedFresco('site') }
  const sp = new Date(Date.now() - 12 * 60000 - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00'; f.atualizado_em = sp;
  fs.writeFileSync(path.join(__dirname, '..', 'site', 'feed.json'), JSON.stringify(f)); return f }
(async () => {
  feedReal(); const srv = U.servir('site', 8935); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b), 'A');
  await A.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-teste-tour', '1'); localStorage.setItem('prumo-teste-semreels', '1') } catch (e) { } });
  await A.goto(BASE); await esperar(A, () => typeof VIEW !== 'undefined' && VIEW === 'capa' && !!document.querySelector('#v-capa .cpi'), null, 8000);
  // conta criada pelo Perfil: o guia termina na Capa
  await A.tap('#t-me'); await sleep(300); await clk(A, '#v-me [data-entrar]'); await sleep(200); await clk(A, '[data-laba="criar"]');
  await A.fill('#lnome', 'Pedro'); await A.fill('#lemail', 'a@x.com'); await A.fill('#lsenha', '123456'); await clk(A, '#lform [type=submit]');
  ok(await esperar(A, () => !!document.querySelector('#layer .tour'), null, 8000), 'guia aparece depois de criar a conta');
  for (let i = 0; i < 6; i++) { if (!(await A.$('#layer .tour'))) break; await clk(A, '#layer .tr-prox'); await sleep(350) }
  ok(await ev(A, () => VIEW === 'capa' && !document.querySelector('#layer').innerHTML), '"Começar a ler" leva à Capa', await ev(A, () => VIEW));
  // Busca: título primeiro; tocar abre a matéria e voltar volta à Busca
  await A.tap('#t-busca'); await sleep(300); await A.fill('#bvq', 'seguranca'); await sleep(400);
  const r1 = await ev(A, () => { const l = [...document.querySelectorAll('#bvres .sres li b')].map(x => x.textContent); return l });
  ok(r1.length > 0 && /seguran/i.test(r1[0].normalize('NFD').replace(/[̀-ͯ]/g, '')), 'Busca: resultado com o termo no título vem primeiro', r1.slice(0, 3));
  await clk(A, '#bvres [data-busca]'); await sleep(700);
  ok(await ev(A, () => VIEW === 'busca' && !!document.querySelector('#layer .mat') && /Busca/.test(document.querySelector('#layer .mat-v').textContent)), 'Busca: resultado abre a matéria ("‹ Busca")');
  await A.goBack(); await sleep(500);
  ok(await ev(A, () => VIEW === 'busca' && !document.querySelector('#layer').innerHTML && $('#bvq').value === 'seguranca'), 'Busca: voltar volta à Busca com o termo');
  // Quiz aberto pela Capa volta para a Capa
  await A.tap('#t-capa'); await sleep(300);
  await ev(A, () => go('play')); await sleep(300);
  ok(await ev(A, () => /Capa/.test(document.querySelector('#v-play .vback').textContent)), 'Quiz aberto pela Capa: "‹ Capa"', await ev(A, () => document.querySelector('#v-play .vback').textContent));
  await clk(A, '#v-play .vback'); await sleep(300); ok(await ev(A, () => VIEW === 'capa'), 'tocar "‹ Capa" volta à Capa');
  await ev(A, () => go('me')); await sleep(200); await ev(A, () => go('saved')); await sleep(200);
  ok(await ev(A, () => /Perfil/.test(document.querySelector('#v-saved .vback').textContent)), 'Guardadas aberta pelo Perfil continua "‹ Perfil"');
  await A.tap('#t-capa'); await sleep(300);
  // "Ver a seção" e um voltar só
  const sec = await ev(A, () => { const b = document.querySelector('#v-capa [data-capasec]'); b.scrollIntoView({ block: 'center' }); return b.dataset.capasec }); await sleep(150);
  await clk(A, `#v-capa [data-capasec="${sec}"]`); await sleep(500);
  ok(await ev(A, s => VIEW === 'feed' && FILTRO === s, sec), 'Ver a seção abre o Feed filtrado');
  await A.goBack(); await sleep(500);
  ok(await ev(A, () => VIEW === 'capa' && FILTRO === 'tudo'), 'um voltar: Capa, sem filtro', await ev(A, () => [VIEW, FILTRO]));
  // aviso de sem conexão na Capa e some quando a internet volta
  await ev(A, () => { scrollTo(0, 0); OFFLINE = true; renderCapa() }); await sleep(200);
  ok(await ev(A, () => !!document.querySelector('#v-capa .late.offl') && /Sem conexão/.test(document.querySelector('#v-capa .late').textContent)), 'Capa mostra "Sem conexão"');
  await ev(A, () => { CHK_T = 0; return checarFeed(true) }); await sleep(400);
  ok(await ev(A, () => !document.querySelector('.late.offl') && !OFFLINE), 'internet de volta: aviso some da Capa');
  ok(await ev(A, () => { const s = estadoRadar; estadoRadar = () => ({ ok: false, txt: 'Sem atualização há 5 h. Uma rodada pode ter falhado.' }); renderCapa(); const t = (document.querySelector('#v-capa .late') || {}).textContent; estadoRadar = s; renderCapa(); return /Sem atualização há 5 h\./.test(t || '') }), 'Capa mostra "Sem atualização"');
  // puxar para atualizar sem internet não diz "Em dia"
  await A.context().setOffline(true); await ev(A, () => scrollTo(0, 0)); await sleep(200);
  const cdp = await A.context().newCDPSession(A);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 200 }] });
  for (let y = 200; y <= 540; y += 20) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] }); await sleep(16) }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok(await esperar(A, () => /Sem conexão|Em dia/.test(document.querySelector('.ptr2-t')?.textContent || ''), null, 4000) && await ev(A, () => document.querySelector('.ptr2-t').textContent === 'Sem conexão'), 'puxar sem internet: "Sem conexão"', await ev(A, () => document.querySelector('.ptr2-t')?.textContent));
  await A.context().setOffline(false); await sleep(1200);
  // linha do tempo: data futura não é o ponto atual
  const tl = await ev(A, () => { const dm = d => { const x = new Date(hojeSP() + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + d); return String(x.getUTCDate()).padStart(2, '0') + '/' + String(x.getUTCMonth() + 1).padStart(2, '0') };
    const h = matTempo({ visuais: [{ tipo: 'linha_do_tempo', itens: [{ quando: dm(-3), texto: 'a' }, { quando: dm(-1), texto: 'b' }, { quando: dm(1), texto: 'c' }] }] });
    const t = document.createElement('div'); t.innerHTML = h; return [...t.querySelectorAll('li')].map(l => l.className) });
  ok(JSON.stringify(tl) === JSON.stringify(['', 'ult', 'fut']), 'linha do tempo: amanhã tracejado, ontem é o atual', tl);
  // letra grande: título nunca menor que o subtítulo na Capa
  const fz = await ev(A, () => { PREF.fonte = 1.4; aplicarFonte(); renderCapa(); const r = [...document.querySelectorAll('#v-capa .cpi')].filter(a => a.querySelector('.cp-sub')).map(a => parseFloat(getComputedStyle(a.querySelector('.cp-t')).fontSize) - parseFloat(getComputedStyle(a.querySelector('.cp-sub')).fontSize)); PREF.fonte = 1; aplicarFonte(); renderCapa(); return r });
  ok(fz.length > 0 && fz.every(d => d >= 0), 'letra grande: títulos da Capa >= subtítulos', fz);
  // dica do "O dia em 1 minuto"
  if (await A.$('[data-1mshare]')) { await clk(A, '[data-1mshare]'); await esperar(A, () => !!document.querySelector('.env-h'), null, 4000);
    ok(await ev(A, () => /notícias do dia/.test(document.querySelector('.env-h').textContent)), '1 minuto › Mandar: dica fala do resumo'); await ev(A, () => closeLayer()); await sleep(300) }
  // sair: Perfil no topo
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(300); await clk(A, '[data-sair]'); await sleep(900);
  ok(await ev(A, () => VIEW === 'me' && scrollY === 0 && !!document.querySelector('#v-me [data-entrar]')), 'sair: Perfil volta ao topo com "Entrar"', await ev(A, () => scrollY));
  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_qa_leitura: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await b.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
