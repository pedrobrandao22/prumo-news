// Atividade (130, decisão do Pedro 04/11): quando a MESMA pessoa repostou e também citou (repost com comentário) o MESMO post,
// a Atividade mostra um item só: "Bia repostou e comentou seu post De perto “…”: “comentário”" (seu post, sua coluna…).
// Só repost = "repostou"; só citação = como antes; duas pessoas diferentes não juntam; a contagem conta 1; tocar abre a citação.
// Confere com o banco com a v11 (reposts de quem só segue vêm de reposts_dos_meus_posts) e SEM a v11.
// Portas 8792–8793. Capturas em qa/atividade-junta/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8792, PORTA2 = 8793, BASE = `http://localhost:${PORTA}/index.html`, BASE2 = `http://localhost:${PORTA2}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'atividade-junta'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
const shot = async (p, n) => { await ev(p, () => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.screenshot({ path: path.join(QA, n + '.png') }) };
let srv = null, srv2 = null;
(async () => {
  const raiz = path.join(__dirname, '..');
  ok(/aj130Junta/.test(fs.readFileSync(path.join(raiz, 'app', 'src', 'js', '130-atividade-junta.js'), 'utf8')) && /js\/130-atividade-junta\.js/.test(fs.readFileSync(path.join(raiz, 'app', 'src', 'pagina.html'), 'utf8')), '130 incluído na página');
  U.feedFresco('site'); srv = U.servir('site', PORTA); srv2 = U.servir('site', PORTA2); await sleep(800);
  const br = await U.navegador();
  const abrir = async (H, ii, k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ii[k], email: k + '@x' } } }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(o.base || BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null, null, 15000); await sleep(500); await fecha(p); return p };
  const ins = (P, r) => ev(P, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], pid: null, ...r }).select('id'); if (q.error) throw new Error(q.error.message); await pubCarregar(); return q.data[0].id }, r);
  const ativ = P => ev(P, () => atItens().filter(x => x.acao === 'vnrp').map(x => ({ t: x.txt.replace(/<[^>]+>/g, ''), k: x.k, vnrp: x.vnrp, pub: x.pub })));
  const recarrega = P => ev(P, async () => { CS123.t = 0; try { await cs123Carregar() } catch (e) { } PUB.sig = ''; await pubCarregar(); AT.t = 0; if (typeof DZ129 !== 'undefined') DZ129.rt = 0; await atCarregar() });

  /* ======================= 1. o app com a v11 ======================= */
  const H = await require('../harness').criar();
  const i = {}; for (const k of ['a', 'b', 'c', 'd']) i[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro')`, [i.a, i.b, i.c, i.d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita')`, [i.a, i.b, i.c]);
  await H.sql(`update membros set perfil_aberto = true where uid in ($1,$2)`, [i.b, i.d]);
  await H.sql(`insert into seguidores(seguidor,seguido) values ($1,$2),($2,$1)`, [i.d, i.b]); // Dani e Bia se seguem (não são amigas)
  const A = await abrir(H, i, 'a'), B = await abrir(H, i, 'b'), C = await abrir(H, i, 'c'), D = await abrir(H, i, 'd');
  ok(await ev(B, () => typeof aj130Junta === 'function' && typeof dz129AtRp === 'function' && V9.on === true), '130 e 129 carregados');

  const P = {};
  P.rel = await ins(B, { texto: 'Fila no posto\n\nA fila dobrava o quarteirão desde as 7h.', publico: 'seguidores', estilo: { v: 2, local: 'Tijuca, Rio de Janeiro', cn: { v: 1, k: 'rel', tit: 'Fila no posto' } } });
  P.col = await ins(B, { texto: 'O preço do tomate virou política', publico: 'seguidores', estilo: { v: 2, coluna: { tit: 'O preço do tomate virou política', linha: 'Feira, inflação e eleição', corpo: 'Parágrafo um.\n\nParágrafo dois.' } } });
  P.nor = await ins(B, { texto: 'Post comum da Bia', estilo: { v: 2 } });
  P.so = await ins(B, { texto: 'Outro post da Bia', estilo: { v: 2 } });
  P.dois = await ins(B, { texto: 'Mais um post da Bia', estilo: { v: 2 } });
  const rp = (id, tx, o = {}) => ({ texto: tx, estilo: { v: 2, rp: { k: 'pub', id } }, ...o });
  // Carla (amiga): repostou e citou o De perto
  P.cRel = await ins(C, rp(P.rel, ''));
  P.qRel = await ins(C, rp(P.rel, 'Aqui também estava assim.'));
  // Dani (só segue): repost para amigos (a Bia não lê; vem da v11) e citação para seguidores (a Bia lê) da coluna
  P.dCol = await ins(D, rp(P.col, '', { publico: 'amigos' }));
  P.qCol = await ins(D, rp(P.col, 'Na minha feira também.', { publico: 'seguidores' }));
  // só repost / só citação / duas pessoas
  P.cNor = await ins(C, rp(P.nor, ''));
  P.qSo = await ins(A, rp(P.so, 'Concordo com a Bia.'));
  P.aDois = await ins(A, rp(P.dois, ''));
  P.qDois = await ins(C, rp(P.dois, 'Eu discordo.'));
  ok(Object.values(P).every(Boolean), 'posts, reposts e citações gravados');
  await recarrega(B); await sleep(400);
  ok(await esperar(B, () => DZ129.v11 === true, null, 8000), 'v11 detectada');
  const at = await ativ(B), ts = at.map(x => x.t).sort();
  const esp = [
    'Carla Mendes repostou e comentou seu post De perto “Fila no posto”: “Aqui também estava assim.”',
    'Carla Mendes repostou sua publicação',
    'Carla Mendes repostou sua publicação: “Eu discordo.”',
    'Dani Rocha repostou e comentou sua coluna “O preço do tomate virou política”: “Na minha feira também.”',
    'Pedro Brandão repostou sua publicação',
    'Pedro Brandão repostou sua publicação: “Concordo com a Bia.”'].sort();
  ok(JSON.stringify(ts) === JSON.stringify(esp), 'Atividade da Bia: repost + citação da mesma pessoa = 1 item ("repostou e comentou seu post De perto “…”", "sua coluna “…”"); só repost, só citação e duas pessoas como antes', ts);
  ok(new Set(at.map(x => x.k)).size === at.length, 'sem itens repetidos');
  const jr = at.find(x => /Carla Mendes repostou e comentou/.test(x.t)), jc = at.find(x => /Dani Rocha repostou e comentou/.test(x.t));
  ok(jr.vnrp === P.qRel && jr.pub === P.rel && jc.vnrp === P.qCol && jc.pub === P.col, 'o item junto abre a citação (que a Bia vê)', [jr, jc]);
  const nt = await ev(B, () => { const c = nt124Contagem(); return { rp: c.por.reposts || 0, n: atNovas() } });
  ok(nt.rp === 6, 'contagem: 6 em Reposts (cada par repost + citação conta 1)', nt);
  // um item junto com post comum (sem tipo): "seu post"
  P.cSo = await ins(A, rp(P.so, '')); await recarrega(B); await sleep(300);
  const at2 = (await ativ(B)).map(x => x.t);
  ok(at2.includes('Pedro Brandão repostou e comentou seu post: “Concordo com a Bia.”') && at2.length === 6, 'post comum: "repostou e comentou seu post: “…”"', at2);
  ok((await ev(B, () => nt124Contagem().por.reposts || 0)) === 6, 'o repost novo do Pedro junta com a citação: a contagem continua 6');
  // abrir a citação por outro caminho (Feed/perfil) marca o item junto como visto
  await ev(B, id => vn112AbrePub(id), P.qDois); await sleep(500); await fecha(B);
  ok((await ev(B, () => nt124Contagem().por.reposts || 0)) === 5, 'abrir uma citação marca o item dela como visto (a contagem cai 1)');
  await ev(B, id => vn112AbrePub(id), P.qRel); await sleep(500); await fecha(B);
  ok((await ev(B, () => nt124Contagem().por.reposts || 0)) === 4, 'abrir a citação da Carla marca o item junto (repost + citação) como visto: cai só 1');
  // na tela
  await ev(B, () => abrirAtividade()); await sleep(800);
  const tela = await ev(B, () => [...document.querySelectorAll('#layer .pfv-at .at-tx')].map(e => e.textContent));
  ok(tela.filter(t => /Carla Mendes repostou/.test(t)).length === 3 && tela.filter(t => /Dani Rocha repostou/.test(t)).length === 1 && tela.some(t => /^Carla Mendes repostou e comentou seu post De perto “Fila no posto”/.test(t)), 'tela de Atividade: um aviso por par', tela);
  await shot(B, '01-atividade-bia');
  // tocar no item junto abre a citação
  await ev(B, () => { const l = [...document.querySelectorAll('#layer .pfv-at .at-it')]; l.find(b => /Carla Mendes repostou e comentou/.test(b.textContent)).click() });
  ok(await esperar(B, id => !!document.querySelector(`#layer .pfv [id="p-u:${id}"]`), P.qRel, 4000), 'tocar no item junto abre a citação da Carla');
  await shot(B, '02-abre-citacao'); await fecha(B);
  // bloqueio: o item junto da Dani sai inteiro
  await H.sql(`insert into bloqueios(de,para) values ($1,$2)`, [i.b, i.d]); await recarrega(B); await sleep(200);
  ok(await ev(B, () => !atItens().some(x => /Dani/.test(x.txt))), 'a Bia bloqueou a Dani: o item dela sai');
  const errs = [A, B, C, D].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console (banco com a v11)', JSON.stringify(errs.slice(0, 5)));

  /* ======================= 2. o app com o banco SEM a v11 ======================= */
  const H3 = await require('../harness').criar({ sql: path.join(raiz, 'sql', 'prumo-supabase.antes-v11.sql') });
  const j = {}; for (const k of ['a', 'b', 'c']) j[k] = await H3.criarConta(k + '@x', '123456');
  await H3.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro')`, [j.a, j.b, j.c]);
  await H3.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita')`, [j.a, j.b, j.c]);
  const A3 = await abrir(H3, j, 'a', { base: BASE2, n: '3' }), B3 = await abrir(H3, j, 'b', { base: BASE2, n: '3' }), C3 = await abrir(H3, j, 'c', { base: BASE2, n: '3' });
  const Q = {};
  Q.rel = await ins(B3, { texto: 'Fila no posto\n\nA fila dobrava o quarteirão.', estilo: { v: 2, cn: { v: 1, k: 'rel', tit: 'Fila no posto' } } });
  Q.nor = await ins(B3, { texto: 'Post comum', estilo: { v: 2 } });
  await ins(C3, rp(Q.rel, '')); Q.q = await ins(C3, rp(Q.rel, 'Vi a mesma fila.'));
  await ins(A3, rp(Q.nor, 'Só comentário.'));
  await recarrega(B3); await sleep(400);
  ok(await esperar(B3, () => DZ129.v11 === false, null, 8000), 'sem a v11: detectado');
  const t3 = (await ativ(B3)).map(x => x.t).sort();
  ok(JSON.stringify(t3) === JSON.stringify(['Carla Mendes repostou e comentou seu post De perto “Fila no posto”: “Vi a mesma fila.”', 'Pedro Brandão repostou sua publicação: “Só comentário.”']), 'sem a v11: o par da Carla vira um item; a citação do Pedro fica como antes', t3);
  ok((await ev(B3, () => nt124Contagem().por.reposts || 0)) === 2, 'sem a v11: a contagem conta 2');
  const errs3 = [A3, B3, C3].flatMap(p => p._erros);
  ok(!errs3.length, 'sem erros no console (banco sem a v11)', JSON.stringify(errs3.slice(0, 5)));
  await br.close();

  const R = U.resumo(); R.RES.filter(x => /^FAIL/.test(x)).forEach(x => console.log(x.slice(0, 900))); console.log(`\nRESUMO t_atividade_junta: ${R.OKS} ok, ${R.FALHAS} falhas`);
  srv.kill(); srv2.kill(); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); if (srv) srv.kill(); if (srv2) srv2.kill(); process.exit(1) });
