// Sugestões de @ na legenda do criador de post (12/11): a caixa entra abaixo da legenda e não cobre "Marcar pessoas"
// nem as outras linhas; tocar num nome completa a menção e a caixa some. 390 e 360 px. Porta 8998.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const path = require('path');
const { montarPasta, PROD } = require('./_qc_comum');
let srv = null;
(async () => {
  montarPasta('xg2'); srv = U.servir('xg2', 8998); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Bruno Lima','membro')`, [ids.a, ids.b, ids.c]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  const br = await U.navegador();
  for (const w of [390, 360]) {
    const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids.a, email: 'a@x' } }, viewport: { width: w, height: 760 }, ctx: { deviceScaleFactor: 1, isMobile: true, hasTouch: true } }), 'Pedro ' + w);
    await p.addInitScript(PROD); await p.goto('http://localhost:8998/index.html');
    await esperar(p, () => typeof VIEW !== 'undefined' && S.membro && S.amigosOk && PUB.on === true, null, 20000); await sleep(600);
    await p.evaluate(() => { go('feed'); criarAbrir('post') }); await sleep(600); await p.click('#layer [data-edsotexto]'); await sleep(600);
    await p.click('#layer #ce-leg'); await p.keyboard.type('Olha isso @B'); await sleep(500);
    const m = await p.evaluate(() => { const b = document.querySelector('.men-box'); if (!b) return null; const r = b.getBoundingClientRect();
      const cob = [...document.querySelectorAll('#layer .ce-row, #layer button')].filter(e => !b.contains(e) && e.offsetParent).filter(e => { const q = e.getBoundingClientRect(); return q.bottom > r.top + 1 && q.top < r.bottom - 1 && q.right > r.left && q.left < r.right }).map(e => e.textContent.trim().slice(0, 30));
      return { n: b.querySelectorAll('[data-men]').length, cob } });
    ok(m && m.n === 2, `${w}: @B sugere os dois amigos`, m);
    ok(m && !m.cob.length, `${w}: a caixa não cobre "Marcar pessoas" nem outra linha`, m);
    await p.tap('.men-box [data-men]'); await sleep(400);
    const v = await p.evaluate(() => ({ t: document.querySelector('#ce-leg').value, box: !!document.querySelector('.men-box') }));
    ok(/@Bia/.test(v.t) && !v.box, `${w}: tocar no nome completa a menção e fecha a caixa`, v);
    ok(p._erros.length === 0, `${w}: sem erros`, p._erros);
    await p.context().close() }
  await br.close(); srv.kill(); require('fs').rmSync(path.join(__dirname, '..', 'xg2'), { recursive: true, force: true });
  const R = U.resumo(); console.log(`RESUMO t_arroba_criador: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
