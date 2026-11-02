// Etapa 6: prévia ao segurar, pastas, urgente, Meus temas
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs');
(async () => {
  const f = JSON.parse(fs.readFileSync(__dirname + '/feed-etapa2.json', 'utf8'));
  const iso = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 16) + ':00-03:00';
  f.atualizado_em = iso(Date.now() - 5 * 60e3);
  f.breves = f.breves || []; f.breves.unshift({ titulo: 'Terremoto forte atinge o litoral do Chile', fonte: 'cnn', url: 'https://www.cnnbrasil.com.br/x', secao: 'mundo', urgente: true, hora: iso(Date.now() - 30 * 60e3) }, { titulo: 'Velha urgente', fonte: 'cnn', url: 'https://www.cnnbrasil.com.br/y', secao: 'mundo', urgente: true, hora: iso(Date.now() - 5 * 3600e3) });
  fs.writeFileSync(__dirname + '/../site/feed.json', JSON.stringify(f));
  const srv = U.servir('site', 8783); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin')`, [a]);
  const br = await U.navegador(); const D = __dirname + '/etapa6/';
  const P = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'Pedro');
  await P.goto('http://localhost:8783/index.html'); await esperar(P, () => document.querySelectorAll('.post').length > 2 && S.membro, null, 10000); await sleep(500);
  ok(await P.evaluate(() => document.querySelectorAll('#posts .urg [data-urg]').length === 1 && /Terremoto/.test(document.querySelector('#posts .urg').textContent)), 'Urgente no topo do feed (só a de menos de 3 h)');
  await P.screenshot({ path: D + '1-urgente.png' });
  await P.evaluate(() => document.querySelector('[data-urg]').click()); await sleep(300);
  ok(await P.evaluate(() => /Urgente/.test(document.querySelector('.sheet').textContent)), 'abre a urgente');
  await P.evaluate(() => closeLayer()); await sleep(200);
  await P.click('#t-capa'); await sleep(400);
  ok(await P.evaluate(() => !!document.querySelector('#v-capa .urg')), 'Urgente na Capa');
  // segurar o dedo num destaque da capa
  const box = await P.evaluate(() => { document.querySelector('.cp-dest .cpi-b').scrollIntoView({ block: 'center' }); const r = document.querySelector('.cp-dest .cpi-b').getBoundingClientRect(); return { x: r.x + 40, y: r.y + 20 } });
  await P.mouse.move(box.x, box.y); await P.mouse.down(); await sleep(700); await P.mouse.up(); await sleep(300);
  ok(await P.evaluate(() => !!document.querySelector('.sheet .pv') && VIEW === 'capa'), 'segurar abre a prévia (sem abrir a notícia)');
  await P.screenshot({ path: D + '2-previa.png' });
  await P.evaluate(() => document.querySelector('[data-pvsalvar]').click()); await sleep(500);
  ok(await P.evaluate(() => /Guardada ✓/.test(document.querySelector('.sheet').textContent) && !!document.querySelector('[data-pvpasta="Ler depois"]')), 'guardar pela prévia e ver as pastas');
  await P.evaluate(() => document.querySelector('[data-pvpasta="Ler depois"]').click()); await sleep(400);
  const pid = await P.evaluate(() => Object.keys(S.salvos)[0]);
  ok(await esperar(P, x => S.salvos[x] && S.salvos[x].pasta === 'Ler depois', pid, 4000), 'pôr na pasta "Ler depois"');
  await P.fill('#pvnome', 'Eleição'); await P.evaluate(() => document.querySelector('#pvnova button').click()); await sleep(400);
  ok(await esperar(P, x => S.salvos[x].pasta === 'Eleição', pid, 4000), 'criar pasta nova');
  await P.screenshot({ path: D + '3-pastas.png' });
  await P.evaluate(() => closeLayer()); await sleep(200);
  await P.evaluate(() => toggleSave(FEED.pautas.find(p => !S.salvos[p.id]).id)); await sleep(400);
  await P.evaluate(() => go('saved')); await sleep(400);
  ok(await P.evaluate(() => document.querySelectorAll('[data-pasta]').length === 2 && /Eleição/.test(document.querySelector('#v-saved').textContent)), 'Guardadas com pastas');
  await P.evaluate(() => document.querySelector('[data-pasta="Eleição"]').click()); await sleep(300);
  ok(await P.evaluate(() => [...document.querySelectorAll('#v-saved .svl li')].filter(l => !l.hidden).length === 1), 'filtrar por pasta');
  await P.screenshot({ path: D + '4-guardadas.png' });
  // recarregar mantém a pasta (vem do banco)
  await P.reload(); await esperar(P, () => S.membro && Object.keys(S.salvos).length >= 2, null, 10000);
  ok(await P.evaluate(x => S.salvos[x] && S.salvos[x].pasta === 'Eleição', pid), 'pasta salva na conta');
  // Meus temas
  await P.evaluate(() => go('feed')); await sleep(200);
  await P.evaluate(() => { PREF.seguindo = {}; PREF.seguindo[norm('Caso Master')] = 'Caso Master'; PREF.feedModo = 'seguindo'; renderPosts() }); await sleep(300);
  ok(await P.evaluate(() => listaFeed().length === 1 && listaFeed()[0].id === 'caso-master'), 'Meus temas mostra só o que segue');
  await P.evaluate(() => { PREF.seguindo = {}; renderPosts() }); await sleep(200);
  ok(await P.evaluate(() => /Nada do que você segue/.test(document.querySelector('#posts').textContent)), 'Meus temas vazio explica');
  await P.screenshot({ path: D + '5-meus-temas.png' });
  await P.evaluate(() => { PREF.feedModo = 'voce'; renderPosts() });
  ok(!P._erros.length, 'sem erros ' + P._erros.join('|'));
  const r = U.resumo(); console.log(`\nRESUMO t_etapa6: ${r.OKS} ok, ${r.FALHAS} falhas`); await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
