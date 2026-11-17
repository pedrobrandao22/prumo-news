// "Só seguir" (Fase 1, 17/11, js/181 + sql/proposta-2026-11-17-so-seguir.sql). Porta 9010.
// Parte 1: o SQL no PGlite (conversão, regras de leitura de posts/colunas/mensagens/listas, pedidos, convite).
// Parte 2: o app SEM o SQL continua como antes (amizades). Parte 3: o app COM o SQL (perfil, pedidos, Ajustes, coluna, conversa).
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9010, BASE = `http://localhost:${PORTA}/index.html`;
const SQL = fs.readFileSync(path.join(__dirname, '..', 'sql', 'proposta-2026-11-17-so-seguir.sql'), 'utf8');
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let n = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && n++ < 6) closeLayer() });
(async () => {
  U.feedFresco('site'); U.servir('site', PORTA); await sleep(800);

  /* ================= 1. SQL ================= */
  const H = await require('../harness').criar();
  const id = {}; for (const k of ['a', 'b', 'c', 'd', 'e']) id[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Caio Reis','membro'),($4,'Dani Lima','membro'),($5,'Edu Melo','membro')`, [id.a, id.b, id.c, id.d, id.e]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($3,$1,'pendente')`, [id.a, id.b, id.c]);
  await H.sql(`insert into public.publicacoes(autor,tipo,texto,publico) values ($1,'post','post amigos','amigos'),($1,'post','post melhores','proximos')`, [id.a]);
  await H.sql(`insert into public.publicacoes(autor,tipo,texto,publico,estilo) values ($1,'post','coluna antiga','amigos','{"coluna":{"tit":"Antiga"}}')`, [id.a]);
  await H.db.exec(SQL);
  const seg = async (x, y) => (await H.sql(`select 1 from seguidores where seguidor=$1 and seguido=$2`, [x, y])).length === 1;
  ok(await seg(id.a, id.b) && await seg(id.b, id.a), 'conversão: amizade vira seguir dos dois lados');
  ok(await seg(id.c, id.a) && !(await seg(id.a, id.c)), 'conversão: pedido de amizade esperando vira seguir de quem pediu');
  ok((await H.sql(`select count(*)::int n from amizades`))[0].n === 0 && (await H.sql(`select count(*)::int n from so_seguir_copia_amizades`))[0].n === 2, 'conversão: amizades vazias, cópia guardada');
  ok((await H.sql(`select string_agg(publico,',' order by texto) p from publicacoes`))[0].p === 'seguidores,seguidores,seguidores', 'conversão: amigos/Melhores amigos viram "seguidores" (coluna antiga: só quem segue)');
  ok((await H.sql(`select bool_and(perfil_aberto) b from membros`))[0].b === true, 'conversão: perfis abertos (padrão)');
  await H.sql(`update membros set perfil_aberto=false where uid=$1`, [id.a]);
  await H.db.exec(SQL);
  ok((await H.sql(`select perfil_aberto from membros where uid=$1`, [id.a]))[0].perfil_aberto === false && (await H.sql(`select count(*)::int n from so_seguir_copia_amizades`))[0].n === 2, 'rodar de novo não refaz a conversão (o perfil fechado continua fechado)');

  const como = (u, q, p) => H.comoUsuario(u, () => H.db.query(q, p)).then(r => r.rows);
  const tenta = async (u, q, p) => { try { await como(u, q, p); return true } catch (e) { return false } };
  const rpc = async (u, f, args) => (await como(u, `select ${f} as r`, args))[0].r;
  const [pa] = await H.sql(`select id from publicacoes where texto='post amigos'`);
  // perfil fechado (Pedro): Dani não segue
  ok((await como(id.d, `select id from publicacoes where autor=$1`, [id.a])).length === 0, 'perfil fechado: quem não segue não vê os posts');
  ok((await como(id.b, `select id from publicacoes where autor=$1 and texto='post amigos'`, [id.a])).length === 1, 'perfil fechado: seguidor vê os posts');
  ok(!(await tenta(id.d, `insert into pub_reacoes(pub,uid,tipo) values ($1,$2,'curtida')`, [pa.id, id.d])), 'perfil fechado: quem não segue não curte');
  ok(!(await tenta(id.d, `insert into mensagens(de,para,texto) values ($1,$2,'oi')`, [id.d, id.a])), 'perfil fechado: quem não segue não manda mensagem');
  ok((await como(id.d, `select nome from membros where uid=$1`, [id.a])).length === 1, 'perfil fechado: o nome e a foto aparecem para quem não segue');
  const ct = await rpc(id.d, `seguidores_contagem($1)`, [id.a]);
  ok(ct.ok === true && ct.lista === false && ct.seguidores === 2, 'perfil fechado: números aparecem, listas não', ct);
  ok((await como(id.d, `select * from seg_lista($1,'seguidores')`, [id.a])).length === 0 && (await como(id.d, `select * from seguidores_lista($1,'seguidores')`, [id.a])).length === 0, 'perfil fechado: lista de seguidores vazia para quem não segue');
  ok((await como(id.b, `select * from seg_lista($1,'seguidores')`, [id.a])).length === 2, 'perfil fechado: seguidor vê a lista');
  // pedido para seguir
  ok(await rpc(id.d, `seguir($1)`, [id.a]) === 'pedido', 'seguir perfil fechado vira pedido');
  const est = await rpc(id.a, `seguir_estado()`, []);
  ok(est.v === 1 && est.aberto === false && est.recebidos.some(x => x.uid === id.d), 'seguir_estado: o dono vê o pedido', est);
  ok((await rpc(id.d, `seguir_estado()`, [])).enviados.includes(id.a), 'seguir_estado: quem pediu vê "pedido enviado"');
  ok(await rpc(id.a, `seguir_responder($1,true)`, [id.d]) === 'aceito' && await seg(id.d, id.a), 'aprovar: vira seguidor');
  ok((await como(id.d, `select id from publicacoes where autor=$1 and tipo='post' and texto='post amigos'`, [id.a])).length === 1 && await tenta(id.d, `insert into mensagens(de,para,texto) values ($1,$2,'oi')`, [id.d, id.a]), 'aprovado: vê os posts e manda mensagem');
  await rpc(id.e, `seguir($1)`, [id.a]); await rpc(id.a, `seguir_responder($1,false)`, [id.e]);
  ok(!(await seg(id.e, id.a)) && (await H.sql(`select count(*)::int n from seguir_pedidos where de=$1`, [id.e]))[0].n === 0, 'recusar: o pedido some e não segue');
  // responder conversa começada pelo perfil fechado
  ok(await tenta(id.a, `insert into mensagens(de,para,texto) values ($1,$2,'oi Edu')`, [id.a, id.e]) && await tenta(id.e, `insert into mensagens(de,para,texto) values ($1,$2,'oi Pedro')`, [id.e, id.a]), 'dá para responder quem começou a conversa (perfil fechado)');
  // perfil aberto (Dani)
  await como(id.d, `insert into publicacoes(autor,tipo,texto) values ($1,'post','post da Dani')`, [id.d]);
  const [pd] = await H.sql(`select id, publico from publicacoes where texto='post da Dani'`);
  ok(pd.publico === 'seguidores' && (await como(id.e, `select id from publicacoes where id=$1`, [pd.id])).length === 1, 'perfil aberto: quem não segue vê o post');
  ok(await tenta(id.e, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c1','{"t":"oi"}')`, [pd.id, id.e]) && await tenta(id.e, `insert into mensagens(de,para,texto) values ($1,$2,'oi Dani')`, [id.e, id.d]), 'perfil aberto: quem não segue comenta e manda mensagem');
  ok(await rpc(id.e, `seguir($1)`, [id.d]) === 'ok' && await seg(id.e, id.d), 'perfil aberto: seguir entra na hora');
  // colunas
  await como(id.a, `insert into publicacoes(autor,tipo,texto,publico,estilo) values ($1,'post','col todos','amigos','{"coluna":{"tit":"Para todos"}}')`, [id.a]);
  await como(id.d, `insert into publicacoes(autor,tipo,texto,publico,estilo) values ($1,'post','col seg','seguidores','{"coluna":{"tit":"Só seguidores"}}')`, [id.d]);
  const [ct1] = await H.sql(`select id, publico from publicacoes where texto='col todos'`), [ct2] = await H.sql(`select id from publicacoes where texto='col seg'`);
  ok(ct1.publico === 'todos', 'coluna nova: padrão "todos" (o app antigo manda "amigos")');
  ok(!(await seg(id.e, id.a)) && (await como(id.e, `select id from publicacoes where id=$1`, [ct1.id])).length === 1 && await tenta(id.e, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c2','{"t":"boa"}')`, [ct1.id, id.e]),
    'coluna "para todos" de perfil fechado: quem não segue lê e comenta');
  ok((await como(id.b, `select id from publicacoes where id=$1`, [ct2.id])).length === 0 && (await como(id.e, `select id from publicacoes where id=$1`, [ct2.id])).length === 1, 'coluna "só seguidores" de perfil aberto: só quem segue lê');
  ok(await rpc(id.a, `coluna_mudar_publico($1,'seguidores')`, [ct1.id]) === 'seguidores' && (await como(id.e, `select id from publicacoes where id=$1`, [ct1.id])).length === 0, 'mudar a coluna para "só seguidores" tira de quem não segue');
  await como(id.a, `insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','post todos','todos')`, [id.a]);
  ok((await H.sql(`select publico from publicacoes where texto='post todos'`))[0].publico === 'seguidores', 'post comum: o público é sempre o do perfil');
  // abrir o perfil aprova quem estava esperando; bloquear apaga o pedido
  await rpc(id.c, `seguir($1)`, [id.a]); await H.sql(`delete from seguidores where seguidor=$1 and seguido=$2`, [id.c, id.a]); await rpc(id.c, `seguir($1)`, [id.a]);
  await H.sql(`update membros set perfil_aberto=false where uid=$1`, [id.b]); await H.sql(`insert into seguir_pedidos(de,para) values ($1,$2) on conflict do nothing`, [id.c, id.b]);
  await H.sql(`insert into bloqueios(de,para) values ($1,$2) on conflict do nothing`, [id.b, id.c]);
  ok((await H.sql(`select count(*)::int n from seguir_pedidos where de=$1 and para=$2`, [id.c, id.b]))[0].n === 0, 'bloquear apaga o pedido');
  await rpc(id.a, `mudar_perfil_aberto(true)`, []);
  ok(await seg(id.c, id.a) && (await H.sql(`select count(*)::int n from seguir_pedidos where para=$1`, [id.a]))[0].n === 0, 'abrir o perfil: quem esperava passa a seguir');
  // convite
  const cod = await rpc(id.a, `criar_convite()`, []);
  const f = await H.criarConta('f@x', '123456');
  await rpc(f, `entrar($1,'Fábio Nunes')`, [cod]);
  ok(await seg(f, id.a) && await seg(id.a, f) && (await H.sql(`select count(*)::int n from amizades`))[0].n === 0, 'convite: começa seguindo quem convidou e sendo seguido (sem amizade)');
  ok(await rpc(f, `pedir_amizade($1)`, [id.d]) === 'aceita' && await seg(f, id.d), 'função antiga pedir_amizade vira seguir');
  ok((await como(id.d, `select * from perfis_abertos('')`, [])).length >= 3, 'busca de pessoas: todos os membros');

  /* ================= 2. app SEM o SQL ================= */
  const br = await U.navegador();
  const H0 = await require('../harness').criar();
  const j = {}; for (const k of ['a', 'b', 'c']) j[k] = await H0.criarConta(k + '@x', '123456');
  await H0.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Caio Reis','membro')`, [j.a, j.b, j.c]);
  await H0.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [j.a, j.b]);
  const P0 = U.erros(await H0.pagina(br, { sessao: { user: { id: j.a, email: 'a@x' } } }), 'P0');
  await P0.goto(BASE); await esperar(P0, () => S.membro && S.amigosOk && typeof SG181 !== 'undefined' && SG181.on === false, null, 15000);
  ok(await ev(P0, () => SG181.on === false && !document.body.classList.contains('sg181-on')), 'sem o SQL: o app percebe e fica como antes');
  ok(await ev(P0, b => S.amigos.has(b) && S.amigos.size === 1, j.b), 'sem o SQL: amigos continuam vindo das amizades');
  await ev(P0, u => abrirPerfil(u), j.c); await sleep(900);
  ok(await ev(P0, () => !!document.querySelector('#layer .pfv [data-pedir]') && !document.querySelector('#layer .pfv [data-sg181seg]')), 'sem o SQL: perfil de quem não é amigo segue com "Pedir amizade"');
  ok(!P0._erros.length, 'sem o SQL: nenhum erro na página', P0._erros);

  /* ================= 3. app COM o SQL ================= */
  await H0.db.exec(SQL);
  await H0.sql(`update membros set perfil_aberto=false where uid=$1`, [j.c]);
  await H0.sql(`insert into publicacoes(autor,tipo,texto) values ($1,'post','Post fechado do Caio')`, [j.c]);
  const abrir = async (uid, em, nome) => { const p = U.erros(await H0.pagina(br, { sessao: { user: { id: uid, email: em } } }), nome); await p.goto(BASE);
    await esperar(p, () => S.membro && typeof SG181 !== 'undefined' && SG181.on === true && CS123.t > 0, null, 15000); await sleep(1200); return p };
  const A = await abrir(j.a, 'a@x', 'A');
  ok(await ev(A, b => SG181.on === true && document.body.classList.contains('sg181-on') && S.amigos.has(b) && S.amigos === CS123.sigo, j.b), 'com o SQL: liga o "só seguir" e S.amigos = quem você segue');
  await ev(A, () => go('me')); await sleep(800);
  const me = await ev(A, () => $('#v-me .pf-me').innerText);
  ok(/1\s*seguidor/.test(me) && /1\s*seguindo/.test(me) && !/amigo/i.test(me), 'meu perfil: seguidores/seguindo, sem amigos', me.slice(0, 200));
  await U.foto(A, 'sg181-meu-perfil');
  await ev(A, u => abrirPerfil(u), j.c); await sleep(1200);
  const pc = await ev(A, () => ({ t: $('#layer .pfv').innerText, seg: (document.querySelector('#layer .pfv [data-sg181seg]') || {}).textContent, msg: !!document.querySelector('#layer .pfv [data-pfmsg]'), ped: !!document.querySelector('#layer .pfv [data-pedir]') }));
  ok(pc.seg === 'Seguir' && !pc.msg && !pc.ped && /Perfil fechado/.test(pc.t) && !/Post fechado do Caio/.test(pc.t), 'perfil fechado de quem não sigo: "Seguir", sem Mensagem, sem posts', pc);
  ok(await ev(A, () => !document.querySelector('#layer .pfv [data-sg181lista]')), 'perfil fechado: os números não abrem as listas');
  await U.foto(A, 'sg181-perfil-fechado');
  await ev(A, () => document.querySelector('#layer .pfv [data-sg181seg]').click());
  ok(await esperar(A, () => (document.querySelector('#layer .pfv [data-sg181seg]') || {}).textContent === 'Pedido enviado', null, 6000), 'tocar em Seguir: vira "Pedido enviado"');
  ok((await H0.sql(`select count(*)::int n from seguir_pedidos where de=$1 and para=$2`, [j.a, j.c]))[0].n === 1, 'o pedido foi gravado');
  await fecha(A);
  ok(await ev(A, u => { const h = $('#v-msgs'); go('msgs'); abrirConversa(u); return true }, j.c), 'abre a conversa com o perfil fechado'); await sleep(700);
  ok(await esperar(A, () => /perfil fechado/.test(($('#v-msgs .dm-comp .hint') || {}).textContent || '')), 'conversa com perfil fechado: aviso e sem mandar', await ev(A, () => ($('#v-msgs .dm-comp') || {}).innerText));
  await fecha(A); await ev(A, () => { THREAD = null; go('feed') });
  // o dono aprova no Perfil
  const C = await abrir(j.c, 'c@x', 'C').catch(() => null);
  const Cp = C || A; // (Caio ainda não segue ninguém: a espera acima pode vencer; segue sem problema)
  await ev(Cp, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await esperar(Cp, () => !!document.querySelector('#v-me .sg181-ped [data-sg181sim]'), null, 8000);
  ok(await ev(Cp, () => /Pedido para seguir você/.test($('#v-me .sg181-ped').textContent) && /Pedro/.test($('#v-me .sg181-ped').textContent)), 'perfil fechado: pedido para aprovar no Perfil');
  await U.foto(Cp, 'sg181-pedido');
  await ev(Cp, () => document.querySelector('#v-me .sg181-ped [data-sg181sim]').click());
  ok(await esperar(Cp, () => !document.querySelector('#v-me .sg181-ped'), null, 6000) && (await H0.sql(`select 1 from seguidores where seguidor=$1 and seguido=$2`, [j.a, j.c])).length === 1, 'aprovar: some do Perfil e vira seguidor no banco');
  // Ajustes › Privacidade: Perfil fechado
  await ev(Cp, () => abrirAjustes()); await sleep(500);
  ok(await ev(Cp, () => document.querySelector('[data-sg181fech]')?.getAttribute('aria-checked') === 'true'), 'Ajustes › Privacidade: "Perfil fechado" ligado para quem fechou');
  await ev(Cp, () => document.querySelector('[data-sg181fech]').click()); await sleep(800);
  ok((await H0.sql(`select perfil_aberto from membros where uid=$1`, [j.c]))[0].perfil_aberto === true, 'desligar "Perfil fechado" abre o perfil no banco');
  await fecha(Cp);
  // Pedro, agora seguindo Caio: vê o post e pode mandar mensagem
  await ev(A, () => { SG181.t = 0; CS123.t = 0; cs123Carregar(); sg181Estado() }); await sleep(1500);
  await ev(A, () => { PUB.sig = ''; return pubCarregar() }); await ev(A, u => { delete CS123.perf[u]; PF_T[u] = 0; abrirPerfil(u) }, j.c); await sleep(1500);
  const pc2 = await ev(A, () => ({ t: $('#layer .pfv').innerText, seg: (document.querySelector('#layer .pfv [data-sg181seg]') || {}).textContent, msg: !!document.querySelector('#layer .pfv [data-pfmsg]') }));
  ok(pc2.seg === 'Seguindo' && pc2.msg && /Post fechado do Caio/.test(pc2.t), 'aprovado: "Seguindo", Mensagem e os posts', pc2);
  await fecha(A);
  // criar: sem escolha de público; coluna com "Para todos"/"Só para quem me segue"
  await ev(A, () => { go('feed'); criarMenu() }); await sleep(500);
  ok(await ev(A, () => { const l = document.querySelector('.cp152-pub'); return !l || getComputedStyle(l).display === 'none' }) && !/amigos/i.test(await ev(A, () => $('#layer').innerText.replace(/Enquete pergunta aos amigos/, ''))), 'criar post: sem "Público"/amigos');
  await fecha(A);
  await ev(A, () => ed132Abre(ed132Novo())); await sleep(500);
  await A.fill('#ed132-tit', 'Coluna de teste'); await A.fill('#ed132-lin', 'Linha fina da coluna de teste');
  await A.click('#ed132-corpo'); await ev(A, () => { const cp = $('#ed132-corpo'); const r = document.createRange(); r.selectNodeContents(cp); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r) });
  await A.keyboard.type('Um parágrafo da coluna de teste para todos lerem, com texto suficiente para publicar.'); await sleep(300);
  await ev(A, () => document.querySelector('#layer > .ed132 [data-ed132painel]').click()); await sleep(600);
  const op = await ev(A, () => ({ b: [...document.querySelectorAll('#layer .ed132-pp [data-ed132pubv]')].map(b => b.textContent).join('|'), h: ($('[data-ed132pubh]') || {}).textContent }));
  ok(/^Para todos\|Só para quem me segue/.test(op.b) && /Qualquer membro/.test(op.h), 'coluna: "Para todos" (padrão) e "Só para quem me segue"', op);
  await U.foto(A, 'sg181-coluna-publico');
  await ev(A, () => { $('#layer .ed132-pp [data-ed132pub]').click() }); await sleep(1500);
  ok(((await H0.sql(`select publico from publicacoes where estilo->'coluna'->>'tit'='Coluna de teste'`))[0] || {}).publico === 'todos', 'coluna publicada pelo app: "todos"');
  await fecha(A);
  // fotos no iPhone SE: perfil fechado e conversa bloqueada
  await H0.sql(`update membros set perfil_aberto=false where uid=$1`, [j.b]); await H0.sql(`delete from seguidores where seguidor=$1 and seguido=$2`, [j.a, j.b]);
  await ev(A, () => { SG181.t = 0; sg181Estado(); CS123.t = 0; cs123Carregar() }); await sleep(1200);
  await A.setViewportSize({ width: 320, height: 568 });
  await ev(A, u => { delete CS123.perf[u]; abrirPerfil(u) }, j.b); await sleep(1200); await U.foto(A, 'sg181-se-perfil-fechado');
  ok(await ev(A, () => document.documentElement.scrollWidth <= innerWidth && $('#layer .pfv').scrollWidth <= $('#layer .pfv').clientWidth + 1), 'iPhone SE: perfil sem rolagem lateral');
  await fecha(A); await ev(A, u => { go('msgs'); abrirConversa(u) }, j.b); await sleep(800); await U.foto(A, 'sg181-se-conversa');
  ok(await ev(A, () => /perfil fechado/.test(($('#v-msgs .dm-comp .hint') || {}).textContent || '')), 'deixou de seguir perfil fechado: conversa bloqueada (Bia nunca escreveu)');
  await ev(A, () => { THREAD = null; go('feed') }); await A.setViewportSize({ width: 390, height: 844 });
  // Ajustes: sem Melhores amigos e sem cartão de amigos na Conta
  await ev(A, () => { go('me'); PF_ABA = 'conta'; renderMe() }); await sleep(600);
  ok(await ev(A, () => !/Melhores amigos|Adicionar amigos|Pedido de amizade/i.test($('#v-me').innerText)), 'Conta e ajustes: sem Melhores amigos, amigos e pedidos de amizade');
  await ev(A, () => { PF_ABA = 'posts'; renderMe() });
  ok(!A._erros.length && !(C && C._erros.length), 'com o SQL: nenhum erro na página', [A._erros, C && C._erros]);
  const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error('Error', e); process.exit(1) });
