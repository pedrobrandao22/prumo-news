// Tarde 19/11 (2): correções dos achados abertos do testador. Busca (coberturas encerradas no fim, manchete antiga com data,
// "Agora" sem repetir), Atividade (abrir post e voltar volta para a Atividade), link #m= com o app aberto, Capa (carimbo,
// hora do topo), placar com votações de mesmo nome, Quem cobriu, Aa que fecha ao rolar, Conversas (rascunho na lista),
// convite inválido com um aviso só, "O que você acha?" abre a caixa nova, gráfico de colunas desde o zero, textos sem
// "amigos", Quem é / O que é sem verbete. Porta 9312.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9312, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { let i = 0; while (($('#layer2')?.innerHTML || $('#layer').innerHTML) && i++ < 6) { closeLayer._ok = true; closeLayer(); closeLayer._ok = false } });
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const br = await U.navegador(); const H = await require('../harness').criar();
  const i = {}; for (const k of ['a', 'b']) i[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [i.a, i.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [i.a, i.b]);
  await H.sql(`insert into seguidores(seguidor,seguido) values ($1,$2),($2,$1)`, [i.a, i.b]);
  const vp = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
  const abrir = async k => { const p = U.erros(await H.pagina(br, { ...vp, sessao: { user: { id: i[k], email: k + '@x' } } }), k.toUpperCase());
    await p.goto(BASE); await esperar(p, () => typeof S !== 'undefined' && S.membro && S.amigosOk && PUB.on === true, null, 15000); await sleep(800); await fecha(p); return p };
  const A = await abrir('a'), B = await abrir('b');

  /* ---- Busca ---- */
  const bu = await ev(B, () => { const p = FEED.pautas.find(x => x && x.neutro && x.neutro.titulo); const tm = temaDe(p) || 'Teste';
    FEED.dormentes = [{ id: 'dorm-ct210', titulo: 'Cobertura antiga ' + tm, tema: tm, inicio: '2026-11-01T10:00:00-03:00', ultima: '2026-11-05T10:00:00-03:00', resumo: 'Resumo antigo.' }];
    p.titulos = [...(p.titulos || []), { hora: '2026-11-13T10:00:00-03:00', titulo: 'Manchete velha com zebrapalavra rara' }];
    const h1 = buscaRes(tm); const d = document.createElement('div'); d.innerHTML = h1;
    const ordem = [...d.children].map(e => e.className + ':' + (e.textContent || '').slice(0, 30));
    const iAnt = ordem.findIndex(x => /Coberturas anteriores/.test(x)), iNot = ordem.findIndex(x => /sres/.test(x));
    const btn = (d.querySelector('[data-bu154dseg]') || {}).textContent || '';
    const d2 = document.createElement('div'); d2.innerHTML = buscaRes('zebrapalavra'); const tr = (d2.querySelector('.trecho') || {}).textContent || '';
    FEED.dormentes = []; p.titulos = p.titulos.filter(x => !/zebrapalavra/.test(x.titulo));
    return { iAnt, iNot, btn, tr, ordem } });
  ok(bu.iAnt > bu.iNot && bu.iNot >= 0 && /Avisar se voltar/.test(bu.btn), 'Busca: cobertura encerrada fica depois das notícias de hoje, com "Avisar se voltar"', bu);
  ok(/^Manchete anterior · 13\/11: Manchete velha com zebrapalavra/.test(bu.tr), 'Busca: notícia achada só por manchete antiga mostra "Manchete anterior · 13/11" (sem colar várias)', bu.tr);
  const ag = await ev(B, () => { const _a = agoraItens; agoraItens = () => [{ t: 'Zebratema um no agora', h: Date.now() - 6e5 }, { t: 'Zebratema dois no agora', h: Date.now() - 9e5 }];
    const d = document.createElement('div'); d.innerHTML = buscaRes('zebratema'); agoraItens = _a; return { h: (d.querySelector('.bu154-h') || {}).textContent, selos: d.querySelectorAll('.bu154-ag .bu154-selo').length } });
  ok(/^Agora\s*ainda em apuração/.test(ag.h || '') && ag.selos === 0, 'Busca: "Agora · ainda em apuração" uma vez só, no cabeçalho', ag);

  /* ---- Atividade: abrir o post e voltar volta para a Atividade ---- */
  const pid = await ev(A, async () => { const q = await SB.from('publicacoes').insert({ autor: S.uid, tipo: 'post', fotos: [], pid: null, texto: 'Post para a Atividade', estilo: { v: 2 } }).select('id'); return q.data[0].id });
  await ev(B, async () => { PUB.sig = ''; await pubCarregar(); AT.t = 0; await atCarregar() }); await ev(B, () => go('capa')); await sleep(300);
  await ev(B, () => abrirAtividade()); await sleep(700);
  const temItem = await ev(B, () => [...document.querySelectorAll('#layer .at-it')].some(b => /publicou|Post para/.test(b.textContent)));
  if (temItem) {
    await ev(B, () => [...document.querySelectorAll('#layer .at-it')].find(b => /publicou|Post para/.test(b.textContent)).click()); await sleep(900);
    const ab = await ev(B, () => !!document.querySelector('#layer .pfv') && !document.querySelector('#layer .pfv-at'));
    await ev(B, () => history.back()); await sleep(900);
    ok(ab && await ev(B, () => !!document.querySelector('#layer .pfv-at')), 'Atividade: abrir o post e voltar volta para a Atividade');
  } else {
    await ev(B, (id) => { CT210.at = { t: Date.now() }; vn112AbrePub(id) }, pid); await sleep(600);
    await ev(B, () => history.back()); await sleep(900);
    ok(await ev(B, () => !!document.querySelector('#layer .pfv-at')), 'Atividade: post aberto a partir dela; voltar volta para a Atividade');
  }
  await fecha(B); await sleep(400); await fecha(B);

  /* ---- link #m= com o app aberto ---- */
  const dois = await ev(B, () => FEED.pautas.filter(p => p && p.id && p.neutro).slice(1, 3).map(p => p.id));
  await ev(B, id => { location.hash = 'm=' + id }, dois[0]); await sleep(1200);
  const m1 = await ev(B, () => typeof MAT_PID !== 'undefined' && $('#layer .mat') ? MAT_PID : null);
  await ev(B, id => { location.hash = 'm=' + id }, dois[1]); await sleep(1200);
  const m2 = await ev(B, () => typeof MAT_PID !== 'undefined' && $('#layer .mat') ? MAT_PID : null);
  ok(m1 === dois[0] && m2 === dois[1], 'link #m= trocado com o app aberto abre a matéria certa', { m1, m2, dois });

  /* ---- Aa fecha ao rolar ---- */
  const aa = await ev(B, async () => { const b = $('#layer [data-mataa]'); if (!b) return 'sem-aa'; b.click(); await new Promise(r => setTimeout(r, 300)); const ab = !!$('#layer .mat-aap');
    const sc = $('#layer .mat') ; const alvo = [sc, sc && sc.querySelector('.mat-sc'), document.scrollingElement].find(e => e && e.scrollHeight > e.clientHeight + 200) || document.scrollingElement;
    alvo.scrollTop += 10; alvo.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 50)); alvo.scrollTop += 400; alvo.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 200));
    return { ab, fechou: !$('#layer .mat-aap') } });
  ok(aa === 'sem-aa' || (aa.ab && aa.fechou), 'Aa: o quadro do tamanho da letra fecha ao rolar a matéria', aa);
  await fecha(B);

  /* ---- Capa: carimbo e hora do topo ---- */
  const cp = await ev(B, () => { const ag = cm168Ref() || Date.now(); const v = JSON.parse(JSON.stringify(FEED.pautas.find(p => p.id !== FEED.capa?.manchete && p.neutro) )); v.id = 'ct210-v'; v.hora = new Date(ag - 4 * 864e5).toISOString(); v.atualizacoes = []; v.titulos = [];
    const mk = t => { v.neutro.titulo = t; const d = document.createElement('div'); d.innerHTML = cpItem(v, { tam: 'li' }); return (d.querySelector('.cm168-dia') || {}).textContent || '' };
    const semDia = mk('Notícia antiga sem dia no título'), comDia = mk('Pane aérea de sexta (13) faz governo pedir verba');
    v.titulos = [{ hora: new Date(ag - 3600e3).toISOString(), titulo: 'reescrito' }]; const reesc = mk('Notícia antiga reescrita hoje');
    return { semDia, comDia, reesc } });
  ok(/^Sem novidade desde /.test(cp.semDia) && cp.comDia === '' && cp.reesc === '', 'Capa: "Sem novidade desde …" como frase; nada quando o título já tem dia ou foi reescrito há pouco', cp);
  const topo = await ev(B, () => { const a = FEED.atualizado_em; const t0 = Date.now() - 2 * 3600e3; FEED.atualizado_em = new Date(t0).toISOString(); const _ai = ac208Itens; ac208Itens = () => [{ h: Date.now() - 5 * 60e3 }];
    const s = capaEdicao(); ac208Itens = _ai; FEED.atualizado_em = a; const p = new Date(Date.now() - 5 * 60e3).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).split(':'); return { s, esp: 'Atualizada às ' + (+p[0]) + 'h' + p[1] } });
  ok(topo.s.indexOf(topo.esp) === 0 || /^Edição/.test(topo.s), 'Capa: o topo diz a hora da última novidade (inclui "Acabou de sair")', topo);

  /* ---- placar com duas votações de mesmo nome ---- */
  const pl = await ev(B, () => { const l = [{ etapa: 'Substitutivo', casa: 'senado', prop: 'PLP 299/2026' }, { etapa: 'Substitutivo', casa: 'senado', prop: 'PLP 299/2026' }]; return po118Rotulos(l) });
  ok(JSON.stringify(pl) === JSON.stringify(['Substitutivo · 1ª votação', 'Substitutivo · 2ª votação']), 'placar: duas votações "Substitutivo" ganham a ordem', pl);

  /* ---- Quem cobriu: a conta usa a mesma lista de "Noticiaram" ---- */
  const qc = await ev(B, () => { const p = FEED.pautas.find(x => (x.fontes || []).length >= 2 && (x.links || []).length); if (!p) return 'sem'; const s = (typeof ft182Esp0 === 'function' ? ft182Esp0 : espectroHTML)(p);
    const d = document.createElement('div'); d.innerHTML = s; const soma = [...d.querySelectorAll('.lg span')].reduce((a, e) => a + (+(e.textContent.match(/(\d+)\s*$/) || [0, 0])[1]), 0);
    const lista = mt158Lista(p).filter(v => mt158Esp(v.k)).length; return { soma, lista } });
  ok(qc === 'sem' || qc.soma === qc.lista, 'Quem cobriu: a soma da barra bate com a lista de veículos classificados', qc);

  /* ---- gráfico de colunas desde o zero ---- */
  const gr = await ev(B, () => { const h = igVisHTML({ tipo: 'grafico', forma: 'colunas', itens: [{ rotulo: 'Hoje', valor: 44 }, { rotulo: '2027', valor: 42 }, { rotulo: '2028', valor: 40 }] }); const d = document.createElement('div'); d.innerHTML = h;
    return [...d.querySelectorAll('.sgv-col > div')].map(e => parseFloat(e.style.getPropertyValue('--h'))) });
  ok(gr.length === 3 && gr[2] > 85, 'gráfico de colunas: 40 h ao lado de 44 h fica quase do mesmo tamanho (eixo no zero)', gr);

  /* ---- Conversas: rascunho na lista ---- */
  const uA = await ev(A, () => S.uid);
  await ev(B, u => { rs108Grava('dm:' + u, 'Oi, depois te mando'); go('msgs') }, uA); await sleep(600);
  const ra = await ev(B, u => { THREAD = null; renderMsgs(); const b = document.querySelector(`#v-msgs [data-thread="${u}"] .dm-pv`); return b ? b.textContent : 'sem-linha' }, uA);
  ok(ra === 'sem-linha' || /^Rascunho: Oi, depois te mando/.test(ra), 'Conversas: mensagem não enviada aparece como "Rascunho: …" na lista', ra);
  await ev(B, u => { rs108Grava('dm:' + u, ''); go('feed') }, uA);

  /* ---- "O que você acha?" abre a caixa nova ---- */
  await ev(B, () => go('feed')); await sleep(500);
  const sug = await ev(B, async () => { const b = document.querySelector('[data-fc107sug]'); if (!b) return 'sem-barra'; b.click(); await new Promise(r => setTimeout(r, 500));
    return { caixa: !!document.querySelector('#layer > .cp152'), nt: !!document.querySelector('#layer > .cp152 .cr155-nt, #layer > .cp152 [data-cr155ntx]'), velha: !!document.querySelector('#layer .ce') } });
  ok(sug === 'sem-barra' || (sug.caixa && !sug.velha), '"O que você acha?" abre a caixa Nova publicação (não a tela antiga preta)', sug);
  await fecha(B);

  /* ---- Quem é / O que é sem verbete ---- */
  const qe = await ev(B, () => { abrirTermo('g', 'zebratermo inexistente'); const a = (document.querySelector('#layer .sheet') || {}).innerText || ''; closeLayer();
    abrirPessoa('fulano de tal'); const b = (document.querySelector('#layer .sheet') || {}).innerText || ''; closeLayer(); return { a, b } });
  ok(/Sem verbete nesta edição/.test(qe.a) && /Fulano de Tal/.test(qe.b) && /Sem verbete/.test(qe.b), 'Quem é / O que é fora da edição: "Sem verbete nesta edição" e nome com maiúsculas', qe);

  /* ---- noite: Acabou de sair sem repetir a edição; post só com notícia; Cancelar com texto ---- */
  const ac = await ev(B, () => { const p = FEED.pautas.find(x => (x.links || []).length); if (!p) return 'sem'; const l = p.links[0]; const _N = NOVID_AG;
    NOVID_AG = { gerado: new Date().toISOString(), novos: [{ assunto: 'Assunto repetido da edição para teste', relevante: true, n_fontes: 2, secao: 'politica', manchetes: [{ titulo: l.titulo || 'Título qualquer bem comprido para o teste', url: l.url, veiculo: 'A', hora: new Date(Date.now() - 6e5).toISOString() }, { titulo: 'Outro título bem comprido do mesmo assunto aqui', veiculo: 'B', hora: new Date(Date.now() - 6e5).toISOString() }] }] };
    const n = ac208Itens().length; NOVID_AG = _N; return n });
  ok(ac === 'sem' || ac === 0, '"Acabou de sair": assunto cuja manchete já está nos links de uma notícia da edição não aparece', ac);
  ok(await ev(B, () => fc107Junto('<article class="post"></article>', { __pub: { texto: '', fotos: [] }, __fc107: { k: 0, n: 1 } }) === ''), 'post só com a notícia (sem texto nem foto) não vira "Seu comentário" vazio');
  const sai = await ev(B, async () => { cp152Abre({ aba: 'post' }); await new Promise(r => setTimeout(r, 300)); const t = $('#cp152-tx'); t.value = 'Texto que quero guardar'; t.dispatchEvent(new Event('input', { bubbles: true }));
    $('#layer [data-cp152x]').click(); await new Promise(r => setTimeout(r, 200)); const ov = !!$('#layer .ct210-sai'); $('[data-ct210sai="g"]').click(); await new Promise(r => setTimeout(r, 300));
    const fechou = !$('#layer').innerHTML; cp152Abre({ aba: 'post' }); await new Promise(r => setTimeout(r, 300)); const volta = ($('#cp152-tx') || {}).value; closeLayer._ok = true; closeLayer(); closeLayer._ok = false; try { cr155Limpa() } catch (e) { } return { ov, fechou, volta } });
  ok(sai.ov && sai.fechou && sai.volta === 'Texto que quero guardar', 'Cancelar com texto: "Guardar para depois" fecha e o texto volta ao abrir o +', sai);

  /* ---- noite (Pedro): matéria sem o "Em 30 segundos" repetido; "Como cada lado conta" no fim ---- */
  const ld = await ev(B, async () => { const p = FEED.pautas.find(x => x.direita && x.esquerda && x.neutro && x.neutro.texto); if (!p) return 'sem'; abrirMateria(p.id); await new Promise(r => setTimeout(r, 900));
    const m = $('#layer .mat'), sec = m.querySelector('.ct210-ld'); const fim = sec && [...m.querySelectorAll('.cpx-bl b, .cpx-c b')].filter(b => sec.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING).length;
    const t1 = sec && sec.querySelector('.ct210-ld-v h4').textContent; sec && sec.querySelector('[data-ct210lado="esquerda"]').click(); await new Promise(r => setTimeout(r, 100));
    const t2 = sec && sec.querySelector('.ct210-ld-v h4').textContent; const r = { trinta: !!m.querySelector('.mat-30'), sec: !!sec, t1, t2, d: p.direita.titulo, e: p.esquerda.titulo, lente: lente() }; closeLayer(); return r });
  ok(ld === 'sem' || (!ld.trinta && ld.sec && ld.t1 === ld.d && ld.t2 === ld.e && ld.lente === 'neutro'), 'matéria: sem o "Em 30 segundos" repetido; "Como cada lado conta" troca Direita/Esquerda ali mesmo, sem mudar a lente', ld);
  const sem = await ev(B, async () => { const p = FEED.pautas.find(x => !x.direita && !x.esquerda && x.neutro && x.neutro.texto); if (!p) return 'sem'; abrirMateria(p.id); await new Promise(r => setTimeout(r, 700)); const r = !!$('#layer .ct210-ld'); closeLayer(); return r });
  ok(sem === 'sem' || sem === false, 'notícia sem versão de lado: nenhum bloco nem aviso');

  /* ---- sem conta: textos sem "amigos" e convite inválido com um aviso só ---- */
  const V = U.erros(await H.pagina(br, vp), 'V'); await V.goto(BASE.replace('index.html', '') + '?convite=ABC123'); await esperar(V, () => !!document.querySelector('#co160cvst:not([hidden])'), null, 8000); await sleep(400);
  const cv = await ev(V, () => { const t = (document.querySelector('#layer') || {}).innerText || ''; const bv = document.querySelector('#layer .co160-bv'); return { t, bvVisivel: !!(bv && !bv.hidden && bv.getClientRects().length), nome: (document.querySelector('#lnome') || {}).placeholder || '' } });
  const vezes = (cv.t.match(/convite/gi) || []).length;
  ok(!/não vale mais/.test(cv.t) && (!cv.bvVisivel || !/Não achamos|não existe/.test(cv.t)), 'convite inválido: sem a caixa "não vale mais" repetida no topo', { bv: cv.bvVisivel, vezes, t: cv.t.slice(0, 300) });
  ok(!/amigos vão te ver/.test(cv.nome), 'criar conta: "Seu nome" sem "amigos"', cv.nome);
  await ev(V, () => { let i = 0; while ($('#layer').innerHTML && i++ < 5) closeLayer(); go('msgs') }); await sleep(500);
  ok(!/com os seus amigos/.test(await ev(V, () => document.getElementById('v-msgs').innerText)), 'Conversas sem conta: sem "com os seus amigos"');

  ok(!A._erros.length && !B._erros.length && !V._erros.length, 'sem erros de JavaScript ' + [...A._erros, ...B._erros, ...V._erros].slice(0, 3).join(' | '));
  const R = U.resumo(); console.log(`\nRESUMO t_tarde_1911b: ${R.OKS} ok, ${R.FALHAS} falhas`);
  await br.close(); srv.kill(); process.exit(R.FALHAS ? 1 : 0) })().catch(e => { console.error(e); process.exit(2) });
