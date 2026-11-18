// Fase 6 · Colunas (207): filtro "Colunas" no Feed (por editoria e por autor), editoria obrigatória ao publicar,
// colunas guardadas com "Continuar de onde parei" e "Publicadas" em Minhas colunas (números, agrupar por mês, série
// e editoria, ordem por mais lidas); com e sem a função nova do banco (proposta de 18/11). Porta 8754.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8754, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'colunas-f6'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } ED132.E = null });
const semLateral = P => ev(P, () => document.documentElement.scrollWidth <= innerWidth + 1);
const PARS = Array.from({ length: 30 }, (_, i) => `Parágrafo ${i + 1} da coluna: o orçamento chega ao Congresso com uma conta que não fecha, e quem anda pelos corredores percebe que a conversa mudou, com cada bancada fazendo as próprias contas.`);
const CORPO = PARS.map(p => `<p>${p}</p>`).join('');
const col = (tit, o = {}) => ({ v: 2, coluna: { v: 1, f: 'h', tit, linha: 'O que se ouve no Congresso', min: 4, ...o } });
let srv = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro')`, [ids.a, ids.b, ids.c]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita')`, [ids.a, ids.b, ids.c]);
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || [])).then(r => r.rows);
  const pub = async (k, tit, est, tags) => (await como(k, `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,'[]',$3,'amigos',$4) returning id`, [ids[k], tit + '\n\nO que se ouve no Congresso' + (tags ? '\n\n' + tags : ''), est, CORPO]))[0].id;
  const p1 = await pub('b', 'O orçamento no corredor', col('O orçamento no corredor', { ed: 'politica', serie: 'Bastidores', n: 1 }));
  const p2 = await pub('b', 'A conta dos juros', col('A conta dos juros', { ed: 'economia' }));
  const p3 = await pub('b', 'O dólar e a feira', col('O dólar e a feira'), '#Economia');
  const p4 = await pub('c', 'A cúpula vista de perto', col('A cúpula vista de perto', { ed: 'mundo' }));
  await como('b', `insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico) values ($1,'post','Um post comum da Bia','[]','{}','amigos')`, [ids.b]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp || { width: 390, height: 844 } }), k.toUpperCase());
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null && ED132.v12.ag !== null && LT134.v13 !== null, null, 20000);
    return p };
  const A = await abrir('a');

  /* ===== 1. filtro Colunas no Feed ===== */
  ok(await esperar(A, () => col207Todas().length === 4, null, 8000), 'o Feed do Pedro tem as 4 colunas (Bia e Carla)', await ev(A, () => col207Todas().length));
  await ev(A, () => { go('feed'); abrirFiltro() });
  const opc = await ev(A, () => [...document.querySelectorAll('#layer2 [data-filtro], #layer [data-filtro]')].map(b => b.dataset.filtro + '=' + b.textContent.replace(/\s+/g, ' ').trim()));
  ok(opc.some(t => /^_colunas=Colunas4 colunas/.test(t)), 'a folha de filtro tem "Colunas" com "4 colunas"', opc);
  await ev(A, () => document.querySelector('[data-filtro="_colunas"]').click()); await sleep(500);
  const lista = () => ev(A, () => [...document.querySelectorAll('#posts [data-cs123ler]')].map(b => b.dataset.cs123ler).filter((v, i, a) => a.indexOf(v) === i));
  let l = await lista();
  ok(await ev(A, () => FILTRO === '_colunas') && l.length === 4 && [p1, p2, p3, p4].every(id => l.includes(id)), 'só colunas no Feed filtrado (nenhuma notícia, nenhum post comum)', l);
  ok(await ev(A, () => !document.querySelector('#posts article[data-pauta], #posts .vn112-ct') && /Colunas/.test($('#posts .sech h4').textContent) && /4 colunas/.test($('#posts .sech').textContent)), 'cabeçalho "Colunas · 4 colunas" e nenhuma notícia');
  const chips = await ev(A, () => [...document.querySelectorAll('#posts [data-col207fe]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
  ok(chips.join('|') === 'Todas|Política 1|Economia 2|Mundo 1' || (chips[0] === 'Todas' && chips.includes('Economia 2') && chips.includes('Política 1') && chips.includes('Mundo 1')), 'editorias: Todas, Política 1, Economia 2 (a antiga com #Economia entra em Economia), Mundo 1', chips);
  await shot(A, '1-filtro-colunas');
  await ev(A, () => document.querySelector('#posts [data-col207fe="economia"]').click()); await sleep(300);
  l = await lista(); ok(l.length === 2 && l.includes(p2) && l.includes(p3), 'Economia: as duas colunas de economia', l);
  const aut = await ev(A, () => [...document.querySelectorAll('#posts [data-col207fa]')].map(b => b.textContent.trim()));
  ok(aut.length === 0, 'com uma autora só na editoria, não aparece a fileira de autores', aut);
  await ev(A, () => document.querySelector('#posts [data-col207fe=""]').click()); await sleep(300);
  ok((await ev(A, () => [...document.querySelectorAll('#posts [data-col207fa]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()))).join('|') === 'Todos|Bia Souza 3|Carla Mendes 1', 'fileira de autores: Todos, Bia 3, Carla 1');
  await ev(A, () => document.querySelector('#posts [data-col207fa]:not([data-col207fa=""])').click()); await sleep(300);
  l = await lista(); ok(l.length === 3 && !l.includes(p4), 'só as da Bia', l);
  ok(await semLateral(A), '390 px: sem rolagem lateral no filtro');
  await ev(A, () => document.querySelector('#posts .vertudo').click()); await sleep(400);
  ok(await ev(A, () => FILTRO === 'tudo' && !!document.querySelector('#posts [data-cs123ler]')), '"Ver tudo" volta ao Feed misturado, com as colunas no meio');

  /* ===== 2. guardar e continuar de onde parei ===== */
  await ev(A, id => vp99Salvar('u:' + id), p1); await ev(A, id => vp99Salvar('u:' + id), p2); await sleep(600);
  await ev(A, id => cs123Abrir(id), p1);
  ok(await esperar(A, () => { const sc = document.querySelector('#layer .cs123-ler .cs123-sc'); return sc && sc.scrollHeight > sc.clientHeight + 200 }, null, 6000), 'a coluna abre com texto longo');
  await ev(A, () => { const sc = $('#layer .cs123-sc'); sc.scrollTop = Math.round((sc.scrollHeight - sc.clientHeight) * 0.5); sc.dispatchEvent(new Event('scroll')) }); await sleep(1100);
  const prog = await ev(A, id => col207ProgLe()[id], p1);
  ok(prog && Math.abs(prog.f - 0.5) < 0.05, 'guarda até onde leu (50%)', prog);
  await fecha(A); await ev(A, id => cs123Abrir(id), p1); await sleep(900); await fecha(A);
  ok(Math.abs(await ev(A, id => col207ProgLe()[id].f, p1) - 0.5) < 0.05, 'abrir de novo e sair do topo não apaga o lugar guardado');
  await ev(A, () => gd161Abre('colunas')); await sleep(900);
  const gd = await ev(A, () => ({ chips: [...document.querySelectorAll('[data-gd161]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), itens: [...document.querySelectorAll('.col207-gl li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()) }));
  ok(gd.chips.includes('Colunas 2'), 'Guardados tem o filtro "Colunas 2"', gd.chips);
  ok(gd.itens.length === 2 && /O orçamento no corredor/.test(gd.itens[0]) && /parou em 50%/.test(gd.itens[0]) && /Continuar de onde parei/.test(gd.itens[0]) && /ainda não lida/.test(gd.itens[1]), 'a coluna lida pela metade vem primeiro, com "você parou em 50%" e "Continuar de onde parei"', gd.itens);
  await shot(A, '2-guardadas');
  await ev(A, () => document.querySelector('[data-col207cont]').click());
  ok(await esperar(A, () => { const sc = document.querySelector('#layer .cs123-ler .cs123-sc'); if (!sc) return false; const m = sc.scrollHeight - sc.clientHeight; return m > 0 && Math.abs(sc.scrollTop / m - 0.5) < 0.06 }, null, 6000), '"Continuar" abre a coluna no ponto onde a pessoa parou');
  await ev(A, () => { const sc = $('#layer .cs123-sc'); sc.scrollTop = sc.scrollHeight; sc.dispatchEvent(new Event('scroll')) }); await sleep(1100); await fecha(A);
  await ev(A, () => gd161Abre('colunas')); await sleep(700);
  ok(/lida até o fim/.test(await ev(A, () => [...document.querySelectorAll('.col207-gl li')].map(li => li.textContent).join('|'))), 'lida até o fim: some o "Continuar"');
  ok(await ev(A, () => { GD161_F = 'posts'; renderMe(); return !document.querySelector('.col207-gl') }), 'filtro Posts não mistura as colunas');

  /* ===== 3. editoria obrigatória ao publicar ===== */
  const B = await abrir('b');
  await ev(B, () => { ed132Abre(ed132Novo({})) }); await sleep(500);
  await ev(B, () => { $('#ed132-tit').value = 'Coluna nova sem editoria'; $('#ed132-corpo').innerHTML = '<p>' + 'Um texto de coluna com bastante coisa para dizer sobre o orçamento. '.repeat(4) + '</p>'; ed132Publica() }); await sleep(500);
  ok(await ev(B, () => !!$('#layer > .ed132 .ed132-pp #ed132-eds')), '"Antes de publicar" abre com a seção Editoria');
  const edsTx = await ev(B, () => [...document.querySelectorAll('#ed132-eds [data-ed132ed]')].map(b => b.textContent));
  ok(edsTx.includes('Política') && edsTx.includes('Economia'), 'as editorias do Prumo para escolher', edsTx);
  await ev(B, () => document.querySelector('#layer [data-ed132pub]').click()); await sleep(400);
  ok(/Escolha a editoria/.test(await toastTx(B)) && await ev(B, () => !!ED132.E), 'sem editoria não publica: aviso "Escolha a editoria da coluna"');
  await ev(B, () => document.querySelector('#ed132-eds [data-ed132ed="politica"]').click()); await sleep(300);
  ok(await ev(B, () => ED132.E.ed === 'politica' && document.querySelector('#ed132-eds [data-ed132ed="politica"]').getAttribute('aria-pressed') === 'true'), 'tocar escolhe a editoria');
  await shot(B, '3-editoria');
  await ev(B, () => document.querySelector('#layer [data-ed132pub]').click());
  ok(await esperar(B, () => !ED132.E, null, 6000), 'com a editoria, publica');
  const row = (await H.sql(`select estilo from public.publicacoes where autor=$1 and texto like 'Coluna nova sem editoria%'`, [ids.b]))[0];
  ok(row && row.estilo.coluna.ed === 'politica', 'banco: estilo.coluna.ed = "politica"', row && row.estilo.coluna);
  ok(await ev(B, () => { const x = PUB.itens.find(y => cs123Col(y) && cs123Col(y).tit === 'Coluna nova sem editoria'); return x && col207Ed(x) === 'politica' && /Coluna · Política/.test(ed132Kick(cs123Col(x))) }), 'a editoria aparece no rótulo da coluna ("Coluna · Política")');

  /* ===== 4. Minhas colunas: Publicadas ===== */
  await ev(B, () => ed132Hub());
  ok(await esperar(B, () => document.querySelectorAll('#layer .col207-pl li').length === 4, null, 8000), 'Minhas colunas: as 4 publicadas da Bia', await ev(B, () => document.querySelectorAll('#layer .col207-pl li').length));
  const gm = await ev(B, () => [...document.querySelectorAll('#layer .col207-gh')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
  ok(gm.length >= 1 && /de 2026/.test(gm[0]), 'agrupadas por mês por padrão', gm);
  const pp1 = await ev(B, id => { const li = document.querySelector(`#layer .col207-pl [data-cs123ler="${id}"]`).closest('li'); return li.textContent.replace(/\s+/g, ' ') }, p1);
  ok(/1 leitura · 1 até o fim \(100%\)/.test(pp1) && /Política/.test(pp1) && /Bastidores nº 1/.test(pp1), 'p1: editoria, série e "1 leitura · 1 até o fim (100%)" (a leitura do Pedro)', pp1);
  await ev(B, () => document.querySelector('#layer [data-col207ag="ed"]').click()); await sleep(300);
  const ge = await ev(B, () => [...document.querySelectorAll('#layer .col207-gh')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
  ok(ge.join('|') === 'Economia 2|Política 2', 'por editoria: Economia 2 e Política 2 (maiores primeiro)', ge);
  await ev(B, () => document.querySelector('#layer [data-col207ag="serie"]').click()); await sleep(300);
  const gs = await ev(B, () => [...document.querySelectorAll('#layer .col207-gh')].map(h => h.textContent.replace(/\s+/g, ' ').trim()));
  ok(gs.join('|') === 'Bastidores 1|Fora de série 3', 'por série: Bastidores 1, Fora de série 3 (no fim)', gs);
  await ev(B, () => { document.querySelector('#layer [data-col207ag="data"]').click() }); await sleep(200);
  await ev(B, () => document.querySelector('#layer [data-col207or="lidas"]').click()); await sleep(300);
  ok(await ev(B, id => document.querySelector('#layer .col207-pl li [data-cs123ler]').dataset.cs123ler === id, p1), 'Mais lidas: a lida pelo Pedro vem primeiro');
  ok(await semLateral(B), '390 px: Minhas colunas sem rolagem lateral');
  await shot(B, '4-publicadas');
  /* sem a função nova: os números vêm das 10 mais lidas, e o resto continua */
  ok(await ev(B, () => COL207.todos === false), 'sem a função nova do banco, usa as 10 mais lidas (coluna_mais_lidas)');
  await H.db.exec(fs.readFileSync(path.join(__dirname, '..', 'sql', 'proposta-2026-11-18-colunas.sql'), 'utf8'));
  await ev(B, () => { COL207.carregado = 0; closeLayer._ok = true; closeLayer(); closeLayer._ok = false; ed132Hub() });
  ok(await esperar(B, () => COL207.todos === true && document.querySelectorAll('#layer .col207-pl li').length === 4, null, 6000), 'com a proposta rodada: números de todas (coluna_minhas_numeros)');
  ok(/Ninguém leu ainda/.test(await ev(B, () => $('#layer .ed132-hubr').textContent)), 'com todos os números, as não lidas dizem "Ninguém leu ainda"');
  ok((await como('a', `select public.coluna_minhas_numeros() r`))[0].r.length === 0, 'banco: o Pedro só vê os números das colunas dele (nenhuma)');
  await fecha(B);

  /* ===== 5. modo escuro e celular pequeno ===== */
  const D = await abrir('a', { dark: true, vp: { width: 360, height: 740 } });
  await ev(D, () => { go('feed'); FILTRO = '_colunas'; COL207.ed = ''; COL207.au = ''; renderPosts() }); await sleep(500);
  ok(await semLateral(D) && await ev(D, () => document.querySelectorAll('#posts [data-col207fe]').length >= 3), '360 px escuro: filtro com as editorias e sem rolagem lateral');
  await shot(D, '5-escuro-360');
  for (const [P, n] of [[A, 'A'], [B, 'B'], [D, 'D']]) ok(!(P._erros || []).length, `sem erros de JS (${n})`, P._erros);
  const R = U.resumo(); console.log(`\nRESUMO t_colunas_f6: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { srv && srv.kill() } catch (_) { } process.exit(1) });
