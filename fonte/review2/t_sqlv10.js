// SQL v10 (avisos no celular) direto no banco (PGlite): aparelhos com regras só do dono, escolhas limpas, a fila preenchida
// pelos gatilhos conforme o que cada um ligou (mensagens, menções, pedidos, comentários, curtidas, reposts, comentário em notícia),
// bloqueio, falha de aviso que não impede a gravação, e o "Seguir" com e sem a tabela seguidores (e com outros nomes de coluna).
const U = require('../t_util'); const { ok } = U; const fs = require('fs'), path = require('path');
(async () => {
  const raiz = path.join(__dirname, '..'), ler = f => fs.readFileSync(path.join(raiz, f), 'utf8');
  const v10 = ler('sql/publicacoes-v10.sql');
  const tmp = path.join(raiz, 'review3', 'var', 'sqlv10.sql'); fs.mkdirSync(path.dirname(tmp), { recursive: true });
  // banco de antes + v10 duas vezes (pode rodar de novo)
  fs.writeFileSync(tmp, [ler('prumo-supabase.antes-v10.sql'), v10, v10].join('\n'));
  const H = await require('../harness').criar({ sql: tmp });
  const a = await H.criarConta('a@x', '1'), b = await H.criarConta('b@x', '1'), c = await H.criarConta('c@x', '1'), d = await H.criarConta('d@x', '1');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin'),($2,'Bia','membro'),($3,'Caio','membro'),($4,'Dani','membro')`, [a, b, c, d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [a, b, c]); // Pedro–Bia, Bia–Caio
  const como = (u, q, p) => H.comoUsuario(u, () => H.db.query(q, p)).then(r => r.rows);
  const erro = async (u, q, p) => { try { await como(u, q, p); return null } catch (e) { return e.code || e.message } };
  const fila = async (u, extra = '') => H.sql(`select tipo, de, chave, titulo, corpo, url from push_fila where para=$1 ${extra} order by id`, [u]);
  const limpa = () => H.sql(`delete from push_fila`);
  const ep = n => 'https://fcm.googleapis.com/fcm/send/' + n;
  const P = '"BA' + 'x'.repeat(85) + '"', AU = 'y'.repeat(22);
  const inscreve = (u, e, prefs) => como(u, `select public.push_inscrever($1,$2,$3,$4::jsonb,$5)`, [e, 'B' + 'p'.repeat(86), AU, JSON.stringify(prefs), 'teste']);

  /* ---------- chave pública ---------- */
  ok((await como(a, `select public.push_chave_publica() k`))[0].k === null, 'chave pública: vazia até o administrador gravar');
  await H.sql(`insert into public.config_app(chave, valor) values ('push_vapid_publica', jsonb_build_object('chave', 'BPUBLICA'))`);
  ok((await como(b, `select public.push_chave_publica() k`))[0].k === 'BPUBLICA', 'chave pública: qualquer membro lê');
  ok(!!(await erro(null, `select public.push_chave_publica()`)), 'chave pública: sem login não lê');
  ok(!!(await erro(b, `select valor from public.config_app`)) || (await como(b, `select valor from public.config_app`)).length === 0, 'config_app continua fechada');

  /* ---------- nada ligado: nada na fila ---------- */
  await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'oi')`, [b, a]);
  ok((await fila(a)).length === 0, 'sem aparelho: mensagem não vira aviso');

  /* ---------- inscrição e regras ---------- */
  await inscreve(a, ep('pedro1'), { mensagens: true, mencoes: true, amizades: true, comentarios: true, curtidas: true, reposts: true, seguidores: true, seguindo: true, colunas: true, bobagem: true, coberturas: 'sim' });
  let r = await H.sql(`select uid, prefs from push_inscricoes where endpoint=$1`, [ep('pedro1')]);
  ok(r.length === 1 && r[0].uid === a && !('bobagem' in r[0].prefs) && !('coberturas' in r[0].prefs) && r[0].prefs.mensagens === true, 'inscrever: guarda só os tipos conhecidos com sim/não', r[0] && r[0].prefs);
  ok((await como(b, `select * from push_inscricoes`)).length === 0, 'RLS: a Bia não vê o aparelho do Pedro');
  ok((await como(a, `select endpoint from push_inscricoes`)).length === 1, 'RLS: o Pedro vê o próprio');
  ok((await como(b, `update push_inscricoes set prefs='{}'::jsonb where uid=$1 returning 1`, [a])).length === 0, 'RLS: a Bia não muda as escolhas do Pedro');
  ok((await como(b, `delete from push_inscricoes where uid=$1 returning 1`, [a])).length === 0, 'RLS: a Bia não apaga o aparelho do Pedro');
  ok(!!(await erro(b, `insert into push_inscricoes(uid,endpoint,p256dh,auth) values ($1,$2,$3,$4)`, [a, ep('falso'), 'B' + 'p'.repeat(86), AU])), 'RLS: a Bia não inscreve aparelho em nome do Pedro');
  ok(!!(await erro(a, `update push_inscricoes set endpoint=$1`, [ep('outro')])), 'só as escolhas podem ser mudadas direto (o resto, só pela função)');
  ok(!!(await erro(null, `select * from push_inscricoes`)), 'sem login não lê os aparelhos');
  ok(!!(await erro(a, `select * from push_fila`)) && !!(await erro(b, `insert into push_fila(para,tipo,titulo) values ($1,'mensagens','x')`, [a])), 'fila: ninguém do app lê nem escreve');
  ok(!!(await erro(b, `select public.push_enfileirar($1,'mensagens',$2,'','x','y','./')`, [a, b])), 'fila: ninguém do app chama a função que enfileira');
  ok(!!(await erro(b, `select public.push_inscrever('http://inseguro.example/x',$1,$2,'{}'::jsonb,'')`, ['B' + 'p'.repeat(86), AU])), 'inscrever: só endereço https');
  // trocar de conta no mesmo aparelho: passa para a conta nova
  await inscreve(c, ep('pedro1'), { mensagens: true });
  r = await H.sql(`select uid from push_inscricoes where endpoint=$1`, [ep('pedro1')]);
  ok(r.length === 1 && r[0].uid === c, 'mesmo aparelho em outra conta: fica com a conta nova');
  await inscreve(a, ep('pedro1'), { mensagens: true, mencoes: true, amizades: true, comentarios: true, curtidas: true, reposts: true, seguidores: true, seguindo: true, colunas: true });
  for (let i = 0; i < 11; i++) await inscreve(d, ep('dani' + i), { mensagens: true });
  ok(+(await H.sql(`select count(*) n from push_inscricoes where uid=$1`, [d]))[0].n === 10, 'no máximo 10 aparelhos por pessoa');

  /* ---------- gatilhos ---------- */
  await limpa();
  await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'Viu a votação?')`, [b, a]);
  await como(b, `insert into mensagens(de,para,texto,tipo,pid) values ($1,$2,'olha isso','mencao','p1')`, [b, a]);
  await como(b, `insert into mensagens(de,para,texto,tipo) values ($1,$2,'❤️','reacao_msg')`, [b, a]);
  await como(b, `insert into mensagens(de,para,texto,tipo) values ($1,$2,'','curtiu_story')`, [b, a]);
  let f = await fila(a);
  ok(f.length === 4 && f[0].tipo === 'mensagens' && f[0].titulo === 'Bia' && f[0].corpo === 'Viu a votação?' && f[0].url === '?nt=conversa:' + b && f[0].chave === 'conv:' + b,
    'mensagem: aviso com o nome, o texto e a conversa', f[0]);
  ok(f[1].tipo === 'mencoes' && f[1].titulo === 'Bia mencionou você' && f[2].tipo === 'mensagens' && /^Reagiu à sua mensagem/.test(f[2].corpo) && f[3].tipo === 'curtidas' && f[3].titulo === 'Bia curtiu seu story', 'menção, reação e curtida no story', f);
  ok((await fila(b)).length === 0, 'quem manda não recebe aviso da própria mensagem');
  // Pedro desliga mensagens
  await como(a, `update push_inscricoes set prefs = prefs || '{"mensagens":false}'::jsonb where endpoint=$1`, [ep('pedro1')]);
  await limpa(); await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'de novo')`, [b, a]);
  ok((await fila(a)).length === 0, 'desligou mensagens: não entra na fila');
  // pedidos de amizade: Caio pede, Pedro aceita (o Caio só recebe se ligou)
  await limpa();
  await como(c, `select public.pedir_amizade($1)`, [a]);
  f = await fila(a); ok(f.length === 1 && f[0].tipo === 'amizades' && f[0].titulo === 'Caio quer ser seu amigo' && f[0].url === '?nt=pedidos', 'pedido de amizade: aviso para o Pedro', f);
  await como(c, `delete from push_inscricoes where uid=$1`, [c]);
  await inscreve(c, ep('caio1'), { amizades: true, comentarios: true });
  await como(a, `select public.responder_amizade($1, true)`, [c]);
  f = await fila(c); ok(f.length === 1 && f[0].titulo === 'Pedro aceitou seu pedido de amizade' && f[0].url === '?nt=perfil:' + a, 'pedido aceito: aviso para o Caio', f);
  // publicações: comentário, "também comentou", curtida, repost/citação
  await limpa();
  const pid = (await como(a, `insert into publicacoes(autor,tipo,texto) values ($1,'post','Post do Pedro') returning id`, [a]))[0].id;
  await como(b, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c1','{"texto":"Bom ponto"}')`, [pid, b]);
  await como(c, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c2','{"texto":"Também acho"}')`, [pid, c]);
  await como(b, `insert into pub_reacoes(pub,uid,tipo,chave) values ($1,$2,'curtida','')`, [pid, b]);
  f = await fila(a);
  ok(f.length === 3 && f[0].tipo === 'comentarios' && f[0].titulo === 'Bia comentou no seu post' && f[0].corpo === 'Bom ponto' && f[0].url === '?nt=comentarios:' + pid && f[2].tipo === 'curtidas' && f[2].titulo === 'Bia curtiu seu post', 'post: comentários e curtida para o autor', f);
  ok((await fila(b)).length === 0, 'a Bia não ligou comentários: não recebe "também comentou"');
  await inscreve(b, ep('bia1'), { comentarios: true, curtidas: true, reposts: true, seguidores: true, seguindo: true, colunas: true });
  await como(c, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','c3','{"texto":"E mais"}')`, [pid, c]);
  f = await fila(b); ok(f.length === 1 && f[0].titulo === 'Caio também comentou no post de Pedro', 'quem já comentou recebe "também comentou"', f);
  await limpa();
  await como(b, `insert into publicacoes(autor,tipo,texto,estilo) values ($1,'post','','{"rp":{"k":"pub","id":"${pid}"}}'::jsonb)`, [b]);
  await como(b, `insert into publicacoes(autor,tipo,texto,estilo) values ($1,'post','Concordo','{"rp":{"k":"pub","id":"${pid}"}}'::jsonb)`, [b]);
  f = await fila(a); ok(f.length === 2 && f[0].tipo === 'reposts' && f[0].titulo === 'Bia repostou sua publicação' && f[1].titulo === 'Bia citou sua publicação' && f[1].corpo === 'Concordo', 'repost e citação', f);
  // curtida em comentário (post e notícia) e comentário em notícia onde o outro comentou
  await limpa();
  await como(a, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'c1',$2,$3)`, [b, pid, a]);
  f = await fila(b); ok(f.length === 1 && f[0].titulo === 'Pedro curtiu seu comentário' && f[0].corpo === 'Bom ponto' && f[0].url === '?nt=comentarios:' + pid, 'curtida no comentário do post', f);
  await como(a, `select public.doc_mesclar($1, $2::jsonb)`, ['comentarios/' + a, JSON.stringify({ itens: { na1: { pid: 'pec-x', texto: 'Acho que passa', at: Date.now(), snap: { titulo: 'PEC da Segurança' } } } })]);
  await como(b, `select public.doc_mesclar($1, $2::jsonb)`, ['comentarios/' + b, JSON.stringify({ itens: { nb1: { pid: 'pec-x', texto: 'Não passa', at: Date.now(), snap: { titulo: 'PEC da Segurança' } } } })]);
  f = await fila(a, `and tipo='comentarios'`);
  ok(f.length === 1 && f[0].titulo === 'Bia também comentou em “PEC da Segurança”' && f[0].corpo === 'Não passa' && f[0].url === '?nt=noticia:pec-x', 'notícia: comentário de amigo onde você comentou', f);
  await limpa();
  await como(b, `insert into com_curtidas(autor,cid,pub,uid) values ($1,'na1',null,$2)`, [a, b]);
  f = await fila(a); ok(f.length === 1 && f[0].titulo === 'Bia curtiu seu comentário' && f[0].url === '?nt=noticia:pec-x', 'curtida no comentário da notícia', f);
  // stories e posts para "próximos" não avisam quem não vê
  await limpa();
  await como(a, `insert into publicacoes(autor,tipo,texto,expira) values ($1,'story','s',(extract(epoch from now())*1000)::bigint + 3600000)`, [a]);
  ok((await H.sql(`select count(*) n from push_fila`))[0].n == 0, 'story novo não avisa ninguém');

  /* ---------- bloqueio, conta suspensa e falha do aviso ---------- */
  ok((await H.sql(`select public.push_enfileirar($1,'comentarios',$2,'','x','y','./') ok`, [a, c]))[0].ok === true, 'enfileirar direto (como a função de envio)');
  await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [a, c]);
  ok((await H.sql(`select public.push_enfileirar($1,'comentarios',$2,'','x','y','./') ok`, [a, c]))[0].ok === false && (await H.sql(`select public.push_enfileirar($1,'amizades',$2,'','x','y','./') ok`, [c, a]))[0].ok === false, 'bloqueio (nos dois sentidos): sem aviso');
  await H.sql(`delete from bloqueios`);
  await H.sql(`update membros set suspenso_em=now() where uid=$1`, [a]);
  ok((await H.sql(`select public.push_enfileirar($1,'comentarios',$2,'','x','y','./') ok`, [a, b]))[0].ok === false, 'conta suspensa não recebe');
  await H.sql(`update membros set suspenso_em=null where uid=$1`, [a]);
  await H.sql(`alter table push_fila rename to push_fila_x`);
  let gravou = true; try { await como(b, `insert into mensagens(de,para,texto) values ($1,$2,'mesmo sem fila')`, [b, a]) } catch (e) { gravou = false }
  await H.sql(`alter table push_fila_x rename to push_fila`);
  ok(gravou && +(await H.sql(`select count(*) n from mensagens where texto='mesmo sem fila'`))[0].n === 1, 'aviso com erro não impede a mensagem de ser gravada');
  // pg_net (opcional): sem a extensão, o gatilho da fila não faz nada e não atrapalha
  await H.sql(`insert into config_app(chave,valor) values ('push_funcao_url', '{"url":"https://exemplo.supabase.co/functions/v1/enviar-push"}'::jsonb)`);
  await como(b, `insert into mensagens(de,para,texto,tipo) values ($1,$2,'oi','mencao')`, [b, a]);
  ok(+(await H.sql(`select count(*) n from push_fila where tipo='mencoes'`))[0].n >= 1, 'com o endereço da função gravado e sem pg_net: fila segue normal');

  /* ---------- sem a v9: nada de seguidores ---------- */
  await limpa();
  await como(b, `insert into publicacoes(autor,tipo,texto) values ($1,'post','Post da Bia')`, [b]);
  ok((await H.sql(`select count(*) n from push_fila where tipo in ('seguindo','colunas')`))[0].n == 0, 'sem a tabela seguidores: post não avisa "quem segue"');

  /* ---------- com a v9 (seguidor/seguido) ---------- */
  await H.db.exec(`create table public.seguidores(seguidor uuid not null references public.membros(uid) on delete cascade, seguido uuid not null references public.membros(uid) on delete cascade,
    criado_em timestamptz not null default now(), primary key(seguidor, seguido));`);
  await H.db.exec(v10);   // v9 depois da v10: rodar a v10 de novo liga o aviso de novo seguidor
  await limpa();
  await H.sql(`insert into seguidores(seguidor,seguido) values ($1,$2),($3,$2),($4,$2)`, [a, b, c, d]);   // Pedro, Caio e Dani seguem a Bia
  await H.sql(`insert into seguidores(seguidor,seguido) values ($1,$2)`, [b, a]);                         // a Bia segue o Pedro
  f = await fila(b); const fa = await fila(a);
  ok(f.length === 3 && f.every(x => x.tipo === 'seguidores') && f[0].titulo === 'Pedro começou a seguir você' && f[0].url === '?nt=perfil:' + a && fa.length === 1 && fa[0].titulo === 'Bia começou a seguir você'
    && (await fila(c)).length === 0, 'novo seguidor: um aviso por pessoa que começou a seguir (só para quem ligou)', [f, fa]);
  await limpa();
  const pb = (await como(b, `insert into publicacoes(autor,tipo,texto) values ($1,'post','Fim de tarde') returning id`, [b]))[0].id;
  await como(b, `insert into publicacoes(autor,tipo,texto,estilo) values ($1,'post','Texto longo','{"coluna":true,"titulo":"O que muda"}'::jsonb)`, [b]);
  await como(b, `insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Só próximos','proximos')`, [b]);
  f = await fila(a);
  ok(f.length === 2 && f[0].tipo === 'seguindo' && f[0].titulo === 'Bia publicou' && f[0].url === '?nt=pub:' + pb && f[1].tipo === 'colunas' && f[1].titulo === 'Bia publicou uma coluna' && f[1].corpo === 'O que muda', 'quem segue: post e coluna (o de "próximos" não)', f);
  ok((await fila(c)).length === 0 && (await fila(d)).length === 0, 'quem não ligou (Caio) ou não vê a publicação (Dani, não é amiga) não recebe');
  // outra forma da v9 (de/para): as colunas são descobertas na hora
  await H.db.exec(`drop table public.seguidores; create table public.seguidores(de uuid not null references public.membros(uid), para uuid not null references public.membros(uid), at bigint, primary key(de, para));`);
  await H.db.exec(v10); await limpa();
  await H.sql(`insert into seguidores(de,para) values ($1,$2)`, [a, b]);
  await como(b, `insert into publicacoes(autor,tipo,texto) values ($1,'post','Outro')`, [b]);
  f = await fila(a); const fb = await fila(b);
  ok(f.length === 1 && f[0].tipo === 'seguindo' && fb.length === 1 && fb[0].tipo === 'seguidores', 'v9 com colunas de/para: também funciona', [f, fb]);

  /* ---------- excluir a conta limpa aparelhos e fila ---------- */
  await como(c, `insert into mensagens(de,para,texto) values ($1,$2,'tchau')`, [c, b]).catch(() => { });
  await como(a, `select public.excluir_conta()`);
  ok(+(await H.sql(`select count(*) n from push_inscricoes where uid=$1`, [a]))[0].n === 0 && +(await H.sql(`select count(*) n from push_fila where para=$1 or de=$1`, [a]))[0].n === 0, 'excluir a conta apaga os aparelhos e os avisos');

  /* ---------- QA noite B: só avisa quem ainda vê; coluna da v9; autor suspenso; excluir conta sem fila ---------- */
  {
    const e = await H.criarConta('e@x', '1'), f2 = await H.criarConta('f@x', '1'), g = await H.criarConta('g@x', '1'), h = await H.criarConta('h@x', '1');
    await H.sql(`alter table public.membros add column if not exists perfil_aberto boolean not null default false`);
    await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Eva','membro'),($2,'Fabi','membro'),($3,'Gil','membro'),($4,'Hugo','membro')`, [e, f2, g, h]);
    await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita')`, [e, f2, g]);  // Eva–Fabi, Eva–Gil, Fabi–Gil
    const tudo = { mensagens: true, mencoes: true, amizades: true, comentarios: true, curtidas: true, reposts: true, seguidores: true, seguindo: true, colunas: true };
    for (const [u, n] of [[e, 'eva'], [f2, 'fabi'], [g, 'gil'], [h, 'hugo']]) await inscreve(u, ep(n + '1'), tudo);
    await limpa();
    const pe = (await como(e, `insert into publicacoes(autor,tipo,texto) values ($1,'post','Post da Eva') returning id`, [e]))[0].id;
    await como(g, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','g1','{"texto":"Oi do Gil"}')`, [pe, g]);
    await como(f2, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','f1','{"texto":"Oi da Fabi"}')`, [pe, f2]);
    let fg = await fila(g);
    ok(fg.length === 1 && fg[0].titulo === 'Fabi também comentou no post de Eva', 'NB10: "também comentou" chega a quem ainda vê o post (a conferência não depende de quem está logado)', fg);
    await como(e, `insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','e1','{"texto":"Obrigada"}')`, [pe, e]);
    await como(e, `insert into pub_reacoes(pub,uid,tipo,chave) values ($1,$2,'curtida','')`, [pe, e]);
    ok((await fila(e)).filter(x => /Eva/.test(x.titulo)).length === 0, 'ação em si mesmo (comentar e curtir o próprio post) não avisa');
    // Gil deixa de ser amigo da Eva: não vê mais o post, não recebe "também comentou" nem a curtida no comentário dele
    await H.sql(`delete from amizades where (de=$1 and para=$2) or (de=$2 and para=$1)`, [e, g]); await limpa();
    await H.sql(`insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','f2','{"texto":"Segredo"}')`, [pe, f2]);
    await H.sql(`insert into com_curtidas(autor,cid,pub,uid) values ($1,'g1',$2,$3)`, [g, pe, f2]);
    ok((await fila(g)).length === 0, 'NB10: quem deixou de ver o post não recebe "também comentou" nem curtida no próprio comentário', await fila(g));
    await H.sql(`insert into amizades(de,para,status) values ($1,$2,'aceita')`, [e, g]); await limpa();
    await H.sql(`insert into com_curtidas(autor,cid,pub,uid) values ($1,'g1',$2,$3) on conflict do nothing`, [g, pe, e]);
    ok((await fila(g)).length === 1, 'curtida no comentário de quem vê o post: avisa');
    // arquivado: ninguém além da autora vê
    await H.sql(`update publicacoes set arquivado=true where id=$1`, [pe]); await limpa();
    await H.sql(`insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','f3','{"texto":"Depois de arquivar"}')`, [pe, f2]);
    ok((await fila(g)).length === 0, 'post arquivado: quem comentou antes não recebe "também comentou"');
    // bloqueio entre quem comenta e quem recebe
    await H.sql(`update publicacoes set arquivado=false where id=$1`, [pe]); await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [g, f2]); await limpa();
    await H.sql(`insert into pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','f4','{"texto":"Bloqueado"}')`, [pe, f2]);
    ok((await fila(g)).length === 0 && (await fila(e)).length === 1, 'bloqueio: o Gil não é avisado do comentário da Fabi (a Eva é)');
    await H.sql(`delete from bloqueios`);
    // menção num post "só próximos": só avisa se a pessoa está nos próximos
    await limpa();
    const pp = (await como(e, `insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Só para próximos @Gil','proximos') returning id`, [e]))[0].id;
    await como(e, `insert into mensagens(de,para,texto,tipo,pid) values ($1,$2,'Só para próximos @Gil','mencao',$3)`, [e, g, 'u:' + pp]);
    ok((await fila(g)).length === 0, 'NB11: menção num post que a pessoa não vê (próximos) não vira aviso');
    await H.sql(`insert into melhores_amigos(dono,amigo) values ($1,$2)`, [e, g]);
    await como(e, `insert into mensagens(de,para,texto,tipo,pid) values ($1,$2,'Agora sim @Gil','mencao',$3)`, [e, g, 'u:' + pp]);
    await como(e, `insert into mensagens(de,para,texto,tipo,pid) values ($1,$2,'Olha a notícia','mencao','pec-x')`, [e, g]);
    fg = await fila(g); ok(fg.length === 2 && fg.every(x => x.tipo === 'mencoes'), 'menção: nos próximos e numa notícia, avisa', fg);
    // seguidores: perfil aberto, coluna da v9 e autor suspenso
    await limpa();
    await H.sql(`insert into seguidores(de,para) values ($1,$2)`, [h, e]);   // o Hugo (não é amigo) segue a Eva
    await H.sql(`delete from push_fila`);
    await como(e, `insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Para seguidores','seguidores')`, [e]).catch(() => H.sql(`insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Para seguidores','amigos')`, [e]));
    ok((await fila(h)).length === 0, 'perfil fechado: quem só segue não é avisado');
    await H.sql(`update membros set perfil_aberto=true where uid=$1`, [e]);
    await H.sql(`alter table publicacoes drop constraint if exists publicacoes_publico_chk`);
    await H.sql(`insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Para seguidores','seguidores')`, [e]);
    await H.sql(`insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Só amigos','amigos')`, [e]);
    let fh = await fila(h);
    ok(fh.length === 1 && fh[0].tipo === 'seguindo' && fh[0].corpo === 'Para seguidores', 'perfil aberto: quem só segue recebe o post "para seguidores" (o "só amigos" não)', fh);
    await limpa();
    await H.sql(`insert into publicacoes(autor,tipo,texto,publico,estilo) values ($1,'post','','seguidores','{"coluna":{"v":1,"tit":"O que muda em 2027","linha":"Uma análise"}}'::jsonb)`, [e]);
    fh = await fila(h);
    ok(fh.length === 1 && fh[0].tipo === 'colunas' && fh[0].titulo === 'Eva publicou uma coluna' && fh[0].corpo === 'O que muda em 2027', 'NB09: coluna da v9 (estilo.coluna objeto) avisa como "Colunas", com o título', fh);
    await H.sql(`update push_inscricoes set prefs = prefs || '{"colunas":false}'::jsonb where uid=$1`, [h]); await limpa();
    await H.sql(`insert into publicacoes(autor,tipo,texto,publico,estilo) values ($1,'post','','seguidores','{"coluna":{"v":1,"tit":"Outra","linha":""}}'::jsonb)`, [e]);
    ok((await fila(h)).length === 0, 'colunas desligado no celular: coluna não entra na fila');
    await H.sql(`update membros set suspenso_em=now() where uid=$1`, [e]); await limpa();
    await H.sql(`insert into publicacoes(autor,tipo,texto,publico) values ($1,'post','Suspensa','seguidores')`, [e]);
    ok((await fila(h)).length === 0 && (await fila(f2)).length === 0, 'autor suspenso: ninguém é avisado do post');
    await H.sql(`update membros set suspenso_em=null where uid=$1`, [e]);
    ok(!!(await erro(g, `select public.push_ve_pub($1,$2)`, [g, pe])) && !!(await erro(g, `select public.push_amigos($1,$2)`, [g, e])), 'funções internas novas: ninguém do app chama');
    // excluir a conta continua funcionando mesmo com a fila quebrada
    await H.sql(`alter table push_fila rename to push_fila_y`);
    let exc = true; try { await como(h, `select public.excluir_conta()`) } catch (err) { exc = false }
    await H.sql(`alter table push_fila_y rename to push_fila`);
    ok(exc, 'NB12: excluir a conta não falha por causa dos avisos');
  }

  const R = U.resumo(); console.log(`\nRESUMO t_sqlv10: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2) });
