// App novo com banco SEM o SQL v9 (o site sai antes de o Pedro rodar a v9): nada quebra, "Seguir", "Perfil aberto" e o
// público "Seguidores e amigos" não aparecem, e a coluna funciona (texto no estilo, até 6.000 caracteres).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 8743, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar({ sql: __dirname + '/../prumo-supabase.antes-v9.sql' });
  const a = await H.criarConta('a@x', '123456'), b = await H.criarConta('b@x', '123456'), d = await H.criarConta('d@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Dani','membro')`, [a, b, d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [a, b]);
  const br = await U.navegador();
  const abrir = async (uid, email, nome) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: uid, email } } }), nome);
    await p.addInitScript(() => { try { localStorage.setItem('prumo-teste-foco', '1'); localStorage.setItem('prumo-teste-visual', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => S.membro && S.amigosOk, null, 12000); return p };
  const A = await abrir(a, 'a@x', 'A'), B = await abrir(b, 'b@x', 'B');
  ok(await esperar(A, () => V9.on === false, null, 8000), 'detecta que a v9 não foi rodada');
  // Conta sem "Perfil aberto"; perfil sem números de seguir
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#v-me .pf-conta') && !document.querySelector('.cs123-cfg,[data-cs123aberto]')), 'Conta sem "Perfil aberto"');
  await ev(A, () => { PF_ABA = 'posts'; renderMe() }); await sleep(300);
  ok(await ev(A, () => !document.querySelector('.cs123-num')), 'perfil sem seguidores/seguindo');
  await ev(A, u => abrirPerfil(u), d); await sleep(500);
  ok(await ev(A, () => !document.querySelector('[data-cs123seg]')), 'perfil de quem não é amigo sem "Seguir"');
  await ev(A, () => closeLayer());
  // criador: Coluna disponível; público sem "Seguidores e amigos"
  await ev(A, () => { go('feed'); criarAbrir('post') }); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer [data-cs123ini]')), 'criador: "Escrever coluna" aparece mesmo sem a v9');
  await clk(A, '#layer [data-cs123ini]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('#layer > .ed132 #ed132-corpo') && /6\.000/.test(document.querySelector('[data-ed132cont]').textContent)), 'editor (132): abre e avisa o limite de 6.000');
  // perto do limite: publica e o texto fica no estilo
  const longo = ('A inflação de serviços segue resistente e o Banco Central deve manter os juros por mais tempo. ').repeat(70).slice(0, 5900);
  await A.fill('#ed132-tit', 'Juros: a conta que não fecha'); await A.fill('#ed132-lin', 'Por que o corte da Selic deve esperar');
  await ev(A, c => { const cp = $('#ed132-corpo'); cp.innerHTML = ed132ParaEditor(ed132DeMarkdown(c)); cp.dispatchEvent(new Event('input', { bubbles: true })) }, '## Começo\n' + longo);
  await clk(A, '#layer > .ed132 [data-ed132painel]'); await sleep(300);
  ok(await ev(A, () => !!document.querySelector('#layer .ed132-pp') && !document.querySelector('[data-ed132pubv]') && !document.querySelector('[data-ed132qv]')), 'antes de publicar: sem escolha de seguidores e sem agendar');
  await clk(A, '#layer .ed132-pp [data-ed132pub]');
  ok(await esperar(A, () => !ED132.E && !$('#layer').innerHTML, null, 8000), 'publica a coluna (5.900 caracteres)');
  const row = (await H.sql(`select id, estilo, publico, pg_column_size(estilo) t from publicacoes where autor=$1`, [a]))[0];
  ok(row && row.estilo.coluna && row.estilo.coluna.corpo.length > 5800 && row.publico === 'amigos' && row.t <= 8192, 'banco antigo: texto em estilo.coluna.corpo, para amigos, dentro dos 8 KB', row && row.t);
  // Bia (amiga) lê a coluna
  await ev(B, () => { PUB.sig = ''; return pubCarregar() }); await sleep(400);
  await ev(B, id => { go('feed'); FILTRO = 'tudo'; renderPosts(); garantirPost('u:' + id) }, row.id); await sleep(400);
  ok(await esperar(B, id => !!document.querySelector(`#posts [id="p-u:${id}"] .cs123-card .cs123-lb`), row.id, 6000), 'a amiga vê o cartão da coluna no Feed');
  await ev(B, id => cs123Abrir(id), row.id); await sleep(400);
  ok(await ev(B, () => /Juros: a conta/.test($('#layer .cs123-ler h1').textContent) && $('#layer .cs123-corpo h2').textContent === 'Começo' && $('#layer .cs123-corpo').textContent.length > 5850), 'a amiga lê a coluna inteira');
  await ev(B, () => $('#layer .cs123-fim [data-a="like"]').click()); await sleep(800);
  ok(+(await H.sql(`select count(*) n from pub_reacoes where pub=$1 and tipo='curtida'`, [row.id]))[0].n === 1, 'curtir no fim da coluna');
  await ev(B, () => history.back()); await sleep(400); ok(await ev(B, () => !$('#layer').innerHTML), 'voltar fecha a coluna');
  // texto acima do limite (de um rascunho antigo): mensagem clara e nada publicado
  await ev(A, () => { go('feed'); ed132Abre(ed132Novo({ tit: 'Longa demais', html: '<p>' + 'x '.repeat(3200) + '</p>' })) }); await sleep(300);
  await ev(A, () => ed132Publica()); await sleep(400);
  ok(await ev(A, () => /até 6\.000 caracteres/.test(document.querySelector('.toast')?.textContent || '') && !!ED132.E), 'acima de 6.000: avisa e não publica');
  await ev(A, () => { ed132RascTira(ED132.E.rid); closeLayer._ok = true; closeLayer(); closeLayer._ok = false });
  // público do post comum: sem "Seguidores e amigos"
  await ev(A, () => criarAbrir('post')); await sleep(300); await clk(A, '#layer [data-edsotexto]'); await sleep(300);
  if (await A.$('#layer [data-cfppub]')) { await clk(A, '#layer [data-cfppub]'); await sleep(200) }
  ok(await ev(A, () => !document.querySelector('[data-cfppubv="seguidores"]')), 'post: público sem "Seguidores e amigos"');
  ok(!A._erros.length && !B._erros.length, 'sem erros: ' + A._erros.concat(B._erros).join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_v9_semv9: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
