// Decisões do Pedro (122, 03/11), no estado de produção (foco, visual novo com o cartão A, sem reels e fase 2), com Pedro, Bia, Carla e Dani:
// 1. repost sem comentário de original indisponível (arquivado, apagado, amizade desfeita) só aparece para quem repostou;
// 2. original + reposts sem comentário = um item só no Feed, com "Bia e Carla repostaram", na posição do repost mais recente; citação à parte;
// 3. sem a linha "Relato pessoal, não checado…"; 4. cartão A: quem postou primeiro em todo post de amigo; 5. "Relato" → "De perto".
// Portas 8740–8741. Capturas 390x844 em qa/decisoes/.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 8740, BASE = `http://localhost:${PORTA}/index.html`;
const QA = path.join(__dirname, '..', 'qa', 'decisoes'); fs.mkdirSync(QA, { recursive: true });
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
let srv = null;
(async () => {
  U.feedFresco('site'); srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b', 'c', 'd']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro'),($3,'Carla Mendes','membro'),($4,'Dani Rocha','membro')`, [ids.a, ids.b, ids.c, ids.d]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita'),($1,$3,'aceita'),($2,$3,'aceita'),($4,$1,'aceita')`, [ids.a, ids.b, ids.c, ids.d]);
  const br = await U.navegador();
  const abrir = async (k, o = {}) => { const p = U.erros(await H.pagina(br, { sessao: { user: { id: ids[k], email: k + '@x' } }, dark: o.dark, viewport: o.vp }), k.toUpperCase() + (o.n || ''));
    await p.addInitScript(() => { try { for (const x of ['foco', 'semreels', 'visual']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } });
    await p.goto(BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true && typeof V8 !== 'undefined' && V8.on === true, null, 15000); await sleep(600); await fecha(p); return p };
  const A = await abrir('a'), A2 = await abrir('a', { n: '2', dark: true }), B = await abrir('b'), C = await abrir('c'), D = await abrir('d');
  ok(await ev(A, () => document.documentElement.classList.contains('dc122') && VN112_CT === 'a' && VN_FASE2 && FOCO_LIGADO && !REELS_LIGADO && typeof dc122Feed === 'function'), 'estado de produção (cartão A, fase 2, foco, sem reels) e o 122 carregado');
  const AT = {}; // a hora pedida de cada publicação (o banco grava a hora do insert; o teste acerta depois)
  const ins = async (P, r) => { const id = await ins0(P, r); AT[id] = r.at; return id };
  const ins0 = (P, r) => ev(P, async r => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], ...r }).select('id'); await pubCarregar(); return q.data[0].id }, r);
  const pinta = P => ev(P, () => { const cv = document.createElement('canvas'); cv.width = 800; cv.height = 600; const g = cv.getContext('2d');
    PUB.itens.forEach(x => x.fotos.forEach((f, i) => { g.fillStyle = ['#2f7d5b', '#36589a', '#a3562a'][i % 3]; g.fillRect(0, 0, 800, 600); g.fillStyle = '#fff'; g.font = '700 64px sans-serif'; g.textAlign = 'center'; g.fillText('Foto ' + (i + 1), 400, 320); PUB.urls[f] = { u: cv.toDataURL('image/jpeg', .7), exp: Date.now() + 9e9 } })) });
  const feed = P => ev(P, async () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } await pubCarregar(); FILTRO = 'tudo'; go('feed'); renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) });
  const prep = async P => { await feed(P); await pinta(P); await ev(P, () => { renderPosts(); for (let i = 0; i < 14; i++) try { carregarMais(true) } catch (e) { } scrollTo(0, 0) }); await sleep(500) };
  const tem = (P, id) => ev(P, id => document.querySelectorAll(`#posts [id="p-u:${id}"]`).length, id);
  const mostra = async (P, id, n, dy = 64) => { await ev(P, ([id, dy]) => { const e = document.getElementById('p-u:' + id); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - dy) }, [id, dy]); await sleep(350);
    await ev(P, () => document.querySelectorAll('.toast').forEach(t => t.remove())); await P.screenshot({ path: path.join(QA, n + '.png') }) };
  const now = Date.now(); const fp = (u, n, k) => Array.from({ length: n }, (_, i) => `${u}/${k}-${i}.jpg`);
  const pk = await ev(A, () => ordenadas(visiveis()).map(p => p.id));
  const P = {};
  // conteúdo (Bia, Carla e Pedro), mais antigo primeiro
  P.ped = await ins(A, { at: now - 120 * 60e3, texto: 'O Senado deve aprovar a PEC na semana que vem. Falta só o acordo com a Câmara.', estilo: { v: 2 } });
  P.ana = await ins(B, { at: now - 110 * 60e3, texto: 'Juros altos por mais tempo\n\nCom a Selic alta, o crédito fica caro e o consumo esfria. #Copom', estilo: { v: 2, cn: { v: 1, k: 'ana', tit: 'Juros altos por mais tempo', fu: 'bcb.gov.br' } } });
  P.enq = await ins(B, { at: now - 105 * 60e3, texto: 'Vocês acham que passa ainda este ano?', pid: pk[3], estilo: { v: 2, cn: { v: 1, k: 'enq', tit: 'A PEC passa no Senado?', o: ['Sim', 'Não'] } } });
  P.rel = await ins(B, { at: now - 100 * 60e3, texto: 'Fila no posto\n\nA fila dobrava o quarteirão desde as 7h.', fotos: fp(ids.b, 2, 'r'), estilo: { v: 2, local: 'Tijuca, Rio de Janeiro', cn: { v: 1, k: 'rel', tit: 'Fila no posto' } } });
  P.foto = await ins(B, { at: now - 95 * 60e3, texto: 'Pôr do sol no Arpoador hoje. Valeu a caminhada.', fotos: fp(ids.b, 1, 'f'), estilo: { v: 2, local: 'Arpoador, Rio de Janeiro' } });
  P.txt = await ins(C, { at: now - 90 * 60e3, texto: 'Alguém mais achou o debate de ontem morno? Esperava mais propostas.', estilo: { v: 2 } });
  P.fio = await ins(C, { at: now - 85 * 60e3, texto: 'Três pontos sobre a reforma.', estilo: { v: 2, fio: ['Segundo: quem paga muda.', 'Terceiro: a transição é longa.'] } });
  P.nt = await ins(C, { at: now - 80 * 60e3, texto: 'Acho que essa medida ajuda quem está começando.', pid: pk[5], estilo: { v: 2, cn: { v: 1, k: 'nt' } } });
  P.velho = await ins(B, { at: now - 40 * 864e5, texto: 'Post antigo da Bia, de mais de um mês.', estilo: { v: 2 } });
  P.arq = await ins(B, { at: now - 70 * 60e3, texto: 'Este a Bia vai arquivar.', estilo: { v: 2 } });
  P.apg = await ins(B, { at: now - 69 * 60e3, texto: 'Este a Bia vai apagar.', estilo: { v: 2 } });
  P.carla = await ins(C, { at: now - 68 * 60e3, texto: 'Post da Carla que a Bia reposta.', estilo: { v: 2 } });
  // reposts (o mais recente por último)
  P.rpB = await ins(B, { at: now - 30 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.ped } } });
  P.qD = await ins(D, { at: now - 25 * 60e3, texto: 'Concordo, mas o acordo não sai fácil.', estilo: { v: 2, rp: { k: 'pub', id: P.ped } } });
  P.rpC = await ins(C, { at: now - 5 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.ped } } });
  P.rpVelho = await ins(C, { at: now - 20 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.velho } } });
  P.rpArq = await ins(C, { at: now - 19 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.arq } } });
  P.qArq = await ins(C, { at: now - 18 * 60e3, texto: 'Comentário da Carla sobre o post da Bia.', estilo: { v: 2, rp: { k: 'pub', id: P.arq } } });
  P.rpApg = await ins(C, { at: now - 17 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.apg } } });
  P.rpCarla = await ins(B, { at: now - 16 * 60e3, texto: '', estilo: { v: 2, rp: { k: 'pub', id: P.carla } } });
  P.qRel = await ins(C, { at: now - 15 * 60e3, texto: 'Aqui também estava assim.', estilo: { v: 2, rp: { k: 'pub', id: P.rel } } });
  await H.sql(`set session_replication_role = replica`); for (const [id, at] of Object.entries(AT)) await H.sql(`update publicacoes set at=$2 where id=$1`, [id, at]); await H.sql(`set session_replication_role = origin`);
  for (const X of [A, A2, B, C, D]) await prep(X);

  /* ---------- 2. sem post triplo ---------- */
  ok(await tem(A, P.ped) === 1 && await tem(A, P.rpB) === 0 && await tem(A, P.rpC) === 0, '2: no Feed do Pedro, o post dele aparece uma vez (os dois reposts sem comentário não viram itens)');
  const l2 = await ev(A, id => { const e = document.getElementById('p-u:' + id); const l = e.querySelector(':scope>.dc122-rpl'); return { l: l && l.textContent.trim(), ico: !!(l && l.querySelector('svg')), antesPh: !!(l && l.nextElementSibling && l.nextElementSibling.matches('.ph')), rp: e.querySelector('.acts [data-vnrp] .cnt').textContent, baixo: e.querySelector('[data-vnrpq]') ? getComputedStyle(e.querySelector('[data-vnrpq]')).display : 'none' } }, P.ped);
  ok(l2.l === 'Carla e Bia repostaram' && l2.ico && l2.antesPh, '2: a linha "Carla e Bia repostaram" (o mais recente primeiro) fica em cima do nome', JSON.stringify(l2));
  ok(l2.rp === '3' && l2.baixo === 'none', '2: o número continua certo ("Repostar 3": Bia, Carla e a citação da Dani) e a linha de baixo não se repete', JSON.stringify(l2));
  const pos = await ev(A, ([id, q, o]) => { const ups = [...document.querySelectorAll('#posts > .upost:not(.fc107-junto)')].map(e => e.id); return { i: ups.indexOf('p-u:' + id), q: ups.indexOf('p-u:' + q), o: ups.indexOf('p-u:' + o), n: ups.length } }, [P.ped, P.qD, P.txt]);
  ok(pos.i === 0 && pos.q > pos.i && pos.o > pos.i, '2: o item fica na posição do repost mais recente (5 min: o primeiro post de amigo do Feed), não na do original (2 h)', JSON.stringify(pos));
  ok(await tem(A, P.qD) === 1 && await ev(A, id => /acordo não sai fácil/.test(document.getElementById('p-u:' + id).textContent) && !document.getElementById('p-u:' + id).querySelector('.dc122-rpl'), P.qD), '2: a citação da Dani (com comentário) continua um item à parte');
  const lB = await ev(B, id => (document.querySelector(`#posts [id="p-u:${id}"] .dc122-rpl`) || {}).textContent, P.ped);
  ok(await tem(B, P.ped) === 1 && await tem(B, P.rpB) === 0 && lB === 'Você e Carla repostaram', '2: no Feed da Bia (que repostou): uma vez, "Você e Carla repostaram"', lB);
  const nB = await ev(B, id => document.querySelector(`#posts [id="p-u:${id}"] .acts [data-vnrp] .cnt`).textContent, P.ped);
  ok(nB === '2', '2: para a Bia, que não é amiga da Dani: "Repostar 2"', nB);
  ok(await tem(A, P.velho) === 1 && await tem(A, P.rpVelho) === 0 && await ev(A, id => document.querySelector(`[id="p-u:${id}"] .dc122-rpl`)?.textContent.trim() === 'Carla repostou', P.velho), '2: post antigo (fora do Feed) repostado: o original aparece com "Carla repostou"');
  const nomes = await ev(A, u => { const f = '00000000-0000-4000-8000-0000000000e1'; S.membros[f] = { uid: f, nome: 'Eva Lima' }; try { return [dc122Quem([u.b]), dc122Quem([u.b, u.c]), dc122Quem([u.b, u.c, u.d]), dc122Quem([u.b, u.c, u.d, f]), dc122Quem([u.b, u.a])] } finally { delete S.membros[f] } }, ids);
  ok(nomes.join('|') === 'Bia repostou|Bia e Carla repostaram|Bia, Carla e Dani repostaram|Bia, Carla e mais 2 repostaram|Você e Bia repostaram', '2: "Bia repostou", "Bia e Carla repostaram", "Bia, Carla e Dani…", "Bia, Carla e mais 2 repostaram", "Você e Bia…"', nomes.join('|'));
  const atA = await ev(A, () => atItens().filter(x => x.acao === 'vnrp').map(x => x.txt.replace(/<[^>]+>/g, '')).sort());
  ok(atA.length === 3 && atA.filter(t => /^Bia Souza repostou sua publicação$/.test(t)).length === 1 && atA.some(t => /^Carla Mendes repostou sua publicação$/.test(t)) && atA.some(t => /^Dani Rocha repostou sua publicação: “Concordo/.test(t)), '2: Atividade do Pedro igual a antes (os três avisos)', JSON.stringify(atA));
  // perfil da Carla (visto pelo Pedro): o repost dela continua lá
  await ev(A, u => abrirPerfil(u), ids.c); await sleep(900);
  ok(await ev(A, id => !!document.querySelector(`#layer .pfv [id="p-u:${id}"]`), P.rpC), '2: no perfil da Carla, o repost dela continua (só o Feed junta)');
  await fecha(A);
  await mostra(A, P.ped, 'feed-repostaram', 70);

  /* ---------- 1. repost de original indisponível ---------- */
  await H.sql(`update publicacoes set arquivado=true where id=$1`, [P.arq]); await H.sql(`delete from publicacoes where id=$1`, [P.apg]);
  for (const X of [A, B, C]) { await ev(X, () => { PUB.sig = ''; VN112_Q.clear() }); await prep(X) }
  ok(await tem(A, P.rpArq) === 0 && await tem(A, P.rpApg) === 0, '1: no Feed do Pedro, os reposts sem comentário da Carla de posts arquivado e apagado somem');
  const qa = await ev(A, id => { const e = document.getElementById('p-u:' + id); return e ? e.textContent.replace(/\s+/g, ' ') : '' }, P.qArq);
  ok(/Comentário da Carla/.test(qa) && /Publicação indisponível/.test(qa), '1: a citação da Carla continua, com o comentário e o aviso "Publicação indisponível"', qa.slice(0, 160));
  ok(await tem(B, P.rpArq) === 0 && await tem(B, P.rpApg) === 0, '1: a Bia (autora) também não vê os reposts da Carla');
  const qc = await ev(C, ([a, b]) => [a, b].map(id => { const e = document.getElementById('p-u:' + id); return e ? (e.querySelector('.vn-q0') || {}).textContent || 'sem aviso' : '' }), [P.rpArq, P.rpApg]);
  ok(qc.every(t => /Publicação indisponível/.test(t)), '1: a Carla (quem repostou) continua vendo os dois no Feed dela, com "Publicação indisponível"', JSON.stringify(qc));
  await mostra(C, P.rpArq, 'repost-indisponivel-quem-repostou');
  await ev(C, () => { go('me'); PF_ABA = 'posts'; renderMe() }); await sleep(700);
  ok(await ev(C, ([a, b]) => !!document.querySelector(`#v-me [id="p-u:${a}"]`) && !!document.querySelector(`#v-me [id="p-u:${b}"]`), [P.rpArq, P.rpApg]), '1: e no perfil dela');
  await ev(C, () => go('feed'));
  await ev(A, u => abrirPerfil(u), ids.c); await sleep(900);
  const pfA = await ev(A, ([a, b, q]) => ({ a: !!document.querySelector(`#layer .pfv [id="p-u:${a}"]`), b: !!document.querySelector(`#layer .pfv [id="p-u:${b}"]`), q: !!document.querySelector(`#layer .pfv [id="p-u:${q}"]`) }), [P.rpArq, P.rpApg, P.qArq]);
  ok(!pfA.a && !pfA.b && pfA.q, '1: no perfil da Carla visto pelo Pedro, os reposts indisponíveis não aparecem (a citação sim)', JSON.stringify(pfA));
  await fecha(A);
  // amizade desfeita: a Bia repostou um post da Carla; o Pedro desfaz a amizade com a Carla
  ok(await tem(A, P.rpCarla) === 0 && await tem(A, P.carla) === 1, '1 (antes): o repost da Bia do post da Carla vira o próprio post da Carla no Feed do Pedro');

  /* ---------- 3, 4 e 5: cartão A ---------- */
  const estr = (Pg, sel) => ev(Pg, sel => { const a = document.querySelector(sel); if (!a) return null;
    const nm = k => k.matches('.ph') ? 'ph' : k.matches('.dc122-cab,.ac117-tx') ? 'cab' : k.matches('.dc122-corpo') ? 'tx' : k.matches('.dc122-fo') ? 'fo' : k.matches('.fs2-fio') ? 'fio' : k.matches('.car') ? 'midia' : k.matches('.vn-rpw') ? 'cit' : k.matches('.fs2-ctx') ? 'ctx' : k.matches('.gut') ? 'acoes' : '?' + k.className;
    const seq = [...a.children].filter(k => !k.matches('.fc107-gh,.dc122-rpl')).map(nm).join(',');
    const ph = a.querySelector(':scope>.ph'), b = ph && ph.querySelector('.ph-nm>b'), meta = ph && ph.querySelector('.ph-nm>.ph-sub'), av = ph && ph.querySelector('.up-au .av');
    const r = el => el.getBoundingClientRect(), ar = r(a);
    return { seq, hf: a.classList.contains('dc122-hf') || a.classList.contains('ac117-rel'), nome: b && b.textContent.trim(), meta: meta && meta.textContent.replace(/\s+/g, ' ').trim(), abaixo: !!(b && meta && r(meta).top >= r(b).bottom - 1),
      avW: av ? Math.round(r(av).width) : 0, kick: (a.querySelector(':scope>.dc122-cab>.cn102-lb, :scope>.ac117-tx>.cn102-lb') || {}).textContent || '', tit: (a.querySelector('.dc122-tit,.ac117-tit') || {}).textContent || '',
      nchk: /não checad/i.test(a.textContent), aspas: (() => { const t = a.querySelector(':scope>.dc122-corpo'); return t ? getComputedStyle(t, '::before').content : '' })(),
      dentro: [...a.querySelectorAll(':scope>*')].every(e => { const q = r(e); return !q.width || (q.left >= ar.left - 1 && q.right <= ar.right + 1) }) } }, sel);
  const ordemOk = s => /^ph(,cab)?(,tx)?(,fo)?(,fio)?(,midia)?(,cit)?(,ctx)?,acoes$/.test(s);
  const casos = [['Opinião (comentário sobre a notícia)', P.nt, 'Carla Mendes', ''], ['Análise', P.ana, 'Bia Souza', 'Análise'], ['Pergunta', P.enq, 'Bia Souza', 'Pergunta'], ['De perto', P.rel, 'Bia Souza', 'De perto'],
    ['Foto', P.foto, 'Bia Souza', ''], ['Texto', P.txt, 'Carla Mendes', ''], ['Fio', P.fio, 'Carla Mendes', ''], ['Citação', P.qRel, 'Carla Mendes', ''], ['Próprio post', P.ped, 'Pedro Brandão', ''], ['Citação da Dani', P.qD, 'Dani Rocha', '']];
  for (const [n, id, nome, kick] of casos) {
    const e = await estr(A, `#posts [id="p-u:${id}"]`);
    ok(e && e.hf && ordemOk(e.seq) && e.nome === nome && e.abaixo && e.avW >= 28, `4: ${n}: nome primeiro (bolinha ${e && e.avW}px), quando embaixo, depois texto, mídia, Contexto e ações`, JSON.stringify(e));
    ok(e && e.kick === kick && !e.nchk && (!e.aspas || e.aspas === 'none'), `4: ${n}: ${kick ? 'chapéu "' + kick + '"' : 'sem chapéu'}; sem aspa grande; sem "não checado"`, JSON.stringify(e));
  }
  const eAna = await estr(A, `#posts [id="p-u:${P.ana}"]`), eRel = await estr(A, `#posts [id="p-u:${P.rel}"]`), eFoto = await estr(A, `#posts [id="p-u:${P.foto}"]`);
  ok(eAna.tit === 'Juros altos por mais tempo' && /fo/.test(eAna.seq) && !/midia/.test(eAna.seq), '4: análise: título embaixo do chapéu, fonte depois do texto, sem o cartão colorido repetindo nome e título', JSON.stringify(eAna));
  ok(await ev(A, id => { const a = document.getElementById('p-u:' + id); const f = a.querySelector('.cn102-fonte'); return a.querySelectorAll('.cn102-fonte').length === 1 && /bcb\.gov\.br/.test(f.textContent) && !!(f.compareDocumentPosition(a.querySelector('.acts')) & Node.DOCUMENT_POSITION_FOLLOWING) && !a.querySelector('.cn102-ass') }, P.ana), '4: análise: "Fonte: bcb.gov.br" uma vez, antes das ações; sem a assinatura repetida');
  ok(/Tijuca, Rio de Janeiro/.test(eRel.meta) && /midia/.test(eRel.seq) && eRel.tit === 'Fila no posto', '4/5: De perto: quando e onde embaixo do nome, título e fotos', JSON.stringify(eRel));
  ok(/Arpoador/.test(eFoto.meta) && eFoto.seq === 'ph,tx,midia,acoes', '4: foto de amiga: nome, quando e onde; legenda; foto', JSON.stringify(eFoto));
  ok(await ev(A, id => { const a = document.getElementById('p-u:' + id); return !!a.querySelector('.vn-q .vn-q-au .av') && !!a.querySelector('.vn-q .vn-q-au b') }, P.qRel), '4: citação: o cartão citado mantém o cabeçalho compacto (bolinha e nome)');
  ok(await ev(A, id => getComputedStyle(document.querySelector(`[id="p-u:${id}"] .cn102-enq>.cn102-k`)).display === 'none', P.enq), '4: pergunta: a caixa de votação não repete "Pergunta de Bia"');
  ok(await ev(A, () => { const n = [...document.querySelectorAll('#posts > .post.vn-cn')]; return n.length > 5 && n.every(e => !e.classList.contains('dc122-hf') && !!e.querySelector(':scope>.vn-tit') && !e.querySelector('.dc122-meta')) }), '4: notícias (pautas) não mudam');
  ok(await ev(A, () => [...document.querySelectorAll('#posts > .upost')].every(e => e.classList.contains('dc122-hf') || e.classList.contains('ac117-rel'))), '4: todos os posts de amigo do Feed com o nome primeiro');
  // 3
  ok(await ev(A, () => !document.querySelector('.ac117-nchk') && ![...document.querySelectorAll('#posts .upost')].some(e => /não checad/i.test(e.textContent))), '3: sem "Relato pessoal, não checado pela redação do Prumo"');
  // 5
  const r5 = await ev(A, id => { const a = document.getElementById('p-u:' + id); return { lb: a.querySelector('.cn102-lb-rel').textContent, q: [...document.querySelectorAll('#posts .vn-q .vn-q-k')].map(e => e.textContent.trim()), feed: [...document.querySelectorAll('#posts .upost')].some(e => /\bRelato\b/.test(e.innerText)) } }, P.rel);
  ok(r5.lb === 'De perto' && r5.q.includes('De perto') && !r5.q.includes('Relato') && !r5.feed, '5: "De perto" no selo do post e no cartão citado; nenhum "Relato" nos posts do Feed', JSON.stringify(r5));
  const r5b = await ev(A, () => ({ ks: CN102_KS.find(k => k[0] === 'rel')[1], nome: CN102_NOME.rel, st: FC105_KS.map(k => k[1]).join(), pk: FC107_PK.map(k => k[1]).join(), kick: cn102Kick('rel', S.uid), sk: fc105Kicker({ k: 'rel' }) }));
  ok(r5b.ks === 'De perto' && r5b.nome === 'De perto' && r5b.st === 'Opinião,Análise,De perto,Citação' && /De perto/.test(r5b.pk) && !/Relato/.test(r5b.pk) && r5b.kick === 'De perto · Pedro Brandão' && r5b.sk === 'De perto · Pedro Brandão', '5: nomes na criação, no cartão do giro e nas contribuições do perfil', JSON.stringify(r5b));
  const at5 = await ev(B, id => atPubNome(pubDe(id)), P.rel);
  ok(at5 === 'seu post De perto “Fila no posto”', '5: Atividade da Bia: "seu post De perto “Fila no posto”"', at5);
  await ev(A, u => abrirPerfil(u), ids.b); await sleep(900);
  const ch = await ev(A, () => [...document.querySelectorAll('#layer .fc107-pk button')].map(b => b.textContent.trim()).join('|'));
  ok(/De perto 1/.test(ch) && !/Relato/.test(ch), '5: perfil da Bia: chip "De perto 1"', ch);
  await fecha(A);
  // criação
  await ev(A, () => cn102Comeca('rel')); await sleep(900);
  const cr = await ev(A, () => ({ h: document.querySelector('#layer .ce-ph b')?.textContent, tab: document.querySelector('#layer [data-cn102k="rel"]')?.textContent.trim(), av: document.querySelector('#layer .cn102-aviso')?.textContent, tx: document.querySelector('#layer')?.innerText || '' }));
  ok(cr.h === 'De perto' && cr.tab === 'De perto' && /^Aparece como “De perto · Pedro”/.test(cr.av || '') && !/\bRelato\b/.test(cr.tx), '5: criação: cabeçalho, aba e aviso dizem "De perto"', JSON.stringify({ ...cr, tx: cr.tx.slice(0, 200) }));
  await A.screenshot({ path: path.join(QA, 'criacao-de-perto.png') });
  ok(await ev(A, () => cn102Valida({ cn: { k: 'rel', tit: '', corpo: '', o: [] } }) === 'Dê um título curto ao que você viu.'), '5: aviso de título vazio sem "relato"');
  await ev(A, () => { ED = null }); await fecha(A); await ev(A, () => go('feed'));

  /* ---------- larguras, tema, capturas ---------- */
  await prep(A);
  for (const w of [360, 390, 430]) {
    await A.setViewportSize({ width: w, height: 844 }); await sleep(400);
    const l = await ev(A, () => [...document.querySelectorAll('#posts .upost')].map(a => { const ar = a.getBoundingClientRect(); const fora = [...a.querySelectorAll('.ph .ph-nm>*,.dc122-cab>*,:scope>.dc122-corpo,.dc122-rpl,.car,.vn-rpw')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > ar.right + 1 || r.left < ar.left - 1) }).length;
      const b = a.querySelector('.ph-nm>b'); return fora + (b && b.scrollWidth > b.clientWidth + 1 ? 1 : 0) }));
    const vz = await ev(A, () => document.scrollingElement.scrollWidth - innerWidth);
    ok(vz <= 0 && l.length > 8 && l.every(n => n === 0), `${w}px: nada passa da borda nos posts e o nome não corta`, JSON.stringify({ vz, l }));
  }
  await A.setViewportSize({ width: 390, height: 844 }); await sleep(300); await prep(A);
  await mostra(A, P.nt, 'opiniao-comentario-noticia', 110); await mostra(A, P.ana, 'analise'); await mostra(A, P.enq, 'pergunta'); await mostra(A, P.foto, 'foto');
  await mostra(A, P.rel, 'de-perto'); await mostra(A, P.txt, 'texto'); await mostra(A, P.fio, 'fio'); await mostra(A, P.qRel, 'citacao');
  // escuro (segundo aparelho do Pedro)
  await prep(A2);
  ok(await ev(A2, id => { const a = document.getElementById('p-u:' + id); const lum = s => { const v = s.match(/[\d.]+/g).slice(0, 3).map(Number); return (v[0] * 299 + v[1] * 587 + v[2] * 114) / 1000 };
    return lum(getComputedStyle(a.querySelector('.ph-nm>b')).color) > 150 && lum(getComputedStyle(a.querySelector('.dc122-meta')).color) > 80 && lum(getComputedStyle(a.querySelector('.dc122-rpl')).color) > 80 && lum(getComputedStyle(document.body).backgroundColor) < 80 }, P.ped), 'escuro: nome claro, quando/onde e "repostaram" legíveis, fundo escuro');
  await mostra(A2, P.ped, 'escuro-feed-repostaram', 70); await mostra(A2, P.ana, 'escuro-analise');

  /* ---------- 1 (fim): amizade desfeita ---------- */
  await ev(A, u => desfazerAmizade(u), ids.c); await sleep(1200); await prep(A);
  ok(await tem(A, P.carla) === 0 && await tem(A, P.rpCarla) === 0, '1: depois de desfazer a amizade com a Carla, o repost da Bia do post dela some do Feed do Pedro');
  await prep(B);
  ok(await tem(B, P.carla) === 1, '1: a Bia (amiga da Carla) continua vendo o post');

  const errs = [A, A2, B, C, D].flatMap(p => p._erros);
  ok(!errs.length, 'sem erros no console', JSON.stringify(errs.slice(0, 5)));
  const r = U.resumo(); r.RES.filter(x => /^FAIL/.test(x)).forEach(x => console.log(x.slice(0, 900))); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(r.FALHAS ? 1 : 0)
})().catch(e => { console.error(e); if (srv) srv.kill(); process.exit(1) });
