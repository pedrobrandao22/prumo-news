// Etapa 73: Admin › Uso mostra espaço/custo e limpa; cada pessoa apaga os próprios stories velhos (fora de destaques)
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const ev = (p, fn, a) => p.evaluate(fn, a); const SH = __dirname + '/../review3/var/';
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', 8782); await sleep(800);
  const H = await require('../harness').criar();
  const a = await H.criarConta('a@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro','admin')`, [a]);
  const br = await U.navegador();
  const p = U.erros(await H.pagina(br, { sessao: { user: { id: a, email: 'a@x' } } }), 'A'); await p.goto('http://localhost:8782/index.html');
  await esperar(p, () => S.membro && S.amigosOk, null, 10000); await sleep(800);
  // limpeza dos próprios stories
  const ids = await ev(p, async () => { const o = []; for (let i = 1; i <= 3; i++) { const r = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'story', texto: 'S' + i, fotos: [], estilo: { v: 2 } }).select('id'); o.push(r.data[0].id) } return o });
  await H.sql(`update publicacoes set expira = $1 where id = any($2)`, [Date.now() - 40 * 864e5, [ids[0], ids[1]]]);
  await H.sql(`insert into destaques(dono,nome,itens) values ($1,'Fica',array[$2::uuid])`, [a, ids[1]]);
  await ev(p, async () => { try { localStorage.removeItem('prumo-limpa:' + S.uid) } catch (e) { } DEST = {}; await pubLimparMeus() }); await sleep(500);
  const rest = (await H.sql(`select id from publicacoes where tipo='story'`)).map(r => r.id).sort();
  ok(JSON.stringify(rest) === JSON.stringify([ids[1], ids[2]].sort()), 'apaga só o story velho fora de destaque', rest);
  await ev(p, async () => { await pubLimparMeus() }); ok(true, 'segunda chamada respeita o intervalo de 6 h');
  // painel sem o v6
  await ev(p, () => { go('me'); abrirAdmin('uso') }); await sleep(1500);
  ok(await ev(p, () => /publicacoes-v6\.sql/.test(document.querySelector('#uso-esp')?.textContent || '')), 'sem o SQL v6: explica o que rodar');
  // painel com dados (simulados) e limpeza
  await ev(p, () => { closeLayer(); const rpc = S.db.rpc.bind(S.db); window.__lim = [];
    S.db.rpc = async (f, a) => { if (f === 'admin_espaco') return { db_bytes: 31 * 1048576, tabelas: [{ nome: 'publicacoes', bytes: 9e6, linhas: 900 }, { nome: 'mensagens', bytes: 4e6, linhas: 3000 }, { nome: 'docs', bytes: 2e6, linhas: 80 }], buckets: [{ bucket: 'fotos', arquivos: 412, bytes: 690 * 1048576 }, { bucket: 'videos', arquivos: 20, bytes: 210 * 1048576 }], orfas: { arquivos: 3, bytes: 3 * 1048576 }, stories_velhos: 5 };
      if (f === 'admin_limpar_stories') { window.__lim.push(f); return 5 } if (f === 'admin_midias_orfas') { window.__lim.push(f); return [{ bucket: 'fotos', nome: 'x/a.jpg', bytes: 1 }, { bucket: 'videos', nome: 'x/b.mp4', bytes: 1 }] } return rpc(f, a) };
    S.adm.esp = null; abrirAdmin('uso') }); await sleep(1500);
  const t = await ev(p, () => document.querySelector('#uso-esp').textContent);
  ok(/Banco de dados31 MB de 500 MB/.test(t) && /Fotos e vídeos900 MB de 1 GB/.test(t), 'barras de banco e de arquivos com os limites do plano grátis', t.slice(0, 200));
  ok(/Posts e stories/.test(t) && /5 stories com mais de 30 dias/.test(t) && /3 arquivos sem uso/.test(t), 'o que mais ocupa e o que dá para limpar');
  ok(await ev(p, () => !!document.querySelector('#uso-esp .esp-b.alto')), 'arquivos acima de 80% ficam em laranja');
  await ev(p, () => document.querySelector('#uso-esp').scrollIntoView()); await p.screenshot({ path: SH + 'd73-espaco.png' });
  await ev(p, () => { window.__T = []; const t0 = toast; toast = function (m) { window.__T.push(m); return t0.apply(this, arguments) } });
  await ev(p, () => document.querySelector('[data-esplimpar]').click()); await sleep(100); await ev(p, () => document.querySelector('[data-esplimpar]').click()); await sleep(1200);
  ok(await ev(p, () => window.__lim.join(',') === 'admin_limpar_stories,admin_midias_orfas' && window.__T.some(m => /5 stories e 2 arquivos/.test(m))), 'limpar: confirma, apaga stories e os arquivos sem uso');
  ok(!p._erros.length, 'sem erros: ' + p._erros.join('|'));
  const R = U.resumo(); console.log(`\nRESUMO t_etapa73: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
