// Corretor 22/11 (tarde). Porta 9170.
// (1) achado "linha-do-tempo-troca-sabado-21-por-hoje-em-entradas-de-dias-anteriores": o 185 trocava "sábado (21)" por
//     "hoje"/"ontem" em toda a tela, inclusive em entradas com data própria (linha do tempo, atualizações, linha do tempo
//     da cobertura e da página do assunto). Gera a CLASSE: entradas de ontem e anteontem com a data de hoje, de ontem e de
//     amanhã no texto, em <li data-dt185-ref>, em <li><time datetime>, e nos quatro desenhos reais (matTempo, Atualizações
//     da matéria, cobLinha, página do assunto): nenhuma troca. Controles: entrada de HOJE e texto solto continuam trocando.
// (2) achado "caixa-o-que-voce-acha-troca-a-noticia-do-rascunho-guardado": com rascunho guardado, a caixa do Feed diz
//     "Continuar rascunho" e abre o rascunho como foi guardado; cp152Abre com outra notícia (o caminho do "O que você
//     acha?") não troca a notícia do rascunho nem enfia notícia num rascunho sem notícia. Controle: sem rascunho, a notícia
//     pedida entra.
const U = require('../t_util'); const { ok, sleep, esperar } = U;
const PORTA = 9170, BASE = `http://localhost:${PORTA}/index.html`;
const ev = (P, f, a) => P.evaluate(f, a);
const clk = (p, sel) => p.$eval(sel, e => { e.scrollIntoView({ block: 'center' }); e.click() });
async function criar(p, { nome, email }) {
  await p.goto(BASE); await esperar(p, () => document.querySelectorAll('.post').length > 0);
  if (!(await p.$('#lcod'))) { await esperar(p, () => !!document.querySelector('#avisoconta [data-entrar]')); await clk(p, '#avisoconta [data-entrar]'); await clk(p, '[data-laba="criar"]') }
  await p.fill('#lnome', nome); await p.fill('#lemail', email); await p.fill('#lsenha', '123456'); await clk(p, '#lform [type=submit]');
  await esperar(p, () => S.membro && S.amigosOk, null, 8000); await sleep(600); if (await p.$('.sheet')) { await p.evaluate(() => closeLayer()); await sleep(250) } }
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const H = await require('../harness').criar(); const b = await U.navegador();
  const A = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'A');
  await A.goto(BASE); await esperar(A, () => window.FEED && FEED.pautas && FEED.pautas.length, null, 15000); await sleep(500);

  // ---------- (1) datas com dia próprio ----------
  const r1 = await ev(A, async () => {
    const hoje = hojeSP(), D = k => somaDias(hoje, k);
    const fr = iso => { const x = new Date(iso + 'T12:00:00Z'); return `${DT185_SEM[x.getUTCDay()]} (${x.getUTCDate()})` };
    const FR = { hoje: fr(D(0)), ontem: fr(D(-1)), amanha: fr(D(1)) };
    const frases = [`A final é no ${FR.hoje}, às 21h`, `O Senado votou na ${FR.ontem}`, `A Câmara vota na ${FR.amanha}`, `O clássico de ${FR.hoje} decide o título`];
    const box = document.createElement('div'); box.id = 'dt2211'; document.body.appendChild(box);
    const res = { mud: [], ctl: [], reais: [] };
    const espera = () => new Promise(r => setTimeout(r, 60));
    for (const dRef of [D(-1), D(-2), D(-4)]) for (const f of frases) {
      box.innerHTML = `<ol><li data-dt185-ref="${dRef}"><span>${f}</span></li><li><time datetime="${dRef}">x</time><span>${f}</span></li></ol>`;
      await espera(); dt185Varre(box);
      box.querySelectorAll('span').forEach(s => { if (s.textContent !== f) res.mud.push(dRef + ': ' + s.textContent) })
    }
    // controles: entrada de hoje e texto solto trocam
    box.innerHTML = `<ol><li data-dt185-ref="${D(0)}"><span>A final é no ${FR.hoje}, às 21h</span></li></ol><p>A final é no ${FR.hoje}, às 21h</p>`;
    await espera(); dt185Varre(box);
    res.ctl = [...box.querySelectorAll('span,p')].map(s => s.textContent);
    // desenhos reais
    const p0 = FEED.pautas[0], H0 = D(-3) + 'T10:00:00Z', H1 = D(-2) + 'T10:00:00Z', H2 = D(-1) + 'T10:00:00Z';
    const pf = Object.assign({}, p0, { visuais: [], titulos: [{ hora: H0, titulo: `Boca projeta invasão na final de ${FR.hoje}` }, { hora: H1, titulo: `Atlético define o time para a final de ${FR.hoje}` }, { hora: H2, titulo: `Final de ${FR.hoje} tem ingressos esgotados` }],
      atualizacoes: [{ hora: H2, texto: `O time chega a um empate do título no clássico de ${FR.hoje}` }] });
    box.innerHTML = matTempo(pf) + (typeof cobLinha === 'function' ? cobLinha(pf) : '');
    await espera(); dt185Varre(box);
    const txt = box.textContent;
    res.reais.push({ onde: 'matTempo+cobLinha', troca: /\bhoje\b/.test(txt), tem: txt.includes(FR.hoje), n: box.querySelectorAll('li[data-dt185-ref]').length });
    // Atualizações da matéria (abre a matéria com a pauta alterada)
    const orig = { a: p0.atualizacoes }; p0.atualizacoes = pf.atualizacoes;
    closeLayer(); abrirMateria(p0.id); await new Promise(r => setTimeout(r, 400));
    const up = document.querySelector('#layer .cpx-up li');
    res.reais.push({ onde: 'atualizacoes', troca: up ? /\bhoje\b/.test(up.textContent) : null, tem: up ? up.textContent.includes(FR.hoje) : null, ref: up && up.getAttribute('data-dt185-ref') });
    p0.atualizacoes = orig.a; closeLayer(); box.remove();
    return res
  });
  ok(r1.mud.length === 0, 'entradas de outros dias (data-dt185-ref e <time datetime>) ficam com a data escrita', r1.mud.slice(0, 4));
  ok(/hoje/.test(r1.ctl[0]) && /hoje/.test(r1.ctl[1]), 'controle: entrada de hoje e texto solto continuam com "hoje"', r1.ctl);
  ok(r1.reais[0].n >= 3 && !r1.reais[0].troca && r1.reais[0].tem, 'linha do tempo da matéria e da cobertura: títulos antigos com o dia escrito', r1.reais[0]);
  ok(r1.reais[1].ref && r1.reais[1].troca === false && r1.reais[1].tem === true, 'Atualizações da matéria: entrada de ontem com o dia escrito', r1.reais[1]);

  // ---------- (2) caixa do Feed com rascunho guardado ----------
  await A.close();
  const B = U.erros(await H.pagina(b, { viewport: { width: 390, height: 844 } }), 'B');
  await criar(B, { nome: 'Pedro', email: 'a@x.com' });
  await ev(B, () => go('feed')); await esperar(B, () => PUB.on === true, null, 8000);
  const [pidA, pidB] = await ev(B, () => FEED.pautas.slice(0, 2).map(p => p.id));
  // sem rascunho: a caixa sugere a notícia e o toque junta essa notícia (controle)
  ok(await esperar(B, () => !!document.querySelector('#cn102-bar [data-fc107sug]'), null, 6000), 'sem rascunho: a caixa diz "O que você acha?"');
  const sug = await ev(B, () => document.querySelector('#cn102-bar [data-fc107sug]').dataset.fc107sug);
  await ev(B, () => document.querySelector('#cn102-bar [data-fc107sug]').click()); await sleep(600);
  ok(await ev(B, s => !!document.querySelector('#layer > .cp152') && CR155.pid === s, sug), 'controle: sem rascunho, a notícia sugerida entra');
  await ev(B, () => { cr155Limpa(); closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);

  // rascunho com a notícia A
  await ev(B, a => { localStorage.setItem(cr155K(), JSON.stringify({ tx: 'o que acho dos temporais', pid: a, at: Date.now() })) }, pidA);
  ok(await esperar(B, () => { const x = document.querySelector('#cn102-bar .fc107-rasc'); return x && /Continuar rascunho/.test(x.textContent) && /o que acho dos temporais/.test(x.textContent) }, null, 5000), 'com rascunho: a caixa diz "Continuar rascunho" e o começo do texto');
  ok(await ev(B, () => !document.querySelector('#cn102-bar [data-fc107sug]')), 'com rascunho: a caixa não oferece outra notícia');
  await ev(B, () => document.querySelector('#cn102-bar .fc107-rasc').click()); await sleep(600);
  ok(await ev(B, a => !!document.querySelector('#layer > .cp152') && document.querySelector('#cp152-tx').value === 'o que acho dos temporais' && CR155.pid === a, pidA), 'o toque abre o rascunho com a notícia guardada');
  await ev(B, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);
  await ev(B, a => { localStorage.setItem(cr155K(), JSON.stringify({ tx: 'o que acho dos temporais', pid: a, at: Date.now() })) }, pidA);
  // o caminho do "O que você acha?" com outra notícia: não troca
  await ev(B, bb => cp152Abre({ aba: 'post', pid: bb }), pidB); await sleep(500);
  ok(await ev(B, a => CR155.pid === a && document.querySelector('#cp152-tx').value === 'o que acho dos temporais' && !!document.querySelector('#layer .cr155-nt'), pidA), 'outra notícia pedida: o rascunho fica com a notícia dele');
  ok(await ev(B, () => /rascunho guardado voltou/i.test(document.body.innerText)), 'aviso de que o rascunho voltou como estava');
  await ev(B, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);
  // rascunho sem notícia: a notícia pedida não entra
  await ev(B, () => { localStorage.setItem(cr155K(), JSON.stringify({ tx: 'só um pensamento', pid: null, at: Date.now() })) });
  await ev(B, bb => cp152Abre({ aba: 'post', pid: bb }), pidB); await sleep(500);
  ok(await ev(B, () => CR155.pid === null && document.querySelector('#cp152-tx').value === 'só um pensamento' && !document.querySelector('#layer .cr155-nt')), 'rascunho sem notícia: continua sem notícia');
  await ev(B, () => { closeLayer._ok = true; closeLayer(); closeLayer._ok = false }); await sleep(300);
  // rascunho só com notícia (sem texto): a notícia pedida entra (nada a perder)
  await ev(B, a => { localStorage.setItem(cr155K(), JSON.stringify({ tx: '', pid: a, at: Date.now() })) }, pidA);
  await ev(B, bb => cp152Abre({ aba: 'post', pid: bb }), pidB); await sleep(500);
  ok(await ev(B, bb => CR155.pid === bb, pidB), 'sem texto guardado: a notícia pedida entra');
  await U.foto(B, 'corretor-2211-caixa');
  await b.close(); srv.kill();
  const R = U.resumo(); console.log(`\nRESUMO t_corretor_2211: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0)
})().catch(e => { console.log('ERRO', e); process.exit(1) });
