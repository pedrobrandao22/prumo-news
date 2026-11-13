// App novo com banco SEM o SQL v8 (o site sai antes de o Pedro rodar a v8): nada quebra e os botões novos não aparecem
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8992, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase.antes-v8.sql' });
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro')`, [a, b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const br = await U.navegador();
  const abrir = async (uid, email, nome) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } } }), nome); await p.goto(BASE); await esperar(p, () => S.membro && S.amigosOk, null, 12000); return p };
  const A = await abrir(a, 'a@x', 'A'), B = await abrir(b, 'b@x', 'B');
  ok(await esperar(A, () => V8.on === false, null, 8000), 'detecta que a v8 não foi rodada');
  ok(await ev(A, u => S.membros[u] && S.membros[u].papel === 'admin' && S.membros[u].foto === null, a), 'pessoas: carrega sem a coluna da foto e mantém as outras (papel)');
  const id = await ev(A, async () => { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', texto: 'Oi', fotos: [], estilo: { v: 2 } }).select('id'); await pubCarregar(); return r.data[0].id });
  await ev(A, id => { go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id); document.querySelector(`[data-umenu="${id}"]`).click() }, id); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('.sheet [data-uapagar]') && !document.querySelector('[data-u8arq]')), 'menu do post sem "Arquivar"');
  await ev(A, () => { closeLayer(); go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(700);
  ok(await ev(A, () => !!document.querySelector('#v-me .vn-pf') && !document.querySelector('[data-fp8]') && document.querySelectorAll('#v-me .vn-pl > .post').length === 1), 'perfil sem "Editar foto" e com a publicação');
  await ev(A, () => { PF_ABA = 'conta'; renderMe() }); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#v-me [data-arquivo]') && !document.querySelector('[data-arq8]')), 'Conta sem "Posts arquivados" (o Arquivo de stories continua)');
  // comentário da Bia; o Pedro abre os comentários: sem o botão de curtir
  await ev(B, () => pubCarregar()); await sleep(300);
  await ev(B, id => openComments('u:' + id), id); await sleep(300); await B.fill('#ctext', 'Comentário'); await B.$eval('#cform .sendc', e => e.click()); await sleep(1000); await ev(B, () => closeLayer());
  await ev(A, () => { PS.t = 0; return psCarregar() }); await ev(A, id => openComments('u:' + id), id);
  ok(await esperar(A, () => document.querySelectorAll('#cbox .clist li').length === 1), 'comentários abrem');
  await sleep(600); ok(await ev(A, () => !document.querySelector('.cc8')), 'comentário sem o botão de curtir');
  await ev(A, () => closeLayer()); await ev(A, () => abrirAtividade()); await sleep(800);
  ok(await ev(A, () => !!document.querySelector('#layer .pfv-at')), 'Atividade abre');
  ok(await ev(A, u => !/av8|data-avf/.test(avatar(u)), a), 'avatares com as iniciais de sempre');
  ok(!A._erros.length && !B._erros.length, 'sem erros: ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_v8_semv8: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
function ev(p, fn, a) { return p.evaluate(fn, a) }
