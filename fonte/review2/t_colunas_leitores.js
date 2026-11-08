// Colunas, fase 3 (134): leitura registrada (início e fim) uma vez por leitor, a da autora não conta, de onde veio;
// painel "Leitores" com os números certos e sem nomes de quem leu; privacidade no banco; seguir série/colunista (aviso só
// para quem pode ler, tipo novo "colunas_seguidas" com liga/desliga); fixar até 3 comentários e o selo "Autora";
// citar trecho (post com a citação ligada à coluna) e copiar trecho com assinatura; 360/390 px, modo escuro, sem erros;
// e o app com o banco SEM a v13. Portas 8798–8799. Capturas em qa/colunas-leitores/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8798, PORTA2 = 8799, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'colunas-leitores'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
const semLateral = P => ev(P, () => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#layer2 .sheet *, #layer .cs123-ler *, #layer .ed132-hubr *')].every(e => { const r = e.getBoundingClientRect(); return !r.width || r.right <= innerWidth + 1 || e.closest('.cs123-hts,.gn-svg') }));
const PARS = Array.from({ length: 14 }, (_, i) => `Parágrafo ${i + 1} da coluna: o orçamento chega ao Congresso com uma conta que não fecha, e quem anda pelos corredores percebe que a conversa mudou, com cada bancada tentando proteger o seu pedaço e o relator prometendo o parecer até o fim do mês.`);
const CORPO = PARS.map(p => `<p>${p}</p>`).join('');
const col = (tit, serie, n) => ({ v: 2, coluna: { v: 1, f: 'h', tit, linha: 'O que se ouve no Congresso', min: 3, ...(serie ? { serie, n } : {}) } });
let srv = null, srv2 = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c', 'd', 'e']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro'),($5,'Eva Lima','membro')`, [ids.a, ids.b, ids.c, ids.d, ids.e]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($2,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  await H.sql(`update public.membros set perfil_aberto = true where uid = $1`, [ids.b]);
  await H.sql(`insert into public.seguidores(seguidor, seguido) values ($1,$2)`, [ids.e, ids.b]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const erro = async (k, q, p) => { try { await como(k, q, p); return null } catch (e) { return (e.code || '') + ' ' + e.message } };
  const pub = async (tit, serie, n, publico = 'amigos') => (await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,'[]',$3,$4,$5) returning id`, [ids.b, tit + '\n\nO que se ouve no Congresso', col(tit, serie, n), publico, CORPO]))[0].id;
  const p1 = await pub('O orçamento no corredor', 'Bastidores', 1), p2 = await pub('A comissão mista decide', 'Bastidores', 2);
  /* comentários do Pedro e curtida (documentos do app), repost da Carla e envio da Carla */
  for (const [k, t] of [['ka1', 'Primeiro comentário do Pedro'], ['ka2', 'Segundo comentário do Pedro'], ['ka3', 'Terceiro comentário do Pedro']]) { await como('a', `insert into public.pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario',$3,$4)`, [p1, ids.a, k, { texto: t }]); await sleep(5) }
  await como('a', `insert into public.pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'curtida','','{}')`, [p1, ids.a]);
  await como('c', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico) values ($1,'post','','[]',$2,'amigos')`, [ids.c, { v: 2, rp: { k: 'pub', id: p1 } }]);
  await como('c', `insert into public.mensagens(de,para,texto,pid) values ($1,$2,'Olha esta coluna',$3)`, [ids.c, ids.b, 'u:' + p1]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await (o.H || H).pagina(br, { sessao: { user: { id: (o.ids || ids)[k], email: k + (o.H ? '@y' : '@x') } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && LT134.v13 !== null, null, 20000); await sleep(400); await fecha(p);
    await ev(p, () => { window.__cb = []; Object.defineProperty(navigator, 'clipboard', { value: { write: async () => { }, writeText: async t => { window.__cb.push(t) } }, configurable: true }) });
    return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const leit = (p, k) => H.sql(`select origem, chegou_fim, segundos from public.coluna_leituras where pub=$1 and leitor=$2`, [p, ids[k]]);
  const nLog = k => H.log.filter(l => l.uid === ids[k] && l.op === 'rpc:coluna_leitura:').length;
  const rola = P => ev(P, () => { const sc = $('#layer .cs123-sc'); sc.scrollTop = sc.scrollHeight; sc.dispatchEvent(new Event('scroll')) });
  const fechaCol = P => ev(P, () => { if ($('#layer2')?.innerHTML) closeLayer(); closeLayer() });

  const A = await abrir('a'), B = await abrir('b'), C = await abrir('c');
  ok(await ev(A, () => LT134.v13 === true), 'v13 detectada');

  /* ================= 1. leitura registrada ================= */
  await ev(A, () => { go('feed'); FILTRO = 'tudo'; renderPosts(); for (let i = 0; i < 10; i++) try { carregarMais(true) } catch (e) { } });
  ok(await esperar(A, id => !!document.querySelector(`#v-feed [data-cs123ler="${id}"]`), p1, 8000), 'a coluna está no Feed do Pedro');
  const log0 = nLog('a');
  await ev(A, id => document.querySelector(`#v-feed button[data-cs123ler="${id}"]`).click(), p1);
  ok(await esperar(A, () => !!$('#layer .cs123-ler'), null, 4000), 'Pedro abre a coluna pelo Feed');
  await sleep(700); let l = await leit(p1, 'a');
  ok(l.length === 1 && l[0].origem === 'feed' && l[0].chegou_fim === false, 'início: leitura registrada ao abrir, com a origem "feed" e sem o fim', l);
  await sleep(2200); await rola(A); await sleep(600); l = await leit(p1, 'a');
  ok(l.length === 1 && l[0].chegou_fim === true, 'fim: rolou até o fim do texto e a leitura passa a "chegou ao fim"', l);
  await sleep(1200); await fechaCol(A); await sleep(1500); l = await leit(p1, 'a');
  ok(l.length === 1 && l[0].segundos >= 2 && l[0].segundos < 30, 'ao sair: grava os segundos de leitura', l);
  ok(nLog('a') - log0 <= 3, 'gravação leve: no máximo 3 gravações (abrir, fim, sair)', nLog('a') - log0);
  /* de novo, pelo perfil: continua uma linha só e mantém o maior */
  await ev(A, id => cs123Abrir(id), p1); await sleep(1200); await fechaCol(A); await sleep(1300); l = await leit(p1, 'a');
  ok(l.length === 1 && l[0].chegou_fim === true && l[0].segundos >= 2, 'ler de novo: continua 1 linha por leitor e guarda o máximo', l);
  /* a autora não conta */
  await recarrega(B); await ev(B, id => cs123Abrir(id), p1); await sleep(1500); await rola(B); await sleep(500); await fechaCol(B); await sleep(1200);
  ok((await leit(p1, 'b')).length === 0 && H.log.filter(x => x.uid === ids.b && x.op === 'rpc:coluna_leitura:').length === 0, 'a leitura da própria autora não conta (nem é enviada)');
  ok((await como('b', `select public.coluna_leitura($1,'feed',true,10) r`, [p1]))[0].r === 'autora' && (await leit(p1, 'b')).length === 0, 'banco: a autora chamando a função também não conta');
  /* origens: perfil e série (Carla) e notificação (Pedro) */
  await ev(C, u => abrirPerfil(u), ids.b);
  ok(await esperar(C, id => !!document.querySelector(`#layer .pfv [data-cs123ler="${id}"]`), p1, 6000), 'perfil da Bia mostra a coluna para a Carla');
  await ev(C, id => document.querySelector(`#layer .pfv [data-cs123ler="${id}"]`).click(), p1); await sleep(800);
  ok((await leit(p1, 'c'))[0]?.origem === 'perfil', 'origem "perfil"', await leit(p1, 'c'));
  ok(await ev(C, () => !!document.querySelector('#layer .ed132-nav [data-cs123ler]')), 'série: "Próxima" na coluna');
  await ev(C, () => document.querySelector('#layer .ed132-nav [data-cs123ler]').click()); await sleep(900);
  ok((await leit(p2, 'c'))[0]?.origem === 'serie' && (await leit(p1, 'c'))[0].chegou_fim === false, 'origem "serie" (anterior/próxima) e a outra coluna sem o fim', [await leit(p2, 'c'), await leit(p1, 'c')]);
  await fechaCol(C);
  await ev(A, id => nt124Rota('coluna:' + id), p2); await esperar(A, () => !!$('#layer .cs123-ler'), null, 5000); await sleep(800);
  ok((await leit(p2, 'a'))[0]?.origem === 'notificacao' && await ev(A, id => CS123.ler && CS123.ler.id === id, p2), 'aviso "?nt=coluna:" abre a coluna com origem "notificacao"', await leit(p2, 'a'));
  await fechaCol(A);
  const pX = await pub('Coluna para seguidores', '', 0, 'seguidores');
  ok((await como('c', `select public.coluna_leitura($1,'bobagem',false,5000) r`, [pX]))[0].r === 'ok' && (await leit(pX, 'c'))[0].origem === 'outro' && (await leit(pX, 'c'))[0].segundos === 3600, 'banco: origem desconhecida vira "outro" e o tempo tem teto de 1 hora');
  ok(/42501/.test(await erro('d', `select public.coluna_leitura($1,'feed',false,1)`, [p1]) || ''), 'banco: quem não pode ler a coluna não registra leitura');

  /* ================= 2. privacidade no banco ================= */
  const rc = await como('c', `select leitor from public.coluna_leituras`);
  ok(rc.length >= 1 && rc.every(r => r.leitor === ids.c), 'leitor vê só as próprias leituras (nunca as de outros)', rc);
  ok(/42501/.test(await erro('c', `select public.coluna_numeros($1)`, [p1]) || '') && /42501/.test(await erro('a', `select public.coluna_numeros($1)`, [p1]) || ''), 'terceiro (nem amigo leitor) não lê os números da coluna');
  ok(!!(await erro('a', `insert into public.coluna_leituras(pub,leitor,origem) values ($1,$2,'feed')`, [p1, ids.a])) && !!(await erro('a', `update public.coluna_leituras set segundos=999`)), 'ninguém grava direto na tabela (só pela função)');
  ok((await como('b', `select * from public.coluna_leituras`)).length === 0, 'a autora também não lê as linhas de quem leu');

  /* ================= 3. comentários: resposta da autora e destaques ================= */
  await recarrega(B); await ev(B, id => cs123Abrir(id), p1); await sleep(600);
  await ev(B, id => openComments('u:' + id), p1); await sleep(400);
  await B.fill('#ctext', '@Pedro Brandão obrigada pela leitura'); await ev(B, () => document.querySelector('#cform .sendc').click()); await sleep(900);
  ok(await ev(B, () => [...document.querySelectorAll('#cbox .clist > li')].some(li => /obrigada pela leitura/.test(li.textContent) && /Autora/.test(li.querySelector('.lt134-au')?.textContent || ''))), 'resposta da autora aparece marcada "Autora"');
  const fixa = async (P, txt) => { await ev(P, () => document.querySelectorAll('.toast').forEach(t => t.remove())); await ev(P, t => { const li = [...document.querySelectorAll('#cbox .clist > li')].find(li => li.textContent.indexOf(t) >= 0); li.querySelector('[data-lt134fix]').click() }, txt); await sleep(700) };
  ok(await ev(B, () => document.querySelectorAll('#cbox [data-lt134fix]').length === 4), 'autora: "Fixar" em cada comentário');
  for (const t of ['Primeiro comentário', 'Segundo comentário', 'Terceiro comentário']) await fixa(B, t);
  let nd = (await H.sql(`select cid, txt, nome from public.coluna_destaques where pub=$1 order by at`, [p1]));
  ok(nd.length === 3 && nd[0].txt === 'Primeiro comentário do Pedro' && nd[0].nome === 'Pedro Brandão', 'fixar 3 comentários (o banco guarda o texto e o nome)', nd);
  await fixa(B, 'obrigada pela leitura');
  ok((await H.sql(`select count(*)::int n from public.coluna_destaques where pub=$1`, [p1]))[0].n === 3 && /já fixou 3 comentários/.test(await toastTx(B)), 'o 4º é recusado ("Você já fixou 3 comentários…")', await toastTx(B));
  const cidB = (await H.sql(`select chave from public.pub_reacoes where pub=$1 and uid=$2 and tipo='comentario'`, [p1, ids.b]))[0].chave;
  ok(/no maximo 3 destaques/.test(await erro('b', `insert into public.coluna_destaques(pub,cautor,cid) values ($1,$2,$3)`, [p1, ids.b, cidB]) || ''), 'banco: o 4º destaque é recusado');
  ok(!!(await erro('c', `insert into public.coluna_destaques(pub,cautor,cid) values ($1,$2,'ka1')`, [p1, ids.a])), 'banco: só a autora fixa');
  ok(await ev(B, () => { const lis = [...document.querySelectorAll('#cbox .clist > li')]; return lis.slice(0, 3).every(li => li.classList.contains('lt134-fx') && /Fixado pela autora/.test(li.textContent)) && /Desafixar/.test(lis[0].textContent) }), 'comentários fixados vão para o topo com "Fixado pela autora"');
  await shot(B, '01-comentarios-fixados'); ok(await semLateral(B), '390 px: comentários com "Fixar" sem rolagem lateral');
  /* trocar um destaque pela resposta da autora */
  await fixa(B, 'Terceiro comentário'); await fixa(B, 'obrigada pela leitura');
  nd = await H.sql(`select cautor from public.coluna_destaques where pub=$1 order by at`, [p1]);
  ok(nd.length === 3 && nd[2].cautor === ids.b, 'desafixar um e fixar a resposta da autora', nd);
  await fechaCol(B); await sleep(200);
  await recarrega(C); await ev(C, id => cs123Abrir(id), p1); await sleep(900);
  const dc = await ev(C, () => ({ k: $('#layer .lt134-dest .lt134-dk')?.textContent, n: document.querySelectorAll('#layer .lt134-dest li').length, au: [...document.querySelectorAll('#layer .lt134-dest li')].filter(li => li.querySelector('.lt134-au')).length, des: document.querySelectorAll('#layer .lt134-dest [data-lt134fix]').length, resp: document.querySelectorAll('#layer .lt134-dest [data-lt134resp]').length }));
  ok(dc.k === 'Destaque da autora' && dc.n === 3 && dc.au === 1 && dc.des === 0 && dc.resp === 3, 'leitora vê "Destaque da autora" com 3 comentários (o da autora com "Autora"), com "Responder" e sem "Desafixar"', dc);
  await ev(C, () => document.querySelector('#layer .lt134-dest [data-lt134resp]').click()); await sleep(400);
  ok(await ev(C, () => /^@Pedro Brandão /.test($('#ctext')?.value || '')), '"Responder" abre os comentários com o @nome');
  await ev(C, () => closeLayer()); await sleep(200);

  /* ================= 4. seguir série / colunista ================= */
  ok(await ev(C, () => /Seguir esta série/.test($('#layer .lt134-ass')?.textContent || '') && /Avisar sobre novas colunas de Bia/.test($('#layer .lt134-ass').textContent)), 'leitora vê "Seguir esta série" e "Avisar sobre novas colunas de Bia"');
  await shot(C, '02-coluna-leitora'); ok(await semLateral(C), '390 px: coluna com seguir série e destaques sem rolagem lateral');
  await ev(C, () => document.querySelector('#layer [data-lt134asss="Bastidores"]').click()); await sleep(700);
  ok((await H.sql(`select leitor, autor, serie from public.coluna_assinaturas`)).some(r => r.leitor === ids.c && r.autor === ids.b && r.serie === 'Bastidores') && await ev(C, () => /Seguindo a série/.test($('#layer .lt134-ass').textContent)), 'Carla segue a série (sem seguir a Bia)');
  ok(!(await H.sql(`select 1 from public.seguidores where seguidor=$1`, [ids.c])).length, 'seguir a série não cria "seguir a pessoa"');
  await como('d', `insert into public.coluna_assinaturas(autor,serie) values ($1,'Bastidores')`, [ids.b]);
  await como('e', `insert into public.coluna_assinaturas(autor) values ($1)`, [ids.b]);
  ok((await como('d', `select * from public.coluna_assinaturas`)).length === 1 && (await como('c', `select * from public.coluna_assinaturas`)).length === 1, 'cada um vê só as próprias assinaturas');
  const P = '"BA' + 'x'.repeat(85) + '"', AU = 'y'.repeat(22);
  for (const k of ['c', 'd', 'e']) await como(k, `select public.push_inscrever($1,$2,$3,$4::jsonb,$5)`, ['https://fcm.googleapis.com/fcm/send/' + k, 'B' + 'p'.repeat(86), AU, JSON.stringify({ colunas_seguidas: true }), 'teste']);
  ok((await H.sql(`select prefs from push_inscricoes where uid=$1`, [ids.c]))[0].prefs.colunas_seguidas === true, 'tipo novo "colunas_seguidas" aceito nas escolhas do aparelho');
  await H.sql(`delete from push_fila`);
  const p3 = await pub('Coluna nova da série', 'Bastidores', 3, 'amigos');
  let fila = await H.sql(`select para, tipo, titulo, corpo, url from push_fila where tipo='colunas_seguidas' order by id`);
  ok(fila.length === 1 && fila[0].para === ids.c && fila[0].titulo === 'Bia Souza publicou na série “Bastidores”' && fila[0].corpo === 'Coluna nova da série' && fila[0].url === '?nt=coluna:' + p3, 'coluna nova da série: aviso só para quem assinou E pode ler (Carla; Dani e Eva não)', fila);
  await H.sql(`delete from push_fila`);
  const p4 = await pub('Fora da série, para seguidores', '', 0, 'seguidores');
  fila = await H.sql(`select para, tipo, titulo from push_fila where tipo='colunas_seguidas'`);
  ok(fila.length === 1 && fila[0].para === ids.e && fila[0].titulo === 'Bia Souza publicou uma coluna', 'coluna para seguidores: avisa a Eva (assinou a colunista e segue); Carla só assinou a série', fila);
  await recarrega(C); await ev(C, () => { if (typeof atCarregar === 'function') atCarregar() });
  ok(await esperar(C, id => { try { return atItens().some(x => x.k === 'lt134c:' + id && /publicou na série “Bastidores”/.test(x.txt)) } catch (e) { return false } }, p3, 6000), 'Atividade da Carla: "Bia Souza publicou na série “Bastidores”"');
  ok(await ev(C, id => !atItens().some(x => x.k === 'lt134c:' + id), p4), 'Atividade: coluna fora da série não entra');
  ok(await ev(C, () => nt124Contagem().por.colunas_seguidas >= 1), 'conta como novidade "colunas_seguidas" (ligado no app por padrão)');
  await ev(C, () => nt124Abrir()); await sleep(400);
  ok(await ev(C, () => !!document.querySelector('[data-nt124tipo="colunas_seguidas"]') && /Séries e colunistas que você assina/.test(document.querySelector('[data-nt124tipo="colunas_seguidas"]').textContent) && nt124PushPrefs().colunas_seguidas === false), 'Notificações: tipo novo na lista (no celular desligado por padrão)');
  await ev(C, () => document.querySelector('[data-nt124app="colunas_seguidas"]').click()); await sleep(200);
  ok(await ev(C, () => PREF.notif.app.colunas_seguidas === false && !nt124Contagem().por.colunas_seguidas), 'desligar no app: deixa de contar');
  await ev(C, () => document.querySelector('[data-nt124app="colunas_seguidas"]').click()); await sleep(200);
  ok(await ev(C, () => PREF.notif.app.colunas_seguidas === true), 'ligar de novo no app');
  await shot(C, '03-notificacoes'); await fecha(C);
  await H.sql(`update push_inscricoes set prefs = prefs || '{"colunas_seguidas":false}'::jsonb where uid=$1`, [ids.c]); await H.sql(`delete from push_fila`);
  await pub('Mais uma da série', 'Bastidores', 4, 'amigos');
  ok(!(await H.sql(`select 1 from push_fila where para=$1`, [ids.c])).length, 'desligado no celular: não entra na fila');
  /* deixar de seguir */
  await recarrega(C); await ev(C, id => cs123Abrir(id), p1); await sleep(500);
  await ev(C, () => document.querySelector('#layer [data-lt134asss="Bastidores"]').click()); await sleep(600);
  ok(!(await H.sql(`select 1 from public.coluna_assinaturas where leitor=$1`, [ids.c])).length, 'deixar de seguir a série'); await fechaCol(C);

  /* ================= 5. citar e copiar trecho ================= */
  await recarrega(A); await ev(A, id => cs123Abrir(id), p1); await sleep(600);
  ok(await ev(A, () => { const c = getComputedStyle($('#layer .cs123-corpo')); return (c.userSelect || c.webkitUserSelect) === 'text' }), 'texto da coluna selecionável (toque longo no celular)');
  const seleciona = (P, n) => ev(P, n => { const ps = [...document.querySelectorAll('#layer .cs123-corpo p')]; const r = document.createRange(); r.setStart(ps[0].firstChild, 0);
    if (n <= ps[0].textContent.length) r.setEnd(ps[0].firstChild, n); else r.setEnd(ps[2].firstChild, 40); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return s.toString().replace(/\s+/g, ' ').trim() }, n);
  const tr = await seleciona(A, 60);
  ok(await esperar(A, () => !!document.querySelector('#layer .lt134-bar [data-lt134cit]') && !!document.querySelector('#layer .lt134-bar [data-lt134cop]'), null, 3000), 'selecionar mostra "Citar trecho" e "Copiar trecho"');
  await shot(A, '04-trecho-selecionado'); ok(await semLateral(A), '390 px: barra do trecho sem rolagem lateral');
  await ev(A, () => document.querySelector('#layer .lt134-bar [data-lt134cop]').click()); await sleep(300);
  let cb = await ev(A, () => window.__cb.slice());
  ok(cb.length === 1 && cb[0] === `“${tr}”\n\n— Bia Souza, no Prumo`, 'Copiar trecho: o trecho entre aspas e "— Bia Souza, no Prumo"', cb);
  const longo = await seleciona(A, 9999); await sleep(400);
  ok(longo.length > 280 && await ev(A, () => LT134.sel && LT134.sel.t.length <= 280 && /primeiros 280/.test($('#layer .lt134-bar small').textContent)), 'trecho longo: vão até 280 caracteres');
  await seleciona(A, 60); await sleep(300);
  await ev(A, () => document.querySelector('#layer .lt134-bar [data-lt134cit]').click()); await sleep(400);
  ok(await ev(A, () => /Citar trecho/.test($('#layer2 .sheet').textContent) && /Coluna de Bia Souza/.test($('#layer2 .lt134-cit cite').textContent) && !!$('#layer2 .vn-q')), 'Citar trecho: abre o criador com a citação em bloco ("Coluna de Bia Souza") e a coluna citada');
  await shot(A, '05-citar-trecho'); ok(await semLateral(A), '390 px: criador da citação sem rolagem lateral');
  await A.fill('#lt134-ct', 'Concordo com este ponto'); await ev(A, () => document.querySelector('[data-lt134pub]').click()); await sleep(1200);
  const [pc] = await H.sql(`select id, texto, estilo from public.publicacoes where autor=$1 order by at desc limit 1`, [ids.a]);
  ok(pc && pc.texto === 'Concordo com este ponto' && pc.estilo.rp.k === 'pub' && pc.estilo.rp.id === p1 && pc.estilo.trecho.t === tr && pc.estilo.trecho.au === ids.b, 'post criado com a citação ligada à coluna', pc && pc.estilo);
  const ph = await ev(A, id => { const x = pubDe(id); return x ? pubPostHTML(x) : '' }, pc.id);
  ok(/class="lt134-cit"/.test(ph) && ph.indexOf(tr.slice(0, 30)) > 0 && /Coluna de Bia Souza/.test(ph) && new RegExp(`data-cs123ler="${p1}"`).test(ph), 'no post: a citação em bloco com "Coluna de Bia Souza", que abre a coluna');
  await ev(A, () => { go('feed'); FILTRO = 'tudo'; renderPosts() });
  ok(await esperar(A, () => [...document.querySelectorAll('#v-feed .lt134-cit cite')].some(c => /Coluna de Bia Souza/.test(c.textContent)), null, 5000), 'no Feed: o post com o trecho em bloco');
  await fechaCol(A);

  /* ================= 6. painel "Leitores" (só a autora) ================= */
  await recarrega(A); await ev(A, id => cs123Abrir(id), p1); await sleep(400);
  ok(await ev(A, () => !document.querySelector('#layer .lt134-lb')), 'leitor não vê "Leitores"'); await fechaCol(A);
  await recarrega(B); await ev(B, id => cs123Abrir(id), p1); await sleep(500);
  ok(await ev(B, () => /Leitores/.test(document.querySelector('#layer .cs123-top .lt134-lb')?.textContent || '') && !!document.querySelector('#layer .cs123-top [data-ex133exp]')), 'autora: "Leitores" (e "Exportar") na página da coluna');
  ok(await ev(B, () => !document.querySelector('#layer .lt134-ass')), 'autora não vê "Seguir esta série" na própria coluna');
  await ev(B, () => document.querySelector('#layer .lt134-lb').click());
  ok(await esperar(B, () => !!document.querySelector('#lt134-np .lt134-k'), null, 5000), 'painel de números abre');
  const pn = await ev(B, () => { const v = k => $(`#lt134-np [data-lt134v="${k}"]`)?.textContent; return { l: v('leituras'), f: v('fim'), t: v('tempo'), cur: v('curtidas'), com: v('comentarios'), rp: v('reposts'), env: v('envios'), tx: $('#lt134-np').textContent.replace(/\s+/g, ' '), ori: [...document.querySelectorAll('#lt134-np .lt134-gn li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()), g: document.querySelectorAll('#lt134-np .lt134-g .gn-c').length, ml: document.querySelectorAll('#lt134-np .lt134-ml li').length } });
  const sq = (await H.sql(`select count(*)::int n, count(*) filter (where chegou_fim)::int f, round(avg(segundos) filter (where segundos>0))::int s from public.coluna_leituras where pub=$1`, [p1]))[0];
  ok(pn.l === '2' && sq.n === 2 && pn.f === '1' && sq.f === 1 && /50% de quem abriu/.test(pn.tx), 'leituras: 2 pessoas, 1 chegou ao fim (50%)', [pn, sq]);
  ok(pn.t === (sq.s < 60 ? sq.s + ' s' : pn.t) && /tempo médio/.test(pn.tx), 'tempo médio certo', [pn.t, sq.s]);
  ok(pn.ori.join('|') === 'Feed1|Perfil1', 'de onde vieram: Feed 1, Perfil 1', pn.ori);
  ok(pn.cur === '1' && pn.com === '4' && pn.rp === '2' && /1 com comentário/.test(pn.tx) && pn.env === '1', 'reações: 1 curtida, 4 comentários, 2 reposts (1 com comentário), 1 envio', pn);
  ok(pn.g === 14 && /primeiros 14 dias/.test(pn.tx), 'gráfico por dia dos primeiros 14 dias', pn.g);
  ok(!/Carla/.test(pn.tx) && /Curtiram: Pedro Brandão/.test(pn.tx) && /Comentaram: Pedro Brandão/.test(pn.tx) && /nunca quem leu/.test(pn.tx), 'sem nomes de leitores (Carla leu e não aparece); só amigos que curtiram/comentaram', pn.tx.slice(0, 600));
  ok(/Suas colunas mais lidas/.test(pn.tx) && pn.ml >= 2, '"Suas colunas mais lidas" no painel', pn.ml);
  const num = (await como('b', `select public.coluna_numeros($1) r`, [p1]))[0].r;
  ok(num.leituras === 2 && num.dias.length === 14 && num.dias[0] === 2 && num.origens.feed === 1 && !JSON.stringify(num).includes(ids.a) && !JSON.stringify(num).includes(ids.c), 'banco: a função devolve só totais (nenhum id de leitor)', num);
  await shot(B, '06-painel-leitores'); ok(await semLateral(B), '390 px: painel sem rolagem lateral');
  await ev(B, () => $('#layer2 .sh-b').scrollTop = 9999); await shot(B, '07-painel-fim');
  await fecha(B);
  await ev(B, () => ed132Hub()); ok(await esperar(B, () => /Suas colunas mais lidas/.test($('#layer .ed132-hubr')?.textContent || '') && !!document.querySelector('#layer .ed132-hubr [data-lt134num]'), null, 5000), 'Minhas colunas: "Suas colunas mais lidas" com "Leitores"');
  ok(await ev(B, id => /2 leituras/.test(document.querySelector(`#layer .ed132-hubr [data-lt134num="${id}"]`).closest('li').textContent), p1), 'Minhas colunas: a mais lida com "2 leituras"');
  await shot(B, '08-minhas-colunas'); ok(await semLateral(B), '390 px: Minhas colunas sem rolagem lateral');
  await ev(B, id => document.querySelector(`#layer .ed132-hubr [data-lt134num="${id}"]`).click(), p2); await esperar(B, () => !!document.querySelector('#lt134-np .lt134-k'), null, 5000);
  ok(await ev(B, () => [...document.querySelectorAll('#lt134-np .lt134-gn li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join('|')) === 'Série1|Notificação1', 'Minhas colunas › Leitores da outra coluna: Série 1, Notificação 1');
  await fecha(B);

  /* ================= 7. 360 px e modo escuro ================= */
  const B3 = await abrir('b', { vp: { width: 360, height: 740 }, n: '360' });
  await recarrega(B3); await ev(B3, id => cs123Abrir(id), p1); await sleep(600);
  ok(await semLateral(B3), '360 px: barra da coluna com "Exportar" e "Leitores" sem rolagem lateral'); await shot(B3, '09-coluna-autora-360');
  await ev(B3, () => document.querySelector('#layer .lt134-lb').click()); await esperar(B3, () => !!document.querySelector('#lt134-np .lt134-k'), null, 5000);
  ok(await semLateral(B3), '360 px: painel de números sem rolagem lateral'); await shot(B3, '10-painel-360'); await fecha(B3);
  const C3 = await abrir('c', { vp: { width: 360, height: 740 }, n: '360' });
  await recarrega(C3); await ev(C3, id => cs123Abrir(id), p1); await sleep(700); await seleciona(C3, 50); await esperar(C3, () => !!document.querySelector('#layer .lt134-bar'), null, 3000);
  ok(await semLateral(C3), '360 px: coluna da leitora (destaques, seguir série, barra do trecho) sem rolagem lateral'); await shot(C3, '11-leitora-360'); await fecha(C3);
  const BD = await abrir('b', { dark: true, n: 'd', base: BASE2 });
  await recarrega(BD); await ev(BD, id => cs123Abrir(id), p1); await sleep(500); await ev(BD, () => document.querySelector('#layer .lt134-lb').click()); await esperar(BD, () => !!document.querySelector('#lt134-np .lt134-k'), null, 5000);
  const cor = await ev(BD, () => { const n = cor => { const k = document.createElement('canvas').getContext('2d'); k.fillStyle = '#808080'; k.fillStyle = cor; k.fillRect(0, 0, 1, 1); const d = k.getImageData(0, 0, 1, 1).data; return d[0] + d[1] + d[2] }; return { fundo: n(getComputedStyle($('#layer2 .sheet')).backgroundColor), tile: n(getComputedStyle($('.lt134-k > div')).backgroundColor), texto: n(getComputedStyle($('.lt134-k b')).color) } });
  ok(cor.fundo < 200 && cor.tile < 200 && cor.texto > 450, 'modo escuro: painel escuro com números claros', cor); await shot(BD, '12-painel-escuro'); await fecha(BD);
  const CD = await abrir('c', { dark: true, n: 'd', base: BASE2 });
  await recarrega(CD); await ev(CD, id => cs123Abrir(id), p1); await sleep(700);
  const cd = await ev(CD, () => { const n = cor => { const k = document.createElement('canvas').getContext('2d'); k.fillStyle = '#808080'; k.fillStyle = cor; k.fillRect(0, 0, 1, 1); const d = k.getImageData(0, 0, 1, 1).data; return d[0] + d[1] + d[2] }; return { dest: n(getComputedStyle($('#layer .lt134-dest')).backgroundColor), tx: n(getComputedStyle($('#layer .lt134-dest p')).color) } });
  ok(cd.dest < 300 && cd.tx > 450, 'modo escuro: destaques legíveis', cd); await ev(CD, () => $('#layer .lt134-dest').scrollIntoView()); await shot(CD, '13-destaques-escuro'); await fecha(CD);

  /* ================= 8. app SEM a v13 ================= */
  const H2 = await require('../harness').criar({ sql: __dirname + '/../sql/prumo-supabase.antes-v13.sql' });
  const i2 = {}; for (const k of ['a', 'b']) i2[k] = await H2.criarConta(k + '@y', '123456');
  await H2.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [i2.a, i2.b]);
  await H2.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [i2.a, i2.b]);
  const [s1] = await H2.comoUsuario(i2.b, () => H2.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post','Sem v13','[]',$2,'amigos',$3) returning id`, [i2.b, col('Sem a v13', 'Bastidores', 1), CORPO])).then(r => r.rows);
  await H2.comoUsuario(i2.a, () => H2.db.query(`insert into public.pub_reacoes(pub,uid,tipo,chave,valor) values ($1,$2,'comentario','z1',$3)`, [s1.id, i2.a, { texto: 'Comentário sem v13' }]));
  const SB2 = await abrir('b', { H: H2, ids: i2, base: BASE2, n: 'sem' }), SA2 = await abrir('a', { H: H2, ids: i2, base: BASE2, n: 'sem' });
  ok(await ev(SB2, () => LT134.v13 === false), 'sem a v13: o app detecta');
  await recarrega(SB2); await ev(SB2, id => cs123Abrir(id), s1.id); await sleep(500);
  ok(await ev(SB2, () => !document.querySelector('#layer .lt134-lb') && !!document.querySelector('#layer [data-ex133exp]')), 'sem a v13: sem "Leitores" (o resto da página igual)');
  await ev(SB2, id => openComments('u:' + id), s1.id); await sleep(400);
  ok(await ev(SB2, () => document.querySelectorAll('#cbox .clist > li').length === 1 && !document.querySelector('#cbox [data-lt134fix]')), 'sem a v13: sem "Fixar"');
  await fecha(SB2); await ev(SB2, () => nt124Abrir()); await sleep(300);
  ok(await ev(SB2, () => !document.querySelector('[data-nt124tipo="colunas_seguidas"]')), 'sem a v13: Notificações sem o tipo novo'); await fecha(SB2);
  await recarrega(SA2); await ev(SA2, id => cs123Abrir(id), s1.id); await sleep(1500);
  ok(await ev(SA2, () => !document.querySelector('#layer .lt134-ass') && !!$('#layer .cs123-corpo')), 'sem a v13: leitor lê a coluna, sem "Seguir esta série"');
  ok(!H2.log.some(x => /coluna_leitura|coluna_assinaturas:insert|coluna_destaques/.test(x.op) && !/select/.test(x.op)), 'sem a v13: nada é gravado nas tabelas novas');
  await seleciona(SA2, 50); ok(await esperar(SA2, () => !!document.querySelector('#layer .lt134-bar'), null, 3000), 'sem a v13: "Citar trecho" e "Copiar trecho" continuam');
  await ev(SA2, () => document.querySelector('#layer .lt134-bar [data-lt134cop]').click()); await sleep(300);
  ok(await ev(SA2, () => window.__cb.length === 1 && /— Bia Souza, no Prumo$/.test(window.__cb[0])), 'sem a v13: copiar trecho com assinatura');

  for (const Pg of [A, B, C, B3, C3, BD, CD, SB2, SA2]) ok(!(Pg._erros || []).length, 'sem erros no console', Pg._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_colunas_leitores: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { srv && srv.kill(); srv2 && srv2.kill() } catch (_) { } process.exit(1) });
