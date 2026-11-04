// App novo com banco SEM o SQL v10 (o site sai antes de o Pedro rodar a v10): a página Notificações mostra só
// os avisos dentro do app e o número no ícone; bolinhas, Atividade e Conversas seguem como antes, sem erros.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8749, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase.antes-v10.sql' });
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro')`, [a, b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const br = await U.navegador();
  const A = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'A');
  await A.goto(BASE); await esperar(A, () => S.membro && S.amigosOk, null, 15000);
  ok(await esperar(A, () => NT124.v10 === false, null, 10000), 'detecta que a v10 não foi rodada');
  ok(await esperar(A, () => NT124.v9 === false, null, 10000), 'detecta que não há "Seguir"');
  await H.sql(`insert into public.mensagens(de,para,texto) values ($1,$2,'oi')`, [b, a]);
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#v-me [data-nt124abrir]') && !!document.querySelector('#v-me [data-nt124ativ]')), 'Perfil › Conta: "Notificações" e "Atividade" aparecem');
  await ev(A, () => document.querySelector('#v-me [data-nt124abrir]').click()); await sleep(500);
  const tx = await ev(A, () => document.querySelector('#layer .pfv-nt124')?.textContent || '');
  ok(/O que avisar/.test(tx) && /Número no ícone do app/.test(tx), 'página: avisos no app e número no ícone');
  ok(!/Avisos no celular/.test(tx) && await ev(A, () => !document.querySelector('[data-nt124push],[data-nt124ativar],.nt124-cel')), 'página: sem a parte de avisos no celular');
  ok(await ev(A, () => document.querySelectorAll('[data-nt124tipo]').length === 7 && !document.querySelector('[data-nt124tipo="seguidores"]')), 'página: 7 tipos (sem os do "Seguir")');
  await ev(A, () => document.querySelector('[data-nt124app="reposts"]').click()); await sleep(200);
  ok(await ev(A, () => PREF.notif.app.reposts === false), 'escolha no app funciona sem a v10');
  await ev(A, () => closeLayer()); await ev(A, () => abrirAtividade()); await sleep(700);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv-at')), 'Atividade abre');
  ok(!A._erros.length, 'sem erros: ' + A._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_v10_semv10: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
