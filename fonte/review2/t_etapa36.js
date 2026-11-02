// Etapa 36: Agora abre; quadro abre sem sair da tela; trocar leitura sem pular; sem efeito de toque nos cartões
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const S0 = __dirname + '/../site/';
  const f = JSON.parse(fs.readFileSync(require('../t_util').REPO + '/feed.json', 'utf8'));
  f.atualizado_em = new Date(Date.now() - 3 * 3600e3 - 5 * 60e3).toISOString().slice(0, 16) + ':00-03:00';
  fs.writeFileSync(S0 + 'feed.json', JSON.stringify(f));
  const hh = ms => { const d = new Date(ms - 3 * 3600e3); const p = n => String(n).padStart(2, '0'); return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}h${p(d.getUTCMinutes())}` };
  const pe = f.pautas[0];
  fs.writeFileSync(S0 + 'novidades.json', JSON.stringify({ gerado: new Date().toISOString(), novos: [{ assunto: 'Morre produtor que fez história nos festivais de música popular brasileira', secao: 'brasil', n_fontes: 3, relevante: true, manchetes: [{ titulo: 'Morre produtor que fez história nos festivais de música popular brasileira', hora: hh(Date.now() - 20 * 6e4) }] }], em_pautas: { [pe.id]: { n_fontes: 4, manchetes: [{ titulo: 'Rubio nega que os EUA tenham facilitado a entrada de Flávio no país', hora: hh(Date.now() - 10 * 6e4) }] } } }));
  const srv = U.servir('site', 8836); await sleep(700); const br = await U.navegador();
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.route('https://upload.wikimedia.org/**', r => r.abort());
  await ctx.addInitScript(() => localStorage.setItem('prumo-teste-capa', '1'));
  const p = U.erros(await ctx.newPage(), 'a'); await p.goto('http://localhost:8836/index.html'); await esperar(p, () => FEED && document.querySelector('#v-capa .cp-agora'), null, 10000); await sleep(800);
  // Agora: item que não é pauta abre a lista; item que é pauta abre a matéria; o rótulo também abre
  const box = async sel => p.evaluate(sel => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 120), y: r.top + r.height / 2 } }, sel);
  await p.evaluate(() => document.querySelector('.cp-agora .ag-run').style.animation = 'none'); await sleep(100);
  let b = await box('.cp-agora .ag-i:not([data-agstrip="' + pe.id + '"])'); await p.touchscreen.tap(b.x, b.y); await sleep(600);
  ok(await p.evaluate(() => !!document.querySelector('#layer').innerHTML), 'tocar numa manchete do Agora (que não é pauta) abre a lista do Agora');
  await p.evaluate(() => closeLayer()); await sleep(500);
  await p.evaluate(id => document.querySelector(`.cp-agora .ag-i[data-agstrip="${id}"]`).click(), pe.id); await sleep(600);
  ok(await p.evaluate(id => MAT_PID === id, pe.id), 'tocar no assunto do Agora que é pauta abre a matéria');
  await p.evaluate(() => closeLayer()); await sleep(500);
  b = await box('.cp-agora .ag-lbl'); await p.touchscreen.tap(b.x, b.y); await sleep(600);
  ok(await p.evaluate(() => !!document.querySelector('#layer').innerHTML), 'tocar no rótulo "Agora" abre a lista');
  await p.evaluate(() => closeLayer()); await sleep(500);
  // quadro: abrir um cartão perto do fim da tela mostra o quadro inteiro
  const id = await p.evaluate(() => { const L = [...document.querySelectorAll('#v-capa .cp-sl .cpi')]; const el = L[1]; scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight + 160); return el.id.slice(4) }); await sleep(400);
  b = await box('#cpi-' + id + ' .cp-t'); await p.touchscreen.tap(b.x, b.y); await sleep(1200);
  ok(await p.evaluate(id => { const el = document.getElementById('cpi-' + id); const r = el.getBoundingClientRect(); const nav = document.querySelector('.nav').offsetHeight; return el.classList.contains('aberto') && r.top >= 40 && r.bottom <= innerHeight - nav + 4 }, id), 'abrir o "Em 30 segundos" perto do pé da tela rola até mostrar o quadro inteiro');
  // abrir outro mais abaixo com um aberto acima: o cartão tocado não foge do dedo
  const id2 = await p.evaluate(id => { const L = [...document.querySelectorAll('#v-capa .cpi')]; const i = L.findIndex(x => x.id === 'cpi-' + id); return L[i + 1].id.slice(4) }, id);
  const t0 = await p.evaluate(id => document.getElementById('cpi-' + id).getBoundingClientRect().top, id2);
  await p.evaluate(id => { window.__y = []; document.querySelector('#cpi-' + id + ' .cpi-b').click() }, id2); await sleep(30);
  const t1 = await p.evaluate(id => document.getElementById('cpi-' + id).getBoundingClientRect().top, id2);
  ok(Math.abs(t1 - t0) < 3, `fechar o quadro de cima e abrir o de baixo: o cartão tocado fica onde estava (${Math.round(t0)} → ${Math.round(t1)})`);
  await sleep(900);
  // trocar a leitura: o cartão no alto da tela não se mexe
  await p.evaluate(() => { CP_AB && document.querySelector('#cpi-' + CP_AB + ' .cpi-b').click(); scrollTo(0, 2600) }); await sleep(500);
  const an0 = await p.evaluate(() => { const a = ancoraCapa(); return a }); 
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.lente = 'direita'; document.body.appendChild(b); b.click(); b.remove() }); await sleep(400);
  const an1 = await p.evaluate(id => document.getElementById(id).getBoundingClientRect().top, an0.id);
  ok(Math.abs(an1 - an0.top) < 3, `trocar para Direita não faz a tela pular (${Math.round(an0.top)} → ${Math.round(an1)})`);
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.lente = 'neutro'; document.body.appendChild(b); b.click(); b.remove() }); await sleep(300);
  // sem efeito de toque
  ok(await p.evaluate(() => { const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch (e) { return [] } }).map(r => r.cssText).join('\n'); return /\.cpi-b:active:not\(:disabled\)[^{]*\{[^}]*opacity: 1 !important/.test(css) && /tap-highlight-color: transparent/.test(css) }), 'cartões e textos não mudam ao tocar ou rolar');
  ok(!p._erros.filter(e => !/ERR_|404|net::/.test(e)).length, 'sem erros ' + p._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa36: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); try { fs.unlinkSync(S0 + 'novidades.json') } catch (e) { } process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
