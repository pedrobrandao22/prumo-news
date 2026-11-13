// app novo com banco sem o SQL v5: perfil, menu e arquivo continuam funcionando, sem as opções novas
const U = require('../t_util'); const { ok, sleep, esperar } = U;
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8779); await sleep(800);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase.antes-v5.sql' });
  const a = await H.criarConta('a@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin')`, [a]);
  const br = await U.navegador();
  const p = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'A'); await p.goto('http://localhost:8779/index.html');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000);
  const id = await p.evaluate(async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Oi', fotos: [], estilo: { v: 2 } }).select('id'); await pubCarregar(); return r.data[0].id });
  await sleep(1200);
  ok(await p.evaluate(() => V5.on === false), 'detecta que o v5 não foi rodado');
  await p.evaluate(id => { go('feed'); renderPosts(); garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, id); await sleep(400);
  ok(await p.evaluate(() => !document.querySelector('[data-ueditar]') && !document.querySelector('[data-ufixar]') && !!document.querySelector('.sheet')), 'menu do post sem Editar/Fixar');
  await p.evaluate(() => { closeLayer(); go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(900);
  ok(await p.evaluate(() => document.querySelectorAll('#v-me .vn-pl > .post').length === 1 && !document.querySelector('#v-me .pf-dests')), 'perfil abre com a publicação e sem a fileira de destaques');
  ok(!p._erros.length, 'sem erros: ' + p._erros.join('|'));
  await br.close(); srv.kill(); process.exit(U.resumo().FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
