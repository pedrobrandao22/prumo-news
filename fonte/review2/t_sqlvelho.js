// app novo com o banco antigo (antes de rodar o SQL da leva 3): precisa continuar funcionando
const U = require('../t_util');
(async () => {
  const srv = U.servir('site', 8774); await U.sleep(800);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase.antes-leva3.sql' });
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome) values ($1,'Pedro'),($2,'Ana')`, [a, b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const br = await U.navegador();
  const p = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'A'); await p.addInitScript(() => { try { localStorage.setItem('prumo-pf-aba', 'conta') } catch (e) { } }); await p.goto('http://localhost:8774/index.html');
  U.ok(await U.esperar(p, () => S.membro && S.amigosOk && S.amigos.size === 1 && Object.values(S.membros).some(m => m.nome === 'Ana'), null, 10000), 'app novo com banco antigo: entra, vê a amiga e o nome');
  await p.evaluate(() => go('me')); await U.sleep(400);
  U.ok(await p.evaluate(() => /Ana/.test(document.querySelector('#v-me').textContent) && !document.querySelector('[data-admin]')), 'Perfil abre normal');
  U.ok(!p._erros.length, 'sem erros: ' + p._erros.join('|'));
  await br.close(); srv.kill(); process.exit(U.resumo().FALHAS ? 1 : 0);
})();
