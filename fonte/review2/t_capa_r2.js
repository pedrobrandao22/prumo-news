// Capa, matéria, busca e coberturas (168, 16/11 noite): Selic e dólar no gráfico; "Para acompanhar" com a hora da última
// novidade; notícia velha com a data; agenda que já passou; "O que vem" escrito antes; linha do tempo sem repetir o mesmo
// fato; cabeçalho da matéria sólido; "Nesta matéria" marca todas as seções; Próxima conta no voltar; endereço #m= e
// recarregar no mesmo ponto; girar o celular mantém o parágrafo; Quem noticiou; Copiar link; busca (começo da palavra,
// indicador, sugestões, pessoas sem repetir); seguir sem conta avisa; celular deitado. iPhone 13 e iPhone SE.
// Portas 8730 (site).
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const BASE = 'http://localhost:8730/index.html';
const ev = (p, fn, a) => p.evaluate(fn, a);
(async () => {
  U.feedFresco('site'); U.servir('site', 8730); await sleep(800);
  const b = await U.navegador();
  for (const dev of [{ nome: 'iPhone 13', w: 390, h: 844 }, { nome: 'iPhone SE', w: 375, h: 667 }]) {
    const se = dev.nome === 'iPhone SE', tag = se ? ' [SE]' : '';
    const ctx = await b.newContext({ viewport: { width: dev.w, height: dev.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['clipboard-read', 'clipboard-write'] });
    await ctx.addInitScript(() => { try { localStorage.setItem('prumo-teste-capa', '1'); localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
    const P = U.erros(await ctx.newPage(), 'P' + tag);
    await P.goto(BASE); await esperar(P, () => !!FEED && typeof cm168Ult === 'function' && document.querySelector('#v-capa .cpi'), null, 12000);
    await ev(P, () => { try { closeLayer() } catch (e) {} go('capa') }); await sleep(600);

    // 6. cabeçalho da matéria e "Nesta matéria": fundo sólido (o texto não aparece por trás)
    const pid = await ev(P, () => { let best = null, n = 0; FEED.pautas.forEach(p => { abrirMateria(p.id); const k = document.querySelectorAll('#layer .fs2-cap [data-f113cap]').length; const h = document.querySelector('#layer .mat').scrollHeight; if (k > n || (k === n && best && h > best.h)) { n = k; best = { id: p.id, h } } closeLayer() }); return best && best.id });
    await ev(P, id => abrirMateria(id), pid); await sleep(500);
    const fundo = await ev(P, () => ['.mat-top', '.fs2-cap'].map(s => { const e = document.querySelector('#layer ' + s); if (!e) return 'ok'; const c = getComputedStyle(e); const a = /rgba?\(([^)]+)\)|color\(srgb ([^)]+)\)/.exec(c.backgroundColor); const al = a ? String(a[1] || a[2]).split(/[ ,\/]+/).filter(Boolean) : []; return (al.length < 4 || +al[3] === 1) && (c.backdropFilter === 'none' || !c.backdropFilter) ? 'ok' : s + ' ' + c.backgroundColor + ' ' + c.backdropFilter }));
    ok(fundo.every(x => x === 'ok'), 'matéria: cabeçalho e "Nesta matéria" com fundo sólido' + tag, fundo);

    // 6b. "Nesta matéria": cada seção fica marcada em algum momento da leitura, na ordem
    const seq = await ev(P, async () => { const m = document.querySelector('#layer .mat'), max = m.scrollHeight - m.clientHeight, out = [];
      for (let y = 0; y <= max + 40; y += 40) { m.scrollTop = y; m.dispatchEvent(new Event('scroll')); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 20))); const c = m.querySelector('.fs2-cap [aria-current]'); const i = c ? +c.dataset.f113cap : -1; if (out[out.length - 1] !== i) out.push(i) }
      return { out, n: m.querySelectorAll('.fs2-cap [data-f113cap]').length } });
    ok(seq.n >= 3 && seq.out.filter(i => i >= 0).length === seq.n && seq.out.every((x, k, a) => !k || x > a[k - 1]), '"Nesta matéria": todas as seções marcadas, na ordem, inclusive as curtas do fim' + tag, JSON.stringify(seq));
    await ev(P, () => closeLayer()); await sleep(300);

    // 7. Próxima conta como um passo do voltar; endereço #m=
    await ev(P, id => abrirMateria(id), pid); await sleep(400);
    const h0 = await ev(P, () => location.hash);
    await ev(P, () => { document.querySelector('#layer .mat').scrollTop = 700 }); await sleep(200);
    const prox = await ev(P, () => { const b = document.querySelector('#layer [data-matprox]'); if (!b) return null; const id = b.dataset.matprox; b.click(); return id }); await sleep(700);
    ok(h0 === '#m=' + pid && prox && await ev(P, id => MAT_PID === id && location.hash === '#m=' + id, prox), 'endereço da matéria (#m=…) acompanha a matéria aberta' + tag, h0);
    await P.goBack(); await sleep(700);
    const v1 = await ev(P, () => ({ pid: MAT_PID, y: (document.querySelector('#layer .mat') || {}).scrollTop, h: location.hash }));
    ok(v1.pid === pid && Math.abs(v1.y - 700) < 30 && v1.h === '#m=' + pid, 'voltar depois da Próxima: matéria anterior, no mesmo ponto' + tag, JSON.stringify(v1));
    await P.goBack(); await sleep(700);
    ok(await ev(P, () => !document.querySelector('#layer .mat') && VIEW === 'capa' && !location.hash), 'segundo voltar: Capa, sem #m= no endereço' + tag);
    // fechar pelo "‹ Capa" depois de duas Próximas desfaz os passos (o voltar seguinte não reabre matéria)
    await ev(P, id => abrirMateria(id), pid); await sleep(300);
    for (let i = 0; i < 2; i++) { await ev(P, () => { const b = document.querySelector('#layer [data-matprox]'); if (b) b.click() }); await sleep(500) }
    await ev(P, () => document.querySelector('#layer .mat-v').click()); await sleep(700);
    ok(await ev(P, () => !document.querySelector('#layer .mat') && HST === 0 && CM168_PILHA.length === 0), '"‹ Capa" depois de duas Próximas fecha tudo' + tag);

    // 7b. girar o celular: o mesmo parágrafo continua no alto
    await ev(P, id => abrirMateria(id), pid); await sleep(400);
    const blocoTopo = () => ev(P, () => { const m = document.querySelector('#layer .mat'); const a = cm168Ancora(m); return a ? a.i : -1 });
    await ev(P, () => { const m = document.querySelector('#layer .mat'); m.scrollTop = Math.round((m.scrollHeight - m.clientHeight) * .45); m.dispatchEvent(new Event('scroll')) }); await sleep(300);
    const a0 = await blocoTopo();
    await P.setViewportSize({ width: dev.h, height: dev.w }); await sleep(900); const a1 = await blocoTopo();
    await P.setViewportSize({ width: dev.w, height: dev.h }); await sleep(900); const a2 = await blocoTopo();
    ok(a0 > 0 && Math.abs(a1 - a0) <= 1 && Math.abs(a2 - a0) <= 1, 'girar o celular e voltar: o mesmo bloco no alto da tela' + tag, JSON.stringify({ a0, a1, a2 }));

    // 7c. recarregar com a matéria aberta: reabre a mesma matéria no mesmo ponto
    await ev(P, () => { const m = document.querySelector('#layer .mat'); m.scrollTop = Math.round((m.scrollHeight - m.clientHeight) * .6); m.dispatchEvent(new Event('scroll')) }); await sleep(400);
    const r0 = await blocoTopo();
    await P.reload(); await esperar(P, id => MAT_PID === id && !!document.querySelector('#layer .mat'), pid, 10000); await sleep(1500);
    const r1 = await ev(P, () => ({ pid: MAT_PID, i: (() => { const m = document.querySelector('#layer .mat'); const a = m && cm168Ancora(m); return a ? a.i : -1 })() }));
    ok(r1.pid === pid && Math.abs(r1.i - r0) <= 1, 'recarregar: a matéria reabre no mesmo ponto' + tag, JSON.stringify({ r0, r1 }));
    await ev(P, () => closeLayer()); await sleep(300);

    if (!se) {
      // 1. Selic: rodapé com desde quando vale e a última reunião; dólar: a linha é a PTAX
      await ev(P, () => { IND_AUTO = { atualizado: hojeSP() + 'T10:05-03:00', itens: [
        { id: 'dolar', nome: 'Dólar', valor: 'R$ 5,69', variacao: '+0,42%', dir: 'sobe', data: hojeSP(), fonte: 'cotação comercial', fonte_serie: 'PTAX/Banco Central', serie: [5.6, 5.62, 5.65], rotulos: [somaDias(hojeSP(), -5), somaDias(hojeSP(), -4), somaDias(hojeSP(), -3)] },
        { id: 'selic', nome: 'Selic', valor: '13,75%', dir: 'desce', data: '2026-09-17', fonte: 'Copom/Banco Central', serie: [14, 13.75, 13.75], rotulos: ['2026-08', '2026-09', '2026-10'] }] } });
      await ev(P, () => abrirGrafico('selic')); await sleep(400);
      const sf = await ev(P, () => document.querySelector('.gr .gr-fonte').textContent);
      ok(/taxa em vigor desde 17 set de 2026; (mantida|mudou) na reunião de \d+ de [a-zç]+/.test(sf) && !/dado de 17 set/.test(sf), 'Selic: rodapé diz desde quando a taxa vale e a última reunião', sf);
      await ev(P, () => closeLayer()); await sleep(300);
      await ev(P, () => abrirGrafico('dolar')); await sleep(400);
      const df = await ev(P, () => ({ ag: (document.querySelector('.gr .cm168-agora') || {}).textContent || '', ro: document.querySelector('.gr .gr-ro').textContent }));
      ok(/R\$ 5,69 é a cotação comercial de hoje às 10h05/.test(df.ag) && /PTAX/.test(df.ag) && /PTAX · último dado/.test(df.ro), 'dólar: diz que o valor do alto é a cotação de agora e a linha é a PTAX', JSON.stringify(df));
      await U.foto(P, 'capa_r2-dolar'); await ev(P, () => closeLayer()); await sleep(300);

      // 2. "Para acompanhar": a hora é a da última novidade (atualização), não a da troca de título
      const pa = await ev(P, () => { const ps = FEED.pautas.filter(p => temaDe(p)); if (ps.length < 2) return null; const x = ps[0], y = ps[1];
        const s0 = JSON.stringify([x.atualizacoes, x.titulos, x.hora, y.atualizacoes, y.hora, y.titulos]); const ag = Date.now();
        x.hora = new Date(ag - 6 * 864e5).toISOString(); x.atualizacoes = [{ hora: new Date(ag - 4 * 864e5).toISOString(), texto: 'Novidade antiga 168' }]; x.titulos = [{ hora: new Date(ag - 3 * 864e5).toISOString(), titulo: 'a' }, { hora: new Date(ag - 600e3).toISOString(), titulo: 'b' }];
        y.hora = new Date(ag - 7 * 864e5).toISOString(); y.atualizacoes = [{ hora: new Date(ag - 3600e3).toISOString(), texto: 'Novidade nova 168' }]; y.titulos = [{ hora: y.hora, titulo: 'c' }, { hora: new Date(ag - 7200e3).toISOString(), titulo: 'd' }];
        FEED.atualizado_em = new Date(ag - 1000).toISOString(); renderCapa();
        const h = [...document.querySelectorAll('#v-capa .cp-h')].find(h => /Para acompanhar/.test(h.textContent)); const lis = [...h.nextElementSibling.querySelectorAll('button[data-cobpag]')];
        const ix = lis.findIndex(b => b.dataset.cobpag === x.id), iy = lis.findIndex(b => b.dataset.cobpag === y.id);
        const r = { sx: lis[ix] && lis[ix].querySelector('.s').textContent, sy: lis[iy] && lis[iy].querySelector('.s').textContent, ix, iy, esp: cm168Quando(Date.now() - 4 * 864e5) };
        const v = JSON.parse(s0); [x.atualizacoes, x.titulos, x.hora, y.atualizacoes, y.hora, y.titulos] = v; renderCapa(); return r });
      ok(pa && pa.sx === pa.esp && /^hoje, \d{1,2}h\d{2}$|^ontem, /.test(pa.sy) && pa.iy < pa.ix, '"Para acompanhar": hora da última novidade de cada cobertura, mais nova em cima', JSON.stringify(pa));

      // 3. notícia velha: "de <dia>" no cartão, desce na editoria, aviso no "Em 30 segundos" e na matéria
      const vel = await ev(P, () => { const ag = Date.now(), sec = secOf(FEED.pautas[0]);
        const mk = (id, h, tit) => { const v = JSON.parse(JSON.stringify(FEED.pautas.find(p => secOf(p) === sec && p.id !== FEED.capa?.manchete) || FEED.pautas[1])); v.id = id; v.hora = new Date(h).toISOString(); v.inicio = v.hora; v.atualizacoes = []; v.titulos = []; v.prioridade = 99; v.neutro.titulo = tit; return v };
        const velha = mk('cm168-velha', ag - 4 * 864e5, 'Notícia de quatro dias 168'), nova = mk('cm168-nova', ag - 600e3, 'Notícia de agora 168'); velha.prioridade = 100;
        FEED.pautas.push(velha, nova); FEED.atualizado_em = new Date(ag).toISOString(); renderCapa();
        const e = capaEscolha(), iv = e.ord.findIndex(p => p.id === 'cm168-velha'), inn = e.ord.findIndex(p => p.id === 'cm168-nova');
        const mkd = h => { const d = document.createElement('div'); d.innerHTML = h; return (d.querySelector('.cm168-dia') || {}).textContent || '' }; const dia = mkd(cpItem(velha, { tam: 'li' }));
        const ab = cpAberta(velha); abrirMateria('cm168-velha'); const mt = (document.querySelector('#layer .cm168-velha') || {}).textContent || ''; closeLayer();
        const novaSemData = !mkd(cpItem(nova, { tam: 'li' }));
        FEED.pautas = FEED.pautas.filter(p => !/^cm168-/.test(p.id)); renderCapa();
        return { iv, inn, dia, esp: 'Sem novidade desde ' + cm168Dia(ag - 4 * 864e5), ab: /cm168-velha/.test(ab), mt, novaSemData } });
      ok(vel.dia === vel.esp && vel.novaSemData, 'notícia de 4 dias: cartão diz "' + vel.esp + '" (19/11: frase separada); a de agora não', JSON.stringify(vel));
      ok(vel.iv > vel.inn, 'notícia velha desce na ordem da Capa (não abre a editoria com foto grande)', JSON.stringify(vel));
      ok(vel.ab && /sem novidade desde então/.test(vel.mt), '"Em 30 segundos" e matéria avisam de quando é a notícia', JSON.stringify(vel));

      // 4. Agenda: o Focus de hoje, à tarde, "saiu às 8h25"; "O que vem" escrito antes do dia citado avisa
      const ag = await ev(P, () => { const a0 = FEED.agenda, m0 = minAgoraSP; FEED.agenda = [{ data: hojeSP(), hora: '', texto: 'Banco Central divulga o Boletim Focus', secao: 'economia' }, { data: hojeSP(), hora: '', texto: 'Evento sem hora 168', secao: 'politica' }];
        minAgoraSP = () => 14 * 60; renderCapa(); const h = [...document.querySelectorAll('#v-capa .cp-h')].find(h => /^Agenda/.test(h.textContent)); const t1 = h ? h.nextElementSibling.innerText : '';
        minAgoraSP = () => 7 * 60; renderCapa(); const h2 = [...document.querySelectorAll('#v-capa .cp-h')].find(h => /^Agenda/.test(h.textContent)); const t2 = h2 ? h2.nextElementSibling.innerText : '';
        minAgoraSP = m0; FEED.agenda = a0; renderCapa(); return { t1, t2 } });
      ok(/Hoje · saiu às 8h25\s*Banco Central divulga o Boletim Focus/.test(ag.t1) && /Hoje\s*Evento sem hora 168/.test(ag.t1) && !/saiu/.test(ag.t2), 'Agenda: Focus "saiu às 8h25" depois do horário; antes, "Hoje"', JSON.stringify(ag));
      const vem = await ev(P, () => { const p = FEED.pautas.find(p => temaDe(p)); const s0 = JSON.stringify([p.proximo, p.hora, p.atualizacoes, p.titulos]); p.titulos = [{ hora: p.hora, titulo: 'a' }, { hora: p.hora, titulo: 'b' }];
        const ont = somaDias(hojeSP(), -1), w = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][new Date(ont + 'T12:00:00Z').getUTCDay()];
        p.proximo = `O mercado reabre na ${w} (${+ont.slice(8, 10)}), com o Focus.`; p.hora = new Date(Date.now() - 2.2 * 864e5).toISOString(); p.atualizacoes = [];
        abrirPagCob(p.id); const n = (document.querySelector('.sheet .pc .note') || {}).textContent || ''; closeLayer();
        p.proximo = 'Sem data 168.'; abrirPagCob(p.id); const n2 = (document.querySelector('.sheet .pc .note') || {}).textContent || ''; closeLayer();
        [p.proximo, p.hora, p.atualizacoes, p.titulos] = JSON.parse(s0); return { n, n2 } });
      ok(/Previsão escrita .*; ainda sem notícia nova/.test(vem.n) && !/Previsão escrita/.test(vem.n2), '"O que vem" de um dia que já passou avisa de quando é a previsão', JSON.stringify(vem));

      // 5. linha do tempo do assunto: o mesmo fechamento uma vez só, com "número corrigido"; "Notícias de <assunto>"
      const tl = await ev(P, () => { const ag = Date.now(), d = n => new Date(ag - n * 3600e3).toISOString(); const base = JSON.parse(JSON.stringify(FEED.pautas.find(p => temaDe(p))));
        base.id = 'cm168-merc'; base.subtema = 'Mercados 168'; base.tema = 'Mercado 168';
        base.titulos = [{ hora: d(80), titulo: 'Na terça (10), dólar subiu 1,33% a R$ 5,58 e Ibovespa caiu 0,52%' }, { hora: d(60), titulo: 'Ibovespa sobe 0,66% e dólar fecha a R$ 5,66, com alta de 2,63% na semana' },
          { hora: d(30), titulo: 'Ibovespa sobe 0,66% a 172.458; dólar fecha a R$ 5,67 na sexta (13)' }, { hora: d(2), titulo: 'Ibovespa sobe 0,66% a 172.458; dólar fecha a R$ 5,65 na sexta (13)' }];
        base.atualizacoes = [{ hora: d(81), texto: 'No fechamento de terça (10), o Ibovespa caiu 0,52%, a 171.337 pontos, e o dólar subiu 1,33%, a R$ 5,58.' },
          { hora: d(61), texto: 'No fechamento de sexta (13), o Ibovespa subiu 0,66%, a 172.458 pontos, e o dólar fechou a R$ 5,65.' }, { hora: d(31), texto: 'O dólar fecha a sexta (13) a R$ 5,65 e o Ibovespa a 172.458 pontos (alta de 0,66%).' }];
        const p2 = JSON.parse(JSON.stringify(base)); p2.id = 'cm168-merc2'; p2.tema = 'Outra 168'; p2.titulos = []; p2.atualizacoes = []; p2.neutro.titulo = 'Outra notícia do assunto 168'; p2.hora = d(5);
        FEED.pautas.push(base, p2); const r = asDados('Mercados 168'); abrirPagCob('cm168-merc'); const lk = (document.querySelector('.sheet .as-link') || {}).textContent || ''; closeLayer();
        FEED.pautas = FEED.pautas.filter(p => !/^cm168-/.test(p.id)); return { ev: r.ev.map(x => x.tema + ' | ' + x.txt), lk } });
      const sexta = tl.ev.filter(x => /sexta \(13\)|semana/.test(x)), terca = tl.ev.filter(x => /terça \(10\)/.test(x));
      ok(sexta.length === 1 && /número corrigido/.test(sexta[0]) && /R\$ 5,65/.test(sexta[0]) && terca.length === 1, 'linha do tempo: o fechamento de sexta uma vez só (o mais novo, "número corrigido"); terça continua', JSON.stringify(tl.ev));
      ok(/^Notícias de Mercados 168/.test(tl.lk) && !/Tudo sobre/.test(tl.lk), 'cobertura: link do assunto diz "Notícias de …", não outro nome da cobertura', tl.lk);

      // 8. Quem noticiou: um resumo por veículo, resumo velho avisa, manchete do link, "Também noticiaram"
      const qn = await ev(P, () => { const ont = somaDias(hojeSP(), -2), w = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][new Date(ont + 'T12:00:00Z').getUTCDay()], dd = +ont.slice(8, 10);
        const p = JSON.parse(JSON.stringify(FEED.pautas[0])); p.id = 'cm168-quem'; p.fontes = ['g1', 'agsenado', 'im', 'ab'];
        p.enquadramentos = [{ fonte: 'g1', descricao: `Destaca a votação prevista para ${w} (${dd}).` }, { fonte: 'agsenado', descricao: 'Resumo antigo da Agência Senado.' }, { fonte: 'agsenado', descricao: 'Resumo novo da Agência Senado.' }];
        p.links = [{ fonte: 'ab', titulo: 'Senado aprova texto-base', url: 'https://agenciabrasil.ebc.com.br/x' }, { fonte: 'g1', titulo: 'g1 x', url: 'https://g1.globo.com/x' }]; p.checagem = { status: 'confirmado', texto: 'Os números batem.' };
        FEED.pautas.push(p); abrirCobertura('cm168-quem'); const sh = document.querySelector('.sheet'); const li = n => [...sh.querySelectorAll('.cvl>li')].find(l => (l.querySelector('.cv-h b') || {}).textContent === n);
        const r = { ags: li('Agência Senado') ? li('Agência Senado').querySelectorAll(':scope>p').length + ' ' + li('Agência Senado').textContent : '', g1: li('g1') ? li('g1').textContent : '', ab: li('Agência Brasil') ? li('Agência Brasil').textContent : '', im: !!li('InfoMoney'), tb: (sh.querySelector('.cm168-tb') || {}).textContent || '' };
        closeLayer(); FEED.pautas = FEED.pautas.filter(x => x.id !== 'cm168-quem'); return r });
      ok(/^1 /.test(qn.ags) && /Resumo novo/.test(qn.ags) && !/Resumo antigo/.test(qn.ags), 'Quem noticiou: um resumo por veículo (o mais novo)', JSON.stringify(qn));
      ok(/^g1.*Antes de /.test(qn.g1) && /“Senado aprova texto-base”/.test(qn.ab) && !qn.im && /Também noticiaram.*InfoMoney/.test(qn.tb), 'Quem noticiou: resumo de antes do evento avisa; sem resumo mostra a manchete; sem nada vai para "Também noticiaram"', JSON.stringify(qn));

      // 9. Mandar notícia: "Copiar link" (e "Para um amigo" com conta)
      const pid0 = await ev(P, () => FEED.pautas[0].id);
      await ev(P, id => compartilhar(id), pid0); await sleep(300);
      ok(await ev(P, () => !!document.querySelector('.sheet .env [data-cm168link]') && !document.querySelector('.sheet [data-cm168amg]')), 'Mandar notícia: "Copiar link" (sem conta, sem "Para um amigo")');
      await U.foto(P, 'capa_r2-mandar');
      await ev(P, () => document.querySelector('.sheet [data-cm168link]').click()); await sleep(400);
      const clip = await ev(P, async () => { try { return await navigator.clipboard.readText() } catch (e) { return 'erro ' + e.message } });
      ok(/\/m\/[^ ]+\.html$|#m=/.test(clip) && !/\n/.test(clip) && await ev(P, () => !document.querySelector('.sheet .env')), 'Copiar link: só o link vai para a área de transferência', clip);
      const amg = await ev(P, id => { const u = S.uid, m = S.membro; S.uid = 'cm168-teste'; S.membro = true; let r = false; try { compartilhar(id); r = !!document.querySelector('.sheet [data-cm168amg]') } finally { S.uid = u; S.membro = m; closeLayer() } return r }, pid0);
      ok(amg, 'com conta: "Para um amigo" no Mandar notícia');

      // 10. Busca
      const bt = await ev(P, () => { const ts = bu154Termos('pe de meia'); return { n: ts.map(t => t.n), nomeia: ts.every(t => bu154Casa(t, bu154N('Alliana nomeia Jorge Schreiner'))), pe: ts.every(t => bu154Casa(t, bu154N('Pé-de-Meia paga R$ 200'))) } });
      ok(bt.n.join() === 'pe,meia' && !bt.nomeia && bt.pe, 'busca: "pe de meia" não acha "nomeia"; "de" não conta; acha "Pé-de-Meia"', JSON.stringify(bt));
      await ev(P, () => go('busca')); await sleep(300);
      await P.fill('#bvq', 'dólar'); await sleep(500);
      // decisão do Pedro (17/11): indicadores só no card da Capa, sem atalho na Busca nem gráfico
      ok(await ev(P, () => !document.querySelector('#bvres .cm168-ind, #bvres [data-indg]') && !/Ver gráfico/.test(document.querySelector('#bvres').textContent)), 'busca "dólar": sem atalho de indicador (17/11)');
      await P.fill('#bvq', 'xyzwqk'); await sleep(500);
      const sug = await ev(P, () => ({ h: (document.querySelector('#bvres .bu154-sh') || {}).textContent || '', c: [...document.querySelectorAll('#bvres .bu154-sug [data-bu154q]')].map(b => b.dataset.bu154q), ok: cm168Sugestoes() }));
      ok(sug.ok.length >= 2 ? sug.h === 'Coberturas desta edição' && sug.c.every(t => FEED.pautas.some(p => temaDe(p) === t && cobTemPagina(p))) : sug.h === 'Assuntos para explorar', 'nada encontrado: sugestões só com coberturas desta edição', JSON.stringify(sug));
      const pes = await ev(P, () => { const out = $('#bvres'); const am = S.amigos; S.amigos = new Set(['uA']);
        out.innerHTML = `<div class="cs123-bus qa125-bus"><b class="cs123-bh">Perfis abertos</b><ul class="amgl cs123-l"><li><button data-cs123perfil="uA"></button></li><li><button data-cs123perfil="uB"></button></li></ul></div><h3 class="bu154-h">Pessoas</h3><ul class="amgl bu154-pe"><li><button data-bu154pf="uA"><span class="amg-n"><b>Ana</b><span>Amigo</span></span></button></li></ul>`;
        cm168Pessoas(); const r = { blocos: out.querySelectorAll('.qa125-bus').length, a: out.querySelectorAll('[data-bu154pf="uA"],[data-cs123perfil="uA"]').length, b: out.querySelectorAll('.bu154-pe [data-cs123perfil="uB"]').length };
        out.innerHTML = `<div class="cs123-bus qa125-bus"><b class="cs123-bh">Perfis abertos</b><ul><li><button data-cs123perfil="uB"></button></li></ul></div>`; cm168Pessoas(); r.so = out.querySelector('.cs123-bh').textContent; S.amigos = am; out.innerHTML = ''; return r });
      ok(pes.blocos === 0 && pes.a === 1 && pes.b === 1 && pes.so === 'Pessoas', 'busca: perfis abertos entram em "Pessoas" sem repetir', JSON.stringify(pes));

      // 11. seguir sem conta: avisa que é neste aparelho e oferece Entrar
      const sg = await ev(P, () => { cobSegue('Cobertura 168', true); return new Promise(r => setTimeout(() => { const t = document.querySelector('.toast'); r({ t: t ? t.textContent : '', b: !!(t && t.querySelector('.toast-a')) }); cobSegue('Cobertura 168', false) }, 120)) });
      ok(/neste aparelho/.test(sg.t) && /Entrar/.test(sg.t) && sg.b, 'seguir cobertura sem conta: aviso "neste aparelho" com Entrar', JSON.stringify(sg));
      await ev(P, () => go('capa')); await sleep(300);
    }

    // celular deitado: foto da manchete ao lado do título, título inteiro na primeira tela
    await ev(P, () => { closeLayer(); go('capa'); window.scrollTo(0, 0) }); await P.setViewportSize({ width: dev.h, height: dev.w }); await sleep(900);
    // desde 17/11 o "Em 1 min" fica acima da manchete: a conta vale a partir do começo da manchete
    await ev(P, () => { const m = document.querySelector('#v-capa .cpi-man'); if (m) window.scrollTo(0, m.getBoundingClientRect().top + scrollY - 8) }); await sleep(300);
    const dt = await ev(P, () => { const m = document.querySelector('#v-capa .cpi-man'); if (!m) return null; const a = m.querySelector('.art'), t = m.querySelector('.cp-t'); const ra = a.getBoundingClientRect(), rt = t.getBoundingClientRect(), rm = m.getBoundingClientRect();
      return { lado: rt.left >= ra.right - 1, larg: ra.width / rm.width, fimTit: rt.bottom, h: innerHeight } });
    ok(dt && dt.lado && dt.larg < .5 && dt.fimTit < dt.h - 40, 'celular deitado: foto ao lado do título e título inteiro acima da barra' + tag, JSON.stringify(dt));
    await U.foto(P, 'capa_r2-deitado' + (se ? '-se' : ''));
    await P.setViewportSize({ width: dev.w, height: dev.h }); await sleep(400);

    ok(!P._erros.length, 'sem erro de JavaScript' + tag, P._erros.slice(0, 3));
    await ctx.close();
  }
  await b.close(); const r = U.resumo(); console.log(`\n${r.OKS} ok, ${r.FALHAS} falhas`); process.exit(r.FALHAS ? 1 : 0);
})().catch(e => { console.error('Error', e); process.exit(1) });
