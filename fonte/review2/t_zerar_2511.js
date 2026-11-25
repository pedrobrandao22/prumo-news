// 25/11: zerar as pendências do testador (itens 1 a 3 do balanço semanal). Porta 9431.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9431, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const b = await U.navegador();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('prumo-tour-visto', '1') } catch (e) {} });
  const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
  await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && window.__prumoPronto, null, 15000);
  // 1. agenda com hora vencida e notícia sem atualização depois
  const r1 = await P.evaluate(() => { const p = FEED.pautas[0]; p.atualizacoes = []; p.correcoes = []; p.titulos = []; p.hora = new Date(Date.now() - 6 * 3600e3).toISOString();
    const d = new Date(Date.now() - 30 * 60e3), hh = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).format(d);
    p.faq = [{ p: 'Quando é o jogo?', r: 'Às 20h' }, { p: 'O que está em jogo?', r: 'O título' }];
    FEED.agenda = [{ data: hojeSP(), hora: (+hh) + 'h', texto: 'Brasileirão: A x B', pid: p.id }]; av212Passa(FEED);
    return { sub: p.subtitulo, tipo: p._av212 && p._av212.tipo, faq: p.faq.length } });
  ok(/^O jogo começou às \d+h; o resultado entra na próxima atualização\./.test(r1.sub || '') && r1.tipo === 'hora' && r1.faq === 1, '1: jogo com a hora vencida ganha a nota e perde o "Quando é…?"', r1);
  // 2. Acabou de sair: mesmo fato junta, beleza sai, palavra dobrada, país estrangeiro em Mundo
  const r2 = await P.evaluate(() => { const ag = new Date(); const h = `${String(ag.getDate()).padStart(2, '0')}/${String(ag.getMonth() + 1).padStart(2, '0')} 10h00`;
    const d = { novos: [
      { assunto: 'Sem previsão de alta, Bolsonaro está na UTI e é alimentado por sonda', secao: 'politica', n_fontes: 3, relevante: true, manchetes: [{ veiculo: 'A', titulo: 'Sem previsão de alta, Bolsonaro está na UTI e é alimentado por sonda', hora: h }] },
      { assunto: 'Bolsonaro está na na UTI e não tem previsão de alta', secao: 'politica', n_fontes: 2, relevante: true, manchetes: [{ veiculo: 'B', titulo: 'Bolsonaro está na na UTI e não tem previsão de alta', hora: h }] },
      { assunto: 'Beleza bridal: Miley Cyrus se casa com make delicada', secao: 'brasil', n_fontes: 3, manchetes: [{ veiculo: 'C', titulo: 'Beleza bridal: Miley Cyrus se casa com make delicada', hora: h }] },
      { assunto: 'Incêndio em fábrica de doces na Indonésia deixa 3 mortos', secao: 'brasil', n_fontes: 3, manchetes: [{ veiculo: 'D', titulo: 'Incêndio em fábrica de doces na Indonésia deixa 3 mortos', hora: h }] }] };
    av212Limpa(d); return d.novos.map(n => [n.assunto, n.secao, n.manchetes.length]) });
  ok(r2.length === 2 && r2[0][2] === 2 && r2[1][1] === 'mundo', '2: Acabou de sair junta o mesmo fato, tira beleza e põe a Indonésia em Mundo', r2);
  // 3. novidade do robô de manchetes vira faixa na matéria
  const r3 = await P.evaluate(async () => { const p = FEED.pautas[1]; p.atualizacoes = []; p.correcoes = []; p.titulos = []; p.hora = new Date(Date.now() - 5 * 3600e3).toISOString(); delete p._av212;
    const ag = new Date(Date.now() - 20 * 60e3), f = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(ag), g = k => f.find(x => x.type === k).value;
    const h = `${g('day')}/${g('month')} ${g('hour')}h${g('minute')}`;
    NOVID_AG = Object.assign({}, NOVID_AG || {}, { gerado: new Date().toISOString(), acionar_itens: [{ tipo: 'pauta', pid: p.id, manchetes: ['Poder360', 'g1', 'Metrópoles'].map(v => ({ veiculo: v, titulo: 'Mercado eleva projeção de inflação para 5,15%', hora: h })) }] });
    av212Novid(); abrirMateria(p.id); await new Promise(z => setTimeout(z, 900)); const fx = document.querySelector('#layer .av212-faixa'); const t = fx && fx.textContent; try { closeLayer() } catch (e) {} return { t, tipo: p._av212 && p._av212.tipo } });
  ok(r3.tipo === 'novid' && /^Agora: «Mercado eleva/.test(r3.t || ''), '3: 3 veículos com fato novo viram a faixa "Agora" na matéria', r3);
  // 4. folha de opções: explicação embaixo do nome
  const r4 = await P.evaluate(async () => { sheet('Teste', '<div class="opt"><button type="button" data-x="1">Fixar no perfil<span>até 3 aparecem primeiro na sua grade</span></button></div>'); await new Promise(z => setTimeout(z, 400));
    const bt = document.querySelector('.sheet .opt button'), sp = bt.querySelector('span'); const r = { dir: getComputedStyle(bt).flexDirection, larg: Math.round(sp.getBoundingClientRect().width), bt: Math.round(bt.getBoundingClientRect().width) }; try { closeLayer() } catch (e) {} return r });
  await sleep(500); await P.evaluate(() => { ['layer', 'layer2'].forEach(i => { const L = document.getElementById(i); if (L) L.innerHTML = '' }) });
  ok(r4.dir === 'column' && r4.larg >= r4.bt - 8, '4: explicação ocupa a largura toda embaixo do nome', r4);
  // 5. toque duplo num botão de alternar do cartão
  await P.evaluate(() => { const box = document.createElement('div'); box.id = 'td-t'; box.style.cssText = 'position:fixed;top:220px;left:20px;z-index:99999'; document.body.appendChild(box); box.innerHTML = '<button type="button" data-a="save" data-pid="zz">Guardar</button>';
    window.__n5 = 0; box.addEventListener('click', () => window.__n5++); box.scrollIntoView(); });
  await P.click('#td-t button'); await sleep(80); await P.click('#td-t button'); await sleep(600); await P.click('#td-t button');
  const r5 = await P.evaluate(() => { document.getElementById('td-t').remove(); return window.__n5 });
  ok(r5 === 2, '5: o 2º toque em 80 ms é ignorado; um toque depois de 0,6 s vale', r5);
  // 6. textos sem "amigos"
  const r6 = await P.evaluate(async () => { const d = document.createElement('p'); d.textContent = 'Para curtir, comentar e conversar com amigos, entre com o convite'; document.body.appendChild(d); await new Promise(z => setTimeout(z, 100)); const t = d.textContent; d.remove(); return t });
  ok(!/amigos/.test(r6), '6: telas sem conta não falam em amigos', r6);
  // 7. regra única de fotos e descrição em inglês
  const r7 = await P.evaluate(() => [ft213Ok({ url: 'https://upload.wikimedia.org/x/Alaska_Airlines_Airbus.jpg' }, 'falha em sistema da delta atrasa voos'), ft213Ok({ url: 'https://upload.wikimedia.org/x/Alaska_Airlines_Airbus.jpg' }, 'alaska airlines cancela voos'),
    ft213Alt({ url: 'x', alt: 'Foto de arquivo: airliner taking off runway United States airport' }, { tema: 'Falha da Delta' }).alt, FT157_BLOQ.indexOf('maidan nezalezhnosti') >= 0]);
  ok(r7[0] === false && r7[1] === true && r7[2] === 'Foto de arquivo (Falha da Delta)' && r7[3], '7: foto da Alaska só com Alaska no título; descrição em inglês trocada; Maidan bloqueada', r7);
  // 9. placar do robô entra sozinho na notícia (25/11)
  const r9 = await P.evaluate(() => { const p = FEED.pautas[2]; p.atualizacoes = []; p.correcoes = []; p.hora = new Date(Date.now() - 5 * 3600e3).toISOString(); delete p._av212;
    PL212 = { gerado: new Date().toISOString(), jogos: [{ pid: p.id, estado: 'encerrado', texto: 'Terminou: Atlético-MG 2 x 1 Corinthians.' }] }; av212Placar(); av212Novid(); return { sub: p.subtitulo, tipo: p._av212 && p._av212.tipo } });
  ok(r9.tipo === 'placar' && /^Terminou: Atlético-MG 2 x 1 Corinthians\./.test(r9.sub || ''), '9: placar encerrado vira "Terminou: …" no alto da notícia', r9);
  // 10. busca: tocar num item da agenda abre o item, não a agenda inteira
  const r10 = await P.evaluate(async () => { const d = document.createElement('div'); d.className = 'bu154-agd'; d.innerHTML = '<button type="button" data-igagenda><span>Hoje, 20h</span><b>Brasileirão: A x B</b></button>'; document.body.appendChild(d);
    d.querySelector('button').click(); await new Promise(r => setTimeout(r, 300)); const t = document.querySelector('#layer .ag214-t,#layer2 .ag214-t'); d.remove(); const r = t && t.textContent; try { closeLayer() } catch (e) {} return r });
  ok(r10 === 'Brasileirão: A x B', '10: item da agenda na busca abre só aquele item', r10);
  // 11. letra grande: chapéu da Capa cresce
  const r11 = await P.evaluate(() => { const e = document.createElement('span'); e.className = 'cp-k'; document.body.appendChild(e); const a = parseFloat(getComputedStyle(e).fontSize); document.documentElement.style.setProperty('--fz', '1.3'); const z = parseFloat(getComputedStyle(e).fontSize); document.documentElement.style.removeProperty('--fz'); e.remove(); return [a, z] });
  ok(r11[1] > r11[0] + 2, '11: chapéu da Capa cresce com a letra grande', r11);
  // 8. sem internet: depois de 4 s a pílula fica pequena, não some
  await ctx.setOffline(true); await P.evaluate(() => dispatchEvent(new Event('offline'))); await sleep(4600);
  const r8 = await P.evaluate(() => { const f = document.getElementById('sr209'); return f && { vis: getComputedStyle(f).visibility, op: +getComputedStyle(f).opacity, pe: getComputedStyle(f).pointerEvents } });
  ok(r8 && r8.vis === 'visible' && r8.op > .5 && r8.pe === 'none', '8: sem internet o aviso continua (pequeno, sem tapar toque)', r8);
  await ctx.setOffline(false);
  await ctx.close(); await b.close(); srv.close && srv.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})();
