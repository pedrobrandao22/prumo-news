// Decisões do Pedro (129, 04/11):
// 2. lista de seguidores (e de quem a pessoa segue) visível para os membros (perfil aberto) e para os amigos (perfil fechado),
//    sem quem bloqueou/foi bloqueado e sem contas suspensas; fechar o perfil não apaga seguidores (1);
// 3. repost de NOTÍCIA sem comentário se junta: a notícia uma vez, com "Bia e Carla repostaram"; a citação continua à parte;
// 4. Atividade: repost e citação feitos por quem só segue a autora aparecem (função reposts_dos_meus_posts da v11).
// Confere o banco como cada pessoa (PGlite, v11 rodada duas vezes), o app com a v11 e o app com o banco SEM a v11.
// Portas 8790–8791. Capturas em qa/decisoes-0411/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8790, PORTA2 = 8791, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'decisoes-0411'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
const shot = async (p, n) => { await ev(p, () => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(QA, n + '.png') }) };
let srv = null, srv2 = null;
(async () => {
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const v11 = ler('sql/publicacoes-v11.sql');
  ok(ler('prumo-supabase.sql').indexOf(v11) > 0 && ler('sql/prumo-supabase.antes-v11.sql').indexOf('seguidores_lista') < 0, 'a v11 está no fim do prumo-supabase.sql e fora da cópia de antes');
  ok(/rodar depois da v9 e da v10/i.test(v11.slice(0, 400)) && !/(drop|delete|truncate|alter)\s/i.test(v11.replace(/--.*$/gm, '')), 'v11: cabeçalho e só funções (nada de apagar ou mudar tabela)');

  /* ======================= 1. o banco, como cada pessoa ======================= */
  const tmp = path.join(raiz, 'review3', 'var', 'sqlv11.sql'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, [ler('sql/prumo-supabase.antes-v11.sql'), v11, v11].join('\n'));  // pode rodar de novo
  const H = await require('../harness').criar({ sql: tmp });
  const ids = {}; for (const k of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) ids[k] = await H.criarConta(k + '@x', '1');
  await H.sql(`insert into public.membros(uid,nome,papel,foto) values ($1,'Pedro','admin',null),($2,'Bia','membro',null),($3,'Carla','membro',null),($4,'Dani','membro',$8),($5,'Edu','membro',$9),($6,'Fábio','membro',null),($7,'Gabi','membro',null)`,
    [ids.a, ids.b, ids.c, ids.d, ids.e, ids.f, ids.g, ids.d + '/d.jpg', ids.e + '/e.jpg']);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]); // só Pedro–Bia
  await H.sql(`update membros set perfil_aberto = true where uid in ($1,$2)`, [ids.b, ids.d]);     // Bia e Dani abertas
  await H.sql(`insert into seguidores(seguidor,seguido,at) values ($1,$4,1),($2,$4,2),($3,$4,3),($4,$1,4)`, [ids.d, ids.e, ids.f, ids.b]); // Dani, Edu, Fábio seguem a Bia; Bia segue a Dani
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const erro = async (k, q, p) => { try { await (k ? como(k, q, p) : H.comoUsuario(null, () => H.db.query(q, p || []))); return null } catch (e) { return e.code || e.message } };
  const lista = (k, u, t = 'seguidores') => como(k, `select * from public.seguidores_lista($1,$2)`, [ids[u], t]);
  const nomes = l => l.map(x => x.nome).sort().join(',');
  const cont = async (k, u) => (await como(k, `select public.seguidores_contagem($1) c`, [ids[u]]))[0].c;

  ok((await como('g', `select * from seguidores`)).length === 0, 'antes: a Gabi (terceira) não lê a tabela seguidores (a regra seg_ler continua)');
  let l = await lista('g', 'b');
  ok(nomes(l) === 'Dani,Edu,Fábio', 'perfil aberto: a Gabi (não é amiga de ninguém) vê os seguidores da Bia', nomes(l));
  const dn = l.find(x => x.nome === 'Dani'), ed = l.find(x => x.nome === 'Edu');
  ok(dn.foto === ids.d + '/d.jpg' && ed.foto === null && ed.inicial === 'E' && dn.aberto === true && ed.aberto === false && l[0].nome === 'Fábio', 'só nome, foto (só de perfil aberto ou de quem ela já vê), inicial e desde quando (mais recente primeiro)', l);
  ok(Object.keys(l[0]).sort().join(',') === 'aberto,at,foto,inicial,nome,uid', 'a lista não devolve mais nada da pessoa', Object.keys(l[0]));
  ok(nomes(await lista('g', 'b', 'seguindo')) === 'Dani', 'perfil aberto: a Gabi vê quem a Bia segue');
  let c = await cont('g', 'b');
  ok(c.ok && c.seguidores === 3 && c.seguindo === 1 && c.aberto === true && c.sigo === false, 'contagem para a Gabi: 3 seguidores, 1 seguindo', c);
  ok((await lista('g', 'e')).length === 0 && (await cont('g', 'e')).ok === false, 'perfil fechado de quem não é amigo: nada (nem números)');
  ok(!!(await erro('g', `select * from public.seguidores_lista($1,'tudo')`, [ids.b])) && !!(await erro(null, `select * from public.seguidores_lista($1,'seguidores')`, [ids.b])) && !!(await erro(null, `select public.seguidores_contagem($1)`, [ids.b])), 'tipo inválido e sem login: erro');
  // bloqueio de um seguidor com quem pede (e ao contrário)
  await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [ids.e, ids.g]);
  l = await lista('g', 'b'); c = await cont('g', 'b');
  ok(nomes(l) === 'Dani,Fábio' && c.seguidores === 2, 'o Edu bloqueou a Gabi: some da lista e da contagem dela', [nomes(l), c]);
  ok(nomes(await lista('a', 'b')) === 'Dani,Edu,Fábio', '…e continua para o Pedro');
  await H.sql(`delete from bloqueios`); await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [ids.g, ids.d]);
  ok(nomes(await lista('g', 'b')) === 'Edu,Fábio' && nomes(await lista('g', 'b', 'seguindo')) === '', 'a Gabi bloqueou a Dani: a Dani some das listas dela');
  await H.sql(`delete from bloqueios`);
  // conta suspensa
  await H.sql(`update membros set suspenso_em = now() where uid=$1`, [ids.f]);
  ok(nomes(await lista('g', 'b')) === 'Dani,Edu' && (await cont('g', 'b')).seguidores === 2, 'conta suspensa (Fábio) sai da lista e da contagem');
  // fechar o perfil: não apaga ninguém; a lista fica só para os amigos
  await H.sql(`update membros set perfil_aberto = false where uid=$1`, [ids.b]);
  ok((await H.sql(`select count(*)::int n from seguidores where seguido=$1`, [ids.b]))[0].n === 3, '1: fechar o perfil não apaga os seguidores');
  ok((await lista('g', 'b')).length === 0 && (await cont('g', 'b')).ok === false, 'perfil fechado: a Gabi (não é amiga) não vê mais a lista');
  l = await lista('a', 'b'); c = await cont('a', 'b');
  ok(nomes(l) === 'Dani,Edu' && c.ok && c.seguidores === 2 && c.amigo === true, 'perfil fechado: o Pedro (amigo) continua vendo a lista e os números', [nomes(l), c]);
  ok(nomes(await lista('b', 'b')) === 'Dani,Edu', 'a própria Bia vê a lista');
  await H.sql(`update membros set perfil_aberto = true where uid=$1`, [ids.b]);
  ok(nomes(await lista('g', 'b')) === 'Dani,Edu', 'reaberto: a lista volta para a Gabi (com os mesmos seguidores)');
  await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [ids.b, ids.g]);
  ok((await lista('g', 'b')).length === 0 && (await cont('g', 'b')).ok === false, 'a Bia bloqueou a Gabi: nada para a Gabi');
  await H.sql(`delete from bloqueios`);
  await H.sql(`update membros set suspenso_em = null where uid=$1`, [ids.f]);

  /* ---------- 4. reposts dos meus posts ---------- */
  const pub = async (k, r) => (await H.sql(`insert into publicacoes(autor,tipo,texto,publico,estilo,at) values ($1,'post',$2,$3,$4,$5) returning id`,
    [ids[k], r.texto || '', r.publico || 'amigos', r.estilo || { v: 2 }, r.at || Date.now()]))[0].id;
  const rp = (k, id, texto, publico) => pub(k, { texto, publico, estilo: { v: 2, rp: { k: 'pub', id } } });
  const P = {};
  P.p1 = await pub('b', { texto: 'Post da Bia para seguidores', publico: 'seguidores' });
  P.p2 = await pub('b', { texto: 'Post da Bia para amigos' });
  P.p3 = await pub('b', { texto: 'Post que a Bia vai arquivar' });
  P.r1 = await rp('d', P.p1, '', 'amigos');                       // Dani (segue a Bia) repostou
  P.r2 = await rp('d', P.p1, 'Concordo com a Bia', 'seguidores');  // Dani citou, para seguidores (a Bia segue a Dani, perfil aberto)
  P.r3 = await rp('e', P.p1, 'Texto que a Bia não pode ler', 'amigos'); // Edu citou, só para os amigos dele
  P.r4 = await rp('a', P.p2, '', 'amigos');                       // Pedro (amigo) repostou
  P.r5 = await rp('g', P.p2, '', 'amigos');                       // Gabi: nem amiga nem seguidora
  P.r6 = await rp('d', P.p2, '', 'proximos');                     // Dani, só para os Melhores amigos dela
  P.r7 = await rp('a', P.p3, '', 'amigos');                       // Pedro repostou o post que vai ser arquivado
  P.r8 = await rp('f', P.p1, '', 'amigos');                       // Fábio (vai ser suspenso)
  P.r9 = await rp('d', P.p2, '', 'amigos'); await H.sql(`update publicacoes set arquivado = true where id=$1`, [P.r9]); // repost arquivado
  ok((await como('b', `select id from publicacoes where id = any($1)`, [[P.r1, P.r3]])).length === 0, 'o problema: pela regra de leitura, a Bia não lê os reposts da Dani e do Edu');
  const rps = async (k, desde = 0) => como(k, `select * from public.reposts_dos_meus_posts($1)`, [desde]);
  let r = await rps('b'); const por = id => r.find(x => x.id === id);
  ok(r.length === 6 && [P.r1, P.r2, P.r3, P.r4, P.r7, P.r8].every(por), 'Bia: os reposts da Dani, do Edu, do Fábio e do Pedro (sem a Gabi, o "Melhores amigos" e o arquivado)', r.map(x => x.nome + ':' + x.trecho));
  ok(por(P.r1).orig === P.p1 && por(P.r1).nome === 'Dani' && por(P.r1).citacao === false && por(P.r1).visivel === false && por(P.r1).foto === ids.d + '/d.jpg', 'repost da Dani: original, nome, foto (perfil aberto), não é citação, a Bia não abre o repost', por(P.r1));
  ok(por(P.r2).citacao === true && por(P.r2).visivel === true && por(P.r2).trecho === 'Concordo com a Bia', 'citação para seguidores (a Bia segue a Dani): vem o comentário', por(P.r2));
  ok(por(P.r3).citacao === true && por(P.r3).visivel === false && por(P.r3).trecho === null && por(P.r3).foto === null, 'citação só para os amigos do Edu: aparece, sem o comentário e sem a foto', por(P.r3));
  ok(por(P.r4).visivel === true && por(P.r4).citacao === false, 'repost do Pedro (amigo): visível');
  await H.sql(`update publicacoes set arquivado = true where id=$1`, [P.p3]); await H.sql(`update membros set suspenso_em = now() where uid=$1`, [ids.f]);
  r = await rps('b');
  ok(!por(P.r7) && !por(P.r8) && r.length === 4, 'original arquivado e conta suspensa: saem');
  await H.sql(`delete from publicacoes where id=$1`, [P.p2]);
  r = await rps('b');
  ok(!por(P.r4) && r.length === 3, 'original apagado: sai');
  await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [ids.b, ids.e]);
  r = await rps('b');
  ok(!por(P.r3) && r.length === 2, 'a Bia bloqueou o Edu: o repost dele sai');
  await H.sql(`delete from bloqueios`);
  ok((await rps('b', Date.now() + 864e5)).length === 0, 'p_desde: nada depois da data pedida');
  ok((await rps('a')).length === 0 && (await rps('d')).length === 0, 'cada um só vê os reposts dos próprios posts');
  ok(!!(await erro(null, `select * from public.reposts_dos_meus_posts(0)`)), 'sem login: erro');
  await H.sql(`delete from seguidores where seguidor=$1 and seguido=$2`, [ids.d, ids.b]);
  ok((await rps('b')).length === 0, 'a Dani deixou de seguir (e não é amiga): os reposts dela saem da Atividade da Bia');

  /* ======================= 2. o app com a v11 ======================= */
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H2 = await require('../harness').criar();
  const i2 = {}; for (const k of ['a', 'b', 'c', 'd', 'g']) i2[k] = await H2.criarConta(k + '@x', '123456');
  await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro'),($5,'Gabi Nunes','membro')`, [i2.a, i2.b, i2.c, i2.d, i2.g]);
  await H2.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita')`, [i2.a, i2.b, i2.c]);
  await H2.sql(`update membros set perfil_aberto = true where uid in ($1,$2)`, [i2.b, i2.d]);
  await H2.sql(`insert into seguidores(seguidor,seguido) values ($1,$2)`, [i2.d, i2.b]); // Dani segue a Bia (não são amigas)
  const br = await U.navegador();
  const abrir = async (H, ii, k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ii[k], email: k + '@x' } } }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null, null, 15000); await sleep(500); await fecha(p); return p };
  const A = await abrir(H2, i2, 'a'), B = await abrir(H2, i2, 'b'), C = await abrir(H2, i2, 'c'), D = await abrir(H2, i2, 'd'), G = await abrir(H2, i2, 'g');
  ok(await ev(A, () => typeof dz129Feed === 'function' && V9.on === true && document.documentElement.classList.contains('dc122')), 'estado de produção e o 129 carregado');

  /* ---------- 2. listas de seguir ---------- */
  await ev(G, () => cs123Abertos('')); await ev(G, u => abrirPerfil(u), i2.b); await sleep(900); await ev(G, () => { if (PFV) pfvDesenha() }); await sleep(300);
  ok(await esperar(G, () => /1\s*seguidor/.test(document.querySelector('#layer .pfv .cs123-num')?.textContent || ''), null, 5000) && await ev(G, () => DZ129.v11 === true), 'Gabi (terceira) no perfil aberto da Bia: "1 seguidor", da v11');
  await ev(G, () => document.querySelector('#layer .pfv [data-cs123lista="seguidores"]').click());
  ok(await esperar(G, () => /Dani Rocha/.test(document.querySelector('#cs123-lb')?.textContent || ''), null, 5000), 'lista de seguidores da Bia para a Gabi: Dani Rocha');
  await shot(G, '01-gabi-seguidores-bia'); await fecha(G);
  await H2.sql(`update membros set perfil_aberto = false where uid=$1`, [i2.b]);
  ok((await H2.sql(`select count(*)::int n from seguidores where seguido=$1`, [i2.b]))[0].n === 1, '1: fechar o perfil não apaga o seguidor');
  await ev(A, u => { delete CS123.perf[u]; abrirPerfil(u) }, i2.b); await sleep(900); await ev(A, () => { if (PFV) pfvDesenha() }); await sleep(300);
  ok(await esperar(A, () => /1\s*seguidor/.test(document.querySelector('#layer .pfv .cs123-num')?.textContent || ''), null, 5000), 'Pedro (amigo) no perfil fechado da Bia: os números aparecem (antes, só no perfil aberto)');
  await ev(A, () => document.querySelector('#layer .pfv [data-cs123lista="seguidores"]').click());
  ok(await esperar(A, () => /Dani Rocha/.test(document.querySelector('#cs123-lb')?.textContent || ''), null, 5000) && !/não vê no Prumo/.test(await ev(A, () => document.querySelector('#cs123-lb').textContent)), 'Pedro vê a Dani na lista (ele não conhece a Dani: antes, "Mais 1 pessoa que você não vê")');
  await shot(A, '02-pedro-seguidores-bia-fechado'); await fecha(A);
  await ev(G, u => { delete CS123.perf[u]; abrirPerfil(u) }, i2.b); await sleep(900);
  ok(await ev(G, () => !document.querySelector('#layer .cs123-num')), 'perfil fechado: a Gabi não vê os números'); await fecha(G);
  await H2.sql(`update membros set perfil_aberto = true where uid=$1`, [i2.b]);

  /* ---------- 3. repost de notícia ---------- */
  const pk = await ev(A, () => { FILTRO = 'tudo'; return listaFeed().filter(p => p && !p.__pub && pautaById(p.id)).map(p => p.id) });
  const N = pk[6], N2 = pk[8];
  const ins = (P, r) => ev(P, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], pid: null, ...r }).select('id'); if (q.error) throw new Error(q.error.message); await pubCarregar(); return q.data[0].id }, r);
  const Q = {};
  Q.rb = await ins(B, { texto: '', estilo: { v: 2, rp: { k: 'pauta', id: N } }, snap: { titulo: 'Notícia' } });
  Q.rc = await ins(C, { texto: '', estilo: { v: 2, rp: { k: 'pauta', id: N } }, snap: { titulo: 'Notícia' } });
  Q.qc = await ins(C, { texto: 'Essa notícia explica bem o problema.', estilo: { v: 2, rp: { k: 'pauta', id: N } }, snap: { titulo: 'Notícia' } });
  Q.rb2 = await ins(B, { texto: '', estilo: { v: 2, rp: { k: 'pauta', id: N2 } }, snap: { titulo: 'Notícia 2' } });
  const feed = P => ev(P, async () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } PUB.sig = ''; await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
  await feed(A); await sleep(600);
  const fa = await ev(A, ([N, Q]) => ({ n: document.querySelectorAll(`#posts [id="p-${N}"]`).length, l: document.querySelector(`#posts [id="p-${N}"] .dc122-rpl`)?.textContent.trim() || '',
    rb: document.querySelectorAll(`#posts [id="p-u:${Q.rb}"]`).length, rc: document.querySelectorAll(`#posts [id="p-u:${Q.rc}"]`).length, qc: document.querySelectorAll(`#posts [id="p-u:${Q.qc}"]`).length,
  }), [N, Q]);
  ok(fa.n === 1 && fa.l === 'Carla e Bia repostaram' && !fa.rb && !fa.rc, 'Feed do Pedro: a notícia uma vez, com "Carla e Bia repostaram" (mais recente primeiro), sem os cartões de repost', fa);
  ok(fa.qc === 1, 'a citação da Carla (com comentário) continua um item à parte', fa);
  const sob = await ev(A, N => { const rp = (id, au, at) => ({ id: 'u:' + id, __pub: { id, autor: au, tipo: 'post', texto: '', at, estilo: { rp: { k: 'pauta', id: N } } } });
    const l = dz129Feed([{ id: 'z' }, rp('r2', 'x2', 2), { id: 'y' }, rp('r1', 'x1', 1), { id: N }, { id: 'w' }]); return l.map(p => p.id + (p.__dc122 ? '[' + p.__dc122.us.join('+') + ']' : '')).join(',') }, N);
  ok(sob === `z,${N}[x2+x1],y,w`, 'a notícia sobe para onde estava o repost mais recente (como nos posts)', sob);
  const l2 = await ev(A, N2 => document.querySelector(`#posts [id="p-${N2}"] .dc122-rpl`)?.textContent.trim() || '', N2);
  ok(l2 === 'Bia repostou', 'outra notícia, um repost só: "Bia repostou"', l2);
  await ev(A, N => { const e = document.getElementById('p-' + N); scrollTo(0, e.getBoundingClientRect().top + scrollY - 64) }, N); await sleep(300); await shot(A, '03-noticia-repostada');
  await feed(B); await sleep(600);
  const lb = await ev(B, N => document.querySelector(`#posts [id="p-${N}"] .dc122-rpl`)?.textContent.trim() || '', N);
  ok(lb === 'Você e Carla repostaram' && await ev(B, id => !document.querySelector(`#posts [id="p-u:${id}"]`), Q.rb), 'Feed da Bia: "Você e Carla repostaram", sem o próprio repost repetido', lb);
  const dv = await ev(A, N => { const r = dz129Feed([{ id: 'u:x', __pub: { id: 'x', autor: S.uid, tipo: 'post', texto: '', at: Date.now(), estilo: { rp: { k: 'pauta', id: 'pauta-que-nao-existe' } } } }]); return r.length }, N);
  ok(dv === 1, 'notícia fora da lista (saiu da edição): o repost fica');

  /* ---------- 4. Atividade da Bia: repost e citação da Dani (só segue) ---------- */
  const pb = await ins(B, { texto: 'Post da Bia para seguidores', publico: 'seguidores', estilo: { v: 2 } });
  const pb2 = await ins(B, { texto: 'Post da Bia para amigos', estilo: { v: 2 } });
  await H2.sql(`insert into seguidores(seguidor,seguido) values ($1,$2)`, [i2.b, i2.d]); // a Bia segue a Dani (aberta): lê o que a Dani publica para seguidores
  await ev(D, () => { CS123.t = 0; return cs123Carregar() }); await ev(D, () => { PUB.sig = ''; return pubCarregar() });
  const rd1 = await ev(D, async id => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], texto: '', publico: 'amigos', estilo: { v: 2, rp: { k: 'pub', id } } }).select('id'); return q.data && q.data[0].id }, pb);
  const qd = await ev(D, async id => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], texto: 'A Bia tem razão sobre isso.', publico: 'seguidores', estilo: { v: 2, rp: { k: 'pub', id } } }).select('id'); return q.data && q.data[0].id }, pb);
  const rc2 = await ins(C, { texto: '', estilo: { v: 2, rp: { k: 'pub', id: pb2 } } });
  ok(!!rd1 && !!qd && !!rc2, 'Dani repostou e citou; Carla (amiga) repostou');
  await ev(B, () => { CS123.t = 0; return cs123Carregar() }); await ev(B, () => { PUB.sig = ''; AT.t = 0; return pubCarregar() }); await ev(B, () => atCarregar()); await sleep(300);
  const atB = await ev(B, () => atItens().filter(x => x.acao === 'vnrp').map(x => ({ t: x.txt.replace(/<[^>]+>/g, ''), k: x.k })));
  const ts = atB.map(x => x.t).sort();
  ok(atB.length === 3 && ts.some(t => t === 'Dani Rocha repostou sua publicação') && ts.some(t => t === 'Dani Rocha repostou sua publicação: “A Bia tem razão sobre isso.”') && ts.some(t => t === 'Carla Mendes repostou sua publicação'), 'Atividade da Bia: repost e citação da Dani (que só segue) e o repost da Carla, sem repetir', atB);
  ok(new Set(atB.map(x => x.k)).size === atB.length, 'sem itens repetidos');
  await ev(B, () => abrirAtividade()); await sleep(800);
  ok(await ev(B, () => [...document.querySelectorAll('#layer .pfv-at .at-tx')].filter(e => /Dani Rocha repostou sua publicação/.test(e.textContent)).length === 2), 'na tela de Atividade aparecem os dois avisos da Dani');
  await shot(B, '04-atividade-bia'); await fecha(B);
  await H2.sql(`insert into bloqueios(de,para) values ($1,$2)`, [i2.b, i2.d]);
  await ev(B, async () => { CS123.t = 0; await cs123Carregar(); PUB.sig = ''; await pubCarregar(); AT.t = 0; DZ129.rt = 0; await atCarregar() }); await sleep(200);
  ok(await ev(B, () => !atItens().some(x => /Dani/.test(x.txt))), 'a Bia bloqueou a Dani: os avisos dela saem');
  const errs = [A, B, C, D, G].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console (banco com a v11)', JSON.stringify(errs.slice(0, 5)));

  /* ======================= 3. o app com o banco SEM a v11 ======================= */
  const H3 = await require('../harness').criar({ sql: path.join(raiz, 'sql', 'prumo-supabase.antes-v11.sql') });
  const i3 = {}; for (const k of ['a', 'b', 'c', 'd']) i3[k] = await H3.criarConta(k + '@x', '123456');
  await H3.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro')`, [i3.a, i3.b, i3.c, i3.d]);
  await H3.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita')`, [i3.a, i3.b, i3.c]);
  await H3.sql(`update membros set perfil_aberto = true where uid in ($1,$2)`, [i3.b, i3.d]);
  await H3.sql(`insert into seguidores(seguidor,seguido) values ($1,$2)`, [i3.d, i3.b]);
  const A3 = await abrir(H3, i3, 'a', { base: BASE2, n: '3' }), B3 = await abrir(H3, i3, 'b', { base: BASE2, n: '3' }), D3 = await abrir(H3, i3, 'd', { base: BASE2, n: '3' });
  await ev(B3, () => atCarregar()); await sleep(300);
  ok(await esperar(B3, () => DZ129.v11 === false, null, 8000), 'sem a v11: detectado');
  // perfil aberto da Bia visto pela Dani: os números e a lista como antes (seg_contagem/seg_lista)
  await ev(D3, () => cs123Abertos('')); await ev(D3, u => abrirPerfil(u), i3.b); await sleep(900); await ev(D3, () => { if (PFV) pfvDesenha() }); await sleep(300);
  ok(await esperar(D3, () => /1\s*seguidor/.test(document.querySelector('#layer .pfv .cs123-num')?.textContent || ''), null, 5000), 'sem a v11: números no perfil aberto como antes');
  await ev(D3, () => document.querySelector('#layer .pfv [data-cs123lista="seguidores"]').click());
  ok(await esperar(D3, () => /Você/.test(document.querySelector('#cs123-lb')?.textContent || ''), null, 5000), 'sem a v11: a lista abre (seg_lista)'); await fecha(D3);
  await H3.sql(`update membros set perfil_aberto = false where uid=$1`, [i3.b]);
  await ev(A3, u => { delete CS123.perf[u]; abrirPerfil(u) }, i3.b); await sleep(900);
  ok(await ev(A3, () => !document.querySelector('#layer .cs123-num')), 'sem a v11: perfil fechado do amigo sem números (como antes)'); await fecha(A3);
  // notícia repostada: junta também sem a v11 (é só o app)
  const pk3 = await ev(A3, () => { FILTRO = 'tudo'; return listaFeed().filter(p => p && !p.__pub && pautaById(p.id)).map(p => p.id) });
  await ins(B3, { texto: '', estilo: { v: 2, rp: { k: 'pauta', id: pk3[6] } }, snap: { titulo: 'Notícia' } });
  await feed(A3); await sleep(500);
  ok(await ev(A3, N => document.querySelector(`#posts [id="p-${N}"] .dc122-rpl`)?.textContent.trim() === 'Bia repostou', pk3[6]), 'sem a v11: a notícia repostada também aparece uma vez com "Bia repostou"');
  const pb3 = await ins(B3, { texto: 'Post da Bia', estilo: { v: 2 } }); await ins(A3, { texto: '', estilo: { v: 2, rp: { k: 'pub', id: pb3 } } });
  await ev(B3, () => { PUB.sig = ''; return pubCarregar() }); await ev(B3, () => abrirAtividade()); await sleep(800);
  ok(await ev(B3, () => atItens().filter(x => x.acao === 'vnrp').length === 1 && !!document.querySelector('#layer .pfv-at')), 'sem a v11: Atividade abre com o repost do amigo (como antes)');
  const errs3 = [A3, B3, D3].flatMap(p => p._erros);
  ok(!errs3.length, 'sem erros no console (banco sem a v11)', JSON.stringify(errs3.slice(0, 5)));
  await br.close();

  const R = U.resumo(); R.RES.filter(x => /^FAIL/.test(x)).forEach(x => console.log(x.slice(0, 900))); console.log(`\nRESUMO t_decisoes_0411: ${R.OKS} ok, ${R.FALHAS} falhas`);
  srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); if (srv) srv.kill(); if (srv2) srv2.kill(); process.exit(1) });
