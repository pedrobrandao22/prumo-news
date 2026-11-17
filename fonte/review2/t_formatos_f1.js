// Fase 1, formatos (182, 17/11): Quiz, Enquete, Número, De perto e criar Giro escondidos atrás de FT182_ESCONDE (posts antigos
// viram post comum; giro de quem já postou continua); "Em 5 min"/"Em 30 segundos" viram o "Em 1 min" no alto da Capa;
// "Quem noticiou" vira uma linha na matéria que abre a lista, e a barra de espectro sai do cartão do Feed.
// iPhone 13 e iPhone SE. Portas 9020 (site).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:9020/index.html';
const ev = (p, fn, a) => p.evaluate(fn, a);
const SEM = /\b(Quiz|Enquetes?|enquetes?|De perto|Em 5 min|Em 30 segundos|5 minutos)\b/;
(async () => {
  U.feedFresco('site'); U.servir('site', 9020); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const exp = Date.now() + 20 * 3600e3;
  // giro antigo do Pedro (feito antes de esconder a criação) e posts antigos da Bia: enquete, número e De perto
  await H.comoUsuario(ids.a, () => H.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico,expira) values ($1,'story',$2,'[]',$3,'amigos',$4)`, [ids.a, 'Meu giro de ontem', { v: 2, fundo: 3 }, exp]));
  const post = (txt, cn) => H.comoUsuario(ids.b, () => H.db.query(`insert into public.publicacoes(autor,tipo,texto,fotos,estilo,publico) values ($1,'post',$2,'[]',$3,'amigos')`, [ids.b, txt, { cn }]));
  await post('O Senado aprova hoje?', { v: 1, k: 'enq', tit: 'O Senado aprova hoje?', o: ['Sim', 'Não'] });
  await post('Selic segue alta\n\nO juro real é o maior em anos.', { v: 1, k: 'ana', tit: 'Selic segue alta', d: { tipo: 'ind', tit: 'Selic', ind: 'selic', val: '15' } });
  await post('Fila no posto\n\nTrês quarteirões de fila.', { v: 1, k: 'rel', tit: 'Fila no posto', q: '2026-11-16T09:00' });
  const b = await U.navegador();
  for (const dev of [{ nome: 'iPhone 13', w: 390, h: 844 }, { nome: 'iPhone SE', w: 375, h: 667 }]) {
    const se = dev.nome === 'iPhone SE', tag = se ? ' [SE]' : '';
    const P = U.erros(await H.pagina(b, { sessao: { user: { id: ids.a, email: 'a@x' } }, viewport: { width: dev.w, height: dev.h }, ctx: { deviceScaleFactor: 2, isMobile: true, hasTouch: true } }), 'P' + tag);
    await P.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
    await P.goto(BASE); await esperar(P, () => typeof VIEW !== 'undefined' && !!FEED && S.membro && PUB.on === true && document.querySelector('#v-capa .cpi'), null, 20000);
    await ev(P, () => { try { closeLayer() } catch (e) {} go('capa'); scrollTo(0, 0) }); await sleep(700);

    // interruptor
    ok(await ev(P, () => JSON.stringify(FT182_ESCONDE) === '["quiz","enquete","numero","deperto","giro"]' && document.documentElement.classList.contains('ft182-sem-giro')), 'um interruptor só: FT182_ESCONDE com os 5 formatos' + tag);

    // 2. Em 1 min no alto da Capa
    const um = await ev(P, () => { const s = [...document.querySelectorAll('#v-capa .cp-1m')]; const m = s[0]; const man = document.querySelector('#v-capa .cpi-man');
      return { n: s.length, tit: m && m.querySelector('h3 span').textContent, itens: m ? m.querySelectorAll('li').length : 0, antes: !!(m && man && (m.compareDocumentPosition(man) & Node.DOCUMENT_POSITION_FOLLOWING)) } });
    ok(um.n === 1 && um.tit === 'Em 1 min' && um.itens >= 3 && um.itens <= 5 && um.antes, '"Em 1 min" único, com até 5 tópicos, antes da manchete' + tag, JSON.stringify(um));
    const um6 = await ev(P, () => { const ps = FEED.pautas.slice(0, 6); FEED.resumo_dia = { itens: ps.map((p, i) => ({ pid: p.id, texto: 'Tópico curto ' + (i + 1) })) }; renderCapa(); const li = [...document.querySelectorAll('#v-capa .cp-1m li')].map(l => l.textContent); delete FEED.resumo_dia; return li });
    ok(um6.length === 5 && um6[0] === 'Tópico curto 1', '"Em 1 min" usa o resumo do dia e corta em 5' + tag, JSON.stringify(um6));
    await ev(P, () => renderCapa()); await sleep(200);
    await ev(P, () => document.querySelector('#v-capa .cp-1m [data-cp1m]').click()); await sleep(500);
    ok(await ev(P, () => !!document.querySelector('#layer .mat')), 'tocar num tópico abre a matéria' + tag);
    await ev(P, () => closeLayer()); await sleep(300);
    await ev(P, () => document.querySelector('#v-capa .cpi-man [data-cpx]').click()); await sleep(400);
    const capaTx = await ev(P, () => document.querySelector('#v-capa').innerText);
    ok(!SEM.test(capaTx), 'Capa sem Quiz, Enquete, De perto, "Em 5 min" nem "Em 30 segundos"' + tag, (capaTx.match(SEM) || [])[0]);
    ok(await ev(P, () => !document.querySelector('#v-capa .cp-int') && !FEED.quiz.length && !FEED.pautas.some(p => p.enquete)), 'edição sem quiz e sem enquetes; sem o cartão do Quiz do dia' + tag);
    if (!se) await U.foto(P, 'formatos-capa');
    await ev(P, () => { go('play') }); await sleep(300);
    ok(await ev(P, () => VIEW === 'capa'), '"Quiz e enquetes" não abre (volta para a Capa)' + tag);

    // 3. Quem noticiou: uma linha na matéria
    const pid = await ev(P, () => FEED.pautas.find(p => mt158Lista(p).length >= 2).id);
    await ev(P, id => abrirMateria(id), pid); await sleep(500);
    const qn = await ev(P, () => { const b = document.querySelector('#layer .mat .ft182-qn'); return { tx: b && b.textContent, rod: !!document.querySelector('#layer .mat-rod [data-cpfontes]'), r: b && b.getBoundingClientRect().height, tx30: document.querySelector('#layer .mat-30>b')?.textContent } });
    ok(qn.tx && /^Noticiado por \d+ veículos( · (só da esquerda|só da direita|só do centro|só veículos públicos|da esquerda ao centro|da esquerda à direita|do centro à direita))?›$/.test(qn.tx) && !qn.rod && qn.r < 40, 'matéria: uma linha "Noticiado por N veículos · …" (e sai o botão do rodapé)' + tag, JSON.stringify(qn));
    ok(qn.tx30 === 'Resumo', 'matéria: "Em 30 segundos" vira "Resumo"' + tag, qn.tx30);
    if (!se) { await ev(P, () => document.querySelector('#layer .ft182-qn').scrollIntoView({ block: 'center' })); await U.foto(P, 'formatos-materia-linha') }
    await ev(P, () => document.querySelector('#layer .ft182-qn').click()); await sleep(500);
    const fl = await ev(P, () => { const s = document.querySelector('.sheet'); return s && { tit: s.querySelector('.sh-h')?.textContent || '', spec: !!s.querySelector('.ft182-sp .spec'), n: s.querySelectorAll('.cvl li').length } });
    ok(fl && /Quem noticiou/.test(fl.tit) && fl.spec, 'tocar na linha abre a lista completa, com a barra do espectro' + tag, JSON.stringify(fl));
    if (!se) await U.foto(P, 'formatos-quem-noticiou');
    await ev(P, () => { closeLayer(); closeLayer() }); await sleep(300);
    const fx = await ev(P, () => [ft182Faixa(['esquerda', 'direita', 'centro']), ft182Faixa(['esquerda', 'esquerda']), ft182Faixa(['centro', 'direita']), ft182Faixa(['esquerda', 'publica']), ft182Faixa(['direita']), ft182Faixa(['publica', 'publica']), ft182Faixa(['centro', 'publica'])]);
    ok(JSON.stringify(fx) === JSON.stringify(['da esquerda à direita', 'só da esquerda', 'do centro à direita', 'da esquerda ao centro', '', 'só veículos públicos', 'só do centro']), 'o trecho do espectro resume a distribuição' + tag, JSON.stringify(fx));

    // Feed: sem barra de espectro, sem enquete, sem "Em 5 min"; giro de notícia e o meu giro continuam
    await ev(P, () => { go('feed'); scrollTo(0, 0) }); await sleep(1200);
    const fd = await ev(P, () => { const vis = s => [...document.querySelectorAll(s)].filter(e => e.getClientRects().length && getComputedStyle(e).display !== 'none').length;
      return { spec: document.querySelectorAll('#posts .spec').length, voto: document.querySelectorAll('#posts .post [data-voto]').length, cinco: vis('#secs [data-5min]'), criar: vis('#secs [data-meustory][aria-label="Criar giro"],#secs [data-criarde]'), meu: vis('#secs [data-meustory][aria-label="Seu giro"]'), sec: vis('#secs [data-sec-story]') } });
    ok(fd.spec === 0 && fd.voto === 0 && fd.cinco === 0, 'Feed: sem barra de espectro, sem enquete e sem "Em 5 min"' + tag, JSON.stringify(fd));
    ok(fd.meu === 1 && fd.criar === 0 && fd.sec > 0, 'Feed: "Seu giro" (já postado) e os giros de notícia continuam; nada de criar giro' + tag, JSON.stringify(fd));
    if (!se) await U.foto(P, 'formatos-feed');
    await ev(P, () => document.querySelector('#secs [data-meustory]').click()); await sleep(700);
    ok(await ev(P, () => !!document.querySelector('#layer .story.sg-user') && /Giro de Pedro/.test(document.querySelector('#layer .story').getAttribute('aria-label'))), 'o giro de quem já postou abre normalmente' + tag);
    await ev(P, () => closeLayer()); await sleep(400);
    await ev(P, () => criarAbrir('story')); await sleep(300);
    ok(await ev(P, () => !document.querySelector('#layer .ce') && !(typeof ED !== 'undefined' && ED && ED.modo === 'story')), 'nenhum caminho abre o editor de giro' + tag);
    // posts antigos da Bia: aparecem como post comum (o Feed desenha em lotes ao rolar)
    for (let i = 0; i < 25; i++) { const n = await ev(P, () => PUB.itens.filter(x => x.texto && /Senado aprova hoje|Selic segue alta|Fila no posto/.test(x.texto) && document.getElementById('p-u:' + x.id)).length); if (n >= 3) break; await ev(P, () => scrollBy(0, innerHeight * 2)); await sleep(300) }
    const bia = await ev(P, () => { const ps = PUB.itens.filter(x => x.texto && /Senado aprova hoje|Selic segue alta|Fila no posto/.test(x.texto)); return { n: ps.length, cn: ps.filter(x => cn102De(x)).length, el: ps.filter(x => document.getElementById('p-u:' + x.id)).length, voto: ps.some(x => { const e = document.getElementById('p-u:' + x.id); return e && e.querySelector('[data-voto],[data-cn102v],.cn102-op,button[data-enq]') }) } });
    ok(bia.n === 3 && bia.cn === 0 && bia.el === 3 && !bia.voto, 'posts antigos de Enquete, Número e De perto aparecem como post comum' + tag, JSON.stringify(bia));
    const feedTx = await ev(P, () => document.querySelector('#v-feed').innerText);
    ok(!SEM.test(feedTx), 'Feed sem Quiz, Enquete, De perto nem "Em 5 min"' + tag, (feedTx.match(SEM) || [])[0]);

    // 1. caixa de criar
    await ev(P, () => criarMenu()); await sleep(400);
    const cx = await ev(P, () => ({ abas: [...document.querySelectorAll('[data-cp152aba]')].map(b => b.textContent).join('|'), ax: [...document.querySelectorAll('[data-cp152ax]')].map(b => b.textContent.trim()).join('|'), tx: document.querySelector('#layer').innerText }));
    ok(cx.abas === 'Post|Coluna' && cx.ax === 'Foto|Notícia', 'caixa: Post e Coluna; juntar só Foto e Notícia' + tag, JSON.stringify(cx.abas + ' / ' + cx.ax));
    ok(!/Enquete|Número|De perto|Giro/.test(cx.tx), 'caixa sem citar Enquete, Número, De perto nem Giro' + tag, cx.tx.slice(-160));
    if (!se) await U.foto(P, 'formatos-caixa'); else await U.foto(P, 'formatos-caixa-se');
    await ev(P, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

    // Perfil sem "+" de giro na foto (há giro, então a foto abre o giro) e sem "perto de você"
    await ev(P, () => go('me')); await sleep(700);
    const pf = await ev(P, () => ({ mais: !!document.querySelector('#v-me .pf-mais'), cria: !!document.querySelector('#v-me [data-criarde="story"]'), tx: document.querySelector('#v-me').innerText, cab: pfCab(S.uid).indexOf('data-criarde="story"') }));
    ok(!pf.mais && !pf.cria && !/perto de você|Quiz|[Ee]nquete/.test(pf.tx), 'Perfil sem "+" de giro e sem citar os formatos' + tag, JSON.stringify({ mais: pf.mais, cria: pf.cria }));
    ok(await ev(P, () => tourTelas('Pedro').every(s => !/enquete/i.test(s.p))), 'ajuda da primeira abertura sem "vote nas enquetes"' + tag);
    ok(await ev(P, () => !/giros/.test(NT124_TIPOS.find(t => t[0] === 'curtidas')[2])), 'Ajustes de notificação: curtidas sem citar giros' + tag);
    ok(P._erros.length === 0, 'sem erro de JavaScript' + tag, P._erros.slice(0, 3));
    await P.context().close();
  }

  // o interruptor religa tudo (nos testes: prumo-teste-formatos = todos)
  const Q = U.erros(await H.pagina(b, { sessao: { user: { id: ids.a, email: 'a@x' } } }), 'Q');
  await Q.addInitScript(() => { try { localStorage.setItem('prumo-teste-formatos', 'todos'); localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
  await Q.goto(BASE); await esperar(Q, () => typeof VIEW !== 'undefined' && !!FEED && S.membro && PUB.on === true, null, 20000);
  await ev(Q, () => { try { closeLayer() } catch (e) {} go('feed'); criarMenu() }); await sleep(400);
  const lg = await ev(Q, () => ({ esc: FT182_ESCONDE.length, abas: [...document.querySelectorAll('[data-cp152aba]')].map(b => b.textContent).join('|'), ax: [...document.querySelectorAll('[data-cp152ax]')].map(b => b.textContent.trim()).join('|'), quiz: FEED.quiz.length }));
  ok(lg.esc === 0 && lg.abas === 'Post|Giro|Coluna' && lg.ax === 'Foto|Notícia|Enquete|Número|De perto', 'com o interruptor desligado tudo volta' + ' ' + JSON.stringify(lg));
  ok(Q._erros.length === 0, 'sem erro de JavaScript com tudo ligado', Q._erros.slice(0, 3));
  const { FALHAS } = U.resumo(); process.exit(FALHAS ? 1 : 0);
})().catch(e => { console.log('FAIL erro', e && e.stack || e); process.exit(1) });
