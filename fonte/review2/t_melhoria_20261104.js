// Melhoria contínua 04/11/2026: editar a coluna (menu "…" › "Editar a coluna" › Salvar), sem apagar e publicar de novo.
// Sem a proposta SQL (sql/proposta-2026-11-04.sql): título, linha fina e hashtags mudam; o texto longo avisa e não muda.
// Com a proposta: o texto longo muda também. Coluna antiga (texto em estilo.coluna.corpo) continua guardando lá.
// Desde o 132 a edição usa o editor novo (o texto vira HTML ao mudar; sem mudar, a coluna antiga fica como estava).
// Banco SEM a v12 (que já traz a proposta), para conferir o caminho sem a proposta. Portas 8706–8707. Capturas em qa/melhoria-20261104/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8706, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'melhoria-20261104'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const semToast = p => p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
const shot = async (p, n) => { await semToast(p); await p.screenshot({ path: path.join(QA, n + '.png') }) };
const CORPO = ['Primeiro parágrafo da coluna sobre o orçamento, com bastante texto para passar do mínimo de quarenta caracteres.',
  '## Um intertítulo', 'Segundo parágrafo: as contas do governo e o que muda para quem paga imposto.'].join('\n');
let srv = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar({ sql: path.join(__dirname, '..', 'sql', 'prumo-supabase.antes-v12.sql') });
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const agora = Date.now();
  const col = (tit, linha, extra) => ({ v: 2, coluna: { v: 1, tit, linha, min: 1, ...(extra || {}) } });
  const [c1] = await H.sql(`insert into public.publicacoes(autor,tipo,at,texto,fotos,estilo,publico,corpo) values ($1,'post',$2,$3,'[]',$4,'amigos',$5) returning id`,
    [ids.b, agora - 60000, 'O orçamento apertado\n\nO que muda nas contas\n\n#Economia', col('O orçamento apertado', 'O que muda nas contas'), CORPO]);
  const [c2] = await H.sql(`insert into public.publicacoes(autor,tipo,at,texto,fotos,estilo,publico) values ($1,'post',$2,$3,'[]',$4,'amigos') returning id`,
    [ids.b, agora - 120000, 'Coluna antiga\n\nLinha antiga', col('Coluna antiga', 'Linha antiga', { corpo: 'Texto antigo guardado no estilo, como antes da v9, com mais de quarenta caracteres.' })]);
  const pub = async id => (await H.sql(`select texto,estilo,corpo,editado from public.publicacoes where id=$1`, [id]))[0];
  const como = (k, q, p) => H.comoUsuario(ids[k], () => H.db.query(q, p || []));
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V9 !== 'undefined' && V9.on !== null, null, 15000); await sleep(500); await fecha(p); return p };
  const recarrega = P => ev(P, async () => { PUB.sig = ''; try { VN112_Q.clear() } catch (e) { } await pubCarregar() });
  const menu = async (P, id) => { await fecha(P); await ev(P, id => { const b = document.createElement('button'); b.dataset.umenu = id; b.className = 'more-btn'; b.hidden = true; document.body.appendChild(b); b.click(); b.remove() }, id); await sleep(300) };
  const opts = P => ev(P, () => [...document.querySelectorAll('.sheet .opt > button')].map(b => b.childNodes[0].textContent.trim()));
  const editar = async (P, id) => { await menu(P, id); await ev(P, id => document.querySelector(`.sheet [data-mc1104ed="${id}"]`).click(), id); await esperar(P, () => !!document.querySelector('#layer > .ed132 #ed132-corpo')); await sleep(200) };
  const salvar = async P => { await ev(P, () => document.querySelector('#layer > .ed132 [data-ed132salva]').click()); await sleep(900) };
  const tags = async (P, t) => { await ev(P, () => ed132Painel()); await sleep(200); await P.fill('#ed132-tags', t); await ev(P, () => document.querySelector('[data-ed132ppx]').click()); await sleep(100) };
  const maisTexto = (P, t) => ev(P, t => { const cp = $('#ed132-corpo'); cp.insertAdjacentHTML('beforeend', '<p>' + t + '</p>'); cp.dispatchEvent(new Event('input', { bubbles: true })) }, t);
  const toastTx = P => ev(P, () => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));

  const B = await abrir('b'), A = await abrir('a');
  ok(await ev(B, () => V9.on === true && typeof mc1104Salvar === 'function'), 'estado: v9 ligada e a melhoria carregada');
  await recarrega(B);

  /* menu: a dona vê "Editar a coluna" (e não "Editar legenda"); o amigo não */
  await menu(B, c1.id); const ob = await opts(B);
  ok(ob[0] === 'Editar a coluna' && !ob.includes('Editar legenda') && ob.some(t => /Apagar/.test(t)), 'menu da Bia: "Editar a coluna" primeiro, sem "Editar legenda"', ob);
  await recarrega(A); await menu(A, c1.id); const oa = await opts(A);
  ok(oa.length > 0 && !oa.includes('Editar a coluna'), 'menu do Pedro (coluna da Bia): sem "Editar a coluna"', oa);
  await fecha(A);

  /* editor em modo editar */
  await editar(B, c1.id);
  const ed = await ev(B, () => ({ h: $('#layer > .ed132 .ed132-ht b').textContent, tit: $('#ed132-tit').value, lin: $('#ed132-lin').value, corpo: ed132Le().html, tags: ED132.E.tags,
    rasc: !!document.querySelector('#layer > .ed132 [data-ed132painel]'), pub: $('#layer > .ed132 [data-ed132salva]').textContent,
    lat: document.documentElement.scrollWidth <= innerWidth }));
  ok(ed.h === 'Editar coluna' && ed.tit === 'O orçamento apertado' && ed.lin === 'O que muda nas contas' && ed.tags === '#Economia', 'editor: título "Editar coluna" e campos preenchidos', ed);
  ok(/<h2>Um intertítulo<\/h2>/.test(ed.corpo) && /Segundo parágrafo/.test(ed.corpo), 'editor: o texto vem inteiro, com o intertítulo como bloco');
  ok(!ed.rasc && ed.pub === 'Salvar' && ed.lat, 'editor: sem "Publicar"; botão "Salvar"; sem rolagem lateral', ed);
  await shot(B, '01-editor');

  /* sem a proposta SQL: muda título, linha fina e hashtags */
  await B.fill('#ed132-tit', 'O orçamento ficou mais apertado'); await B.fill('#ed132-lin', 'O que muda nas contas de 2027'); await tags(B, '#Economia #Orçamento');
  await salvar(B); let r = await pub(c1.id);
  ok(r.texto === 'O orçamento ficou mais apertado\n\nO que muda nas contas de 2027\n\n#Economia #Orçamento' && r.estilo.coluna.tit === 'O orçamento ficou mais apertado' && r.estilo.coluna.linha === 'O que muda nas contas de 2027' && r.estilo.v === 2, 'sem a proposta: título, linha fina e hashtags salvos no banco', r);
  ok(r.corpo === CORPO && !('corpo' in r.estilo.coluna) && r.editado > 0, 'sem a proposta: texto longo intacto, "editado" marcado');
  ok(await ev(B, () => !$('#layer').innerHTML && /Coluna atualizada/.test([...document.querySelectorAll('.toast')].map(t => t.textContent).join()) && cs123RascLe().length === 0), 'salvar fecha o editor, avisa "Coluna atualizada" e não cria rascunho');
  ok(await ev(B, id => cs123Col(pubDe(id)).tit === 'O orçamento ficou mais apertado', c1.id), 'o app já mostra o título novo sem recarregar');

  /* sem a proposta: só o texto longo mudou → aviso, nada muda, editor continua aberto */
  await semToast(B); await editar(B, c1.id); await maisTexto(B, 'Parágrafo novo que o servidor ainda não deixa salvar.'); await salvar(B);
  r = await pub(c1.id); const t1 = await toastTx(B);
  ok(r.corpo === CORPO && /ainda não está ligado no servidor/.test(t1) && await ev(B, () => !!document.querySelector('#layer > .ed132') && !ED132.E.env), 'sem a proposta: mudar só o texto avisa e o editor continua aberto', t1);
  await semToast(B);
  /* título + texto juntos: salva o título e avisa sobre o texto */
  await B.fill('#ed132-tit', 'Orçamento: o aperto'); await salvar(B); r = await pub(c1.id); const t2 = await toastTx(B);
  ok(r.estilo.coluna.tit === 'Orçamento: o aperto' && r.corpo === CORPO && !r.estilo.coluna.f && /Título e linha fina salvos/.test(t2), 'sem a proposta: título e texto juntos → salva o título (texto no formato antigo) e avisa sobre o texto', t2);
  await fecha(B);

  /* o Pedro não consegue mudar a coluna da Bia direto no banco */
  const qa = await como('a', `update public.publicacoes set texto='hack' where id=$1 returning id`, [c1.id]).catch(e => ({ rows: [], e: e.message }));
  ok(!(qa.rows || []).length && (await pub(c1.id)).texto !== 'hack', 'banco: outro membro não muda a coluna da Bia');

  /* com a proposta SQL */
  await H.db.exec(fs.readFileSync(path.join(__dirname, '..', 'sql', 'proposta-2026-11-04.sql'), 'utf8'));
  const qa2 = await como('a', `update public.publicacoes set corpo='hack' where id=$1 returning id`, [c1.id]).catch(e => ({ rows: [], e: e.message }));
  ok(!(qa2.rows || []).length && (await pub(c1.id)).corpo === CORPO, 'com a proposta: outro membro continua sem mudar o texto da Bia');
  const qa3 = await como('b', `update public.publicacoes set corpo='x' where id=(select id from public.publicacoes where autor=$1 and tipo='post' and estilo->'coluna' is null limit 1) returning id`, [ids.b]).catch(e => ({ rows: [], e: e.message }));
  ok(!(qa3.rows || []).length, 'com a proposta: texto longo continua só em coluna');
  await semToast(B); await editar(B, c1.id); await maisTexto(B, 'Parágrafo novo: agora o servidor deixa mudar o texto.'); await salvar(B); r = await pub(c1.id);
  ok(/<h2>Um intertítulo<\/h2>/.test(r.corpo) && /<p>Parágrafo novo: agora o servidor deixa mudar o texto\.<\/p>$/.test(r.corpo) && r.estilo.coluna.f === 'h' && r.estilo.coluna.tit === 'Orçamento: o aperto' && /Coluna atualizada/.test(await toastTx(B)), 'com a proposta: o texto longo muda (vira HTML do editor novo)', r.corpo);
  await ev(B, id => cs123Abrir(id), c1.id); await sleep(400);
  ok(/agora o servidor deixa mudar o texto/.test(await ev(B, () => $('#layer .cs123-corpo')?.textContent || '')), 'a página de leitura mostra o texto novo');
  await shot(B, '02-leitura-nova'); await fecha(B);

  /* coluna antiga (texto no estilo): continua no estilo */
  await semToast(B); await editar(B, c2.id); await ev(B, () => { const cp = $('#ed132-corpo'); cp.innerHTML = '<p>Texto antigo revisto, ainda guardado no estilo, com mais de quarenta caracteres.</p>'; cp.dispatchEvent(new Event('input', { bubbles: true })) }); await salvar(B); r = await pub(c2.id);
  ok(r.corpo === null && r.estilo.coluna.corpo === '<p>Texto antigo revisto, ainda guardado no estilo, com mais de quarenta caracteres.</p>' && r.estilo.coluna.f === 'h' && r.estilo.coluna.tit === 'Coluna antiga', 'coluna antiga: o texto continua em estilo.coluna.corpo', r);

  /* o Pedro vê a versão nova */
  await recarrega(A); ok(await ev(A, id => { const x = pubDe(id), c = x && cs123Col(x); return !!c && c.tit === 'Orçamento: o aperto' && /agora o servidor deixa/.test(c.corpo) }, c1.id), 'o Pedro vê o título e o texto novos');

  /* escuro: o editor */
  const BD = await abrir('b', { dark: true, n: 'd' }); await recarrega(BD); await editar(BD, c1.id); await shot(BD, '03-editor-escuro');
  ok(await ev(BD, () => document.documentElement.scrollWidth <= innerWidth), 'escuro: editor sem rolagem lateral');

  for (const P of [A, B, BD]) ok(!(P._erros || []).length, 'sem erros na página', P._erros);
  const R = U.resumo(); console.log(`\n${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.log('Error', e); try { srv && srv.kill() } catch (_) { } process.exit(1) });
